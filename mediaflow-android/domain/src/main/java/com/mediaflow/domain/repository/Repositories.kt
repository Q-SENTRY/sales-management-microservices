package com.mediaflow.domain.repository

import com.mediaflow.domain.model.ConversionRecord
import com.mediaflow.domain.model.DownloadStatus
import com.mediaflow.domain.model.DownloadTask
import com.mediaflow.domain.model.Favorite
import com.mediaflow.domain.model.LinkAnalysis
import com.mediaflow.domain.model.Tier
import com.mediaflow.domain.model.UserSettings
import com.mediaflow.domain.util.UrlValidation
import kotlinx.coroutines.flow.Flow

interface DownloadRepository {
    fun observeAll(): Flow<List<DownloadTask>>
    fun observe(id: Long): Flow<DownloadTask?>
    suspend fun get(id: Long): DownloadTask?
    suspend fun insert(task: DownloadTask): Long
    suspend fun update(task: DownloadTask)
    suspend fun updateProgress(id: Long, bytes: Long, total: Long, speedBps: Long, etaSeconds: Long?)
    suspend fun updateStatus(id: Long, status: DownloadStatus, error: String? = null)
    suspend fun delete(id: Long)
    suspend fun clearFinished()
}

/** Programa la ejecución real de una tarea de descarga (WorkManager). */
interface DownloadScheduler {
    fun enqueue(taskId: Long, wifiOnly: Boolean)
    fun cancel(taskId: Long)
}

interface FavoritesRepository {
    fun observe(): Flow<List<Favorite>>
    suspend fun add(favorite: Favorite)
    suspend fun remove(url: String)
    suspend fun isFavorite(url: String): Boolean
    suspend fun clear()
}

interface ConversionHistoryRepository {
    fun observe(): Flow<List<ConversionRecord>>
    suspend fun insert(record: ConversionRecord): Long
    suspend fun update(record: ConversionRecord)
    suspend fun clear()
}

interface SettingsRepository {
    val settings: Flow<UserSettings>
    suspend fun update(transform: (UserSettings) -> UserSettings)
}

/**
 * Fuente de verdad de la suscripción. La implementación actual es local; en el futuro
 * se respaldará con Google Play Billing sin cambiar a los consumidores.
 */
interface EntitlementRepository {
    val tier: Flow<Tier>
    val billingAvailable: Boolean
    suspend fun setPreviewTier(tier: Tier)
}

interface LinkAnalyzer {
    suspend fun analyze(url: UrlValidation.Valid): LinkAnalysis
}
