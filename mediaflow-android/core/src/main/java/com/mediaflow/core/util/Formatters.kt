package com.mediaflow.core.util

import java.text.DateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import kotlin.math.ln
import kotlin.math.pow

object Format {
    fun bytes(bytes: Long): String {
        if (bytes < 0) return "—"
        if (bytes < 1024) return "$bytes B"
        val units = arrayOf("KB", "MB", "GB", "TB")
        val exp = (ln(bytes.toDouble()) / ln(1024.0)).toInt().coerceIn(1, units.size)
        val value = bytes / 1024.0.pow(exp)
        return String.format(Locale.getDefault(), if (value >= 100) "%.0f %s" else "%.1f %s", value, units[exp - 1])
    }

    fun speed(bps: Long): String = if (bps <= 0) "—" else bytes(bps) + "/s"

    fun duration(ms: Long?): String {
        if (ms == null || ms <= 0) return "--:--"
        val total = ms / 1000
        val h = total / 3600
        val m = (total % 3600) / 60
        val s = total % 60
        return if (h > 0) String.format(Locale.ROOT, "%d:%02d:%02d", h, m, s) else String.format(Locale.ROOT, "%d:%02d", m, s)
    }

    fun eta(seconds: Long?): String = if (seconds == null || seconds < 0) "calculando…" else duration(seconds * 1000) + " restantes"

    fun date(millis: Long): String = DateFormat.getDateInstance(DateFormat.MEDIUM).format(Date(millis))

    fun dateTime(millis: Long): String = DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT).format(Date(millis))

    /** Agrupación de la biblioteca por fecha. */
    fun dateBucket(millis: Long, now: Long = System.currentTimeMillis()): String {
        val today = Calendar.getInstance().apply {
            timeInMillis = now; set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
        }.timeInMillis
        val day = 24 * 3600 * 1000L
        return when {
            millis >= today -> "Hoy"
            millis >= today - day -> "Ayer"
            millis >= today - 7 * day -> "Esta semana"
            millis >= today - 30 * day -> "Este mes"
            else -> {
                val c = Calendar.getInstance().apply { timeInMillis = millis }
                val month = c.getDisplayName(Calendar.MONTH, Calendar.LONG, Locale.getDefault()) ?: ""
                "${month.replaceFirstChar { it.titlecase() }} ${c.get(Calendar.YEAR)}"
            }
        }
    }
}
