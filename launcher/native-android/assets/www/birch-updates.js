/* Check GitHub releases and install the newer APK over this one. */
(function () {
  var REPO = "CronusAquilx/birchosstorage";
  function toast(msg) {
    var old = document.getElementById("birch-update-toast");
    if (old) old.remove();
    var d = document.createElement("div");
    d.id = "birch-update-toast";
    d.textContent = msg;
    d.style.cssText = "position:fixed;left:50%;bottom:48px;transform:translateX(-50%);z-index:99999;background:#14121c;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:18px;padding:18px 28px;font:20px/1.35 sans-serif;max-width:70vw;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.45)";
    document.body.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.remove(); }, 6000);
  }
  function ask(info) {
    if (document.getElementById("birch-update-card")) return;
    var card = document.createElement("div");
    card.id = "birch-update-card";
    card.style.cssText = "position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center";
    card.innerHTML = "<div style=\"background:#16141e;color:#fff;border-radius:28px;padding:36px 40px;width:min(640px,86vw);font-family:sans-serif\">" +
      "<div style=\"font-size:28px;font-weight:700\">Birch OS " + info.versionCode + " is ready</div>" +
      "<p style=\"font-size:18px;opacity:.8;margin:12px 0 24px\">You're on version " + info.current + ". This installs over the app you already have. The Fire TV will ask you to confirm.</p>" +
      "<div style=\"display:flex;gap:16px;justify-content:flex-end\">" +
      "<button id=\"birch-up-later\" style=\"font-size:18px;padding:12px 22px;border-radius:14px;border:0;background:#2a2833;color:#fff\">Later</button>" +
      "<button id=\"birch-up-now\" style=\"font-size:18px;padding:12px 22px;border-radius:14px;border:0;background:#fff;color:#000;font-weight:700\">Install</button></div></div>";
    document.body.appendChild(card);
    var now = card.querySelector("#birch-up-now");
    now.focus();
    card.querySelector("#birch-up-later").onclick = function () { card.remove(); };
    now.onclick = function () {
      card.remove();
      if (window.BirchAndroid && window.BirchAndroid.installUpdate) window.BirchAndroid.installUpdate(info.url);
      else toast("Open this on the Fire TV to install.");
    };
  }
  function run(quiet) {
    var b = window.BirchAndroid;
    if (!b || !b.checkUpdate) { if (!quiet) toast("Update check only works inside the Birch OS app."); return; }
    if (!quiet) toast("Checking for updates...");
    setTimeout(function () {
      var raw = "{}", info;
      try { raw = b.checkUpdate() || "{}"; info = JSON.parse(raw); } catch (e) { if (!quiet) toast("Couldn't check for updates."); return; }
      if (info.error) { if (!quiet) toast(info.error); return; }
      if (info.versionCode > info.current && info.url) ask(info);
      else if (!quiet) toast("You're on the latest Birch OS (" + info.current + ").");
    }, 30);
  }
  window.__birchUpdate = function () { run(false); };
  document.addEventListener("DOMContentLoaded", function () { setTimeout(function () { run(true); }, 2500); });
})();
