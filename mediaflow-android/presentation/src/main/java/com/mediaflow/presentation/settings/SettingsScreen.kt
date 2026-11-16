package com.mediaflow.presentation.settings

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.HelpOutline
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material.icons.rounded.CleaningServices
import androidx.compose.material.icons.rounded.DarkMode
import androidx.compose.material.icons.rounded.FolderOpen
import androidx.compose.material.icons.rounded.GraphicEq
import androidx.compose.material.icons.rounded.HighQuality
import androidx.compose.material.icons.rounded.Notifications
import androidx.compose.material.icons.rounded.PlayCircle
import androidx.compose.material.icons.rounded.PrivacyTip
import androidx.compose.material.icons.rounded.Speed
import androidx.compose.material.icons.rounded.Wifi
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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
import androidx.compose.ui.unit.dp
import androidx.documentfile.provider.DocumentFile
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mediaflow.core.designsystem.MfColors
import com.mediaflow.core.ui.FlowProgressBar
import com.mediaflow.core.ui.IconBadge
import com.mediaflow.core.ui.MfCard
import com.mediaflow.core.ui.SectionHeader
import com.mediaflow.core.util.Format
import com.mediaflow.domain.model.AudioQuality
import com.mediaflow.domain.model.ConversionFormat
import com.mediaflow.domain.model.ThemeMode
import com.mediaflow.domain.model.Tier
import com.mediaflow.presentation.downloads.SegmentedTabs
import com.mediaflow.presentation.util.ScreenHeader

