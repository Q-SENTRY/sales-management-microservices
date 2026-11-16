package com.mediaflow.domain.model

enum class Platform(val displayName: String) {
    YOUTUBE("YouTube"),
    TIKTOK("TikTok"),
    INSTAGRAM("Instagram"),
    FACEBOOK("Facebook"),
    DIRECT("Enlace directo"),
    UNKNOWN("Enlace web"),
}

data class LinkMetadata(
    val title: String?,
    val author: String?,
    val thumbnailUrl: String?,
    /** Origen de los metadatos, p. ej. "oEmbed oficial de YouTube". */
    val source: String,
)

/**
 * Acciones que MediaFlow puede ofrecer para un enlace. Solo se generan acciones
 * que la plataforma permite oficialmente; nunca se fabrica una descarga.
 */
sealed interface PlatformAction {
    data class OpenInOfficialApp(
        val url: String,
        val packageName: String?,
        val appName: String,
    ) : PlatformAction

    data class OfficialDownloadGuide(
        val title: String,
        val summary: String,
        val steps: List<String>,
        val helpUrl: String?,
    ) : PlatformAction

    data object ImportAuthorizedFile : PlatformAction

    data class SaveToFavorites(val url: String) : PlatformAction

    /** Archivo servido públicamente por su origen mediante HTTPS (verificado con HEAD). */
    data class DirectDownload(
        val url: String,
        val suggestedFileName: String,
        val mimeType: String?,
        val sizeBytes: Long?,
        val supportsResume: Boolean,
    ) : PlatformAction
}

data class LinkAnalysis(
    val url: String,
    val platform: Platform,
    val metadata: LinkMetadata?,
    val actions: List<PlatformAction>,
    val notice: String,
) {
    val directDownload: PlatformAction.DirectDownload?
        get() = actions.filterIsInstance<PlatformAction.DirectDownload>().firstOrNull()
}

data class Favorite(
    val id: Long = 0,
    val url: String,
    val platform: Platform,
    val title: String?,
    val thumbnailUrl: String?,
    val createdAt: Long,
)
