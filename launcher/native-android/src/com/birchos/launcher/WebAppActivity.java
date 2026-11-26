package com.birchos.launcher;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.Choreographer;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

/** Full-screen player for built-in and remote apps. Keeps the v47 Fire TV video-offset fix. */
public class WebAppActivity extends Activity {
  static final String[] AD_HOSTS = {
    "doubleclick.net","googlesyndication.com","googleadservices.com","adservice.google","popads.net","popcash.net","propellerads","adsterra","exoclick","juicyads","trafficjunky","onclickads","onclkds","adcash","hilltopads","clickadu","a-ads.com","mgid.com","taboola","outbrain","revcontent","zeroredirect","adnxs.com","yllix","bidgear","acint.net","histats","dtscout","pushame","richpush","monetag","galaksion","adskeeper","ad-maven","admaven","pemsrv","tsyndicate","adspyglass","realsrv","magsrv","bngpt","crumpet","popmyads","ad.plus","adtng","clickaine","whos.amung","umeng","disqusads","aclib","profitableratecpm","highperformanceformat","effectivecpmgate","displayvertising"
  };
  static final String FS_CSS = "(function(){try{if(document.getElementById('birch-fs'))return;var st=document.createElement('style');st.id='birch-fs';st.textContent=':not(html):not(body):fullscreen,:not(html):not(body):-webkit-full-screen{position:fixed!important;inset:0!important;top:0!important;left:0!important;right:0!important;bottom:0!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;background:#000!important;transform:none!important}video:fullscreen,video:-webkit-full-screen,:fullscreen video,:-webkit-full-screen video{width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:contain!important}';(document.head||document.documentElement).appendChild(st);}catch(e){}})();";
  static final String LITE = "(function(){try{if(document.getElementById('birch-lite'))return;var st=document.createElement('style');st.id='birch-lite';st.textContent='*,*::before,*::after{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}[class*=blur]:not(video):not(iframe){filter:none!important}';(document.head||document.documentElement).appendChild(st);}catch(e){}})();";
  static final String NO_POPUPS = "(function(){try{window.open=function(){return null};document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[target=_blank]');if(a){a.removeAttribute('target')}},true);}catch(e){}})();";
  static final String SPOOF = "(function(){try{var d=Object.defineProperty,n=navigator;if(!window.chrome)window.chrome={app:{isInstalled:false},runtime:{},loadTimes:function(){return{}},csi:function(){return{}}};d(n,'webdriver',{get:function(){return false}});d(n,'vendor',{get:function(){return 'Google Inc.'}});try{delete window.Android;delete window.AndroidBridge;delete window.BirchAndroid}catch(e){}var oo=XMLHttpRequest.prototype.setRequestHeader;XMLHttpRequest.prototype.setRequestHeader=function(k,v){if(/x-requested-with/i.test(k))return;return oo.apply(this,arguments)};}catch(e){}})();";
  static final String PAGE_FIX = NO_POPUPS + LITE;
  static final String WATCH_JS = "(function(){try{if(window.__birchWatch)return;window.__birchWatch=1;function meta(){var u=location.href,title=(document.title||'').replace(/\\s*[|\\-–].*$/,'').trim(),img='',og=document.querySelector('meta[property=\"og:image\"]');if(og&&og.content)img=og.content;var season=null,episode=null,m;m=u.match(/\\/embed\\/(\\d+)\\/(\\d+)\\/(\\d+)/);if(m){season=+m[2];episode=+m[3]}m=u.match(/\\/(?:watch\\/)?tv\\/(\\d+)\\/(\\d+)\\/(\\d+)/);if(m){season=+m[2];episode=+m[3]}m=u.match(/[?&#]s(?:eason)?=(\\d+)/i);if(m)season=+m[1];m=u.match(/[?&#]e(?:pisode)?=(\\d+)/i);if(m)episode=+m[1];m=u.match(/season\\/(\\d+)\\/episode\\/(\\d+)/i);if(m){season=+m[1];episode=+m[2]}var metaTxt=(season&&episode)?('S'+season+' E'+episode):'';return{title:title.slice(0,80),url:u,img:img,meta:metaTxt,season:season,episode:episode,t:Date.now()}}function send(extra){try{if(!window.BirchWatch)return;var h=location.hostname,p=location.pathname||'';if(h==='birchos.local'&&p.indexOf('/apps/')!==0)return;if(!h||h==='about:blank')return;var o=meta();if(extra)for(var k in extra)o[k]=extra[k];if(!o.title||o.title==='Birch OS')return;window.BirchWatch.save(JSON.stringify(o))}catch(e){}}var t;function sched(){clearTimeout(t);t=setTimeout(function(){send()},900)}window.addEventListener('message',function(ev){var d=ev.data;if(typeof d==='string'){try{d=JSON.parse(d)}catch(e){return}}if(!d||typeof d!=='object')return;var ct=d.currentTime!=null?d.currentTime:(d.time!=null?d.time:(d.data&&d.data.currentTime));if(ct==null)return;var dur=d.duration||(d.data&&d.data.duration)||0;send({position:ct,duration:dur,meta:(meta().meta?meta().meta+' · ':'')+Math.floor(ct/60)+'m'})});var ps=history.pushState;history.pushState=function(){var r=ps.apply(this,arguments);sched();return r};var rs=history.replaceState;history.replaceState=function(){var r=rs.apply(this,arguments);sched();return r};window.addEventListener('popstate',sched);window.addEventListener('hashchange',sched);setInterval(sched,15000);sched()}catch(e){}})();";

