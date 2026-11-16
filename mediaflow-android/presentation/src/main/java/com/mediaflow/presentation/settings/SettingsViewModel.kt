package com.mediaflow.presentation.settings

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mediaflow.data.storage.StorageStats
import com.mediaflow.domain.model.DownloadStatus
import com.mediaflow.domain.model.Tier
import com.mediaflow.domain.model.UserSettings
import com.mediaflow.presentation.di.AppDependencies
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SettingsViewModel(private val deps: AppDependencies) : ViewModel() {
    val settings: StateFlow<UserSettings> = deps.settings.settings.stateIn(viewModelScope, SharingStarted.Eagerly, UserSettings())
    val tier: StateFlow<Tier> = deps.entitlements.tier.stateIn(viewModelScope, SharingStarted.Eagerly, Tier.FREE)
    private val _stats = MutableStateFlow<StorageStats?>(null)
    val stats: StateFlow<StorageStats?> = _stats
    private val _messages = MutableSharedFlow<String>(extraBufferCapacity = 4)
    val messages: SharedFlow<String> = _messages

    val appVersion get() = deps.appVersion
    val premiumPreviewEnabled get() = deps.premiumPreviewEnabled
    val billingAvailable get() = deps.entitlements.billingAvailable

    init { refreshStats() }

    fun update(transform: (UserSettings) -> UserSettings) = viewModelScope.launch { deps.settings.update(transform) }

    fun setFolder(uri: Uri?) = update { it.copy(customFolderUri = uri?.toString()) }

    fun refreshStats() = viewModelScope.launch {
        _stats.value = withContext(Dispatchers.IO) { runCatching { deps.storage.stats() }.getOrNull() }
    }

    fun clearTemporary() = viewModelScope.launch {
        val keep = deps.downloads.observeAll().first()
            .filter { it.status == DownloadStatus.PAUSED || it.status == DownloadStatus.QUEUED || it.status == DownloadStatus.RUNNING }
            .mapNotNull { it.partialPath }.toSet()
        val freed = withContext(Dispatchers.IO) { deps.storage.clearTemporary(keep) }
        _messages.tryEmit("Se liberaron ${com.mediaflow.core.util.Format.bytes(freed)}")
        refreshStats()
    }

    fun clearDownloadHistory() = viewModelScope.launch { deps.downloads.clearFinished(); _messages.tryEmit("Historial de descargas borrado") }
    fun clearConversionHistory() = viewModelScope.launch { deps.conversions.clear(); _messages.tryEmit("Historial de conversiones borrado") }
    fun clearFavorites() = viewModelScope.launch { deps.favorites.clear(); _messages.tryEmit("Favoritos borrados") }

    fun setPreviewTier(tier: Tier) = viewModelScope.launch { deps.entitlements.setPreviewTier(tier) }
}
