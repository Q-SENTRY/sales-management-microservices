package com.mediaflow.presentation.home

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mediaflow.data.storage.StorageStats
import com.mediaflow.domain.model.DownloadTask
import com.mediaflow.domain.model.Favorite
import com.mediaflow.domain.model.LibraryItem
import com.mediaflow.domain.model.LinkAnalysis
import com.mediaflow.domain.model.PlatformAction
import com.mediaflow.domain.model.Tier
import com.mediaflow.domain.usecase.AnalyzeResult
import com.mediaflow.presentation.di.AppDependencies
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class LibrarySummary(
    val recent: List<LibraryItem> = emptyList(),
    val videoCount: Int = 0,
    val audioCount: Int = 0,
    val fileCount: Int = 0,
)

data class HomeUiState(
    val input: String = "",
    val analyzing: Boolean = false,
    val inputError: String? = null,
    val analysis: LinkAnalysis? = null,
    val isFavorite: Boolean = false,
    val summary: LibrarySummary = LibrarySummary(),
    val storage: StorageStats? = null,
)

@OptIn(kotlinx.coroutines.FlowPreview::class)
class HomeViewModel(private val deps: AppDependencies) : ViewModel() {

    private val _state = MutableStateFlow(HomeUiState())
    val state: StateFlow<HomeUiState> = _state.asStateFlow()

    private val _messages = MutableSharedFlow<String>(extraBufferCapacity = 4)
    val messages: SharedFlow<String> = _messages

    val activeDownloads: StateFlow<List<DownloadTask>> = deps.downloads.observeAll()
        .map { list -> list.filter { it.status.isActive } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val tier: StateFlow<Tier> = deps.entitlements.tier.stateIn(viewModelScope, SharingStarted.Eagerly, Tier.FREE)

    val favorites: StateFlow<List<Favorite>> = deps.favorites.observe()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init {
        refresh()
        viewModelScope.launch { deps.library.changes().debounce(800).collect { refresh() } }
    }

    fun refresh() {
        viewModelScope.launch {
            val folder = deps.settings.settings.first().customFolderUri
            val snapshot = deps.library.load(folder)
            val stats = withContext(Dispatchers.IO) { runCatching { deps.storage.stats() }.getOrNull() }
            val recent = (snapshot.files + snapshot.videos + snapshot.audio)
                .distinctBy { it.uri }
                .sortedByDescending { it.dateModifiedMillis }
                .take(12)
            _state.update {
                it.copy(
                    summary = LibrarySummary(recent, snapshot.videos.size, snapshot.audio.size, snapshot.files.size),
                    storage = stats,
                )
            }
        }
    }

    fun onInputChange(value: String) = _state.update { it.copy(input = value, inputError = null) }

    fun analyze(text: String = _state.value.input) {
        if (_state.value.analyzing) return
        _state.update { it.copy(input = text, analyzing = true, inputError = null) }
        viewModelScope.launch {
            when (val r = deps.analyzeLink(text)) {
                is AnalyzeResult.Success -> _state.update {
                    it.copy(analyzing = false, analysis = r.analysis, isFavorite = deps.favorites.isFavorite(r.analysis.url))
                }
                is AnalyzeResult.InvalidLink -> _state.update { it.copy(analyzing = false, inputError = r.reason) }
                is AnalyzeResult.Error -> _state.update { it.copy(analyzing = false, inputError = r.message) }
            }
        }
    }

    fun dismissAnalysis() = _state.update { it.copy(analysis = null) }

    fun startDownload(action: PlatformAction.DirectDownload) {
        val analysis = _state.value.analysis ?: return
        viewModelScope.launch {
            deps.downloadController.start(action, analysis.platform)
            _state.update { it.copy(analysis = null, input = "") }
            _messages.tryEmit("Descarga añadida a la cola")
        }
    }

    fun toggleFavorite() {
        val analysis = _state.value.analysis ?: return
        viewModelScope.launch {
            if (_state.value.isFavorite) {
                deps.favorites.remove(analysis.url)
                _state.update { it.copy(isFavorite = false) }
            } else {
                deps.favorites.add(
                    Favorite(
                        url = analysis.url, platform = analysis.platform, title = analysis.metadata?.title,
                        thumbnailUrl = analysis.metadata?.thumbnailUrl, createdAt = System.currentTimeMillis(),
                    ),
                )
                _state.update { it.copy(isFavorite = true) }
                _messages.tryEmit("Guardado en favoritos")
            }
        }
    }

    fun removeFavorite(url: String) { viewModelScope.launch { deps.favorites.remove(url) } }

    fun importFiles(uris: List<Uri>) {
        if (uris.isEmpty()) return
        viewModelScope.launch {
            val folder = deps.settings.settings.first().customFolderUri
            var ok = 0
            uris.forEach { uri -> runCatching { deps.library.import(uri, deps.storage, folder) }.onSuccess { ok++ } }
            _messages.tryEmit(if (ok == uris.size) "Importado en tu biblioteca" else "Se importaron $ok de ${uris.size} archivos")
            _state.update { it.copy(analysis = null) }
            refresh()
        }
    }
}
