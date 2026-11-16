package com.mediaflow.platform.youtube

import com.mediaflow.domain.model.LinkAnalysis
import com.mediaflow.domain.model.Platform
import com.mediaflow.domain.model.PlatformAction
import com.mediaflow.domain.util.UrlValidation
import com.mediaflow.platform.api.OEmbedClient
import com.mediaflow.platform.api.PlatformModule
import com.mediaflow.platform.api.hostMatches
import com.mediaflow.platform.api.legalAlternatives

/**
 * YouTube: los Términos del Servicio no permiten descargar contenido fuera de las
 * funciones oficiales. Usamos el endpoint oEmbed público para mostrar título y autor,
 * y redirigimos a las opciones oficiales (descargas en la app / YouTube Studio).
 */
class YouTubeModule : PlatformModule {
    override val platform = Platform.YOUTUBE
    override val tagline = "Vídeos y música"
    override val monogram = "YT"
    override val accentArgb = 0xFFFF4D5EL
    override val officialPackage = "com.google.android.youtube"
    override val homeUrl = "https://www.youtube.com/"

    override fun matches(host: String) = hostMatches(host, "youtube.com", "youtu.be", "youtube-nocookie.com")

    override fun officialGuide() = PlatformAction.OfficialDownloadGuide(
        title = "Descargas oficiales de YouTube",
        summary = "YouTube ofrece descargas sin conexión dentro de su propia aplicación, según tu país y suscripción.",
        steps = listOf(
            "Abre el vídeo en la app oficial de YouTube.",
            "Toca «Descargar» bajo el reproductor si la opción está disponible.",
            "El vídeo quedará disponible en «Tú › Descargas» dentro de YouTube.",
            "¿Es tu propio vídeo? Descárgalo desde YouTube Studio › Contenido › Opciones › Descargar e impórtalo en MediaFlow.",
        ),
        helpUrl = "https://support.google.com/youtube",
    )

    override suspend fun analyze(url: UrlValidation.Valid): LinkAnalysis {
        val meta = OEmbedClient.fetch("https://www.youtube.com/oembed", url.url, "oEmbed oficial de YouTube")
        return LinkAnalysis(
            url = url.url,
            platform = platform,
            metadata = meta,
            actions = legalAlternatives(this, url.url),
            notice = "YouTube no permite descargar este contenido desde aplicaciones de terceros. " +
                "Usa las opciones oficiales o importa un archivo del que tengas derechos.",
        )
    }
}
