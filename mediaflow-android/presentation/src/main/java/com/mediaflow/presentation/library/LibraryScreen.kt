package com.mediaflow.presentation.library

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.DriveFileRenameOutline
import androidx.compose.material.icons.rounded.FileUpload
import androidx.compose.material.icons.rounded.Folder
import androidx.compose.material.icons.rounded.GraphicEq
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.MoreVert
import androidx.compose.material.icons.rounded.Movie
import androidx.compose.material.icons.rounded.MusicNote
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material.icons.rounded.Shuffle
import androidx.compose.material.icons.rounded.Sort
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.ListItemDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mediaflow.core.designsystem.MfColors
import com.mediaflow.core.designsystem.NumericStyle
import com.mediaflow.core.ui.EmptyState
import com.mediaflow.core.ui.KeyValueRow
import com.mediaflow.core.ui.MediaThumbnail
import com.mediaflow.core.ui.MfCard
import com.mediaflow.core.util.Format
import com.mediaflow.domain.model.LibraryItem
import com.mediaflow.domain.model.LibrarySort
import com.mediaflow.domain.model.MediaKind
import com.mediaflow.domain.model.PlayableItem
import com.mediaflow.domain.model.Tier
import com.mediaflow.presentation.downloads.SegmentedTabs
import com.mediaflow.presentation.util.Intents
import com.mediaflow.presentation.util.ScreenHeader
import com.mediaflow.presentation.util.ThumbShape
import com.mediaflow.presentation.util.icon
import com.mediaflow.presentation.util.isPlayable
import com.mediaflow.presentation.util.mfTextFieldColors
import com.mediaflow.presentation.util.tint
import com.mediaflow.presentation.util.toPlayable

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LibraryScreen(
    vm: LibraryViewModel,
    snackbar: SnackbarHostState,
    onPlay: (List<PlayableItem>, Int, Boolean) -> Unit,
    onConvert: (LibraryItem) -> Unit,
    onOpenPremium: () -> Unit,
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val tier by vm.tier.collectAsStateWithLifecycle()
    val context = LocalContext.current
    var menuItem by remember { mutableStateOf<LibraryItem?>(null) }
    var renameItem by remember { mutableStateOf<LibraryItem?>(null) }
    var deleteItem by remember { mutableStateOf<LibraryItem?>(null) }
    var infoItem by remember { mutableStateOf<LibraryItem?>(null) }
    var sortOpen by remember { mutableStateOf(false) }

    val consentLauncher = rememberLauncherForActivityResult(ActivityResultContracts.StartIntentSenderForResult()) {
        vm.onConsentResult(it.resultCode == android.app.Activity.RESULT_OK)
    }
    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { vm.refresh() }
    val importLauncher = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { vm.import(it) }

    LaunchedEffect(Unit) { vm.consentRequests.collect { consentLauncher.launch(IntentSenderRequest.Builder(it).build()) } }
    LaunchedEffect(Unit) { vm.messages.collect { snackbar.showSnackbar(it) } }
    LaunchedEffect(Unit) { vm.premiumPrompt.collect { onOpenPremium() } }

    val open: (LibraryItem, List<LibraryItem>) -> Unit = { item, list ->
        if (item.isPlayable()) {
            val playable = list.filter { it.isPlayable() }
            onPlay(playable.map { it.toPlayable() }, playable.indexOf(item).coerceAtLeast(0), false)
        } else Intents.openFile(context, item.uri, item.mimeType)
    }

    Column(Modifier.fillMaxSize()) {
        ScreenHeader("Biblioteca", "${state.snapshot.videos.size} vídeos · ${state.snapshot.audio.size} canciones · ${state.snapshot.files.size} archivos") {
            IconButton(onClick = { importLauncher.launch(arrayOf("*/*")) }) { Icon(Icons.Rounded.FileUpload, "Importar") }
            Box {
                IconButton(onClick = { sortOpen = true }) { Icon(Icons.Rounded.Sort, "Ordenar") }
                DropdownMenu(sortOpen, { sortOpen = false }) {
                    LibrarySort.entries.forEach { s ->
                        DropdownMenuItem(
                            text = { Text(s.label) },
                            onClick = { sortOpen = false; vm.setSort(s) },
                            leadingIcon = { if (s == state.sort) Icon(Icons.Rounded.PlayArrow, null, tint = MaterialTheme.colorScheme.primary) },
                            trailingIcon = { if (s.premium && tier == Tier.FREE) Icon(Icons.Rounded.Lock, null, Modifier.size(16.dp)) },
                        )
                    }
                }
            }
        }
        OutlinedTextField(
            value = state.query, onValueChange = vm::setQuery,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            placeholder = { Text("Buscar por nombre, artista o álbum") },
            leadingIcon = { Icon(Icons.Rounded.Search, null) },
            trailingIcon = { if (state.query.isNotEmpty()) IconButton(onClick = { vm.setQuery("") }) { Icon(Icons.Rounded.Close, "Borrar") } },
            singleLine = true, shape = RoundedCornerShape(16.dp), colors = mfTextFieldColors(),
        )
        Spacer(Modifier.height(12.dp))
        SegmentedTabs(LibraryTab.entries.map { it.label to null }, state.tab.ordinal, { vm.setTab(LibraryTab.entries[it]) }, Modifier.padding(horizontal = 16.dp))

        if (!state.snapshot.hasFullMediaAccess && state.tab != LibraryTab.FILES) {
            MfCard(Modifier.padding(start = 16.dp, end = 16.dp, top = 12.dp).fillMaxWidth(), containerColor = MfColors.Violet.copy(alpha = 0.10f), contentPadding = PaddingValues(14.dp)) {
                Text("Ves solo los archivos de MediaFlow", style = MaterialTheme.typography.titleSmall)
                Text(
                    "Permite el acceso a vídeos y música para ver toda tu biblioteca. Puedes revocarlo cuando quieras en Ajustes de Android.",
                    style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(8.dp))
                FilledTonalButton(onClick = { permissionLauncher.launch(vm.permissions) }) { Text("Permitir acceso") }
            }
        }

        AnimatedContent(state.tab, transitionSpec = { fadeIn() togetherWith fadeOut() }, label = "libTab", modifier = Modifier.weight(1f)) { tab ->
            when (tab) {
                LibraryTab.VIDEOS -> VideoGrid(state.videos, { open(it, state.videos) }, { menuItem = it })
                LibraryTab.MUSIC -> MusicList(state.audio, { open(it, state.audio) }, { menuItem = it },
                    onPlayAll = { shuffle -> if (state.audio.isNotEmpty()) onPlay(state.audio.map { it.toPlayable() }, 0, shuffle) })
                LibraryTab.FILES -> FileList(state.files, state.folders, state.folder, tier, vm::setFolder, { open(it, state.files) }, { menuItem = it })
            }
        }
    }

    menuItem?.let { item ->
        ModalBottomSheet(onDismissRequest = { menuItem = null }, containerColor = MaterialTheme.colorScheme.surfaceContainer) {
            Column(Modifier.navigationBarsPadding().padding(bottom = 12.dp)) {
                Text(item.name, style = MaterialTheme.typography.titleMedium, maxLines = 2, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(horizontal = 24.dp, vertical = 8.dp))
                val dismiss = { menuItem = null }
                SheetAction(Icons.Rounded.PlayArrow, if (item.isPlayable()) "Reproducir" else "Abrir") { dismiss(); open(item, listOf(item)) }
                if (item.isPlayable()) SheetAction(Icons.Rounded.GraphicEq, "Convertir formato") { dismiss(); onConvert(item) }
                SheetAction(Icons.Rounded.DriveFileRenameOutline, "Renombrar") { dismiss(); renameItem = item }
                SheetAction(Icons.Rounded.Share, "Compartir") { dismiss(); Intents.share(context, listOf(item.uri), item.mimeType) }
                SheetAction(Icons.Rounded.Info, "Detalles") { dismiss(); infoItem = item }
                SheetAction(Icons.Rounded.DeleteOutline, "Eliminar", MaterialTheme.colorScheme.error) { dismiss(); deleteItem = item }
            }
        }
    }

    renameItem?.let { item ->
        var name by remember(item) { mutableStateOf(com.mediaflow.domain.util.FileNames.withoutExtension(item.name)) }
        AlertDialog(
            onDismissRequest = { renameItem = null },
            title = { Text("Renombrar") },
            text = { OutlinedTextField(name, { name = it }, singleLine = true, shape = RoundedCornerShape(14.dp), colors = mfTextFieldColors()) },
            confirmButton = { TextButton(onClick = { vm.rename(item, name); renameItem = null }, enabled = name.isNotBlank()) { Text("Guardar") } },
            dismissButton = { TextButton(onClick = { renameItem = null }) { Text("Cancelar") } },
        )
    }

    deleteItem?.let { item ->
        AlertDialog(
            onDismissRequest = { deleteItem = null },
            title = { Text("¿Eliminar archivo?") },
            text = { Text("«${item.name}» se eliminará del dispositivo. Esta acción no se puede deshacer.") },
            confirmButton = { TextButton(onClick = { vm.delete(listOf(item)); deleteItem = null }) { Text("Eliminar", color = MaterialTheme.colorScheme.error) } },
            dismissButton = { TextButton(onClick = { deleteItem = null }) { Text("Cancelar") } },
        )
    }

    infoItem?.let { item ->
        AlertDialog(
            onDismissRequest = { infoItem = null },
            title = { Text("Detalles") },
            text = {
                Column {
                    KeyValueRow("Nombre", item.name)
                    KeyValueRow("Tipo", item.mimeType ?: "—")
                    KeyValueRow("Tamaño", Format.bytes(item.sizeBytes))
                    item.durationMs?.let { KeyValueRow("Duración", Format.duration(it)) }
                    item.resolution?.let { KeyValueRow("Resolución", it) }
                    item.artist?.let { KeyValueRow("Artista", it) }
                    item.album?.let { KeyValueRow("Álbum", it) }
                    item.folder?.let { KeyValueRow("Carpeta", it) }
                    KeyValueRow("Modificado", Format.dateTime(item.dateModifiedMillis))
                }
            },
            confirmButton = { TextButton(onClick = { infoItem = null }) { Text("Cerrar") } },
        )
    }
}

