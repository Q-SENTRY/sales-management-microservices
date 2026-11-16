package com.mediaflow.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.CompositionLocalProvider
import androidx.core.content.ContextCompat
import androidx.core.content.IntentCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.mediaflow.presentation.di.LocalAppDependencies
import com.mediaflow.presentation.navigation.IncomingShare
import com.mediaflow.presentation.navigation.MediaFlowApp
import com.mediaflow.presentation.navigation.SharedContent
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private val incoming = IncomingShare()
    private val container get() = (application as MediaFlowApplication).container

    private val notificationPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        container.player.connect()
        if (savedInstanceState == null) handleIntent(intent)

        setContent {
            CompositionLocalProvider(LocalAppDependencies provides container) {
                MediaFlowApp(incoming)
            }
        }

        // El permiso de notificaciones se pide solo cuando el usuario inicia su primera descarga.
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                container.downloads.observeAll()
                    .map { list -> list.any { it.status.isActive } }
                    .distinctUntilChanged()
                    .collect { active -> if (active) maybeAskNotifications() }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun maybeAskNotifications() {
        if (Build.VERSION.SDK_INT < 33) return
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) return
        val prefs = getSharedPreferences("mediaflow_ui", MODE_PRIVATE)
        if (prefs.getBoolean("asked_notifications", false)) return
        prefs.edit().putBoolean("asked_notifications", true).apply()
        notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
    }

    private fun handleIntent(intent: Intent?) {
        intent ?: return
        when (intent.action) {
            Intent.ACTION_SEND -> {
                if (intent.type == "text/plain") {
                    intent.getStringExtra(Intent.EXTRA_TEXT)?.takeIf { it.isNotBlank() }?.let { incoming.offer(SharedContent.Link(it)) }
                } else {
                    IntentCompat.getParcelableExtra(intent, Intent.EXTRA_STREAM, Uri::class.java)?.let {
                        incoming.offer(SharedContent.Files(listOf(it)))
                    }
                }
            }
            Intent.ACTION_SEND_MULTIPLE -> {
                IntentCompat.getParcelableArrayListExtra(intent, Intent.EXTRA_STREAM, Uri::class.java)
                    ?.takeIf { it.isNotEmpty() }?.let { incoming.offer(SharedContent.Files(it)) }
            }
        }
    }
}
