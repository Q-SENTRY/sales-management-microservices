package com.mediaflow.presentation.library

import android.content.IntentSender
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mediaflow.domain.model.FeatureGate
import com.mediaflow.domain.model.LibraryItem
import com.mediaflow.domain.model.LibrarySort
import com.mediaflow.domain.model.Tier
import com.mediaflow.domain.model.sortedBy
import com.mediaflow.library.LibrarySnapshot
import com.mediaflow.library.ModifyResult
import com.mediaflow.presentation.di.AppDependencies
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class LibraryTab(val label: String) { VIDEOS("Vídeos"), MUSIC("Música"), FILES("Archivos") }

data class LibraryUiState(
    val loading: Boolean = true,
    val snapshot: LibrarySnapshot = LibrarySnapshot(emptyList(), emptyList(), emptyList(), false),
    val tab: LibraryTab = LibraryTab.VIDEOS,
    val query: String = "",
    val sort: LibrarySort = LibrarySort.DATE_DESC,
    val folder: String? = null,
) {
    private fun List<LibraryItem>.filtered(): List<LibraryItem> {
        val q = query.trim().lowercase()
        return (if (q.isEmpty()) this else filter {
            it.name.lowercase().contains(q) || it.artist?.lowercase()?.contains(q) == true || it.album?.lowercase()?.contains(q) == true
        }).let { l -> if (folder == null) l else l.filter { it.folder == folder } }.sortedBy(sort)
    }
    val videos get() = snapshot.videos.filtered()
    val audio get() = snapshot.audio.filtered()
    val files get() = snapshot.files.filtered()
    val folders get() = snapshot.files.mapNotNull { it.folder }.distinct().sorted()
}

private sealed interface PendingOp {
    data class Rename(val item: LibraryItem, val name: String) : PendingOp
    data object Delete : PendingOp
}

@OptIn(kotlinx.coroutines.FlowPreview::class)
class LibraryViewModel(private val deps: AppDependencies) : ViewModel() {
    private val _state = MutableStateFlow(LibraryUiState())
    val state: StateFlow<LibraryUiState> = _state.asStateFlow()

    val tier: StateFlow<Tier> = deps.entitlements.tier.stateIn(viewModelScope, SharingStarted.Eagerly, Tier.FREE)

    private val _consent = MutableSharedFlow<IntentSender>(extraBufferCapacity = 1)
    val consentRequests: SharedFlow<IntentSender> = _consent
    private val _messages = MutableSharedFlow<String>(extraBufferCapacity = 4)
    val messages: SharedFlow<String> = _messages
    private val _premiumPrompt = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val premiumPrompt: SharedFlow<Unit> = _premiumPrompt

    private var pending: PendingOp? = null

    val permissions: Array<String> get() = deps.library.mediaPermissions()

    init {
        refresh()
        viewModelScope.launch { deps.library.changes().debounce(800).collect { refresh() } }
    }

    fun refresh() {
        viewModelScope.launch {
            val folder = deps.settings.settings.first().customFolderUri
            val snap = deps.library.load(folder)
            _state.update { it.copy(loading = false, snapshot = snap) }
        }
    }

    fun setTab(tab: LibraryTab) = _state.update { it.copy(tab = tab) }
    fun setQuery(q: String) = _state.update { it.copy(query = q) }

    fun setSort(sort: LibrarySort) {
        if (!FeatureGate.canUseSort(tier.value, sort)) { _premiumPrompt.tryEmit(Unit); return }
        _state.update { it.copy(sort = sort) }
    }

    fun setFolder(folder: String?) {
        if (folder != null && tier.value != Tier.PREMIUM) { _premiumPrompt.tryEmit(Unit); return }
        _state.update { it.copy(folder = folder) }
    }

    fun rename(item: LibraryItem, newName: String) {
        if (newName.isBlank()) return
        viewModelScope.launch { handle(deps.library.rename(item, newName), PendingOp.Rename(item, newName), "Archivo renombrado") }
    }

    fun delete(items: List<LibraryItem>) {
        viewModelScope.launch { handle(deps.library.delete(items), PendingOp.Delete, "Eliminado") }
    }

    fun onConsentResult(granted: Boolean) {
        val op = pending.also { pending = null } ?: return
        if (!granted) { _messages.tryEmit("Operación cancelada"); return }
        when (op) {
            is PendingOp.Rename -> viewModelScope.launch {
                handle(deps.library.renameAfterConsent(op.item, op.name), null, "Archivo renombrado")
            }
            PendingOp.Delete -> { _messages.tryEmit("Eliminado"); refresh() }
        }
    }

    fun import(uris: List<Uri>) {
        viewModelScope.launch {
            val folder = deps.settings.settings.first().customFolderUri
            var ok = 0
            uris.forEach { runCatching { deps.library.import(it, deps.storage, folder) }.onSuccess { ok++ } }
            if (uris.isNotEmpty()) _messages.tryEmit("$ok archivo(s) importado(s)")
            refresh()
        }
    }

    private fun handle(result: ModifyResult, op: PendingOp?, success: String) {
        when (result) {
            ModifyResult.Done -> { _messages.tryEmit(success); refresh() }
            is ModifyResult.Failed -> _messages.tryEmit(result.message)
            is ModifyResult.NeedsConsent -> {
                if (op == null) { _messages.tryEmit("No se pudo completar la operación"); return }
                pending = op
                _consent.tryEmit(result.intentSender)
            }
        }
    }
}
