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

/** Movies/web apps — hard QR kill, profile bypass, in-player auto-FS, v47 cursor. Video cut-off fix v80. */
public class WebAppActivity extends Activity {
  static final String SPOOF =
      "(function(){try{if(window.__birchSpoof)return;window.__birchSpoof=1;"
          + "try{Object.defineProperty(navigator,'webdriver',{get:function(){return undefined}});}catch(e){}"
          + "try{window.chrome=window.chrome||{runtime:{}};}catch(e){}"
          + "try{Object.defineProperty(navigator,'languages',{get:function(){return['en-US','en']}});}catch(e){}"
          + "try{Object.defineProperty(navigator,'plugins',{get:function(){return[1,2,3,4,5]}});}catch(e){}"
          + "}catch(e){}})();";

  static final String CHALLENGE =
      "(function(){try{if(window.__birchChal4)return;window.__birchChal4=1;"
          + "var st=document.createElement('style');st.id='birch-chal-css';"
          + "st.textContent='#cf-wrapper,.cf-browser-verification,.cf-challenge,iframe[src*=captcha],iframe[src*=turnstile],iframe[src*=hcaptcha],iframe[src*=recaptcha],iframe[src*=cf-chl],[class*=captcha],[id*=captcha],[class*=challenge-platform]{display:none!important;visibility:hidden!important;pointer-events:none!important;height:0!important;width:0!important}';"
          + "(document.documentElement||document.head).appendChild(st);"
          + "function isChalText(tx){return /qr\\s*code|scan\\s*(this|the|qr|code)|identif(y|ication)|verify\\s*(you|human)|are\\s*you\\s*(a\\s*)?(robot|human)|bot\\s*check|cloudflare|just\\s*a\\s*moment|checking\\s*your\\s*browser|30\\s*sec|attention\\s*required|captcha|press\\s*and\\s*hold|i'?m\\s*not\\s*a\\s*robot|human\\s*verif|security\\s*check|complete\\s*the\\s*security|please\\s*verify|one\\s*more\\s*step|access\\s*denied|ray\\s*id/i.test(tx||'');}"
          + "function nuke(el){if(!el||el===document.body||el===document.documentElement)return;"
          + "try{el.style.cssText='display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;position:fixed!important;left:-9999px!important;height:0!important;width:0!important;overflow:hidden!important;z-index:-1!important';}catch(e){}"
          + "try{el.remove()}catch(e){}}"
          + "function clickClose(root){try{(root||document).querySelectorAll('button,a,span,[role=button],svg,i,div').forEach(function(c){"
          + "var ct=(c.innerText||c.getAttribute('aria-label')||c.getAttribute('title')||c.className||'').toLowerCase().trim();"
          + "if(/^(x|×|✕|✖|close|dismiss|skip|continue|allow|got it|ok|cancel)$/i.test(ct)||/close|dismiss|skip/.test(ct)){"
          + "try{c.click()}catch(e){}}});}catch(e){}}"
          + "function kill(){try{"
          + "document.querySelectorAll('div,section,aside,dialog,main,form,article').forEach(function(el){"
          + "var tx=(el.innerText||el.textContent||'').slice(0,1200);if(!isChalText(tx))return;"
          + "var r=el.getBoundingClientRect();if(r.width<60||r.height<40)return;"
          + "clickClose(el);nuke(el);});"
          + "document.querySelectorAll('iframe').forEach(function(f){"
          + "var s=((f.src||'')+' '+(f.id||'')+' '+(f.className||'')+' '+(f.name||'')).toLowerCase();"
          + "if(/captcha|challenge|turnstile|hcaptcha|recaptcha|cf-chl|qr|verify|bot|fingerprint|datadome|perimeterx|arkoselabs|funcaptcha/.test(s)){nuke(f);return;}"
          + "try{var doc=f.contentDocument;if(doc){var t=(doc.body&&doc.body.innerText||'').slice(0,800);if(isChalText(t)){clickClose(doc);nuke(f);}}}catch(e){}"
          + "});"
          + "document.querySelectorAll('canvas').forEach(function(c){"
          + "var p=c.parentElement;for(var i=0;i<5&&p;i++){var tx=(p.innerText||'').toLowerCase();"
          + "if(/qr|scan|verify|captcha|robot|human/.test(tx)){nuke(p);break;}p=p.parentElement;}});"
          + "document.querySelectorAll('*').forEach(function(el){"
          + "try{var cs=getComputedStyle(el);if(cs.position!=='fixed'&&cs.position!=='absolute')return;"
          + "var zi=parseInt(cs.zIndex)||0;if(zi<50)return;"
          + "var r=el.getBoundingClientRect();if(r.width<200||r.height<150)return;"
          + "var tx=(el.innerText||'').slice(0,800);if(isChalText(tx)||el.querySelector('canvas')){clickClose(el);nuke(el);}}catch(e){}});"
          + "}catch(e){}}"
          + "kill();setInterval(kill,400);"
          + "try{new MutationObserver(function(){kill()}).observe(document.documentElement,{childList:true,subtree:true});}catch(e){}"
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
      "(function(){try{if(window.__birchVid4)return;window.__birchVid4=1;"
          + "function forceTop(){try{window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body&&(document.body.scrollTop=0);}catch(e){}"
          + "function keepVisible(v){try{if(!v)return;var r=v.getBoundingClientRect();"
          + "if(r.height<40)return;"
          + "if(r.top<8||r.bottom>window.innerHeight-8||r.left<0||r.right>window.innerWidth){"
          + "forceTop();"
          + "try{v.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});}catch(e){try{v.scrollIntoView(true);}catch(x){}}"
          + "}}catch(e){}"
          + "function looksFs(el){"
          + "var t=((el.getAttribute('aria-label')||'')+' '+(el.getAttribute('title')||'')+' '+(el.getAttribute('data-tooltip')||'')+' '+(el.className||'')+' '+(el.id||'')+' '+(el.innerText||'')).toLowerCase();"
          + "if(/full\\s*screen|fullscreen|exit\\s*full|maximize|expand/.test(t))return true;"
          + "if(/\\b(fs|fullscreen|full-screen|vjs-fullscreen|plyr__control--fullscreen|jw-icon-fullscreen|ytp-fullscreen)\\b/.test(t))return true;"
          + "return false;}"
          + "function clickFs(){"
          + "forceTop();"
          + "var nodes=document.querySelectorAll('button,[role=button],a,div,span,i,svg');"
          + "for(var i=0;i<nodes.length;i++){var el=nodes[i];"
          + "if(!looksFs(el))continue;"
          + "var r=el.getBoundingClientRect();if(r.width<8||r.height<8)continue;"
          + "try{el.click();return true;}catch(e){}"
          + "try{el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));return true;}catch(e){}}"
          + "return false;}"
          + "function tryNative(v){try{"
          + "if(v.webkitEnterFullscreen){v.webkitEnterFullscreen();return true;}"
          + "if(v.webkitEnterFullScreen){v.webkitEnterFullScreen();return true;}"
          + "if(v.requestFullscreen){v.requestFullscreen();return true;}"
          + "if(v.webkitRequestFullscreen){v.webkitRequestFullscreen();return true;}"
          + "}catch(e){}return false;}"
          + "function goFs(v){"
          + "if(document.fullscreenElement||document.webkitFullscreenElement)return;"
          + "forceTop();keepVisible(v);"
          + "if(clickFs())return;"
          + "tryNative(v);"
          + "setTimeout(function(){if(!(document.fullscreenElement||document.webkitFullscreenElement)){forceTop();clickFs();}},400);"
          + "setTimeout(function(){if(!(document.fullscreenElement||document.webkitFullscreenElement)){forceTop();clickFs();}},1200);}"
          + "function onPlay(e){var v=e.target;if(!v||v.tagName!=='VIDEO')return;"
          + "try{v.style.opacity='1';v.style.visibility='visible';}catch(x){}"
          + "forceTop();keepVisible(v);"
          + "if(v.__birchFsTries&&v.__birchFsTries>4)return;"
          + "v.__birchFsTries=(v.__birchFsTries||0)+1;"
          + "setTimeout(function(){goFs(v);},300);}"
          + "document.addEventListener('play',onPlay,true);"
          + "document.addEventListener('playing',onPlay,true);"
          + "setInterval(function(){"
          + "var v=document.querySelector('video');"
          + "if(!v||v.paused||v.ended)return;"
          + "keepVisible(v);"
          + "if(document.fullscreenElement||document.webkitFullscreenElement)return;"
          + "if(v.currentTime>0.5&&v.currentTime<12&&(!v.__birchFsTries||v.__birchFsTries<4)){"
          + "v.__birchFsTries=(v.__birchFsTries||0)+1;goFs(v);}"
          + "},1500);"
          + "}catch(e){}})();";

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
          + "try{Object.defineProperty(navigator,'webdriver',{get:function(){return undefined}});}catch(e){}"
          + "try{window.chrome=window.chrome||{runtime:{}};}catch(e){}"
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
    v.evaluateJavascript(SPOOF, null);
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
        String host = u.getHost() == null ? "" : u.getHost().toLowerCase();
        String path = (u.getPath() == null ? "" : u.getPath()) + "?" + (u.getQuery() == null ? "" : u.getQuery());
        if (host.contains("hcaptcha") || host.contains("recaptcha")
            || (host.contains("google.com") && path.contains("recaptcha"))
            || host.contains("challenges.cloudflare") || host.contains("turnstile")
            || host.contains("captcha") || host.contains("funcaptcha") || host.contains("arkoselabs")
            || host.contains("datadome") || host.contains("perimeterx") || host.contains("px-cdn")
            || host.contains("fingerprint") || path.contains("cf-chl") || path.contains("/cdn-cgi/challenge")) {
          return new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));
        }
        if (MainActivity.HOST.equals(u.getHost())) return Assets.open(WebAppActivity.this, u.getPath());
        if (r.isForMainFrame() && isMoviesHost(u.getHost()) && ("http".equals(u.getScheme()) || "https".equals(u.getScheme()))) {
          WebResourceResponse injected = injectHtml(u.toString());
          if (injected != null) return injected;
        }
        return null;
      }
      @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
        if (r.isForMainFrame()) v.loadData("<body style='background:#000;color:#fff;display:flex;align-items:center;justify-content:center;height:90vh;text-align:center'>This site could not be reached.</body>", "text/html", "utf-8");
      }
    });
    web.setWebChromeClient(new WebChromeClient() {
      @Override public Bitmap getDefaultVideoPoster() { return Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888); }
      @Override public void onShowCustomView(View v, CustomViewCallback cb) {
        if (fullView != null) { cb.onCustomViewHidden(); return; }
        try { web.scrollTo(0, 0); } catch (Throwable ignored) {}
        savedY = 0;
        fullView = v; fullCb = cb;
        v.setBackgroundColor(0xFF000000);
        fsLayer.addView(v, new FrameLayout.LayoutParams(-1, -1, Gravity.CENTER));
        fsLayer.setVisibility(View.VISIBLE); fsLayer.bringToFront();
        cursor.setVisibility(View.GONE);
        hideBars(getWindow().getDecorView()); hideBars(root); hideBars(v);
        v.requestFocus();
      }
      @Override public boolean onCreateWindow(WebView v, boolean d, boolean g, android.os.Message m) { return false; }
      @Override public void onHideCustomView() {
        if (fullView != null) fsLayer.removeView(fullView);
        fsLayer.setVisibility(View.GONE); fullView = null; fullCb = null;
        web.requestFocus();
        try { web.scrollTo(0, 0); } catch (Throwable ignored) {}
        hideBars(root);
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
    down.setSource(8194);
    web.dispatchTouchEvent(down); down.recycle();
    MotionEvent up = MotionEvent.obtain(now, now + 50, MotionEvent.ACTION_UP, cx, cy, 0);
    up.setSource(8194);
    web.dispatchTouchEvent(up); up.recycle();
  }

  Choreographer.FrameCallback frame = new Choreographer.FrameCallback() {
    @Override public void doFrame(long frameTimeNanos) {
      if (!looping) return;
      long now = SystemClock.uptimeMillis();
      float dt = lastFrame == 0 ? 16f : Math.min(40f, now - lastFrame);
      lastFrame = now;
      float ax = 0, ay = 0;
      if (hl) ax -= 1; if (hr) ax += 1; if (hu) ay -= 1; if (hd) ay += 1;
      vx = vx * 0.85f + ax * 18f; vy = vy * 0.85f + ay * 18f;
      float w = Math.max(1, root.getWidth());
      float h = Math.max(1, root.getHeight());
      cx += vx * dt; cy += vy * dt;
      if (cy < 50f && vy < 0f) web.scrollBy(0, (int) (vy * dt * 2f));
      if (cy > h - 50f && vy > 0f) web.scrollBy(0, (int) (vy * dt * 2f));
      cx = Math.max(0f, Math.min(w - 1f, cx));
      cy = Math.max(0f, Math.min(h - 1f, cy));
      placeCursor();
      long t = SystemClock.uptimeMillis();
      MotionEvent hover = MotionEvent.obtain(t, t, MotionEvent.ACTION_HOVER_MOVE, cx, cy, 0);
      hover.setSource(8194);
      web.dispatchGenericMotionEvent(hover);
      hover.recycle();
      if (ax != 0 || ay != 0 || Math.abs(vx) > 5f || Math.abs(vy) > 5f) Choreographer.getInstance().postFrameCallback(this);
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
