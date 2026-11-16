package com.mediaflow.presentation.player

import android.app.Activity
import android.content.pm.ActivityInfo
import android.view.ViewGroup
import androidx.annotation.OptIn
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.QueueMusic
import androidx.compose.material.icons.automirrored.rounded.VolumeUp
import androidx.compose.material.icons.rounded.Bedtime
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Forward10
import androidx.compose.material.icons.rounded.Fullscreen
import androidx.compose.material.icons.rounded.FullscreenExit
import androidx.compose.material.icons.rounded.GraphicEq
import androidx.compose.material.icons.rounded.KeyboardArrowDown
import androidx.compose.material.icons.rounded.MusicNote
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Repeat
import androidx.compose.material.icons.rounded.RepeatOne
import androidx.compose.material.icons.rounded.Replay10
import androidx.compose.material.icons.rounded.Shuffle
import androidx.compose.material.icons.rounded.SkipNext
import androidx.compose.material.icons.rounded.SkipPrevious
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.media3.common.util.UnstableApi
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import com.mediaflow.core.designsystem.MfColors
import com.mediaflow.core.designsystem.NumericStyle
import com.mediaflow.core.ui.MediaThumbnail
import com.mediaflow.core.util.Format
import com.mediaflow.domain.model.Tier
import com.mediaflow.player.PlayerConnection
import com.mediaflow.player.RepeatMode
import kotlinx.coroutines.delay

private val BASE_SPEEDS = listOf(0.5f, 0.75f, 1f, 1.25f, 1.5f, 1.75f, 2f)
private val PREMIUM_SPEEDS = listOf(2.5f, 3f)

