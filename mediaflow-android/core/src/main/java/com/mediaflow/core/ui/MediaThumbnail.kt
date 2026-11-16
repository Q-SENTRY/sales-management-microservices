package com.mediaflow.core.ui

import android.graphics.Bitmap
import android.net.Uri
import android.util.LruCache
import android.util.Size
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

private object ThumbCache {
    val cache = object : LruCache<String, Bitmap>(24 * 1024 * 1024) {
        override fun sizeOf(key: String, value: Bitmap) = value.byteCount
    }
    val misses = HashSet<String>()
}

/** Miniatura de vídeo o portada de audio generada por el sistema (ContentResolver.loadThumbnail). */
@Composable
fun MediaThumbnail(uri: String, fallback: ImageVector, shape: Shape, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val bitmap by produceState<Bitmap?>(ThumbCache.cache.get(uri), uri) {
        if (value != null || uri in ThumbCache.misses) return@produceState
        value = withContext(Dispatchers.IO) {
            runCatching { context.contentResolver.loadThumbnail(Uri.parse(uri), Size(384, 384), null) }
                .onSuccess { ThumbCache.cache.put(uri, it) }
                .onFailure { synchronized(ThumbCache.misses) { ThumbCache.misses.add(uri) } }
                .getOrNull()
        }
    }
    Box(modifier.clip(shape).background(MaterialTheme.colorScheme.surfaceContainerHighest), contentAlignment = Alignment.Center) {
        val b = bitmap
        if (b != null) {
            Image(b.asImageBitmap(), null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
        } else {
            Icon(fallback, null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(22.dp))
        }
    }
}
