package com.mediaflow.presentation.util

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import com.mediaflow.domain.model.LibraryItem
import com.mediaflow.domain.model.MediaKind
import com.mediaflow.domain.model.PlayableItem

object Intents {
    fun openUrl(context: Context, url: String, packageName: String? = null) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        if (packageName != null) {
            try {
                context.startActivity(Intent(intent).setPackage(packageName)); return
            } catch (_: ActivityNotFoundException) { /* app oficial no instalada: se abre en el navegador */ }
        }
        try { context.startActivity(intent) } catch (_: ActivityNotFoundException) {
            Toast.makeText(context, "No hay ninguna app para abrir este enlace", Toast.LENGTH_SHORT).show()
        }
    }

    fun openFile(context: Context, uri: String, mime: String?) {
        val intent = Intent(Intent.ACTION_VIEW).setDataAndType(Uri.parse(uri), mime ?: "*/*")
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        try { context.startActivity(intent) } catch (_: ActivityNotFoundException) {
            Toast.makeText(context, "No hay ninguna app para abrir este archivo", Toast.LENGTH_SHORT).show()
        }
    }

    fun share(context: Context, uris: List<String>, mime: String?) {
        if (uris.isEmpty()) return
        val intent = if (uris.size == 1) {
            Intent(Intent.ACTION_SEND).putExtra(Intent.EXTRA_STREAM, Uri.parse(uris.first()))
        } else {
            Intent(Intent.ACTION_SEND_MULTIPLE).putParcelableArrayListExtra(Intent.EXTRA_STREAM, ArrayList(uris.map(Uri::parse)))
        }.setType(mime ?: "*/*").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        context.startActivity(Intent.createChooser(intent, "Compartir").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    fun shareText(context: Context, text: String) {
        val intent = Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text)
        context.startActivity(Intent.createChooser(intent, "Compartir enlace").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
}

fun LibraryItem.isPlayable() = kind == MediaKind.VIDEO || kind == MediaKind.AUDIO

fun LibraryItem.toPlayable() = PlayableItem(
    uri = uri,
    title = name,
    subtitle = artist ?: album ?: folder,
    isVideo = kind == MediaKind.VIDEO,
)
