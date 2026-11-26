package com.birchos.launcher;

import android.net.Uri;
import android.webkit.WebResourceResponse;
import java.net.HttpURLConnection;
import java.net.URL;

/** Same-origin JSON proxy. The launcher page calls /__p?u=https://… so GitHub/F-Droid answers aren't blocked by CORS. */
public class Prox {
  public static boolean allowed(String host) {
    return host != null && ("f-droid.org".equals(host) || host.endsWith(".aptoide.com") || host.endsWith(".github.com") || host.endsWith(".f-droid.org") || "api.github.com".equals(host));
  }

  public static WebResourceResponse handle(Uri uri) {
    if (!"/__p".equals(uri.getPath())) return null;
    try {
      String u = uri.getQueryParameter("u");
      if (u != null && u.startsWith("https://") && allowed(Uri.parse(u).getHost())) {
        HttpURLConnection c = (HttpURLConnection) new URL(u).openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(15000);
        c.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 11; AFTKA) BirchOS");
        c.setRequestProperty("Accept", "application/json");
        if (c.getResponseCode() < 400) return new WebResourceResponse("application/json", "utf-8", c.getInputStream());
      }
    } catch (Throwable ignored) {}
    return null;
  }
}
