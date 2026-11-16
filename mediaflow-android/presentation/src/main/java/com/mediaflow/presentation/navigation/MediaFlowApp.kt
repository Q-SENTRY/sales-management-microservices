package com.mediaflow.presentation.navigation

import android.net.Uri
import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Download
import androidx.compose.material.icons.rounded.GraphicEq
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Tune
import androidx.compose.material.icons.rounded.VideoLibrary
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.mediaflow.core.designsystem.MediaFlowTheme
import com.mediaflow.domain.model.LibraryItem
import com.mediaflow.domain.model.Platform
import com.mediaflow.domain.model.PlayableItem
import com.mediaflow.domain.model.Tier
import com.mediaflow.domain.model.UserSettings
import com.mediaflow.presentation.converter.ConverterScreen
import com.mediaflow.presentation.converter.ConverterViewModel
import com.mediaflow.presentation.di.LocalAppDependencies
import com.mediaflow.presentation.di.mfViewModel
import com.mediaflow.presentation.downloads.DownloadsScreen
import com.mediaflow.presentation.downloads.DownloadsViewModel
import com.mediaflow.presentation.home.HomeScreen
import com.mediaflow.presentation.home.HomeViewModel
import com.mediaflow.presentation.library.LibraryScreen
import com.mediaflow.presentation.library.LibraryViewModel
import com.mediaflow.presentation.platforms.FavoritesScreen
import com.mediaflow.presentation.platforms.PlatformScreen
import com.mediaflow.presentation.player.MiniPlayer
import com.mediaflow.presentation.player.PlayerScreen
import com.mediaflow.presentation.settings.AboutScreen
import com.mediaflow.presentation.settings.PremiumScreen
import com.mediaflow.presentation.settings.SettingsScreen
import com.mediaflow.presentation.settings.SettingsViewModel
import com.mediaflow.presentation.util.Intents
import com.mediaflow.presentation.util.isPlayable
import com.mediaflow.presentation.util.toPlayable

private object Routes {
    const val HOME = "home"
    const val DOWNLOADS = "downloads"
    const val LIBRARY = "library"
    const val CONVERTER = "converter?src={src}"
    const val SETTINGS = "settings"
    const val PLAYER = "player"
    const val PLATFORM = "platform/{name}"
    const val FAVORITES = "favorites"
    const val PREMIUM = "premium"
    const val ABOUT = "about"
    fun converter(src: String? = null) = if (src == null) "converter" else "converter?src=${Uri.encode(src)}"
}

private data class Tab(val route: String, val navRoute: String, val label: String, val icon: ImageVector)

private val tabs = listOf(
    Tab(Routes.HOME, Routes.HOME, "Inicio", Icons.Rounded.Home),
    Tab(Routes.DOWNLOADS, Routes.DOWNLOADS, "Descargas", Icons.Rounded.Download),
    Tab(Routes.LIBRARY, Routes.LIBRARY, "Biblioteca", Icons.Rounded.VideoLibrary),
    Tab(Routes.CONVERTER, "converter", "Convertir", Icons.Rounded.GraphicEq),
    Tab(Routes.SETTINGS, Routes.SETTINGS, "Ajustes", Icons.Rounded.Tune),
)

