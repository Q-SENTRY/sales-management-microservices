package com.mediaflow.data.prefs

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.floatPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.mediaflow.domain.model.AudioQuality
import com.mediaflow.domain.model.ConversionFormat
import com.mediaflow.domain.model.ThemeMode
import com.mediaflow.domain.model.Tier
import com.mediaflow.domain.model.UserSettings
import com.mediaflow.domain.repository.EntitlementRepository
import com.mediaflow.domain.repository.SettingsRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

internal val Context.mediaFlowStore: DataStore<Preferences> by preferencesDataStore(name = "mediaflow_settings")

private object Keys {
    val theme = stringPreferencesKey("theme")
    val folder = stringPreferencesKey("custom_folder")
    val quality = stringPreferencesKey("quality")
    val format = stringPreferencesKey("format")
    val notifications = booleanPreferencesKey("notifications")
    val wifiOnly = booleanPreferencesKey("wifi_only")
    val speed = floatPreferencesKey("speed")
    val background = booleanPreferencesKey("background_audio")
    val onboarding = booleanPreferencesKey("onboarding")
    val tier = stringPreferencesKey("preview_tier")
}

private inline fun <reified E : Enum<E>> enumOr(value: String?, default: E): E =
    value?.let { runCatching { enumValueOf<E>(it) }.getOrNull() } ?: default

class DataStoreSettingsRepository(context: Context) : SettingsRepository {
    private val store = context.applicationContext.mediaFlowStore

    override val settings: Flow<UserSettings> = store.data.map { p ->
        val d = UserSettings()
        UserSettings(
            themeMode = enumOr(p[Keys.theme], d.themeMode),
            customFolderUri = p[Keys.folder],
            defaultQuality = enumOr(p[Keys.quality], d.defaultQuality),
            defaultFormat = enumOr(p[Keys.format], d.defaultFormat),
            notificationsEnabled = p[Keys.notifications] ?: d.notificationsEnabled,
            wifiOnlyDownloads = p[Keys.wifiOnly] ?: d.wifiOnlyDownloads,
            playbackSpeed = p[Keys.speed] ?: d.playbackSpeed,
            backgroundAudio = p[Keys.background] ?: d.backgroundAudio,
            onboardingDone = p[Keys.onboarding] ?: d.onboardingDone,
        )
    }

    override suspend fun update(transform: (UserSettings) -> UserSettings) {
        val next = transform(settings.first())
        store.edit { p ->
            p[Keys.theme] = next.themeMode.name
            val folder = next.customFolderUri
            if (folder != null) p[Keys.folder] = folder else p.remove(Keys.folder)
            p[Keys.quality] = next.defaultQuality.name
            p[Keys.format] = next.defaultFormat.name
            p[Keys.notifications] = next.notificationsEnabled
            p[Keys.wifiOnly] = next.wifiOnlyDownloads
            p[Keys.speed] = next.playbackSpeed
            p[Keys.background] = next.backgroundAudio
            p[Keys.onboarding] = next.onboardingDone
        }
    }
}

/**
 * Entitlement local. Mientras Google Play Billing no esté conectado, `previewEnabled`
 * permite activar Premium en compilaciones de prueba. Nunca se cobra ni se simula un pago.
 */
class LocalEntitlementRepository(context: Context, private val previewEnabled: Boolean) : EntitlementRepository {
    private val store = context.applicationContext.mediaFlowStore
    override val billingAvailable: Boolean = false
    override val tier: Flow<Tier> = store.data.map { p ->
        if (previewEnabled) enumOr(p[Keys.tier], Tier.FREE) else Tier.FREE
    }
    override suspend fun setPreviewTier(tier: Tier) {
        if (!previewEnabled) return
        store.edit { it[Keys.tier] = tier.name }
    }
}
