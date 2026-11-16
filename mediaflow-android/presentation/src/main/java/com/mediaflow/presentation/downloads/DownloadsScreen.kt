package com.mediaflow.presentation.downloads

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Cancel
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.DeleteSweep
import androidx.compose.material.icons.rounded.Download
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.mediaflow.core.designsystem.MfColors
import com.mediaflow.core.designsystem.MfTheme
import com.mediaflow.core.designsystem.NumericStyle
import com.mediaflow.core.ui.EmptyState
import com.mediaflow.core.ui.FlowProgressBar
import com.mediaflow.core.ui.IconBadge
import com.mediaflow.core.ui.MfCard
import com.mediaflow.core.ui.StatusChip
import com.mediaflow.core.util.Format
import com.mediaflow.domain.model.DownloadStatus
import com.mediaflow.domain.model.DownloadTask
import com.mediaflow.domain.model.MediaKind
import com.mediaflow.domain.model.PlayableItem
import com.mediaflow.presentation.di.AppDependencies
import com.mediaflow.presentation.util.Intents
import com.mediaflow.presentation.util.ScreenHeader
import com.mediaflow.presentation.util.icon
import com.mediaflow.presentation.util.tint
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class DownloadsViewModel(private val deps: AppDependencies) : ViewModel() {
    val tasks: StateFlow<List<DownloadTask>> = deps.downloads.observeAll()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun pause(id: Long) = viewModelScope.launch { deps.downloadController.pause(id) }
    fun resume(id: Long) = viewModelScope.launch { deps.downloadController.resume(id) }
    fun cancel(id: Long) = viewModelScope.launch { deps.downloadController.cancel(id) }
    fun retry(id: Long) = viewModelScope.launch { deps.downloadController.retry(id) }
    fun remove(id: Long) = viewModelScope.launch { deps.downloadController.remove(id) }
    fun clearHistory() = viewModelScope.launch { deps.downloads.clearFinished() }
}

@Composable
fun DownloadsScreen(vm: DownloadsViewModel, onPlay: (PlayableItem) -> Unit) {
    val tasks by vm.tasks.collectAsStateWithLifecycle()
    var tab by rememberSaveable { mutableIntStateOf(0) }
    val active = tasks.filter { it.status.isActive }
    val history = tasks.filter { it.status.isTerminal }
    val context = LocalContext.current

    Column(Modifier.fillMaxSize()) {
        ScreenHeader("Descargas", "${active.size} en curso · ${history.count { it.status == DownloadStatus.COMPLETED }} completadas") {
            if (tab == 1 && history.isNotEmpty()) IconButton(onClick = { vm.clearHistory() }) { Icon(Icons.Rounded.DeleteSweep, "Borrar historial") }
        }
        SegmentedTabs(listOf("En curso" to active.size, "Historial" to history.size), tab, { tab = it }, Modifier.padding(horizontal = 16.dp))
        val list = if (tab == 0) active else history
        if (list.isEmpty()) {
            EmptyState(
                Icons.Rounded.Download,
                if (tab == 0) "No hay descargas activas" else "El historial está vacío",
                if (tab == 0) "Pega en Inicio un enlace de descarga directa autorizado (https) para empezar."
                else "Aquí verás las descargas completadas, canceladas o con errores.",
            )
        } else {
            LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(list, key = { it.id }) { task ->
                    DownloadCard(
                        task,
                        onPause = { vm.pause(task.id) }, onResume = { vm.resume(task.id) }, onCancel = { vm.cancel(task.id) },
                        onRetry = { vm.retry(task.id) }, onRemove = { vm.remove(task.id) },
                        onOpen = {
                            val uri = task.outputUri ?: return@DownloadCard
                            val kind = MediaKind.fromMime(task.mimeType)
                            if (kind == MediaKind.VIDEO || kind == MediaKind.AUDIO) onPlay(PlayableItem(uri, task.fileName, task.platform.displayName, kind == MediaKind.VIDEO))
                            else Intents.openFile(context, uri, task.mimeType)
                        },
                        onShare = { task.outputUri?.let { Intents.share(context, listOf(it), task.mimeType) } },
                    )
                }
            }
        }
    }
}

