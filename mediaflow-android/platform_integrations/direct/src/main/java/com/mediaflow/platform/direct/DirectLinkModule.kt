package com.mediaflow.platform.direct

import com.mediaflow.domain.model.LinkAnalysis
import com.mediaflow.domain.model.LinkMetadata
import com.mediaflow.domain.model.Platform
import com.mediaflow.domain.model.PlatformAction
import com.mediaflow.domain.util.FileNames
import com.mediaflow.domain.util.UrlValidation
import com.mediaflow.platform.api.PlatformModule
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL
import java.net.URLDecoder

/**
 * Enlaces de descarga directos: archivos que su servidor entrega públicamente por HTTPS
 * (p. ej. un MP3 de un podcast o un vídeo con licencia libre). Se verifica con una
 * petición HEAD real; si el enlace es una página web, no se ofrece descarga.
 */
class DirectLinkModule : PlatformModule {
    override val platform = Platform.DIRECT
    override val tagline = "Archivos públicos"
    override val monogram = "↓"
    override val accentArgb = 0xFF7957FFL
    override val officialPackage: String? = null
    override val homeUrl = ""

    private val allowedPrefixes = listOf("video/", "audio/", "image/")
    private val allowedExact = setOf(
        "application/pdf", "application/zip", "application/ogg", "application/epub+zip",
    )

    override fun matches(host: String) = true

    override fun officialGuide() = PlatformAction.OfficialDownloadGuide(
        title = "Enlaces directos",
        summary = "MediaFlow descarga archivos que su origen sirve públicamente. Descarga solo contenido del que tengas derechos.",
        steps = listOf("Pega un enlace https que apunte a un archivo (.mp4, .mp3, .pdf…).", "MediaFlow verifica tipo y tamaño antes de descargar."),
        helpUrl = null,
    )

    override suspend fun analyze(url: UrlValidation.Valid): LinkAnalysis = withContext(Dispatchers.IO) {
        val head = runCatching { probe(url.url) }.getOrNull()
        val generic = listOf(
            PlatformAction.OpenInOfficialApp(url.url, null, "el navegador"),
            PlatformAction.ImportAuthorizedFile,
            PlatformAction.SaveToFavorites(url.url),
        )
        when {
            head == null -> LinkAnalysis(url.url, Platform.UNKNOWN, null, generic,
                "No se pudo contactar con el servidor. Comprueba tu conexión o el enlace.")
            head.code == 401 || head.code == 403 -> LinkAnalysis(url.url, Platform.UNKNOWN, null, generic,
                "El servidor exige autorización para este archivo. MediaFlow no evita restricciones de acceso.")
            head.code !in 200..299 -> LinkAnalysis(url.url, Platform.UNKNOWN, null, generic,
                "El servidor respondió con el código ${head.code}.")
            !isDownloadable(head.mime) -> LinkAnalysis(url.url, Platform.UNKNOWN,
                LinkMetadata(title = url.host, author = null, thumbnailUrl = null, source = "Página web"), generic,
                "Este enlace es una página web, no un archivo descargable.")
            else -> {
                val name = head.fileName ?: fileNameFromUrl(url.url, head.mime)
                LinkAnalysis(
                    url = head.finalUrl,
                    platform = Platform.DIRECT,
                    metadata = LinkMetadata(name, url.host, null, "Cabeceras HTTP del servidor"),
                    actions = listOf(
                        PlatformAction.DirectDownload(head.finalUrl, name, head.mime, head.length, head.acceptsRanges),
                        PlatformAction.SaveToFavorites(url.url),
                    ),
                    notice = "Archivo público verificado. Descarga solo contenido del que tengas derechos de uso.",
                )
            }
        }
    }

    private fun isDownloadable(mime: String?): Boolean {
        val m = mime?.substringBefore(';')?.trim()?.lowercase() ?: return false
        if (m.contains("mpegurl") || m.contains("dash+xml")) return false
        return allowedPrefixes.any { m.startsWith(it) } || m in allowedExact
    }

    private data class Head(val code: Int, val mime: String?, val length: Long?, val acceptsRanges: Boolean, val fileName: String?, val finalUrl: String)

    private fun probe(url: String): Head {
        var current = url
        repeat(5) {
            val conn = (URL(current).openConnection() as HttpURLConnection).apply {
                requestMethod = "HEAD"
                instanceFollowRedirects = false
                connectTimeout = 10000
                readTimeout = 10000
                setRequestProperty("User-Agent", "MediaFlow/1.0 (Android)")
            }
            try {
                val code = conn.responseCode
                if (code in 300..399) {
                    val loc = conn.getHeaderField("Location") ?: return Head(code, null, null, false, null, current)
                    val next = URI(current).resolve(loc).toString()
                    if (!next.startsWith("https://")) return Head(403, null, null, false, null, current)
                    current = next
                    return@repeat
                }
                val mime = conn.contentType?.substringBefore(';')?.trim()
                val length = conn.getHeaderField("Content-Length")?.toLongOrNull()?.takeIf { it > 0 }
                val ranges = conn.getHeaderField("Accept-Ranges")?.contains("bytes", true) == true
                val disposition = conn.getHeaderField("Content-Disposition")
                return Head(code, mime, length, ranges, parseDisposition(disposition), current)
            } finally {
                conn.disconnect()
            }
        }
        return Head(310, null, null, false, null, current)
    }

    private fun parseDisposition(value: String?): String? {
        if (value == null) return null
        Regex("""filename\*=UTF-8''([^;]+)""", RegexOption.IGNORE_CASE).find(value)?.let {
            return runCatching { URLDecoder.decode(it.groupValues[1], "UTF-8") }.getOrNull()?.let(FileNames::sanitize)
        }
        Regex("""filename="?([^";]+)"?""", RegexOption.IGNORE_CASE).find(value)?.let { return FileNames.sanitize(it.groupValues[1]) }
        return null
    }

    private fun fileNameFromUrl(url: String, mime: String?): String {
        val last = runCatching { URLDecoder.decode(URI(url).path.substringAfterLast('/'), "UTF-8") }.getOrNull().orEmpty()
        val base = FileNames.sanitize(last, "descarga")
        if (FileNames.extension(base) != null) return base
        val ext = when (mime?.lowercase()) {
            "video/mp4" -> "mp4"; "audio/mpeg" -> "mp3"; "audio/mp4" -> "m4a"; "audio/aac" -> "aac"
            "audio/wav", "audio/x-wav" -> "wav"; "application/pdf" -> "pdf"; "image/jpeg" -> "jpg"; "image/png" -> "png"
            "video/webm" -> "webm"; "audio/ogg", "application/ogg" -> "ogg"
            else -> null
        }
        return if (ext != null) "$base.$ext" else base
    }
}