@OptIn(UnstableApi::class)
@kotlin.OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlayerScreen(connection: PlayerConnection, tier: Tier, onBack: () -> Unit, onOpenPremium: () -> Unit) {
    val s by connection.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val activity = context as? Activity
    var fullscreen by androidx.compose.runtime.saveable.rememberSaveable { mutableStateOf(false) }
    var controlsVisible by remember { mutableStateOf(true) }
    var queueOpen by remember { mutableStateOf(false) }
    var speedMenu by remember { mutableStateOf(false) }
    var sleepMenu by remember { mutableStateOf(false) }
    var scrubbing by remember { mutableStateOf(false) }
    var scrubValue by remember { mutableFloatStateOf(0f) }

    // Pantalla completa: orientación horizontal y barras del sistema ocultas.
    DisposableEffect(fullscreen) {
        val window = activity?.window
        if (window != null) {
            val controller = WindowCompat.getInsetsController(window, window.decorView)
            if (fullscreen) {
                activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
                controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                controller.hide(WindowInsetsCompat.Type.systemBars())
            } else {
                activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
                controller.show(WindowInsetsCompat.Type.systemBars())
            }
        }
        onDispose {}
    }
    DisposableEffect(Unit) {
        onDispose {
            activity?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
            activity?.window?.let { WindowCompat.getInsetsController(it, it.decorView).show(WindowInsetsCompat.Type.systemBars()) }
            // El vídeo no continúa al salir; el audio sí puede seguir en segundo plano.
            if (connection.state.value.isVideo) connection.pause()
        }
    }
    LaunchedEffect(controlsVisible, s.isPlaying, s.isVideo) {
        if (s.isVideo && controlsVisible && s.isPlaying) { delay(3500); controlsVisible = false }
    }

    if (!s.hasMedia) {
        Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("No hay nada reproduciéndose", style = MaterialTheme.typography.titleMedium)
                TextButton(onClick = onBack) { Text("Volver") }
            }
        }
        return
    }

    val bg = if (s.isVideo) Color.Black else MaterialTheme.colorScheme.background
    Box(Modifier.fillMaxSize().background(bg)) {
        if (s.isVideo) {
            AndroidView(
                factory = { ctx ->
                    PlayerView(ctx).apply {
                        useController = false
                        resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
                        layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
                        setShutterBackgroundColor(android.graphics.Color.BLACK)
                    }
                },
                update = { it.player = connection.player },
                onRelease = { it.player = null },
                modifier = Modifier.fillMaxSize().clickable(remember { MutableInteractionSource() }, null) { controlsVisible = !controlsVisible },
            )
        } else {
            Box(
                Modifier.fillMaxSize().background(
                    Brush.verticalGradient(listOf(MfColors.Violet.copy(alpha = 0.28f), MfColors.Azure.copy(alpha = 0.06f), Color.Transparent)),
                ),
            )
        }

        AnimatedVisibility(!s.isVideo || controlsVisible, enter = fadeIn(), exit = fadeOut()) {
            val onMedia = if (s.isVideo) Color.White else MaterialTheme.colorScheme.onBackground
            val muted = if (s.isVideo) Color.White.copy(alpha = 0.7f) else MaterialTheme.colorScheme.onSurfaceVariant
            Column(
                Modifier.fillMaxSize()
                    .then(if (s.isVideo) Modifier.background(Brush.verticalGradient(listOf(Color.Black.copy(alpha = 0.6f), Color.Transparent, Color.Black.copy(alpha = 0.75f)))) else Modifier)
                    .statusBarsPadding().navigationBarsPadding().padding(horizontal = 16.dp),
            ) {
                Row(Modifier.fillMaxWidth().padding(top = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = { if (fullscreen) fullscreen = false else onBack() }) { Icon(Icons.Rounded.KeyboardArrowDown, "Cerrar", tint = onMedia) }
                    Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("REPRODUCIENDO", style = MaterialTheme.typography.labelSmall, color = muted)
                        if (s.queue.size > 1) Text("${s.currentIndex + 1} de ${s.queue.size}", style = MaterialTheme.typography.labelMedium, color = muted)
                    }
                    IconButton(onClick = { queueOpen = true }) { Icon(Icons.AutoMirrored.Rounded.QueueMusic, "Lista de reproducción", tint = onMedia) }
                }

                if (s.isVideo) Spacer(Modifier.weight(1f)) else {
                    Spacer(Modifier.weight(0.6f))
                    val uri = s.queue.getOrNull(s.currentIndex)?.uri
                    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                        if (uri != null) {
                            MediaThumbnail(uri, Icons.Rounded.MusicNote, RoundedCornerShape(32.dp), Modifier.fillMaxWidth(0.78f).aspectRatio(1f))
                        }
                    }
                    Spacer(Modifier.weight(0.4f))
                }

                Text(
                    s.title.ifBlank { "Sin título" }, style = MaterialTheme.typography.titleLarge, color = onMedia,
                    maxLines = 2, overflow = TextOverflow.Ellipsis, modifier = Modifier.fillMaxWidth(),
                    textAlign = if (s.isVideo) TextAlign.Start else TextAlign.Center,
                )
                s.subtitle?.let {
                    Text(it, style = MaterialTheme.typography.bodyMedium, color = muted, maxLines = 1, modifier = Modifier.fillMaxWidth(),
                        textAlign = if (s.isVideo) TextAlign.Start else TextAlign.Center)
                }
                Spacer(Modifier.height(12.dp))

                val duration = s.durationMs.coerceAtLeast(1)
                Slider(
                    value = if (scrubbing) scrubValue else (s.positionMs.toFloat() / duration).coerceIn(0f, 1f),
                    onValueChange = { scrubbing = true; scrubValue = it },
                    onValueChangeFinished = { connection.seekTo((scrubValue * duration).toLong()); scrubbing = false },
                    colors = SliderDefaults.colors(thumbColor = MfColors.Cyan, activeTrackColor = MfColors.Violet, inactiveTrackColor = onMedia.copy(alpha = 0.2f)),
                )
                Row(Modifier.fillMaxWidth()) {
                    Text(Format.duration(if (scrubbing) (scrubValue * duration).toLong() else s.positionMs), style = NumericStyle, color = muted)
                    Spacer(Modifier.weight(1f))
                    Text(Format.duration(s.durationMs), style = NumericStyle, color = muted)
                }
                Spacer(Modifier.height(8.dp))

                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    ToggleIcon(Icons.Rounded.Shuffle, "Aleatorio", s.shuffle, onMedia) { connection.toggleShuffle() }
                    IconButton(onClick = connection::previous) { Icon(Icons.Rounded.SkipPrevious, "Anterior", tint = onMedia, modifier = Modifier.size(30.dp)) }
                    IconButton(onClick = { connection.seekBy(-10_000) }) { Icon(Icons.Rounded.Replay10, "Retroceder 10 s", tint = onMedia) }
                    Box(
                        Modifier.size(72.dp).clip(CircleShape).background(MfColors.brand).clickable { connection.togglePlay() },
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(if (s.isPlaying) Icons.Rounded.Pause else Icons.Rounded.PlayArrow, if (s.isPlaying) "Pausar" else "Reproducir", tint = Color.White, modifier = Modifier.size(38.dp))
                    }
                    IconButton(onClick = { connection.seekBy(10_000) }) { Icon(Icons.Rounded.Forward10, "Adelantar 10 s", tint = onMedia) }
                    IconButton(onClick = connection::next) { Icon(Icons.Rounded.SkipNext, "Siguiente", tint = onMedia, modifier = Modifier.size(30.dp)) }
                    ToggleIcon(if (s.repeat == RepeatMode.ONE) Icons.Rounded.RepeatOne else Icons.Rounded.Repeat, "Repetir", s.repeat != RepeatMode.OFF, onMedia) { connection.cycleRepeat() }
                }
                Spacer(Modifier.height(10.dp))

                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.AutoMirrored.Rounded.VolumeUp, "Volumen", tint = muted, modifier = Modifier.size(20.dp))
                    Slider(
                        value = s.volume, onValueChange = connection::setVolume, modifier = Modifier.weight(1f).padding(horizontal = 8.dp),
                        colors = SliderDefaults.colors(thumbColor = onMedia, activeTrackColor = onMedia.copy(alpha = 0.8f), inactiveTrackColor = onMedia.copy(alpha = 0.2f)),
                    )
                    Box {
                        TextButton(onClick = { speedMenu = true }) { Text("${trimSpeed(s.speed)}×", color = onMedia, fontWeight = FontWeight.Bold) }
                        DropdownMenu(speedMenu, { speedMenu = false }) {
                            (BASE_SPEEDS + PREMIUM_SPEEDS).forEach { sp ->
                                val locked = sp in PREMIUM_SPEEDS && tier == Tier.FREE
                                DropdownMenuItem(
                                    text = { Text("${trimSpeed(sp)}×" + if (locked) "  · Premium" else "") },
                                    onClick = { speedMenu = false; if (locked) onOpenPremium() else connection.setSpeed(sp) },
                                )
                            }
                        }
                    }
                    Box {
                        IconButton(onClick = { if (tier == Tier.PREMIUM) sleepMenu = true else onOpenPremium() }) {
                            Icon(Icons.Rounded.Bedtime, "Temporizador", tint = if (s.sleepTimerEndsAt != null) MfColors.Cyan else muted)
                        }
                        DropdownMenu(sleepMenu, { sleepMenu = false }) {
                            listOf(15, 30, 45, 60).forEach { m -> DropdownMenuItem(text = { Text("$m minutos") }, onClick = { sleepMenu = false; connection.setSleepTimer(m) }) }
                            if (s.sleepTimerEndsAt != null) DropdownMenuItem(text = { Text("Desactivar") }, onClick = { sleepMenu = false; connection.cancelSleepTimer() })
                        }
                    }
                    if (s.isVideo) {
                        IconButton(onClick = { fullscreen = !fullscreen }) {
                            Icon(if (fullscreen) Icons.Rounded.FullscreenExit else Icons.Rounded.Fullscreen, "Pantalla completa", tint = onMedia)
                        }
                    }
                }
                s.error?.let {
                    Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(bottom = 8.dp))
                }
                Spacer(Modifier.height(8.dp))
            }
        }
    }

    if (queueOpen) {
        ModalBottomSheet(onDismissRequest = { queueOpen = false }, containerColor = MaterialTheme.colorScheme.surfaceContainer) {
            Text("Lista de reproducción", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(horizontal = 24.dp, vertical = 8.dp))
            LazyColumn(Modifier.navigationBarsPadding().padding(bottom = 12.dp)) {
                itemsIndexed(s.queue) { i, item ->
                    val current = i == s.currentIndex
                    Row(
                        Modifier.fillMaxWidth().clickable { connection.playAt(i) }.padding(horizontal = 24.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        if (current) Icon(Icons.Rounded.GraphicEq, null, tint = MfColors.Cyan, modifier = Modifier.size(20.dp))
                        else Text("${i + 1}", style = NumericStyle, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.width(20.dp))
                        Spacer(Modifier.width(14.dp))
                        Column(Modifier.weight(1f)) {
                            Text(item.title, style = MaterialTheme.typography.titleSmall, color = if (current) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            item.subtitle?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1) }
                        }
                    }
                }
            }
        }
    }
}

