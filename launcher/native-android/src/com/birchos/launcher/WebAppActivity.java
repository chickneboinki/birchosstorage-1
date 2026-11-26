package com.birchos.launcher;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
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
import java.io.File;

/** Full-screen WebView for built-in and remote apps (Movies, etc.). */
public class WebAppActivity extends Activity {
  static final String CHALLENGE =
      "(function(){try{if(window.__birchChal)return;window.__birchChal=1;"
          + "function kill(){document.querySelectorAll('div,section,aside,dialog').forEach(function(el){"
          + "var tx=(el.innerText||'').toLowerCase();"
          + "if(/qr|scan|captcha|cloudflare|just a moment|verify you|are you human/.test(tx)"
          + "&&el.getBoundingClientRect().height>80){el.style.display='none';try{el.remove()}catch(e){}}});}"
          + "kill();setInterval(kill,900);}catch(e){}})();";
  static final String NO_POPUPS =
      "(function(){try{window.open=function(){return null};"
          + "document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[target=_blank]');"
          + "if(a)a.removeAttribute('target');},true);}catch(e){}})();";

  WebView web;
  View fullView, cursor, chooser;
  FrameLayout root, fsLayer;
  boolean cursorMode;
  float cx = 400, cy = 300;
  String homeBase = "";
  WebChromeClient.CustomViewCallback fullCb;
  int savedY;

