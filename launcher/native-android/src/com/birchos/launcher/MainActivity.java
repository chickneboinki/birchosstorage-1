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
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
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

public class MainActivity extends Activity {
  static final int VERSION = 70;
  static final String HOST = "birchos.local";
  static final String URL = "https://" + HOST + "/index.html";
  WebView web;
  final Map<String, String> iconCache = new HashMap<>();
  static boolean processStarted;
  boolean coldStart;

  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    new Thread(() -> { try { computeApps(); } catch (Throwable ignored) {} }, "apps-warm").start();
    coldStart = !processStarted;
    processStarted = true;
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);
    web = new WebView(this);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setCacheMode(WebSettings.LOAD_DEFAULT);
    CookieManager.getInstance().setAcceptCookie(true);
    CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);
    web.setBackgroundColor(0xFF000000);
    web.setWebViewClient(new WebViewClient() {
      @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) {
        Uri u = req.getUrl();
        if (!HOST.equals(u.getHost())) return null;
        WebResourceResponse prox = Prox.handle(u);
        if (prox != null) return prox;
        return Assets.open(MainActivity.this, u.getPath());
      }
      @Override public void onPageFinished(WebView v, String url) {
        v.evaluateJavascript("(function(){try{var st=document.createElement('style');st.id='birch-perf';st.textContent='#root .glass,#root .glass-strong,#root [class*=backdrop]{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}#root [class*=blur-]{filter:none!important}#root .animate-kenburns,#root .animate-ambient{animation:none!important}#root *{scroll-behavior:auto!important}';if(!document.getElementById('birch-perf'))(document.head||document.documentElement).appendChild(st);try{var k='birch-studio-v2';var s=JSON.parse(localStorage.getItem(k)||'{}');if(s.calm===undefined)s.calm=true;if(s.blur===undefined)s.blur='off';if(s.perfMode===undefined)s.perfMode='fast';if(s.focusPulse===undefined)s.focusPulse=false;localStorage.setItem(k,JSON.stringify(s));}catch(e){}}catch(e){}})();", null);
        try {
          String w = Watch.load(MainActivity.this);
          String js = "(function(){try{var n=JSON.parse(" + JSONObject.quote(w) + ");if(!n||!n.length)return;"
            + "var cur=[];try{cur=JSON.parse(localStorage.getItem('birch-watch-v1')||'[]')}catch(e){}"
            + "var map={};cur.forEach(function(x){if(x&&x.url)map[x.url]=x;});"
            + "n.forEach(function(x){if(x&&x.url)map[x.url]=Object.assign({},map[x.url]||{},x);});"
            + "var out=Object.keys(map).map(function(k){return map[k];}).sort(function(a,b){return(b.t||0)-(a.t||0)}).slice(0,20);"
            + "localStorage.setItem('birch-watch-v1',JSON.stringify(out));}catch(e){}})();";
          v.evaluateJavascript(js, null);
        } catch (Throwable ignored) {}
      }
    });
    web.addJavascriptInterface(new Bridge(), "BirchAndroid");
    web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    rootFrame = new android.widget.FrameLayout(this);
    rootFrame.setBackgroundColor(0xFF000000);
    rootFrame.addView(web, new android.widget.FrameLayout.LayoutParams(-1, -1));
    setContentView(rootFrame);
    web.loadUrl(URL);
  }

  @Override protected void onPause() {
    try { CookieManager.getInstance().flush(); } catch (Throwable ignored) {}
    super.onPause();
  }

  android.widget.FrameLayout rootFrame, splashView;
  void clearSplash() {
    if (splashView != null) { try { rootFrame.removeView(splashView); } catch (Throwable ignored) {} splashView = null; }
  }
  /** Plays the short Birch OS intro over the launcher, then runs go (starts the app) while it is still showing. */
  void showSplash(final Runnable go) {
    if (splashView != null) return;
    try {
      splashView = Splash.build(this);
      rootFrame.addView(splashView, new android.widget.FrameLayout.LayoutParams(-1, -1));
      Splash.play(splashView);
      Splash.chime();
    } catch (Throwable t) { splashView = null; go.run(); return; }
    rootFrame.postDelayed(go, 750);
  }

  long lastStopAt;
  @Override protected void onStop() {
    lastStopAt = android.os.SystemClock.elapsedRealtime();
    // launcher is hidden while another app is open: let the page throttle its timers instead of running them for hours
    try { web.onPause(); } catch (Throwable ignored) {}
    super.onStop();
  }
  @Override protected void onStart() {
    super.onStart();
    try { web.onResume(); } catch (Throwable ignored) {}
    clearSplash();
    // after a very long time in the background, reload the home page to drop any accumulated JS heap
    if (lastStopAt > 0 && android.os.SystemClock.elapsedRealtime() - lastStopAt > 45L * 60L * 1000L) {
      try { web.reload(); } catch (Throwable ignored) {}
    }
    lastStopAt = 0;
  }

  @Override public void onBackPressed() {
    web.evaluateJavascript("window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))", null);
  }

  @Override public boolean onKeyDown(int code, KeyEvent e) {
    if (code == KeyEvent.KEYCODE_MENU) {
      web.evaluateJavascript("window.dispatchEvent(new KeyboardEvent('keydown',{key:'ContextMenu'}))", null);
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
      int w = Math.max(1, Math.min(256, d.getIntrinsicWidth() > 0 ? d.getIntrinsicWidth() : 160));
      int h = Math.max(1, Math.min(144, d.getIntrinsicHeight() > 0 ? d.getIntrinsicHeight() : 160));
      Bitmap bm = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
      Canvas cv = new Canvas(bm);
      d.setBounds(0, 0, w, h);
      d.draw(cv);
      ByteArrayOutputStream out = new ByteArrayOutputStream();
      bm.compress(Bitmap.CompressFormat.WEBP, 82, out);
      bm.recycle();
      c = "data:image/webp;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
    } catch (Throwable t) { c = ""; }
    iconCache.put(pkg, c);
    return c;
  }

  // ---- installed-apps list: cached in memory + on disk, prewarmed off the UI/JS thread ----
  final Object appsLock = new Object();
  String appsJson, appsSig;

  String appsSignature() {
    try {
      PackageManager pm = getPackageManager();
      java.util.TreeSet<String> t = new java.util.TreeSet<>();
      String[] cats = { Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER };
      for (String cat : cats)
        for (ResolveInfo r : pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(cat), 0)) {
          ApplicationInfo ai = r.activityInfo.applicationInfo;
          t.add(r.activityInfo.packageName + ":" + new java.io.File(ai.sourceDir).lastModified());
        }
      return "v2|" + Build.VERSION.SDK_INT + "|" + t.hashCode() + "|" + t.size();
    } catch (Throwable e) { return "x" + System.nanoTime(); }
  }

  String computeApps() {
    synchronized (appsLock) {
      String sig = appsSignature();
      if (appsJson != null && sig.equals(appsSig)) return appsJson;
      java.io.File f = new java.io.File(getCacheDir(), "apps.v2.json");
      try {
        if (f.exists()) {
          java.io.FileInputStream in = new java.io.FileInputStream(f);
          ByteArrayOutputStream bo = new ByteArrayOutputStream();
          byte[] buf = new byte[65536]; int n;
          while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
          in.close();
          String all = bo.toString("UTF-8");
          int nl = all.indexOf('\n');
          if (nl > 0 && all.substring(0, nl).equals(sig)) { appsJson = all.substring(nl + 1); appsSig = sig; return appsJson; }
        }
      } catch (Throwable ignored) {}
      String j = buildApps();
      appsJson = j; appsSig = sig;
      try {
        java.io.FileOutputStream out = new java.io.FileOutputStream(f);
        out.write((sig + "\n" + j).getBytes("UTF-8"));
        out.close();
      } catch (Throwable ignored) {}
      return j;
    }
  }

  String buildApps() {
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
    @JavascriptInterface public boolean isColdStart() { boolean c = coldStart; coldStart = false; return c; }
    @JavascriptInterface public String checkUpdate() {
      HttpURLConnection c = null;
      try {
        c = (HttpURLConnection) new URL("https://api.github.com/repos/chickneboinki/birchosstorage-1/releases/latest").openConnection();
        c.setConnectTimeout(12000); c.setReadTimeout(12000);
        c.setRequestProperty("User-Agent", "BirchOS");
        c.setRequestProperty("Accept", "application/vnd.github+json");
        int code = c.getResponseCode();
        InputStream in = code >= 400 ? c.getErrorStream() : c.getInputStream();
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        byte[] buf = new byte[8192]; int n;
        while (in != null && (n = in.read(buf)) > 0) bo.write(buf, 0, n);
        if (code >= 400) return new JSONObject().put("error", "GitHub HTTP " + code).put("current", currentVersion()).toString();
        JSONObject rel = new JSONObject(bo.toString("utf-8"));
        String tag = rel.optString("tag_name", "");
        int remote = VERSION;
        String digits = tag.replaceAll("[^0-9]", "");
        if (!digits.isEmpty()) remote = Integer.parseInt(digits);
        String apk = "";
        JSONArray assets = rel.optJSONArray("assets");
        if (assets != null) for (int i = 0; i < assets.length(); i++) {
          JSONObject a = assets.getJSONObject(i);
          if (a.optString("name", "").endsWith(".apk")) { apk = a.optString("browser_download_url", ""); break; }
        }
        return new JSONObject().put("current", currentVersion()).put("versionCode", remote).put("name", rel.optString("name", tag)).put("url", apk).toString();
      } catch (Throwable t) {
        try { return new JSONObject().put("error", String.valueOf(t.getMessage())).put("current", currentVersion()).toString(); }
        catch (Throwable t2) { return "{\"error\":\"check failed\",\"current\":70}"; }
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
          Dl.ref = "https://github.com/chickneboinki/birchosstorage-1";
          Dl.run(MainActivity.this, url, "Mozilla/5.0 BirchOS");
        } catch (Throwable t) {
          Dl.note(t);
          runOnUiThread(() -> android.widget.Toast.makeText(MainActivity.this, "Update failed: " + Dl.err, android.widget.Toast.LENGTH_LONG).show());
        }
      }).start();
    }
    @JavascriptInterface public String getInstalledApps() { return computeApps(); }
    @JavascriptInterface public boolean launchApp(String pkg) {
      PackageManager pm = getPackageManager();
      Intent i = pm.getLeanbackLaunchIntentForPackage(pkg);
      if (i == null) i = pm.getLaunchIntentForPackage(pkg);
      if (i == null) return false;
      i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
      final Intent li = i;
      runOnUiThread(() -> showSplash(() -> { try { startActivity(li, android.app.ActivityOptions.makeCustomAnimation(MainActivity.this, 0, 0).toBundle()); } catch (Throwable t) { try { startActivity(li); } catch (Throwable ignored) {} } }));
      return true;
    }
    @JavascriptInterface public void openStore(String pkg) {
      String[] uris = { "amzn://apps/android?p=" + pkg, "market://details?id=" + pkg, "https://www.amazon.com/gp/mas/dl/android?p=" + pkg };
      for (String u : uris) { try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(u)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); return; } catch (Throwable t) {} }
    }
    @JavascriptInterface public boolean openSystemSettings(String panel) {
      String a = Settings.ACTION_SETTINGS;
      if ("wifi".equals(panel)) a = Settings.ACTION_WIFI_SETTINGS;
      else if ("bluetooth".equals(panel)) a = Settings.ACTION_BLUETOOTH_SETTINGS;
      else if ("display".equals(panel)) a = Settings.ACTION_DISPLAY_SETTINGS;
      else if ("audio".equals(panel)) a = Settings.ACTION_SOUND_SETTINGS;
      try { startActivity(new Intent(a).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); return true; }
      catch (Throwable t) { try { startActivity(new Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); return true; } catch (Throwable t2) { return false; } }
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
