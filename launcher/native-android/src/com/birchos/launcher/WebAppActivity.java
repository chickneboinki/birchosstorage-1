package com.birchos.launcher;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
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
import java.io.File;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/** Movies/web apps — early profile bypass, auto-fullscreen video, v47 cursor. */
public class WebAppActivity extends Activity {
  static final String CHALLENGE =
      "(function(){try{if(window.__birchChal3)return;window.__birchChal3=1;"
          + "function kill(){try{"
          + "var re=/qr|scan this|scan the|identif|verify you|are you human|bot check|cloudflare|just a moment|checking your browser|30\\s*sec|attention required|captcha|press and hold|i'?m not a robot/i;"
          + "document.querySelectorAll('div,section,aside,dialog,main,form').forEach(function(el){"
          + "var tx=(el.innerText||'').slice(0,500);if(!re.test(tx))return;"
          + "var r=el.getBoundingClientRect();if(r.width<100||r.height<60)return;"
          + "el.querySelectorAll('button,a,span,[role=button],svg').forEach(function(c){"
          + "var ct=(c.innerText||c.getAttribute('aria-label')||'').toLowerCase();"
          + "if(/^(x|×|close|dismiss|skip|continue|allow|got it)$/i.test(ct.trim())||ct.indexOf('close')>=0){try{c.click()}catch(e){}}});"
          + "el.style.setProperty('display','none','important');el.style.setProperty('visibility','hidden','important');"
          + "el.style.setProperty('pointer-events','none','important');try{el.remove()}catch(e){}});"
          + "document.querySelectorAll('iframe').forEach(function(f){var s=f.src||'';"
          + "if(/captcha|challenge|turnstile|hcaptcha|recaptcha|cf-chl|qr/i.test(s)){f.style.display='none';try{f.remove()}catch(e){}});"
          + "}catch(e){}}kill();setInterval(kill,700);"
          + "try{new MutationObserver(kill).observe(document.documentElement,{childList:true,subtree:true})}catch(e){}"
          + "}catch(e){}})();";

  static final String PROFILE_BYPASS =
      "(function(){try{if(window.__birchProf)return;window.__birchProf=1;"
          + "function arm(){try{var p=localStorage.getItem('birchos.profile');"
          + "if(p){sessionStorage.setItem('birchos.chosen','1');"
          + "try{window.dispatchEvent(new Event('birchos-profile'));}catch(e){}}"
          + "var path=location.pathname||'';"
          + "if(path!=='/profiles'&&path!=='/auth'){sessionStorage.setItem('birchos.return',location.href);}"
          + "if(path==='/profiles'&&p){var ret=sessionStorage.getItem('birchos.return');"
          + "if(ret&&ret.indexOf('/profiles')<0){location.replace(ret);}else{location.replace('/');}}"
          + "}catch(e){}}"
          + "arm();setInterval(arm,400);"
          + "try{var _ps=history.pushState;history.pushState=function(){var r=_ps.apply(this,arguments);arm();return r;};"
          + "var _rs=history.replaceState;history.replaceState=function(){var r=_rs.apply(this,arguments);arm();return r;};"
          + "window.addEventListener('popstate',arm);}catch(e){}"
          + "}catch(e){}})();";

  static final String HOME_ZOOM =
      "(function(){try{if(window.__birchZoom)return;window.__birchZoom=1;"
          + "function apply(){var h=location.hostname||'',p=location.pathname||'/';"
          + "if(h.indexOf('birchos-tv')<0&&h.indexOf('lovable.app')<0)return;"
          + "var home=p==='/'||p===''||p==='/index.html'||p==='/home';"
          + "var z=home?'0.82':'1';"
          + "try{document.documentElement.style.zoom=z;}catch(e){}"
          + "try{if(document.body)document.body.style.zoom=z;}catch(e){}}"
          + "apply();setInterval(apply,2000);}catch(e){}})();";

