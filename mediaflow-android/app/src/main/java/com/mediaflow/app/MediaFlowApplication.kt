package com.mediaflow.app

import android.app.Application
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ProcessLifecycleOwner
import androidx.work.Configuration
import com.mediaflow.downloader.DownloadNotifications
import com.mediaflow.downloader.DownloaderDependencies
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

open class MediaFlowApplication : Application(), DownloaderDependencies.Provider, Configuration.Provider {

    lateinit var container: AppContainer
        private set

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
        DownloadNotifications.createChannels(this)

        // Si el usuario desactiva el audio en segundo plano, se pausa al salir de la app.
        ProcessLifecycleOwner.get().lifecycle.addObserver(object : DefaultLifecycleObserver {
            override fun onStop(owner: LifecycleOwner) {
                appScope.launch {
                    if (!container.settings.settings.first().backgroundAudio) container.player.pause()
                }
            }
        })
    }

    override fun downloaderDependencies(): DownloaderDependencies = container

    /** WorkManager se inicializa bajo demanda (la primera vez que se programa una descarga). */
    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder().setMinimumLoggingLevel(android.util.Log.WARN).build()
}
