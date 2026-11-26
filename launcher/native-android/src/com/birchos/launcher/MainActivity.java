package com.birchos.launcher;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Base64;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONObject;

/** Birch OS home launcher: hosts the web UI and exposes installed apps through window.BirchAndroid. */
public class MainActivity extends Activity {
  static final int VERSION = 57;
  static final String HOST = "birchos.local";
  static final String URL = "https://" + HOST + "/index.html";
  WebView web;
  final Map<String, String> iconCache = new HashMap<>();

  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    // Birch's screensaver is on by default. Hold the screen awake until the page says otherwise,
    // so the Fire TV system screensaver cannot cover it.
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    web = new WebView(this);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    web.setBackgroundColor(0xFF000000);
    web.setWebViewClient(new WebViewClient() {
      @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) {
        Uri u = req.getUrl();
        if (!HOST.equals(u.getHost())) return null;
        WebResourceResponse prox = Prox.handle(u);
        if (prox != null) return prox;
        return Assets.open(MainActivity.this, u.getPath());
      }
    });
    web.addJavascriptInterface(new Bridge(), "BirchAndroid");
    web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    setContentView(web);
    web.loadUrl(URL);
  }

  @Override public void onBackPressed() {
    web.evaluateJavascript("window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))", null);
  }

  @Override public boolean onKeyDown(int code, KeyEvent e) {
    if (code == KeyEvent.KEYCODE_MENU) {
      web.evaluateJavascript("window.dispatchEvent(new KeyboardEvent('keydown',{key:'ContextMenu'}))", null);
      return true;
    }
    // Play/pause on the remote toggles Birch Studio, same as v47.
    if (code == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE || code == KeyEvent.KEYCODE_MEDIA_PLAY || code == KeyEvent.KEYCODE_MEDIA_PAUSE) {
      web.evaluateJavascript("window.__studio&&window.__studio.toggle()", null);
      return true;
    }
    return super.onKeyDown(code, e);
  }

  @Override protected void onNewIntent(Intent i) {
    super.onNewIntent(i);
    web.evaluateJavascript("window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))", null);
  }

  String iconFor(String pkg, Drawable d) {
    String c = iconCache.get(pkg);
    if (c != null) return c;
    try {
      int w = Math.max(1, Math.min(320, d.getIntrinsicWidth() > 0 ? d.getIntrinsicWidth() : 192));
      int h = Math.max(1, Math.min(180, d.getIntrinsicHeight() > 0 ? d.getIntrinsicHeight() : 192));
      Bitmap bm = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
      Canvas cv = new Canvas(bm);
      d.setBounds(0, 0, w, h);
      d.draw(cv);
      ByteArrayOutputStream out = new ByteArrayOutputStream();
      bm.compress(Bitmap.CompressFormat.PNG, 100, out);
      c = "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
    } catch (Throwable t) { c = ""; }
    iconCache.put(pkg, c);
    return c;
  }

  class Bridge {
    int currentVersion() {
      try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode; }
      catch (Throwable t) { return VERSION; }
    }

    @JavascriptInterface public void setPicture(String js) { Pic.js = js; }

    @JavascriptInterface public void setKeepScreenOn(boolean on) {
      runOnUiThread(() -> {
        if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
      });
    }

    @JavascriptInterface public void saveWatch(String json) { Watch.save(MainActivity.this, json); }
    @JavascriptInterface public String loadWatch() { return Watch.load(MainActivity.this); }

    @JavascriptInterface public String checkUpdate() {
      HttpURLConnection c = null;
      try {
        c = (HttpURLConnection) new URL("https://api.github.com/repos/CronusAquilx/birchosstorage/releases/latest").openConnection();
        c.setConnectTimeout(12000);
        c.setReadTimeout(12000);
        c.setRequestProperty("User-Agent", "BirchOS");
        c.setRequestProperty("Accept", "application/vnd.github+json");
        int code = c.getResponseCode();
        InputStream in = code >= 400 ? c.getErrorStream() : c.getInputStream();
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while (in != null && (n = in.read(buf)) > 0) bo.write(buf, 0, n);
        if (code >= 400) return new JSONObject().put("error", "GitHub HTTP " + code).put("current", currentVersion()).toString();
        JSONObject rel = new JSONObject(bo.toString("utf-8"));
        String tag = rel.optString("tag_name", "");
        int remote = VERSION;
        String digits = tag.replaceAll("[^0-9]", "");
        if (!digits.isEmpty()) remote = Integer.parseInt(digits);
        String apk = "";
        JSONArray assets = rel.optJSONArray("assets");
        if (assets != null) {
          for (int i = 0; i < assets.length(); i++) {
            JSONObject a = assets.getJSONObject(i);
            String name = a.optString("name", "");
            if (name.endsWith(".apk")) { apk = a.optString("browser_download_url", ""); break; }
          }
        }
        return new JSONObject().put("current", currentVersion()).put("versionCode", remote).put("name", rel.optString("name", tag)).put("url", apk).put("notes", rel.optString("body", "")).toString();
      } catch (Throwable t) {
        try { return new JSONObject().put("error", t.getClass().getSimpleName() + ": " + t.getMessage()).put("current", currentVersion()).toString(); }
        catch (Throwable t2) { return "{\"error\":\"check failed\",\"current\":57}"; }
      } finally { if (c != null) c.disconnect(); }
    }

    @JavascriptInterface public void installUpdate(final String url) {
      runOnUiThread(() -> android.widget.Toast.makeText(MainActivity.this, "Downloading Birch OS update...", android.widget.Toast.LENGTH_LONG).show());
      new Thread(() -> {
        try {
          if (Build.VERSION.SDK_INT >= 26 && !getPackageManager().canRequestPackageInstalls()) {
            runOnUiThread(() -> {
              android.widget.Toast.makeText(MainActivity.this, "Allow Birch OS to install apps, then try again", android.widget.Toast.LENGTH_LONG).show();
              startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName())));
            });
            return;
          }
          Dl.ref = "https://github.com/CronusAquilx/birchosstorage";
          Dl.run(MainActivity.this, url, "Mozilla/5.0 (Linux; Android 11; AFTKA) BirchOS");
        } catch (Throwable t) {
          Dl.note(t);
          runOnUiThread(() -> android.widget.Toast.makeText(MainActivity.this, "Update failed: " + Dl.err, android.widget.Toast.LENGTH_LONG).show());
        }
      }).start();
    }

    @JavascriptInterface public String getInstalledApps() {
      PackageManager pm = getPackageManager();
      JSONArray arr = new JSONArray();
      Set<String> seen = new HashSet<>();
      String[] cats = { Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER };
      for (String cat : cats) {
        Intent q = new Intent(Intent.ACTION_MAIN).addCategory(cat);
        List<ResolveInfo> list = pm.queryIntentActivities(q, 0);
        for (ResolveInfo r : list) {
          String pkg = r.activityInfo.packageName;
          if (pkg.equals(getPackageName()) || !seen.add(pkg)) continue;
          try {
            ApplicationInfo ai = r.activityInfo.applicationInfo;
            Drawable banner = cat.equals(Intent.CATEGORY_LEANBACK_LAUNCHER) ? pm.getApplicationBanner(ai) : null;
            Drawable icon = banner != null ? banner : r.loadIcon(pm);
            JSONObject o = new JSONObject();
            o.put("id", pkg);
            o.put("name", r.loadLabel(pm).toString());
            o.put("icon", iconFor(pkg, icon));
            o.put("banner", banner != null);
            o.put("system", (ai.flags & ApplicationInfo.FLAG_SYSTEM) != 0);
            int c = Build.VERSION.SDK_INT >= 26 ? ai.category : -1;
            o.put("category", c == ApplicationInfo.CATEGORY_GAME ? "Games" : c == ApplicationInfo.CATEGORY_AUDIO ? "Music" : c == ApplicationInfo.CATEGORY_VIDEO ? "Streaming" : "Other");
            arr.put(o);
          } catch (Throwable ignored) {}
        }
      }
      return arr.toString();
    }

    @JavascriptInterface public boolean launchApp(String pkg) {
      PackageManager pm = getPackageManager();
      Intent i = pm.getLeanbackLaunchIntentForPackage(pkg);
      if (i == null) i = pm.getLaunchIntentForPackage(pkg);
      if (i == null) return false;
      i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
      final Intent li = i;
      runOnUiThread(() -> {
        try {
          startActivity(li, android.app.ActivityOptions.makeCustomAnimation(MainActivity.this, 0, 0).toBundle());
        } catch (Throwable t) { startActivity(li); }
      });
      return true;
    }

    @JavascriptInterface public void openStore(String pkg) {
      String[] uris = { "amzn://apps/android?p=" + pkg, "market://details?id=" + pkg, "https://www.amazon.com/gp/mas/dl/android?p=" + pkg };
      for (String u : uris) {
        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(u)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); return; } catch (Throwable t) {}
      }
    }

    @JavascriptInterface public boolean openSystemSettings(String panel) {
      String a = Settings.ACTION_SETTINGS;
      if ("wifi".equals(panel)) a = Settings.ACTION_WIFI_SETTINGS;
      else if ("bluetooth".equals(panel)) a = Settings.ACTION_BLUETOOTH_SETTINGS;
      else if ("display".equals(panel)) a = Settings.ACTION_DISPLAY_SETTINGS;
      else if ("audio".equals(panel)) a = Settings.ACTION_SOUND_SETTINGS;
      try { startActivity(new Intent(a).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); return true; }
      catch (Throwable t) {
        try { startActivity(new Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); return true; } catch (Throwable t2) { return false; }
      }
    }

    @JavascriptInterface public void openAppInfo(String pkg) {
      startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + pkg)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
    }

    @JavascriptInterface public void uninstall(String pkg) {
      startActivity(new Intent(Intent.ACTION_DELETE, Uri.parse("package:" + pkg)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
    }

    @JavascriptInterface public void openWebApp(String url) {
      startActivity(new Intent(MainActivity.this, WebAppActivity.class).putExtra("url", url));
    }

    @JavascriptInterface public String version() { return String.valueOf(currentVersion()); }
  }
}
