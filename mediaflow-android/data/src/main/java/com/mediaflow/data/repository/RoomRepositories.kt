package com.mediaflow.data.repository

import com.mediaflow.data.db.ConversionDao
import com.mediaflow.data.db.ConversionEntity
import com.mediaflow.data.db.DownloadDao
import com.mediaflow.data.db.DownloadEntity
import com.mediaflow.data.db.FavoriteDao
import com.mediaflow.data.db.FavoriteEntity
import com.mediaflow.domain.model.ConversionFormat
import com.mediaflow.domain.model.ConversionRecord
import com.mediaflow.domain.model.ConversionStatus
import com.mediaflow.domain.model.DownloadStatus
import com.mediaflow.domain.model.DownloadTask
import com.mediaflow.domain.model.Favorite
import com.mediaflow.domain.model.Platform
import com.mediaflow.domain.repository.ConversionHistoryRepository
import com.mediaflow.domain.repository.DownloadRepository
import com.mediaflow.domain.repository.FavoritesRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private fun platformOf(s: String) = runCatching { Platform.valueOf(s) }.getOrDefault(Platform.UNKNOWN)

internal fun DownloadEntity.toDomain() = DownloadTask(
    id, url, fileName, mimeType, platformOf(platform),
    runCatching { DownloadStatus.valueOf(status) }.getOrDefault(DownloadStatus.FAILED),
    bytesDownloaded, totalBytes, speedBps, etaSeconds, supportsResume, partialPath, outputUri, errorMessage, createdAt, updatedAt,
)

internal fun DownloadTask.toEntity() = DownloadEntity(
    id, url, fileName, mimeType, platform.name, status.name, bytesDownloaded, totalBytes, speedBps, etaSeconds,
    supportsResume, partialPath, outputUri, errorMessage, createdAt, updatedAt,
)

class RoomDownloadRepository(private val dao: DownloadDao) : DownloadRepository {
    override fun observeAll(): Flow<List<DownloadTask>> = dao.observeAll().map { l -> l.map { it.toDomain() } }
    override fun observe(id: Long): Flow<DownloadTask?> = dao.observe(id).map { it?.toDomain() }
    override suspend fun get(id: Long) = dao.get(id)?.toDomain()
    override suspend fun insert(task: DownloadTask) = dao.insert(task.toEntity().copy(id = 0))
    override suspend fun update(task: DownloadTask) = dao.update(task.toEntity())
    override suspend fun updateProgress(id: Long, bytes: Long, total: Long, speedBps: Long, etaSeconds: Long?) =
        dao.updateProgress(id, bytes, total, speedBps, etaSeconds, System.currentTimeMillis())
    override suspend fun updateStatus(id: Long, status: DownloadStatus, error: String?) =
        dao.updateStatus(id, status.name, error, System.currentTimeMillis())
    override suspend fun delete(id: Long) = dao.delete(id)
    override suspend fun clearFinished() = dao.clearFinished()
}

class RoomFavoritesRepository(private val dao: FavoriteDao) : FavoritesRepository {
    override fun observe(): Flow<List<Favorite>> = dao.observe().map { l ->
        l.map { Favorite(it.id, it.url, platformOf(it.platform), it.title, it.thumbnailUrl, it.createdAt) }
    }
    override suspend fun add(favorite: Favorite) = dao.upsert(
        FavoriteEntity(0, favorite.url, favorite.platform.name, favorite.title, favorite.thumbnailUrl, favorite.createdAt),
    )
    override suspend fun remove(url: String) = dao.remove(url)
    override suspend fun isFavorite(url: String) = dao.count(url) > 0
    override suspend fun clear() = dao.clear()
}

class RoomConversionHistoryRepository(private val dao: ConversionDao) : ConversionHistoryRepository {
    override fun observe(): Flow<List<ConversionRecord>> = dao.observe().map { l ->
        l.map {
            ConversionRecord(
                it.id, it.sourceName, it.outputName, it.outputUri,
                runCatching { ConversionFormat.valueOf(it.format) }.getOrDefault(ConversionFormat.M4A),
                it.qualityKbps,
                runCatching { ConversionStatus.valueOf(it.status) }.getOrDefault(ConversionStatus.FAILED),
                it.errorMessage, it.createdAt,
            )
        }
    }
    override suspend fun insert(record: ConversionRecord) = dao.insert(record.toEntity().copy(id = 0))
    override suspend fun update(record: ConversionRecord) = dao.update(record.toEntity())
    override suspend fun clear() = dao.clear()

    private fun ConversionRecord.toEntity() = ConversionEntity(
        id, sourceName, outputName, outputUri, format.name, qualityKbps, status.name, errorMessage, createdAt,
    )
}
