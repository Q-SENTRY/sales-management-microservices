package com.mediaflow.data.db

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "downloads")
data class DownloadEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val url: String,
    val fileName: String,
    val mimeType: String?,
    val platform: String,
    val status: String,
    val bytesDownloaded: Long,
    val totalBytes: Long,
    val speedBps: Long,
    val etaSeconds: Long?,
    val supportsResume: Boolean,
    val partialPath: String?,
    val outputUri: String?,
    val errorMessage: String?,
    val createdAt: Long,
    val updatedAt: Long,
)

@Entity(tableName = "favorites", indices = [Index(value = ["url"], unique = true)])
data class FavoriteEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val url: String,
    val platform: String,
    val title: String?,
    val thumbnailUrl: String?,
    val createdAt: Long,
)

@Entity(tableName = "conversions")
data class ConversionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val sourceName: String,
    val outputName: String,
    val outputUri: String?,
    val format: String,
    val qualityKbps: Int?,
    val status: String,
    val errorMessage: String?,
    val createdAt: Long,
)
