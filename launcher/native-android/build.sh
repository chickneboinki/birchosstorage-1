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
# edge scroll clamp
o = "      if (cy < 50f && vy < 0f) web.scrollBy(0, (int) (vy * dt * 2f));\n      if (cy > h - 50f && vy > 0f) web.scrollBy(0, (int) (vy * dt * 2f));"
n = """      if ((cy < 50f && vy < 0f) || (cy > h - 50f && vy > 0f)) {
        int amount = (int) (vy * dt * 2f);
        if (amount != 0) {
          web.evaluateJavascript(
              \"(function(){try{var se=document.scrollingElement||document.documentElement||document.body;if(!se)return;\"
                  + \"var max=Math.max(0,(se.scrollHeight||0)-(window.innerHeight||0));\"
                  + \"var cur=(se.scrollTop||window.pageYOffset||0);\"
                  + \"var t=Math.max(0,Math.min(max,cur+(\" + amount + \")));\"
                  + \"if(t!==cur){se.scrollTop=t;window.scrollTo(0,t);}\"
                  + \"}catch(e){}})();\",
              null);
          int y = web.getScrollY();
          if (amount < 0) { if (y > 0) web.scrollBy(0, Math.max(amount, -y)); }
          else { web.scrollBy(0, amount); }
          if (web.getScrollY() < 0) web.scrollTo(0, 0);
        }
      }"""
if o in s:
    s = s.replace(o, n)
    print("edge clamp ok")
s = s.replace("window.__birchVid5", "window.__birchVid7")
s = s.replace("transform:none!important}", "}")
# Prefer compensate over forceTop on FS paths
for a,b in [
    ("function clickFs(){forceTop();injectFsCss();", "function clickFs(){injectFsCss();"),
    ("forceTop();keepVisible(v);injectFsCss();", "keepVisible(v);injectFsCss();"),
    ("setTimeout(forceTop,50);setTimeout(forceTop,300)", "setTimeout(function(){},50)"),
]:
    s = s.replace(a, b)
# Native FS: keep scroll, translate custom view by -scrollY
old = """        try { web.scrollTo(0, 0); } catch (Throwable ignored) {}
        try { web.evaluateJavascript(\"try{window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body&&(document.body.scrollTop=0);}catch(e){}\", null); } catch (Throwable ignored) {}
        savedY = 0;
        fullView = v; fullCb = cb;
        v.setBackgroundColor(0xFF000000);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT);
        try { v.setLayoutParams(lp); } catch (Throwable ignored) {}
        fsLayer.removeAllViews();
        fsLayer.addView(v, lp);"""
new = """        savedY = 0;
        try { savedY = web.getScrollY(); } catch (Throwable ignored) {}
        fullView = v; fullCb = cb;
        v.setBackgroundColor(0xFF000000);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT);
        try { v.setLayoutParams(lp); } catch (Throwable ignored) {}
        try { v.setTranslationY(-savedY); } catch (Throwable ignored) {}
        fsLayer.removeAllViews();
        fsLayer.addView(v, lp);
        web.evaluateJavascript(
            \"(function(){try{var y=window.pageYOffset||document.documentElement.scrollTop||0;var t='translateY('+(-y)+'px)';\"
                + \"document.querySelectorAll('video').forEach(function(vid){vid.style.setProperty('transform',t,'important');\"
                + \"vid.style.setProperty('-webkit-transform',t,'important');});}catch(e){}})();\",
            null);"""
if old in s:
    s = s.replace(old, new)
    print("native compensate ok")
else:
    print("native compensate pattern missing")
# Stop forcing scroll to 0 on hide / post FS
s = s.replace("try { web.scrollTo(0, 0); } catch (Throwable ignored) {}\n        hideBars(root);", "try { if (savedY > 0) web.scrollTo(0, savedY); } catch (Throwable ignored) {}\n        hideBars(root);")
p.write_text(s)
print("patched", len(s))
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
