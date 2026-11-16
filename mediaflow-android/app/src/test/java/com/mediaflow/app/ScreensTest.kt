package com.mediaflow.app

import android.graphics.Bitmap
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.performClick
import com.mediaflow.domain.model.ThemeMode
import kotlinx.coroutines.runBlocking
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/** Recorre todas las pantallas de la app real (sin mocks) y guarda capturas. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "w411dp-h891dp-xxhdpi", application = TestApp::class)
class ScreensTest {

    @get:Rule val rule = createAndroidComposeRule<MainActivity>()

    private val outDir = File(System.getProperty("screens.dir") ?: "build/screens").apply { mkdirs() }

    private fun shot(name: String) {
        rule.waitForIdle()
        rule.mainClock.advanceTimeBy(1500)
        rule.waitForIdle()
        val view = rule.activity.window.decorView
        val bmp = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
        rule.runOnUiThread { view.draw(android.graphics.Canvas(bmp)) }
        File(outDir, "$name.png").outputStream().use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }

    private fun tap(text: String) {
        rule.onAllNodesWithText(text).onFirst().performClick()
    }

    private fun walk(prefix: String) {
        shot("${prefix}_01_inicio")
        tap("Descargas"); shot("${prefix}_02_descargas")
        tap("Biblioteca"); shot("${prefix}_03_biblioteca")
        tap("Música"); shot("${prefix}_04_musica")
        tap("Archivos"); shot("${prefix}_05_archivos")
        tap("Convertir"); shot("${prefix}_06_convertir")
        tap("Ajustes"); shot("${prefix}_07_ajustes")
        tap("Inicio")
        tap("YouTube"); shot("${prefix}_08_youtube")
        rule.activityRule.scenario.onActivity { it.onBackPressedDispatcher.onBackPressed() }
        tap("PRO"); shot("${prefix}_09_premium")
    }

    @Test fun darkTheme() {
        val c = (rule.activity.application as MediaFlowApplication).container
        runBlocking { c.settings.update { it.copy(themeMode = ThemeMode.DARK) } }
        walk("dark")
    }

    @Test fun lightTheme() {
        val c = (rule.activity.application as MediaFlowApplication).container
        runBlocking { c.settings.update { it.copy(themeMode = ThemeMode.LIGHT) } }
        walk("light")
    }
}
