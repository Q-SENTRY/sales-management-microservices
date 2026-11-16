package com.mediaflow.domain.util

import java.net.URI

sealed interface UrlValidation {
    data class Valid(val url: String, val host: String) : UrlValidation
    data class Invalid(val reason: String) : UrlValidation
}

/**
 * Valida enlaces antes de cualquier petición de red: solo HTTPS, sin credenciales
 * embebidas, sin hosts locales o privados y con longitud acotada.
 */
object UrlValidator {
    private const val MAX_LENGTH = 2048
    private val URL_REGEX = Regex("""https?://[^\s<>"'`]+""", RegexOption.IGNORE_CASE)
    private val BARE_DOMAIN = Regex("""^([a-z0-9-]+\.)+[a-z]{2,}(/\S*)?$""", RegexOption.IGNORE_CASE)

    fun extractUrl(text: String): String? {
        val trimmed = text.trim()
        URL_REGEX.find(trimmed)?.let { return it.value.trimEnd('.', ',', ')', ']', ';') }
        if (BARE_DOMAIN.matches(trimmed)) return "https://$trimmed"
        return null
    }

    fun validate(text: String): UrlValidation {
        if (text.isBlank()) return UrlValidation.Invalid("Introduce un enlace")
        val raw = extractUrl(text) ?: return UrlValidation.Invalid("No se encontró un enlace válido")
        if (raw.length > MAX_LENGTH) return UrlValidation.Invalid("El enlace es demasiado largo")
        val uri = try { URI(raw) } catch (e: Exception) {
            return UrlValidation.Invalid("El formato del enlace no es válido")
        }
        if (!uri.scheme.equals("https", ignoreCase = true)) {
            return UrlValidation.Invalid("Por seguridad solo se aceptan enlaces https://")
        }
        if (uri.rawUserInfo != null) return UrlValidation.Invalid("El enlace contiene credenciales y no se procesará")
        val host = uri.host?.lowercase() ?: return UrlValidation.Invalid("El enlace no tiene dominio")
        if (isLocalOrPrivate(host)) return UrlValidation.Invalid("No se permiten direcciones locales o privadas")
        if (uri.port != -1 && uri.port != 443) return UrlValidation.Invalid("Puerto no permitido")
        return UrlValidation.Valid(uri.toString(), host.removePrefix("www."))
    }

    private fun isLocalOrPrivate(host: String): Boolean {
        if (host == "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return true
        if (host.startsWith("[")) return true // IPv6 literal
        val parts = host.split('.')
        if (parts.size == 4 && parts.all { it.toIntOrNull() in 0..255 }) {
            val (a, b) = parts[0].toInt() to parts[1].toInt()
            return a == 10 || a == 127 || a == 0 || (a == 169 && b == 254) ||
                (a == 172 && b in 16..31) || (a == 192 && b == 168) || (a == 100 && b in 64..127)
        }
        return false
    }
}

object FileNames {
    private val ILLEGAL = Regex("""[\\/:*?"<>|\u0000-\u001F]""")
    fun sanitize(name: String, fallback: String = "archivo"): String {
        val cleaned = name.replace(ILLEGAL, "_").trim().trim('.').take(120)
        return cleaned.ifBlank { fallback }
    }
    fun extension(name: String): String? = name.substringAfterLast('.', "").lowercase().takeIf { it.isNotEmpty() && it.length <= 5 }
    fun withoutExtension(name: String): String = if (name.contains('.')) name.substringBeforeLast('.') else name
}
