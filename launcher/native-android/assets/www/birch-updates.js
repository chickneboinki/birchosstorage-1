/* Check GitHub releases and install the newer APK over this one. */
(function () {
  var REPO = "chickneboinki/birchosstorage-1";
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
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.tabIndex = -1;
    card.style.cssText = "position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;outline:none";
    card.innerHTML =
      '<div class="birch-up-box" style="background:#16141e;color:#fff;border-radius:24px;padding:28px 32px;width:min(520px,88vw);font-family:sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.55)">' +
      '<div style="font-size:24px;font-weight:700">Birch OS ' + info.versionCode + ' is ready</div>' +
      '<p style="font-size:16px;opacity:.85;margin:12px 0 22px;line-height:1.4">You\'re on version ' + info.current + '. This installs over the app you already have.</p>' +
      '<div style="display:flex;gap:14px;justify-content:flex-end">' +
      '<button type="button" id="birch-up-later" tabindex="0" style="font-size:17px;padding:14px 24px;border-radius:14px;border:2px solid transparent;background:#2a2833;color:#fff">Later</button>' +
      '<button type="button" id="birch-up-now" tabindex="0" style="font-size:17px;padding:14px 24px;border-radius:14px;border:2px solid transparent;background:#fff;color:#000;font-weight:700">Install</button>' +
      '</div></div>';
    document.body.appendChild(card);

    var later = card.querySelector("#birch-up-later");
    var now = card.querySelector("#birch-up-now");
    var buttons = [later, now];
    var idx = 1;

    function paint() {
      buttons.forEach(function (b, i) {
        if (i === idx) {
          b.style.outline = "3px solid #fff";
          b.style.boxShadow = "0 0 0 3px #7c5cff, 0 0 24px rgba(124,92,255,.6)";
          b.focus();
        } else {
          b.style.outline = "none";
          b.style.boxShadow = "none";
        }
      });
    }

    function close() {
      document.removeEventListener("keydown", onKey, true);
      if (card.parentNode) card.remove();
    }

    function onKey(e) {
      e.stopPropagation();
      e.stopImmediatePropagation();
      var k = e.key;
      if (k === "ArrowLeft" || k === "ArrowRight") {
        e.preventDefault();
        idx = k === "ArrowLeft" ? 0 : 1;
        paint();
        return;
      }
      if (k === "Enter" || k === " " || k === "Select") {
        e.preventDefault();
        buttons[idx].click();
        return;
      }
      if (k === "Escape" || k === "Backspace" || k === "GoBack" || k === "BrowserBack") {
        e.preventDefault();
        close();
        return;
      }
      e.preventDefault();
    }

    later.onclick = function (e) { e.stopPropagation(); close(); };
    now.onclick = function (e) {
      e.stopPropagation();
      close();
      if (window.BirchAndroid && window.BirchAndroid.installUpdate) window.BirchAndroid.installUpdate(info.url);
      else toast("Open this on the Fire TV to install.");
    };
    card.addEventListener("click", function (e) {
      if (e.target === card) close();
    });

    document.addEventListener("keydown", onKey, true);
    paint();
    setTimeout(function () { paint(); now.focus(); }, 50);
    setTimeout(function () { paint(); }, 300);
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
