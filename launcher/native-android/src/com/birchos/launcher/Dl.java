package com.birchos.launcher;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import android.webkit.CookieManager;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Enumeration;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

/** Downloads an apk/xapk/apks and hands it to PackageInstaller. Retries with fewer headers when CDNs reject the first request. */
public final class Dl {
  static String err;
  static String hdr;
  static String ref;

  static void copy(InputStream in, OutputStream out) throws IOException {
    byte[] b = new byte[65536];
    int n;
    while ((n = in.read(b)) > 0) out.write(b, 0, n);
  }

  static void fetch(String url, String ua, File file, String referer) throws IOException {
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < 4; i++) {
      int code = try1(url, ua, file, i, referer);
      if (code == 200) return;
      sb.append(code).append(",");
    }
    sb.append(" host=").append(Uri.parse(url).getHost()).append(" server=").append(hdr);
    throw new IOException(sb.toString());
  }

  static void install(Context ctx, File file) throws Exception {
    ZipFile zip = new ZipFile(file);
    PackageInstaller pi = ctx.getPackageManager().getPackageInstaller();
    int id = pi.createSession(new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL));
    PackageInstaller.Session ses = pi.openSession(id);
    try {
      if (zip.getEntry("AndroidManifest.xml") != null) {
        FileInputStream in = new FileInputStream(file);
        put(ses, "app.apk", in);
        in.close();
      } else {
        Enumeration<? extends ZipEntry> entries = zip.entries();
        int n = 0;
        while (entries.hasMoreElements()) {
          ZipEntry e = entries.nextElement();
          String name = e.getName();
          if (name.toLowerCase().endsWith(".apk")) {
            InputStream in = zip.getInputStream(e);
            put(ses, name.replace("/", "_"), in);
            in.close();
            n++;
          }
        }
        if (n == 0) throw new IOException("no apk inside package");
      }
    } finally {
      zip.close();
    }
    int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
    Intent i = new Intent(ctx, InstallReceiver.class);
    PendingIntent p = PendingIntent.getBroadcast(ctx, id, i, flags);
    ses.commit(p.getIntentSender());
    ses.close();
  }

  static void note(Throwable th) {
    String s = th.getClass().getSimpleName() + ": " + th.getMessage();
    err = s;
    Log.e("BirchDl", s);
  }

  static boolean pkgUrl(Uri uri) {
    String path = uri.getPath();
    if (path == null) return false;
    String lower = path.toLowerCase();
    return lower.endsWith(".apk") || lower.endsWith(".xapk") || lower.endsWith(".apks") || lower.endsWith(".apkm")
        || lower.startsWith("/b/apk/") || lower.startsWith("/b/xapk/");
  }

  static void put(PackageInstaller.Session ses, String name, InputStream in) throws IOException {
    OutputStream out = ses.openWrite(name, 0, -1);
    copy(in, out);
    ses.fsync(out);
    out.close();
  }

  static void run(Context ctx, String url, String ua) throws Exception {
    File file = new File(ctx.getCacheDir(), "dl.pkg");
    fetch(url, ua, file, ref);
    install(ctx, file);
    file.delete();
  }

  static int try1(String url, String ua, File file, int attempt, String referer) throws IOException {
    HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
    c.setInstanceFollowRedirects(true);
    c.setConnectTimeout(30000);
    c.setReadTimeout(30000);
    if (attempt < 3 && ua != null) c.setRequestProperty("User-Agent", ua);
    if (attempt == 0) {
      String cookie = CookieManager.getInstance().getCookie(url);
      if (cookie != null) c.setRequestProperty("Cookie", cookie);
    }
    if (attempt < 2 && referer != null) c.setRequestProperty("Referer", referer);
    c.setRequestProperty("Accept", "*/*");
    int code = c.getResponseCode();
    if (code != 200) {
      hdr = c.getHeaderField("Server");
      return code;
    }
    String ct = c.getContentType();
    if (ct != null && ct.toLowerCase().contains("text/html")) throw new IOException("link gave a web page, not an app file");
    InputStream in = c.getInputStream();
    FileOutputStream out = new FileOutputStream(file);
    copy(in, out);
    out.close();
    in.close();
    return code;
  }
}
