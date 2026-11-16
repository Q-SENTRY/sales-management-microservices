package com.mediaflow.converter

import android.content.Context
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMetadataRetriever
import android.media.MediaMuxer
import android.net.Uri
import android.provider.OpenableColumns
import com.mediaflow.data.storage.OutputStorage
import com.mediaflow.domain.model.AudioQuality
import com.mediaflow.domain.model.ConversionFormat
import com.mediaflow.domain.model.MediaProbe
import com.mediaflow.domain.util.FileNames
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.io.File
import java.nio.ByteBuffer
import kotlin.coroutines.coroutineContext

data class ConversionRequest(
    val source: Uri,
    val probe: MediaProbe,
    val format: ConversionFormat,
    val quality: AudioQuality,
    val outputBaseName: String,
    val customFolderUri: String?,
)

data class ConversionOutput(val uri: Uri, val displayName: String, val sizeBytes: Long)

class ConversionException(message: String) : Exception(message)

/**
 * Codificador externo opcional (p. ej. un build de FFmpeg/LAME bajo LGPL distribuido
 * cumpliendo su licencia). Esta compilación no lo incluye, así que MP3 queda deshabilitado.
 */
interface ExternalEncoder {
    val format: ConversionFormat
    suspend fun encode(pcmWav: File, output: File, quality: AudioQuality)
}

/**
 * Conversión 100 % local con las APIs multimedia del sistema (MediaExtractor, MediaCodec
 * y MediaMuxer), sin enviar archivos a ningún servidor.
 *  - MP4: copia de pistas sin pérdida (remux).
 *  - WAV: decodificación a PCM 16 bits.
 *  - M4A / AAC: decodificación + codificación AAC-LC con la tasa elegida.
 */
