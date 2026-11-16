package com.mediaflow.converter

import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaMuxer
import java.io.BufferedOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import java.nio.ByteOrder

internal data class PcmFormat(val sampleRate: Int, val channels: Int, val float: Boolean) {
    /** Las frecuencias > 48 kHz se reducen a la mitad para compatibilidad con AAC. */
    val decimation: Int get() = if (sampleRate > 48_000) 2 else 1
    val outputSampleRate: Int get() = sampleRate / decimation
    val outputChannels: Int get() = channels.coerceIn(1, 2)
}

internal object PcmConverter {
    /** Convierte la salida del decodificador a PCM 16 bits little-endian, máx. estéreo. */
    fun toPcm16(buffer: ByteBuffer, f: PcmFormat): ByteArray {
        val src = buffer.slice().order(ByteOrder.nativeOrder())
        val inCh = f.channels.coerceAtLeast(1)
        val outCh = f.outputChannels
        val step = f.decimation
        val frames = if (f.float) src.remaining() / 4 / inCh else src.remaining() / 2 / inCh
        val outFrames = (frames + step - 1) / step
        val out = ByteBuffer.allocate(outFrames * outCh * 2).order(ByteOrder.LITTLE_ENDIAN)
        if (f.float) {
            val fb = src.asFloatBuffer()
            var frame = 0
            while (frame < frames) {
                for (c in 0 until outCh) {
                    val v = (fb.get(frame * inCh + c).coerceIn(-1f, 1f) * 32767f).toInt()
                    out.putShort(v.toShort())
                }
                frame += step
            }
        } else {
            val sb = src.asShortBuffer()
            var frame = 0
            while (frame < frames) {
                for (c in 0 until outCh) out.putShort(sb.get(frame * inCh + c))
                frame += step
            }
        }
        return out.array()
    }
}

internal interface PcmSink {
    fun start(sampleRate: Int, channels: Int)
    fun write(data: ByteArray, length: Int)
    fun finish()
    fun abort()
}

internal class WavSink(private val file: File) : PcmSink {
    private var raf: RandomAccessFile? = null
    private var dataBytes = 0L
    private var rate = 44100
    private var ch = 2

    override fun start(sampleRate: Int, channels: Int) {
        rate = sampleRate; ch = channels
        raf = RandomAccessFile(file, "rw").apply { setLength(0); write(ByteArray(44)) }
    }

    override fun write(data: ByteArray, length: Int) {
        raf!!.write(data, 0, length); dataBytes += length
    }

    override fun finish() {
        val r = raf ?: return
        val h = ByteBuffer.allocate(44).order(ByteOrder.LITTLE_ENDIAN)
        h.put("RIFF".toByteArray()); h.putInt((36 + dataBytes).toInt()); h.put("WAVE".toByteArray())
        h.put("fmt ".toByteArray()); h.putInt(16); h.putShort(1); h.putShort(ch.toShort()); h.putInt(rate)
        h.putInt(rate * ch * 2); h.putShort((ch * 2).toShort()); h.putShort(16)
        h.put("data".toByteArray()); h.putInt(dataBytes.toInt())
        r.seek(0); r.write(h.array()); r.close(); raf = null
    }

    override fun abort() { runCatching { raf?.close() }; raf = null; file.delete() }
}

internal class AacSink(private val file: File, private val kbps: Int, private val container: Container) : PcmSink {
    enum class Container { MP4, ADTS }

    private lateinit var codec: MediaCodec
    private var muxer: MediaMuxer? = null
    private var adts: BufferedOutputStream? = null
    private var track = -1
    private var muxerStarted = false
    private var framesQueued = 0L
    private var rate = 44100
    private var ch = 2
    private val info = MediaCodec.BufferInfo()

