package com.mediaflow.library

import android.Manifest
import android.app.RecoverableSecurityException
import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.content.IntentSender
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.provider.DocumentsContract
import android.provider.MediaStore
import androidx.core.content.ContextCompat
import androidx.documentfile.provider.DocumentFile
import com.mediaflow.data.storage.OutputStorage
import com.mediaflow.domain.model.LibraryItem
import com.mediaflow.domain.model.MediaKind
import com.mediaflow.domain.util.FileNames
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.withContext

sealed interface ModifyResult {
    data object Done : ModifyResult
    /** Android requiere confirmación del usuario (archivos de otras apps). */
    data class NeedsConsent(val intentSender: IntentSender) : ModifyResult
    data class Failed(val message: String) : ModifyResult
}

data class LibrarySnapshot(
    val videos: List<LibraryItem>,
    val audio: List<LibraryItem>,
    val files: List<LibraryItem>,
    val hasFullMediaAccess: Boolean,
)

/**
 * Biblioteca local basada en MediaStore y en la carpeta SAF elegida por el usuario.
 * Sin permisos solo se ven los archivos creados por MediaFlow; con READ_MEDIA_* se
 * muestra toda la biblioteca de vídeo y música del dispositivo.
 */
class MediaLibrary(private val context: Context) {

    private val resolver get() = context.contentResolver
    private val external = MediaStore.VOLUME_EXTERNAL