  WebView web;
  View fullView, cursor, chooser;
  FrameLayout root, fsLayer;
  boolean cursorMode = false;
  float cx = 400, cy = 300;
  String homeBase = "";
  boolean hl, hr, hu, hd;
  float vx, vy;
  long lastFrame;
  boolean looping;
  int savedY;
  WebChromeClient.CustomViewCallback fullCb;

  void hideBars(View v) {
    v.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
  }

  static String base(String host) {
    if (host == null) return "";
    String[] p = host.split("\\.");
    return p.length <= 2 ? host : p[p.length - 2] + "." + p[p.length - 1];
  }
  static boolean isAd(String host) {
    if (host == null) return false;
    for (String a : AD_HOSTS) if (host.contains(a)) return true;
    return false;
  }
  static WebResourceResponse empty() { return new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0])); }

  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL);
    root = new FrameLayout(this);
    root.setBackgroundColor(0);
    web = new WebView(this);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setLoadWithOverviewMode(false);
    s.setTextZoom(100);
    s.setUseWideViewPort(false);
    s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
    s.setSupportMultipleWindows(false);
    s.setJavaScriptCanOpenWindowsAutomatically(false);
    s.setCacheMode(WebSettings.LOAD_DEFAULT);
    web.setOverScrollMode(View.OVER_SCROLL_NEVER);
    s.setUserAgentString("Mozilla/5.0 (Linux; Android 11; BRAVIA 4K UR3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);
    web.setBackgroundColor(0);
    web.addJavascriptInterface(new WatchBridge(), "BirchWatch");
    web.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
        Uri u = r.getUrl();
        String sc = u.getScheme();
        if (!("http".equals(sc) || "https".equals(sc))) return true;
        if (Dl.pkgUrl(u)) { installApk(u.toString(), web.getSettings().getUserAgentString()); return true; }
        if (isAd(u.getHost())) return true;
        if (MainActivity.HOST.equals(u.getHost())) return false;
        if (r.isForMainFrame() && !homeBase.isEmpty() && !homeBase.equals(base(u.getHost()))) {
          String lower = u.toString().toLowerCase();
          return !(lower.contains("apk") || lower.contains("download"));
        }
        return false;
      }
      @Override public void onPageStarted(WebView v, String url, Bitmap f) {
        v.evaluateJavascript(NO_POPUPS, null);
        if (Pic.js != null) v.evaluateJavascript(Pic.js, null);
      }
      @Override public void onPageFinished(WebView v, String url) {
        v.evaluateJavascript(PAGE_FIX, null);
        v.evaluateJavascript(FS_CSS, null);
        v.evaluateJavascript(WATCH_JS, null);
        if (Pic.js != null) v.evaluateJavascript(Pic.js, null);
      }
      @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
        Uri u = r.getUrl();
        if (MainActivity.HOST.equals(u.getHost())) return Assets.open(WebAppActivity.this, u.getPath());
        if (isAd(u.getHost())) return empty();
        String acc = r.getRequestHeaders().get("Accept");
        if (!"GET".equals(r.getMethod()) || acc == null || !acc.contains("text/html") || r.isForMainFrame()) return null;
        String hh = u.getHost() == null ? "" : u.getHost();
        if (hh.contains("cloudflare") || hh.contains("recaptcha") || hh.contains("google.com") || hh.contains("hcaptcha")) return null;
        try {
          HttpURLConnection c = (HttpURLConnection) new URL(u.toString()).openConnection();
          c.setInstanceFollowRedirects(true); c.setConnectTimeout(10000); c.setReadTimeout(15000);
          for (Map.Entry<String, String> h : r.getRequestHeaders().entrySet())
            if (!h.getKey().equalsIgnoreCase("X-Requested-With")) c.setRequestProperty(h.getKey(), h.getValue());
          c.setRequestProperty("User-Agent", v.getSettings().getUserAgentString());
          String ck = CookieManager.getInstance().getCookie(u.toString());
          if (ck != null) c.setRequestProperty("Cookie", ck);
          int code = c.getResponseCode();
          Map<String, java.util.List<String>> hs = c.getHeaderFields();
          Map<String, String> out = new HashMap<>();
          for (Map.Entry<String, java.util.List<String>> h : hs.entrySet()) {
            if (h.getKey() == null || h.getValue().isEmpty()) continue;
            if (h.getKey().equalsIgnoreCase("Set-Cookie")) { for (String sv : h.getValue()) CookieManager.getInstance().setCookie(u.toString(), sv); continue; }
            String k = h.getKey().toLowerCase();
            if (k.equals("content-security-policy") || k.equals("x-frame-options") || k.equals("content-encoding") || k.equals("content-length") || k.equals("transfer-encoding")) continue;
            out.put(h.getKey(), h.getValue().get(0));
          }
          if (code >= 300 && code < 400) return null;
          String ct = c.getContentType(); String mime = "text/html", enc = "utf-8";
          if (ct != null) { String[] parts = ct.split(";"); mime = parts[0].trim(); for (String pt : parts) if (pt.trim().startsWith("charset=")) enc = pt.trim().substring(8); }
          InputStream in = code >= 400 ? c.getErrorStream() : c.getInputStream();
          if (in == null) return null;
          String reason = c.getResponseMessage(); if (reason == null || reason.isEmpty()) reason = "OK";
          if (mime.contains("html")) {
            ByteArrayOutputStream bo = new ByteArrayOutputStream(); byte[] buf = new byte[16384]; int n;
            while ((n = in.read(buf)) > 0) bo.write(buf, 0, n); in.close();
            String html = bo.toString(enc);
            String inj = "<script>" + SPOOF + NO_POPUPS + "document.addEventListener('DOMContentLoaded',function(){" + LITE + FS_CSS + "});</script>";
            int hi = html.toLowerCase().indexOf("<head");
            if (hi >= 0) { int e = html.indexOf('>', hi); html = html.substring(0, e + 1) + inj + html.substring(e + 1); } else html = inj + html;
            in = new ByteArrayInputStream(html.getBytes(enc));
          }
          return new WebResourceResponse(mime, enc, code, reason, out, in);
        } catch (Throwable t) { return null; }
      }
      @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
        if (r.isForMainFrame()) v.loadData("<body style='background:#000;color:#fff;font:28px sans-serif;display:flex;align-items:center;justify-content:center;height:90vh;text-align:center'>This site couldn't be reached.<br>Check your internet or try again later.</body>", "text/html", "utf-8");
      }
    });
    web.setWebChromeClient(new WebChromeClient() {
      @Override public Bitmap getDefaultVideoPoster() { return Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888); }
      @Override public void onShowCustomView(View v, CustomViewCallback cb) {
        if (fullView != null) { cb.onCustomViewHidden(); return; }
        fullView = v; fullCb = cb;
        v.setBackgroundColor(0);
        v.setPadding(0, 0, 0, 0);
        v.setFitsSystemWindows(false);
        v.setTranslationX(0); v.setTranslationY(0); v.setScaleX(1); v.setScaleY(1);
        fsLayer.addView(v, new FrameLayout.LayoutParams(-1, -1, Gravity.CENTER));
        fsLayer.setVisibility(View.VISIBLE);
        fsLayer.bringToFront();
        cursor.setVisibility(View.GONE);
        hideBars(getWindow().getDecorView()); hideBars(root); hideBars(v);
        v.requestFocus();
        savedY = web.getScrollY();
        web.scrollTo(0, savedY >> 1);
        Runnable fix = () -> {
          if (fullView == null) return;
          fsLayer.requestLayout();
          web.scrollTo(0, savedY >> 1);
          web.evaluateJavascript("window.dispatchEvent(new Event('resize'))", null);
        };
        fsLayer.postDelayed(fix, 300);
        fsLayer.postDelayed(fix, 1000);
      }
      @Override public boolean onCreateWindow(WebView v, boolean d, boolean g, android.os.Message m) { return false; }
      @Override public void onHideCustomView() {
        if (fullView != null) fsLayer.removeView(fullView);
        fsLayer.setVisibility(View.GONE);
        fullView = null; fullCb = null;
        web.setVisibility(View.VISIBLE);
        web.requestFocus();
        web.scrollTo(0, savedY);
        hideBars(root);
        if (cursorMode) cursor.setVisibility(View.VISIBLE);
      }
    });
    root.addView(web);
    web.setDownloadListener((url, ua, cd, mime, len) -> {
      String name = URLUtil.guessFileName(url, cd, mime).toLowerCase();
      if (name.endsWith(".apk") || name.endsWith(".xapk") || name.endsWith(".apks") || name.endsWith(".apkm")
          || "application/vnd.android.package-archive".equals(mime) || "application/octet-stream".equals(mime)) installApk(url, ua);
      else Toast.makeText(this, "Birch OS can only install app files (.apk / .xapk)", Toast.LENGTH_LONG).show();
    });
    cursor = new View(this);
    GradientDrawable g = new GradientDrawable();
    g.setShape(GradientDrawable.OVAL); g.setColor(0xEEFFFFFF); g.setStroke(4, 0xFF000000);
    cursor.setBackground(g);
    cursor.setVisibility(View.GONE);
    root.addView(cursor, new FrameLayout.LayoutParams(34, 34));
    fsLayer = new FrameLayout(this);
    fsLayer.setBackgroundColor(0);
    fsLayer.setVisibility(View.GONE);
    root.addView(fsLayer, new FrameLayout.LayoutParams(-1, -1));
    setContentView(root);
    hideBars(root);
    String url = getIntent().getStringExtra("url");
    if (url != null) homeBase = base(Uri.parse(url).getHost());
    web.loadUrl(url == null ? "about:blank" : url);
    showChooser();
  }

  @Override public void onWindowFocusChanged(boolean has) {
    super.onWindowFocusChanged(has);
    if (has) hideBars(getWindow().getDecorView());
  }

  void showChooser() {
    LinearLayout box = new LinearLayout(this);
    box.setOrientation(LinearLayout.VERTICAL);
    box.setGravity(Gravity.CENTER);
    box.setPadding(60, 50, 60, 50);
    GradientDrawable bg = new GradientDrawable(); bg.setColor(0xF0181820); bg.setCornerRadius(36);
    box.setBackground(bg);
    TextView t = new TextView(this);
    t.setText("How do you want to control this app?");
    t.setTextColor(Color.WHITE); t.setTextSize(24); t.setPadding(0, 0, 0, 30);
    box.addView(t);
    LinearLayout row = new LinearLayout(this);
    row.setGravity(Gravity.CENTER);
    Button sel = btn("Select (arrows)"), cur = btn("Cursor (mouse)");
    sel.setOnClickListener(v -> pick(false));
    cur.setOnClickListener(v -> pick(true));
    row.addView(sel); row.addView(cur);
    box.addView(row);
    chooser = box;
    root.addView(box, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.CENTER));
    cur.requestFocus();
  }

  Button btn(String label) {
    Button b = new Button(this);
    b.setText(label); b.setAllCaps(false); b.setTextSize(20);
    b.setTextColor(Color.WHITE); b.setPadding(40, 24, 40, 24);
    b.setFocusable(true);
    b.setOnFocusChangeListener((v, f) -> {
      GradientDrawable d = new GradientDrawable(); d.setCornerRadius(24);
      d.setColor(f ? 0xFFFFFFFF : 0x33FFFFFF);
      v.setBackground(d); ((Button) v).setTextColor(f ? 0xFF000000 : 0xFFFFFFFF);
    });
    GradientDrawable d = new GradientDrawable(); d.setCornerRadius(24); d.setColor(0x33FFFFFF);
    b.setBackground(d);
    LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
    lp.setMargins(16, 0, 16, 0); b.setLayoutParams(lp);
    return b;
  }

  void pick(boolean c) {
    cursorMode = c;
    root.removeView(chooser); chooser = null;
    if (c) {
      cx = root.getWidth() / 2f; cy = root.getHeight() / 2f;
      cursor.setVisibility(View.VISIBLE); placeCursor();
    }
    web.requestFocus();
  }

  void placeCursor() { cursor.setTranslationX(cx - 17); cursor.setTranslationY(cy - 17); }

  final Choreographer.FrameCallback frame = new Choreographer.FrameCallback() {
    @Override public void doFrame(long nanos) {
      float dt = lastFrame == 0 ? 0.016f : Math.min(0.05f, (nanos - lastFrame) / 1e9f);
      lastFrame = nanos;
      float accel = 2600f, max = 1500f, friction = 14f;
      int ax = (hr ? 1 : 0) - (hl ? 1 : 0), ay = (hd ? 1 : 0) - (hu ? 1 : 0);
      if (ax != 0) { vx += ax * accel * dt; if (vx * ax < 260) vx = ax * 260; } else vx -= vx * Math.min(1, friction * dt);
      if (ay != 0) { vy += ay * accel * dt; if (vy * ay < 260) vy = ay * 260; } else vy -= vy * Math.min(1, friction * dt);
      vx = Math.max(-max, Math.min(max, vx)); vy = Math.max(-max, Math.min(max, vy));
      float w = root.getWidth(), h = root.getHeight(), edge = 50;
      cx += vx * dt; cy += vy * dt;
      if (cy < edge && vy < 0) web.scrollBy(0, (int) (vy * dt * 2));
      if (cy > h - edge && vy > 0) web.scrollBy(0, (int) (vy * dt * 2));
      cx = Math.max(0, Math.min(w - 1, cx)); cy = Math.max(0, Math.min(h - 1, cy));
      placeCursor();
      long t = SystemClock.uptimeMillis();
      MotionEvent hv = MotionEvent.obtain(t, t, MotionEvent.ACTION_HOVER_MOVE, cx, cy, 0);
      hv.setSource(android.view.InputDevice.SOURCE_MOUSE); web.dispatchGenericMotionEvent(hv); hv.recycle();
      if (ax != 0 || ay != 0 || Math.abs(vx) > 5 || Math.abs(vy) > 5) Choreographer.getInstance().postFrameCallback(this);
      else { vx = vy = 0; looping = false; lastFrame = 0; }
    }
  };
  void kick() { if (!looping) { looping = true; lastFrame = 0; Choreographer.getInstance().postFrameCallback(frame); } }

  void tap() {
    long t = SystemClock.uptimeMillis();
    MotionEvent d = MotionEvent.obtain(t, t, MotionEvent.ACTION_DOWN, cx, cy, 0);
    MotionEvent u = MotionEvent.obtain(t, t + 60, MotionEvent.ACTION_UP, cx, cy, 0);
    d.setSource(android.view.InputDevice.SOURCE_TOUCHSCREEN); u.setSource(android.view.InputDevice.SOURCE_TOUCHSCREEN);
    web.dispatchTouchEvent(d); web.dispatchTouchEvent(u);
    d.recycle(); u.recycle();
  }

  @Override public boolean dispatchKeyEvent(KeyEvent e) {
    if (chooser != null || !cursorMode || fullView != null) return super.dispatchKeyEvent(e);
    int k = e.getKeyCode();
    boolean dir = k == KeyEvent.KEYCODE_DPAD_UP || k == KeyEvent.KEYCODE_DPAD_DOWN || k == KeyEvent.KEYCODE_DPAD_LEFT || k == KeyEvent.KEYCODE_DPAD_RIGHT;
    boolean ok = k == KeyEvent.KEYCODE_DPAD_CENTER || k == KeyEvent.KEYCODE_ENTER;
    if (!dir && !ok) return super.dispatchKeyEvent(e);
    boolean down = e.getAction() == KeyEvent.ACTION_DOWN;
    if (ok) { if (down && e.getRepeatCount() == 0) tap(); return true; }
    if (k == KeyEvent.KEYCODE_DPAD_LEFT) hl = down;
    if (k == KeyEvent.KEYCODE_DPAD_RIGHT) hr = down;
    if (k == KeyEvent.KEYCODE_DPAD_UP) hu = down;
    if (k == KeyEvent.KEYCODE_DPAD_DOWN) hd = down;
    if (down) kick();
    return true;
  }

  @Override public void onBackPressed() {
    if (chooser != null) { pick(false); return; }
    if (fullView != null) { if (fullCb != null) fullCb.onCustomViewHidden(); return; }
    if (web.canGoBack()) web.goBack(); else finish();
  }

  @Override public boolean onKeyDown(int code, KeyEvent e) {
    if (code == KeyEvent.KEYCODE_MENU) { finish(); return true; }
    return super.onKeyDown(code, e);
  }

  @Override protected void onDestroy() { web.destroy(); super.onDestroy(); }

  void installApk(final String url, final String ua) {
    Dl.ref = web.getUrl();
    Toast.makeText(this, "Downloading app...", Toast.LENGTH_LONG).show();
    new Thread(() -> {
      try {
        if (Build.VERSION.SDK_INT >= 26 && !getPackageManager().canRequestPackageInstalls()) {
          runOnUiThread(() -> {
            Toast.makeText(this, "Allow Birch OS to install apps, then try again", Toast.LENGTH_LONG).show();
            startActivity(new android.content.Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName())));
          });
          return;
        }
        Dl.run(this, url, ua);
      } catch (Throwable t) {
        Dl.note(t);
        runOnUiThread(() -> Toast.makeText(this, "Download failed: " + Dl.err, Toast.LENGTH_LONG).show());
      }
    }).start();
  }

  class WatchBridge {
    @JavascriptInterface public void save(String json) { Watch.save(WebAppActivity.this, json); }
  }
}
