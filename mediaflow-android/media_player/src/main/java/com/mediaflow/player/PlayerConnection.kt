package com.mediaflow.player

import android.content.ComponentName
import android.content.Context
import android.net.Uri
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.mediaflow.domain.model.PlayableItem
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.guava.await
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

enum class RepeatMode { OFF, ALL, ONE }

data class PlayerUiState(
    val connected: Boolean = false,
    val hasMedia: Boolean = false,
    val isPlaying: Boolean = false,
    val isBuffering: Boolean = false,
    val positionMs: Long = 0,
    val durationMs: Long = 0,
    val speed: Float = 1f,
    val volume: Float = 1f,
    val title: String = "",
    val subtitle: String? = null,
    val isVideo: Boolean = false,
    val queue: List<PlayableItem> = emptyList(),
    val currentIndex: Int = -1,
    val shuffle: Boolean = false,
    val repeat: RepeatMode = RepeatMode.OFF,
    val error: String? = null,
    val sleepTimerEndsAt: Long? = null,
)

/** Puente entre la UI y PlaybackService mediante un MediaController de Media3. */
class PlayerConnection(private val context: Context) {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val _state = MutableStateFlow(PlayerUiState())
    val state: StateFlow<PlayerUiState> = _state.asStateFlow()

    private var controller: MediaController? = null
    private var connecting: Job? = null
    private var ticker: Job? = null
    private var sleepJob: Job? = null
    private var queue: List<PlayableItem> = emptyList()

    val player: Player? get() = controller

    fun connect() {
        if (controller != null || connecting?.isActive == true) return
        connecting = scope.launch {
            val token = SessionToken(context, ComponentName(context, PlaybackService::class.java))
            val c = runCatching { MediaController.Builder(context, token).buildAsync().await() }.getOrNull() ?: return@launch
            controller = c
            c.addListener(listener)
            rebuildQueueFromController(c)
            publish()
            startTicker()
        }
    }

    private val listener = object : Player.Listener {
        override fun onEvents(player: Player, events: Player.Events) { publish() }
        override fun onPlayerError(error: PlaybackException) {
            _state.update { it.copy(error = "No se puede reproducir este archivo (${error.errorCodeName})") }
        }
    }

    fun play(items: List<PlayableItem>, startIndex: Int = 0, speed: Float? = null) {
        queue = items
        scope.launch {
            connect(); connecting?.join()
            val c = controller ?: return@launch
            c.setMediaItems(items.map { it.toMediaItem() }, startIndex.coerceIn(0, (items.size - 1).coerceAtLeast(0)), 0L)
            speed?.let { c.setPlaybackSpeed(it) }
            c.prepare()
            c.play()
            _state.update { it.copy(error = null) }
            publish()
        }
    }

    fun togglePlay() { controller?.let { if (it.isPlaying) it.pause() else { if (it.playbackState == Player.STATE_ENDED) it.seekTo(0); it.play() } } }
    fun pause() { controller?.pause() }
    fun seekTo(ms: Long) { controller?.seekTo(ms); publish() }
    fun seekBy(deltaMs: Long) { controller?.let { it.seekTo((it.currentPosition + deltaMs).coerceIn(0, it.duration.coerceAtLeast(0))) }; publish() }
    fun next() { controller?.seekToNextMediaItem() }
    fun previous() { controller?.let { if (it.currentPosition > 3000) it.seekTo(0) else it.seekToPreviousMediaItem() } }
    fun playAt(index: Int) { controller?.let { it.seekTo(index, 0); it.play() } }
    fun setSpeed(speed: Float) { controller?.setPlaybackSpeed(speed); publish() }
    fun setVolume(volume: Float) { controller?.volume = volume.coerceIn(0f, 1f); publish() }
    fun toggleShuffle() { controller?.let { it.shuffleModeEnabled = !it.shuffleModeEnabled } }
    fun cycleRepeat() {
        controller?.let {
            it.repeatMode = when (it.repeatMode) {
                Player.REPEAT_MODE_OFF -> Player.REPEAT_MODE_ALL
                Player.REPEAT_MODE_ALL -> Player.REPEAT_MODE_ONE
                else -> Player.REPEAT_MODE_OFF
            }
        }
    }
    fun stop() { controller?.let { it.stop(); it.clearMediaItems() }; queue = emptyList(); cancelSleepTimer(); publish() }
    fun clearError() { _state.update { it.copy(error = null) } }

    fun setSleepTimer(minutes: Int) {
        sleepJob?.cancel()
        val endsAt = System.currentTimeMillis() + minutes * 60_000L
        _state.update { it.copy(sleepTimerEndsAt = endsAt) }
        sleepJob = scope.launch {
            delay(minutes * 60_000L)
            controller?.pause()
            _state.update { it.copy(sleepTimerEndsAt = null) }
        }
    }

    fun cancelSleepTimer() { sleepJob?.cancel(); sleepJob = null; _state.update { it.copy(sleepTimerEndsAt = null) } }

    private fun startTicker() {
        ticker?.cancel()
        ticker = scope.launch {
            while (isActive) {
                if (controller?.isPlaying == true) publish()
                delay(500)
            }
        }
    }

    private fun rebuildQueueFromController(c: MediaController) {
        if (queue.isNotEmpty() || c.mediaItemCount == 0) return
        queue = (0 until c.mediaItemCount).map { i ->
            val item = c.getMediaItemAt(i)
            PlayableItem(
                uri = item.mediaId,
                title = item.mediaMetadata.title?.toString() ?: "",
                subtitle = item.mediaMetadata.artist?.toString(),
                isVideo = item.mediaMetadata.mediaType == MediaMetadata.MEDIA_TYPE_VIDEO,
            )
        }
    }

    private fun publish() {
        val c = controller ?: return
        val index = c.currentMediaItemIndex
        val current = queue.getOrNull(index)
        val meta = c.mediaMetadata
        _state.update {
            it.copy(
                connected = true,
                hasMedia = c.mediaItemCount > 0,
                isPlaying = c.isPlaying,
                isBuffering = c.playbackState == Player.STATE_BUFFERING,
                positionMs = c.currentPosition.coerceAtLeast(0),
                durationMs = c.duration.takeIf { d -> d > 0 } ?: 0,
                speed = c.playbackParameters.speed,
                volume = c.volume,
                title = meta.title?.toString() ?: current?.title.orEmpty(),
                subtitle = meta.artist?.toString() ?: current?.subtitle,
                isVideo = current?.isVideo ?: (meta.mediaType == MediaMetadata.MEDIA_TYPE_VIDEO),
                queue = queue,
                currentIndex = index,
                shuffle = c.shuffleModeEnabled,
                repeat = when (c.repeatMode) { Player.REPEAT_MODE_ALL -> RepeatMode.ALL; Player.REPEAT_MODE_ONE -> RepeatMode.ONE; else -> RepeatMode.OFF },
            )
        }
    }

    private fun PlayableItem.toMediaItem(): MediaItem = MediaItem.Builder()
        .setMediaId(uri)
        .setUri(Uri.parse(uri))
        .setRequestMetadata(MediaItem.RequestMetadata.Builder().setMediaUri(Uri.parse(uri)).build())
        .setMediaMetadata(
            MediaMetadata.Builder()
                .setTitle(title)
                .setArtist(subtitle)
                .setMediaType(if (isVideo) MediaMetadata.MEDIA_TYPE_VIDEO else MediaMetadata.MEDIA_TYPE_MUSIC)
                .build(),
        )
        .build()
}
