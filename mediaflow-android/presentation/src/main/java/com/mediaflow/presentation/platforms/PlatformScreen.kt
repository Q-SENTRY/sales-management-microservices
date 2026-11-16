package com.mediaflow.presentation.platforms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.OpenInNew
import androidx.compose.material.icons.rounded.BookmarkRemove
import androidx.compose.material.icons.rounded.BookmarkBorder
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mediaflow.core.designsystem.MfColors
import com.mediaflow.core.ui.EmptyState
import com.mediaflow.core.ui.GradientButton
import com.mediaflow.core.ui.MfCard
import com.mediaflow.core.ui.Monogram
import com.mediaflow.core.ui.SectionHeader
import com.mediaflow.core.util.Format
import com.mediaflow.domain.model.Favorite
import com.mediaflow.domain.model.Platform
import com.mediaflow.presentation.di.LocalAppDependencies
import com.mediaflow.presentation.home.GuideCard
import com.mediaflow.presentation.home.HomeViewModel
import com.mediaflow.presentation.util.BackTopBar
import com.mediaflow.presentation.util.Intents

@Composable
fun PlatformScreen(platform: Platform, vm: HomeViewModel, onBack: () -> Unit) {
    val deps = LocalAppDependencies.current
    val module = deps.platforms.moduleFor(platform) ?: return
    val context = LocalContext.current
    val favorites by vm.favorites.collectAsStateWithLifecycle()
    val mine = favorites.filter { it.platform == platform }
    val accent = Color(module.accentArgb)

    Column(Modifier.fillMaxSize()) {
        BackTopBar(platform.displayName, onBack)
        LazyColumn(
            Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            item {
                MfCard(Modifier.fillMaxWidth()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Monogram(module.monogram, accent, size = 56.dp)
                        Spacer(Modifier.width(14.dp))
                        Column(Modifier.weight(1f)) {
                            Text(platform.displayName, style = MaterialTheme.typography.headlineSmall)
                            Text(module.tagline, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                    Spacer(Modifier.height(14.dp))
                    Text(
                        "Módulo independiente que usa solo métodos oficiales de ${platform.displayName}. " +
                            "MediaFlow no accede a contenido privado, no solicita tus credenciales y no evita restricciones de descarga.",
                        style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(16.dp))
                    GradientButton(
                        "Abrir ${platform.displayName}", { Intents.openUrl(context, module.homeUrl, module.officialPackage) },
                        Modifier.fillMaxWidth(), icon = Icons.AutoMirrored.Rounded.OpenInNew,
                    )
                }
            }
            item { GuideCard(module.officialGuide(), initiallyExpanded = true) }
            item {
                MfCard(Modifier.fillMaxWidth(), containerColor = MfColors.Azure.copy(alpha = 0.08f)) {
                    Text("Comparte desde la app oficial", style = MaterialTheme.typography.titleSmall)
                    Text(
                        "En ${platform.displayName}, toca «Compartir» y elige MediaFlow: el enlace se analizará automáticamente.",
                        style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            item { SectionHeader("Enlaces guardados", Modifier.padding(start = 4.dp, top = 6.dp)) }
            if (mine.isEmpty()) {
                item { EmptyState(Icons.Rounded.BookmarkBorder, "Sin enlaces guardados", "Analiza un enlace de ${platform.displayName} y guárdalo en favoritos.") }
            } else {
                items(mine, key = { it.url }) { FavoriteRow(it, onRemove = { vm.removeFavorite(it.url) }) }
            }
        }
    }
}

@Composable
fun FavoritesScreen(vm: HomeViewModel, onBack: () -> Unit) {
    val favorites by vm.favorites.collectAsStateWithLifecycle()
    Column(Modifier.fillMaxSize()) {
        BackTopBar("Favoritos", onBack)
        if (favorites.isEmpty()) {
            EmptyState(Icons.Rounded.BookmarkBorder, "Aún no hay favoritos", "Guarda enlaces desde el analizador para tenerlos a mano.")
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.navigationBarsPadding(),
            ) {
                items(favorites, key = { it.url }) { FavoriteRow(it, onRemove = { vm.removeFavorite(it.url) }) }
            }
        }
    }
}

@Composable
private fun FavoriteRow(fav: Favorite, onRemove: () -> Unit) {
    val context = LocalContext.current
    val deps = LocalAppDependencies.current
    val module = deps.platforms.moduleFor(fav.platform)
    MfCard(Modifier.fillMaxWidth(), onClick = { Intents.openUrl(context, fav.url, module?.officialPackage) }, contentPadding = PaddingValues(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Monogram(module?.monogram ?: "↗", module?.let { Color(it.accentArgb) } ?: MfColors.Violet, size = 40.dp)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(fav.title ?: fav.url, style = MaterialTheme.typography.titleSmall, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Text("${fav.platform.displayName} · ${Format.date(fav.createdAt)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            IconButton(onClick = { Intents.shareText(context, fav.url) }) { Icon(Icons.Rounded.Share, "Compartir") }
            IconButton(onClick = onRemove) { Icon(Icons.Rounded.BookmarkRemove, "Quitar") }
        }
    }
}