@Composable
fun SettingsScreen(vm: SettingsViewModel, snackbar: SnackbarHostState, onOpenPremium: () -> Unit, onOpenAbout: () -> Unit) {
    val s by vm.settings.collectAsStateWithLifecycle()
    val tier by vm.tier.collectAsStateWithLifecycle()
    val stats by vm.stats.collectAsStateWithLifecycle()
    val context = LocalContext.current

    val folderPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocumentTree()) { uri ->
        if (uri != null) {
            context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            vm.setFolder(uri)
        }
    }
    val notifPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        vm.update { it.copy(notificationsEnabled = granted) }
    }
    LaunchedEffect(Unit) { vm.messages.collect { snackbar.showSnackbar(it) } }

    val folderName = remember(s.customFolderUri) {
        s.customFolderUri?.let { DocumentFile.fromTreeUri(context, Uri.parse(it))?.name } 
    }

    Column(Modifier.fillMaxSize()) {
    ScreenHeader("Ajustes", "Personaliza MediaFlow")
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 32.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {

        item {
            MfCard(Modifier.fillMaxWidth(), onClick = onOpenPremium, containerColor = Color.Transparent) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(44.dp).clip(RoundedCornerShape(14.dp)).background(MfColors.brand), contentAlignment = Alignment.Center) {
                        Icon(Icons.Rounded.AutoAwesome, null, tint = Color.White)
                    }
                    Spacer(Modifier.width(14.dp))
                    Column(Modifier.weight(1f)) {
                        Text(if (tier == Tier.PREMIUM) "MediaFlow Premium" else "MediaFlow Gratis", style = MaterialTheme.typography.titleMedium)
                        Text(
                            if (tier == Tier.PREMIUM) "Todas las funciones desbloqueadas" else "Descubre conversión avanzada y más",
                            style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Icon(Icons.Rounded.ChevronRight, null)
                }
            }
        }

        item {
            Group("Apariencia") {
                RowLabel(Icons.Rounded.DarkMode, "Tema")
                Spacer(Modifier.height(10.dp))
                SegmentedTabs(ThemeMode.entries.map { it.label to null }, s.themeMode.ordinal, { i -> vm.update { it.copy(themeMode = ThemeMode.entries[i]) } })
            }
        }

        item {
            Group("Almacenamiento") {
                SettingRow(Icons.Rounded.FolderOpen, "Ubicación de guardado",
                    folderName?.let { "Carpeta personalizada: $it" } ?: "Carpetas MediaFlow (Películas, Música, Descargas)",
                    onClick = { folderPicker.launch(null) })
                if (s.customFolderUri != null) {
                    TextButton(onClick = { vm.setFolder(null) }, modifier = Modifier.padding(start = 44.dp)) { Text("Restablecer a carpetas del sistema") }
                }
                stats?.let { st ->
                    Spacer(Modifier.height(8.dp))
                    val used = if (st.totalBytes > 0) 1f - st.availableBytes.toFloat() / st.totalBytes else 0f
                    FlowProgressBar(used, height = 8.dp)
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "${Format.bytes(st.availableBytes)} libres de ${Format.bytes(st.totalBytes)} · temporales ${Format.bytes(st.appCacheBytes)}",
                        style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                SettingRow(Icons.Rounded.CleaningServices, "Liberar espacio", "Elimina temporales y descargas parciales huérfanas", onClick = vm::clearTemporary)
            }
        }

        item {
            Group("Descargas y conversión") {
                SwitchRow(Icons.Rounded.Wifi, "Solo con Wi-Fi", "Las descargas esperan a una red sin límite de datos", s.wifiOnlyDownloads) { v -> vm.update { it.copy(wifiOnlyDownloads = v) } }
                ChoiceRow(Icons.Rounded.GraphicEq, "Formato predeterminado", s.defaultFormat.label,
                    ConversionFormat.entries.filter { it != ConversionFormat.MP3 }.map { it.label to { vm.update { st -> st.copy(defaultFormat = it) } } })
                ChoiceRow(Icons.Rounded.HighQuality, "Calidad predeterminada", s.defaultQuality.label,
                    AudioQuality.entries.map { it.label to { vm.update { st -> st.copy(defaultQuality = it) } } })
            }
        }

        item {
            Group("Notificaciones") {
                SwitchRow(Icons.Rounded.Notifications, "Avisos de descarga", "Progreso y resultado de las descargas", s.notificationsEnabled) { v ->
                    if (v && Build.VERSION.SDK_INT >= 33) notifPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
                    else vm.update { it.copy(notificationsEnabled = v) }
                }
            }
        }

        item {
            Group("Reproducción") {
                ChoiceRow(Icons.Rounded.Speed, "Velocidad predeterminada", "${s.playbackSpeed}×",
                    listOf(0.75f, 1f, 1.25f, 1.5f, 2f).map { sp -> "${sp}×" to { vm.update { it.copy(playbackSpeed = sp) } } })
                SwitchRow(Icons.Rounded.PlayCircle, "Audio en segundo plano", "Sigue sonando con la pantalla apagada o en otra app", s.backgroundAudio) { v ->
                    vm.update { it.copy(backgroundAudio = v) }
                }
            }
        }

        item {
            Group("Privacidad") {
                Row(Modifier.padding(vertical = 4.dp)) {
                    Icon(Icons.Rounded.PrivacyTip, null, tint = MfColors.Cyan)
                    Spacer(Modifier.width(12.dp))
                    Text(
                        "MediaFlow no tiene cuentas, no guarda credenciales de plataformas, no incluye analíticas y no envía tus archivos a ningún servidor. Todo se almacena en este dispositivo.",
                        style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                TextButton(onClick = vm::clearDownloadHistory) { Text("Borrar historial de descargas") }
                TextButton(onClick = vm::clearConversionHistory) { Text("Borrar historial de conversiones") }
                TextButton(onClick = vm::clearFavorites) { Text("Borrar enlaces favoritos") }
            }
        }

        item {
            Group("Información") {
                SettingRow(Icons.AutoMirrored.Rounded.HelpOutline, "Acerca de MediaFlow", "Versión ${vm.appVersion} · licencias y uso responsable", onClick = onOpenAbout)
            }
        }
    }
    }
}

@Composable
private fun Group(title: String, content: @Composable ColumnScope.() -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        SectionHeader(title, Modifier.padding(start = 4.dp))
        MfCard(Modifier.fillMaxWidth(), content = content)
    }
}

@Composable
private fun RowLabel(icon: ImageVector, title: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.width(12.dp))
        Text(title, style = MaterialTheme.typography.titleSmall)
    }
}

@Composable
private fun SettingRow(icon: ImageVector, title: String, subtitle: String, onClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).clickable(onClick = onClick).padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleSmall)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Icon(Icons.Rounded.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun SwitchRow(icon: ImageVector, title: String, subtitle: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().clickable { onChange(!checked) }.padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleSmall)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Spacer(Modifier.width(8.dp))
        Switch(checked, onChange, colors = SwitchDefaults.colors(checkedTrackColor = MaterialTheme.colorScheme.primary))
    }
}

@Composable
private fun ChoiceRow(icon: ImageVector, title: String, value: String, options: List<Pair<String, () -> Unit>>) {
    var open by remember { mutableStateOf(false) }
    Box {
        Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).clickable { open = true }.padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.width(12.dp))
            Text(title, style = MaterialTheme.typography.titleSmall, modifier = Modifier.weight(1f))
            Text(value, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
        }
        DropdownMenu(open, { open = false }) {
            options.forEach { (label, action) -> DropdownMenuItem(text = { Text(label) }, onClick = { open = false; action() }) }
        }
    }
}
