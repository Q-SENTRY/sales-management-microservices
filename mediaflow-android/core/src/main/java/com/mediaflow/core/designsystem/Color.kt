package com.mediaflow.core.designsystem

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

object MfColors {
    val Ink = Color(0xFF10121B)
    val Surface = Color(0xFF1B2030)
    val SurfaceHigh = Color(0xFF242B3F)
    val Line = Color(0xFF2C344B)
    val Violet = Color(0xFF7957FF)
    val Azure = Color(0xFF238BFF)
    val Cyan = Color(0xFF20D6D2)
    val White = Color(0xFFFFFFFF)
    val Mist = Color(0xFF9BA3B5)

    val Success = Color(0xFF2FD08A)
    val Warning = Color(0xFFFFB547)
    val Danger = Color(0xFFFF5D73)

    // Claro
    val Paper = Color(0xFFF4F5FA)
    val PaperSurface = Color(0xFFFFFFFF)
    val PaperHigh = Color(0xFFEBEDF5)
    val PaperLine = Color(0xFFDADEEA)
    val Graphite = Color(0xFF586074)
    val VioletDeep = Color(0xFF5F3EF0)
    val AzureDeep = Color(0xFF1872DB)
    val CyanDeep = Color(0xFF0B9E9B)

    val brand: Brush get() = Brush.linearGradient(listOf(Violet, Azure, Cyan))
    val brandHorizontal: Brush get() = Brush.horizontalGradient(listOf(Violet, Azure, Cyan))
}
