package com.birchos.launcher;
import android.content.*;
import android.content.pm.PackageInstaller;
public class InstallReceiver extends BroadcastReceiver {
  @Override public void onReceive(Context ctx, Intent in) {
    int st = in.getIntExtra(PackageInstaller.EXTRA_STATUS, -999);
    if (st == PackageInstaller.STATUS_PENDING_USER_ACTION) {
      Intent c = (Intent) in.getParcelableExtra(Intent.EXTRA_INTENT);
      if (c != null) { c.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); ctx.startActivity(c); }
    } else if (st == PackageInstaller.STATUS_SUCCESS) {
      android.widget.Toast.makeText(ctx, "App installed", android.widget.Toast.LENGTH_LONG).show();
    } else {
      String msg = in.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
      android.widget.Toast.makeText(ctx, "Install failed" + (msg == null || msg.isEmpty() ? "" : ": " + msg), android.widget.Toast.LENGTH_LONG).show();
    }
  }
}