@Composable
fun SegmentedTabs(tabs: List<Pair<String, Int?>>, selected: Int, onSelect: (Int) -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(MaterialTheme.colorScheme.surfaceContainer).padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        tabs.forEachIndexed { i, (label, count) ->
            val sel = i == selected
            Box(
                Modifier.weight(1f).clip(RoundedCornerShape(12.dp))
                    .background(if (sel) MaterialTheme.colorScheme.surfaceContainerHighest else Color.Transparent)
                    .clickable { onSelect(i) }.padding(vertical = 10.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    if (count != null && count > 0) "$label  $count" else label,
                    style = MaterialTheme.typography.labelLarge,
                    color = if (sel) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun DownloadCard(
    t: DownloadTask,
    onPause: () -> Unit, onResume: () -> Unit, onCancel: () -> Unit, onRetry: () -> Unit,
    onRemove: () -> Unit, onOpen: () -> Unit, onShare: () -> Unit,
) {
    val ext = MfTheme.extended
    val kind = MediaKind.fromMime(t.mimeType)
    val (label, color) = when (t.status) {
        DownloadStatus.QUEUED -> "En cola" to MaterialTheme.colorScheme.onSurfaceVariant
        DownloadStatus.RUNNING -> "Descargando" to MfColors.Azure
        DownloadStatus.PAUSED -> "En pausa" to ext.warning
        DownloadStatus.COMPLETED -> "Completada" to ext.success
        DownloadStatus.FAILED -> "Error" to ext.danger
        DownloadStatus.CANCELLED -> "Cancelada" to MaterialTheme.colorScheme.onSurfaceVariant
    }
    MfCard(Modifier.fillMaxWidth().animateContentSize(), onClick = if (t.status == DownloadStatus.COMPLETED) onOpen else null) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconBadge(kind.icon(), kind.tint())
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(t.fileName, style = MaterialTheme.typography.titleSmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    "${t.platform.displayName} · ${Format.dateTime(t.createdAt)}",
                    style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1,
                )
            }
            Spacer(Modifier.width(8.dp))
            StatusChip(label, color)
        }
        if (t.status.isActive) {
            Spacer(Modifier.height(14.dp))
            FlowProgressBar(if (t.status == DownloadStatus.RUNNING) t.progress else (t.progress ?: 0f))
            Spacer(Modifier.height(8.dp))
            Row {
                Text(
                    if (t.totalBytes > 0) "${Format.bytes(t.bytesDownloaded)} / ${Format.bytes(t.totalBytes)}"
                    else "${Format.bytes(t.bytesDownloaded)} · tamaño no informado",
                    style = NumericStyle, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f),
                )
                if (t.status == DownloadStatus.RUNNING) {
                    Text(
                        Format.speed(t.speedBps) + if (t.totalBytes > 0) " · " + Format.eta(t.etaSeconds) else "",
                        style = NumericStyle, color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            if (!t.supportsResume && t.status == DownloadStatus.RUNNING) {
                Text("El servidor no admite reanudar: si pausas, empezará de nuevo.", style = MaterialTheme.typography.bodySmall, color = ext.warning, modifier = Modifier.padding(top = 6.dp))
            }
        } else if (t.status == DownloadStatus.COMPLETED) {
            Spacer(Modifier.height(8.dp))
            Text(Format.bytes(t.totalBytes), style = NumericStyle, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        t.errorMessage?.takeIf { t.status == DownloadStatus.FAILED || t.status == DownloadStatus.QUEUED }?.let {
            Spacer(Modifier.height(8.dp))
            Text(it, style = MaterialTheme.typography.bodySmall, color = if (t.status == DownloadStatus.FAILED) ext.danger else MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Spacer(Modifier.height(6.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            when (t.status) {
                DownloadStatus.RUNNING, DownloadStatus.QUEUED -> {
                    Action(Icons.Rounded.Pause, "Pausar", onPause)
                    Action(Icons.Rounded.Cancel, "Cancelar", onCancel)
                }
                DownloadStatus.PAUSED -> {
                    Action(Icons.Rounded.PlayArrow, "Reanudar", onResume)
                    Action(Icons.Rounded.Cancel, "Cancelar", onCancel)
                }
                DownloadStatus.FAILED, DownloadStatus.CANCELLED -> {
                    Action(Icons.Rounded.Refresh, "Reintentar", onRetry)
                    Action(Icons.Rounded.DeleteOutline, "Quitar", onRemove)
                }
                DownloadStatus.COMPLETED -> {
                    Action(Icons.Rounded.PlayArrow, "Abrir", onOpen)
                    Action(Icons.Rounded.Share, "Compartir", onShare)
                    Action(Icons.Rounded.DeleteOutline, "Quitar", onRemove)
                }
            }
        }
    }
}

@Composable
private fun Action(icon: ImageVector, label: String, onClick: () -> Unit) {
    TextButton(onClick = onClick, contentPadding = PaddingValues(horizontal = 10.dp)) {
        Icon(icon, null, Modifier.padding(end = 6.dp))
        Text(label)
    }
}
