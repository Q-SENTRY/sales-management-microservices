package com.mediaflow.downloader

import android.content.Context
import android.content.pm.ServiceInfo
import androidx.work.CoroutineWorker
import androidx.work.ForegroundInfo
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.mediaflow.domain.model.DownloadStatus
import com.mediaflow.domain.model.DownloadTask
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.net.HttpURLConnection
import java.net.SocketTimeoutException
import java.net.URL
import java.net.UnknownHostException
import java.util.concurrent.ConcurrentHashMap
import kotlin.coroutines.coroutineContext

private object TaskLocks {
    private val locks = ConcurrentHashMap<Long, Mutex>()
    fun of(id: Long): Mutex = locks.getOrPut(id) { Mutex() }
}

private class HttpStatusException(val code: Int) : IOException("HTTP $code")

/**
 * Descarga real por HTTPS. El progreso, la velocidad y el tiempo restante se calculan
 * a partir de los bytes efectivamente recibidos; si el servidor no informa el tamaño,
 * la interfaz muestra progreso indeterminado.
 */
class DownloadWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    companion object {
        const val KEY_TASK_ID = "task_id"
        const val TAG = "mediaflow-download"
        private const val BUFFER = 64 * 1024
        private const val REPORT_INTERVAL_MS = 500L
        private const val MAX_ATTEMPTS = 3
    }

    private val deps get() = (applicationContext as DownloaderDependencies.Provider).downloaderDependencies()

    override suspend fun doWork(): Result {
        val id = inputData.getLong(KEY_TASK_ID, -1)
        if (id < 0) return Result.failure()
        return TaskLocks.of(id).withLock { run(id) }
    }

    private suspend fun run(id: Long): Result {
        val repo = deps.downloadRepository
        var task = repo.get(id) ?: return Result.failure()
        if (task.status != DownloadStatus.QUEUED && task.status != DownloadStatus.RUNNING) return Result.success()

        val partial = task.partialPath?.let(::File) ?: File(deps.outputStorage.partialDir(), "task_$id.part")
        if (task.partialPath == null) {
            task = task.copy(partialPath = partial.absolutePath)
            repo.update(task)
        }
        repo.updateStatus(id, DownloadStatus.RUNNING)
        val notify = deps.settingsRepository.settings.first().notificationsEnabled
        if (notify) runCatching { setForeground(foregroundInfo(id, task.fileName, partial.length(), task.totalBytes, 0)) }

        return try {
            val (bytes, mime) = withContext(Dispatchers.IO) { transfer(task, partial, notify) }
            val folder = deps.settingsRepository.settings.first().customFolderUri
            val uri = withContext(Dispatchers.IO) {
                deps.outputStorage.save(partial, task.fileName, mime ?: task.mimeType, folder)
            }
            partial.delete()
            val now = System.currentTimeMillis()
            repo.update(
                (repo.get(id) ?: task).copy(
                    status = DownloadStatus.COMPLETED, bytesDownloaded = bytes, totalBytes = bytes,
                    speedBps = 0, etaSeconds = null, outputUri = uri.toString(), mimeType = mime ?: task.mimeType,
                    errorMessage = null, updatedAt = now,
                ),
            )
            if (notify) DownloadNotifications.result(applicationContext, id, "Descarga completada", task.fileName)
            Result.success()
        } catch (e: CancellationException) {
            withContext(NonCancellable) {
                when (repo.get(id)?.status) {
                    DownloadStatus.CANCELLED -> partial.delete()
                    // Detenido por el sistema (p. ej. sin red): vuelve a la cola, WorkManager lo reanudará.
                    DownloadStatus.RUNNING -> repo.updateStatus(id, DownloadStatus.QUEUED, "Esperando conexión")
                    else -> Unit
                }
            }
            throw e
        } catch (e: Exception) {
            val transient = e is SocketTimeoutException || e is UnknownHostException ||
                (e is HttpStatusException && e.code >= 500)
            if (transient && runAttemptCount + 1 < MAX_ATTEMPTS) {
                repo.updateStatus(id, DownloadStatus.QUEUED, "Reintentando: ${humanMessage(e)}")
                Result.retry()
            } else {
                repo.updateStatus(id, DownloadStatus.FAILED, humanMessage(e))
                if (notify) DownloadNotifications.result(applicationContext, id, "La descarga falló", "${task.fileName}: ${humanMessage(e)}")
                Result.failure(workDataOf("error" to humanMessage(e)))
            }
        }
    }

    private suspend fun transfer(task: DownloadTask, partial: File, notify: Boolean): Pair<Long, String?> {
        val repo = deps.downloadRepository
        val existing = if (partial.exists()) partial.length() else 0L
        val conn = (URL(task.url).openConnection() as HttpURLConnection).apply {
            connectTimeout = 15_000
            readTimeout = 30_000
            instanceFollowRedirects = true
            setRequestProperty("User-Agent", "MediaFlow/1.0 (Android)")
            setRequestProperty("Accept-Encoding", "identity")
            if (existing > 0 && task.supportsResume) setRequestProperty("Range", "bytes=$existing-")
        }
        try {
            val code = conn.responseCode
            if (!conn.url.protocol.equals("https", true)) throw IOException("El servidor redirigió a una conexión no segura")
            val append: Boolean
            var total: Long
            when (code) {
                206 -> {
                    append = true
                    total = conn.getHeaderField("Content-Range")?.substringAfterLast('/')?.toLongOrNull() ?: -1L
                }
                200 -> {
                    append = false // el servidor no admite reanudar: se empieza de cero
                    total = conn.contentLengthLong
                }
                416 -> if (task.totalBytes > 0 && existing == task.totalBytes) {
                    return existing to conn.contentType?.substringBefore(';')
                } else {
                    partial.delete(); throw IOException("El servidor no pudo reanudar; vuelve a intentarlo")
                }
                401, 403 -> throw IOException("El servidor denegó el acceso al archivo")
                404, 410 -> throw IOException("El archivo ya no está disponible")
                else -> throw HttpStatusException(code)
            }
            val mime = conn.contentType?.substringBefore(';')?.trim()
            var bytes = if (append) existing else 0L
            if (total > 0) {
                val free = deps.outputStorage.stats().availableBytes
                if (total - bytes > free) throw IOException("Espacio insuficiente en el dispositivo")
            }

            var lastBytes = bytes
            var lastTime = System.nanoTime()
            var ema = 0.0
            conn.inputStream.use { input ->
                FileOutputStream(partial, append).use { out ->
                    val buffer = ByteArray(BUFFER)
                    while (true) {
                        coroutineContext.ensureActive()
                        val n = input.read(buffer)
                        if (n < 0) break
                        out.write(buffer, 0, n)
                        bytes += n
                        val now = System.nanoTime()
                        val elapsedMs = (now - lastTime) / 1_000_000
                        if (elapsedMs >= REPORT_INTERVAL_MS) {
                            val instant = (bytes - lastBytes) * 1000.0 / elapsedMs
                            ema = if (ema == 0.0) instant else ema * 0.7 + instant * 0.3
                            lastBytes = bytes; lastTime = now
                            val speed = ema.toLong()
                            val eta = if (total > 0 && speed > 0) (total - bytes) / speed else null
                            repo.updateProgress(task.id, bytes, total, speed, eta)
                            if (notify) runCatching { setForeground(foregroundInfo(task.id, task.fileName, bytes, total, speed)) }
                        }
                    }
                }
            }
            if (total > 0 && bytes != total) throw IOException("La descarga se interrumpió (${bytes}/${total} bytes)")
            if (total <= 0) total = bytes
            repo.updateProgress(task.id, bytes, total, 0, null)
            return bytes to mime
        } finally {
            conn.disconnect()
        }
    }

    private fun foregroundInfo(id: Long, name: String, bytes: Long, total: Long, speed: Long): ForegroundInfo {
        val n = DownloadNotifications.progress(applicationContext, name, bytes, total, speed)
        return ForegroundInfo(10_000 + id.toInt(), n, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
    }

    private fun humanMessage(e: Exception): String = when (e) {
        is UnknownHostException -> "Sin conexión o dominio no encontrado"
        is SocketTimeoutException -> "El servidor tardó demasiado en responder"
        is HttpStatusException -> "El servidor respondió con el código ${e.code}"
        else -> e.message?.takeIf { it.isNotBlank() } ?: "Error desconocido"
    }
}
