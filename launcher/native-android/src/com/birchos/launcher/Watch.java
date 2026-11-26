package com.birchos.launcher;

import android.content.Context;
import org.json.JSONArray;
import org.json.JSONObject;

/** Continue-watching list shared by the home screen and in-app pages. */
public final class Watch {
  static JSONArray read(Context ctx) {
    try {
      String s = ctx.getSharedPreferences("birch", Context.MODE_PRIVATE).getString("watch", "[]");
      return new JSONArray(s == null ? "[]" : s);
    } catch (Throwable t) {
      return new JSONArray();
    }
  }

  static synchronized String load(Context ctx) {
    return read(ctx).toString();
  }

  /** Accepts one item or a full array. One item is moved to the front. */
  static synchronized void save(Context ctx, String json) {
    if (json == null) return;
    String t = json.trim();
    try {
      String out;
      if (t.startsWith("[")) {
        out = new JSONArray(t).toString();
      } else {
        JSONObject o = new JSONObject(t);
        String url = o.optString("url");
        if (url.isEmpty()) return;
        if (!o.has("t")) o.put("t", System.currentTimeMillis());
        JSONArray cur = read(ctx);
        JSONArray next = new JSONArray();
        next.put(o);
        for (int i = 0; i < cur.length() && next.length() < 20; i++) {
          JSONObject x = cur.optJSONObject(i);
          if (x != null && !url.equals(x.optString("url"))) next.put(x);
        }
        out = next.toString();
      }
      ctx.getSharedPreferences("birch", Context.MODE_PRIVATE).edit().putString("watch", out).apply();
    } catch (Throwable ignored) {}
  }
}
