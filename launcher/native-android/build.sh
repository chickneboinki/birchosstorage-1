#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python3 apply-tv-sync.py
if [ -n "${VERSION_CODE:-}" ]; then
  sed -i "s/android:versionCode=\"[0-9]*\"/android:versionCode=\"$VERSION_CODE\"/" AndroidManifest.xml
  sed -i "s/android:versionName=\"[^\"]*\"/android:versionName=\"$VERSION_CODE\"/" AndroidManifest.xml
  sed -i "s/var ai=\`[0-9][0-9]*\`/var ai=\`$VERSION_CODE\`/" assets/www/assets/index-*.js || true
fi
BT=${BT:-/tmp/sdk/build-tools/34.0.0}
JAR=${PF:-/tmp/sdk/platforms/android-34}/android.jar
OUT=${OUT:-/tmp/birch-build}
rm -rf "$OUT" && mkdir -p "$OUT/classes" "$OUT/dex"
"$BT/aapt2" compile --dir res -o "$OUT/res.zip"
"$BT/aapt2" link -I "$JAR" --manifest AndroidManifest.xml -A assets -o "$OUT/base.apk" "$OUT/res.zip" --auto-add-overlay
WA=src/com/birchos/launcher/WebAppActivity.java
if ! grep -q "onShowCustomView" "$WA" 2>/dev/null; then
  echo "Fetching WebAppActivity.java from known-good commit e1619523..."
  curl -fsSL "https://raw.githubusercontent.com/chickneboinki/birchosstorage-1/e1619523/launcher/native-android/src/com/birchos/launcher/WebAppActivity.java" -o "$WA"
fi
python3 - "$WA" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
s = p.read_text()

# edge-scroll clamp
o = (
    "      if (cy < 50f && vy < 0f) web.scrollBy(0, (int) (vy * dt * 2f));\n"
    "      if (cy > h - 50f && vy > 0f) web.scrollBy(0, (int) (vy * dt * 2f));"
)
n = (
    "      if ((cy < 50f && vy < 0f) || (cy > h - 50f && vy > 0f)) {\n"
    "        int amount = (int) (vy * dt * 2f);\n"
    "        if (amount != 0) {\n"
    "          web.evaluateJavascript(\n"
    "              \"(function(){try{var se=document.scrollingElement||document.documentElement||document.body;if(!se)return;\"\n"
    "                  + \"var max=Math.max(0,(se.scrollHeight||0)-(window.innerHeight||0));\"\n"
    "                  + \"var cur=(se.scrollTop||window.pageYOffset||0);\"\n"
    "                  + \"var t=Math.max(0,Math.min(max,cur+(\" + amount + \")));\"\n"
    "                  + \"if(t!==cur){se.scrollTop=t;window.scrollTo(0,t);}\"\n"
    "                  + \"}catch(e){}})();\",\n"
    "              null);\n"
    "          int y = web.getScrollY();\n"
    "          if (amount < 0) { if (y > 0) web.scrollBy(0, Math.max(amount, -y)); }\n"
    "          else { web.scrollBy(0, amount); }\n"
    "          if (web.getScrollY() < 0) web.scrollTo(0, 0);\n"
    "        }\n"
    "      }"
)
if o in s:
    s = s.replace(o, n)
    print("edge clamp ok")

if "setOverScrollMode" not in s and "web.setBackgroundColor" in s:
    s = s.replace(
        "web.setBackgroundColor(0xFF000000);",
        "web.setBackgroundColor(0xFF000000);\n    web.setOverScrollMode(View.OVER_SCROLL_NEVER);",
    )

for m in ("__birchVid5","__birchVid6","__birchVid7","__birchVid8"):
    s = s.replace("window."+m, "window.__birchVid9")