  static final String VIDEO_FIX =
      "(function(){try{if(window.__birchVid2)return;window.__birchVid2=1;"
          + "var st=document.createElement('style');st.id='birch-vid';"
          + "st.textContent='html,body{background:#000!important}"
          + "+\"video{opacity:1!important;visibility:visible!important;display:block!important;\"
          + "width:100%!important;max-height:100vh!important;min-height:200px!important;\"
          + "object-fit:contain!important;background:#000!important;z-index:2147483000!important;\"
          + "position:relative!important;-webkit-transform:translateZ(0)!important;transform:translateZ(0)!important}\"
          + "video::-webkit-media-controls{opacity:1!important;display:flex!important}"
          + "+\".plyr,.jwplayer,[class*=player],[class*=Player],[id*=player],[id*=Player],[class*=video],[class*=Video]{\"
          + "opacity:1!important;visibility:visible!important;min-height:220px!important;background:#000!important;\"
          + "z-index:20!important}\";"
          + "(document.head||document.documentElement).appendChild(st);"
          + "function goFs(v){try{"
          + "if(v.webkitEnterFullscreen){v.webkitEnterFullscreen();return;}"
          + "if(v.requestFullscreen){v.requestFullscreen();return;}"
          + "if(v.webkitRequestFullscreen){v.webkitRequestFullscreen();return;}"
          + "if(v.mozRequestFullScreen){v.mozRequestFullScreen();return;}"
          + "}catch(e){}"
          + "try{document.querySelectorAll('button,[role=button],a').forEach(function(b){"
          + "var t=((b.getAttribute('aria-label')||'')+' '+(b.title||'')+' '+(b.innerText||'')).toLowerCase();"
          + "if(/full\\s*screen|fullscreen|expand|maximize/.test(t)){b.click();}"
          + "});}catch(e){}}"
          + "function fix(v){if(!v||v.tagName!=='VIDEO')return;"
          + "v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');"
          + "v.removeAttribute('hidden');v.style.opacity='1';v.style.visibility='visible';"
          + "v.style.display='block';v.style.width='100%';v.style.maxHeight='100vh';"
          + "v.style.objectFit='contain';v.style.background='#000';"
          + "var p=v.parentElement;for(var i=0;i<8&&p;i++){"
          + "try{var cs=getComputedStyle(p);if(cs.opacity==='0'||cs.visibility==='hidden'){p.style.opacity='1';p.style.visibility='visible'}"
          + "if(cs.display==='none'){p.style.display='block'}"
          + "if(p.offsetHeight<40){p.style.minHeight='240px'}p.style.overflow='visible';"
          + "}catch(e){}p=p.parentElement;}}"
          + "function scan(){document.querySelectorAll('video').forEach(fix);}"
          + "document.addEventListener('play',function(e){var v=e.target;if(!v||v.tagName!=='VIDEO')return;fix(v);"
          + "if(!v.__birchFs){v.__birchFs=1;setTimeout(function(){goFs(v);},300);}"
          + "},true);"
          + "document.addEventListener('loadeddata',function(e){if(e.target&&e.target.tagName==='VIDEO')fix(e.target);},true);"
          + "scan();setInterval(scan,1200);}catch(e){}})();";

  static final String NO_POPUPS =
      "(function(){try{window.open=function(){return null};document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[target=_blank]');if(a)a.removeAttribute('target');},true);}catch(e){}})();";

  static final String WATCH_JS =
      "(function(){try{if(window.__birchWatch)return;window.__birchWatch=1;"
          + "function cleanTitle(){return (document.title||'').replace(/\\s*[|\\-–].*$/,'').trim().slice(0,80);}"
          + "function isWatchUrl(u){return /\\/(movie|tv|watch|title|play|episode|season)\\b/i.test(u)||/[?&](id|v|tmdb)=/i.test(u);}"
          + "function meta(){var u=location.href,title=cleanTitle(),img='',og=document.querySelector('meta[property=\\\"og:image\\\"]');if(og&&og.content)img=og.content;"
          + "var pos=0,dur=0,vid=document.querySelector('video');if(vid){pos=vid.currentTime||0;dur=vid.duration||0;}"
          + "var metaTxt='';if(pos>0){metaTxt=Math.floor(pos/60)+'m '+Math.floor(pos%60)+'s';}"
          + "return{title:title,url:u,img:img,meta:metaTxt,position:pos,duration:dur,t:Date.now()};}"
          + "function save(){try{if(location.hostname==='birchos.local'||!location.hostname)return;"
          + "if(!isWatchUrl(location.href)&&!document.querySelector('video'))return;var o=meta();if(!o.title||o.title==='Birch OS')return;"
          + "try{var l=[];try{l=JSON.parse(localStorage.getItem('birch-watch-v1')||'[]')}catch(e){}l=l.filter(function(x){return x.url!==o.url});l.unshift(o);localStorage.setItem('birch-watch-v1',JSON.stringify(l.slice(0,20)));}catch(e){}"
          + "if(window.BirchWatch)window.BirchWatch.save(JSON.stringify(o));}catch(e){}}"
          + "var t;function sched(){clearTimeout(t);t=setTimeout(save,1200);}"
          + "document.addEventListener('timeupdate',function(e){if(e.target&&e.target.tagName==='VIDEO')sched();},true);"
          + "setInterval(function(){var v=document.querySelector('video');if(v&&v.currentTime>5)save();},20000);"
          + "window.addEventListener('popstate',sched);var ps=history.pushState;history.pushState=function(){var r=ps.apply(this,arguments);sched();return r;};sched();}catch(e){}})();";

