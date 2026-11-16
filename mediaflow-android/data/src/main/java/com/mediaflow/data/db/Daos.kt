package com.mediaflow.data.db

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.RoomDatabase
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface DownloadDao {
    @Query("SELECT * FROM downloads ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<DownloadEntity>>

    @Query("SELECT * FROM downloads WHERE id = :id")
    fun observe(id: Long): Flow<DownloadEntity?>

    @Query("SELECT * FROM downloads WHERE id = :id")
    suspend fun get(id: Long): DownloadEntity?

    @Insert
    suspend fun insert(entity: DownloadEntity): Long

    @Update
    suspend fun update(entity: DownloadEntity)

    @Query("UPDATE downloads SET bytesDownloaded = :bytes, totalBytes = :total, speedBps = :speed, etaSeconds = :eta, updatedAt = :now WHERE id = :id")
    suspend fun updateProgress(id: Long, bytes: Long, total: Long, speed: Long, eta: Long?, now: Long)

    @Query("UPDATE downloads SET status = :status, errorMessage = :error, speedBps = CASE WHEN :status = 'RUNNING' THEN speedBps ELSE 0 END, etaSeconds = CASE WHEN :status = 'RUNNING' THEN etaSeconds ELSE NULL END, updatedAt = :now WHERE id = :id")
    suspend fun updateStatus(id: Long, status: String, error: String?, now: Long)

    @Query("DELETE FROM downloads WHERE id = :id")
    suspend fun delete(id: Long)

    @Query("DELETE FROM downloads WHERE status IN ('COMPLETED','FAILED','CANCELLED')")
    suspend fun clearFinished()
}

@Dao
interface FavoriteDao {
    @Query("SELECT * FROM favorites ORDER BY createdAt DESC")
    fun observe(): Flow<List<FavoriteEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entity: FavoriteEntity)

    @Query("DELETE FROM favorites WHERE url = :url")
    suspend fun remove(url: String)

    @Query("SELECT COUNT(*) FROM favorites WHERE url = :url")
    suspend fun count(url: String): Int

    @Query("DELETE FROM favorites")
    suspend fun clear()
}

@Dao
interface ConversionDao {
    @Query("SELECT * FROM conversions ORDER BY createdAt DESC LIMIT 100")
    fun observe(): Flow<List<ConversionEntity>>

    @Insert
    suspend fun insert(entity: ConversionEntity): Long

    @Update
    suspend fun update(entity: ConversionEntity)

    @Query("DELETE FROM conversions")
    suspend fun clear()
}

@Database(
    entities = [DownloadEntity::class, FavoriteEntity::class, ConversionEntity::class],
    version = 1,
    exportSchema = false,
)
abstract class MediaFlowDatabase : RoomDatabase() {
    abstract fun downloads(): DownloadDao
    abstract fun favorites(): FavoriteDao
    abstract fun conversions(): ConversionDao
}
