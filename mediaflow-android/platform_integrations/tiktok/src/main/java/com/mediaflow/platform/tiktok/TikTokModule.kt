package com.mediaflow.platform.tiktok

import com.mediaflow.domain.model.LinkAnalysis
import com.mediaflow.domain.model.Platform
import com.mediaflow.domain.model.PlatformAction
import com.mediaflow.domain.util.UrlValidation
import com.mediaflow.platform.api.OEmbedClient
import com.mediaflow.platform.api.PlatformModule
import com.mediaflow.platform.api.hostMatches
import com.mediaflow.platform.api.legalAlternatives

/** TikTok: oEmbed oficial para metadatos; la descarga depende del permiso del creador en la app oficial. */
class TikTokModule : PlatformModule {
    override val platform = Platform.TIKTOK
    override val tagline = "Vídeos cortos"
    override val monogram = "TT"
    override val accentArgb = 0xFF20D6D2L
    override val officialPackage = "com.zhiliaoapp.musically"
    override val homeUrl = "https://www.tiktok.com/"

    override fun matches(host: String) = hostMatches(host, "tiktok.com")

    override fun officialGuide() = PlatformAction.OfficialDownloadGuide(
        title = "Guardar vídeos en TikTok",
        summary = "TikTok permite guardar un vídeo solo si su creador ha activado las descargas.",
        steps = listOf(
            "Abre el vídeo en la app oficial de TikTok.",
            "Toca «Compartir».",
            "Elige «Guardar vídeo» si aparece (el creador lo permite).",
            "Después importa el archivo guardado en MediaFlow para organizarlo.",
        ),
        helpUrl = "https://support.tiktok.com",
    )

    override suspend fun analyze(url: UrlValidation.Valid): LinkAnalysis {
        val meta = OEmbedClient.fetch("https://www.tiktok.com/oembed", url.url, "oEmbed oficial de TikTok")
        return LinkAnalysis(
            url = url.url,
            platform = platform,
            metadata = meta,
            actions = legalAlternatives(this, url.url),
            notice = "Las descargas de TikTok se realizan desde su app oficial y solo cuando el creador lo autoriza.",
        )
    }
}