  static final String EARLY_HEAD =
      "<script>(function(){try{"
          + "var p=localStorage.getItem('birchos.profile');"
          + "if(p){sessionStorage.setItem('birchos.chosen','1');}"
          + "var path=location.pathname||'';"
          + "if(path!=='/profiles'&&path!=='/auth'){sessionStorage.setItem('birchos.return',location.href);}"
          + "}catch(e){}})();</script>";

  WebView web;
  View fullView, cursor, chooser;
  FrameLayout root, fsLayer;
  boolean cursorMode;
  float cx = 400, cy = 300;
  String homeBase = "";
  WebChromeClient.CustomViewCallback fullCb;
  int savedY;
  boolean hl, hr, hu, hd;
  float vx, vy;
  long lastFrame;
  boolean looping;

  void hideBars(View v) {
    v.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
  }

  static String base(String host) {
    if (host == null) return "";
    String[] p = host.split("\\.");
    return p.length <= 2 ? host : p[p.length - 2] + "." + p[p.length - 1];
  }

  static boolean isMoviesHost(String host) {
    if (host == null) return false;
    return host.contains("birchos-tv") || host.contains("lovable.app");
  }

  void persistCookies() {
    try { CookieManager cm = CookieManager.getInstance(); cm.setAcceptCookie(true); cm.flush(); } catch (Throwable ignored) {}
  }

  void injectAll(WebView v) {
    v.evaluateJavascript(PROFILE_BYPASS, null);
    v.evaluateJavascript(NO_POPUPS, null);
    v.evaluateJavascript(CHALLENGE, null);
    v.evaluateJavascript(HOME_ZOOM, null);
    v.evaluateJavascript(VIDEO_FIX, null);
  }

