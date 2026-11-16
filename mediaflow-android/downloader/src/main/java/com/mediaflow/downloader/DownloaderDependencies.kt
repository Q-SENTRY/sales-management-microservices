package com.mediaflow.downloader

import com.mediaflow.data.storage.OutputStorage
import com.mediaflow.domain.repository.DownloadRepository
import com.mediaflow.domain.repository.SettingsRepository

interface DownloaderDependencies {
    val downloadRepository: DownloadRepository
    val settingsRepository: SettingsRepository
    val outputStorage: OutputStorage

    /** La clase Application implementa esta interfaz para que el Worker obtenga sus dependencias. */
    interface Provider {
        fun downloaderDependencies(): DownloaderDependencies
    }
}
