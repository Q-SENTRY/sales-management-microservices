package com.personal.formawidget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** Widget de pantalla de inicio: agua, proteína y botón de gym sin abrir la app. */
public class FormaWidget extends AppWidgetProvider {
    static final String PREFS = "forma_widget";
    static final Object LOCK = new Object();
    static final String ACT_WATER = "com.personal.formawidget.WATER";
    static final String ACT_GYM = "com.personal.formawidget.GYM";

    private static int id(Context c, String type, String name) {
        return c.getResources().getIdentifier(name, type, c.getPackageName());
    }

    private static String today() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
    }

    /** Lee el estado guardado y lo reinicia si es de otro día. */
    private static JSONObject state(SharedPreferences sp) {
        JSONObject s;
        try { s = new JSONObject(sp.getString("state", "{}")); } catch (Exception e) { s = new JSONObject(); }
        try {
            if (!today().equals(s.optString("date"))) {
                s.put("date", today()); s.put("water", 0); s.put("prot", 0); s.put("gym", false);
            }
        } catch (Exception ignored) { }
        return s;
    }

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int wid : ids) draw(ctx, mgr, wid);
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        super.onReceive(ctx, intent);
        String a = intent.getAction();
        if (!ACT_WATER.equals(a) && !ACT_GYM.equals(a)) return;
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        synchronized (LOCK) {
            JSONObject s = state(sp);
            String t = today();
            SharedPreferences.Editor ed = sp.edit();
            // si hay toques pendientes de otro día, se descartan para no mezclarlos
            if (!t.equals(sp.getString("pendDate", t))) { ed.remove("pendWater").remove("pendGym"); }
            ed.putString("pendDate", t);
            try {
                if (ACT_WATER.equals(a)) {
                    s.put("water", s.optInt("water", 0) + 250);
                    ed.putInt("pendWater", sp.getInt("pendWater", 0) + 250);
                } else {
                    boolean g = !s.optBoolean("gym", false);
                    s.put("gym", g);
                    ed.putBoolean("pendGym", g);
                }
            } catch (Exception ignored) { }
            ed.putString("state", s.toString()).apply();
        }
        refreshAll(ctx);
    }

    static void refreshAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, FormaWidget.class));
        for (int wid : ids) draw(ctx, mgr, wid);
    }

    private static PendingIntent broadcast(Context ctx, String action, int code) {
        Intent i = new Intent(ctx, FormaWidget.class).setAction(action);
        return PendingIntent.getBroadcast(ctx, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void draw(Context ctx, AppWidgetManager mgr, int wid) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSONObject s = state(sp);
        RemoteViews v = new RemoteViews(ctx.getPackageName(), id(ctx, "layout", "forma_widget"));
        int water = s.optInt("water", 0), wGoal = Math.max(1, s.optInt("waterGoal", 2500));
        int prot = s.optInt("prot", 0), pGoal = Math.max(1, s.optInt("protGoal", 120));
        boolean gym = s.optBoolean("gym", false);
        v.setTextViewText(id(ctx, "id", "fw_water"), String.format(Locale.US, "%.1f / %.1f L", water / 1000f, wGoal / 1000f));
        v.setProgressBar(id(ctx, "id", "fw_water_bar"), 100, Math.min(100, water * 100 / wGoal), false);
        v.setTextViewText(id(ctx, "id", "fw_prot"), prot + " / " + pGoal + " g");
        v.setProgressBar(id(ctx, "id", "fw_prot_bar"), 100, Math.min(100, prot * 100 / pGoal), false);
        v.setTextViewText(id(ctx, "id", "fw_gym"), gym ? "Gym ✓" : "Fui al gym");
        v.setInt(id(ctx, "id", "fw_gym"), "setBackgroundResource", id(ctx, "drawable", gym ? "forma_widget_btn_on" : "forma_widget_btn"));
        v.setTextColor(id(ctx, "id", "fw_gym"), gym ? 0xFF0A0A0B : 0xFFF2F2F3);
        v.setOnClickPendingIntent(id(ctx, "id", "fw_add"), broadcast(ctx, ACT_WATER, 1));
        v.setOnClickPendingIntent(id(ctx, "id", "fw_gym"), broadcast(ctx, ACT_GYM, 2));
        Intent open = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        if (open != null) {
            v.setOnClickPendingIntent(id(ctx, "id", "fw_root"), PendingIntent.getActivity(ctx, 3, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        }
        mgr.updateAppWidget(wid, v);
    }
}