  WebResourceResponse injectHtml(String url) {
    HttpURLConnection c = null;
    try {
      c = (HttpURLConnection) new URL(url).openConnection();
      c.setConnectTimeout(15000);
      c.setReadTimeout(20000);
      c.setInstanceFollowRedirects(true);
      c.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 BirchOSLauncher/1");
      c.setRequestProperty("Accept", "text/html,application/xhtml+xml");
      int code = c.getResponseCode();
      InputStream in = code >= 400 ? c.getErrorStream() : c.getInputStream();
      if (in == null) return null;
      ByteArrayOutputStream bo = new ByteArrayOutputStream();
      byte[] buf = new byte[8192];
      int n;
      while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
      String html = new String(bo.toByteArray(), StandardCharsets.UTF_8);
      if (html.toLowerCase().contains("<html")) {
        if (html.contains("<head>")) html = html.replaceFirst("<head>", "<head>" + EARLY_HEAD);
        else if (html.contains("<HEAD>")) html = html.replaceFirst("<HEAD>", "<HEAD>" + EARLY_HEAD);
        else html = EARLY_HEAD + html;
      }
      String mime = c.getContentType();
      if (mime == null || !mime.contains("html")) mime = "text/html";
      int semi = mime.indexOf(';');
      if (semi > 0) mime = mime.substring(0, semi).trim();
      return new WebResourceResponse(mime, "utf-8", new ByteArrayInputStream(html.getBytes(StandardCharsets.UTF_8)));
    } catch (Throwable t) {
      return null;
    } finally {
      if (c != null) c.disconnect();
    }
  }

  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    root = new FrameLayout(this);
    root.setBackgroundColor(0xFF000000);
    web = new WebView(this);
    web.setLayerType(View.LAYER_TYPE_HARDWARE, null);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setLoadWithOverviewMode(true);
    s.setUseWideViewPort(true);
    s.setTextZoom(100);
    s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
    s.setSupportMultipleWindows(false);
    s.setCacheMode(WebSettings.LOAD_DEFAULT);
    s.setUserAgentString("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");
    CookieManager cm = CookieManager.getInstance();
    cm.setAcceptCookie(true);
    cm.setAcceptThirdPartyCookies(web, true);
    persistCookies();
    web.setBackgroundColor(0xFF000000);
    web.addJavascriptInterface(new WatchBridge(), "BirchWatch");
    web.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
        Uri u = r.getUrl();
        String sc = u.getScheme();
        if (!("http".equals(sc) || "https".equals(sc))) return true;
        if (Dl.pkgUrl(u)) { installApk(u.toString(), web.getSettings().getUserAgentString()); return true; }
        if (MainActivity.HOST.equals(u.getHost())) return false;
        if (r.isForMainFrame() && !homeBase.isEmpty() && !homeBase.equals(base(u.getHost()))) {
          if ("birchos.local".equals(homeBase) || homeBase.isEmpty()) { homeBase = base(u.getHost()); return false; }
          String lower = u.toString().toLowerCase();
          return !(lower.contains("apk") || lower.contains("download"));
        }
        return false;
      }
      @Override public void onPageStarted(WebView v, String url, Bitmap f) { injectAll(v); }
      @Override public void onPageFinished(WebView v, String url) {
        injectAll(v);
        v.evaluateJavascript(WATCH_JS, null);
        if (Pic.js != null) v.evaluateJavascript(Pic.js, null);
        persistCookies();
      }
      @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
        Uri u = r.getUrl();
        if (MainActivity.HOST.equals(u.getHost())) return Assets.open(WebAppActivity.this, u.getPath());
        if (r.isForMainFrame() && isMoviesHost(u.getHost()) && ("http".equals(u.getScheme()) || "https".equals(u.getScheme()))) {
          WebResourceResponse injected = injectHtml(u.toString());
          if (injected != null) return injected;
        }
        return null;
      }
      @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
        if (r.isForMainFrame()) v.loadData("<body style='background:#000;color:#fff;font:24px sans-serif;display:flex;align-items:center;justify-content:center;height:90vh;text-align:center'>This site could not be reached.</body>", "text/html", "utf-8");
      }
    });
    web.setWebChromeClient(new WebChromeClient() {
      @Override public Bitmap getDefaultVideoPoster() { return Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888); }
      @Override public void onShowCustomView(View v, CustomViewCallback cb) {
        if (fullView != null) { cb.onCustomViewHidden(); return; }
        fullView = v; fullCb = cb;
        v.setBackgroundColor(0xFF000000);
        fsLayer.addView(v, new FrameLayout.LayoutParams(-1, -1, Gravity.CENTER));
        fsLayer.setVisibility(View.VISIBLE); fsLayer.bringToFront();
        cursor.setVisibility(View.GONE);
        hideBars(getWindow().getDecorView()); hideBars(root); hideBars(v);
        v.requestFocus(); savedY = web.getScrollY();
      }
      @Override public boolean onCreateWindow(WebView v, boolean d, boolean g, android.os.Message m) { return false; }
      @Override public void onHideCustomView() {
        if (fullView != null) fsLayer.removeView(fullView);
        fsLayer.setVisibility(View.GONE); fullView = null; fullCb = null;
        web.requestFocus(); web.scrollTo(0, savedY); hideBars(root);
        if (cursorMode) cursor.setVisibility(View.VISIBLE);
      }
    });
    root.addView(web);
    web.setDownloadListener((url, ua, cd, mime, len) -> {
      String name = URLUtil.guessFileName(url, cd, mime).toLowerCase();
      if (name.endsWith(".apk") || "application/vnd.android.package-archive".equals(mime)) installApk(url, ua);
      else Toast.makeText(this, "Birch OS can only install .apk files", Toast.LENGTH_LONG).show();
    });
    cursor = new View(this);
    GradientDrawable g = new GradientDrawable();
    g.setShape(GradientDrawable.OVAL); g.setColor(0xEEFFFFFF); g.setStroke(3, 0xFF000000);
    cursor.setBackground(g); cursor.setVisibility(View.GONE);
    cursor.setLayerType(View.LAYER_TYPE_HARDWARE, null);
    root.addView(cursor, new FrameLayout.LayoutParams(34, 34));
    fsLayer = new FrameLayout(this);
    fsLayer.setBackgroundColor(0xFF000000); fsLayer.setVisibility(View.GONE);
    root.addView(fsLayer, new FrameLayout.LayoutParams(-1, -1));
    setContentView(root); hideBars(root);
    String url = getIntent().getStringExtra("url");
    if (url != null) { try { homeBase = base(Uri.parse(url).getHost()); } catch (Throwable t) { homeBase = ""; } }
    web.loadUrl(url == null ? "about:blank" : url);
    showChooser();
  }

  @Override protected void onPause() { persistCookies(); stopLoop(); super.onPause(); }
  @Override protected void onResume() { super.onResume(); persistCookies(); }
  @Override public void onWindowFocusChanged(boolean has) { super.onWindowFocusChanged(has); if (has) hideBars(getWindow().getDecorView()); }

  void showChooser() {
    LinearLayout box = new LinearLayout(this);
    box.setOrientation(LinearLayout.VERTICAL); box.setGravity(Gravity.CENTER); box.setPadding(60, 50, 60, 50);
    GradientDrawable bg = new GradientDrawable(); bg.setColor(0xF0181820); bg.setCornerRadius(36); box.setBackground(bg);
    TextView t = new TextView(this); t.setText("How do you want to control this app?"); t.setTextColor(Color.WHITE); t.setTextSize(22); t.setPadding(0, 0, 0, 30); box.addView(t);
    LinearLayout row = new LinearLayout(this); row.setGravity(Gravity.CENTER);
    Button sel = btn("Select (arrows)"), cur = btn("Cursor (mouse)");
    sel.setOnClickListener(v -> pick(false)); cur.setOnClickListener(v -> pick(true));
    row.addView(sel); row.addView(cur); box.addView(row); chooser = box;
    root.addView(box, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.CENTER));
    cur.requestFocus();
  }

  Button btn(String label) {
    Button b = new Button(this); b.setText(label); b.setAllCaps(false); b.setTextSize(18); b.setTextColor(Color.WHITE); b.setPadding(40, 24, 40, 24); b.setFocusable(true);
    b.setOnFocusChangeListener((v, f) -> { GradientDrawable d = new GradientDrawable(); d.setCornerRadius(24); d.setColor(f ? 0xFFFFFFFF : 0x33FFFFFF); v.setBackground(d); ((Button) v).setTextColor(f ? 0xFF000000 : 0xFFFFFFFF); });
    GradientDrawable d = new GradientDrawable(); d.setCornerRadius(24); d.setColor(0x33FFFFFF); b.setBackground(d);
    LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT); lp.setMargins(16, 0, 16, 0); b.setLayoutParams(lp);
    return b;
  }

  void pick(boolean c) {
    cursorMode = c; root.removeView(chooser); chooser = null;
    if (c) { cx = Math.max(100, root.getWidth() / 2f); cy = Math.max(100, root.getHeight() / 2f); cursor.setVisibility(View.VISIBLE); placeCursor(); }
    web.requestFocus();
  }

  void placeCursor() { cursor.setTranslationX(cx - 17f); cursor.setTranslationY(cy - 17f); }
  void kick() { if (looping) return; looping = true; lastFrame = 0; Choreographer.getInstance().postFrameCallback(frame); }
  void stopLoop() { looping = false; hl = hr = hu = hd = false; vx = vy = 0; }

  void tap() {
    long now = SystemClock.uptimeMillis();
    MotionEvent down = MotionEvent.obtain(now, now, MotionEvent.ACTION_DOWN, cx, cy, 0);
    MotionEvent up = MotionEvent.obtain(now, now + 60, MotionEvent.ACTION_UP, cx, cy, 0);
    down.setSource(4098); up.setSource(4098);
    web.dispatchTouchEvent(down); web.dispatchTouchEvent(up);
    down.recycle(); up.recycle();
  }

  final Choreographer.FrameCallback frame = new Choreographer.FrameCallback() {
    @Override public void doFrame(long t) {
      if (!looping || !cursorMode) { looping = false; return; }
      float dt = lastFrame == 0 ? 0.016f : Math.min(0.05f, (t - lastFrame) / 1_000_000_000f);
      lastFrame = t;
      int dx = (hr ? 1 : 0) - (hl ? 1 : 0);
      int dy = (hd ? 1 : 0) - (hu ? 1 : 0);
      if (dx == 0) vx = vx - vx * Math.min(1f, dt * 14f);
      else { vx = vx + dx * 2600f * dt; if (vx * dx < 260f) vx = dx * 260f; }
      if (dy == 0) vy = vy - vy * Math.min(1f, dt * 14f);
      else { vy = vy + dy * 2600f * dt; if (vy * dy < 260f) vy = dy * 260f; }
      vx = Math.max(-1500f, Math.min(1500f, vx));
      vy = Math.max(-1500f, Math.min(1500f, vy));
      float w = Math.max(1, root.getWidth());
      float h = Math.max(1, root.getHeight());
      cx += vx * dt; cy += vy * dt;
      if (cy < 50f && vy < 0f) web.scrollBy(0, (int) (vy * dt * 2f));
      if (cy > h - 50f && vy > 0f) web.scrollBy(0, (int) (vy * dt * 2f));
      cx = Math.max(0f, Math.min(w - 1f, cx));
      cy = Math.max(0f, Math.min(h - 1f, cy));
      placeCursor();
      long now = SystemClock.uptimeMillis();
      MotionEvent hover = MotionEvent.obtain(now, now, MotionEvent.ACTION_HOVER_MOVE, cx, cy, 0);
      hover.setSource(8194);
      web.dispatchGenericMotionEvent(hover);
      hover.recycle();
      if (dx != 0 || dy != 0 || Math.abs(vx) > 5f || Math.abs(vy) > 5f) Choreographer.getInstance().postFrameCallback(this);
      else { looping = false; lastFrame = 0; }
    }
  };

  @Override public boolean dispatchKeyEvent(KeyEvent e) {
    if (chooser != null || !cursorMode || fullView != null) return super.dispatchKeyEvent(e);
    int code = e.getKeyCode();
    boolean down = e.getAction() == KeyEvent.ACTION_DOWN;
    if (code == KeyEvent.KEYCODE_DPAD_CENTER || code == KeyEvent.KEYCODE_ENTER) {
      if (down && e.getRepeatCount() == 0) tap();
      return true;
    }
    if (code == KeyEvent.KEYCODE_DPAD_LEFT) { hl = down; if (down) kick(); return true; }
    if (code == KeyEvent.KEYCODE_DPAD_RIGHT) { hr = down; if (down) kick(); return true; }
    if (code == KeyEvent.KEYCODE_DPAD_UP) { hu = down; if (down) kick(); return true; }
    if (code == KeyEvent.KEYCODE_DPAD_DOWN) { hd = down; if (down) kick(); return true; }
    if (code == KeyEvent.KEYCODE_BACK && e.getAction() == KeyEvent.ACTION_UP) {
      if (web.canGoBack()) { web.goBack(); return true; }
      finish(); return true;
    }
    return super.dispatchKeyEvent(e);
  }

  @Override public void onBackPressed() {
    if (chooser != null) { pick(false); return; }
    if (fullView != null && fullCb != null) { fullCb.onCustomViewHidden(); return; }
    if (web.canGoBack()) web.goBack(); else finish();
  }

  void installApk(String url, String ua) {
    Toast.makeText(this, "Downloading…", Toast.LENGTH_SHORT).show();
    new Thread(() -> {
      try {
        File out = new File(getCacheDir(), "download.apk");
        Dl.fetch(url, ua, out, null);
        Dl.install(WebAppActivity.this, out);
      } catch (Throwable t) {
        runOnUiThread(() -> Toast.makeText(this, "Download failed", Toast.LENGTH_LONG).show());
      }
    }).start();
  }

  class WatchBridge {
    @JavascriptInterface public void save(String json) { Watch.save(WebAppActivity.this, json); }
  }
}
