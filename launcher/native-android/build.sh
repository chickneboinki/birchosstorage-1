#!/usr/bin/env bash
# Builds a signed Birch OS launcher APK without Gradle.
# Needs: Android build-tools 34 + platform android-34 (BT, PF), and a JDK 17.
set -euo pipefail
cd "$(dirname "$0")"
BT=${BT:-/tmp/sdk/build-tools/34.0.0}
JAR=${PF:-/tmp/sdk/platforms/android-34}/android.jar
OUT=${OUT:-/tmp/birch-build}
rm -rf "$OUT" && mkdir -p "$OUT/classes" "$OUT/dex"
"$BT/aapt2" compile --dir res -o "$OUT/res.zip"
"$BT/aapt2" link -I "$JAR" --manifest AndroidManifest.xml -A assets -o "$OUT/base.apk" "$OUT/res.zip" --auto-add-overlay
javac -source 8 -target 8 -nowarn -cp "$JAR" -d "$OUT/classes" $(find src -name '*.java')
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
"$BT/apksigner" sign --ks "$KS" --ks-pass pass:birchos --key-pass pass:birchos --ks-key-alias birch --out "$OUT/birchos-launcher.apk" "$OUT/aligned.apk"
"$BT/apksigner" verify "$OUT/birchos-launcher.apk"
echo "Built $OUT/birchos-launcher.apk"
