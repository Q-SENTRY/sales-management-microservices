package com.mediaflow.downloader

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import com.mediaflow.domain.repository.DownloadScheduler
import java.util.concurrent.TimeUnit

class WorkManagerDownloadScheduler(context: Context) : DownloadScheduler {
    private val appContext = context.applicationContext
    private val workManager by lazy { WorkManager.getInstance(appContext) }

    override fun enqueue(taskId: Long, wifiOnly: Boolean) {
        val request = OneTimeWorkRequestBuilder<DownloadWorker>()
            .setInputData(workDataOf(DownloadWorker.KEY_TASK_ID to taskId))
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(if (wifiOnly) NetworkType.UNMETERED else NetworkType.CONNECTED)
                    .setRequiresStorageNotLow(true)
                    .build(),
            )
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.SECONDS)
            .addTag(DownloadWorker.TAG)
            .build()
        workManager.enqueueUniqueWork(uniqueName(taskId), ExistingWorkPolicy.REPLACE, request)
    }

    override fun cancel(taskId: Long) {
        workManager.cancelUniqueWork(uniqueName(taskId))
    }

    private fun uniqueName(id: Long) = "mediaflow-download-$id"
}
