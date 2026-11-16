package com.mediaflow.presentation.home

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.OpenInNew
import androidx.compose.material.icons.rounded.Bookmark
import androidx.compose.material.icons.rounded.BookmarkBorder
import androidx.compose.material.icons.rounded.Download
import androidx.compose.material.icons.rounded.ExpandLess
import androidx.compose.material.icons.rounded.ExpandMore
import androidx.compose.material.icons.rounded.FileUpload
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.VerifiedUser
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.mediaflow.core.designsystem.MfColors
import com.mediaflow.core.ui.GradientButton
import com.mediaflow.core.ui.MfCard
import com.mediaflow.core.ui.Monogram
import com.mediaflow.core.util.Format
import com.mediaflow.domain.model.LinkAnalysis
import com.mediaflow.domain.model.Platform
import com.mediaflow.domain.model.PlatformAction
import com.mediaflow.presentation.di.LocalAppDependencies
import com.mediaflow.presentation.util.Intents

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AnalysisSheet(
    analysis: LinkAnalysis,
    isFavorite: Boolean,
    onDismiss: () -> Unit,
    onDownload: (PlatformAction.DirectDownload) -> Unit,
    onToggleFavorite: () -> Unit,
    onImport: () -> Unit,
) {
    val sheet = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val deps = LocalAppDependencies.current
    val context = LocalContext.current
    val module = deps.platforms.moduleFor(analysis.platform)
    val accent = module?.let { Color(it.accentArgb) } ?: MfColors.Violet

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheet, containerColor = MaterialTheme.colorScheme.surfaceContainer) {
        Column(
            Modifier.verticalScroll(rememberScrollState()).padding(horizontal = 20.dp).navigationBarsPadding().padding(bottom = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Monogram(module?.monogram ?: if (analysis.platform == Platform.DIRECT) "↓" else "WEB", accent, size = 44.dp)
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(analysis.platform.displayName, style = MaterialTheme.typography.titleMedium)
                    Text(analysis.url, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }

            analysis.metadata?.let { meta ->
                MfCard(Modifier.fillMaxWidth(), containerColor = MaterialTheme.colorScheme.surfaceContainerHigh) {
                    meta.thumbnailUrl?.let {
                        AsyncImage(
                            model = it, contentDescription = null, contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxWidth().aspectRatio(16f / 9f).clip(RoundedCornerShape(14.dp)),
                        )
                        Spacer(Modifier.height(12.dp))
                    }
                    meta.title?.let { Text(it, style = MaterialTheme.typography.titleMedium, maxLines = 3, overflow = TextOverflow.Ellipsis) }
                    meta.author?.let { Text(it, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                    Spacer(Modifier.height(6.dp))
                    Text("Fuente: ${meta.source}", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            Row(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp))
                    .background((if (analysis.directDownload != null) MfColors.Success else MfColors.Azure).copy(alpha = 0.12f))
                    .padding(14.dp),
                verticalAlignment = Alignment.Top,
            ) {
                Icon(
                    if (analysis.directDownload != null) Icons.Rounded.VerifiedUser else Icons.Rounded.Info, null,
                    tint = if (analysis.directDownload != null) MfColors.Success else MfColors.Azure, modifier = Modifier.size(20.dp),
                )
                Spacer(Modifier.width(10.dp))
                Text(analysis.notice, style = MaterialTheme.typography.bodyMedium)
            }

            analysis.actions.forEach { action ->
                when (action) {
                    is PlatformAction.DirectDownload -> Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        GradientButton(
                            text = "Descargar" + (action.sizeBytes?.let { " · ${Format.bytes(it)}" } ?: ""),
                            onClick = { onDownload(action) },
                            icon = Icons.Rounded.Download,
                            modifier = Modifier.fillMaxWidth(),
                        )
                        Text(
                            buildString {
                                append(action.suggestedFileName)
                                action.mimeType?.let { append(" · ").append(it) }
                                append(if (action.supportsResume) " · admite pausa y reanudación" else " · el servidor no admite reanudar")
                            },
                            style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    is PlatformAction.OpenInOfficialApp -> ActionButton(Icons.AutoMirrored.Rounded.OpenInNew, "Abrir en ${action.appName}") {
                        Intents.openUrl(context, action.url, action.packageName)
                    }
                    is PlatformAction.OfficialDownloadGuide -> GuideCard(action)
                    PlatformAction.ImportAuthorizedFile -> ActionButton(Icons.Rounded.FileUpload, "Importar un archivo autorizado", onImport)
                    is PlatformAction.SaveToFavorites -> ActionButton(
                        if (isFavorite) Icons.Rounded.Bookmark else Icons.Rounded.BookmarkBorder,
                        if (isFavorite) "Guardado en favoritos" else "Guardar enlace en favoritos",
                        onToggleFavorite,
                    )
                }
            }
        }
    }
}

@Composable
private fun ActionButton(icon: ImageVector, label: String, onClick: () -> Unit) {
    OutlinedButton(onClick = onClick, modifier = Modifier.fillMaxWidth().height(50.dp), shape = RoundedCornerShape(16.dp)) {
        Icon(icon, null, Modifier.size(20.dp))
        Spacer(Modifier.width(10.dp))
        Text(label, modifier = Modifier.weight(1f))
    }
}

@Composable
fun GuideCard(guide: PlatformAction.OfficialDownloadGuide, initiallyExpanded: Boolean = false) {
    var expanded by remember { mutableStateOf(initiallyExpanded) }
    val context = LocalContext.current
    MfCard(Modifier.fillMaxWidth().animateContentSize(), onClick = { expanded = !expanded }, containerColor = MaterialTheme.colorScheme.surfaceContainerHigh) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(guide.title, style = MaterialTheme.typography.titleSmall)
                Text(guide.summary, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Icon(if (expanded) Icons.Rounded.ExpandLess else Icons.Rounded.ExpandMore, null)
        }
        AnimatedVisibility(expanded) {
            Column(Modifier.padding(top = 12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                guide.steps.forEachIndexed { i, step ->
                    Row {
                        Box(Modifier.size(22.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary.copy(alpha = 0.16f)), contentAlignment = Alignment.Center) {
                            Text("${i + 1}", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.width(10.dp))
                        Text(step, style = MaterialTheme.typography.bodyMedium)
                    }
                }
                guide.helpUrl?.let { url ->
                    TextButton(onClick = { Intents.openUrl(context, url) }) { Text("Centro de ayuda oficial") }
                }
            }
        }
    }
}
