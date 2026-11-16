package com.mediaflow.core.designsystem

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.mediaflow.domain.model.ThemeMode

private val DarkScheme = darkColorScheme(
    primary = MfColors.Violet,
    onPrimary = MfColors.White,
    primaryContainer = Color(0xFF2D2363),
    onPrimaryContainer = Color(0xFFE3DBFF),
    secondary = MfColors.Azure,
    onSecondary = MfColors.White,
    secondaryContainer = Color(0xFF13325A),
    onSecondaryContainer = Color(0xFFD3E5FF),
    tertiary = MfColors.Cyan,
    onTertiary = MfColors.Ink,
    tertiaryContainer = Color(0xFF0E3F45),
    onTertiaryContainer = Color(0xFFBFF6F3),
    background = MfColors.Ink,
    onBackground = MfColors.White,
    surface = MfColors.Ink,
    onSurface = MfColors.White,
    surfaceVariant = MfColors.SurfaceHigh,
    onSurfaceVariant = MfColors.Mist,
    surfaceContainerLowest = Color(0xFF0C0E15),
    surfaceContainerLow = Color(0xFF161A27),
    surfaceContainer = MfColors.Surface,
    surfaceContainerHigh = MfColors.SurfaceHigh,
    surfaceContainerHighest = Color(0xFF2C3449),
    outline = MfColors.Line,
    outlineVariant = Color(0xFF222839),
    error = MfColors.Danger,
    onError = MfColors.White,
    inverseSurface = MfColors.White,
    inverseOnSurface = MfColors.Ink,
)

private val LightScheme = lightColorScheme(
    primary = MfColors.VioletDeep,
    onPrimary = MfColors.White,
    primaryContainer = Color(0xFFE6DFFF),
    onPrimaryContainer = Color(0xFF22126B),
    secondary = MfColors.AzureDeep,
    onSecondary = MfColors.White,
    secondaryContainer = Color(0xFFD9E9FF),
    onSecondaryContainer = Color(0xFF0A2C57),
    tertiary = MfColors.CyanDeep,
    onTertiary = MfColors.White,
    tertiaryContainer = Color(0xFFC9F3F1),
    onTertiaryContainer = Color(0xFF053B3A),
    background = MfColors.Paper,
    onBackground = MfColors.Ink,
    surface = MfColors.Paper,
    onSurface = MfColors.Ink,
    surfaceVariant = MfColors.PaperHigh,
    onSurfaceVariant = MfColors.Graphite,
    surfaceContainerLowest = MfColors.White,
    surfaceContainerLow = Color(0xFFF9FAFD),
    surfaceContainer = MfColors.PaperSurface,
    surfaceContainerHigh = MfColors.PaperHigh,
    surfaceContainerHighest = Color(0xFFE2E5EF),
    outline = MfColors.PaperLine,
    outlineVariant = Color(0xFFE6E9F2),
    error = Color(0xFFD93A52),
    onError = MfColors.White,
    inverseSurface = MfColors.Ink,
    inverseOnSurface = MfColors.White,
)

@Immutable
data class MfExtendedColors(
    val success: Color,
    val warning: Color,
    val danger: Color,
    val cardBorder: Color,
    val isDark: Boolean,
)

val LocalMfColors = staticCompositionLocalOf {
    MfExtendedColors(MfColors.Success, MfColors.Warning, MfColors.Danger, MfColors.Line, true)
}

private val MfShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(18.dp),
    large = RoundedCornerShape(24.dp),
    extraLarge = RoundedCornerShape(32.dp),
)

@Composable
fun MediaFlowTheme(themeMode: ThemeMode = ThemeMode.SYSTEM, content: @Composable () -> Unit) {
    val dark = when (themeMode) {
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
    }
    val extended = if (dark) {
        MfExtendedColors(MfColors.Success, MfColors.Warning, MfColors.Danger, Color(0x1FFFFFFF), true)
    } else {
        MfExtendedColors(Color(0xFF14A86B), Color(0xFFD98A12), Color(0xFFD93A52), Color(0x14101218), false)
    }
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? android.app.Activity)?.window ?: return@SideEffect
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = !dark
                isAppearanceLightNavigationBars = !dark
            }
        }
    }
    CompositionLocalProvider(LocalMfColors provides extended) {
        MaterialTheme(
            colorScheme = if (dark) DarkScheme else LightScheme,
            typography = MfTypography,
            shapes = MfShapes,
            content = content,
        )
    }
}

object MfTheme {
    val extended: MfExtendedColors
        @Composable get() = LocalMfColors.current
}
