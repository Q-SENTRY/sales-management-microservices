package com.mediaflow.app

import android.content.Context
import com.mediaflow.converter.MediaConverter
import com.mediaflow.data.DataModule
import com.mediaflow.data.storage.OutputStorage
import com.mediaflow.domain.repository.DownloadRepository
import com.mediaflow.domain.repository.SettingsRepository
import com.mediaflow.domain.usecase.AnalyzeLinkUseCase
import com.mediaflow.domain.usecase.DownloadController
import com.mediaflow.downloader.DownloaderDependencies
import com.mediaflow.downloader.WorkManagerDownloadScheduler
import com.mediaflow.library.MediaLibrary
import com.mediaflow.platform.api.PlatformRegistry
import com.mediaflow.platform.direct.DirectLinkModule
import com.mediaflow.platform.facebook.FacebookModule
import com.mediaflow.platform.instagram.InstagramModule
import com.mediaflow.platform.tiktok.TikTokModule
import com.mediaflow.platform.youtube.YouTubeModule
import com.mediaflow.player.PlayerConnection
import com.mediaflow.presentation.di.AppDependencies

/** Inyección de dependencias manual: un único grafo, explícito y sin reflexión. */
class AppContainer(context: Context) : AppDependencies, DownloaderDependencies {
    private val app = context.applicationContext
    private val data = DataModule(app, premiumPreview = BuildConfig.PREMIUM_PREVIEW)

    override val settings = data.settings
    override val entitlements = data.entitlements
    override val downloads = data.downloads
    override val favorites = data.favorites
    override val conversions = data.conversions
    override val storage = data.storage

    override val platforms = PlatformRegistry(
        modules = listOf(YouTubeModule(), TikTokModule(), InstagramModule(), FacebookModule()),
        fallback = DirectLinkModule(),
    )
    override val analyzeLink = AnalyzeLinkUseCase(platforms)
    override val downloadController = DownloadController(downloads, WorkManagerDownloadScheduler(app), settings)
    override val library = MediaLibrary(app)
    override val converter = MediaConverter(app, storage)
    override val player = PlayerConnection(app)
    override val appVersion: String = BuildConfig.VERSION_NAME
    override val premiumPreviewEnabled: Boolean = BuildConfig.PREMIUM_PREVIEW

    // DownloaderDependencies
    override val downloadRepository: DownloadRepository get() = downloads
    override val settingsRepository: SettingsRepository get() = settings
    override val outputStorage: OutputStorage get() = storage
}
