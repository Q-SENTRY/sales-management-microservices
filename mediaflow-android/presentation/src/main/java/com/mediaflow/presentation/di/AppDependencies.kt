package com.mediaflow.presentation.di

import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.mediaflow.converter.MediaConverter
import com.mediaflow.data.storage.OutputStorage
import com.mediaflow.domain.repository.ConversionHistoryRepository
import com.mediaflow.domain.repository.DownloadRepository
import com.mediaflow.domain.repository.EntitlementRepository
import com.mediaflow.domain.repository.FavoritesRepository
import com.mediaflow.domain.repository.SettingsRepository
import com.mediaflow.domain.usecase.AnalyzeLinkUseCase
import com.mediaflow.domain.usecase.DownloadController
import com.mediaflow.library.MediaLibrary
import com.mediaflow.platform.api.PlatformRegistry
import com.mediaflow.player.PlayerConnection

/** Grafo de dependencias que la capa de presentación necesita. Lo construye el módulo :app. */
interface AppDependencies {
    val settings: SettingsRepository
    val entitlements: EntitlementRepository
    val downloads: DownloadRepository
    val downloadController: DownloadController
    val favorites: FavoritesRepository
    val conversions: ConversionHistoryRepository
    val analyzeLink: AnalyzeLinkUseCase
    val platforms: PlatformRegistry
    val library: MediaLibrary
    val converter: MediaConverter
    val player: PlayerConnection
    val storage: OutputStorage
    val appVersion: String
    val premiumPreviewEnabled: Boolean
}

val LocalAppDependencies = staticCompositionLocalOf<AppDependencies> { error("AppDependencies no proporcionadas") }

@Composable
inline fun <reified VM : ViewModel> mfViewModel(crossinline create: (AppDependencies) -> VM): VM {
    val deps = LocalAppDependencies.current
    return viewModel(factory = viewModelFactory { initializer { create(deps) } })
}
