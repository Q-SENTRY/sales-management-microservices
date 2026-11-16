package com.mediaflow.data.storage

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Environment
import android.os.StatFs
import android.provider.MediaStore
import androidx.documentfile.provider.DocumentFile
import com.mediaflow.domain.model.MediaKind
import com.mediaflow.domain.util.FileNames
import java.io.File
import java.io.InputStream

data class StorageStats(val totalBytes: Long, val availableBytes: Long, val appCacheBytes: Long)

/**
 * Punto único para guardar resultados. Usa MediaStore (Movies/Music/Download/MediaFlow)
 * sin permisos adicionales, o una carpeta elegida por el usuario vía Storage Access Framework.
 */
class OutputStorage(private val context: Context) {

    companion object {
        const val FOLDER = "MediaFlow"
    }

    fun partialDir(): File = File(context.filesDir, "partial").apply { mkdirs() }
    fun workDir(): File = File(context.cacheDir, "work").apply { mkdirs() }

    /** Copia `source` al destino final y devuelve su Uri. */
    fun save(source: File, displayName: String, mimeType: String?, customTreeUri: String?): Uri =
        source.inputStream().use { save(it, displayName, mimeType, customTreeUri) }

    fun save(input: InputStream, displayName: String, mimeType: String?, customTreeUri: String?): Uri {
        val name = FileNames.sanitize(displayName)
        val mime = mimeType ?: "application/octet-stream"
        if (customTreeUri != null) {
            val tree = DocumentFile.fromTreeUri(context, Uri.parse(customTreeUri))
            if (tree != null && tree.canWrite()) {
                val doc = tree.createFile(mime, name) ?: error("No se pudo crear el archivo en la carpeta elegida")
                context.contentResolver.openOutputStream(doc.uri)?.use { out -> input.copyTo(out, 256 * 1024) }
                    ?: error("No se pudo escribir en la carpeta elegida")
                return doc.uri
            }
        }
        val (collection, relative) = when (MediaKind.fromMime(mime)) {
            MediaKind.VIDEO -> MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY) to "${Environment.DIRECTORY_MOVIES}/$FOLDER"
            MediaKind.AUDIO -> MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY) to "${Environment.DIRECTORY_MUSIC}/$FOLDER"
            MediaKind.IMAGE -> MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY) to "${Environment.DIRECTORY_PICTURES}/$FOLDER"
            else -> MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY) to "${Environment.DIRECTORY_DOWNLOADS}/$FOLDER"
        }
        val resolver = context.contentResolver
        val values = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, name)
            put(MediaStore.MediaColumns.MIME_TYPE, mime)
            put(MediaStore.MediaColumns.RELATIVE_PATH, relative)
            put(MediaStore.MediaColumns.IS_PENDING, 1)
        }
        val uri = resolver.insert(collection, values) ?: error("El sistema no permitió crear el archivo")
        try {
            resolver.openOutputStream(uri)?.use { out -> input.copyTo(out, 256 * 1024) } ?: error("No se pudo escribir el archivo")
            resolver.update(uri, ContentValues().apply { put(MediaStore.MediaColumns.IS_PENDING, 0) }, null, null)
        } catch (e: Exception) {
            resolver.delete(uri, null, null)
            throw e
        }
        return uri
    }

    fun stats(): StorageStats {
        val stat = StatFs(Environment.getExternalStorageDirectory().path)
        val cache = (context.cacheDir.walkTopDown().filter { it.isFile }.sumOf { it.length() }) +
            partialDir().walkTopDown().filter { it.isFile }.sumOf { it.length() }
        return StorageStats(stat.totalBytes, stat.availableBytes, cache)
    }

    /** Libera temporales: caché de trabajo y descargas parciales huérfanas. */
    fun clearTemporary(keepPartials: Set<String>): Long {
        var freed = 0L
        context.cacheDir.listFiles()?.forEach { f -> freed += f.walkTopDown().filter { it.isFile }.sumOf { it.length() }; f.deleteRecursively() }
        partialDir().listFiles()?.forEach { f ->
            if (f.absolutePath !in keepPartials) { freed += f.length(); f.delete() }
        }
        return freed
    }
}
