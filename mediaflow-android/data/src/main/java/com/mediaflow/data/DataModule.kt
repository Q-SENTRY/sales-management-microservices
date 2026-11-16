package com.mediaflow.data

import android.content.Context
import androidx.room.Room
import com.mediaflow.data.db.MediaFlowDatabase
import com.mediaflow.data.prefs.DataStoreSettingsRepository
import com.mediaflow.data.prefs.LocalEntitlementRepository
import com.mediaflow.data.repository.RoomConversionHistoryRepository
import com.mediaflow.data.repository.RoomDownloadRepository
import com.mediaflow.data.repository.RoomFavoritesRepository
import com.mediaflow.data.storage.OutputStorage

/** Construcción de la capa de datos; todo es local, sin servidor central. */
class DataModule(context: Context, premiumPreview: Boolean) {
    private val app = context.applicationContext
    private val db = Room.databaseBuilder(app, MediaFlowDatabase::class.java, "mediaflow.db").build()

    val downloads = RoomDownloadRepository(db.downloads())
    val favorites = RoomFavoritesRepository(db.favorites())
    val conversions = RoomConversionHistoryRepository(db.conversions())
    val settings = DataStoreSettingsRepository(app)
    val entitlements = LocalEntitlementRepository(app, premiumPreview)
    val storage = OutputStorage(app)
}