@Composable
private fun SheetAction(icon: ImageVector, label: String, tint: Color = MaterialTheme.colorScheme.onSurface, onClick: () -> Unit) {
    ListItem(
        headlineContent = { Text(label, color = tint) },
        leadingContent = { Icon(icon, null, tint = tint) },
        colors = ListItemDefaults.colors(containerColor = Color.Transparent),
        modifier = Modifier.clip(RoundedCornerShape(12.dp)).padding(horizontal = 8.dp).combinedClickableCompat(onClick),
    )
}

@OptIn(ExperimentalFoundationApi::class)
private fun Modifier.combinedClickableCompat(onClick: () -> Unit, onLongClick: (() -> Unit)? = null) =
    this.combinedClickable(onClick = onClick, onLongClick = onLongClick)

@Composable
private fun VideoGrid(items: List<LibraryItem>, onOpen: (LibraryItem) -> Unit, onMenu: (LibraryItem) -> Unit) {
    if (items.isEmpty()) {
        EmptyState(Icons.Rounded.Movie, "Sin vídeos", "Los vídeos descargados, convertidos o importados aparecerán aquí."); return
    }
    LazyVerticalGrid(
        columns = GridCells.Adaptive(160.dp),
        contentPadding = PaddingValues(16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        itemsIndexed(items, key = { _, it -> it.uri }) { _, item ->
            Column(Modifier.clip(RoundedCornerShape(16.dp)).combinedClickableCompat({ onOpen(item) }, { onMenu(item) })) {
                Box {
                    MediaThumbnail(item.uri, Icons.Rounded.Movie, RoundedCornerShape(16.dp), Modifier.fillMaxWidth().aspectRatio(16f / 10f))
                    item.durationMs?.let {
                        Text(
                            Format.duration(it), color = Color.White, style = NumericStyle,
                            modifier = Modifier.align(Alignment.BottomEnd).padding(8.dp).clip(RoundedCornerShape(6.dp))
                                .background(Color.Black.copy(alpha = 0.6f)).padding(horizontal = 6.dp, vertical = 2.dp),
                        )
                    }
                }
                Row(Modifier.padding(top = 8.dp), verticalAlignment = Alignment.Top) {
                    Column(Modifier.weight(1f)) {
                        Text(item.name, style = MaterialTheme.typography.labelLarge, maxLines = 2, overflow = TextOverflow.Ellipsis)
                        Text(
                            listOfNotNull(item.resolution, Format.bytes(item.sizeBytes)).joinToString(" · "),
                            style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    IconButton(onClick = { onMenu(item) }, modifier = Modifier.size(32.dp)) { Icon(Icons.Rounded.MoreVert, "Opciones", Modifier.size(18.dp)) }
                }
            }
        }
    }
}

@Composable
private fun MusicList(items: List<LibraryItem>, onOpen: (LibraryItem) -> Unit, onMenu: (LibraryItem) -> Unit, onPlayAll: (Boolean) -> Unit) {
    if (items.isEmpty()) {
        EmptyState(Icons.Rounded.MusicNote, "Sin música", "Convierte un vídeo a audio o importa tus canciones."); return
    }
    LazyColumn(contentPadding = PaddingValues(start = 16.dp, end = 8.dp, top = 12.dp, bottom = 16.dp)) {
        item {
            Row(Modifier.padding(end = 8.dp, bottom = 8.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                FilledTonalButton(onClick = { onPlayAll(false) }, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Rounded.PlayArrow, null); Spacer(Modifier.width(6.dp)); Text("Reproducir")
                }
                FilledTonalButton(onClick = { onPlayAll(true) }, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Rounded.Shuffle, null); Spacer(Modifier.width(6.dp)); Text("Aleatorio")
                }
            }
        }
        itemsIndexed(items, key = { _, it -> it.uri }) { _, item ->
            Row(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).combinedClickableCompat({ onOpen(item) }, { onMenu(item) }).padding(vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                MediaThumbnail(item.uri, Icons.Rounded.MusicNote, ThumbShape, Modifier.size(52.dp))
                Spacer(Modifier.width(14.dp))
                Column(Modifier.weight(1f)) {
                    Text(item.name, style = MaterialTheme.typography.titleSmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(
                        listOfNotNull(item.artist ?: "Artista desconocido", Format.duration(item.durationMs)).joinToString(" · "),
                        style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1,
                    )
                }
                IconButton(onClick = { onMenu(item) }) { Icon(Icons.Rounded.MoreVert, "Opciones") }
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun FileList(
    items: List<LibraryItem>, folders: List<String>, selectedFolder: String?, tier: Tier,
    onFolder: (String?) -> Unit, onOpen: (LibraryItem) -> Unit, onMenu: (LibraryItem) -> Unit,
) {
    val grouped = items.groupBy { Format.dateBucket(it.dateModifiedMillis) }
    LazyColumn(contentPadding = PaddingValues(bottom = 16.dp)) {
        if (folders.size > 1) item {
            LazyRow(contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                item { FilterChip(selectedFolder == null, { onFolder(null) }, { Text("Todas") }) }
                items(folders) { f ->
                    FilterChip(
                        selectedFolder == f, { onFolder(if (selectedFolder == f) null else f) },
                        { Text(f.substringAfterLast('/')) },
                        leadingIcon = { Icon(if (tier == Tier.FREE) Icons.Rounded.Lock else Icons.Rounded.Folder, null, Modifier.size(16.dp)) },
                    )
                }
            }
        }
        if (items.isEmpty()) {
            item { EmptyState(Icons.Rounded.Folder, "Sin archivos", "Los archivos que guardes con MediaFlow se organizarán aquí por fecha.") }
        }
        grouped.forEach { (bucket, list) ->
            stickyHeader(key = "h_$bucket") {
                Text(
                    bucket, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.background).padding(horizontal = 20.dp, vertical = 8.dp),
                )
            }
            items(list, key = { it.uri }) { item ->
                Row(
                    Modifier.fillMaxWidth().combinedClickableCompat({ onOpen(item) }, { onMenu(item) }).padding(start = 16.dp, end = 4.dp, top = 6.dp, bottom = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    if (item.kind == MediaKind.VIDEO || item.kind == MediaKind.IMAGE || item.kind == MediaKind.AUDIO) {
                        MediaThumbnail(item.uri, item.kind.icon(), ThumbShape, Modifier.size(46.dp))
                    } else {
                        Box(Modifier.size(46.dp).clip(ThumbShape).background(item.kind.tint().copy(alpha = 0.14f)), contentAlignment = Alignment.Center) {
                            Icon(item.kind.icon(), null, tint = item.kind.tint())
                        }
                    }
                    Spacer(Modifier.width(14.dp))
                    Column(Modifier.weight(1f)) {
                        Text(item.name, style = MaterialTheme.typography.titleSmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text(
                            listOfNotNull(Format.bytes(item.sizeBytes), item.folder?.substringAfterLast('/')).joinToString(" · "),
                            style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1,
                        )
                    }
                    IconButton(onClick = { onMenu(item) }) { Icon(Icons.Rounded.MoreVert, "Opciones") }
                }
            }
        }
    }
}
