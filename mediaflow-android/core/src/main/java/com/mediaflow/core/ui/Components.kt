package com.mediaflow.core.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.mediaflow.core.designsystem.MfColors
import com.mediaflow.core.designsystem.MfTheme

/** Isotipo de MediaFlow: una "M" trazada como una onda continua sobre el degradado de marca. */
@Composable
fun MediaFlowMark(size: Dp = 40.dp, modifier: Modifier = Modifier) {
    Canvas(modifier.size(size)) {
        val s = this.size.minDimension
        drawRoundRect(brush = MfColors.brand, size = Size(s, s), cornerRadius = CornerRadius(s * 0.3f))
        val stroke = s * 0.095f
        val path = Path().apply {
            moveTo(s * 0.22f, s * 0.70f)
            cubicTo(s * 0.26f, s * 0.42f, s * 0.30f, s * 0.30f, s * 0.36f, s * 0.30f)
            cubicTo(s * 0.44f, s * 0.30f, s * 0.44f, s * 0.58f, s * 0.50f, s * 0.58f)
            cubicTo(s * 0.56f, s * 0.58f, s * 0.56f, s * 0.30f, s * 0.64f, s * 0.30f)
            cubicTo(s * 0.70f, s * 0.30f, s * 0.74f, s * 0.42f, s * 0.78f, s * 0.70f)
        }
        drawPath(path, Color.White, style = Stroke(width = stroke, cap = StrokeCap.Round, join = StrokeJoin.Round))
        drawCircle(Color.White.copy(alpha = 0.9f), radius = stroke * 0.55f, center = Offset(s * 0.50f, s * 0.77f))
    }
}

@Composable
fun MediaFlowWordmark(modifier: Modifier = Modifier, showTagline: Boolean = false) {
    Column(modifier) {
        Text(
            buildAnnotatedString {
                withStyle(SpanStyle(fontWeight = FontWeight.Black)) { append("MEDIA") }
                withStyle(SpanStyle(fontWeight = FontWeight.Light)) { append("FLOW") }
            },
            fontSize = 20.sp,
            letterSpacing = 0.12.em,
            color = MaterialTheme.colorScheme.onBackground,
        )
        if (showTagline) {
            Text(
                "Your Media. Organized.",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/** Tarjeta base con borde finísimo; evita las sombras genéricas de Material. */
@Composable
fun MfCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    contentPadding: PaddingValues = PaddingValues(16.dp),
    containerColor: Color = MaterialTheme.colorScheme.surfaceContainer,
    content: @Composable ColumnScope.() -> Unit,
) {
    val shape = MaterialTheme.shapes.large
    val border = BorderStroke(1.dp, MfTheme.extended.cardBorder)
    if (onClick != null) {
        Surface(onClick = onClick, modifier = modifier, shape = shape, color = containerColor, border = border) {
            Column(Modifier.padding(contentPadding), content = content)
        }
    } else {
        Surface(modifier = modifier, shape = shape, color = containerColor, border = border) {
            Column(Modifier.padding(contentPadding), content = content)
        }
    }
}

@Composable
fun SectionHeader(title: String, modifier: Modifier = Modifier, actionLabel: String? = null, onAction: (() -> Unit)? = null) {
    Row(modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(
            title.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f),
        )
        if (actionLabel != null && onAction != null) {
            TextButton(onClick = onAction, contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp)) {
                Text(actionLabel, style = MaterialTheme.typography.labelLarge)
            }
        }
    }
}

/** Botón principal con el degradado de marca. */
@Composable
fun GradientButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    icon: ImageVector? = null,
    loading: Boolean = false,
) {
    val alpha by animateFloatAsState(if (enabled) 1f else 0.4f, label = "btnAlpha")
    Box(
        modifier
            .height(52.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(MfColors.brandHorizontal, alpha = alpha)
            .clickable(enabled = enabled && !loading, onClick = onClick)
            .padding(horizontal = 20.dp),
        contentAlignment = Alignment.Center,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (loading) {
                androidx.compose.material3.CircularProgressIndicator(Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                Spacer(Modifier.width(10.dp))
            } else if (icon != null) {
                Icon(icon, null, tint = Color.White, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(8.dp))
            }
            Text(text, color = Color.White, style = MaterialTheme.typography.labelLarge, maxLines = 1)
        }
    }
}

/** Barra de progreso real: si `progress` es null se muestra indeterminada. */
@Composable
fun FlowProgressBar(progress: Float?, modifier: Modifier = Modifier, height: Dp = 6.dp, brush: Brush = MfColors.brandHorizontal) {
    val track = MaterialTheme.colorScheme.surfaceContainerHighest
    if (progress == null) {
        androidx.compose.material3.LinearProgressIndicator(
            modifier = modifier.fillMaxWidth().height(height).clip(CircleShape),
            color = MaterialTheme.colorScheme.secondary,
            trackColor = track,
        )
        return
    }
    val animated by animateFloatAsState(progress.coerceIn(0f, 1f), tween(400), label = "progress")
    Canvas(modifier.fillMaxWidth().height(height)) {
        val r = CornerRadius(size.height / 2)
        drawRoundRect(track, cornerRadius = r)
        if (animated > 0f) drawRoundRect(brush, size = Size(size.width * animated, size.height), cornerRadius = r)
    }
}

@Composable
fun IconBadge(icon: ImageVector, tint: Color, modifier: Modifier = Modifier, size: Dp = 40.dp) {
    Box(
        modifier.size(size).clip(RoundedCornerShape(size * 0.32f)).background(tint.copy(alpha = 0.14f)),
        contentAlignment = Alignment.Center,
    ) { Icon(icon, null, tint = tint, modifier = Modifier.size(size * 0.5f)) }
}

/** Monograma de plataforma: evitamos reproducir logotipos de marcas de terceros. */
@Composable
fun Monogram(text: String, color: Color, modifier: Modifier = Modifier, size: Dp = 44.dp) {
    Box(
        modifier.size(size).clip(RoundedCornerShape(size * 0.3f)).background(color.copy(alpha = 0.16f)),
        contentAlignment = Alignment.Center,
    ) {
        Text(text, color = color, fontWeight = FontWeight.Black, fontSize = (size.value * 0.32f).sp, letterSpacing = 0.02.em)
    }
}

@Composable
fun StatusChip(text: String, color: Color, modifier: Modifier = Modifier) {
    Box(
        modifier.clip(CircleShape).background(color.copy(alpha = 0.14f)).padding(horizontal = 10.dp, vertical = 3.dp),
    ) { Text(text, color = color, style = MaterialTheme.typography.labelMedium, maxLines = 1) }
}

@Composable
fun EmptyState(icon: ImageVector, title: String, message: String, modifier: Modifier = Modifier, action: (@Composable () -> Unit)? = null) {
    Column(
        modifier.fillMaxWidth().padding(vertical = 40.dp, horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        IconBadge(icon, MaterialTheme.colorScheme.primary, size = 64.dp)
        Spacer(Modifier.height(4.dp))
        Text(title, style = MaterialTheme.typography.titleMedium, textAlign = TextAlign.Center)
        Text(message, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
        if (action != null) { Spacer(Modifier.height(6.dp)); action() }
    }
}

@Composable
fun KeyValueRow(label: String, value: String, modifier: Modifier = Modifier) {
    Row(modifier.fillMaxWidth().padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f))
        Text(value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}
