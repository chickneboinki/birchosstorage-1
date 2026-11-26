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

  /* ---------- avatar gallery (inline SVG, works offline) ---------- */
  var G = function (id, a, b) { return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient></defs>'; };
  var STAR = 'M50 8l12 27 29 3-22 20 7 29-26-15-26 15 7-29-22-20 29-3z';
  var HEART = 'M50 86C14 60 10 36 28 24c10-6 20-1 22 8 2-9 12-14 22-8 18 12 14 36-22 62z';
  var AV = [
    ['y2k-butterfly', 'Y2K', G('g', '#ff6ad5', '#8a5cff') + '<rect width="100" height="100" fill="url(#g)"/><g fill="#fff" fill-opacity=".85"><ellipse cx="32" cy="38" rx="20" ry="16" transform="rotate(-25 32 38)"/><ellipse cx="68" cy="38" rx="20" ry="16" transform="rotate(25 68 38)"/><ellipse cx="36" cy="62" rx="14" ry="11" transform="rotate(20 36 62)"/><ellipse cx="64" cy="62" rx="14" ry="11" transform="rotate(-20 64 62)"/></g><rect x="47" y="30" width="6" height="44" rx="3" fill="#3a1470"/><circle cx="20" cy="18" r="3" fill="#fff"/><circle cx="82" cy="80" r="2.5" fill="#fff"/>'],
    ['y2k-star', 'Y2K', G('g', '#ff9de6', '#7ec8ff') + '<rect width="100" height="100" fill="url(#g)"/><path d="' + STAR + '" fill="#fff" stroke="#c9a6ff" stroke-width="3" transform="translate(0 4) scale(.98)"/><path d="M50 18l7 17" stroke="#fff" stroke-width="3" opacity=".8"/><circle cx="16" cy="20" r="3" fill="#fff"/><circle cx="86" cy="76" r="3" fill="#fff"/>'],
    ['y2k-heart', 'Y2K', G('g', '#ff3d97', '#ffc2ec') + '<rect width="100" height="100" fill="url(#g)"/><path d="' + HEART + '" fill="#fff" fill-opacity=".92"/><path d="M30 34c4-6 10-6 14-2" stroke="#ff3d97" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="82" cy="20" r="4" fill="#fff"/>'],
    ['y2k-smile', 'Y2K', G('g', '#b6f0ff', '#e5b4ff') + '<rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="52" r="34" fill="#ffe14d"/><path d="M34 44l6 4-6 4M66 44l-6 4 6 4" stroke="#7a2a8a" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M34 62q16 16 32 0" stroke="#7a2a8a" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="30" cy="58" r="5" fill="#ff8fc7" opacity=".7"/><circle cx="70" cy="58" r="5" fill="#ff8fc7" opacity=".7"/>'],
    ['y2k-disc', 'Y2K', G('g', '#7af3ff', '#ff7ae0') + '<rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="50" r="36" fill="#fff" fill-opacity=".85"/><circle cx="50" cy="50" r="36" fill="none" stroke="#b58cff" stroke-width="6" stroke-dasharray="14 10"/><circle cx="50" cy="50" r="10" fill="#c9b6ff"/><circle cx="50" cy="50" r="4" fill="#fff"/>'],
    ['y2k-flame', 'Y2K', G('g', '#2a0a4a', '#ff3d97') + '<rect width="100" height="100" fill="url(#g)"/><path d="M50 12c8 18 26 28 24 50-2 16-14 26-24 26S28 78 26 62c-1-12 8-18 12-30 4 8 8 8 12-20z" fill="#ffd1f0"/><path d="M50 44c4 10 12 14 11 26-1 8-6 12-11 12s-10-4-11-12c-1-8 6-12 11-26z" fill="#ff3d97"/>'],
    ['emo-heart', 'Emo', '<rect width="100" height="100" fill="#0d0d10"/><g fill="#ff1f5a"><path d="' + HEART + '"/></g><path d="M50 30l-8 14 10 8-8 16" stroke="#0d0d10" stroke-width="4" fill="none" stroke-linejoin="round"/><path d="M18 14h64M18 22h64" stroke="#fff" stroke-width="2" opacity=".25"/>'],
    ['emo-stripes', 'Emo', '<rect width="100" height="100" fill="#0d0d10"/><g fill="#ff4fa3"><rect y="10" width="100" height="10"/><rect y="30" width="100" height="10"/><rect y="50" width="100" height="10"/><rect y="70" width="100" height="10"/><rect y="90" width="100" height="10"/></g><circle cx="50" cy="50" r="26" fill="#0d0d10" stroke="#fff" stroke-width="4"/><path d="M40 42l8 8m0-8l-8 8M54 42l8 8m0-8l-8 8M38 64h24" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"/>'],
    ['emo-bolt', 'Emo', G('g', '#16001f', '#3a0a4d') + '<rect width="100" height="100" fill="url(#g)"/><path d="M58 8L22 56h22l-6 36 40-52H55z" fill="#ff4fa3" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>'],
    ['emo-bat', 'Emo', G('g', '#000', '#2a0a3a') + '<rect width="100" height="100" fill="url(#g)"/><path d="M50 36c-4-8-12-10-14-10 3 4 2 8-2 10-8-6-20-4-26 6 10 0 14 4 14 10 6-4 10 0 12 6 4-6 10-6 16 0 2-6 6-10 12-6 0-6 4-10 14-10-6-10-18-12-26-6-4-2-5-6-2-10-2 0-10 2-14 10z" fill="#e8e8f0" transform="translate(0 6) scale(.98)"/><circle cx="44" cy="46" r="2" fill="#ff1f5a"/><circle cx="56" cy="46" r="2" fill="#ff1f5a"/>'],
    ['emo-xx', 'Emo', '<rect width="100" height="100" fill="#15151a"/><circle cx="50" cy="52" r="34" fill="#f4f4f6"/><path d="M34 40l10 10m0-10L34 50M56 40l10 10m0-10L56 50" stroke="#111" stroke-width="5" stroke-linecap="round"/><path d="M34 68l6-5 6 5 6-5 6 5 6-5" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 20c0 8-4 8-4 14M60 20c0 8 4 8 4 14" stroke="#ff1f5a" stroke-width="3" fill="none"/>'],
    ['emo-star', 'Emo', '<rect width="100" height="100" fill="#0d0d10"/><path d="' + STAR + '" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><path d="' + STAR + '" fill="#ff1f5a" transform="translate(50 52) scale(.45) translate(-50 -52)"/>'],
    ['dark-moon', 'Dark', G('g', '#05050f', '#2c1252') + '<rect width="100" height="100" fill="url(#g)"/><path d="M62 14a38 38 0 1 0 24 56A32 32 0 0 1 62 14z" fill="#e7defc"/><circle cx="20" cy="22" r="1.8" fill="#fff"/><circle cx="30" cy="70" r="1.4" fill="#fff"/><circle cx="84" cy="30" r="1.6" fill="#fff"/><circle cx="72" cy="84" r="1.2" fill="#fff"/>'],
    ['dark-eye', 'Dark', G('g', '#000', '#1a0a2a') + '<rect width="100" height="100" fill="url(#g)"/><path d="M8 50q42-44 84 0q-42 44-84 0z" fill="#0b0b12" stroke="#b86bff" stroke-width="3"/><circle cx="50" cy="50" r="15" fill="#b86bff"/><circle cx="50" cy="50" r="6" fill="#000"/><circle cx="55" cy="45" r="3" fill="#fff"/>'],
    ['dark-cat', 'Dark', G('g', '#1b1b22', '#0a0a0e') + '<rect width="100" height="100" fill="url(#g)"/><path d="M22 84V44l10-22 12 14h12l12-14 10 22v40z" fill="#050508"/><ellipse cx="40" cy="52" rx="5" ry="6" fill="#ffd23f"/><ellipse cx="60" cy="52" rx="5" ry="6" fill="#ffd23f"/><rect x="39" y="47" width="2" height="10" fill="#000"/><rect x="59" y="47" width="2" height="10" fill="#000"/><path d="M46 64l4 3 4-3z" fill="#ff7aa8"/>'],
    ['dark-flame', 'Dark', '<rect width="100" height="100" fill="#07070b"/><path d="M50 8c10 20 28 28 26 52-2 18-14 30-26 30S26 78 24 60c-1-14 10-20 14-34 6 8 10 8 12-18z" fill="#6a2cff"/><path d="M50 40c6 12 14 16 13 28-1 10-7 14-13 14s-12-4-13-14c-1-12 7-16 13-28z" fill="#c9a6ff"/>'],
    ['dark-void', 'Dark', '<rect width="100" height="100" fill="#000"/><g fill="none" stroke="#7a3cff"><circle cx="50" cy="50" r="40" opacity=".3" stroke-width="3"/><circle cx="50" cy="50" r="30" opacity=".5" stroke-width="3"/><circle cx="50" cy="50" r="20" opacity=".8" stroke-width="3"/></g><circle cx="50" cy="50" r="10" fill="#7a3cff"/>'],
    ['white-smile', 'White', '<rect width="100" height="100" fill="#f4f4f7"/><circle cx="50" cy="50" r="34" fill="#fff" stroke="#222" stroke-width="4"/><circle cx="38" cy="44" r="4" fill="#222"/><circle cx="62" cy="44" r="4" fill="#222"/><path d="M36 60q14 14 28 0" stroke="#222" stroke-width="4" fill="none" stroke-linecap="round"/>'],
    ['white-cloud', 'White', G('g', '#eaf4ff', '#ffffff') + '<rect width="100" height="100" fill="url(#g)"/><g fill="#fff" stroke="#cfd9e6" stroke-width="2"><circle cx="38" cy="56" r="16"/><circle cx="56" cy="46" r="20"/><circle cx="72" cy="58" r="14"/><rect x="26" y="56" width="56" height="16" rx="8" stroke="none"/></g>'],
    ['white-wings', 'White', '<rect width="100" height="100" fill="#f7f7fa"/><ellipse cx="50" cy="20" rx="16" ry="5" fill="none" stroke="#e0b84a" stroke-width="4"/><path d="M50 34c-10-14-34-14-40 2 6 18 24 20 40 12 16 8 34 6 40-12-6-16-30-16-40-2z" fill="#fff" stroke="#c9ced8" stroke-width="3"/><circle cx="50" cy="48" r="8" fill="#e9ebf0"/>'],
    ['white-flower', 'White', '<rect width="100" height="100" fill="#ffffff"/><g fill="#f2f2f6" stroke="#d5d8e0" stroke-width="2"><ellipse cx="50" cy="26" rx="9" ry="16"/><ellipse cx="50" cy="74" rx="9" ry="16"/><ellipse cx="26" cy="50" rx="16" ry="9"/><ellipse cx="74" cy="50" rx="16" ry="9"/><ellipse cx="33" cy="33" rx="9" ry="15" transform="rotate(-45 33 33)"/><ellipse cx="67" cy="67" rx="9" ry="15" transform="rotate(-45 67 67)"/><ellipse cx="67" cy="33" rx="9" ry="15" transform="rotate(45 67 33)"/><ellipse cx="33" cy="67" rx="9" ry="15" transform="rotate(45 33 67)"/></g><circle cx="50" cy="50" r="10" fill="#ffd23f"/>'],
    ['white-sparkle', 'White', G('g', '#ffffff', '#e6e9f2') + '<rect width="100" height="100" fill="url(#g)"/><path d="M50 8c3 24 18 39 42 42-24 3-39 18-42 42-3-24-18-39-42-42 24-3 39-18 42-42z" fill="#fff" stroke="#b8c0d4" stroke-width="3"/>']
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

  /* ---------- profile store ---------- */
  var store = jget(PK, null);
  function liveRaw() { var o = {}; SK.forEach(function (k) { var v = rawGet.call(LS, k); if (v != null) o[k] = v; }); return o; }
  function settingsOf(raw) { try { return JSON.parse((raw && raw[SK[0]]) || '{}') || {}; } catch (e) { return {}; } }
  if (!store || !store.list || !store.list.length) {
    var raw0 = liveRaw(), s0 = settingsOf(raw0);
    store = { v: 1, active: 'p1', list: [{ id: 'p1', name: s0.userName || 'Qais', avatar: s0.avatar || (s0.userName || 'Q').charAt(0).toUpperCase(), data: raw0 }] };
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

  /* ---------- UI ---------- */
  var css = '.bp{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:Sora,system-ui,sans-serif;background:radial-gradient(1200px 700px at 50% 20%,#1b1236 0%,#07060d 70%);overflow:hidden}' +
    '.bp h1{font-size:56px;font-weight:700;margin:0 0 56px}.bp .row{display:flex;gap:44px;flex-wrap:wrap;justify-content:center;max-width:1700px}' +
    '.bp button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;outline:0}' +
    '.bp .tile{display:flex;flex-direction:column;align-items:center;gap:18px;padding:14px;border-radius:28px;transition:transform .12s}' +
    '.bp .tile:focus,.bp .chip:focus,.bp .btn:focus,.bp .av:focus{transform:scale(1.1)}.bp .tile:focus .face,.bp .av:focus,.bp .chip:focus,.bp .btn:focus,.bp input:focus{box-shadow:0 0 0 6px #fff,0 0 40px 6px rgba(160,130,255,.9)}' +
    '.bp .face{width:190px;height:190px;border-radius:50%;display:grid;place-items:center;font-size:92px;font-weight:700;overflow:hidden;background:#333}.bp .face img{width:100%;height:100%;object-fit:cover}' +
    '.bp .nm{font-size:30px;font-weight:600;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bp .plus{background:rgba(255,255,255,.08);font-size:100px;font-weight:300}' +
    '.bp .panel{width:1500px;max-height:960px;overflow-y:auto;padding:36px 48px;border-radius:32px;background:rgba(20,16,36,.92);border:1px solid rgba(255,255,255,.12)}.bp .panel::-webkit-scrollbar{display:none}' +
    '.bp h2{font-size:26px;margin:26px 0 14px;color:#b9a9ff;font-weight:600}.bp .top{display:flex;align-items:center;gap:30px}.bp .top .face{width:120px;height:120px;font-size:58px;flex:none}' +
    '.bp input{flex:1;font:inherit;font-size:34px;padding:16px 22px;border-radius:18px;border:2px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff}' +
    '.bp .grid{display:flex;flex-wrap:wrap;gap:20px}.bp .av{width:96px;height:96px;border-radius:50%;overflow:hidden;padding:0;transition:transform .12s;background:#333;display:grid;place-items:center;font-size:44px;font-weight:700}.bp .av img{width:100%;height:100%}.bp .av.on{box-shadow:0 0 0 5px #7c5cff}' +
    '.bp .chip{padding:12px 24px;font-size:24px;border-radius:999px;background:rgba(255,255,255,.1);text-transform:capitalize;transition:transform .12s}.bp .chip.on{background:#7c5cff}' +
    '.bp .acts{display:flex;gap:20px;margin-top:34px}.bp .btn{padding:16px 40px;font-size:28px;font-weight:600;border-radius:999px;background:rgba(255,255,255,.12);transition:transform .12s}.bp .btn.pri{background:#7c5cff}.bp .btn.dan{background:#a3233b}';
  function el(tag, cls, html, attrs) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function faceHtml(p) {
    var a = p.avatar || '?';
    if (String(a).indexOf('av:') === 0) return '<div class="face"><img alt="" src="' + avatarUrl(a) + '"></div>';
    return '<div class="face" style="background:linear-gradient(135deg,' + hueFor(p.name || a) + ',#1b1236);color:#fff">' + esc(a) + '</div>';
  }
  var layer = null, onBack = null;
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
  function open(cls) { addStyle(); close(); layer = el('div', 'bp ' + (cls || '')); document.body.appendChild(layer); return layer; }
  function close() { if (layer && layer.parentNode) layer.parentNode.removeChild(layer); layer = null; onBack = null; }

  var booted = false;
  function pick(isBoot) {
    open('pick');
    layer.appendChild(el('h1', '', "Who's watching?"));
    var row = el('div', 'row'); layer.appendChild(row);
    store.list.forEach(function (p) {
      var b = el('button', 'tile', faceHtml(p) + '<div class="nm">' + esc(p.name) + '</div>');
      b.onclick = function () { var reloading = activate(p.id); if (!reloading) close(); };
      row.appendChild(b);
    });
    var add = el('button', 'tile', '<div class="face plus">+</div><div class="nm">Add profile</div>');
    add.onclick = function () { editor(null); };
    row.appendChild(add);
    onBack = isBoot ? null : function () { close(); };
    var act = row.children[0];
    store.list.forEach(function (p, i) { if (p.id === store.active) act = row.children[i]; });
    if (act) { act.className += ' cur'; act.focus(); [60, 250, 700, 1500].forEach(function (t) { setTimeout(ensureFocus, t); }); }
  }

  function editor(profile) {
    var isNew = !profile;
    var sNow = isNew ? {} : settingsOf(liveRaw());
    var st = { name: isNew ? '' : profile.name, avatar: isNew ? '' : (profile.avatar || ''), layout: sNow.layout || 'cinema', theme: sNow.theme || 'midnight' };
    var backFn = function () { if (isNew && !booted) pick(true); else if (isNew) pick(false); else close(); };
    open('edit'); onBack = backFn;
    var panel = el('div', 'panel'); layer.appendChild(panel);
    function render() {
      var fp = { name: st.name || 'New', avatar: st.avatar || (st.name ? st.name.charAt(0).toUpperCase() : '?') };
      var h = '<div class="top">' + faceHtml(fp) + '<input id="bpn" maxlength="14" placeholder="Name" value="' + esc(st.name) + '"></div>';
      h += '<h2>Profile picture</h2><div class="grid"><button class="av' + (!st.avatar || st.avatar.indexOf('av:') !== 0 ? ' on' : '') + '" data-av="">' + esc((st.name || '?').charAt(0).toUpperCase()) + '</button></div>';
      CATS.forEach(function (c) {
        h += '<h2>' + c + '</h2><div class="grid">';
        AV.forEach(function (a) { if (a[1] === c) h += '<button class="av' + (st.avatar === 'av:' + a[0] ? ' on' : '') + '" data-av="av:' + a[0] + '"><img alt="" src="' + avatarUrl(a[0]) + '"></button>'; });
        h += '</div>';
      });
      h += '<h2>Layout</h2><div class="grid">' + LAYOUTS.map(function (l) { return '<button class="chip' + (st.layout === l ? ' on' : '') + '" data-l="' + l + '">' + l + '</button>'; }).join('') + '</div>';
      h += '<h2>Theme</h2><div class="grid">' + THEMES.map(function (l) { return '<button class="chip' + (st.theme === l ? ' on' : '') + '" data-t="' + l + '">' + l + '</button>'; }).join('') + '</div>';
      h += '<div class="acts"><button class="btn pri" id="bps">' + (isNew ? 'Create profile' : 'Save') + '</button><button class="btn" id="bpc">Cancel</button>' + (!isNew && store.list.length > 1 ? '<button class="btn dan" id="bpd">Delete profile</button>' : '') + '</div>';
      var keep = document.activeElement && (document.activeElement.getAttribute('data-av') != null ? 'av:' + document.activeElement.getAttribute('data-av') : document.activeElement.getAttribute('data-l') ? 'l:' + document.activeElement.getAttribute('data-l') : document.activeElement.getAttribute('data-t') ? 't:' + document.activeElement.getAttribute('data-t') : document.activeElement.id);
      var sc = panel.scrollTop;
      panel.innerHTML = h;
      var inp = panel.querySelector('#bpn');
      inp.oninput = function () { st.name = inp.value; var f = panel.querySelector('.top .face'); var fp2 = { name: st.name || 'New', avatar: st.avatar || (st.name ? st.name.charAt(0).toUpperCase() : '?') }; f.outerHTML = faceHtml(fp2); var l0 = panel.querySelector('.av[data-av=""]'); if (l0) l0.textContent = (st.name || '?').charAt(0).toUpperCase(); };
      Array.prototype.forEach.call(panel.querySelectorAll('[data-av]'), function (b) { b.onclick = function () { st.avatar = b.getAttribute('data-av'); render(); }; });
      Array.prototype.forEach.call(panel.querySelectorAll('[data-l]'), function (b) { b.onclick = function () { st.layout = b.getAttribute('data-l'); render(); }; });
      Array.prototype.forEach.call(panel.querySelectorAll('[data-t]'), function (b) { b.onclick = function () { st.theme = b.getAttribute('data-t'); render(); }; });
      panel.querySelector('#bpc').onclick = backFn;
      panel.querySelector('#bps').onclick = function () {
        var nm = (inp.value || '').trim().slice(0, 14);
        if (!nm) { inp.focus(); return; }
        var av = st.avatar && st.avatar.indexOf('av:') === 0 ? st.avatar : nm.charAt(0).toUpperCase();
        if (isNew) { var p = createProfile({ name: nm, avatar: av, layout: st.layout, theme: st.theme }); activate(p.id); }
        else { updateActive({ name: nm, avatar: av, layout: st.layout, theme: st.theme }); close(); }
      };
      var d = panel.querySelector('#bpd'); if (d) d.onclick = function () { deleteProfile(profile.id); close(); };
      var target = keep ? (keep.indexOf('av:') === 0 ? panel.querySelector('[data-av="' + keep.slice(3) + '"]') : keep.indexOf('l:') === 0 ? panel.querySelector('[data-l="' + keep.slice(2) + '"]') : keep.indexOf('t:') === 0 ? panel.querySelector('[data-t="' + keep.slice(2) + '"]') : panel.querySelector('#' + keep)) : null;
      (target || (isNew ? inp : panel.querySelector('[data-av].on') || inp)).focus();
      panel.scrollTop = sc;
    }
    render();
  }

  /* ---------- keep the screen on while Birch's own screensaver is enabled ---------- */
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
  /* If startup animation is skipped by the app on reload, make sure picker logic still sees this session as chosen. */
})();
