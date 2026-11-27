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
if [ -f patch_v86.py ]; then
  python3 patch_v86.py "$WA"
elif [ -f patch_v86.py.part1 ]; then
  cat patch_v86.py.part1 patch_v86.py.part2 > patch_v86.py
  python3 patch_v86.py "$WA"
fi
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
