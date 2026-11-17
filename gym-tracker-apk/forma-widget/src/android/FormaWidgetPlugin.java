package com.personal.formawidget;

import android.content.Context;
import android.content.SharedPreferences;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Puente entre la app (JavaScript) y el widget. */
public class FormaWidgetPlugin extends CordovaPlugin {
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext cb) throws JSONException {
        Context ctx = cordova.getActivity().getApplicationContext();
        SharedPreferences sp = ctx.getSharedPreferences(FormaWidget.PREFS, Context.MODE_PRIVATE);
        if ("update".equals(action)) {
            // Estado actual del día (lo que el widget muestra)
            sp.edit().putString("state", args.getString(0)).apply();
            FormaWidget.refreshAll(ctx);
            cb.success();
            return true;
        }
        if ("consume".equals(action)) {
            // Toques hechos en el widget que la app aún no ha aplicado
            JSONObject out = new JSONObject();
            synchronized (FormaWidget.LOCK) {
                String date = sp.getString("pendDate", null);
                if (date != null) {
                    out.put("date", date);
                    out.put("water", sp.getInt("pendWater", 0));
                    if (sp.contains("pendGym")) out.put("gym", sp.getBoolean("pendGym", false));
                }
                sp.edit().remove("pendDate").remove("pendWater").remove("pendGym").apply();
            }
            cb.success(out.toString());
            return true;
        }
        return false;
    }
}
