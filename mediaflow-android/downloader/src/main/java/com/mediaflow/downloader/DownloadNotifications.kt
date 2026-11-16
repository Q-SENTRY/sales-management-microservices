package com.mediaflow.downloader

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.mediaflow.core.util.Format

object DownloadNotifications {
    const val CHANNEL_PROGRESS = "downloads_progress"
    const val CHANNEL_RESULT = "downloads_result"

    fun createChannels(context: Context) {
        val nm = context.getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_PROGRESS, "Descargas en curso", NotificationManager.IMPORTANCE_LOW).apply {
                description = "Progreso real de las descargas activas"
                setShowBadge(false)
            },
        )
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_RESULT, "Descargas finalizadas", NotificationManager.IMPORTANCE_DEFAULT).apply {
                description = "Avisos cuando una descarga termina o falla"
            },
        )
    }

    fun progress(context: Context, name: String, bytes: Long, total: Long, speed: Long) =
        NotificationCompat.Builder(context, CHANNEL_PROGRESS)
            .setSmallIcon(R.drawable.ic_stat_mediaflow)
            .setContentTitle(name)
            .setContentText(
                buildString {
                    append(Format.bytes(bytes))
                    if (total > 0) append(" / ").append(Format.bytes(total))
                    if (speed > 0) append(" · ").append(Format.speed(speed))
                },
            )
            .setOnlyAlertOnce(true)
            .setOngoing(true)
            .setSilent(true)
            .setProgress(if (total > 0) 1000 else 0, if (total > 0) ((bytes * 1000) / total).toInt() else 0, total <= 0)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .build()

    fun result(context: Context, id: Long, title: String, text: String) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED &&
            android.os.Build.VERSION.SDK_INT >= 33
        ) return
        val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pi = launch?.let {
            android.app.PendingIntent.getActivity(context, id.toInt(), it, android.app.PendingIntent.FLAG_IMMUTABLE)
        }
        val n = NotificationCompat.Builder(context, CHANNEL_RESULT)
            .setSmallIcon(R.drawable.ic_stat_mediaflow)
            .setContentTitle(title)
            .setContentText(text)
            .setAutoCancel(true)
            .setContentIntent(pi)
            .build()
        runCatching { NotificationManagerCompat.from(context).notify(RESULT_BASE + id.toInt(), n) }
    }

    private const val RESULT_BASE = 50_000
}
