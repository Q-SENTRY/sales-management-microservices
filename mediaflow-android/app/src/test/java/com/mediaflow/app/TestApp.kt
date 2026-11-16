package com.mediaflow.app

import android.content.ComponentName
import com.mediaflow.player.PlaybackService
import org.robolectric.Shadows

/** Robolectric no simula bien el enlace con MediaSessionService; en tests se desactiva. */
class TestApp : MediaFlowApplication() {
    override fun onCreate() {
        Shadows.shadowOf(this).declareComponentUnbindable(ComponentName(this, PlaybackService::class.java))
        super.onCreate()
    }
}