    override fun start(sampleRate: Int, channels: Int) {
        rate = sampleRate; ch = channels
        val fmt = MediaFormat.createAudioFormat(MediaFormat.MIMETYPE_AUDIO_AAC, sampleRate, channels).apply {
            setInteger(MediaFormat.KEY_AAC_PROFILE, MediaCodecInfo.CodecProfileLevel.AACObjectLC)
            setInteger(MediaFormat.KEY_BIT_RATE, kbps * 1000)
            setInteger(MediaFormat.KEY_MAX_INPUT_SIZE, 64 * 1024)
        }
        codec = runCatching { MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_AUDIO_AAC) }
            .getOrElse { throw ConversionException("Este dispositivo no dispone de codificador AAC") }
        try {
            codec.configure(fmt, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
        } catch (e: Exception) {
            throw ConversionException("El codificador AAC no admite ${sampleRate} Hz / $channels canales")
        }
        codec.start()
        when (container) {
            Container.MP4 -> muxer = MediaMuxer(file.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
            Container.ADTS -> adts = BufferedOutputStream(FileOutputStream(file), 64 * 1024)
        }
    }

    override fun write(data: ByteArray, length: Int) {
        var offset = 0
        while (offset < length) {
            val ii = codec.dequeueInputBuffer(10_000)
            if (ii >= 0) {
                val buf = codec.getInputBuffer(ii)!!
                buf.clear()
                val n = minOf(buf.remaining(), length - offset) / (2 * ch) * (2 * ch)
                buf.put(data, offset, n)
                codec.queueInputBuffer(ii, 0, n, framesQueued * 1_000_000L / rate, 0)
                framesQueued += n / (2 * ch)
                offset += n
            }
            drain(false)
        }
    }

    override fun finish() {
        var queued = false
        var guard = 0
        while (!queued && guard++ < 1000) {
            val ii = codec.dequeueInputBuffer(10_000)
            if (ii >= 0) {
                codec.queueInputBuffer(ii, 0, 0, framesQueued * 1_000_000L / rate, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                queued = true
            } else drain(false)
        }
        drain(true)
        codec.stop(); codec.release()
        muxer?.let { if (muxerStarted) it.stop(); it.release() }
        adts?.close()
    }

    override fun abort() {
        runCatching { codec.release() }
        runCatching { muxer?.release() }
        runCatching { adts?.close() }
        file.delete()
    }

    private fun drain(untilEos: Boolean) {
        var idle = 0
        while (true) {
            val oi = codec.dequeueOutputBuffer(info, if (untilEos) 10_000 else 0)
            when {
                oi == MediaCodec.INFO_TRY_AGAIN_LATER -> {
                    if (!untilEos || ++idle > 500) return
                }
                oi == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                    muxer?.let { track = it.addTrack(codec.outputFormat); it.start(); muxerStarted = true }
                }
                oi >= 0 -> {
                    val buf = codec.getOutputBuffer(oi)!!
                    val isConfig = info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG != 0
                    if (!isConfig && info.size > 0) {
                        buf.position(info.offset); buf.limit(info.offset + info.size)
                        val m = muxer
                        if (m != null && muxerStarted) {
                            m.writeSampleData(track, buf, info)
                        } else adts?.let { out ->
                            out.write(adtsHeader(info.size + 7))
                            val bytes = ByteArray(info.size); buf.get(bytes); out.write(bytes)
                        }
                    }
                    codec.releaseOutputBuffer(oi, false)
                    if (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) return
                }
            }
        }
    }

    private fun adtsHeader(packetLen: Int): ByteArray {
        val freqIdx = SAMPLE_RATES.indexOf(rate).let { if (it < 0) 4 else it }
        val profile = 2 // AAC LC
        return byteArrayOf(
            0xFF.toByte(), 0xF1.toByte(),
            (((profile - 1) shl 6) or (freqIdx shl 2) or (ch shr 2)).toByte(),
            (((ch and 3) shl 6) or (packetLen shr 11)).toByte(),
            ((packetLen and 0x7FF) shr 3).toByte(),
            (((packetLen and 7) shl 5) or 0x1F).toByte(),
            0xFC.toByte(),
        )
    }

    private companion object {
        val SAMPLE_RATES = intArrayOf(96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350)
    }
}