class MediaConverter(
    private val context: Context,
    private val storage: OutputStorage,
    private val externalEncoders: List<ExternalEncoder> = emptyList(),
) {

    fun isAvailable(format: ConversionFormat): Boolean =
        format != ConversionFormat.MP3 || externalEncoders.any { it.format == ConversionFormat.MP3 }

    fun unavailableReason(format: ConversionFormat): String? =
        if (isAvailable(format)) null
        else "MP3 necesita el motor FFmpeg/LAME opcional, que no se incluye en esta compilación por motivos de licencia."

    suspend fun probe(uri: Uri): MediaProbe = withContext(Dispatchers.IO) {
        var name = "archivo"
        var size = -1L
        context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE), null, null, null)?.use { c ->
            if (c.moveToFirst()) {
                c.getString(0)?.let { name = it }
                if (!c.isNull(1)) size = c.getLong(1)
            }
        }
        val extractor = MediaExtractor()
        try {
            extractor.setDataSource(context, uri, null)
            var audio: MediaFormat? = null
            var video: MediaFormat? = null
            var durationUs = 0L
            for (i in 0 until extractor.trackCount) {
                val f = extractor.getTrackFormat(i)
                val mime = f.getString(MediaFormat.KEY_MIME) ?: continue
                if (mime.startsWith("audio/") && audio == null) audio = f
                if (mime.startsWith("video/") && video == null) video = f
                if (f.containsKey(MediaFormat.KEY_DURATION)) durationUs = maxOf(durationUs, f.getLong(MediaFormat.KEY_DURATION))
            }
            if (durationUs <= 0) {
                durationUs = runCatching {
                    MediaMetadataRetriever().use { r ->
                        r.setDataSource(context, uri)
                        (r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 0L) * 1000
                    }
                }.getOrDefault(0L)
            }
            MediaProbe(
                uri = uri.toString(),
                displayName = name,
                sizeBytes = size,
                durationMs = durationUs / 1000,
                hasVideo = video != null,
                hasAudio = audio != null,
                audioMime = audio?.getString(MediaFormat.KEY_MIME),
                videoMime = video?.getString(MediaFormat.KEY_MIME),
                sampleRate = audio?.getIntegerOrNull(MediaFormat.KEY_SAMPLE_RATE),
                channels = audio?.getIntegerOrNull(MediaFormat.KEY_CHANNEL_COUNT),
                width = video?.getIntegerOrNull(MediaFormat.KEY_WIDTH),
                height = video?.getIntegerOrNull(MediaFormat.KEY_HEIGHT),
            )
        } catch (e: Exception) {
            throw ConversionException("No se pudo leer el archivo: formato no compatible")
        } finally {
            extractor.release()
        }
    }

    suspend fun convert(request: ConversionRequest, onProgress: (Float) -> Unit): ConversionOutput = withContext(Dispatchers.IO) {
        val format = request.format
        if (!isAvailable(format)) throw ConversionException(unavailableReason(format)!!)
        if (format.audioOnly && !request.probe.hasAudio) throw ConversionException("El archivo no contiene pista de audio")
        val tmp = File(storage.workDir(), "conv_${System.nanoTime()}.${format.extension}")
        try {
            when (format) {
                ConversionFormat.MP4 -> remuxToMp4(request.source, tmp, request.probe.durationMs, onProgress)
                ConversionFormat.WAV -> decodeAudio(request.source, request.probe.durationMs, WavSink(tmp), onProgress)
                ConversionFormat.M4A -> decodeAudio(request.source, request.probe.durationMs, AacSink(tmp, request.quality.kbps, AacSink.Container.MP4), onProgress)
                ConversionFormat.AAC -> decodeAudio(request.source, request.probe.durationMs, AacSink(tmp, request.quality.kbps, AacSink.Container.ADTS), onProgress)
                ConversionFormat.MP3 -> {
                    val encoder = externalEncoders.first { it.format == ConversionFormat.MP3 }
                    val wav = File(storage.workDir(), "pcm_${System.nanoTime()}.wav")
                    try {
                        decodeAudio(request.source, request.probe.durationMs, WavSink(wav)) { onProgress(it * 0.5f) }
                        encoder.encode(wav, tmp, request.quality)
                    } finally { wav.delete() }
                }
            }
            onProgress(1f)
            val name = FileNames.sanitize(request.outputBaseName, "convertido") + "." + format.extension
            val uri = storage.save(tmp, name, format.mimeType, request.customFolderUri)
            ConversionOutput(uri, name, tmp.length())
        } finally {
            tmp.delete()
        }
    }

    // ---------------------------------------------------------------- MP4 remux

    private suspend fun remuxToMp4(source: Uri, out: File, durationMs: Long, onProgress: (Float) -> Unit) {
        val extractor = MediaExtractor()
        var muxer: MediaMuxer? = null
        try {
            extractor.setDataSource(context, source, null)
            val m = MediaMuxer(out.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
            muxer = m
            val map = HashMap<Int, Int>()
            var maxInput = 1 shl 20
            for (i in 0 until extractor.trackCount) {
                val f = extractor.getTrackFormat(i)
                val mime = f.getString(MediaFormat.KEY_MIME) ?: continue
                if (!mime.startsWith("audio/") && !mime.startsWith("video/")) continue
                val outIndex = runCatching { m.addTrack(f) }.getOrNull()
                    ?: throw ConversionException("El códec $mime no puede guardarse en MP4 sin recodificar")
                map[i] = outIndex
                extractor.selectTrack(i)
                if (f.containsKey(MediaFormat.KEY_MAX_INPUT_SIZE)) maxInput = maxOf(maxInput, f.getInteger(MediaFormat.KEY_MAX_INPUT_SIZE))
                if (mime.startsWith("video/") && f.containsKey(MediaFormat.KEY_ROTATION)) m.setOrientationHint(f.getInteger(MediaFormat.KEY_ROTATION))
            }
            if (map.isEmpty()) throw ConversionException("No hay pistas de audio o vídeo")
            m.start()
            val buffer = ByteBuffer.allocateDirect(maxInput)
            val info = MediaCodec.BufferInfo()
            val durationUs = durationMs * 1000
            while (true) {
                coroutineContext.ensureActive()
                val track = extractor.sampleTrackIndex
                if (track < 0) break
                val size = extractor.readSampleData(buffer, 0)
                if (size < 0) break
                info.set(0, size, extractor.sampleTime, toCodecFlags(extractor.sampleFlags))
                m.writeSampleData(map.getValue(track), buffer, info)
                if (durationUs > 0) onProgress((extractor.sampleTime.toFloat() / durationUs).coerceIn(0f, 0.99f))
                extractor.advance()
            }
            m.stop()
        } finally {
            runCatching { muxer?.release() }
            extractor.release()
        }
    }

    private fun toCodecFlags(extractorFlags: Int): Int {
        var flags = 0
        if (extractorFlags and MediaExtractor.SAMPLE_FLAG_SYNC != 0) flags = flags or MediaCodec.BUFFER_FLAG_KEY_FRAME
        return flags
    }

    // ---------------------------------------------------------------- audio decode

    private suspend fun decodeAudio(source: Uri, durationMs: Long, sink: PcmSink, onProgress: (Float) -> Unit) {
        val extractor = MediaExtractor()
        var decoder: MediaCodec? = null
        try {
            extractor.setDataSource(context, source, null)
            val track = (0 until extractor.trackCount).firstOrNull {
                extractor.getTrackFormat(it).getString(MediaFormat.KEY_MIME)?.startsWith("audio/") == true
            } ?: throw ConversionException("El archivo no contiene pista de audio")
            extractor.selectTrack(track)
            val inFormat = extractor.getTrackFormat(track)
            val mime = inFormat.getString(MediaFormat.KEY_MIME)!!
            val codec = runCatching { MediaCodec.createDecoderByType(mime) }.getOrElse {
                throw ConversionException("Este dispositivo no puede decodificar $mime")
            }
            decoder = codec
            codec.configure(inFormat, null, null, 0)
            codec.start()

            var pcm = PcmFormat(
                sampleRate = inFormat.getIntegerOrNull(MediaFormat.KEY_SAMPLE_RATE) ?: 44100,
                channels = inFormat.getIntegerOrNull(MediaFormat.KEY_CHANNEL_COUNT) ?: 2,
                float = false,
            )
            val info = MediaCodec.BufferInfo()
            var inputDone = false
            var sinkStarted = false
            val durationUs = durationMs * 1000
            while (true) {
                coroutineContext.ensureActive()
                if (!inputDone) {
                    val ii = codec.dequeueInputBuffer(10_000)
                    if (ii >= 0) {
                        val buf = codec.getInputBuffer(ii)!!
                        val size = extractor.readSampleData(buf, 0)
                        if (size < 0) {
                            codec.queueInputBuffer(ii, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                            inputDone = true
                        } else {
                            codec.queueInputBuffer(ii, 0, size, extractor.sampleTime, 0)
                            if (durationUs > 0) onProgress((extractor.sampleTime.toFloat() / durationUs).coerceIn(0f, 0.98f))
                            extractor.advance()
                        }
                    }
                }
                val oi = codec.dequeueOutputBuffer(info, 10_000)
                if (oi == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                    val f = codec.outputFormat
                    pcm = PcmFormat(
                        sampleRate = f.getIntegerOrNull(MediaFormat.KEY_SAMPLE_RATE) ?: pcm.sampleRate,
                        channels = f.getIntegerOrNull(MediaFormat.KEY_CHANNEL_COUNT) ?: pcm.channels,
                        float = f.getIntegerOrNull(MediaFormat.KEY_PCM_ENCODING) == android.media.AudioFormat.ENCODING_PCM_FLOAT,
                    )
                } else if (oi >= 0) {
                    if (info.size > 0) {
                        if (!sinkStarted) {
                            sink.start(pcm.outputSampleRate, pcm.outputChannels)
                            sinkStarted = true
                        }
                        val buf = codec.getOutputBuffer(oi)!!
                        buf.position(info.offset)
                        buf.limit(info.offset + info.size)
                        val bytes = PcmConverter.toPcm16(buf, pcm)
                        sink.write(bytes, bytes.size)
                    }
                    codec.releaseOutputBuffer(oi, false)
                    if (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) break
                }
            }
            if (!sinkStarted) throw ConversionException("No se obtuvo audio del archivo")
            sink.finish()
        } catch (e: Exception) {
            sink.abort()
            throw if (e is ConversionException || e is kotlinx.coroutines.CancellationException) e
            else ConversionException("Error al procesar el audio: ${e.message ?: e.javaClass.simpleName}")
        } finally {
            runCatching { decoder?.stop() }
            runCatching { decoder?.release() }
            extractor.release()
        }
    }
}

internal fun MediaFormat.getIntegerOrNull(key: String): Int? =
    if (containsKey(key)) runCatching { getInteger(key) }.getOrNull() else null
