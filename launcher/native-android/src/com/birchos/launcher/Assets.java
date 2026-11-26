package com.birchos.launcher;

import android.content.res.AssetManager;
import android.webkit.WebResourceResponse;
import java.io.ByteArrayInputStream;

/** Serves assets/www, and falls back to each bundled app's index.html so their routes work offline. */
public final class Assets {
  static WebResourceResponse open(android.content.Context ctx, String path) {
    String p = (path == null || path.equals("/")) ? "/index.html" : path;
    if (p.contains("..")) return missing();
    AssetManager am = ctx.getAssets();
    try {
      return new WebResourceResponse(mime(p), null, am.open("www" + p));
    } catch (Exception ignored) {}
    if (p.startsWith("/apps/")) {
      String rest = p.substring(6);
      int slash = rest.indexOf('/');
      if (slash > 0) {
        String app = rest.substring(0, slash);
        String rel = rest.substring(slash);
        boolean file = rel.lastIndexOf('.') > rel.lastIndexOf('/');
        if (!file) {
          try {
            return new WebResourceResponse("text/html", "utf-8", am.open("www/apps/" + app + "/index.html"));
          } catch (Exception ignored) {}
        }
      }
    }
    return missing();
  }

  static WebResourceResponse missing() {
    return new WebResourceResponse("text/plain", "utf-8", 404, "Not found", null, new ByteArrayInputStream(new byte[0]));
  }

  static String mime(String p) {
    String s = p.toLowerCase();
    if (s.endsWith(".html")) return "text/html";
    if (s.endsWith(".js") || s.endsWith(".mjs")) return "application/javascript";
    if (s.endsWith(".css")) return "text/css";
    if (s.endsWith(".json")) return "application/json";
    if (s.endsWith(".jpg") || s.endsWith(".jpeg")) return "image/jpeg";
    if (s.endsWith(".png")) return "image/png";
    if (s.endsWith(".webp")) return "image/webp";
    if (s.endsWith(".svg")) return "image/svg+xml";
    if (s.endsWith(".ico")) return "image/x-icon";
    if (s.endsWith(".woff2")) return "font/woff2";
    if (s.endsWith(".woff")) return "font/woff";
    if (s.endsWith(".wasm")) return "application/wasm";
    if (s.endsWith(".mp4")) return "video/mp4";
    if (s.endsWith(".webm")) return "video/webm";
    if (s.endsWith(".txt")) return "text/plain";
    return "application/octet-stream";
  }
}
