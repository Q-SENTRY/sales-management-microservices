package com.mediaflow.presentation.navigation

import android.net.Uri
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/** Contenido recibido desde el menú "Compartir" de otras apps (mecanismo oficial de Android). */
sealed interface SharedContent {
    data class Link(val text: String) : SharedContent
    data class Files(val uris: List<Uri>) : SharedContent
}

class IncomingShare {
    private val _pending = MutableStateFlow<SharedContent?>(null)
    val pending: StateFlow<SharedContent?> = _pending
    fun offer(content: SharedContent) { _pending.value = content }
    fun consume() { _pending.value = null }
}
