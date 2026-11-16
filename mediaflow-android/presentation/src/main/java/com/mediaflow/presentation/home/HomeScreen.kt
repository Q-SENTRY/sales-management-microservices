package com.mediaflow.presentation.home

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.BookmarkBorder
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material.icons.rounded.ContentPaste
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.FileUpload
import androidx.compose.material.icons.rounded.GraphicEq
import androidx.compose.material.icons.rounded.Link
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.SdStorage
import androidx.compose.material.icons.rounded.VideoLibrary
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mediaflow.core.designsystem.MfColors
import com.mediaflow.core.designsystem.NumericStyle
import com.mediaflow.core.ui.FlowProgressBar
import com.mediaflow.core.ui.GradientButton
import com.mediaflow.core.ui.IconBadge
import com.mediaflow.core.ui.MediaFlowMark
import com.mediaflow.core.ui.MediaFlowWordmark
import com.mediaflow.core.ui.MediaThumbnail
import com.mediaflow.core.ui.MfCard
import com.mediaflow.core.ui.Monogram
import com.mediaflow.core.ui.SectionHeader
import com.mediaflow.core.util.Format
import com.mediaflow.domain.model.DownloadTask
import com.mediaflow.domain.model.LibraryItem
import com.mediaflow.domain.model.MediaKind
import com.mediaflow.domain.model.Platform
import com.mediaflow.domain.model.Tier
import com.mediaflow.presentation.di.LocalAppDependencies
import com.mediaflow.presentation.util.ThumbShape
import com.mediaflow.presentation.util.icon
import com.mediaflow.presentation.util.mfTextFieldColors
import com.mediaflow.presentation.util.tint

