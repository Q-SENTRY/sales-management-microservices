package com.mediaflow.platform.instagram

import com.mediaflow.domain.model.LinkAnalysis
import com.mediaflow.domain.model.Platform
import com.mediaflow.domain.model.PlatformAction
import com.mediaflow.domain.util.UrlValidation
import com.mediaflow.platform.api.PlatformModule
import com.mediaflow.platform.api.hostMatches
import com.mediaflow.platform.api.legalAlternatives

/**
 * Instagram: no existe una API pública para descargar publicaciones de terceros y su
 * oEmbed requiere un token de aplicación de Meta. No se consultan metadatos ni se piden credenciales.
 */
class InstagramModule : PlatformModule {
    override val platform = Platform.INSTAGRAM
    override val tagline = "Reels y publicaciones"
    override val monogram = "IG"
    override val accentArgb = 0xFFE2559BL
    override val officialPackage = "com.instagram.android"
    override val homeUrl = "https://www.instagram.com/"

    override fun matches(host: String) = hostMatches(host, "instagram.com", "instagr.am")

    override fun officialGuide() = PlatformAction.OfficialDownloadGuide(
        title = "Descargar tu contenido de Instagram",
        summary = "Instagram permite descargar una copia de tu propio contenido desde el Centro de cuentas.",
        steps = listOf(
            "En Instagram, ve a Perfil › Menú › Centro de cuentas.",
            "Entra en «Tu información y permisos» › «Descargar tu información».",
            "Elige el formato y el rango de fechas; recibirás un aviso cuando esté lista.",
            "Importa los archivos descargados en MediaFlow.",
        ),
        helpUrl = "https://help.instagram.com",
    )

    override suspend fun analyze(url: UrlValidation.Valid) = LinkAnalysis(
        url = url.url,
        platform = platform,
        metadata = null,
        actions = legalAlternatives(this, url.url),
        notice = "Instagram no permite descargar publicaciones de otras cuentas. Puedes abrirla en la app oficial o guardar el enlace.",
    )
}