  void hideBars(View v) {
    v.setSystemUiVisibility(
        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
  }

  static String base(String host) {
    if (host == null) return "";
    String[] p = host.split("\\.");
    return p.length <= 2 ? host : p[p.length - 2] + "." + p[p.length - 1];
  }

  @Override
  protected void onCreate(Bundle b) {
    super.onCreate(b);
    getWindow()
        .addFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
                | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    root = new FrameLayout(this);
    root.setBackgroundColor(0xFF000000);
    web = new WebView(this);
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
    s.setJavaScriptCanOpenWindowsAutomatically(false);
    s.setCacheMode(WebSettings.LOAD_DEFAULT);
    s.setUserAgentString(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");
    CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);
    web.setBackgroundColor(0xFF000000);
    web.addJavascriptInterface(new WatchBridge(), "BirchWatch");
    web.setWebViewClient(
        new WebViewClient() {
          @Override
          public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
            Uri u = r.getUrl();
            String sc = u.getScheme();
            if (!("http".equals(sc) || "https".equals(sc))) return true;
            if (Dl.pkgUrl(u)) {
              installApk(u.toString(), web.getSettings().getUserAgentString());
              return true;
            }
            if (MainActivity.HOST.equals(u.getHost())) return false;
            if (r.isForMainFrame() && !homeBase.isEmpty() && !homeBase.equals(base(u.getHost()))) {
              if ("birchos.local".equals(homeBase) || homeBase.isEmpty()) {
                homeBase = base(u.getHost());
                return false;
              }
              String lower = u.toString().toLowerCase();
              return !(lower.contains("apk") || lower.contains("download"));
            }
            return false;
          }

          @Override
          public void onPageStarted(WebView v, String url, Bitmap f) {
            v.evaluateJavascript(NO_POPUPS, null);
            v.evaluateJavascript(CHALLENGE, null);
            if (Pic.js != null) v.evaluateJavascript(Pic.js, null);
          }

          @Override
          public void onPageFinished(WebView v, String url) {
            v.evaluateJavascript(NO_POPUPS, null);
            v.evaluateJavascript(CHALLENGE, null);
            if (Pic.js != null) v.evaluateJavascript(Pic.js, null);
          }

          @Override
          public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
            Uri u = r.getUrl();
            if (MainActivity.HOST.equals(u.getHost())) return Assets.open(WebAppActivity.this, u.getPath());
            return null;
          }

          @Override
          public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
            if (r.isForMainFrame())
              v.loadData(
                  "<body style='background:#000;color:#fff;font:24px sans-serif;display:flex;align-items:center;justify-content:center;height:90vh;text-align:center'>This site could not be reached.<br>Check internet and try again.</body>",
                  "text/html",
                  "utf-8");
          }
        });
    web.setWebChromeClient(
        new WebChromeClient() {
          @Override
          public Bitmap getDefaultVideoPoster() {
            return Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
          }

          @Override
          public void onShowCustomView(View v, CustomViewCallback cb) {
            if (fullView != null) {
              cb.onCustomViewHidden();
              return;
            }
            fullView = v;
            fullCb = cb;
            v.setBackgroundColor(0xFF000000);
            fsLayer.addView(v, new FrameLayout.LayoutParams(-1, -1, Gravity.CENTER));
            fsLayer.setVisibility(View.VISIBLE);
            fsLayer.bringToFront();
            cursor.setVisibility(View.GONE);
            hideBars(getWindow().getDecorView());
            hideBars(root);
            hideBars(v);
            v.requestFocus();
            savedY = web.getScrollY();
          }

          @Override
          public boolean onCreateWindow(WebView v, boolean d, boolean g, android.os.Message m) {
            return false;
          }

          @Override
          public void onHideCustomView() {
            if (fullView != null) fsLayer.removeView(fullView);
            fsLayer.setVisibility(View.GONE);
            fullView = null;
            fullCb = null;
            web.requestFocus();
            web.scrollTo(0, savedY);
            hideBars(root);
            if (cursorMode) cursor.setVisibility(View.VISIBLE);
          }
        });
    root.addView(web);
    web.setDownloadListener(
        (url, ua, cd, mime, len) -> {
          String name = URLUtil.guessFileName(url, cd, mime).toLowerCase();
          if (name.endsWith(".apk")
              || "application/vnd.android.package-archive".equals(mime)) installApk(url, ua);
          else Toast.makeText(this, "Birch OS can only install .apk files", Toast.LENGTH_LONG).show();
        });
    cursor = new View(this);
    GradientDrawable g = new GradientDrawable();
    g.setShape(GradientDrawable.OVAL);
    g.setColor(0xEEFFFFFF);
    g.setStroke(4, 0xFF000000);
    cursor.setBackground(g);
    cursor.setVisibility(View.GONE);
    root.addView(cursor, new FrameLayout.LayoutParams(34, 34));
    fsLayer = new FrameLayout(this);
    fsLayer.setBackgroundColor(0xFF000000);
    fsLayer.setVisibility(View.GONE);
    root.addView(fsLayer, new FrameLayout.LayoutParams(-1, -1));
    setContentView(root);
    hideBars(root);
    String url = getIntent().getStringExtra("url");
    if (url != null) {
      try {
        homeBase = base(Uri.parse(url).getHost());
      } catch (Throwable t) {
        homeBase = "";
      }
    }
    web.loadUrl(url == null ? "about:blank" : url);
    showChooser();
  }

  @Override
  public void onWindowFocusChanged(boolean has) {
    super.onWindowFocusChanged(has);
    if (has) hideBars(getWindow().getDecorView());
  }

  void showChooser() {
    LinearLayout box = new LinearLayout(this);
    box.setOrientation(LinearLayout.VERTICAL);
    box.setGravity(Gravity.CENTER);
    box.setPadding(60, 50, 60, 50);
    GradientDrawable bg = new GradientDrawable();
    bg.setColor(0xF0181820);
    bg.setCornerRadius(36);
    box.setBackground(bg);
    TextView t = new TextView(this);
    t.setText("How do you want to control this app?");
    t.setTextColor(Color.WHITE);
    t.setTextSize(22);
    t.setPadding(0, 0, 0, 30);
    box.addView(t);
    LinearLayout row = new LinearLayout(this);
    row.setGravity(Gravity.CENTER);
    Button sel = btn("Select (arrows)"), cur = btn("Cursor (mouse)");
    sel.setOnClickListener(v -> pick(false));
    cur.setOnClickListener(v -> pick(true));
    row.addView(sel);
    row.addView(cur);
    box.addView(row);
    chooser = box;
    root.addView(
        box,
        new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.CENTER));
    cur.requestFocus();
  }

  Button btn(String label) {
    Button b = new Button(this);
    b.setText(label);
    b.setAllCaps(false);
    b.setTextSize(18);
    b.setTextColor(Color.WHITE);
    b.setPadding(40, 24, 40, 24);
    b.setFocusable(true);
    b.setOnFocusChangeListener(
        (v, f) -> {
          GradientDrawable d = new GradientDrawable();
          d.setCornerRadius(24);
          d.setColor(f ? 0xFFFFFFFF : 0x33FFFFFF);
          v.setBackground(d);
          ((Button) v).setTextColor(f ? 0xFF000000 : 0xFFFFFFFF);
        });
    GradientDrawable d = new GradientDrawable();
    d.setCornerRadius(24);
    d.setColor(0x33FFFFFF);
    b.setBackground(d);
    LinearLayout.LayoutParams lp =
        new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
    lp.setMargins(16, 0, 16, 0);
    b.setLayoutParams(lp);
    return b;
  }

  void pick(boolean c) {
    cursorMode = c;
    root.removeView(chooser);
    chooser = null;
    if (c) {
      cx = Math.max(100, root.getWidth() / 2f);
      cy = Math.max(100, root.getHeight() / 2f);
      cursor.setVisibility(View.VISIBLE);
      placeCursor();
    }
    web.requestFocus();
  }

  void placeCursor() {
    cursor.setTranslationX(cx - 17);
    cursor.setTranslationY(cy - 17);
  }

  @Override
  public boolean dispatchKeyEvent(KeyEvent e) {
    if (chooser != null) return super.dispatchKeyEvent(e);
    if (cursorMode && e.getAction() == KeyEvent.ACTION_DOWN) {
      int code = e.getKeyCode();
      float step = e.isAltPressed() || e.isShiftPressed() ? 12 : 36;
      if (code == KeyEvent.KEYCODE_DPAD_LEFT) {
        cx = Math.max(0, cx - step);
        placeCursor();
        return true;
      }
      if (code == KeyEvent.KEYCODE_DPAD_RIGHT) {
        cx = Math.min(root.getWidth(), cx + step);
        placeCursor();
        return true;
      }
      if (code == KeyEvent.KEYCODE_DPAD_UP) {
        cy = Math.max(0, cy - step);
        placeCursor();
        return true;
      }
      if (code == KeyEvent.KEYCODE_DPAD_DOWN) {
        cy = Math.min(root.getHeight(), cy + step);
        placeCursor();
        return true;
      }
      if (code == KeyEvent.KEYCODE_DPAD_CENTER || code == KeyEvent.KEYCODE_ENTER) {
        web.dispatchTouchEvent(
            MotionEvent.obtain(
                android.os.SystemClock.uptimeMillis(),
                android.os.SystemClock.uptimeMillis(),
                MotionEvent.ACTION_DOWN,
                cx,
                cy,
                0));
        web.dispatchTouchEvent(
            MotionEvent.obtain(
                android.os.SystemClock.uptimeMillis(),
                android.os.SystemClock.uptimeMillis(),
                MotionEvent.ACTION_UP,
                cx,
                cy,
                0));
        return true;
      }
    }
    if (e.getKeyCode() == KeyEvent.KEYCODE_BACK && e.getAction() == KeyEvent.ACTION_UP) {
      if (fullView != null && fullCb != null) {
        fullCb.onCustomViewHidden();
        return true;
      }
      if (web.canGoBack()) {
        web.goBack();
        return true;
      }
      finish();
      return true;
    }
    return super.dispatchKeyEvent(e);
  }

  void installApk(String url, String ua) {
    Toast.makeText(this, "Downloading…", Toast.LENGTH_SHORT).show();
    new Thread(
            () -> {
              try {
                File out = new File(getCacheDir(), "download.apk");
                Dl.fetch(url, ua, out, null);
                Dl.install(WebAppActivity.this, out);
              } catch (Throwable t) {
                runOnUiThread(
                    () -> Toast.makeText(this, "Download failed", Toast.LENGTH_LONG).show());
              }
            })
        .start();
  }

  class WatchBridge {
    @JavascriptInterface
    public void save(String json) {
      Watch.save(WebAppActivity.this, json);
    }
  }
}
