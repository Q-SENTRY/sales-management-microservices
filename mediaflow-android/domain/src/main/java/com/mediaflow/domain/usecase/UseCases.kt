package com.mediaflow.domain.usecase

import com.mediaflow.domain.model.DownloadStatus
import com.mediaflow.domain.model.DownloadTask
import com.mediaflow.domain.model.LinkAnalysis
import com.mediaflow.domain.model.Platform
import com.mediaflow.domain.model.PlatformAction
import com.mediaflow.domain.repository.DownloadRepository
import com.mediaflow.domain.repository.DownloadScheduler
import com.mediaflow.domain.repository.LinkAnalyzer
import com.mediaflow.domain.repository.SettingsRepository
import com.mediaflow.domain.util.FileNames
import com.mediaflow.domain.util.UrlValidation
import com.mediaflow.domain.util.UrlValidator
import kotlinx.coroutines.flow.first

sealed interface AnalyzeResult {
    data class Success(val analysis: LinkAnalysis) : AnalyzeResult
    data class InvalidLink(val reason: String) : AnalyzeResult
    data class Error(val message: String) : AnalyzeResult
}

class AnalyzeLinkUseCase(private val analyzer: LinkAnalyzer) {
    suspend operator fun invoke(input: String): AnalyzeResult =
        when (val v = UrlValidator.validate(input)) {
            is UrlValidation.Invalid -> AnalyzeResult.InvalidLink(v.reason)
            is UrlValidation.Valid -> try {
                AnalyzeResult.Success(analyzer.analyze(v))
            } catch (e: Exception) {
                AnalyzeResult.Error(e.message ?: "No se pudo analizar el enlace")
            }
        }
}

/** Orquesta el ciclo de vida de las descargas: iniciar, pausar, reanudar, cancelar y reintentar. */
class DownloadController(
    private val repository: DownloadRepository,
    private val scheduler: DownloadScheduler,
    private val settings: SettingsRepository,
    private val clock: () -> Long = System::currentTimeMillis,
) {
    suspend fun start(action: PlatformAction.DirectDownload, platform: Platform): Long {
        val now = clock()
        val id = repository.insert(
            DownloadTask(
                url = action.url,
                fileName = FileNames.sanitize(action.suggestedFileName, "descarga"),
                mimeType = action.mimeType,
                platform = platform,
                status = DownloadStatus.QUEUED,
                totalBytes = action.sizeBytes ?: -1,
                supportsResume = action.supportsResume,
                createdAt = now,
                updatedAt = now,
            ),
        )
        scheduler.enqueue(id, settings.settings.first().wifiOnlyDownloads)
        return id
    }

    suspend fun pause(id: Long) {
        val task = repository.get(id) ?: return
        if (task.status != DownloadStatus.RUNNING && task.status != DownloadStatus.QUEUED) return
        repository.updateStatus(id, DownloadStatus.PAUSED)
        scheduler.cancel(id)
    }

    suspend fun resume(id: Long) {
        val task = repository.get(id) ?: return
        if (task.status != DownloadStatus.PAUSED) return
        repository.updateStatus(id, DownloadStatus.QUEUED)
        scheduler.enqueue(id, settings.settings.first().wifiOnlyDownloads)
    }

    suspend fun cancel(id: Long) {
        val task = repository.get(id) ?: return
        if (task.status.isTerminal) return
        repository.updateStatus(id, DownloadStatus.CANCELLED)
        scheduler.cancel(id)
    }

    suspend fun retry(id: Long) {
        val task = repository.get(id) ?: return
        if (task.status != DownloadStatus.FAILED && task.status != DownloadStatus.CANCELLED) return
        repository.update(task.copy(status = DownloadStatus.QUEUED, errorMessage = null, speedBps = 0, etaSeconds = null, updatedAt = clock()))
        scheduler.enqueue(id, settings.settings.first().wifiOnlyDownloads)
    }

    suspend fun remove(id: Long) {
        val task = repository.get(id) ?: return
        if (task.status.isActive) cancel(id)
        repository.delete(id)
    }
}
