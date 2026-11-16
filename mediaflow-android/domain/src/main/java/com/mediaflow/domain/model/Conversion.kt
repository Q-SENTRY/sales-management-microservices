package com.mediaflow.domain.model

enum class ConversionFormat(
    val label: String,
    val extension: String,
    val mimeType: String,
    val audioOnly: Boolean,
    val description: String,
) {
    MP4("MP4", "mp4", "video/mp4", false, "Copia sin pérdida al contenedor MP4"),
    MP3("MP3", "mp3", "audio/mpeg", true, "Requiere el motor FFmpeg opcional"),
    M4A("M4A", "m4a", "audio/mp4", true, "AAC en contenedor MP4, ideal para música"),
    WAV("WAV", "wav", "audio/wav", true, "PCM sin compresión, máxima fidelidad"),
    AAC("AAC", "aac", "audio/aac", true, "Flujo AAC (ADTS) ligero"),
}

enum class AudioQuality(val kbps: Int, val label: String) {
    LOW(96, "96 kbps"),
    STANDARD(128, "128 kbps"),
    HIGH(192, "192 kbps"),
    VERY_HIGH(256, "256 kbps"),
    MAX(320, "320 kbps"),
}

data class MediaProbe(
    val uri: String,
    val displayName: String,
    val sizeBytes: Long,
    val durationMs: Long,
    val hasVideo: Boolean,
    val hasAudio: Boolean,
    val audioMime: String?,
    val videoMime: String?,
    val sampleRate: Int?,
    val channels: Int?,
    val width: Int?,
    val height: Int?,
)

object SizeEstimator {
    /** Estimación basada en duración real y tasa de bits objetivo. */
    fun estimateBytes(probe: MediaProbe, format: ConversionFormat, quality: AudioQuality): Long? {
        if (probe.durationMs <= 0) return null
        val seconds = probe.durationMs / 1000.0
        return when (format) {
            ConversionFormat.MP4 -> probe.sizeBytes
            ConversionFormat.WAV -> {
                val rate = probe.sampleRate ?: return null
                val ch = (probe.channels ?: 2).coerceAtMost(2)
                (seconds * rate * ch * 2 + 44).toLong()
            }
            ConversionFormat.M4A, ConversionFormat.AAC, ConversionFormat.MP3 ->
                (seconds * quality.kbps * 1000 / 8 * 1.02).toLong()
        }
    }
}

enum class ConversionStatus { RUNNING, COMPLETED, FAILED, CANCELLED }

data class ConversionRecord(
    val id: Long = 0,
    val sourceName: String,
    val outputName: String,
    val outputUri: String?,
    val format: ConversionFormat,
    val qualityKbps: Int?,
    val status: ConversionStatus,
    val errorMessage: String?,
    val createdAt: Long,
)
