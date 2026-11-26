/* Birch OS profiles: who's-watching picker, create/edit profile, avatar gallery, per-profile settings, keep-awake. */
(function () {
  'use strict';
  var PK = 'birch-profiles-v1';
  var SK = ['birch-os-settings-v1', 'birch-studio-v2', 'birch-watch-v1'];
  var LS, rawSet, rawGet, rawDel;
  try { LS = window.localStorage; rawSet = Storage.prototype.setItem; rawGet = Storage.prototype.getItem; rawDel = Storage.prototype.removeItem; } catch (e) { return; }
  function jget(k, d) { try { var v = rawGet.call(LS, k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function jset(k, v) { try { rawSet.call(LS, k, JSON.stringify(v)); } catch (e) {} }
  function sget(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) {} }

  var LAYOUTS = ['cinema', 'minimal', 'gaming', 'clean', 'neon', 'arctic', 'pro', 'appletv', 'ps5', 'firestick', 'advanced', 'xbox', 'onn'];
  var THEMES = ['midnight', 'aurora', 'arctic', 'crimson', 'neon', 'amoled', 'ocean', 'sunset', 'forest'];

  var G = function (id, a, b) { return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient></defs>'; };
  var AV = [
    ['y2k-star', 'Y2K', G('g', '#ff9de6', '#7ec8ff') + '<rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="50" r="28" fill="#fff"/>'],
    ['emo-heart', 'Emo', '<rect width="100" height="100" fill="#0d0d10"/><circle cx="50" cy="50" r="28" fill="#ff1f5a"/>'],
    ['dark-moon', 'Dark', G('g', '#05050f', '#2c1252') + '<rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="50" r="28" fill="#e7defc"/>'],
    ['white-smile', 'White', '<rect width="100" height="100" fill="#f4f4f7"/><circle cx="50" cy="50" r="28" fill="#fff" stroke="#222" stroke-width="4"/>']
  ];
  var CATS = ['Y2K', 'Emo', 'Dark', 'White'];
  function svgOf(id) {
    for (var i = 0; i < AV.length; i++) if (AV[i][0] === id) return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' + AV[i][2] + '</svg>';
    return '';
  }
  function avatarUrl(tok) {
    var id = String(tok || '').replace(/^av:/, '');
    var s = svgOf(id);
    return s ? 'data:image/svg+xml;utf8,' + encodeURIComponent(s) : '';
  }
  var HUES = ['#7c5cff', '#ff5fa8', '#19c3b5', '#ff9340', '#3ea3ff', '#7ad94a', '#ff4d5e', '#c76bff'];
  function hueFor(name) { var h = 0; for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0; return HUES[h % HUES.length]; }

  var store = jget(PK, null);
  function liveRaw() { var o = {}; SK.forEach(function (k) { var v = rawGet.call(LS, k); if (v != null) o[k] = v; }); return o; }
  function settingsOf(raw) { try { return JSON.parse((raw && raw[SK[0]]) || '{}') || {}; } catch (e) { return {}; } }
  if (!store || !store.list || !store.list.length) {
    var raw0 = liveRaw(), s0 = settingsOf(raw0);
    store = { v: 1, active: 'p1', list: [{ id: 'p1', name: s0.userName || 'User', avatar: s0.avatar || 'U', data: raw0 }] };
    jset(PK, store);
  }
  function cur() { for (var i = 0; i < store.list.length; i++) if (store.list[i].id === store.active) return store.list[i]; return store.list[0]; }
  function snap() { var p = cur(); if (!p) return; p.data = liveRaw(); var s = settingsOf(p.data); if (s.userName) p.name = s.userName; if (s.avatar) p.avatar = s.avatar; jset(PK, store); }
  var tmr = 0;
  function sched() { clearTimeout(tmr); tmr = setTimeout(snap, 500); }
  Storage.prototype.setItem = function (k) { var r = rawSet.apply(this, arguments); try { if (this === LS && SK.indexOf(k) > -1) sched(); } catch (e) {} return r; };
  window.addEventListener('pagehide', function () { try { snap(); } catch (e) {} });

  function loadProfile(p) { SK.forEach(function (k) { var v = p.data && p.data[k]; if (v != null) rawSet.call(LS, k, v); else rawDel.call(LS, k); }); }
  function activate(id) {
    snap();
    var same = id === store.active;
    var p = null; store.list.forEach(function (x) { if (x.id === id) p = x; });
    if (!p) return;
    store.active = id; jset(PK, store);
    sset('birch-prof', id);
    if (same) return false;
    loadProfile(p);
    location.reload();
    return true;
  }
  function uid() { return 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e3); }
  function createProfile(o) {
    snap();
    var p = { id: uid(), name: o.name, avatar: o.avatar, data: {} };
    p.data[SK[0]] = JSON.stringify({ userName: o.name, avatar: o.avatar, layout: o.layout, theme: o.theme, setupDone: true });
    store.list.push(p); jset(PK, store);
    return p;
  }
  function updateActive(o) {
    var p = cur(); p.name = o.name; p.avatar = o.avatar; jset(PK, store);
    var s = settingsOf(liveRaw()); s.userName = o.name; s.avatar = o.avatar; s.layout = o.layout; s.theme = o.theme;
    try { if (window.__bs && window.__bs.set) window.__bs.set({ userName: o.name, avatar: o.avatar, layout: o.layout, theme: o.theme }); else rawSet.call(LS, SK[0], JSON.stringify(s)); } catch (e) {}
    snap();
  }
  function deleteProfile(id) {
    if (store.list.length < 2) return;
    store.list = store.list.filter(function (x) { return x.id !== id; });
    if (store.active === id) { store.active = store.list[0].id; jset(PK, store); loadProfile(store.list[0]); sset('birch-prof', store.active); location.reload(); return; }
    jset(PK, store);
  }

  var css = '.bp{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:Sora,system-ui,sans-serif;background:radial-gradient(1200px 700px at 50% 20%,#1b1236 0%,#07060d 70%);overflow:hidden}' +
    '.bp h1{font-size:34px;font-weight:700;margin:0 0 28px}.bp .row{display:flex;gap:28px;flex-wrap:wrap;justify-content:center;max-width:1100px}' +
    '.bp button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;outline:0}' +
    '.bp .tile{display:flex;flex-direction:column;align-items:center;gap:12px;padding:10px;border-radius:20px;transition:transform .12s}' +
    '.bp .tile:focus,.bp .chip:focus,.bp .btn:focus,.bp .av:focus{transform:scale(1.06)}.bp .tile:focus .face,.bp .av:focus,.bp .chip:focus,.bp .btn:focus,.bp input:focus{box-shadow:0 0 0 4px #fff,0 0 28px 4px rgba(160,130,255,.85)}' +
    '.bp .face{width:110px;height:110px;border-radius:50%;display:grid;place-items:center;font-size:48px;font-weight:700;overflow:hidden;background:#333}.bp .face img{width:100%;height:100%;object-fit:cover}' +
    '.bp .nm{font-size:18px;font-weight:600;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bp .plus{background:rgba(255,255,255,.08);font-size:52px;font-weight:300}' +
    '.bp .panel{width:min(920px,92vw);max-height:78vh;overflow-y:auto;padding:24px 28px;border-radius:24px;background:rgba(20,16,36,.92);border:1px solid rgba(255,255,255,.12)}.bp .panel::-webkit-scrollbar{display:none}' +
    '.bp h2{font-size:18px;margin:18px 0 10px;color:#b9a9ff;font-weight:600}.bp .top{display:flex;align-items:center;gap:18px}.bp .top .face{width:72px;height:72px;font-size:34px;flex:none}' +
    '.bp input{flex:1;font:inherit;font-size:20px;padding:12px 16px;border-radius:14px;border:2px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff}' +
    '.bp .grid{display:flex;flex-wrap:wrap;gap:14px}.bp .av{width:64px;height:64px;border-radius:50%;overflow:hidden;padding:0;transition:transform .12s;background:#333;display:grid;place-items:center;font-size:28px;font-weight:700}.bp .av img{width:100%;height:100%}.bp .av.on{box-shadow:0 0 0 4px #7c5cff}' +
    '.bp .chip{padding:8px 16px;font-size:16px;border-radius:999px;background:rgba(255,255,255,.1);text-transform:capitalize;transition:transform .12s}.bp .chip.on{background:#7c5cff}' +
    '.bp .acts{display:flex;gap:14px;margin-top:22px;flex-wrap:wrap}.bp .btn{padding:12px 24px;font-size:18px;font-weight:600;border-radius:999px;background:rgba(255,255,255,.12);transition:transform .12s}.bp .btn.pri{background:#7c5cff}.bp .btn.dan{background:#a3233b}';

  function el(tag, cls, html, attrs) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function faceHtml(p) {
    var a = p.avatar || '?';
    if (String(a).indexOf('av:') === 0) return '<div class="face"><img alt="" src="' + avatarUrl(a) + '"></div>';
    return '<div class="face" style="background:linear-gradient(135deg,' + hueFor(p.name || a) + ',#1b1236);color:#fff">' + esc(a) + '</div>';
  }
  var layer = null, onBack = null, booted = false;
  function addStyle() { if (document.getElementById('bp-css')) return; var s = el('style'); s.id = 'bp-css'; s.textContent = css; document.head.appendChild(s); }
  function focusables() { return Array.prototype.slice.call(layer.querySelectorAll('button,input')).filter(function (e) { return e.offsetParent !== null; }); }
  function center(e) { var r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  function move(dir) {
    var list = focusables(), a = document.activeElement;
    if (list.indexOf(a) < 0) { if (list[0]) list[0].focus(); return; }
    var c = center(a), best = null, bs = 1e12;
    list.forEach(function (e) {
      if (e === a) return; var q = center(e), dx = q.x - c.x, dy = q.y - c.y;
      var ok = dir === 'L' ? dx < -8 : dir === 'R' ? dx > 8 : dir === 'U' ? dy < -8 : dy > 8;
      if (!ok) return;
      var main = (dir === 'L' || dir === 'R') ? Math.abs(dx) : Math.abs(dy), cross = (dir === 'L' || dir === 'R') ? Math.abs(dy) : Math.abs(dx);
      var s = main + cross * 3; if (s < bs) { bs = s; best = e; }
    });
    if (best) { best.focus(); try { best.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) {} }
  }
  function ensureFocus() {
    if (!layer) return false;
    if (layer.contains(document.activeElement) && document.activeElement !== layer) return true;
    var pref = layer.querySelector('.tile.cur') || layer.querySelector('[data-av].on') || focusables()[0];
    if (pref) pref.focus();
    return false;
  }
  function onKey(e) {
    if (!layer) return;
    if (!ensureFocus() && (e.key === 'Enter' || e.key === ' ')) { e.stopImmediatePropagation(); e.preventDefault(); var f = document.activeElement; if (f && f.click) f.click(); return; }
    var k = e.key, inInput = document.activeElement && document.activeElement.tagName === 'INPUT';
    e.stopImmediatePropagation();
    if (k === 'ArrowLeft' || k === 'ArrowRight') { if (inInput && k === 'ArrowLeft' && document.activeElement.selectionStart > 0) return; if (inInput && k === 'ArrowRight' && document.activeElement.selectionStart < document.activeElement.value.length) return; e.preventDefault(); move(k === 'ArrowLeft' ? 'L' : 'R'); }
    else if (k === 'ArrowUp' || k === 'ArrowDown') { e.preventDefault(); move(k === 'ArrowUp' ? 'U' : 'D'); }
    else if (k === 'Escape' || k === 'Backspace' || k === 'GoBack' || k === 'BrowserBack') { if (inInput && k === 'Backspace') return; e.preventDefault(); if (onBack) onBack(); }
  }
  window.addEventListener('keydown', onKey, true);
  function open(cls) { addStyle(); close(); layer = el('div', 'bp' + (cls ? ' ' + cls : '')); document.body.appendChild(layer); }
  function close() { if (layer && layer.parentNode) layer.parentNode.removeChild(layer); layer = null; onBack = null; }
  function pick(force) {
    if (!force && sget('birch-prof')) return;
    open();
    onBack = force ? null : close;
    layer.innerHTML = '<h1>Who\'s watching?</h1><div class="row" id="bprow"></div>';
    var row = layer.querySelector('#bprow');
    store.list.forEach(function (p) {
      var t = el('button', 'tile' + (p.id === store.active ? ' cur' : ''), faceHtml(p) + '<div class="nm">' + esc(p.name) + '</div>');
      t.onclick = function () { activate(p.id); if (!force) close(); };
      row.appendChild(t);
    });
    var add = el('button', 'tile', '<div class="face plus">+</div><div class="nm">Add profile</div>');
    add.onclick = function () { editor(null); };
    row.appendChild(add);
    var act = layer.querySelector('.tile.cur') || layer.querySelector('.tile');
    if (act) { act.focus(); [60, 250, 700].forEach(function (t) { setTimeout(ensureFocus, t); }); }
  }
  function editor(profile) {
    var isNew = !profile;
    var sNow = settingsOf(liveRaw());
    var st = { name: isNew ? '' : profile.name, avatar: isNew ? '' : (profile.avatar || ''), layout: sNow.layout || 'cinema', theme: sNow.theme || 'midnight' };
    open();
    onBack = function () { if (isNew) pick(true); else close(); };
    function render(keep, sc) {
      var h = '<div class="panel"><div class="top">' + faceHtml({ name: st.name || '?', avatar: st.avatar || (st.name || '?').charAt(0) }) + '<input id="bpn" maxlength="14" placeholder="Name" value="' + esc(st.name) + '"></div>';
      h += '<h2>Avatar</h2><div class="grid">';
      AV.forEach(function (a) {
        var on = st.avatar === 'av:' + a[0] ? ' on' : '';
        h += '<button class="av' + on + '" data-av="' + a[0] + '"><img alt="" src="' + avatarUrl('av:' + a[0]) + '"></button>';
      });
      h += '</div><h2>Layout</h2><div class="grid">';
      LAYOUTS.forEach(function (l) { h += '<button class="chip' + (st.layout === l ? ' on' : '') + '" data-l="' + l + '">' + l + '</button>'; });
      h += '</div><h2>Theme</h2><div class="grid">';
      THEMES.forEach(function (th) { h += '<button class="chip' + (st.theme === th ? ' on' : '') + '" data-t="' + th + '">' + th + '</button>'; });
      h += '</div><div class="acts"><button class="btn pri" id="bps">' + (isNew ? 'Create profile' : 'Save') + '</button><button class="btn" id="bpc">Cancel</button>';
      if (!isNew && store.list.length > 1) h += '<button class="btn dan" id="bpd">Delete profile</button>';
      h += '</div></div>';
      layer.innerHTML = h;
      var inp = layer.querySelector('#bpn');
      var panel = layer.querySelector('.panel');
      if (sc != null) panel.scrollTop = sc;
      inp.oninput = function () { st.name = inp.value; };
      layer.querySelectorAll('[data-av]').forEach(function (b) { b.onclick = function () { st.avatar = 'av:' + b.getAttribute('data-av'); render('av:' + b.getAttribute('data-av'), panel.scrollTop); }; });
      layer.querySelectorAll('[data-l]').forEach(function (b) { b.onclick = function () { st.layout = b.getAttribute('data-l'); render('l:' + st.layout, panel.scrollTop); }; });
      layer.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { st.theme = b.getAttribute('data-t'); render('t:' + st.theme, panel.scrollTop); }; });
      layer.querySelector('#bpc').onclick = function () { onBack(); };
      layer.querySelector('#bps').onclick = function () {
        var nm = (inp.value || '').trim().slice(0, 14);
        if (!nm) { inp.focus(); return; }
        var av = st.avatar && st.avatar.indexOf('av:') === 0 ? st.avatar : nm.charAt(0).toUpperCase();
        if (isNew) { var p = createProfile({ name: nm, avatar: av, layout: st.layout, theme: st.theme }); activate(p.id); }
        else { updateActive({ name: nm, avatar: av, layout: st.layout, theme: st.theme }); close(); }
      };
      var d = layer.querySelector('#bpd'); if (d) d.onclick = function () { deleteProfile(profile.id); close(); };
      (isNew ? inp : layer.querySelector('[data-av].on') || inp).focus();
    }
    render();
  }

  var lock = null;
  function wake() {
    try {
      var s = settingsOf(liveRaw()), want = s.screensaverMinutes === undefined ? 5 : s.screensaverMinutes;
      try { if (window.BirchAndroid && window.BirchAndroid.setKeepScreenOn) window.BirchAndroid.setKeepScreenOn(want > 0); } catch (e) {}
      if (!navigator.wakeLock) return;
      if (want > 0 && !lock) { navigator.wakeLock.request('screen').then(function (l) { lock = l; l.addEventListener('release', function () { lock = null; }); }, function () {}); }
      else if (!(want > 0) && lock) { lock.release(); lock = null; }
    } catch (e) {}
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') wake(); });
  window.addEventListener('keydown', function () { if (!lock) wake(); }, true);
  setInterval(wake, 30000);
  document.addEventListener('DOMContentLoaded', wake);

  window.__prof = {
    avatarUrl: avatarUrl,
    boot: function () { if (booted) return; booted = true; if (sget('birch-prof')) return; setTimeout(function () { pick(true); }, 0); },
    pick: function () { pick(false); },
    edit: function () { editor(cur()); },
    list: function () { return store.list.slice(); },
    active: function () { return cur(); }
  };
})();
