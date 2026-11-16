package com.mediaflow.domain.model

enum class Tier { FREE, PREMIUM }

enum class PremiumFeature(val title: String, val description: String) {
    ADVANCED_CONVERSION("Conversión avanzada", "AAC, calidad hasta 320 kbps y archivos de cualquier duración"),
    ADVANCED_ORGANIZATION("Organización avanzada", "Ordenar por tamaño y duración, filtros por carpeta"),
    PLAYER_TOOLS("Herramientas de reproducción", "Temporizador de apagado y velocidades extendidas"),
    AD_FREE("Sin publicidad", "Experiencia limpia, sin anuncios"),
}

/** Reglas de la versión gratuita frente a Premium, en un único lugar. */
object FeatureGate {
    const val FREE_MAX_CONVERSION_MS = 15 * 60 * 1000L
    val FREE_MAX_QUALITY = AudioQuality.STANDARD
    val FREE_FORMATS = setOf(ConversionFormat.MP4, ConversionFormat.M4A, ConversionFormat.WAV)

    fun canUseFormat(tier: Tier, format: ConversionFormat) = tier == Tier.PREMIUM || format in FREE_FORMATS
    fun canUseQuality(tier: Tier, quality: AudioQuality) = tier == Tier.PREMIUM || quality.kbps <= FREE_MAX_QUALITY.kbps
    fun canConvertDuration(tier: Tier, durationMs: Long) = tier == Tier.PREMIUM || durationMs <= FREE_MAX_CONVERSION_MS
    fun canUseSort(tier: Tier, sort: LibrarySort) = tier == Tier.PREMIUM || !sort.premium
    fun has(tier: Tier, @Suppress("UNUSED_PARAMETER") feature: PremiumFeature) = tier == Tier.PREMIUM
}
