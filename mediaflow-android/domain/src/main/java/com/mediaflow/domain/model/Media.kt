package com.mediaflow.domain.model

enum class MediaKind { VIDEO, AUDIO, IMAGE, DOCUMENT, OTHER;
    companion object {
        fun fromMime(mime: String?): MediaKind = when {
            mime == null -> OTHER
            mime.startsWith("video/") -> VIDEO
            mime.startsWith("audio/") -> AUDIO
            mime.startsWith("image/") -> IMAGE
            mime.startsWith("text/") || mime.startsWith("application/pdf") ||
                mime.contains("document") || mime.contains("sheet") || mime.contains("presentation") -> DOCUMENT
            else -> OTHER
        }
    }
}

data class LibraryItem(
    val uri: String,
    val name: String,
    val mimeType: String?,
    val kind: MediaKind,
    val sizeBytes: Long,
    val dateModifiedMillis: Long,
    val durationMs: Long? = null,
    val width: Int? = null,
    val height: Int? = null,
    val artist: String? = null,
    val album: String? = null,
    val folder: String? = null,
    /** true si fue creado por MediaFlow (se puede modificar sin consentimiento extra). */
    val ownedByApp: Boolean = false,
    /** true si procede de la carpeta elegida con Storage Access Framework. */
    val fromDocumentTree: Boolean = false,
) {
    val resolution: String? get() = if (width != null && height != null && width > 0 && height > 0) "${width}×$height" else null
}

enum class LibrarySort(val label: String, val premium: Boolean) {
    DATE_DESC("Más recientes", false),
    DATE_ASC("Más antiguos", false),
    NAME("Nombre", false),
    SIZE_DESC("Tamaño", true),
    DURATION_DESC("Duración", true),
}

fun List<LibraryItem>.sortedBy(sort: LibrarySort): List<LibraryItem> = when (sort) {
    LibrarySort.DATE_DESC -> sortedByDescending { it.dateModifiedMillis }
    LibrarySort.DATE_ASC -> sortedBy { it.dateModifiedMillis }
    LibrarySort.NAME -> sortedBy { it.name.lowercase() }
    LibrarySort.SIZE_DESC -> sortedByDescending { it.sizeBytes }
    LibrarySort.DURATION_DESC -> sortedByDescending { it.durationMs ?: 0 }
}

data class PlayableItem(
    val uri: String,
    val title: String,
    val subtitle: String?,
    val isVideo: Boolean,
)
