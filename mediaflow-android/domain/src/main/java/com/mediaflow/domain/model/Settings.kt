package com.mediaflow.domain.model

enum class ThemeMode(val label: String) { SYSTEM("Sistema"), LIGHT("Claro"), DARK("Oscuro") }

data class UserSettings(
    val themeMode: ThemeMode = ThemeMode.SYSTEM,
    /** Carpeta elegida con SAF (content://...). null = carpetas MediaFlow del sistema. */
    val customFolderUri: String? = null,
    val defaultQuality: AudioQuality = AudioQuality.HIGH,
    val defaultFormat: ConversionFormat = ConversionFormat.M4A,
    val notificationsEnabled: Boolean = true,
    val wifiOnlyDownloads: Boolean = false,
    val playbackSpeed: Float = 1f,
    val backgroundAudio: Boolean = true,
    val onboardingDone: Boolean = false,
)