@Composable
fun HomeScreen(
    vm: HomeViewModel,
    snackbar: SnackbarHostState,
    onOpenPlatform: (Platform) -> Unit,
    onOpenDownloads: () -> Unit,
    onOpenLibrary: () -> Unit,
    onOpenConverter: () -> Unit,
    onOpenFavorites: () -> Unit,
    onOpenPremium: () -> Unit,
    onOpenItem: (LibraryItem) -> Unit,
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val active by vm.activeDownloads.collectAsStateWithLifecycle()
    val tier by vm.tier.collectAsStateWithLifecycle()
    val deps = LocalAppDependencies.current
    val focus = LocalFocusManager.current
    val clipboard = LocalClipboardManager.current

    val importLauncher = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { vm.importFiles(it) }

    LaunchedEffect(Unit) { vm.messages.collect { snackbar.showSnackbar(it) } }

    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        item {
            Row(
                Modifier.fillMaxWidth().statusBarsPadding().padding(start = 20.dp, end = 12.dp, top = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                MediaFlowMark(38.dp)
                Spacer(Modifier.width(12.dp))
                MediaFlowWordmark(Modifier.weight(1f), showTagline = true)
                if (tier == Tier.FREE) {
                    Box(
                        Modifier.clip(CircleShape).background(MfColors.brandHorizontal)
                            .clickable(onClick = onOpenPremium).padding(horizontal = 12.dp, vertical = 6.dp),
                    ) { Text("PRO", color = Color.White, style = MaterialTheme.typography.labelSmall) }
                }
                IconButton(onClick = onOpenFavorites) { Icon(Icons.Rounded.BookmarkBorder, "Favoritos") }
            }
        }

        // ---------- Analizador de enlaces
        item {
            Box(
                Modifier.padding(horizontal = 16.dp).fillMaxWidth().clip(RoundedCornerShape(28.dp))
                    .background(
                        Brush.linearGradient(
                            listOf(MfColors.Violet.copy(alpha = 0.22f), MfColors.Azure.copy(alpha = 0.10f), MfColors.Cyan.copy(alpha = 0.16f)),
                        ),
                    )
                    .border(1.dp, MfColors.Violet.copy(alpha = 0.25f), RoundedCornerShape(28.dp))
                    .padding(18.dp),
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Analiza un enlace", style = MaterialTheme.typography.titleLarge)
                    Text(
                        "Comprobamos qué permite cada plataforma y te mostramos solo opciones oficiales.",
                        style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    OutlinedTextField(
                        value = state.input,
                        onValueChange = vm::onInputChange,
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("https://…") },
                        leadingIcon = { Icon(Icons.Rounded.Link, null) },
                        trailingIcon = {
                            if (state.input.isEmpty()) {
                                IconButton(onClick = { clipboard.getText()?.text?.let(vm::onInputChange) }) {
                                    Icon(Icons.Rounded.ContentPaste, "Pegar")
                                }
                            } else {
                                IconButton(onClick = { vm.onInputChange("") }) { Icon(Icons.Rounded.Close, "Borrar") }
                            }
                        },
                        singleLine = true,
                        isError = state.inputError != null,
                        shape = RoundedCornerShape(16.dp),
                        colors = mfTextFieldColors(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri, imeAction = ImeAction.Go),
                        keyboardActions = KeyboardActions(onGo = { focus.clearFocus(); vm.analyze() }),
                    )
                    AnimatedVisibility(state.inputError != null, enter = fadeIn() + expandVertically(), exit = fadeOut() + shrinkVertically()) {
                        Text(state.inputError.orEmpty(), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }
                    GradientButton(
                        text = if (state.analyzing) "Analizando…" else "Analizar enlace",
                        onClick = { focus.clearFocus(); vm.analyze() },
                        icon = Icons.Rounded.Search,
                        loading = state.analyzing,
                        enabled = state.input.isNotBlank(),
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        }

        // ---------- Plataformas
        item {
            Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                SectionHeader("Plataformas")
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    deps.platforms.modules.forEach { m ->
                        PlatformTile(m.monogram, m.platform.displayName, Color(m.accentArgb), Modifier.weight(1f)) { onOpenPlatform(m.platform) }
                    }
                    ImportTile(Modifier.weight(1f)) { importLauncher.launch(arrayOf("video/*", "audio/*", "image/*", "application/pdf")) }
                }
            }
        }

        // ---------- Descargas activas
        if (active.isNotEmpty()) {
            item {
                Column(Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    SectionHeader("Descargas activas", Modifier.padding(start = 4.dp), "Ver todo", onOpenDownloads)
                    MfCard(onClick = onOpenDownloads) {
                        active.take(3).forEachIndexed { i, t ->
                            if (i > 0) Spacer(Modifier.height(14.dp))
                            ActiveDownloadRow(t)
                        }
                    }
                }
            }
        }

        // ---------- Recientes
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                SectionHeader("Archivos recientes", Modifier.padding(horizontal = 20.dp), "Biblioteca", onOpenLibrary)
                if (state.summary.recent.isEmpty()) {
                    MfCard(Modifier.padding(horizontal = 16.dp).fillMaxWidth()) {
                        Text("Aún no hay archivos", style = MaterialTheme.typography.titleSmall)
                        Text(
                            "Importa archivos autorizados o descarga enlaces directos y aparecerán aquí.",
                            style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                } else {
                    LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(state.summary.recent, key = { it.uri }) { RecentCard(it) { onOpenItem(it) } }
                    }
                }
            }
        }

        // ---------- Acceso rápido + almacenamiento
        item {
            Row(Modifier.padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                QuickCard(
                    Icons.Rounded.VideoLibrary, MfColors.Violet, "Biblioteca",
                    "${state.summary.videoCount} vídeos · ${state.summary.audioCount} canciones", Modifier.weight(1f), onOpenLibrary,
                )
                QuickCard(Icons.Rounded.GraphicEq, MfColors.Cyan, "Convertir", "MP4 · M4A · WAV · AAC", Modifier.weight(1f), onOpenConverter)
            }
        }
        item { state.storage?.let { StorageCard(it.availableBytes, it.totalBytes, it.appCacheBytes) } }
    }

    state.analysis?.let { analysis ->
        AnalysisSheet(
            analysis = analysis,
            isFavorite = state.isFavorite,
            onDismiss = vm::dismissAnalysis,
            onDownload = vm::startDownload,
            onToggleFavorite = vm::toggleFavorite,
            onImport = { importLauncher.launch(arrayOf("video/*", "audio/*", "image/*")) },
        )
    }
}