# Stronger FS CSS + pin helpers (SurfaceView follows video layout box on AWV)
old_css = (
    "st.textContent='html:fullscreen,html:-webkit-full-screen,body:fullscreen,body:-webkit-full-screen{background:#000!important;overflow:hidden!important}"\n"
    "          + "*:fullscreen,*:fullscreen *,*:-webkit-full-screen,*:-webkit-full-screen *{max-width:none!important;max-height:none!important}"\n"
    "          + "video:fullscreen,video:-webkit-full-screen,:fullscreen video,:-webkit-full-screen video{"\n"
    "          + "position:fixed!important;inset:0!important;top:0!important;left:0!important;right:0!important;bottom:0!important;"\n"
    "          + "width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;"\n"
    "          + "object-fit:contain!important;background:#000!important;z-index:2147483647!important;transform:none!important}"\n"
    "          + "video{object-fit:contain!important}';"
)
new_css = (
    "st.textContent='html,body{background:#000!important}"\n"
    "          + "html:fullscreen,html:-webkit-full-screen,body:fullscreen,body:-webkit-full-screen{background:#000!important;overflow:hidden!important;margin:0!important;padding:0!important}"\n"
    "          + "*:fullscreen,*:fullscreen *,*:-webkit-full-screen,*:-webkit-full-screen *{max-width:none!important;max-height:none!important}"\n"
    "          + "video.birch-pin,video:fullscreen,video:-webkit-full-screen,:fullscreen video,:-webkit-full-screen video{"\n"
    "          + "position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:0!important;inset:0!important;"\n"
    "          + "width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;"\n"
    "          + "margin:0!important;padding:0!important;object-fit:contain!important;object-position:center center!important;"\n"
    "          + "background:#000!important;z-index:2147483647!important}"\n"
    "          + "video{object-fit:contain!important;object-position:center center!important}';"
)
if old_css in s:
    s = s.replace(old_css, new_css)
    print("fs css ok")
else:
    print("fs css pattern missing")

# After forceTop, add pinVideo/unpinVideo
old_ft = (
    '+ "function forceTop(){try{window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body&&(document.body.scrollTop=0);"\n'
    '          + "if(document.scrollingElement)document.scrollingElement.scrollTop=0;}catch(e){}"'
)
new_ft = (
    '+ "function forceTop(){try{window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body&&(document.body.scrollTop=0);"\n'
    '          + "if(document.scrollingElement)document.scrollingElement.scrollTop=0;}catch(e){}"\n'
    '          + "function saveScroll(){try{window.__birchSavedY=window.pageYOffset||document.documentElement.scrollTop||0;}catch(e){window.__birchSavedY=0;}}"\n'
    '          + "function restoreScroll(){try{var y=window.__birchSavedY||0;if(y>0){window.scrollTo(0,y);"\n'
    '          + "if(document.scrollingElement)document.scrollingElement.scrollTop=y;}}catch(e){}}"\n'
    '          + "function pinVideo(v){try{forceTop();injectFsCss();"\n'
    '          + "var list=v?[v]:[].slice.call(document.querySelectorAll(\'video\'));"\n'
    '          + "list.forEach(function(vid){if(!vid)return;vid.classList.add(\'birch-pin\');"\n'
    '          + "vid.style.setProperty(\'position\',\'fixed\',\'important\');"\n'
    '          + "vid.style.setProperty(\'top\',\'0px\',\'important\');"\n'
    '          + "vid.style.setProperty(\'left\',\'0px\',\'important\');"\n'
    '          + "vid.style.setProperty(\'right\',\'0px\',\'important\');"\n'
    '          + "vid.style.setProperty(\'bottom\',\'0px\',\'important\');"\n'
    '          + "vid.style.setProperty(\'width\',\'100vw\',\'important\');"\n'
    '          + "vid.style.setProperty(\'height\',\'100vh\',\'important\');"\n'
    '          + "vid.style.setProperty(\'max-width\',\'none\',\'important\');"\n'
    '          + "vid.style.setProperty(\'max-height\',\'none\',\'important\');"\n'
    '          + "vid.style.setProperty(\'margin\',\'0\',\'important\');"\n'
    '          + "vid.style.setProperty(\'object-fit\',\'contain\',\'important\');"\n'
    '          + "vid.style.setProperty(\'object-position\',\'center center\',\'important\');"\n'
    '          + "vid.style.setProperty(\'z-index\',\'2147483647\',\'important\');"\n'
    '          + "vid.style.setProperty(\'background\',\'#000\',\'important\');});"\n'
    '          + "forceTop();}catch(e){}}"\n'
    '          + "function unpinVideo(){try{document.querySelectorAll(\'video.birch-pin\').forEach(function(vid){"\n'
    '          + "vid.classList.remove(\'birch-pin\');"\n'
    '          + "[\'position\',\'top\',\'left\',\'right\',\'bottom\',\'width\',\'height\',\'max-width\',\'max-height\',\'margin\',\'z-index\',\'background\'].forEach(function(p){"\n'
    '          + "try{vid.style.removeProperty(p);}catch(e){}});});restoreScroll();}catch(e){}}"'
)
if old_ft in s:
    s = s.replace(old_ft, new_ft)
    print("pin helpers ok")
else:
    print("forceTop block missing")

# Wire pin into FS paths
s = s.replace(
    'function clickFs(){forceTop();injectFsCss();"',
    'function clickFs(){saveScroll();pinVideo();injectFsCss();"',
)
s = s.replace(
    'if(document.fullscreenElement||document.webkitFullscreenElement){forceTop();return;}"\n          + "forceTop();keepVisible(v);injectFsCss();"',
    'if(document.fullscreenElement||document.webkitFullscreenElement){pinVideo(v);return;}"\n          + "saveScroll();pinVideo(v);keepVisible(v);injectFsCss();"',
)
s = s.replace(
    'if(clickFs()){setTimeout(forceTop,50);setTimeout(forceTop,300);return;}"\n          + "tryNative(v);setTimeout(forceTop,50);setTimeout(forceTop,300);"',
    'if(clickFs()){setTimeout(function(){pinVideo(v);},50);setTimeout(function(){pinVideo(v);},300);return;}"\n          + "tryNative(v);setTimeout(function(){pinVideo(v);},50);setTimeout(function(){pinVideo(v);},300);"',
)
s = s.replace(
    'setTimeout(function(){if(!(document.fullscreenElement||document.webkitFullscreenElement)){forceTop();clickFs();}},400);"',
    'setTimeout(function(){if(!(document.fullscreenElement||document.webkitFullscreenElement)){clickFs();pinVideo(v);}},400);"',
)
s = s.replace(
    'setTimeout(function(){if(!(document.fullscreenElement||document.webkitFullscreenElement)){forceTop();clickFs();}},1200);}"',
    'setTimeout(function(){if(!(document.fullscreenElement||document.webkitFullscreenElement)){clickFs();pinVideo(v);}},1200);}"',
)
s = s.replace(
    "document.addEventListener('fullscreenchange',function(){forceTop();injectFsCss();},true);\"",
    "document.addEventListener('fullscreenchange',function(){injectFsCss();if(document.fullscreenElement)pinVideo();else unpinVideo();},true);\"",
)
s = s.replace(
    "document.addEventListener('webkitfullscreenchange',function(){forceTop();injectFsCss();},true);\"",
    "document.addEventListener('webkitfullscreenchange',function(){injectFsCss();if(document.webkitFullscreenElement)pinVideo();else unpinVideo();},true);\"",
)

# Native custom view: pin scroll 0, restore on hide, no translation
old_show = '''      @Override public void onShowCustomView(View v, CustomViewCallback cb) {
        if (fullView != null) { cb.onCustomViewHidden(); return; }
        try { web.scrollTo(0, 0); } catch (Throwable ignored) {}
        try { web.evaluateJavascript("try{window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body&&(document.body.scrollTop=0);}catch(e){}", null); } catch (Throwable ignored) {}
        savedY = 0;
        fullView = v; fullCb = cb;
        v.setBackgroundColor(0xFF000000);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT);
        try { v.setLayoutParams(lp); } catch (Throwable ignored) {}
        fsLayer.removeAllViews();
        fsLayer.addView(v, lp);
        fsLayer.setVisibility(View.VISIBLE);
        fsLayer.bringToFront();
        web.setVisibility(View.INVISIBLE);
        cursor.setVisibility(View.GONE);
        hideBars(getWindow().getDecorView());
        hideBars(root);
        hideBars(fsLayer);
        hideBars(v);
        v.requestFocus();
        web.post(() -> {
          try { web.scrollTo(0, 0); } catch (Throwable ignored) {}
          try { web.evaluateJavascript("try{window.scrollTo(0,0);}catch(e){}", null); } catch (Throwable ignored) {}
        });
        web.postDelayed(() -> {
          try { web.scrollTo(0, 0); } catch (Throwable ignored) {}
          try { if (fullView != null) { fullView.requestLayout(); fsLayer.requestLayout(); } } catch (Throwable ignored) {}
        }, 100);
      }'''

new_show = '''      @Override public void onShowCustomView(View v, CustomViewCallback cb) {
        if (fullView != null) { cb.onCustomViewHidden(); return; }
        savedY = 0;
        try { savedY = web.getScrollY(); } catch (Throwable ignored) {}
        try { web.scrollTo(0, 0); } catch (Throwable ignored) {}
        try {
          web.evaluateJavascript(
              "(function(){try{window.__birchSavedY=window.pageYOffset||document.documentElement.scrollTop||0;"
                  + "window.scrollTo(0,0);if(window.pinVideo)pinVideo();"
                  + "document.documentElement.scrollTop=0;if(document.body)document.body.scrollTop=0;"
                  + "if(document.scrollingElement)document.scrollingElement.scrollTop=0;}catch(e){}})();",
              null);
        } catch (Throwable ignored) {}
        fullView = v; fullCb = cb;
        try { v.setTranslationY(0); } catch (Throwable ignored) {}
        v.setBackgroundColor(0xFF000000);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT);
        try { v.setLayoutParams(lp); } catch (Throwable ignored) {}
        fsLayer.removeAllViews();
        fsLayer.addView(v, lp);
        fsLayer.setVisibility(View.VISIBLE);
        fsLayer.bringToFront();
        web.setVisibility(View.INVISIBLE);
        cursor.setVisibility(View.GONE);
        hideBars(getWindow().getDecorView());
        hideBars(root);
        hideBars(fsLayer);
        hideBars(v);
        v.requestFocus();
        web.post(() -> { try { web.scrollTo(0, 0); } catch (Throwable ignored) {} });
        web.postDelayed(() -> {
          try {
            if (fullView != null) {
              fullView.setTranslationY(0);
              fullView.requestLayout();
              fsLayer.requestLayout();
            }
          } catch (Throwable ignored) {}
        }, 100);
      }'''

if old_show in s:
    s = s.replace(old_show, new_show)
    print("onShow ok")
else:
    print("onShow missing")

old_hide = '''      @Override public void onHideCustomView() {
        if (fullView != null) {
          try { fsLayer.removeView(fullView); } catch (Throwable ignored) {}
        }
        fsLayer.removeAllViews();
        fsLayer.setVisibility(View.GONE);
        fullView = null; fullCb = null;
        web.setVisibility(View.VISIBLE);
        web.requestFocus();
        try { web.scrollTo(0, 0); } catch (Throwable ignored) {}
        hideBars(root);
        if (cursorMode) cursor.setVisibility(View.VISIBLE);
      }'''

new_hide = '''      @Override public void onHideCustomView() {
        if (fullView != null) {
          try { fullView.setTranslationY(0); } catch (Throwable ignored) {}
          try { fsLayer.removeView(fullView); } catch (Throwable ignored) {}
        }
        fsLayer.removeAllViews();
        fsLayer.setVisibility(View.GONE);
        fullView = null; fullCb = null;
        web.setVisibility(View.VISIBLE);
        web.requestFocus();
        final int y = savedY;
        try { if (y > 0) web.scrollTo(0, y); } catch (Throwable ignored) {}
        try {
          web.evaluateJavascript(
              "(function(){try{if(window.unpinVideo)unpinVideo();var y=window.__birchSavedY||0;"
                  + "if(y>0){window.scrollTo(0,y);if(document.scrollingElement)document.scrollingElement.scrollTop=y;}}catch(e){}})();",
              null);
        } catch (Throwable ignored) {}
        hideBars(root);
        if (cursorMode) cursor.setVisibility(View.VISIBLE);
      }'''

if old_hide in s:
    s = s.replace(old_hide, new_hide)
    print("onHide ok")
else:
    print("onHide missing")

p.write_text(s)
print("done", len(s))
PY
javac -encoding UTF-8 -source 8 -target 8 -nowarn -cp "$JAR" -d "$OUT/classes" $(find src -name '*.java')
"$BT/d8" --lib "$JAR" --min-api 22 --output "$OUT/dex" $(find "$OUT/classes" -name '*.class')
cp "$OUT/base.apk" "$OUT/unaligned.apk"
python3 - "$OUT/unaligned.apk" "$OUT/dex/classes.dex" << 'PY'
import sys, zipfile
apk, dex = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(apk, "a", compression=zipfile.ZIP_DEFLATED) as z:
    z.write(dex, "classes.dex")
PY
"$BT/zipalign" -f -p 4 "$OUT/unaligned.apk" "$OUT/aligned.apk"
KS=${KS:-$(pwd)/keystore/birch-release.jks}
KS_PASS=${BIRCH_KEYSTORE_PASSWORD:-${KS_PASS:-birchos}}
KEY_ALIAS=${BIRCH_KEY_ALIAS:-${KEY_ALIAS:-birch}}
KEY_PASS=${BIRCH_KEY_PASSWORD:-${KEY_PASS:-$KS_PASS}}
"$BT/apksigner" sign --ks "$KS" --ks-pass "pass:$KS_PASS" --key-pass "pass:$KEY_PASS" --ks-key-alias "$KEY_ALIAS" --out "$OUT/birchos-launcher.apk" "$OUT/aligned.apk"
"$BT/apksigner" verify "$OUT/birchos-launcher.apk"
echo "Built $OUT/birchos-launcher.apk"