    fun mediaPermissions(): Array<String> =
        if (Build.VERSION.SDK_INT >= 33) arrayOf(Manifest.permission.READ_MEDIA_VIDEO, Manifest.permission.READ_MEDIA_AUDIO)
        else arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)

    fun hasFullMediaAccess(): Boolean = mediaPermissions().all {
        ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
    }

    /** Emite cuando cambia MediaStore (descargas nuevas, archivos eliminados, etc.). */
    fun changes(): Flow<Unit> = callbackFlow {
        val observer = object : android.database.ContentObserver(android.os.Handler(android.os.Looper.getMainLooper())) {
            override fun onChange(selfChange: Boolean) { trySend(Unit) }
        }
        resolver.registerContentObserver(MediaStore.Files.getContentUri(external), true, observer)
        awaitClose { resolver.unregisterContentObserver(observer) }
    }

    suspend fun load(customTreeUri: String?): LibrarySnapshot = withContext(Dispatchers.IO) {
        LibrarySnapshot(
            videos = runCatching { queryVideos() }.getOrDefault(emptyList()),
            audio = runCatching { queryAudio() }.getOrDefault(emptyList()),
            files = runCatching { queryAppFiles() + queryTree(customTreeUri) }.getOrDefault(emptyList())
                .distinctBy { it.uri },
            hasFullMediaAccess = hasFullMediaAccess(),
        )
    }

    private fun queryVideos(): List<LibraryItem> {
        val uri = MediaStore.Video.Media.getContentUri(external)
        val projection = arrayOf(
            MediaStore.Video.Media._ID, MediaStore.Video.Media.DISPLAY_NAME, MediaStore.Video.Media.MIME_TYPE,
            MediaStore.Video.Media.SIZE, MediaStore.Video.Media.DATE_MODIFIED, MediaStore.Video.Media.DURATION,
            MediaStore.Video.Media.WIDTH, MediaStore.Video.Media.HEIGHT, MediaStore.Video.Media.RELATIVE_PATH,
            MediaStore.Video.Media.OWNER_PACKAGE_NAME,
        )
        return resolver.query(uri, projection, null, null, "${MediaStore.Video.Media.DATE_MODIFIED} DESC")?.use { c ->
            buildList {
                while (c.moveToNext()) {
                    val id = c.getLong(0)
                    add(
                        LibraryItem(
                            uri = ContentUris.withAppendedId(uri, id).toString(),
                            name = c.getString(1) ?: "vídeo",
                            mimeType = c.getString(2),
                            kind = MediaKind.VIDEO,
                            sizeBytes = c.getLong(3),
                            dateModifiedMillis = c.getLong(4) * 1000,
                            durationMs = c.longOrNull(5),
                            width = c.intOrNull(6),
                            height = c.intOrNull(7),
                            folder = c.getString(8)?.trimEnd('/'),
                            ownedByApp = c.getString(9) == context.packageName,
                        ),
                    )
                }
            }
        }.orEmpty()
    }

    private fun queryAudio(): List<LibraryItem> {
        val uri = MediaStore.Audio.Media.getContentUri(external)
        val projection = arrayOf(
            MediaStore.Audio.Media._ID, MediaStore.Audio.Media.DISPLAY_NAME, MediaStore.Audio.Media.MIME_TYPE,
            MediaStore.Audio.Media.SIZE, MediaStore.Audio.Media.DATE_MODIFIED, MediaStore.Audio.Media.DURATION,
            MediaStore.Audio.Media.TITLE, MediaStore.Audio.Media.ARTIST, MediaStore.Audio.Media.ALBUM,
            MediaStore.Audio.Media.RELATIVE_PATH, MediaStore.Audio.Media.OWNER_PACKAGE_NAME,
        )
        return resolver.query(uri, projection, null, null, "${MediaStore.Audio.Media.DATE_MODIFIED} DESC")?.use { c ->
            buildList {
                while (c.moveToNext()) {
                    val id = c.getLong(0)
                    val artist = c.getString(7)?.takeUnless { it == MediaStore.UNKNOWN_STRING || it.isBlank() }
                    add(
                        LibraryItem(
                            uri = ContentUris.withAppendedId(uri, id).toString(),
                            name = c.getString(6)?.takeIf { it.isNotBlank() } ?: FileNames.withoutExtension(c.getString(1) ?: "audio"),
                            mimeType = c.getString(2),
                            kind = MediaKind.AUDIO,
                            sizeBytes = c.getLong(3),
                            dateModifiedMillis = c.getLong(4) * 1000,
                            durationMs = c.longOrNull(5),
                            artist = artist,
                            album = c.getString(8)?.takeUnless { it == MediaStore.UNKNOWN_STRING },
                            folder = c.getString(9)?.trimEnd('/'),
                            ownedByApp = c.getString(10) == context.packageName,
                        ),
                    )
                }
            }
        }.orEmpty()
    }

    /** Todos los archivos guardados por MediaFlow en carpetas públicas (vídeo, música, descargas…). */
    private fun queryAppFiles(): List<LibraryItem> {
        val uri = MediaStore.Files.getContentUri(external)
        val projection = arrayOf(
            MediaStore.Files.FileColumns._ID, MediaStore.Files.FileColumns.DISPLAY_NAME, MediaStore.Files.FileColumns.MIME_TYPE,
            MediaStore.Files.FileColumns.SIZE, MediaStore.Files.FileColumns.DATE_MODIFIED, MediaStore.Files.FileColumns.RELATIVE_PATH,
            MediaStore.Files.FileColumns.MEDIA_TYPE, MediaStore.Files.FileColumns.DURATION,
        )
        val selection = "${MediaStore.Files.FileColumns.RELATIVE_PATH} LIKE ? AND ${MediaStore.Files.FileColumns.MIME_TYPE} IS NOT NULL"
        val args = arrayOf("%/${OutputStorage.FOLDER}/%")
        return resolver.query(uri, projection, selection, args, "${MediaStore.Files.FileColumns.DATE_MODIFIED} DESC")?.use { c ->
            buildList {
                while (c.moveToNext()) {
                    val id = c.getLong(0)
                    val mime = c.getString(2)
                    val itemUri = when (c.getInt(6)) {
                        MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO -> ContentUris.withAppendedId(MediaStore.Video.Media.getContentUri(external), id)
                        MediaStore.Files.FileColumns.MEDIA_TYPE_AUDIO -> ContentUris.withAppendedId(MediaStore.Audio.Media.getContentUri(external), id)
                        MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE -> ContentUris.withAppendedId(MediaStore.Images.Media.getContentUri(external), id)
                        else -> ContentUris.withAppendedId(uri, id)
                    }
                    add(
                        LibraryItem(
                            uri = itemUri.toString(),
                            name = c.getString(1) ?: "archivo",
                            mimeType = mime,
                            kind = MediaKind.fromMime(mime),
                            sizeBytes = c.getLong(3),
                            dateModifiedMillis = c.getLong(4) * 1000,
                            folder = c.getString(5)?.trimEnd('/'),
                            durationMs = c.longOrNull(7),
                            ownedByApp = true,
                        ),
                    )
                }
            }
        }.orEmpty()
    }

    private fun queryTree(treeUri: String?): List<LibraryItem> {
        if (treeUri == null) return emptyList()
        val root = DocumentFile.fromTreeUri(context, Uri.parse(treeUri)) ?: return emptyList()
        if (!root.canRead()) return emptyList()
        val out = mutableListOf<LibraryItem>()
        fun walk(dir: DocumentFile, path: String, depth: Int) {
            dir.listFiles().forEach { f ->
                if (f.isDirectory && depth < 2) walk(f, "$path/${f.name}", depth + 1)
                else if (f.isFile) out += LibraryItem(
                    uri = f.uri.toString(),
                    name = f.name ?: "archivo",
                    mimeType = f.type,
                    kind = MediaKind.fromMime(f.type),
                    sizeBytes = f.length(),
                    dateModifiedMillis = f.lastModified(),
                    folder = path,
                    ownedByApp = true,
                    fromDocumentTree = true,
                )
            }
        }
        walk(root, root.name ?: "Carpeta", 0)
        return out
    }

    suspend fun rename(item: LibraryItem, newName: String): ModifyResult = withContext(Dispatchers.IO) {
        val ext = FileNames.extension(item.name)
        val base = FileNames.sanitize(FileNames.withoutExtension(newName))
        val target = if (ext != null && FileNames.extension(newName) != ext) "$base.$ext" else FileNames.sanitize(newName)
        val uri = Uri.parse(item.uri)
        try {
            if (item.fromDocumentTree || DocumentsContract.isDocumentUri(context, uri)) {
                DocumentsContract.renameDocument(resolver, uri, target) ?: return@withContext ModifyResult.Failed("No se pudo renombrar")
                return@withContext ModifyResult.Done
            }
            val values = ContentValues().apply { put(MediaStore.MediaColumns.DISPLAY_NAME, target) }
            val n = resolver.update(uri, values, null, null)
            if (n > 0) ModifyResult.Done else ModifyResult.Failed("No se pudo renombrar")
        } catch (e: SecurityException) {
            consentFor(e, uri, write = true) ?: ModifyResult.Failed("Permiso denegado para renombrar")
        } catch (e: Exception) {
            ModifyResult.Failed(e.message ?: "No se pudo renombrar")
        }
    }

    /** Tras aprobar la solicitud de escritura del sistema, se repite el renombrado. */
    suspend fun renameAfterConsent(item: LibraryItem, newName: String): ModifyResult = rename(item, newName)

    suspend fun delete(items: List<LibraryItem>): ModifyResult = withContext(Dispatchers.IO) {
        val docs = items.filter { it.fromDocumentTree }
        val media = items - docs.toSet()
        docs.forEach { runCatching { DocumentsContract.deleteDocument(resolver, Uri.parse(it.uri)) } }
        if (media.isEmpty()) return@withContext ModifyResult.Done
        val uris = media.map { Uri.parse(it.uri) }
        val (owned, foreign) = media.partition { it.ownedByApp }
        owned.forEach { runCatching { resolver.delete(Uri.parse(it.uri), null, null) } }
        if (foreign.isEmpty()) return@withContext ModifyResult.Done
        if (Build.VERSION.SDK_INT >= 30) {
            val pi = MediaStore.createDeleteRequest(resolver, foreign.map { Uri.parse(it.uri) })
            return@withContext ModifyResult.NeedsConsent(pi.intentSender)
        }
        try {
            foreign.forEach { resolver.delete(Uri.parse(it.uri), null, null) }
            ModifyResult.Done
        } catch (e: SecurityException) {
            consentFor(e, uris.first(), write = false) ?: ModifyResult.Failed("Permiso denegado para eliminar")
        }
    }

    private fun consentFor(e: SecurityException, uri: Uri, write: Boolean): ModifyResult? {
        if (Build.VERSION.SDK_INT >= 30 && write) {
            return ModifyResult.NeedsConsent(MediaStore.createWriteRequest(resolver, listOf(uri)).intentSender)
        }
        if (e is RecoverableSecurityException) return ModifyResult.NeedsConsent(e.userAction.actionIntent.intentSender)
        return null
    }

    /** Importa un archivo elegido por el usuario (SAF) a la biblioteca de MediaFlow. */
    suspend fun import(source: Uri, storage: OutputStorage, customTreeUri: String?): Uri = withContext(Dispatchers.IO) {
        var name = "importado"
        resolver.query(source, arrayOf(MediaStore.MediaColumns.DISPLAY_NAME), null, null, null)?.use { c ->
            if (c.moveToFirst()) c.getString(0)?.let { name = it }
        }
        val mime = resolver.getType(source)
        resolver.openInputStream(source)?.use { storage.save(it, name, mime, customTreeUri) }
            ?: error("No se pudo leer el archivo seleccionado")
    }

    private fun Cursor.longOrNull(i: Int) = if (isNull(i)) null else getLong(i).takeIf { it > 0 }
    private fun Cursor.intOrNull(i: Int) = if (isNull(i)) null else getInt(i).takeIf { it > 0 }
}