private fun trimSpeed(v: Float): String = if (v % 1f == 0f) v.toInt().toString() else v.toString().trimEnd('0')

@Composable
private fun ToggleIcon(icon: ImageVector, label: String, active: Boolean, tint: Color, onClick: () -> Unit) {
    IconButton(onClick = onClick) {
        Icon(icon, label, tint = if (active) MfColors.Cyan else tint.copy(alpha = 0.6f))
    }
}

@Composable
fun MiniPlayer(connection: PlayerConnection, onOpen: () -> Unit) {
    val s by connection.state.collectAsStateWithLifecycle()
    AnimatedVisibility(s.hasMedia, enter = fadeIn(), exit = fadeOut()) {
        Column(
            Modifier.padding(horizontal = 10.dp, vertical = 6.dp).fillMaxWidth().clip(RoundedCornerShape(20.dp))
                .background(MaterialTheme.colorScheme.surfaceContainerHigh).clickable(onClick = onOpen),
        ) {
            val progress = if (s.durationMs > 0) s.positionMs.toFloat() / s.durationMs else 0f
            Box(Modifier.fillMaxWidth().height(2.dp).background(MaterialTheme.colorScheme.outline)) {
                Box(Modifier.fillMaxWidth(progress.coerceIn(0f, 1f)).height(2.dp).background(MfColors.brandHorizontal))
            }
            Row(Modifier.padding(start = 10.dp, end = 4.dp, top = 8.dp, bottom = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                val uri = s.queue.getOrNull(s.currentIndex)?.uri
                if (uri != null) MediaThumbnail(uri, Icons.Rounded.MusicNote, RoundedCornerShape(10.dp), Modifier.size(42.dp))
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(s.title, style = MaterialTheme.typography.titleSmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(s.subtitle ?: (if (s.isVideo) "Vídeo" else "Audio"), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
                }
                IconButton(onClick = connection::togglePlay) { Icon(if (s.isPlaying) Icons.Rounded.Pause else Icons.Rounded.PlayArrow, "Reproducir/Pausar") }
                IconButton(onClick = connection::stop) { Icon(Icons.Rounded.Close, "Detener") }
            }
        }
    }
}
