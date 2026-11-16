package com.mediaflow.presentation.util

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Article
import androidx.compose.material.icons.rounded.AudioFile
import androidx.compose.material.icons.rounded.Image
import androidx.compose.material.icons.rounded.InsertDriveFile
import androidx.compose.material.icons.rounded.Movie
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.mediaflow.core.designsystem.MfColors
import com.mediaflow.domain.model.MediaKind

val CardShape = RoundedCornerShape(24.dp)
val TileShape = RoundedCornerShape(18.dp)
val ThumbShape = RoundedCornerShape(14.dp)

fun MediaKind.icon(): ImageVector = when (this) {
    MediaKind.VIDEO -> Icons.Rounded.Movie
    MediaKind.AUDIO -> Icons.Rounded.AudioFile
    MediaKind.IMAGE -> Icons.Rounded.Image
    MediaKind.DOCUMENT -> Icons.Rounded.Article
    MediaKind.OTHER -> Icons.Rounded.InsertDriveFile
}

fun MediaKind.tint(): Color = when (this) {
    MediaKind.VIDEO -> MfColors.Violet
    MediaKind.AUDIO -> MfColors.Cyan
    MediaKind.IMAGE -> MfColors.Azure
    MediaKind.DOCUMENT -> MfColors.Warning
    MediaKind.OTHER -> MfColors.Mist
}

/** Cabecera de pantalla principal: título grande alineado a la izquierda, al estilo editorial. */
@Composable
fun ScreenHeader(title: String, subtitle: String? = null, actions: @Composable () -> Unit = {}) {
    Row(
        Modifier.fillMaxWidth().statusBarsPadding().padding(start = 20.dp, end = 8.dp, top = 12.dp, bottom = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, style = MaterialTheme.typography.headlineMedium)
            if (subtitle != null) Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        actions()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BackTopBar(title: String, onBack: () -> Unit, actions: @Composable () -> Unit = {}) {
    TopAppBar(
        title = { Text(title, style = MaterialTheme.typography.titleLarge) },
        navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Rounded.ArrowBack, "Atrás") } },
        actions = { actions() },
        colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
    )
}

@Composable
fun mfTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = MaterialTheme.colorScheme.primary,
    unfocusedBorderColor = MaterialTheme.colorScheme.outline,
    focusedContainerColor = MaterialTheme.colorScheme.surfaceContainerLow,
    unfocusedContainerColor = MaterialTheme.colorScheme.surfaceContainerLow,
)