@Composable
private fun PlatformTile(monogram: String, name: String, color: Color, modifier: Modifier, onClick: () -> Unit) {
    MfCard(modifier, onClick = onClick, contentPadding = PaddingValues(vertical = 12.dp, horizontal = 4.dp)) {
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Monogram(monogram, color, size = 40.dp)
            Text(name, style = MaterialTheme.typography.labelMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
private fun ImportTile(modifier: Modifier, onClick: () -> Unit) {
    MfCard(modifier, onClick = onClick, contentPadding = PaddingValues(vertical = 12.dp, horizontal = 4.dp)) {
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            IconBadge(Icons.Rounded.FileUpload, MaterialTheme.colorScheme.onSurfaceVariant, size = 40.dp)
            Text("Importar", style = MaterialTheme.typography.labelMedium, maxLines = 1)
        }
    }
}

@Composable
private fun ActiveDownloadRow(t: DownloadTask) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(t.fileName, style = MaterialTheme.typography.titleSmall, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
            Text(
                t.progress?.let { "${(it * 100).toInt()} %" } ?: Format.bytes(t.bytesDownloaded),
                style = NumericStyle, color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        FlowProgressBar(if (t.status.name == "RUNNING") t.progress else t.progress ?: 0f)
        Text(
            when (t.status) {
                com.mediaflow.domain.model.DownloadStatus.PAUSED -> "En pausa"
                com.mediaflow.domain.model.DownloadStatus.QUEUED -> t.errorMessage ?: "En cola"
                else -> Format.speed(t.speedBps) + " · " + Format.eta(t.etaSeconds)
            },
            style = NumericStyle, color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun RecentCard(item: LibraryItem, onClick: () -> Unit) {
    MfCard(Modifier.width(150.dp), onClick = onClick, contentPadding = PaddingValues(8.dp)) {
        Box {
            if (item.kind == MediaKind.VIDEO || item.kind == MediaKind.AUDIO || item.kind == MediaKind.IMAGE) {
                MediaThumbnail(item.uri, item.kind.icon(), ThumbShape, Modifier.fillMaxWidth().aspectRatio(1.35f))
            } else {
                Box(
                    Modifier.fillMaxWidth().aspectRatio(1.35f).clip(ThumbShape).background(item.kind.tint().copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center,
                ) { Icon(item.kind.icon(), null, tint = item.kind.tint()) }
            }
            item.durationMs?.let {
                Text(
                    Format.duration(it), color = Color.White, style = NumericStyle,
                    modifier = Modifier.align(Alignment.BottomEnd).padding(6.dp).clip(RoundedCornerShape(6.dp))
                        .background(Color.Black.copy(alpha = 0.55f)).padding(horizontal = 5.dp, vertical = 1.dp),
                )
            }
        }
        Spacer(Modifier.height(8.dp))
        Text(item.name, style = MaterialTheme.typography.labelLarge, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(horizontal = 4.dp))
        Text(
            Format.bytes(item.sizeBytes), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp),
        )
    }
}

@Composable
private fun QuickCard(icon: androidx.compose.ui.graphics.vector.ImageVector, tint: Color, title: String, subtitle: String, modifier: Modifier, onClick: () -> Unit) {
    MfCard(modifier, onClick = onClick) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconBadge(icon, tint)
            Spacer(Modifier.weight(1f))
            Icon(Icons.Rounded.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Spacer(Modifier.height(14.dp))
        Text(title, style = MaterialTheme.typography.titleMedium)
        Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun StorageCard(available: Long, total: Long, cache: Long) {
    val used = if (total > 0) 1f - available.toFloat() / total else 0f
    MfCard(Modifier.padding(horizontal = 16.dp).fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconBadge(Icons.Rounded.SdStorage, MfColors.Azure)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text("Espacio disponible", style = MaterialTheme.typography.titleSmall)
                Text("${Format.bytes(available)} libres de ${Format.bytes(total)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text("${(used * 100).toInt()} %", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.height(12.dp))
        FlowProgressBar(used, height = 8.dp)
        Spacer(Modifier.height(8.dp))
        Row {
            Icon(Icons.Rounded.AutoAwesome, null, Modifier.size(14.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.width(6.dp))
            Text("Temporales de MediaFlow: ${Format.bytes(cache)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
