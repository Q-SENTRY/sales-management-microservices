package com.mediaflow.domain.model

enum class DownloadStatus { QUEUED, RUNNING, PAUSED, COMPLETED, FAILED, CANCELLED;
    val isActive get() = this == QUEUED || this == RUNNING || this == PAUSED
    val isTerminal get() = this == COMPLETED || this == FAILED || this == CANCELLED
}

data class DownloadTask(
    val id: Long = 0,
    val url: String,
    val fileName: String,
    val mimeType: String?,
    val platform: Platform,
    val status: DownloadStatus,
    val bytesDownloaded: Long = 0,
    /** -1 si el servidor no informa el tamaño. */
    val totalBytes: Long = -1,
    /** Bytes por segundo medidos realmente; 0 si no hay datos. */
    val speedBps: Long = 0,
    /** Segundos restantes; null si no puede calcularse con datos reales. */
    val etaSeconds: Long? = null,
    val supportsResume: Boolean = false,
    val partialPath: String? = null,
    val outputUri: String? = null,
    val errorMessage: String? = null,
    val createdAt: Long,
    val updatedAt: Long,
) {
    val progress: Float?
        get() = if (totalBytes > 0) (bytesDownloaded.toFloat() / totalBytes).coerceIn(0f, 1f) else null
}
