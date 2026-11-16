package com.mediaflow.presentation.converter

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AddCircleOutline
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.DeleteSweep
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.GraphicEq
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Movie
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mediaflow.core.designsystem.MfColors
import com.mediaflow.core.designsystem.MfTheme
import com.mediaflow.core.designsystem.NumericStyle
import com.mediaflow.core.ui.FlowProgressBar
import com.mediaflow.core.ui.GradientButton
import com.mediaflow.core.ui.IconBadge
import com.mediaflow.core.ui.MfCard
import com.mediaflow.core.ui.SectionHeader
import com.mediaflow.core.ui.StatusChip
import com.mediaflow.core.util.Format
import com.mediaflow.domain.model.AudioQuality
import com.mediaflow.domain.model.ConversionFormat
import com.mediaflow.domain.model.ConversionStatus
import com.mediaflow.domain.model.FeatureGate
import com.mediaflow.domain.model.MediaKind
import com.mediaflow.domain.model.PlayableItem
import com.mediaflow.domain.model.Tier
import com.mediaflow.presentation.util.Intents
import com.mediaflow.presentation.util.ScreenHeader
import com.mediaflow.presentation.util.mfTextFieldColors

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ConverterScreen(
    vm: ConverterViewModel,
    initialSource: Uri?,
    onPlay: (PlayableItem) -> Unit,
    onOpenPremium: () -> Unit,
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val tier by vm.tier.collectAsStateWithLifecycle()
    val history by vm.history.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { it?.let(vm::select) }

    LaunchedEffect(initialSource) { if (initialSource != null && state.source != initialSource) vm.select(initialSource) }
    LaunchedEffect(Unit) { vm.premiumPrompt.collect { onOpenPremium() } }

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            ScreenHeader("Convertir", "Procesado local: tus archivos no salen del dispositivo")
        }
        item {
            Box(Modifier.padding(horizontal = 16.dp)) {
                AnimatedContent(state.probe, label = "source") { probe ->
                    if (probe == null) {
                        Column(
                            Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp))
                                .border(BorderStroke(1.5.dp, MaterialTheme.colorScheme.outline), RoundedCornerShape(24.dp))
                                .clickable { picker.launch(arrayOf("video/*", "audio/*")) }.padding(28.dp),
                            horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            if (state.probing) CircularProgressIndicator(Modifier.size(36.dp)) else IconBadge(Icons.Rounded.AddCircleOutline, MfColors.Violet, size = 56.dp)
                            Text("Selecciona un vídeo o audio", style = MaterialTheme.typography.titleMedium)
                            Text("Solo archivos locales de los que tengas derechos", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    } else {
                        MfCard(Modifier.fillMaxWidth()) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                IconBadge(if (probe.hasVideo) Icons.Rounded.Movie else Icons.Rounded.GraphicEq, if (probe.hasVideo) MfColors.Violet else MfColors.Cyan)
                                Spacer(Modifier.width(12.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(probe.displayName, style = MaterialTheme.typography.titleSmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text(if (probe.hasVideo) "Vídeo${if (probe.hasAudio) " con audio" else " sin audio"}" else "Audio", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                TextButton(onClick = { picker.launch(arrayOf("video/*", "audio/*")) }, enabled = !state.running) { Text("Cambiar") }
                            }
                            Spacer(Modifier.height(12.dp))
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                InfoPill("Duración", Format.duration(probe.durationMs))
                                InfoPill("Tamaño", Format.bytes(probe.sizeBytes))
                                if (probe.width != null && probe.height != null) InfoPill("Vídeo", "${probe.width}×${probe.height}")
                                probe.sampleRate?.let { InfoPill("Audio", "${it / 1000.0} kHz · ${probe.channels ?: "?"} can.") }
                                probe.audioMime?.let { InfoPill("Códec", it.substringAfter('/')) }
                            }
                        }
                    }
                }
            }
        }
        state.error?.let { err ->
            item {
                Row(
                    Modifier.padding(horizontal = 16.dp).fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(MfTheme.extended.danger.copy(alpha = 0.12f)).padding(14.dp),
                ) {
                    Icon(Icons.Rounded.ErrorOutline, null, tint = MfTheme.extended.danger)
                    Spacer(Modifier.width(10.dp))
                    Text(err, style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
        item {
            Column(Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                SectionHeader("Formato de salida", Modifier.padding(start = 4.dp))
                FlowRow(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp), maxItemsInEachRow = 3) {
                    ConversionFormat.entries.forEach { f ->
                        val available = vm.isAvailable(f)
                        val needsVideo = f == ConversionFormat.MP4 && state.probe?.hasVideo == false
                        FormatTile(
                            f, selected = state.format == f,
                            enabled = available && !needsVideo && !state.running,
                            locked = !FeatureGate.canUseFormat(tier, f),
                            unavailable = !available,
                            modifier = Modifier.weight(1f),
                        ) { vm.setFormat(f) }
                    }
                }
                Text(
                    if (!vm.isAvailable(state.format)) "" else state.format.description +
                        if (!vm.isAvailable(ConversionFormat.MP3)) ". MP3 requiere un motor FFmpeg/LAME opcional no incluido por licencias." else "",
                    style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        if (state.qualityApplies) {
            item {
                Column(Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    SectionHeader("Calidad de audio", Modifier.padding(start = 4.dp))
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        AudioQuality.entries.forEach { q ->
                            QualityChip(q.label, state.quality == q, !FeatureGate.canUseQuality(tier, q), !state.running) { vm.setQuality(q) }
                        }
                    }
                }
            }
        }
        if (state.probe != null) {
            item {
                MfCard(Modifier.padding(horizontal = 16.dp).fillMaxWidth().animateContentSize()) {
                    OutlinedTextField(
                        value = state.outputName, onValueChange = vm::setOutputName, label = { Text("Nombre del archivo") },
                        suffix = { Text(".${state.format.extension}") }, singleLine = true, enabled = !state.running,
                        modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp), colors = mfTextFieldColors(),
                    )
                    Spacer(Modifier.height(14.dp))
                    Row {
                        Column(Modifier.weight(1f)) {
                            Text("Duración", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(Format.duration(state.probe?.durationMs), style = MaterialTheme.typography.titleMedium)
                        }
                        Column(Modifier.weight(1f)) {
                            Text("Tamaño estimado", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(state.estimate?.let { "≈ " + Format.bytes(it) } ?: "—", style = MaterialTheme.typography.titleMedium)
                        }
                    }
                    val tooLong = tier == Tier.FREE && (state.probe?.durationMs ?: 0) > FeatureGate.FREE_MAX_CONVERSION_MS
                    if (tooLong) {
                        Spacer(Modifier.height(10.dp))
                        Text(
                            "La versión gratuita convierte archivos de hasta 15 minutos. Premium elimina el límite.",
                            style = MaterialTheme.typography.bodySmall, color = MfTheme.extended.warning,
                        )
                    }
                    Spacer(Modifier.height(16.dp))
                    if (state.running) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Convirtiendo…", style = MaterialTheme.typography.titleSmall, modifier = Modifier.weight(1f))
                            Text("${(state.progress * 100).toInt()} %", style = NumericStyle)
                        }
                        Spacer(Modifier.height(8.dp))
                        FlowProgressBar(state.progress, height = 8.dp)
                        Spacer(Modifier.height(10.dp))
                        OutlinedButton(onClick = vm::cancel, modifier = Modifier.fillMaxWidth()) { Text("Cancelar") }
                    } else {
                        GradientButton(
                            if (tooLong) "Desbloquear con Premium" else "Convertir a ${state.format.label}",
                            onClick = { if (tooLong) onOpenPremium() else vm.convert() },
                            modifier = Modifier.fillMaxWidth(), icon = Icons.Rounded.GraphicEq,
                            enabled = vm.isAvailable(state.format) && state.outputName.isNotBlank(),
                        )
                    }
                    state.result?.let { r ->
                        Spacer(Modifier.height(16.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Rounded.CheckCircle, null, tint = MfTheme.extended.success)
                            Spacer(Modifier.width(8.dp))
                            Column(Modifier.weight(1f)) {
                                Text("Guardado: ${r.displayName}", style = MaterialTheme.typography.titleSmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Text(Format.bytes(r.sizeBytes), style = NumericStyle, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                        Spacer(Modifier.height(10.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            FilledTonalButton(onClick = {
                                onPlay(PlayableItem(r.uri.toString(), r.displayName, "Convertido con MediaFlow", state.format == ConversionFormat.MP4))
                            }, modifier = Modifier.weight(1f)) { Icon(Icons.Rounded.PlayArrow, null); Spacer(Modifier.width(6.dp)); Text("Reproducir") }
                            FilledTonalButton(onClick = { Intents.share(context, listOf(r.uri.toString()), state.format.mimeType) }, modifier = Modifier.weight(1f)) {
                                Icon(Icons.Rounded.Share, null); Spacer(Modifier.width(6.dp)); Text("Compartir")
                            }
                        }
                    }
                }
            }
        }
        item {
            Row(
                Modifier.padding(horizontal = 20.dp), verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Rounded.Shield, null, Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.width(8.dp))
                Text(
                    "Usa la conversión solo con contenido propio o con licencia que lo permita.",
                    style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        if (history.isNotEmpty()) {
            item {
                Row(Modifier.padding(start = 20.dp, end = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    SectionHeader("Historial", Modifier.weight(1f))
                    IconButton(onClick = { vm.clearHistory() }) { Icon(Icons.Rounded.DeleteSweep, "Borrar historial") }
                }
            }
            items(history.take(20), key = { it.id }) { rec ->
                MfCard(
                    Modifier.padding(horizontal = 16.dp).fillMaxWidth(), contentPadding = PaddingValues(14.dp),
                    onClick = rec.outputUri?.let { uri ->
                        { onPlay(PlayableItem(uri, rec.outputName, rec.sourceName, MediaKind.fromMime(rec.format.mimeType) == MediaKind.VIDEO)) }
                    },
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(rec.outputName, style = MaterialTheme.typography.titleSmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text(
                                "${rec.format.label}${rec.qualityKbps?.let { " · $it kbps" } ?: ""} · ${Format.dateTime(rec.createdAt)}",
                                style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            rec.errorMessage?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MfTheme.extended.danger, maxLines = 2) }
                        }
                        val ext = MfTheme.extended
                        when (rec.status) {
                            ConversionStatus.COMPLETED -> StatusChip("Lista", ext.success)
                            ConversionStatus.FAILED -> StatusChip("Error", ext.danger)
                            ConversionStatus.CANCELLED -> StatusChip("Cancelada", MaterialTheme.colorScheme.onSurfaceVariant)
                            ConversionStatus.RUNNING -> StatusChip("En curso", MfColors.Azure)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun InfoPill(label: String, value: String) {
    Row(
        Modifier.clip(RoundedCornerShape(10.dp)).background(MaterialTheme.colorScheme.surfaceContainerHighest).padding(horizontal = 10.dp, vertical = 6.dp),
    ) {
        Text("$label ", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun FormatTile(
    f: ConversionFormat, selected: Boolean, enabled: Boolean, locked: Boolean, unavailable: Boolean,
    modifier: Modifier, onClick: () -> Unit,
) {
    val border = if (selected) MaterialTheme.colorScheme.primary else MfTheme.extended.cardBorder
    Column(
        modifier.clip(RoundedCornerShape(18.dp))
            .background(if (selected) MaterialTheme.colorScheme.primary.copy(alpha = 0.14f) else MaterialTheme.colorScheme.surfaceContainer)
            .border(if (selected) 1.5.dp else 1.dp, border, RoundedCornerShape(18.dp))
            .clickable(enabled = enabled || locked, onClick = onClick)
            .padding(vertical = 14.dp, horizontal = 10.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                f.label, style = MaterialTheme.typography.titleMedium,
                color = if (enabled || locked) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
            )
            if (locked || unavailable) {
                Spacer(Modifier.width(4.dp))
                Icon(Icons.Rounded.Lock, null, Modifier.size(14.dp), tint = if (locked && !unavailable) MfColors.Violet else MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Text(
            when { unavailable -> "No incluido"; f.audioOnly -> "Audio"; else -> "Vídeo" },
            style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun QualityChip(label: String, selected: Boolean, locked: Boolean, enabled: Boolean, onClick: () -> Unit) {
    Row(
        Modifier.clip(RoundedCornerShape(12.dp))
            .background(if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceContainerHigh)
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(label, style = MaterialTheme.typography.labelLarge, color = if (selected) Color.White else MaterialTheme.colorScheme.onSurface)
        if (locked) { Spacer(Modifier.width(4.dp)); Icon(Icons.Rounded.Lock, null, Modifier.size(13.dp), tint = MfColors.Violet) }
    }
}
