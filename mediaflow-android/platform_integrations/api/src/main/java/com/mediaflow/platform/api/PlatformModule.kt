package com.mediaflow.platform.api

import com.mediaflow.domain.model.LinkAnalysis
import com.mediaflow.domain.model.LinkMetadata
import com.mediaflow.domain.model.Platform
import com.mediaflow.domain.model.PlatformAction
import com.mediaflow.domain.repository.LinkAnalyzer
import com.mediaflow.domain.util.UrlValidation
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

/**
 * Contrato de cada integración. Cada plataforma vive en su propio módulo Gradle y
 * solo expone acciones oficialmente permitidas por esa plataforma.
 */
interface PlatformModule {
    val platform: Platform
    val tagline: String
    val monogram: String
    val accentArgb: Long
    val officialPackage: String?
    val homeUrl: String
    fun matches(host: String): Boolean
    fun officialGuide(): PlatformAction.OfficialDownloadGuide
    suspend fun analyze(url: UrlValidation.Valid): LinkAnalysis
}

/** Registro de plataformas: elige el módulo por dominio y recurre al de enlaces directos. */
class PlatformRegistry(
    val modules: List<PlatformModule>,
    private val fallback: PlatformModule,
) : LinkAnalyzer {
    fun moduleFor(platform: Platform): PlatformModule? = modules.firstOrNull { it.platform == platform }
    override suspend fun analyze(url: UrlValidation.Valid): LinkAnalysis =
        (modules.firstOrNull { it.matches(url.host) } ?: fallback).analyze(url)
}

fun hostMatches(host: String, vararg domains: String) =
    domains.any { host == it || host.endsWith(".$it") }

/** Cliente mínimo para endpoints oEmbed públicos y oficiales. Sin cookies ni credenciales. */
object OEmbedClient {
    private const val MAX_BYTES = 64 * 1024

    suspend fun fetch(endpoint: String, url: String, source: String): LinkMetadata? = withContext(Dispatchers.IO) {
        runCatching {
            val full = "$endpoint?format=json&url=" + URLEncoder.encode(url, "UTF-8")
            val conn = (URL(full).openConnection() as HttpURLConnection).apply {
                connectTimeout = 8000
                readTimeout = 8000
                instanceFollowRedirects = true
                setRequestProperty("Accept", "application/json")
                setRequestProperty("User-Agent", "MediaFlow/1.0 (Android)")
            }
            try {
                if (conn.responseCode !in 200..299) return@runCatching null
                val body = conn.inputStream.use { stream ->
                    val bytes = stream.readNBytesCompat(MAX_BYTES)
                    String(bytes, Charsets.UTF_8)
                }
                val json = JSONObject(body)
                LinkMetadata(
                    title = json.optString("title").takeIf { it.isNotBlank() },
                    author = json.optString("author_name").takeIf { it.isNotBlank() },
                    thumbnailUrl = json.optString("thumbnail_url").takeIf { it.startsWith("https://") },
                    source = source,
                )
            } finally {
                conn.disconnect()
            }
        }.getOrNull()
    }

    private fun java.io.InputStream.readNBytesCompat(max: Int): ByteArray {
        val out = java.io.ByteArrayOutputStream()
        val buf = ByteArray(8192)
        var total = 0
        while (total < max) {
            val n = read(buf, 0, minOf(buf.size, max - total))
            if (n < 0) break
            out.write(buf, 0, n); total += n
        }
        return out.toByteArray()
    }
}

/** Acciones comunes cuando la plataforma no permite descarga directa. */
fun legalAlternatives(module: PlatformModule, url: String): List<PlatformAction> = listOf(
    PlatformAction.OpenInOfficialApp(url, module.officialPackage, module.platform.displayName),
    module.officialGuide(),
    PlatformAction.ImportAuthorizedFile,
    PlatformAction.SaveToFavorites(url),
)
