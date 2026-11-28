package com.birchos.launcher;

import android.content.Context;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

/** Short "Powered by Birch OS" intro: plain views + property animations (GPU, no layout work) and a tiny synthesized chime. */
final class Splash {
  private Splash() {}

  static FrameLayout build(Context c) {
    FrameLayout bg = new FrameLayout(c);
    bg.setBackgroundColor(0xFF05060A);
    bg.setClickable(true);

    // soft glow behind the logo
    View glow = new View(c);
    GradientDrawable gd = new GradientDrawable(GradientDrawable.Orientation.TL_BR, new int[] { 0x5533E0B0, 0x00000000 });
    gd.setShape(GradientDrawable.OVAL);
    gd.setGradientType(GradientDrawable.RADIAL_GRADIENT);
    gd.setGradientRadius(420f);
    glow.setBackground(gd);
    glow.setTag("glow");
    glow.setAlpha(0f);
    bg.addView(glow, new FrameLayout.LayoutParams(900, 900, Gravity.CENTER));

    LinearLayout col = new LinearLayout(c);
    col.setOrientation(LinearLayout.VERTICAL);
    col.setGravity(Gravity.CENTER_HORIZONTAL);

    TextView small = new TextView(c);
    small.setText("POWERED BY");
    small.setTextColor(0xFF8A8FA3);
    small.setTextSize(18f);
    small.setLetterSpacing(0.4f);
    small.setTypeface(Typeface.DEFAULT_BOLD);
    small.setTag("small");
    small.setAlpha(0f);
    col.addView(small, new LinearLayout.LayoutParams(-2, -2));

    TextView big = new TextView(c);
    big.setText("Birch OS");
    big.setTextSize(78f);
    big.setTypeface(Typeface.DEFAULT_BOLD);
    big.setTextColor(Color.WHITE);
    big.setLetterSpacing(0.02f);
    big.getPaint().setShader(new LinearGradient(0, 0, 520, 0, 0xFFFFFFFF, 0xFF6BF0C8, Shader.TileMode.CLAMP));
    big.setTag("big");
    big.setAlpha(0f);
    LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(-2, -2);
    bp.topMargin = 6;
    col.addView(big, bp);

    View line = new View(c);
    GradientDrawable ld = new GradientDrawable(GradientDrawable.Orientation.LEFT_RIGHT, new int[] { 0x0033E0B0, 0xFF33E0B0, 0x0033E0B0 });
    line.setBackground(ld);
    line.setTag("line");
    line.setAlpha(0f);
    LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(420, 4);
    lp.topMargin = 18;
    col.addView(line, lp);

    bg.addView(col, new FrameLayout.LayoutParams(-2, -2, Gravity.CENTER));
    return bg;
  }

  static void play(FrameLayout v) {
    View glow = v.findViewWithTag("glow"), small = v.findViewWithTag("small"), big = v.findViewWithTag("big"), line = v.findViewWithTag("line");
    glow.setScaleX(0.6f); glow.setScaleY(0.6f);
    glow.animate().alpha(1f).scaleX(1f).scaleY(1f).setDuration(900).withLayer().start();
    small.setTranslationY(14f);
    small.animate().alpha(1f).translationY(0f).setDuration(380).withLayer().start();
    big.setScaleX(0.9f); big.setScaleY(0.9f);
    big.animate().alpha(1f).scaleX(1f).scaleY(1f).setStartDelay(120).setDuration(520).withLayer().start();
    line.setScaleX(0f);
    line.animate().alpha(1f).scaleX(1f).setStartDelay(340).setDuration(520).withLayer().start();
  }

  static void dismiss(final FrameLayout v) {
    if (v == null) return;
    v.animate().alpha(0f).setDuration(220).withEndAction(() -> {
      try { if (v.getParent() instanceof ViewGroup) ((ViewGroup) v.getParent()).removeView(v); } catch (Throwable ignored) {}
    }).start();
  }

  /** Soft rising three-note chime, synthesized (no asset), played off the UI thread. */
  static void chime() {
    new Thread(() -> {
      try {
        final int sr = 22050;
        final double[] f = { 523.25, 659.25, 783.99, 1046.5 };
        final double[] t0 = { 0.00, 0.11, 0.22, 0.34 };
        int n = (int) (sr * 1.0);
        short[] pcm = new short[n];
        for (int k = 0; k < f.length; k++) {
          int start = (int) (t0[k] * sr);
          int len = (int) (0.5 * sr);
          for (int i = 0; i < len && start + i < n; i++) {
            double t = i / (double) sr;
            double env = Math.min(1.0, t / 0.01) * Math.exp(-t * 6.5);
            double s = Math.sin(2 * Math.PI * f[k] * t) + 0.25 * Math.sin(2 * Math.PI * f[k] * 2 * t);
            int idx = start + i;
            int val = pcm[idx] + (int) (s * env * 5200);
            pcm[idx] = (short) Math.max(-32000, Math.min(32000, val));
          }
        }
        final AudioTrack at = new AudioTrack(AudioManager.STREAM_MUSIC, sr, AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_16BIT, n * 2, AudioTrack.MODE_STATIC);
        at.write(pcm, 0, n);
        at.play();
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
          try { at.stop(); } catch (Throwable ignored) {}
          try { at.release(); } catch (Throwable ignored) {}
        }, 1400);
      } catch (Throwable ignored) {}
    }, "birch-chime").start();
  }
}
