# Birch OS launcher

Android TV / Fire TV launcher (`com.birchos.launcher`). Version code is in `launcher/native-android/AndroidManifest.xml`.

GitHub Actions builds a signed APK and publishes it as a Release on this repo. The signing key is **not** in git.

## One-time: add the signing secret

The workflow only needs one secret, `BIRCH_KEYSTORE_BASE64` (the Birch keystore file, base64-encoded). Passwords are `birchos` and the alias is `birch`; they are used only on the builder, not stored in the repo.

If that secret is already set, you don't have to do anything. Pushing launcher changes builds the next APK.
