package com.mediaflow.presentation.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.Remove
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mediaflow.core.designsystem.MfColors
import com.mediaflow.core.ui.GradientButton
import com.mediaflow.core.ui.MediaFlowMark
import com.mediaflow.core.ui.MfCard
import com.mediaflow.core.ui.SectionHeader
import com.mediaflow.domain.model.Tier
import com.mediaflow.presentation.util.BackTopBar

private data class Row3(val feature: String, val free: String?, val premium: String)

private val comparison = listOf(
    Row3("Biblioteca multimedia", "✓", "✓"),
    Row3("Reproductor y segundo plano", "✓", "✓"),
    Row3("Gestión de archivos", "✓", "✓"),
    Row3("Descargas de enlaces directos", "✓", "✓"),
    Row3("Conversión MP4 · M4A · WAV", "Hasta 15 min", "Sin límite"),
    Row3("Conversión AAC (ADTS)", null, "✓"),
    Row3("Calidad de audio", "Hasta 128 kbps", "Hasta 320 kbps"),
    Row3("Ordenar por tamaño y duración", null, "✓"),
    Row3("Filtros por carpeta", null, "✓"),
    Row3("Temporizador y velocidades 2.5–3×", null, "✓"),
    Row3("Sin publicidad", "—", "✓"),
)

@Composable
fun PremiumScreen(vm: SettingsViewModel, onBack: () -> Unit) {
    val tier by vm.tier.collectAsStateWithLifecycle()
    Column(Modifier.fillMaxSize()) {
        BackTopBar("Premium", onBack)
        LazyColumn(
            Modifier.fillMaxSize().navigationBarsPadding(),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            item {
                Box(
                    Modifier.fillMaxWidth().clip(RoundedCornerShape(28.dp)).background(MfColors.brand).padding(24.dp),
                ) {
                    Column {
                        MediaFlowMark(48.dp)
                        Spacer(Modifier.height(16.dp))
                        Text("MediaFlow Premium", style = MaterialTheme.typography.headlineMedium, color = Color.White)
                        Text(
                            "Herramientas avanzadas para quien organiza mucho contenido. Sin anuncios, sin rastreo.",
                            style = MaterialTheme.typography.bodyMedium, color = Color.White.copy(alpha = 0.85f),
                        )
                    }
                }
            }
            item { SectionHeader("Comparativa", Modifier.padding(start = 4.dp)) }
            item {
                MfCard(Modifier.fillMaxWidth(), contentPadding = PaddingValues(vertical = 8.dp, horizontal = 16.dp)) {
                    Row(Modifier.padding(vertical = 8.dp)) {
                        Spacer(Modifier.weight(1.4f))
                        Text("Gratis", style = MaterialTheme.typography.labelLarge, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                        Text("Premium", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                    }
                    comparison.forEach { r ->
                        Row(Modifier.padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text(r.feature, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1.4f))
                            Cell(r.free, Modifier.weight(1f))
                            Cell(r.premium, Modifier.weight(1f), highlight = true)
                        }
                    }
                }
            }
            item {
                MfCard(Modifier.fillMaxWidth()) {
                    Text("Suscripción", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(6.dp))
                    Text(
                        if (vm.billingAvailable) "Gestiona tu suscripción con Google Play."
                        else "Las compras se realizarán con Google Play Billing. La integración está preparada y se activará en la versión publicada en Google Play.",
                        style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(14.dp))
                    GradientButton(
                        if (tier == Tier.PREMIUM) "Premium activo" else "Disponible próximamente en Google Play",
                        onClick = {}, enabled = false, modifier = Modifier.fillMaxWidth(),
                    )
                    if (vm.premiumPreviewEnabled) {
                        Spacer(Modifier.height(16.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text("Vista previa de Premium", style = MaterialTheme.typography.titleSmall)
                                Text("Solo para pruebas: activa las funciones sin ningún cobro.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Switch(tier == Tier.PREMIUM, { vm.setPreviewTier(if (it) Tier.PREMIUM else Tier.FREE) })
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun Cell(value: String?, modifier: Modifier, highlight: Boolean = false) {
    Box(modifier, contentAlignment = Alignment.Center) {
        when (value) {
            null -> Icon(Icons.Rounded.Remove, null, tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f), modifier = Modifier.size(18.dp))
            "✓" -> Icon(Icons.Rounded.Check, null, tint = if (highlight) MfColors.Cyan else MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(20.dp))
            else -> Text(value, style = MaterialTheme.typography.labelMedium, textAlign = TextAlign.Center,
                color = if (highlight) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun AboutScreen(version: String, onBack: () -> Unit) {
    Column(Modifier.fillMaxSize()) {
        BackTopBar("Acerca de", onBack)
        LazyColumn(
            Modifier.fillMaxSize().navigationBarsPadding(),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            item {
                Column(Modifier.fillMaxWidth().padding(vertical = 16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    MediaFlowMark(72.dp)
                    Spacer(Modifier.height(14.dp))
                    com.mediaflow.core.ui.MediaFlowWordmark()
                    Text("Your Media. Organized.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("Versión $version", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 6.dp))
                }
            }
            items(
                listOf(
                    "Uso responsable" to "MediaFlow solo descarga archivos que su origen ofrece públicamente mediante enlaces directos. No extrae contenido de plataformas, no evita DRM ni restricciones, no accede a contenido privado y no solicita credenciales. Respeta los derechos de autor y los términos de cada plataforma.",
                    "Plataformas" to "YouTube, TikTok, Instagram y Facebook son marcas de sus respectivos propietarios. MediaFlow no está afiliado a ellas; solo usa sus mecanismos públicos (oEmbed, compartir y apertura en la app oficial).",
                    "Privacidad" to "Sin cuentas, sin analíticas y sin servidores propios. Las bases de datos y preferencias se guardan solo en tu dispositivo.",
                    "Código abierto" to "Incluye AndroidX, Jetpack Compose, Room, DataStore, WorkManager, Media3 (ExoPlayer) y Coil, bajo licencia Apache 2.0. La conversión usa los códecs del sistema Android. El soporte MP3 mediante FFmpeg/LAME (LGPL) es un módulo opcional que no se distribuye en esta compilación.",
                ),
            ) { (title, body) ->
                MfCard(Modifier.fillMaxWidth()) {
                    Text(title, style = MaterialTheme.typography.titleSmall)
                    Spacer(Modifier.height(6.dp))
                    Text(body, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}
