package com.mediaflow.platform.facebook

import com.mediaflow.domain.model.LinkAnalysis
import com.mediaflow.domain.model.Platform
import com.mediaflow.domain.model.PlatformAction
import com.mediaflow.domain.util.UrlValidation
import com.mediaflow.platform.api.PlatformModule
import com.mediaflow.platform.api.hostMatches
import com.mediaflow.platform.api.legalAlternatives

/** Facebook: solo opciones oficiales (tus propios vídeos y "Descargar tu información"). */
class FacebookModule : PlatformModule {
    override val platform = Platform.FACEBOOK
    override val tagline = "Vídeos y Reels"
    override val monogram = "FB"
    override val accentArgb = 0xFF238BFFL
    override val officialPackage = "com.facebook.katana"
    override val homeUrl = "https://www.facebook.com/"

    override fun matches(host: String) = hostMatches(host, "facebook.com", "fb.watch", "fb.com")

    override fun officialGuide() = PlatformAction.OfficialDownloadGuide(
        title = "Descargar tus vídeos de Facebook",
        summary = "Facebook permite descargar los vídeos que tú has subido y una copia de tu información.",
        steps = listOf(
            "Abre el vídeo que publicaste en la app o web oficial.",
            "Toca «⋯» y selecciona «Descargar vídeo» si la opción está disponible.",
            "Alternativa: Centro de cuentas › «Descargar tu información».",
            "Importa el archivo en MediaFlow para organizarlo y reproducirlo.",
        ),
        helpUrl = "https://www.facebook.com/help",
    )

    override suspend fun analyze(url: UrlValidation.Valid) = LinkAnalysis(
        url = url.url,
        platform = platform,
        metadata = null,
        actions = legalAlternatives(this, url.url),
        notice = "Facebook no permite descargar vídeos de otras personas desde aplicaciones de terceros.",
    )
}
