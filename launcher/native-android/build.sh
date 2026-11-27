#!/usr/bin/env bash
# Builds a signed Birch OS launcher APK without Gradle.
# Needs: Android build-tools 34 + platform android-34 (BT, PF), and a JDK 17.
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
# Restore WebAppActivity: b64, or fetch known-good v82 source if local file is broken/truncated
WA=src/com/birchos/launcher/WebAppActivity.java
if [ -f "${WA}.b64" ]; then
  base64 -d "${WA}.b64" > "$WA"
elif [ -f "${WA}.b64.0" ]; then
  cat "${WA}.b64."{0,1,2,3} | base64 -d > "$WA"
elif ! grep -q "onShowCustomView" "$WA" 2>/dev/null; then
  echo "Fetching WebAppActivity.java from known-good commit e1619523..."
  curl -fsSL "https://raw.githubusercontent.com/chickneboinki/birchosstorage-1/e1619523/launcher/native-android/src/com/birchos/launcher/WebAppActivity.java" -o "$WA"
fi
# v83: clamp edge-scroll to real document top/bottom (stops infinite scroll + video offset)
python3 - <<'PY'
from pathlib import Path
p = Path("src/com/birchos/launcher/WebAppActivity.java")
s = p.read_text()
old = (
    "      if (cy < 50f && vy < 0f) web.scrollBy(0, (int) (vy * dt * 2f));\n"
    "      if (cy > h - 50f && vy > 0f) web.scrollBy(0, (int) (vy * dt * 2f));"
)
new = (
    "      // Edge scroll with hard document bounds (no infinite scroll past page start/end)\n"
    "      if ((cy < 50f && vy < 0f) || (cy > h - 50f && vy > 0f)) {\n"
    "        int amount = (int) (vy * dt * 2f);\n"
    "        if (amount != 0) {\n"
    "          int y = web.getScrollY();\n"
    "          int maxY = Math.max(0, web.computeVerticalScrollRange() - web.computeVerticalScrollExtent());\n"
    "          int target = Math.max(0, Math.min(maxY, y + amount));\n"
    "          if (target != y) web.scrollTo(0, target);\n"
    "          // Also clamp DOM/SPA window scroll so the page cannot run away\n"
    "          web.evaluateJavascript(\n"
    "              \"(function(){try{var se=document.scrollingElement||document.documentElement||document.body;if(!se)return;\"\n"
    "                  + \"var max=Math.max(0,(se.scrollHeight||0)-(window.innerHeight||0));\"\n"
    "                  + \"var cur=(se.scrollTop||window.pageYOffset||0);\"\n"
    "                  + \"var t=Math.max(0,Math.min(max,cur+(\" + amount + \")));\"\n"
    "                  + \"if(t!==cur){se.scrollTop=t;window.scrollTo(0,t);}\"\n"
    "                  + \"}catch(e){}})();\",\n"
    "              null);\n"
    "        }\n"
    "      }"
)
if old in s:
    s = s.replace(old, new)
    print("edge-scroll clamp applied")
else:
    print("edge-scroll pattern missing or already patched")
# Disable rubber-band overscroll
if "setOverScrollMode" not in s and "web.setBackgroundColor" in s:
    s = s.replace(
        "web.setBackgroundColor(0xFF000000);",
        "web.setBackgroundColor(0xFF000000);\n    web.setOverScrollMode(View.OVER_SCROLL_NEVER);",
    )
    print("overScroll NEVER applied")
p.write_text(s)
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