@Composable
fun MediaFlowApp(incoming: IncomingShare) {
    val deps = LocalAppDependencies.current
    val settings by deps.settings.settings.collectAsStateWithLifecycle(UserSettings())
    MediaFlowTheme(settings.themeMode) {
        val nav = rememberNavController()
        val snackbar = remember { SnackbarHostState() }
        val entry by nav.currentBackStackEntryAsState()
        val route = entry?.destination?.route
        val showBars = tabs.any { it.route == route }
        val tier by deps.entitlements.tier.collectAsStateWithLifecycle(Tier.FREE)
        val downloads by deps.downloads.observeAll().collectAsStateWithLifecycle(emptyList())
        val activeCount = downloads.count { it.status.isActive }

        // Las pantallas comparten un único HomeViewModel para enlaces y favoritos.
        val homeVm: HomeViewModel = mfViewModel { HomeViewModel(it) }
        val settingsVm: SettingsViewModel = mfViewModel { SettingsViewModel(it) }

        val sharedContent by incoming.pending.collectAsStateWithLifecycle()
        LaunchedEffect(sharedContent) {
            when (val c = sharedContent) {
                is SharedContent.Link -> { nav.navigateTab(Routes.HOME); homeVm.analyze(c.text) }
                is SharedContent.Files -> { nav.navigateTab(Routes.HOME); homeVm.importFiles(c.uris) }
                null -> Unit
            }
            if (sharedContent != null) incoming.consume()
        }

        val play: (List<PlayableItem>, Int, Boolean) -> Unit = { items, index, shuffle ->
            deps.player.play(items, index, settings.playbackSpeed)
            if (shuffle) deps.player.toggleShuffle()
            nav.navigate(Routes.PLAYER) { launchSingleTop = true }
        }
        val openItem: (LibraryItem) -> Unit = { item ->
            if (item.isPlayable()) play(listOf(item.toPlayable()), 0, false)
            else Intents.openFile(nav.context, item.uri, item.mimeType)
        }

        Scaffold(
            containerColor = MaterialTheme.colorScheme.background,
            contentWindowInsets = WindowInsets(0, 0, 0, 0),
            snackbarHost = { SnackbarHost(snackbar) },
            bottomBar = {
                if (showBars) {
                    Column {
                        MiniPlayer(deps.player) { nav.navigate(Routes.PLAYER) { launchSingleTop = true } }
                        NavigationBar(containerColor = MaterialTheme.colorScheme.surfaceContainerLow, tonalElevation = 0.dp) {
                            tabs.forEach { tab ->
                                val selected = route == tab.route
                                NavigationBarItem(
                                    selected = selected,
                                    onClick = { nav.navigateTab(tab.navRoute) },
                                    icon = {
                                        if (tab.route == Routes.DOWNLOADS && activeCount > 0) {
                                            BadgedBox(badge = { Badge { Text("$activeCount") } }) { Icon(tab.icon, tab.label) }
                                        } else Icon(tab.icon, tab.label)
                                    },
                                    label = { Text(tab.label, style = MaterialTheme.typography.labelMedium) },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = MaterialTheme.colorScheme.primary,
                                        selectedTextColor = MaterialTheme.colorScheme.onSurface,
                                        indicatorColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.14f),
                                        unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                        unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                    ),
                                )
                            }
                        }
                    }
                }
            },
        ) { padding ->
            NavHost(
                navController = nav,
                startDestination = Routes.HOME,
                modifier = Modifier.fillMaxSize().padding(padding),
                enterTransition = { fadeIn(tween(220)) + slideIntoContainer(AnimatedContentTransitionScope.SlideDirection.Start, tween(260)) { it / 12 } },
                exitTransition = { fadeOut(tween(160)) },
                popEnterTransition = { fadeIn(tween(220)) },
                popExitTransition = { fadeOut(tween(160)) + slideOutOfContainer(AnimatedContentTransitionScope.SlideDirection.End, tween(260)) { it / 12 } },
            ) {
                composable(Routes.HOME, enterTransition = { fadeIn(tween(220)) + scaleIn(tween(260), initialScale = 0.98f) }) {
                    HomeScreen(
                        vm = homeVm, snackbar = snackbar,
                        onOpenPlatform = { nav.navigate("platform/${it.name}") },
                        onOpenDownloads = { nav.navigateTab(Routes.DOWNLOADS) },
                        onOpenLibrary = { nav.navigateTab(Routes.LIBRARY) },
                        onOpenConverter = { nav.navigateTab("converter") },
                        onOpenFavorites = { nav.navigate(Routes.FAVORITES) },
                        onOpenPremium = { nav.navigate(Routes.PREMIUM) },
                        onOpenItem = openItem,
                    )
                }
                composable(Routes.DOWNLOADS, enterTransition = { fadeIn(tween(220)) }) {
                    DownloadsScreen(mfViewModel { DownloadsViewModel(it) }) { play(listOf(it), 0, false) }
                }
                composable(Routes.LIBRARY, enterTransition = { fadeIn(tween(220)) }) {
                    LibraryScreen(
                        mfViewModel { LibraryViewModel(it) }, snackbar, onPlay = play,
                        onConvert = { nav.navigateTab(Routes.converter(it.uri)) },
                        onOpenPremium = { nav.navigate(Routes.PREMIUM) },
                    )
                }
                composable(
                    Routes.CONVERTER,
                    arguments = listOf(navArgument("src") { type = NavType.StringType; nullable = true; defaultValue = null }),
                    enterTransition = { fadeIn(tween(220)) },
                ) { back ->
                    val src = back.arguments?.getString("src")?.let(Uri::parse)
                    ConverterScreen(
                        mfViewModel { ConverterViewModel(it) }, src,
                        onPlay = { play(listOf(it), 0, false) },
                        onOpenPremium = { nav.navigate(Routes.PREMIUM) },
                    )
                }
                composable(Routes.SETTINGS, enterTransition = { fadeIn(tween(220)) }) {
                    SettingsScreen(settingsVm, snackbar, onOpenPremium = { nav.navigate(Routes.PREMIUM) }, onOpenAbout = { nav.navigate(Routes.ABOUT) })
                }
                composable(
                    Routes.PLAYER,
                    enterTransition = { slideInVertically(tween(300)) { it } + fadeIn() },
                    popExitTransition = { slideOutVertically(tween(260)) { it } + fadeOut() },
                ) {
                    PlayerScreen(deps.player, tier, onBack = { nav.popBackStack() }, onOpenPremium = { nav.navigate(Routes.PREMIUM) })
                }
                composable(Routes.PLATFORM, arguments = listOf(navArgument("name") { type = NavType.StringType })) { back ->
                    val platform = runCatching { Platform.valueOf(back.arguments?.getString("name").orEmpty()) }.getOrNull()
                    if (platform != null) PlatformScreen(platform, homeVm) { nav.popBackStack() }
                }
                composable(Routes.FAVORITES) { FavoritesScreen(homeVm) { nav.popBackStack() } }
                composable(Routes.PREMIUM) { PremiumScreen(settingsVm) { nav.popBackStack() } }
                composable(Routes.ABOUT) { AboutScreen(deps.appVersion) { nav.popBackStack() } }
            }
        }
    }
}

private fun NavHostController.navigateTab(route: String) {
    navigate(route) {
        popUpTo(graph.findStartDestination().id) { saveState = true }
        launchSingleTop = true
        restoreState = !route.contains("?")
    }
}
