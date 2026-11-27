/* Birch Studio engine: live personalization, widgets, app menu, sounds. UI lives in the Look & Feel tabs. */
(function () {
  'use strict';
  var KEY = 'birch-studio-v2';
  var SW = { none: null, red: '#ff4d5e', orange: '#ff9340', yellow: '#ffd23f', green: '#3ddc84', teal: '#19d3c5', blue: '#3ea3ff', purple: '#9e70ff', pink: '#ff5fc8', white: '#ffffff' };
  var SWK = Object.keys(SW);
  var WPC = { black: '#000000', charcoal: '#1c1c22', navy: '#0b1530', blue: '#12307a', purple: '#2a1650', teal: '#0b3b3f', green: '#0f3320', red: '#4a0f1a', brown: '#2b1d14', gray: '#55575f', white: '#f2f2f2' };
  var FONTS = { default: null, system: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif', rounded: '"Nunito","Varela Round","Trebuchet MS",system-ui,sans-serif', mono: 'ui-monospace,"Roboto Mono",Consolas,monospace', serif: 'Georgia,"Times New Roman",serif', condensed: '"Roboto Condensed","Arial Narrow",sans-serif-condensed,sans-serif' };
  var BGS = { default: null, black: '#000000', charcoal: '#111214', navy: '#050b1c', plum: '#12081c', forest: '#06130c', wine: '#1a060b', slate: '#0e1620' };
  var SPEED = { instant: 0, fast: 90, normal: 150, relaxed: 260, slow: 420 };
  var EASE = { smooth: 'cubic-bezier(.22,.61,.36,1)', snappy: 'cubic-bezier(.2,.9,.2,1)', gentle: 'cubic-bezier(.4,0,.2,1)', bouncy: 'cubic-bezier(.34,1.56,.64,1)', linear: 'linear' };
  var TZ = ['Local', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'];
  var QUOTES = ['Small steps still move you forward.', 'Done is better than perfect.', 'Make it work, then make it beautiful.', 'Focus on the next right thing.', 'Rest is part of the work.', 'Curiosity beats certainty.', 'Simple is hard. Do it anyway.', 'Progress, not perfection.', 'Today is a good day to build.', 'Be kind to future you.'];

  // [id, tab, group, label, type, ...]  r: min,max,step,def,unit | c: opts,def | t: def | a: action
  var C = [
    ['preset', 'x_picture', 'Presets', 'Preset (tap to apply)', 'p'],
    ['brightness', 'x_picture', 'Picture', 'Brightness (up to 200%)', 'r', 40, 200, 10, 100, '%'],
    ['contrast', 'x_picture', 'Picture', 'Contrast', 'r', 50, 200, 10, 100, '%'],
    ['saturation', 'x_picture', 'Picture', 'Saturation', 'r', 0, 250, 10, 100, '%'],
    ['hue', 'x_picture', 'Picture', 'Hue shift', 'r', -180, 180, 15, 0, '°'],
    ['gray', 'x_picture', 'Picture', 'Black & white', 'r', 0, 100, 10, 0, '%'],
    ['sepia', 'x_picture', 'Picture', 'Sepia', 'r', 0, 100, 10, 0, '%'],
    ['temp', 'x_picture', 'Picture', 'Color temperature (cool to warm)', 'r', -100, 100, 10, 0, ''],
    ['night', 'x_picture', 'Picture', 'Night light (less blue)', 'r', 0, 100, 10, 0, '%'],
    ['vignette', 'x_picture', 'Picture', 'Vignette', 'r', 0, 100, 10, 0, '%'],
    ['dim', 'x_picture', 'Picture', 'Dim overlay', 'r', 0, 80, 5, 0, '%'],
    ['tint', 'x_picture', 'Picture', 'Tint color', 'c', SWK, 'none'],
    ['tintAmt', 'x_picture', 'Picture', 'Tint strength', 'r', 0, 60, 5, 20, '%'],
    ['invert', 'x_picture', 'Picture', 'Invert colors', 't', false],
    ['webMode', 'x_picture', 'Picture', 'Web apps & movies (applies when an app opens). video-safe keeps video visible', 'c', ['video-safe', 'full', 'off'], 'video-safe'],

    ['accent', 'x_style', 'Colors', 'Accent color', 'c', SWK, 'none'],
    ['accent2', 'x_style', 'Colors', 'Secondary accent', 'c', SWK, 'none'],
    ['bg', 'x_style', 'Colors', 'Background color', 'c', Object.keys(BGS), 'default'],
    ['textColor', 'x_style', 'Colors', 'Text color', 'c', ['none', 'white', 'yellow', 'green', 'teal', 'pink', 'orange'], 'none'],
    ['subtext', 'x_style', 'Colors', 'Secondary text brightness', 'r', 40, 100, 10, 0, '%'],
    ['border', 'x_style', 'Colors', 'Border visibility', 'r', 0, 40, 5, 10, '%'],
    ['glass', 'x_style', 'Colors', 'Glass panel opacity', 'r', 10, 100, 10, 55, '%'],
    ['liquid', 'x_style', 'Liquid Glass', 'Liquid Glass design (frosted panels, shine, springy focus)', 't', true],
    ['liquidBlur', 'x_style', 'Liquid Glass', 'Glass blur strength', 'r', 8, 60, 4, 32, 'px'],
    ['liquidShine', 'x_style', 'Liquid Glass', 'Shine & highlights', 'r', 0, 100, 10, 70, '%'],
    ['ring', 'x_style', 'Focus highlight', 'Highlight color', 'c', SWK, 'none'],
    ['ringW', 'x_style', 'Focus highlight', 'Outline thickness', 'r', 0, 8, 1, 0, 'px'],
    ['focusScale', 'x_style', 'Focus highlight', 'Grow when selected', 'r', 100, 130, 5, 100, '%'],
    ['focusGlow', 'x_style', 'Focus highlight', 'Glow strength', 'r', 0, 60, 10, 0, 'px'],
    ['focusPulse', 'x_style', 'Focus highlight', 'Pulse animation', 't', false],
    ['size', 'x_style', 'Text & shape', 'Interface size', 'r', 70, 140, 5, 100, '%'],
    ['radius', 'x_style', 'Text & shape', 'Corner roundness', 'r', 0, 200, 25, 75, ''],
    ['font', 'x_style', 'Text & shape', 'Font', 'c', Object.keys(FONTS), 'default'],
    ['weight', 'x_style', 'Text & shape', 'Text weight', 'c', ['auto', '300', '400', '500', '600', '700', '800'], 'auto'],
    ['tracking', 'x_style', 'Text & shape', 'Letter spacing', 'r', -3, 10, 1, 0, ''],
    ['tshadow', 'x_style', 'Text & shape', 'Text shadow', 'r', 0, 100, 10, 0, '%'],

    ['grain', 'x_effects', 'Overlays', 'Film grain', 'r', 0, 100, 10, 0, '%'],
    ['scan', 'x_effects', 'Overlays', 'Scanlines (retro TV)', 'r', 0, 100, 10, 0, '%'],
    ['letterbox', 'x_effects', 'Overlays', 'Cinema bars', 'r', 0, 15, 1, 0, '%'],
    ['edge', 'x_effects', 'Overlays', 'Edge glow', 'r', 0, 100, 10, 0, '%'],
    ['shift', 'x_effects', 'Screen care', 'Burn-in protection (tiny drift)', 't', false],
    ['idle', 'x_effects', 'Screen care', 'Dim when idle', 'c', ['off', '1 min', '2 min', '5 min', '10 min'], 'off'],
    ['idleLvl', 'x_effects', 'Screen care', 'Idle dim level', 'r', 30, 90, 10, 60, '%'],

    ['smooth', 'x_smooth', 'Smoothness', 'Smooth mode (GPU layers)', 't', true],
    ['blur', 'x_smooth', 'Smoothness', 'Glass blur', 'c', ['off', 'light', 'original'], 'off'],
    ['flat', 'x_smooth', 'Smoothness', 'Flat mode (no shadows)', 't', false],
    ['calm', 'x_smooth', 'Smoothness', 'Reduce animations', 't', false],
    ['smoothScroll', 'x_smooth', 'Smoothness', 'Smooth scrolling', 't', true],
    ['speed', 'x_smooth', 'Motion', 'Transition speed', 'c', Object.keys(SPEED), 'normal'],
    ['ease', 'x_smooth', 'Motion', 'Easing style', 'c', Object.keys(EASE), 'smooth'],
    ['noBars', 'x_smooth', 'Motion', 'Hide scrollbars', 't', true],

    ['safe', 'x_screen', 'Screen', 'Safe margin (fix cut-off edges)', 'r', 0, 10, 1, 0, '%'],
    ['zoom', 'x_screen', 'Screen', 'Screen zoom', 'r', 80, 120, 5, 100, '%'],
    ['noCursor', 'x_screen', 'Screen', 'Hide mouse pointer', 't', false],
    ['sound', 'x_screen', 'Sounds & controls', 'Navigation sounds', 'c', ['off', 'soft', 'click', 'glass', 'wood', 'pop'], 'off'],
    ['soundVol', 'x_screen', 'Sounds & controls', 'Sound volume', 'r', 10, 100, 10, 40, '%'],
    ['holdMs', 'x_screen', 'Sounds & controls', 'Hold OK for app menu', 'r', 300, 1200, 100, 600, 'ms'],
    ['backMode', 'x_screen', 'Sounds & controls', 'Back button goes to', 'c', ['previous', 'home'], 'previous'],

    ['w_clock', 'x_widgets', 'Widgets on the home screen', 'Big clock', 't', false],
    ['w_date', 'x_widgets', 'Widgets on the home screen', 'Date', 't', false],
    ['w_cal', 'x_widgets', 'Widgets on the home screen', 'Mini calendar', 't', false],
    ['w_wa', 'x_widgets', 'Widgets on the home screen', 'World clock A', 'c', TZ, 'Local'],
    ['w_wb', 'x_widgets', 'Widgets on the home screen', 'World clock B', 'c', TZ, 'Local'],
    ['w_day', 'x_widgets', 'Widgets on the home screen', 'Day progress', 't', false],
    ['w_year', 'x_widgets', 'Widgets on the home screen', 'Year progress', 't', false],
    ['w_moon', 'x_widgets', 'Widgets on the home screen', 'Moon phase', 't', false],
    ['w_net', 'x_widgets', 'Widgets on the home screen', 'Network status', 't', false],
    ['w_quote', 'x_widgets', 'Widgets on the home screen', 'Quote of the day', 't', false],
    ['w_sw', 'x_widgets', 'Timers', 'Stopwatch', 't', false],
    ['w_cd', 'x_widgets', 'Timers', 'Countdown', 't', false],
    ['w_pomo', 'x_widgets', 'Timers', 'Focus timer (25/5)', 't', false],
    ['act_sw', 'x_widgets', 'Timers', 'Stopwatch: start / stop', 'a', 'sw'],
    ['act_swr', 'x_widgets', 'Timers', 'Stopwatch: reset', 'a', 'swr'],
    ['act_cd', 'x_widgets', 'Timers', 'Countdown: add 5 min', 'a', 'cd5'],
    ['act_cds', 'x_widgets', 'Timers', 'Countdown: start / pause', 'a', 'cds'],
    ['act_cdr', 'x_widgets', 'Timers', 'Countdown: reset', 'a', 'cdr'],
    ['act_po', 'x_widgets', 'Timers', 'Focus timer: start / pause', 'a', 'po'],
    ['act_por', 'x_widgets', 'Timers', 'Focus timer: reset', 'a', 'por'],
    ['wPos', 'x_widgets', 'Widget style', 'Position', 'c', ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'], 'bottom-right'],
    ['wScope', 'x_widgets', 'Widget style', 'Show on', 'c', ['home only', 'every screen'], 'home only'],
    ['wSize', 'x_widgets', 'Widget style', 'Widget size', 'r', 70, 150, 10, 100, '%'],
    ['wAlpha', 'x_widgets', 'Widget style', 'Widget background', 'r', 0, 90, 10, 45, '%'],
    ['wCols', 'x_widgets', 'Widget style', 'Layout', 'c', ['stack', 'row'], 'stack'],
    ['arrange', 'x_apps', 'Rearrange', 'Rearrange mode: OK grabs an app, arrows move it, OK drops', 't', false],
    ['tileSize', 'x_apps', 'Tiles', 'Tile size', 'r', 60, 160, 10, 100, '%'],
    ['labels', 'x_apps', 'Tiles', 'Show app names under tiles', 't', false],
    ['iconStyle', 'x_apps', 'Tiles', 'Icon style', 'c', ['default', 'square', 'pill', 'outline', 'glass', 'neon'], 'default'],
    ['wpSlide', 'x_wall', 'Slideshow', 'Wallpaper slideshow', 'c', ['off', '1 min', '5 min', '15 min', '1 hour'], 'off'],
    ['wpTod', 'x_wall', 'Time of day', 'Wallpaper follows time of day', 't', false],
    ['wpDim', 'x_wall', 'Look', 'Wallpaper dimming', 'r', 0, 70, 5, 0, '%'],
    ['wpBlur', 'x_wall', 'Look', 'Wallpaper blur', 'r', 0, 20, 2, 0, 'px'],
    ['wpOff', 'x_wall', 'Solid color', 'Turn wallpaper off (use a solid color)', 't', false],
    ['wpColor', 'x_wall', 'Solid color', 'Background color', 'c', Object.keys(WPC), 'black'],
    ['perfMode', 'x_system', 'Performance', 'Performance mode', 'c', ['max beauty', 'balanced', 'fast', 'auto'], 'balanced'],
    ['saverMin', 'x_system', 'Screensaver', 'Start screensaver after (0 = off)', 'r', 0, 30, 1, 5, ' min'],
    ['autoBk', 'x_system', 'Backup & restore', 'Auto-backup once a day', 't', true],
    ['bk_a', 'x_system', 'Backup & restore', 'Restore the last auto-backup', 'a', 'bkla'],
    ['bk_r', 'x_system', 'Backup & restore', 'Reset everything to defaults (press twice)', 'a', 'reset'],
    ['bk_s1', 'x_system', 'Backup slot 1', 'Save backup to slot 1', 'a', 'bks1'],
    ['bk_l1', 'x_system', 'Backup slot 1', 'Restore slot 1', 'a', 'bkl1'],
    ['bk_s2', 'x_system', 'Backup slot 2', 'Save backup to slot 2', 'a', 'bks2'],
    ['bk_l2', 'x_system', 'Backup slot 2', 'Restore slot 2', 'a', 'bkl2'],
    ['bk_s3', 'x_system', 'Backup slot 3', 'Save backup to slot 3', 'a', 'bks3'],
    ['bk_l3', 'x_system', 'Backup slot 3', 'Restore slot 3', 'a', 'bkl3'],
    ['pf_s1', 'x_profiles', 'Profile 1', 'Save my current setup here', 'a', 'pfs1'],
    ['pf_l1', 'x_profiles', 'Profile 1', 'Switch to this profile', 'a', 'pfl1'],
    ['pf_s2', 'x_profiles', 'Profile 2', 'Save my current setup here', 'a', 'pfs2'],
    ['pf_l2', 'x_profiles', 'Profile 2', 'Switch to this profile', 'a', 'pfl2'],
    ['pf_s3', 'x_profiles', 'Profile 3', 'Save my current setup here', 'a', 'pfs3'],
    ['pf_l3', 'x_profiles', 'Profile 3', 'Switch to this profile', 'a', 'pfl3'],
    ['pf_s4', 'x_profiles', 'Profile 4', 'Save my current setup here', 'a', 'pfs4'],
    ['pf_l4', 'x_profiles', 'Profile 4', 'Switch to this profile', 'a', 'pfl4'],
    ['app_netflixw', 'x_store', 'Streaming', 'Netflix (web)', 't', false],
    ['app_youtubew', 'x_store', 'Streaming', 'YouTube (web)', 't', false],
    ['app_ytmusic', 'x_store', 'Music', 'YouTube Music', 't', false],
    ['app_primew', 'x_store', 'Streaming', 'Prime Video (web)', 't', false],
    ['app_disneyw', 'x_store', 'Streaming', 'Disney+ (web)', 't', false],
    ['app_hulu', 'x_store', 'Streaming', 'Hulu', 't', false],
    ['app_maxw', 'x_store', 'Streaming', 'Max', 't', false],
    ['app_peacock', 'x_store', 'Streaming', 'Peacock', 't', false],
    ['app_paramount', 'x_store', 'Streaming', 'Paramount+', 't', false],
    ['app_appletv', 'x_store', 'Streaming', 'Apple TV+', 't', false],
    ['app_crunchy', 'x_store', 'Streaming', 'Crunchyroll', 't', false],
    ['app_twitch', 'x_store', 'Streaming', 'Twitch', 't', false],
    ['app_kick', 'x_store', 'Streaming', 'Kick', 't', false],
    ['app_pluto', 'x_store', 'Streaming', 'Pluto TV', 't', false],
    ['app_tubi', 'x_store', 'Streaming', 'Tubi', 't', false],
    ['app_plex', 'x_store', 'Streaming', 'Plex', 't', false],
    ['app_vimeo', 'x_store', 'Streaming', 'Vimeo', 't', false],
    ['app_dailym', 'x_store', 'Streaming', 'Dailymotion', 't', false],
    ['app_spotifyw', 'x_store', 'Music', 'Spotify (web)', 't', false],
    ['app_soundc', 'x_store', 'Music', 'SoundCloud', 't', false],
    ['app_deezer', 'x_store', 'Music', 'Deezer', 't', false],
    ['app_tidal', 'x_store', 'Music', 'TIDAL', 't', false],
    ['app_radio', 'x_store', 'Music', 'Radio Garden', 't', false],
    ['app_gphotos', 'x_store', 'Tools', 'Google Photos', 't', false],
    ['app_gmaps', 'x_store', 'Tools', 'Google Maps', 't', false],
    ['app_wiki', 'x_store', 'Tools', 'Wikipedia', 't', false],
    ['app_news', 'x_store', 'Tools', 'Google News', 't', false],
    ['app_geforce', 'x_store', 'Games', 'GeForce NOW', 't', false],
    ['app_xcloud', 'x_store', 'Games', 'Xbox Cloud Gaming', 't', false],
    ['app_chess', 'x_store', 'Games', 'Chess.com', 't', false],
    ['app_poki', 'x_store', 'Games', 'Poki Games', 't', false],
    ['st_clear', 'x_store', 'Manage', 'Remove all added apps', 'a', 'clrstore']
  ].map(function (a) {
    var o = { id: a[0], tab: a[1], g: a[2], l: a[3], t: a[4] };
    if (o.t === 'r') { o.min = a[5]; o.max = a[6]; o.step = a[7]; o.def = a[8]; o.u = a[9]; }
    else if (o.t === 'c') { o.opts = a[5]; o.def = a[6]; }
    else if (o.t === 't') o.def = a[5];
    else if (o.t === 'a') o.run = a[5];
    return o;
  });
  var DEF = {}; C.forEach(function (o) { if ('def' in o) DEF[o.id] = o.def; });
  var TABS = {}; C.forEach(function (o) { (TABS[o.tab] = TABS[o.tab] || []).push(o.id); });
  var PRESETS = {
    Default: {}, Vivid: { saturation: 140, contrast: 110, brightness: 110 },
    Cinema: { contrast: 120, saturation: 90, vignette: 40, temp: 20, letterbox: 6 },
    'Bright room': { brightness: 160, contrast: 110, saturation: 120 }, 'MAX bright': { brightness: 200, contrast: 110, saturation: 110 },
    Night: { brightness: 70, night: 60, saturation: 80, dim: 15 }, Soft: { contrast: 90, saturation: 85, radius: 150, glass: 40 },
    'High contrast': { contrast: 150, saturation: 120, ringW: 4, weight: '600', border: 30 }, Mono: { gray: 100, contrast: 115 },
    Retro: { sepia: 60, saturation: 120, vignette: 50, scan: 40, grain: 30, font: 'mono' }, 'Big & clear': { size: 125, weight: '600', ringW: 4, tshadow: 30 }
  };
  var PN = Object.keys(PRESETS);

  var S = JSON.parse(JSON.stringify(DEF)), subs = [];
  try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv) for (var k in sv) if (k in DEF) S[k] = sv[k]; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var st = document.createElement('style'); (document.head || document.documentElement).appendChild(st);
  function hex(h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function rgba(h, a) { var c = hex(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function light(h, p) { return 'rgb(' + hex(h).map(function (v) { return Math.round(v + (255 - v) * p); }).join(',') + ')'; }
  var sx = 0, sy = 0, idleOn = false, compare = false;
  var NOISE = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='.9'/></svg>\")";


  // ---- Liquid Glass design layer: restyles every screen through the shared class names ----
  function LG(s) {
    var B = s.liquidBlur, H = s.liquidShine / 100, E = 'cubic-bezier(.2,1.25,.35,1)';
    var a = function (n) { return (n * H).toFixed(3); };
    var sheen = 'linear-gradient(135deg,rgba(255,255,255,' + (.05 + .17 * H).toFixed(3) + '),rgba(255,255,255,.03) 42%,rgba(255,255,255,' + a(.07) + '))';
    var rim = 'inset 0 1.5px 0 rgba(255,255,255,' + a(.5) + '),inset 0 -1px 0 rgba(255,255,255,' + a(.1) + '),inset 0 0 0 1px rgba(255,255,255,' + a(.14) + ')';
    var bf = 'none';
    return [
      '#root{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}',
      '#root h1,#root h2{letter-spacing:-.02em;text-shadow:none}',
      '#root [class*="blur-[140px]"]{filter:none!important;width:900px!important;height:900px!important;margin-top:-150px;-webkit-mask-image:radial-gradient(closest-side,#000 0%,rgba(0,0,0,.62) 35%,rgba(0,0,0,.2) 70%,transparent 100%);mask-image:radial-gradient(closest-side,#000 0%,rgba(0,0,0,.62) 35%,rgba(0,0,0,.2) 70%,transparent 100%);will-change:transform,opacity}',
      // big panels: real frosted glass
      '#root .glass,#root .glass-strong{-webkit-backdrop-filter:' + bf + '!important;backdrop-filter:' + bf + '!important;background:' + sheen + ',var(--glass)!important;border:1px solid rgba(255,255,255,' + a(.16) + ')!important;box-shadow:' + rim + ',0 34px 80px -28px rgba(0,0,0,.8)!important}',
      // small glass buttons (keys, pills, chips): no live blur per button, that was dozens of blur layers
      '#root button.glass,#root [data-focus].glass{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;box-shadow:' + rim + ',0 10px 22px -14px rgba(0,0,0,.7)!important}',
      // rows, cards, pills: cheap translucent glass (no per-item blur keeps scrolling smooth)
      '#root .bg-card,#root [class*="bg-card/"],#root .bg-secondary,#root [class*="bg-secondary/"]{background:' + sheen + ',rgba(14,16,32,.42)!important;box-shadow:' + rim + ',0 12px 30px -16px rgba(0,0,0,.7)}',
      '#root .bg-primary{background-image:linear-gradient(135deg,var(--primary),var(--primary-glow))!important;box-shadow:inset 0 1.5px 0 rgba(255,255,255,' + a(.5) + '),0 10px 28px -10px var(--primary)}',
      // focus: bright specular rim, soft glow, springy lift
      '#root [data-focus]{transition:transform .2s ' + E + ',background-color .15s ease,opacity .15s ease!important}',
      '#root [data-focus]:focus{will-change:transform;transform:scale(1.05) translateZ(0)!important;z-index:6;box-shadow:0 0 0 3px rgba(255,255,255,.95),0 0 18px 0 var(--ring)!important}',
      '#root .settings-item:focus{transform:scale(1.025)!important;background:linear-gradient(135deg,rgba(255,255,255,.28),rgba(255,255,255,.08))!important}',
      // screens glide in
      '#root .animate-birch-in{animation:lg-in .28s ' + E + ' both!important}',
      '@keyframes lg-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}',
      '#root [data-app]{border-radius:26px;overflow:hidden;box-shadow:inset 0 1.5px 0 rgba(255,255,255,' + a(.4) + '),inset 0 0 0 1px rgba(255,255,255,' + a(.14) + '),0 18px 36px -18px rgba(0,0,0,.8)}',
      '#root [data-app]::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(160deg,rgba(255,255,255,' + a(.26) + '),rgba(255,255,255,0) 44%)}',
      '#root .rounded-3xl,#root .rounded-2xl{border-radius:30px}'
    ].join('\n');
  }

  function css(s) {
    var o = [], f = [];
    if (s.wpOff) { var wc = WPC[s.wpColor] || '#000000'; o.push('img.animate-kenburns,img.animate-kenburns+div{display:none!important}html,body,#root{background:' + wc + '!important}:root,html.dark{--background:' + wc + '!important}'); }
    o.push('html.st-still .animate-kenburns,html.st-still .animate-ambient{animation-play-state:paused!important}');
    if (s.brightness !== 100) f.push('brightness(' + s.brightness / 100 + ')');
    if (s.contrast !== 100) f.push('contrast(' + s.contrast / 100 + ')');
    if (s.saturation !== 100) f.push('saturate(' + s.saturation / 100 + ')');
    if (s.hue) f.push('hue-rotate(' + s.hue + 'deg)');
    if (s.gray) f.push('grayscale(' + s.gray / 100 + ')');
    if (s.sepia) f.push('sepia(' + s.sepia / 100 + ')');
    if (s.invert) f.push('invert(1) hue-rotate(180deg)');
    var k = (1 - s.safe * 2 / 100) * s.zoom / 100, tr = '';
    if (k !== 1 || sx || sy) tr = 'transform:translate(' + sx + 'px,' + sy + 'px) scale(' + k + ');transform-origin:50% 50%;'; else if (s.smooth) tr = 'transform:translateZ(0);';
    o.push('#root{' + (f.length ? 'filter:' + f.join(' ') + ';' : '') + tr + (s.smooth ? 'backface-visibility:hidden;' : '') + '}');
    o.push('html{' + (s.size !== 100 ? 'font-size:' + s.size + '%;' : '') + (s.smoothScroll ? 'scroll-behavior:smooth;' : '') + '}');
    var v = [], sel = 'html,html #root,html #root [class*="theme-"]';
    if (SW[s.accent]) { var a = SW[s.accent]; v.push('--primary:' + a + '!important', '--primary-glow:' + light(a, .35) + '!important', '--ring:' + a + '!important'); }
    if (SW[s.accent2]) v.push('--accent:' + SW[s.accent2] + '!important');
    if (SW[s.ring]) v.push('--ring:' + SW[s.ring] + '!important');
    if (BGS[s.bg]) v.push('--background:' + BGS[s.bg] + '!important');
    if (s.radius !== 75) v.push('--radius:' + (s.radius / 100) + 'rem!important');
    if (SW[s.textColor]) v.push('--foreground:' + SW[s.textColor] + '!important');
    if (s.subtext) v.push('--muted-foreground:rgba(255,255,255,' + (s.subtext / 100).toFixed(2) + ')!important');
    if (s.border !== 10) v.push('--border:rgba(255,255,255,' + (s.border / 100).toFixed(2) + ')!important');
    if (s.glass !== 55) { v.push('--glass:rgba(11,12,26,' + (s.glass / 100).toFixed(2) + ')!important', '--glass-strong:rgba(4,4,17,' + Math.min(1, s.glass / 100 + .2).toFixed(2) + ')!important'); }
    if (s.speed !== 'normal') v.push('--default-transition-duration:' + SPEED[s.speed] + 'ms!important');
    v.push('--default-transition-timing-function:' + EASE[s.ease] + '!important');
    o.push(sel + '{' + v.join(';') + '}');
    if (s.speed !== 'normal') o.push('#root *{transition-duration:' + SPEED[s.speed] + 'ms!important}');
    if (s.ease !== 'smooth') o.push('#root *{transition-timing-function:' + EASE[s.ease] + '!important}');
    if (s.ringW) o.push('#root *:focus,#root *:focus-visible{outline:' + s.ringW + 'px solid var(--ring,#fff)!important;outline-offset:2px!important}');
    if (s.focusScale > 100) o.push('#root [data-focus]:focus{transform:scale(' + s.focusScale / 100 + ')!important}');
    if (s.focusGlow) o.push('#root [data-focus]:focus{box-shadow:0 0 ' + s.focusGlow + 'px ' + Math.round(s.focusGlow / 4) + 'px var(--ring,#9e70ff)!important}');
    if (s.focusPulse) o.push('@keyframes stp{0%,100%{filter:brightness(1)}50%{filter:brightness(1.35)}}#root [data-focus]:focus{animation:stp 1.4s ease-in-out infinite}');
    if (FONTS[s.font]) o.push('#root,#root *{font-family:' + FONTS[s.font] + '!important}');
    if (s.weight !== 'auto') o.push('#root,#root *{font-weight:' + s.weight + '!important}');
    if (s.tracking) o.push('#root,#root *{letter-spacing:' + (s.tracking / 100) + 'em!important}');
    if (s.tshadow) o.push('#root,#root *{text-shadow:0 1px ' + Math.round(2 + s.tshadow / 12) + 'px rgba(0,0,0,' + (s.tshadow / 120 + .15).toFixed(2) + ')}');
    o.push(XCSS(s)); o.push(xIcoCss());
    if (s.liquid) o.push(LG(s));
    else if (s.blur === 'off') o.push('#root *{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}');
    else if (s.blur === 'light') o.push('#root *{-webkit-backdrop-filter:blur(6px)!important;backdrop-filter:blur(6px)!important}');
    if (s.smooth) o.push('#root [class*="transition-transform"],#root [class*="animate-"]{will-change:transform}');
    if (s.calm) o.push('#root *,#root *::before,#root *::after{animation-duration:.001ms!important;animation-iteration-count:1!important}');
    if (s.flat) o.push('#root *{box-shadow:none!important}');
    if (s.noBars) o.push('#root *::-webkit-scrollbar{display:none!important}#root *{scrollbar-width:none!important}');
    if (s.noCursor) o.push('html,html *{cursor:none!important}');
    // overlays
    var vg = s.vignette ? 'radial-gradient(ellipse at center,rgba(0,0,0,0) ' + Math.round(70 - s.vignette * .35) + '%,rgba(0,0,0,' + (s.vignette / 100 * .85).toFixed(2) + ') 100%)' : '';
    var lb = s.letterbox ? 'linear-gradient(#000,#000) top/100% ' + s.letterbox + '% no-repeat,linear-gradient(#000,#000) bottom/100% ' + s.letterbox + '% no-repeat' : '';
    var sc = s.scan ? 'repeating-linear-gradient(0deg,rgba(0,0,0,' + (s.scan / 100 * .45).toFixed(2) + ') 0,rgba(0,0,0,' + (s.scan / 100 * .45).toFixed(2) + ') 1px,transparent 1px,transparent 3px)' : '';
    o.push('#st-vig{background:' + ([lb, sc, vg].filter(Boolean).join(',') || 'none') + ';' + (s.edge && SW[s.accent] !== undefined ? '' : '') + 'box-shadow:' + (s.edge ? 'inset 0 0 ' + (40 + s.edge) + 'px ' + Math.round(s.edge / 5) + 'px ' + rgba(SW[s.accent] || '#9e70ff', .55) : 'none') + '}');
    o.push('#st-grain{display:' + (s.grain ? 'block' : 'none') + ';opacity:' + (s.grain / 100 * .22).toFixed(3) + ';background-image:' + NOISE + '}');
    var ov = [];
    var dm = s.dim / 100; if (idleOn) dm = Math.max(dm, s.idleLvl / 100);
    if (dm) ov.push(rgba('#000000', dm));
    if (s.night) ov.push(rgba('#ff8a1e', s.night / 100 * .38));
    if (s.temp) ov.push(s.temp > 0 ? rgba('#ff9a3c', s.temp / 100 * .22) : rgba('#3c8cff', -s.temp / 100 * .22));
    if (SW[s.tint]) ov.push(rgba(SW[s.tint], s.tintAmt / 100));
    o.push('#st-ov{background:' + (ov.length ? ov.map(function (c) { return 'linear-gradient(' + c + ',' + c + ')'; }).join(',') : 'none') + ';transition:background .6s}');
    return o.join('\n');
  }
  var BASE = '#st-vig,#st-ov,#st-grain{position:fixed;inset:0;pointer-events:none;z-index:2147483000}#st-grain{background-size:160px 160px}' +
    '#st-dock{position:fixed;z-index:2147482000;display:none;gap:12px;pointer-events:none;color:#fff;font:500 16px system-ui,sans-serif;transform-origin:var(--o)}' +
    '#st-dock.stack{flex-direction:column}#st-dock.row{flex-direction:row;flex-wrap:wrap}' +
    '.stw{padding:12px 18px;border-radius:18px;background:rgba(8,9,20,var(--wa,.45));border:1px solid rgba(255,255,255,.1);min-width:150px;text-shadow:0 1px 6px rgba(0,0,0,.5)}' +
    '.stw b{display:block;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;opacity:.6;font-weight:600;margin-bottom:4px}.stw .big{font-size:40px;font-weight:700;line-height:1.1;font-variant-numeric:tabular-nums}' +
    '.stw .bar{height:6px;border-radius:3px;background:rgba(255,255,255,.2);margin-top:8px;overflow:hidden}.stw .bar i{display:block;height:100%;background:#8fb4ff}' +
    '.stw table{border-collapse:collapse;font-size:12px;text-align:center}.stw td{padding:2px 5px;opacity:.85}.stw td.t{background:#8fb4ff;color:#000;border-radius:50%;opacity:1;font-weight:700}' +
    '#st-menu{position:fixed;inset:0;z-index:2147483647;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.55)}#st-menu.on{display:flex}' +
    '#st-card{width:460px;max-height:86vh;overflow-y:auto;border-radius:26px;background:rgba(14,15,28,.97);border:1px solid rgba(255,255,255,.14);padding:22px;color:#f2f4ff;font:500 20px system-ui,sans-serif;scrollbar-width:none;box-shadow:0 20px 80px #000}' +
    '#st-card h2{margin:0 0 4px;font-size:28px}#st-card small{display:block;opacity:.55;margin-bottom:14px;font-size:14px;letter-spacing:1.5px;text-transform:uppercase}' +
    '#st-card button{display:block;width:100%;text-align:left;margin:6px 0;padding:13px 18px;border-radius:14px;border:2px solid transparent;background:rgba(255,255,255,.08);color:inherit;font:inherit;cursor:pointer}' +
    '#st-card button.a{border-color:#8fb4ff;background:rgba(143,180,255,.2)}#st-card button.d{color:#ff8a8a}' +
    '#st-toast{position:fixed;left:50%;bottom:60px;transform:translateX(-50%);z-index:2147483647;padding:10px 20px;border-radius:22px;background:rgba(0,0,0,.8);color:#fff;font:600 17px system-ui;display:none}#st-toast.on{display:block}';


  // ---- picture settings -> web apps & movies (WebAppActivity injects this string on every page) ----
  var lastWeb = null;
  // runs inside web pages (serialised with toString): picture filter only; page fullscreen is left untouched
  function injectFn(c) {
    try {
      var w = window, d = document; w.__bpc = c;
      if (!w.__bpi) {
        w.__bpi = 1;
        var vl = function (e) {
          var v = e.target; if (!v || v.tagName !== 'VIDEO') return;
          var rp = function (t) {
            try {
              var r = v.getBoundingClientRect(), q = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : {}, cs = getComputedStyle(v);
              console.log('BIRCHVID ' + t + ' ' + JSON.stringify({ rs: v.readyState, vw: v.videoWidth, vh: v.videoHeight, p: v.paused, ct: +v.currentTime.toFixed(1), r: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], vis: cs.visibility, op: cs.opacity, disp: cs.display, tot: q.totalVideoFrames, drop: q.droppedVideoFrames, src: (v.currentSrc || '').slice(0, 50) }));
            } catch (x) {}
          };
          rp(e.type);
          if (e.type === 'playing') [300, 1500].forEach(function (ms) {
            setTimeout(function () { rp('t' + ms); var o = v.style.opacity; v.style.opacity = '0.99'; setTimeout(function () { v.style.opacity = o; }, 60); try { w.dispatchEvent(new Event('resize')); } catch (x) {} }, ms);
          });
        };
        ['playing', 'loadeddata', 'error', 'stalled', 'waiting'].forEach(function (n) { d.addEventListener(n, vl, true); });
        w.__bpa = function () {
          var c = w.__bpc, h = d.documentElement; if (!h) return false;
          var s = d.getElementById('birch-pic'), o = d.getElementById('birch-pic-ov');
          if (c.off) { if (s) s.remove(); if (o) o.remove(); return true; }
          if (!s) { s = d.createElement('style'); s.id = 'birch-pic'; (d.head || h).appendChild(s); }
          s.textContent = c.f ? 'html{filter:' + c.f + '!important}' : '';
          if (c.ov) { if (!o) { o = d.createElement('div'); o.id = 'birch-pic-ov'; o.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:2147483647'; h.appendChild(o); } o.style.background = c.ov; } else if (o) o.remove();
          return true;
        };
      }
      if (!w.__bpa()) d.addEventListener('DOMContentLoaded', function () { w.__bpa(); });
    } catch (e) {}
  }
  var WEBJS = '(' + injectFn.toString() + ')(';
  function webPic(s, mode) {
    var f = [], ov = [], safe = mode !== 'full';
    if (safe) { var bb = s.brightness / 100; if (bb < 1) ov.push(rgba('#000000', Math.min(.85, 1 - bb))); else if (bb > 1) ov.push(rgba('#ffffff', Math.min(.5, (bb - 1) * .45))); }
    if (!safe) {
      if (s.brightness !== 100) f.push('brightness(' + s.brightness / 100 + ')');
      if (s.contrast !== 100) f.push('contrast(' + s.contrast / 100 + ')');
      if (s.saturation !== 100) f.push('saturate(' + s.saturation / 100 + ')');
      if (s.hue) f.push('hue-rotate(' + s.hue + 'deg)');
      if (s.gray) f.push('grayscale(' + s.gray / 100 + ')');
      if (s.sepia) f.push('sepia(' + s.sepia / 100 + ')');
      if (s.invert) f.push('invert(1) hue-rotate(180deg)');
    }
    var dm = s.dim / 100; if (idleOn) dm = Math.max(dm, s.idleLvl / 100);
    if (dm) ov.push(rgba('#000000', dm));
    if (s.night) ov.push(rgba('#ff8a1e', s.night / 100 * .38));
    if (s.temp) ov.push(s.temp > 0 ? rgba('#ff9a3c', s.temp / 100 * .22) : rgba('#3c8cff', -s.temp / 100 * .22));
    if (SW[s.tint]) ov.push(rgba(SW[s.tint], s.tintAmt / 100));
    var bg = ov.map(function (c) { return 'linear-gradient(' + c + ',' + c + ')'; });
    if (s.vignette) bg.push('radial-gradient(ellipse at center,rgba(0,0,0,0) ' + Math.round(70 - s.vignette * .35) + '%,rgba(0,0,0,' + (s.vignette / 100 * .85).toFixed(2) + ') 100%)');
    if (!f.length && !bg.length) return { off: 1 };
    return { f: f.join(' '), ov: bg.join(',') };
  }
  function pushWeb() {
    try {
      var b = window.BirchAndroid; if (!b || !b.setPicture) return;
      var o = (S.webMode === 'off' || compare) ? { off: 1 } : webPic(S, S.webMode);
      var js = WEBJS + JSON.stringify(o) + ");";
      if (js === lastWeb) return; lastWeb = js; b.setPicture(js);
    } catch (e) {}
  }

  var autoOv = {}, lvl = 0;
  var MODES = { 'max beauty': { liquidBlur: 48, liquidShine: 85 }, balanced: {}, fast: { liquidBlur: 10, liquidShine: 35, flat: true } };
  function eff() { var m = S.perfMode === 'auto' ? autoOv : (MODES[S.perfMode] || {}); return Object.assign({}, S, m); }
  var lastCss = ''; function apply() { var t_ = BASE + '\n' + css(compare ? DEF : eff()); if (t_ !== lastCss) { lastCss = t_; st.textContent = t_; } save(); pushWeb(); subs.forEach(function (f) { try { f(); } catch (e) {} }); }
  function el(t, id, c) { var e = document.createElement(t); if (id) e.id = id; if (c) e.className = c; return e; }

  // ---------- widgets ----------
  var sw = { run: false, t0: 0, acc: 0 }, cd = { run: false, end: 0, left: 300000 }, po = { run: false, end: 0, left: 1500000, work: true };
  function ms2(m) { m = Math.max(0, Math.round(m / 1000)); var h = (m / 3600) | 0, mi = ((m % 3600) / 60) | 0, s = m % 60; return (h ? h + ':' : '') + (h && mi < 10 ? '0' : '') + mi + ':' + (s < 10 ? '0' : '') + s; }
  function two(n) { return n < 10 ? '0' + n : '' + n; }
  function tzTime(z) { try { return new Date().toLocaleTimeString([], z === 'Local' ? { hour: 'numeric', minute: '2-digit' } : { hour: 'numeric', minute: '2-digit', timeZone: z }); } catch (e) { return '--'; } }
  function moon() { var d = (Date.now() / 86400000 - 10.6) % 29.530588; if (d < 0) d += 29.530588; var n = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'], i = Math.round(d / 29.530588 * 8) % 8, em = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘']; return em[i] + ' ' + n[i]; }
  function cal() { var n = new Date(), y = n.getFullYear(), m = n.getMonth(), f = new Date(y, m, 1).getDay(), dm = new Date(y, m + 1, 0).getDate(), h = '<table><tr>' + 'SMTWTFS'.split('').map(function (x) { return '<td>' + x + '</td>'; }).join('') + '</tr><tr>', c = 0, i; for (i = 0; i < f; i++, c++) h += '<td></td>'; for (i = 1; i <= dm; i++, c++) { if (c % 7 === 0 && i > 1) h += '</tr><tr>'; h += '<td' + (i === n.getDate() ? ' class="t"' : '') + '>' + i + '</td>'; } return h + '</tr></table>'; }
  var dock, view = 'home';
  function w(title, body) { return '<div class="stw"><b>' + title + '</b>' + body + '</div>'; }
  var lastDockH = '', dockTick = 0;
  function drawDock() {
    if (!dock) return;
    var any = C.some(function (o) { return o.id.indexOf('w_') === 0 && o.t === 't' && S[o.id]; }) || S.w_wa !== 'Local' && false;
    var show = (S.w_clock || S.w_date || S.w_cal || S.w_day || S.w_year || S.w_moon || S.w_net || S.w_quote || S.w_sw || S.w_cd || S.w_pomo || S.w_wa !== 'Local' || S.w_wb !== 'Local') && (S.wScope === 'every screen' || view === 'home');
    if (!show) { dock.style.display = 'none'; return; }
    var n = new Date(), h = '';
    if (S.w_clock) h += w('Time', '<div class="big">' + n.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + '</div>');
    if (S.w_date) h += w('Today', '<div style="font-size:22px;font-weight:600">' + n.toLocaleDateString([], { weekday: 'long' }) + '</div><div style="opacity:.8">' + n.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }) + '</div>');
    if (S.w_wa !== 'Local') h += w(S.w_wa.split('/').pop().replace('_', ' '), '<div class="big" style="font-size:30px">' + tzTime(S.w_wa) + '</div>');
    if (S.w_wb !== 'Local') h += w(S.w_wb.split('/').pop().replace('_', ' '), '<div class="big" style="font-size:30px">' + tzTime(S.w_wb) + '</div>');
    if (S.w_cal) h += w(n.toLocaleDateString([], { month: 'long' }), cal());
    if (S.w_day) { var p = (n.getHours() * 60 + n.getMinutes()) / 1440 * 100; h += w('Day progress', Math.round(p) + '%<div class="bar"><i style="width:' + p + '%"></i></div>'); }
    if (S.w_year) { var y0 = new Date(n.getFullYear(), 0, 1), p2 = (n - y0) / (new Date(n.getFullYear() + 1, 0, 1) - y0) * 100; h += w(n.getFullYear() + ' progress', Math.round(p2) + '%<div class="bar"><i style="width:' + p2 + '%"></i></div>'); }
    if (S.w_moon) h += w('Moon', moon());
    if (S.w_net) { var cn = navigator.connection; h += w('Network', (navigator.onLine ? '● Online' : '○ Offline') + (cn && cn.effectiveType ? ' · ' + cn.effectiveType : '') + (cn && cn.downlink ? ' · ' + cn.downlink + ' Mbps' : '')); }
    if (S.w_quote) h += w('Quote', '<div style="max-width:260px;font-size:15px">' + QUOTES[((n / 86400000) | 0) % QUOTES.length] + '</div>');
    if (S.w_sw) h += w('Stopwatch', '<div class="big">' + ms2(sw.run ? sw.acc + Date.now() - sw.t0 : sw.acc) + '</div>');
    if (S.w_cd) { var l = cd.run ? cd.end - Date.now() : cd.left; if (cd.run && l <= 0) { cd.run = false; cd.left = 0; l = 0; toast('⏰ Countdown finished'); beep(880, .4, 'sine'); } h += w('Countdown', '<div class="big">' + ms2(l) + '</div>'); }
    if (S.w_pomo) { var q = po.run ? po.end - Date.now() : po.left; if (po.run && q <= 0) { po.work = !po.work; po.left = po.work ? 1500000 : 300000; po.end = Date.now() + po.left; q = po.left; toast(po.work ? 'Focus time' : 'Break time'); beep(660, .35, 'sine'); } h += w(po.work ? 'Focus' : 'Break', '<div class="big">' + ms2(q) + '</div>'); }
    if (h !== lastDockH) { dock.innerHTML = h; lastDockH = h; } dock.style.display = 'flex';
    var pos = S.wPos.split('-'), a = { top: 'auto', bottom: 'auto', left: 'auto', right: 'auto', transform: 'none' };
    a[pos[0]] = '28px'; if (pos[1] === 'center') { a.left = '50%'; a.transform = 'translateX(-50%) scale(' + S.wSize / 100 + ')'; } else { a[pos[1]] = '28px'; a.transform = 'scale(' + S.wSize / 100 + ')'; }
    for (var kk in a) dock.style[kk] = a[kk];
    dock.style.setProperty('--o', pos[0] + ' ' + (pos[1] === 'center' ? 'center' : pos[1])); dock.style.setProperty('--wa', S.wAlpha / 100);
    dock.className = S.wCols;
  }
  function runAct(r) {
    if (extraAct(r)) { apply(); drawDock(); return; }
    var n = Date.now();
    if (r === 'sw') { if (sw.run) { sw.acc += n - sw.t0; sw.run = false; } else { sw.t0 = n; sw.run = true; } S.w_sw = true; }
    else if (r === 'swr') { sw.run = false; sw.acc = 0; }
    else if (r === 'cd5') { cd.left += 300000; if (cd.run) cd.end += 300000; S.w_cd = true; }
    else if (r === 'cds') { if (cd.run) { cd.left = cd.end - n; cd.run = false; } else if (cd.left > 0) { cd.end = n + cd.left; cd.run = true; } S.w_cd = true; }
    else if (r === 'cdr') { cd.run = false; cd.left = 300000; }
    else if (r === 'po') { if (po.run) { po.left = po.end - n; po.run = false; } else { po.end = n + po.left; po.run = true; } S.w_pomo = true; }
    else if (r === 'por') { po.run = false; po.work = true; po.left = 1500000; }
    toast('Done'); apply(); drawDock();
  }

  // ---------- toast / sound ----------
  var tt, toastEl, ac;
  function toast(t) { if (!toastEl) return; toastEl.textContent = t; toastEl.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove('on'); }, 1600); }
  function beep(f, d, type) {
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); var o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.value = 0.0001; o.connect(g); g.connect(ac.destination); var t = ac.currentTime, v = Math.max(.02, S.soundVol / 100 * .25); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.start(t); o.stop(t + d + .02); } catch (e) {}
  }

  // ---------- app action menu (hold OK) ----------
  var menu, card, mi = 0, mItems = [], curApp = null, confirmUn = false;
  function B() { return window.__bs; }
  function favs() { return B().get().favorites.slice(); }
  function setFav(a) { B().set({ favorites: a }); }
  function openMenu(tile) {
    var id = tile.getAttribute('data-app'), b = B(); if (!b) return;
    var app = b.apps().filter(function (x) { return x.id === id; })[0] || { id: id, name: tile.getAttribute('aria-label') || id };
    curApp = { id: id, name: app.name, el: tile, cat: app.category }; confirmUn = false; mi = 0; buildMenu(); menu.classList.add('on');
  }
  function closeMenu(refocus) { menu.classList.remove('on'); if (refocus && curApp && curApp.el && document.contains(curApp.el)) try { curApp.el.focus(); } catch (e) {} }
  function buildMenu() {
    var b = B(), s = b.get(), id = curApp.id, f = favs(), isF = f.indexOf(id) >= 0, hid = s.hiddenApps.indexOf(id) >= 0, ix = f.indexOf(id), items = [];
    items.push(['▶  Open', function () { var el = curApp.el; closeMenu(); el.click(); }]);
    items.push([isF ? '📌  Unpin from home dock' : '📌  Pin to home dock', function () { setFav(isF ? f.filter(function (x) { return x !== id; }) : [id].concat(f)); }]);
    if (isF) {
      items.push(['⏫  Move to front', function () { setFav([id].concat(f.filter(function (x) { return x !== id; }))); }]);
      if (ix > 0) items.push(['◀  Move left', function () { f.splice(ix, 1); f.splice(ix - 1, 0, id); setFav(f); }]);
      if (ix < f.length - 1) items.push(['▶  Move right', function () { f.splice(ix, 1); f.splice(ix + 1, 0, id); setFav(f); }]);
    }
    items.push([hid ? '👁  Unhide app' : '🙈  Hide app', function () { var h = s.hiddenApps.slice(), i = h.indexOf(id); if (i >= 0) h.splice(i, 1); else h.push(id); b.set({ hiddenApps: h }); }]);
    items.push(['🗂  Folder: ' + folderOf(s, id) + ' →', function () { var L = b.folders, cur = folderOf(s, id), nx = L[(L.indexOf(cur) + 1) % L.length], fo = Object.assign({}, s.folders); fo[id] = nx; b.set({ folders: fo }); }]);
    if (s.customLabels && s.customLabels[id]) items.push(['↺  Reset custom name', function () { var c = Object.assign({}, s.customLabels); delete c[id]; b.set({ customLabels: c }); }]);
    if (b.android()) {
      items.push(['ℹ️  App info', function () { closeMenu(); b.info(id); }]);
      items.push([confirmUn ? '⚠  Press OK again to UNINSTALL' : '🗑  Uninstall', function () { if (!confirmUn) { confirmUn = true; return 'keep'; } closeMenu(); b.uninstall(id); }, 'd']);
    }
    items.push(['✕  Close', function () { closeMenu(true); }]);
    mItems = items; card.innerHTML = '<small>App actions</small><h2></h2>'; card.querySelector('h2').textContent = (s.customLabels && s.customLabels[id]) || curApp.name;
    items.forEach(function (it, i) { var bt = document.createElement('button'); bt.textContent = it[0]; if (it[2]) bt.className = it[2]; bt.onclick = function () { mi = i; runItem(); }; card.appendChild(bt); });
    markMenu();
  }
  function folderOf(s, id) { var c = (curApp && curApp.cat) || 'Tools'; return s.folders[id] || (c === 'Games' ? 'Gaming' : c === 'Utilities' || c === 'Browsers' ? 'Tools' : c); }
  function markMenu() { var bs = card.querySelectorAll('button'); for (var i = 0; i < bs.length; i++) { var d = mItems[i][2] ? ' ' + mItems[i][2] : ''; bs[i].className = (i === mi ? 'a' : '') + d; if (i === mi && bs[i].scrollIntoView) bs[i].scrollIntoView({ block: 'nearest' }); } }
  function runItem() { var r = mItems[mi][1](); if (menu.classList.contains('on')) { if (r !== 'keep') toast('Done'); buildMenu(); } }

  // ---------- keys ----------
  var holdT = null, holdEl = null, fired = false;
  function onKey(e) {
    var k = e.key;
    if (menu && menu.classList.contains('on')) {
      e.stopImmediatePropagation(); e.preventDefault(); if (e.type !== 'keydown') return;
      if (k === 'ArrowDown') { mi = Math.min(mItems.length - 1, mi + 1); markMenu(); beepNav(); }
      else if (k === 'ArrowUp') { mi = Math.max(0, mi - 1); markMenu(); beepNav(); }
      else if (k === 'Enter' && !e.repeat) runItem();
      else if (k === 'Escape' || k === 'Backspace' || k === 'ContextMenu' || k === 'GoBack' || k === 'BrowserBack') closeMenu(true);
      return;
    }
    if (e.type === 'keydown') { if (!e.repeat && (k.indexOf('Arrow') === 0 || k === 'Enter')) beepNav(k === 'Enter'); resetIdle(); }
    if (storeOpen && (e.type === 'keydown' || e.type === 'keyup' || e.type === 'keypress')) { storeKey(e, k); return; }
    if (arrangeKey(e, k)) return;
    // hold OK on an app tile
    var tile = e.target && e.target.closest ? e.target.closest('[data-app]') : null;
    if (k === 'Enter' && tile && window.__bs) {
      if (e.type === 'keydown') {
        e.stopImmediatePropagation(); e.preventDefault();
        if (!e.repeat) { fired = false; holdEl = tile; clearTimeout(holdT); holdT = setTimeout(function () { fired = true; openMenu(holdEl); }, S.holdMs); }
      } else if (e.type === 'keyup') {
        e.stopImmediatePropagation(); e.preventDefault(); clearTimeout(holdT);
        if (!fired && holdEl) { var h = holdEl; holdEl = null; h.click(); }
      } else { e.stopImmediatePropagation(); e.preventDefault(); }
    }
  }
  function beepNav(ok) { if (S.sound === 'off') return; if (S.sound === 'glass') beep(ok ? 1320 : 990, .07, 'sine'); else if (S.sound === 'wood') beep(ok ? 330 : 262, .045, 'triangle'); else if (S.sound === 'pop') beep(ok ? 780 : 640, .04, 'triangle'); else if (S.sound === 'soft') beep(ok ? 520 : 420, .06, 'sine'); else beep(ok ? 900 : 1200, .03, 'square'); }
  ['keydown', 'keyup', 'keypress'].forEach(function (t) { window.addEventListener(t, onKey, true); });

  // idle dim
  var idleT;
  function resetIdle() { if (idleOn) { idleOn = false; apply(); } clearTimeout(idleT); var m = { '1 min': 1, '2 min': 2, '5 min': 5, '10 min': 10 }[S.idle]; if (m) idleT = setTimeout(function () { idleOn = true; apply(); }, m * 60000); }
  window.addEventListener('pointermove', resetIdle, true);
  setInterval(function () { if (sw.run || cd.run || po.run || ++dockTick % 10 === 0) drawDock(); }, 1000);
  setInterval(function () { if (S.shift) { sx = Math.round(Math.random() * 6 - 3); sy = Math.round(Math.random() * 6 - 3); } else { if (!sx && !sy) return; sx = sy = 0; } apply(); }, 60000);


  // ---------- v33: app store, profiles, backups, rearranging, wallpaper+, performance ----------
  var CAT = [["netflixw", "Netflix (web)", "https://www.netflix.com", "Streaming", "#000000", "#E50914"], ["youtubew", "YouTube (web)", "https://www.youtube.com/tv", "Streaming", "#FFFFFF", "#FF0000"], ["ytmusic", "YouTube Music", "https://music.youtube.com", "Music", "#120000", "#FF4E45"], ["primew", "Prime Video (web)", "https://www.primevideo.com", "Streaming", "#0F171E", "#1AC8FF"], ["disneyw", "Disney+ (web)", "https://www.disneyplus.com", "Streaming", "#0B1230", "#7FB2FF"], ["hulu", "Hulu", "https://www.hulu.com", "Streaming", "#06150C", "#1CE783"], ["maxw", "Max", "https://play.max.com", "Streaming", "#0A0A24", "#8A7BFF"], ["peacock", "Peacock", "https://www.peacocktv.com", "Streaming", "#0A0A0A", "#FFD43B"], ["paramount", "Paramount+", "https://www.paramountplus.com", "Streaming", "#001B4D", "#4DA3FF"], ["appletv", "Apple TV+", "https://tv.apple.com", "Streaming", "#0A0A0A", "#F5F5F7"], ["crunchy", "Crunchyroll", "https://www.crunchyroll.com", "Streaming", "#1A0F00", "#F47521"], ["twitch", "Twitch", "https://www.twitch.tv", "Streaming", "#12091F", "#A970FF"], ["kick", "Kick", "https://kick.com", "Streaming", "#051200", "#53FC18"], ["pluto", "Pluto TV", "https://pluto.tv", "Streaming", "#0C0C1A", "#F4D03F"], ["tubi", "Tubi", "https://tubitv.com", "Streaming", "#16041F", "#FA382F"], ["plex", "Plex", "https://app.plex.tv", "Streaming", "#1A1405", "#E5A00D"], ["vimeo", "Vimeo", "https://vimeo.com", "Streaming", "#00121A", "#1AB7EA"], ["dailym", "Dailymotion", "https://www.dailymotion.com", "Streaming", "#000B1F", "#3D8BFF"], ["spotifyw", "Spotify (web)", "https://open.spotify.com", "Music", "#04120A", "#1DB954"], ["soundc", "SoundCloud", "https://soundcloud.com", "Music", "#1A0A00", "#FF5500"], ["deezer", "Deezer", "https://www.deezer.com", "Music", "#120A1A", "#A238FF"], ["tidal", "TIDAL", "https://listen.tidal.com", "Music", "#000000", "#33FFEE"], ["radio", "Radio Garden", "https://radio.garden", "Music", "#04120F", "#2DD4A8"], ["gphotos", "Google Photos", "https://photos.google.com", "Tools", "#0B1220", "#8AB4F8"], ["gmaps", "Google Maps", "https://www.google.com/maps", "Tools", "#07140E", "#34A853"], ["wiki", "Wikipedia", "https://www.wikipedia.org", "Tools", "#0A0A0A", "#E5E7EB"], ["news", "Google News", "https://news.google.com", "Tools", "#0B1220", "#8AB4F8"], ["geforce", "GeForce NOW", "https://play.geforcenow.com", "Games", "#0B1400", "#76B900"], ["xcloud", "Xbox Cloud Gaming", "https://www.xbox.com/play", "Games", "#04140A", "#107C10"], ["chess", "Chess.com", "https://www.chess.com", "Games", "#0F1405", "#81B64C"], ["poki", "Poki Games", "https://poki.com", "Games", "#0A0F24", "#47B4FF"]];
  function extra() { return CAT.filter(function (c) { return S['app_' + c[0]]; }).map(function (c) { return { id: 'web:' + c[2], name: c[1], label: c[1], bg: c[4], fg: c[5], category: c[3], x: true }; }); }
  function refresh() { var b = B(); if (b) try { b.set({}); } catch (e) {} }
  var BSK = ['layout', 'focusStyle', 'userName', 'avatar', 'favorites', 'hiddenApps', 'customLabels', 'sortMode', 'iconScale', 'theme', 'wallpaper', 'dim', 'blur', 'motion', 'performance', 'homeRows', 'hiddenRows', 'folders', 'font', 'bold', 'italic', 'caps', 'corners', 'clock24', 'showSeconds', 'appNames', 'widgets', 'screensaverMinutes'];
  function snap() { var b = B(), o = {}; if (b) { var g = b.get(); BSK.forEach(function (k) { if (k in g) o[k] = g[k]; }); } return JSON.parse(JSON.stringify({ t: Date.now(), s: S, b: o })); }
  function restore(sn) { if (!sn || !sn.s) return false; S = Object.assign(JSON.parse(JSON.stringify(DEF)), sn.s); var b = B(); if (b && sn.b) b.set(sn.b); save(); apply(); drawDock(); refresh(); return true; }
  function store(key) { try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) { return {}; } }
  function put(key, slot, v) { var o = store(key); o[slot] = v; try { localStorage.setItem(key, JSON.stringify(o)); } catch (e) {} }
  var resetT = 0;
  function extraAct(r) {
    var m = /^(pfs|pfl|bks|bkl)(\d)$/.exec(r);
    if (m) {
      var prof = m[1].charAt(0) === 'p', key = prof ? 'birch-profiles' : 'birch-backups', nm = (prof ? 'profile ' : 'slot ') + m[2];
      if (m[1].charAt(2) === 's') { put(key, m[2], snap()); toast('Saved to ' + nm); }
      else toast(restore(store(key)[m[2]]) ? 'Loaded ' + nm : 'That ' + nm + ' is empty');
      return true;
    }
    if (r === 'bkla') { toast(restore(store('birch-backups').auto) ? 'Restored the auto-backup' : 'No auto-backup yet'); return true; }
    if (r === 'reset') { if (Date.now() - resetT < 5000) { S = JSON.parse(JSON.stringify(DEF)); save(); resetT = 0; toast('Look settings reset'); } else { resetT = Date.now(); toast('Press again within 5 seconds to confirm'); } return true; }
    if (r === 'clrstore') { CAT.forEach(function (c) { S['app_' + c[0]] = false; }); refresh(); toast('Added apps removed'); return true; }
    return false;
  }
  var BSMAP = { tileSize: function (v) { return { iconScale: v / 100 }; }, labels: function (v) { return { appNames: !!v }; }, wpDim: function (v) { return { dim: v }; }, wpBlur: function (v) { return { blur: v }; }, saverMin: function (v) { return { screensaverMinutes: v }; } };
  function afterSet(id, v) {
    var b = B(); if (!b) return;
    if (BSMAP[id]) b.set(BSMAP[id](v));
    else if (id.indexOf('app_') === 0) refresh();
    else if (id === 'perfMode') { lvl = 0; autoOv = {}; b.set({ performance: v === 'fast' ? 'lightweight' : v === 'max beauty' ? 'visual' : 'balanced' }); }
    else if (id === 'arrange' && !v) drop();
    else if (id === 'wpSlide') slT = 0;
  }
  // first run: start the sliders from the values the launcher already has
  setTimeout(function () {
    var b = B(), raw = {}; if (!b) return; try { raw = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
    var g = b.get(), ch = false;
    if (!('tileSize' in raw)) { S.tileSize = Math.round((g.iconScale || 1) * 100); ch = true; }
    if (!('wpDim' in raw)) { S.wpDim = g.dim || 0; ch = true; }
    if (!('wpBlur' in raw)) { S.wpBlur = g.blur || 0; ch = true; }
    if (!('saverMin' in raw)) { S.saverMin = g.screensaverMinutes == null ? 5 : g.screensaverMinutes; ch = true; }
    if (!('labels' in raw)) { S.labels = !!g.appNames; ch = true; }
    if (ch) apply();
    var bk = store('birch-backups'); if (S.autoBk && (!bk.auto || Date.now() - bk.auto.t > 864e5)) put('birch-backups', 'auto', snap());
  }, 1500);
  // wallpaper slideshow / time of day
  var WPS = ['moonblade', 'moonlake', 'horizon', 'silk', 'nightdrive'], slT = 0, slI = 0, lastTod = '';
  function setWp(id) { var b = B(); if (!b) return; var g = b.get(), w = Object.assign({}, g.wallpaper); w[g.layout] = id; b.set({ wallpaper: w }); }
  setInterval(function () {
    if (!B()) return; var now = Date.now();
    if (S.wpTod) { var h = new Date().getHours(), id = h >= 5 && h < 11 ? 'horizon' : h >= 11 && h < 17 ? 'silk' : h >= 17 && h < 21 ? 'moonblade' : 'nightdrive'; if (id !== lastTod) { lastTod = id; setWp(id); } return; }
    lastTod = ''; var ms = { '1 min': 6e4, '5 min': 3e5, '15 min': 9e5, '1 hour': 36e5 }[S.wpSlide];
    if (ms && now - slT >= ms) { slT = now; slI = (slI + 1) % WPS.length; setWp(WPS[slI]); }
  }, 5000);
  // rearrange mode: OK grabs an app, arrows move it in the dock, OK drops
  var grab = null;
  function grabEl() { return grab ? document.querySelector('[data-app="' + grab.replace(/"/g, '\\"') + '"]') : null; }
  function pick(tl) { var id = tl.getAttribute('data-app'), f = favs(); if (f.indexOf(id) < 0) { setFav(f.concat([id])); toast('Pinned to the dock. Arrows move it, OK drops'); } else toast('Grabbed. Arrows move it, OK drops'); grab = id; tl.classList.add('st-grab'); }
  function moveGrab(d) { var f = favs().slice(), i = f.indexOf(grab), j = i + d; if (i < 0 || j < 0 || j >= f.length) return; var t = f[i]; f[i] = f[j]; f[j] = t; setFav(f); setTimeout(function () { var el = grabEl(); if (el) { el.focus(); el.classList.add('st-grab'); } }, 120); }
  function drop() { var el = grabEl(); if (el) el.classList.remove('st-grab'); if (grab) toast('Dropped'); grab = null; }
  function arrangeKey(e, k) {
    if (!S.arrange || !window.__bs) return false;
    var tl = e.target && e.target.closest ? e.target.closest('[data-app]') : null, kd = e.type === 'keydown';
    if (grab) {
      var dir = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[k];
      if (dir) { e.preventDefault(); e.stopImmediatePropagation(); if (kd) moveGrab(dir); return true; }
      if (k === 'Enter' || k === 'Escape' || k === 'Backspace' || k === 'GoBack' || k === 'BrowserBack') { e.preventDefault(); e.stopImmediatePropagation(); if (kd && !e.repeat) drop(); return true; }
    } else if (k === 'Enter' && tl) { e.preventDefault(); e.stopImmediatePropagation(); if (kd && !e.repeat) pick(tl); return true; }
    return false;
  }
  function XCSS(s) {
    var o = [], t = s.iconStyle;
    if (t === 'square') o.push('#root [data-app]{border-radius:8px!important}');
    else if (t === 'pill') o.push('#root [data-app]{border-radius:999px!important}');
    else if (t === 'outline') o.push('#root [data-app]{background:transparent!important;box-shadow:inset 0 0 0 2px rgba(255,255,255,.55)!important}');
    else if (t === 'glass') o.push('#root [data-app]{background:linear-gradient(135deg,rgba(255,255,255,.22),rgba(255,255,255,.06))!important;-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:inset 0 1.5px 0 rgba(255,255,255,.5)!important}');
    else if (t === 'neon') o.push('#root [data-app]{background:#05060f!important;box-shadow:0 0 0 2px var(--ring),0 0 22px -2px var(--ring)!important}');
    o.push('#root .st-grab{outline:4px dashed #fff!important;outline-offset:5px!important;z-index:9!important}');
    return o.join('\n');
  }
  // auto performance: if the screen is choppy while you navigate, lighten the glass step by step
  var fr = { n: 0, t0: 0 }, lastKeyT = 0, bad = 0, good = 0, LV = [{}, { liquidBlur: 24 }, { liquidBlur: 14, liquidShine: 40 }, { liquidBlur: 8, liquidShine: 25, flat: true }, { liquid: false, flat: true }];
  (function () { var t = 0, still = false; function chk() { t = 0; var on = !!document.querySelector('#root .glass,#root .glass-strong'); if (on !== still) { still = on; document.documentElement.classList.toggle('st-still', on); } }
    function q() { if (!t) t = setTimeout(chk, 300); }
    window.addEventListener('keydown', q, true); window.addEventListener('click', q, true); setInterval(chk, 4000); setTimeout(chk, 1500); })();
  var ticking = false;
  window.addEventListener('keydown', function () { lastKeyT = Date.now(); if (S.perfMode === 'auto' && !ticking) { ticking = true; fr.t0 = 0; fr.n = 0; requestAnimationFrame(tick); } }, true);
  function tick(t) {
    if (!fr.t0) fr.t0 = t; fr.n++;
    if (t - fr.t0 >= 3000) {
      var fps = fr.n * 1000 / (t - fr.t0); fr.n = 0; fr.t0 = t;
      if (S.perfMode === 'auto' && Date.now() - lastKeyT < 4000) {
        if (fps < 38) { bad++; good = 0; } else if (fps > 55) { good++; bad = 0; } else { bad = 0; good = 0; }
        if (bad >= 2 && lvl < LV.length - 1) { lvl++; bad = 0; autoOv = LV[lvl]; apply(); toast('Auto performance: lighter visuals'); }
        else if (good >= 8 && lvl > 0) { lvl--; good = 0; autoOv = LV[lvl]; apply(); }
      }
    }
    if (S.perfMode === 'auto' && Date.now() - lastKeyT < 6000) requestAnimationFrame(tick); else ticking = false;
  }



  // ---------- v34: Get Apps (real Android app store: finds the latest APK, the launcher installs it, then pins it) ----------
  var SCAT = [
    { n: 'SmartTube', p: 'com.teamsmart.videomanager.tv', d: 'YouTube made for TV: no ads, SponsorBlock', c: '#FF4E45', gh: 'yuliskov/SmartTube' },
    { n: 'NewPipe', p: 'org.schabi.newpipe', d: 'Lightweight YouTube client', c: '#E53935', gh: 'TeamNewPipe/NewPipe' },
    { n: 'LibreTube', p: 'com.github.libretube', d: 'Privacy friendly YouTube frontend', c: '#EF5350', gh: 'libre-tube/LibreTube' },
    { n: 'Jellyfin', p: 'org.jellyfin.androidtv', d: 'Stream your own media server', c: '#7B5CFF', gh: 'jellyfin/jellyfin-androidtv' },
    { n: 'Findroid', p: 'dev.jdtech.jellyfin', d: 'Modern Jellyfin client', c: '#3A86FF', gh: 'jarnedemeulemeester/findroid' },
    { n: 'VLC', p: 'org.videolan.vlc', d: 'Plays almost any video or audio', c: '#FF8800', fd: 1 },
    { n: 'mpv', p: 'is.xyz.mpv', d: 'Powerful, minimal video player', c: '#6C4AB6', gh: 'mpv-android/mpv-android' },
    { n: 'Moonlight', p: 'com.limelight', d: 'Stream PC games to your TV', c: '#34D399', gh: 'moonlight-stream/moonlight-android' },
    { n: 'Material Files', p: 'me.zhanghai.android.files', d: 'Clean, fast file manager', c: '#26A69A', gh: 'zhanghai/MaterialFiles' },
    { n: 'Termux', p: 'com.termux', d: 'Terminal for power users', c: '#10B981', gh: 'termux/termux-app' },
    { n: 'F-Droid', p: 'org.fdroid.fdroid', d: 'Huge catalog of open-source apps', c: '#1976D2', direct: 'https://f-droid.org/F-Droid.apk' },
    { n: 'More apps', p: '', d: 'Browse APKPure and download anything', c: '#34D399', web: 'https://apkpure.com' }
  ];
  var storeEl = null, storeOpen = false, zone = 'grid', gSel = 0, tSel = 0, instMap = {}, items = [], loadId = 0, cache = {}, srchT = 0, curQ = '';
  var STABS = [
    ['Picks', null], ['Trending', ['netflix', 'youtube', 'spotify', 'tiktok', 'disney', 'hbo']], ['Movies & TV', ['movies', 'tv shows', 'streaming tv', 'kodi', 'plex']],
    ['Video & YouTube', ['youtube', 'video player', 'smarttube', 'twitch']], ['Music', ['music player', 'spotify', 'radio', 'podcast']], ['Games', ['games', 'emulator', 'racing', 'minecraft']],
    ['Live TV & Sports', ['live tv', 'iptv', 'sports', 'news']], ['Tools', ['file manager', 'vpn', 'browser', 'launcher', 'cleaner']], ['Kids', ['kids', 'cartoon', 'learning']]
  ];
  function pend() { try { return JSON.parse(localStorage.getItem('birch-pending') || '[]'); } catch (e) { return []; } }
  function setPend(a) { try { localStorage.setItem('birch-pending', JSON.stringify(a)); } catch (e) {} }
  function installedMap() { var b = B(), m = {}; if (!b) return m; window.__bsD = 1; try { b.apps().forEach(function (a) { m[a.id] = true; }); } catch (e) {} return m; }
  function rank(n) { if (/debug|unsigned|sources/i.test(n)) return 20; if (/x86|x64/i.test(n)) return 15; if (/universal/i.test(n)) return 0; if (/arm64|aarch64|v8a/i.test(n)) return 3; if (/armeabi|v7a|arm32/i.test(n)) return 2; return 1; }
  function px(u) { return window.BirchAndroid ? '/__p?u=' + encodeURIComponent(u) : u; }
  function getJSON(u) { return fetch(px(u)).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); }); }
  function resolveApk(e) {
    if (e.url) return Promise.resolve(e.url);
    if (e.direct) return Promise.resolve(e.direct);
    if (e.gh) return getJSON('https://api.github.com/repos/' + e.gh + '/releases/latest').then(function (j) {
      var as = (j.assets || []).filter(function (a) { return /\.apk$/i.test(a.name); }).sort(function (x, y) { return rank(x.name) - rank(y.name); });
      if (!as.length) throw new Error('no apk'); return as[0].browser_download_url;
    });
    return getJSON('https://f-droid.org/api/v1/packages/' + e.p).then(function (j) {
      var code = j.suggestedVersionCode || (j.packages && j.packages[0] && j.packages[0].versionCode); if (!code) throw new Error('no version');
      return 'https://f-droid.org/repo/' + e.p + '_' + code + '.apk';
    });
  }
  function openUrl(u) { var a = window.BirchAndroid; if (a && a.openWebApp) a.openWebApp(u); else window.open(u, '_blank'); }
  function storeSay(t) { var m = storeEl && storeEl.querySelector('.ss-m'); if (m) m.textContent = t; }
  function fmtN(n) { n = +n || 0; return n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : '' + n; }
  function fmtS(b) { b = +b || 0; return b >= 1e9 ? (b / 1e9).toFixed(1) + ' GB' : b >= 1e6 ? Math.round(b / 1e6) + ' MB' : b ? Math.round(b / 1e3) + ' KB' : ''; }
  function mapApt(j) {
    var l = (j && ((j.datalist && j.datalist.list) || (j.data && j.data.list))) || [];
    return l.map(function (a) {
      var f = a.file || {}, u = f.path || f.path_alt; if (!u || !a.package) return null;
      var st = a.stats || {}, rt = (st.rating && st.rating.avg) || 0;
      return { n: a.name, p: a.package, icon: (a.icon || '').replace(/^http:/, 'https:'), url: u.replace(/^http:/, 'https:'), ver: f.vername || '', size: a.size || f.filesize || 0, dl: st.downloads || 0, rate: rt, c: '#3b3f6e' };
    }).filter(Boolean);
  }
  function aptSearch(q) {
    var e = encodeURIComponent(q);
    return getJSON('https://ws75.aptoide.com/api/7/apps/search?query=' + e + '&limit=14').then(mapApt).then(function (r) { if (r.length) return r; throw new Error('empty'); })
      .catch(function () { return getJSON('https://ws75.aptoide.com/api/7/apps/search/query=' + e + '/limit=14').then(mapApt); });
  }
  function loadItems(key, queries, id) {
    if (cache[key]) { items = cache[key]; gSel = 0; renderStore(); return; }
    items = []; renderStore(); storeSay('Loading…');
    Promise.all(queries.map(function (q) { return aptSearch(q).catch(function () { return []; }); })).then(function (rs) {
      if (id !== loadId) return;
      var seen = {}, out = []; var mx = Math.max.apply(null, rs.map(function (r) { return r.length; }).concat([0]));
      for (var i = 0; i < mx; i++) rs.forEach(function (r) { var a = r[i]; if (a && !seen[a.p]) { seen[a.p] = 1; out.push(a); } });
      if (!out.length) { storeSay('Could not reach the app catalogue. Check the internet connection, or use the Picks tab.'); items = []; renderStore(); return; }
      items = cache[key] = out.slice(0, 40); gSel = 0; storeSay(''); renderStore();
    });
  }
  function pickTab() {
    var t = STABS[tSel]; curQ = ''; var inp = storeEl.querySelector('.ss-in'); inp.value = ''; var id = ++loadId;
    if (!t[1]) { items = SCAT; gSel = 0; storeSay(''); renderStore(); return; }
    loadItems('t' + tSel, t[1], id);
  }
  function runSearch() {
    var q = storeEl.querySelector('.ss-in').value.trim(); if (!q) return; curQ = q; var id = ++loadId; loadItems('q:' + q.toLowerCase(), [q], id);
  }
  function installApp(e) {
    if (!e) return;
    if (e.web) { closeStore(); openUrl(e.web); return; }
    if (instMap[e.p]) { closeStore(); var a = window.BirchAndroid; if (a && a.launchApp) a.launchApp(e.p); return; }
    storeSay('Preparing ' + e.n + '…');
    resolveApk(e).then(function (u) {
      var pd = pend(); if (pd.indexOf(e.p) < 0) { pd.push(e.p); setPend(pd); }
      closeStore(); openUrl(u); toast('Downloading ' + e.n + '. Confirm the install when asked');
    }).catch(function () {
      storeSay('Could not find it automatically. Opening the download page.'); closeStore(); openUrl(e.fd ? 'https://f-droid.org/packages/' + e.p + '/' : 'https://github.com/' + (e.gh || '') + '/releases/latest');
      var pd = pend(); if (e.p && pd.indexOf(e.p) < 0) { pd.push(e.p); setPend(pd); }
    });
  }
  function renderStore() {
    if (!storeEl) return;
    var tb = storeEl.querySelector('.ss-t'); tb.innerHTML = '';
    STABS.forEach(function (t, i) { var d = document.createElement('div'); d.className = 'ss-tab' + (i === tSel && !curQ ? ' on' : '') + (zone === 'tabs' && i === tSel ? ' sel' : ''); d.textContent = t[0]; tb.appendChild(d); });
    storeEl.querySelector('.ss-sw').className = 'ss-sw' + (zone === 'search' ? ' sel' : '');
    var g = storeEl.querySelector('.ss-g'); g.innerHTML = '';
    if (curQ) { var h = document.createElement('div'); h.className = 'ss-r'; h.textContent = 'Results for "' + curQ + '"'; g.appendChild(h); }
    items.forEach(function (e, i) {
      var d = document.createElement('div'), st = e.web ? 'Browse' : instMap[e.p] ? 'Open' : 'Install', meta = [];
      if (e.ver) meta.push(e.ver); if (e.size) meta.push(fmtS(e.size)); if (e.rate) meta.push('★ ' + (+e.rate).toFixed(1)); if (e.dl) meta.push(fmtN(e.dl) + ' downloads');
      d.className = 'ss-c' + (zone === 'grid' && i === gSel ? ' sel' : '');
      d.innerHTML = '<div class="ss-i"></div><div class="ss-n"></div><div class="ss-d"></div><div class="ss-b ' + (st === 'Open' ? 'ok' : 'go') + '">' + st + '</div>';
      var ic = d.children[0]; ic.style.background = 'linear-gradient(135deg,' + e.c + ',#0b0d1c)';
      if (e.icon) { var im = document.createElement('img'); im.src = e.icon; im.alt = ''; im.onerror = function () { im.remove(); ic.textContent = e.n.charAt(0); }; ic.appendChild(im); } else ic.textContent = e.n.charAt(0);
      d.children[1].textContent = e.n; d.children[2].textContent = meta.length ? meta.slice(0, 3).join(' · ') : (e.d || ''); g.appendChild(d);
    });
    if (zone === 'grid') { var sel = g.querySelectorAll('.ss-c')[gSel]; if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest' }); }
    var inp = storeEl.querySelector('.ss-in'); if (zone === 'search') { if (document.activeElement !== inp) inp.focus(); } else if (document.activeElement === inp) inp.blur();
  }
  function fitStore() {
    if (!storeEl) return; var z = Math.min(window.innerWidth / 1920, window.innerHeight / 1080); if (z > .97 && z < 1.03) z = 1;
    var st = storeEl.style; st.inset = 'auto'; st.width = '1920px'; st.height = '1080px'; st.zoom = z === 1 ? '' : String(z);
    st.left = Math.max(0, (window.innerWidth / z - 1920) / 2) + 'px'; st.top = Math.max(0, (window.innerHeight / z - 1080) / 2) + 'px';
  }
  window.addEventListener('resize', function () { if (storeOpen) fitStore(); });
  function updateSel() {
    if (!storeEl) return;
    var tb = storeEl.querySelectorAll('.ss-tab'), i, on;
    for (i = 0; i < tb.length; i++) { tb[i].classList.toggle('on', i === tSel && !curQ); tb[i].classList.toggle('sel', zone === 'tabs' && i === tSel); }
    storeEl.querySelector('.ss-sw').classList.toggle('sel', zone === 'search');
    var cs = storeEl.querySelectorAll('.ss-c');
    for (i = 0; i < cs.length; i++) { on = zone === 'grid' && i === gSel; if (on !== cs[i].classList.contains('sel')) cs[i].classList.toggle('sel', on); }
    if (zone === 'grid' && cs[gSel] && cs[gSel].scrollIntoView) cs[gSel].scrollIntoView({ block: 'nearest' });
    var inp = storeEl.querySelector('.ss-in'); if (zone === 'search') { if (document.activeElement !== inp) inp.focus(); } else if (document.activeElement === inp) inp.blur();
  }
  function openStore() {
    if (!storeEl) {
      var css = document.createElement('style');
      css.textContent = '#st-store{position:fixed;inset:0;z-index:2147483600;display:none;flex-direction:column;padding:44px 72px 28px;color:#fff;font-family:inherit;background:radial-gradient(1200px 700px at 12% 0%,rgba(120,100,255,.34),transparent 60%),radial-gradient(900px 600px at 100% 100%,rgba(60,140,255,.28),transparent 60%),#0a0c20;overflow:hidden}#st-store.on{display:flex}html.st-so #root{opacity:0!important}' +
        '.ss-top{display:flex;align-items:center;gap:36px}.ss-h{font-size:48px;font-weight:700;letter-spacing:-.02em;white-space:nowrap}.ss-sw{flex:1;display:flex;align-items:center;gap:14px;padding:6px 26px;border-radius:999px;background:linear-gradient(135deg,rgba(255,255,255,.17),rgba(255,255,255,.05));box-shadow:inset 0 1.5px 0 rgba(255,255,255,.4),inset 0 0 0 1px rgba(255,255,255,.12);transition:transform .22s cubic-bezier(.2,1.25,.35,1)}.ss-sw.sel{transform:scale(1.02);box-shadow:0 0 0 3px rgba(255,255,255,.92),0 0 40px -4px rgba(140,120,255,.9),inset 0 1.5px 0 rgba(255,255,255,.55)}' +
        '.ss-in{flex:1;background:transparent;border:0;outline:0;color:#fff;font:inherit;font-size:28px;padding:14px 0}.ss-in::placeholder{color:rgba(255,255,255,.5)}' +
        '.ss-t{display:flex;gap:12px;margin:22px 0 8px;flex-wrap:wrap}.ss-tab{padding:11px 26px;border-radius:999px;font-size:22px;background:rgba(255,255,255,.1);opacity:.85;transition:transform .22s cubic-bezier(.2,1.25,.35,1)}.ss-tab.on{background:linear-gradient(135deg,#9e70ff,#76a1ff);opacity:1;box-shadow:0 10px 26px -10px #9e70ff}.ss-tab.sel{transform:scale(1.08);box-shadow:0 0 0 3px rgba(255,255,255,.92),0 0 34px -4px rgba(140,120,255,.9)}' +
        '.ss-g{display:grid;grid-template-columns:repeat(5,1fr);gap:22px;overflow-y:auto;padding:14px 10px 30px;flex:1;align-content:start}.ss-r{grid-column:1/-1;font-size:24px;opacity:.7}' +
        '.ss-c{border-radius:30px;padding:22px;background:linear-gradient(135deg,rgba(255,255,255,.17),rgba(255,255,255,.04) 45%,rgba(255,255,255,.08));box-shadow:inset 0 1.5px 0 rgba(255,255,255,.45),inset 0 0 0 1px rgba(255,255,255,.12),0 12px 28px -18px rgba(0,0,0,.75);transition:transform .22s cubic-bezier(.2,1.25,.35,1)}' +
        '.ss-c.sel{will-change:transform;transform:scale(1.05);box-shadow:0 0 0 3px rgba(255,255,255,.92),0 0 26px -2px rgba(140,120,255,.85),inset 0 1.5px 0 rgba(255,255,255,.6)}' +
        '.ss-i{width:92px;height:92px;border-radius:24px;display:grid;place-items:center;font-size:44px;font-weight:700;overflow:hidden;box-shadow:inset 0 1.5px 0 rgba(255,255,255,.5),0 14px 30px -12px rgba(0,0,0,.7)}.ss-i img{width:100%;height:100%;object-fit:cover}.ss-n{font-size:26px;font-weight:650;margin-top:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ss-d{font-size:16px;opacity:.7;margin-top:4px;min-height:22px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
        '.ss-b{display:inline-block;margin-top:12px;padding:8px 24px;border-radius:999px;font-size:20px;font-weight:600;background:rgba(255,255,255,.14)}.ss-b.go{background:linear-gradient(135deg,#9e70ff,#76a1ff);box-shadow:0 10px 26px -10px #9e70ff}.ss-m{font-size:21px;opacity:.85;min-height:28px}.ss-k{font-size:17px;opacity:.5;margin-top:2px}';
      document.head.appendChild(css);
      storeEl = document.createElement('div'); storeEl.id = 'st-store';
      storeEl.innerHTML = '<div class="ss-top"><div class="ss-h">Get Apps</div><div class="ss-sw"><span style="font-size:26px;opacity:.7">⌕</span><input class="ss-in" type="text" placeholder="Search apps: Netflix, Kodi, games…" autocomplete="off"></div></div><div class="ss-t"></div><div class="ss-g"></div><div class="ss-m"></div><div class="ss-k">Arrows move · OK installs, opens or types in search · Back closes · Catalogue by Aptoide</div>';
      document.body.appendChild(storeEl);
    }
    instMap = installedMap(); storeOpen = true; zone = 'grid'; fitStore(); document.documentElement.classList.add('st-so'); storeEl.classList.add('on'); storeSay('');
    if (!items.length) pickTab(); else renderStore();
  }
  function closeStore() { storeOpen = false; document.documentElement.classList.remove('st-so'); if (storeEl) { storeEl.classList.remove('on'); var i = storeEl.querySelector('.ss-in'); if (i) i.blur(); } }
  function storeKey(e, k) {
    var kd = e.type === 'keydown', typing = zone === 'search' && k.length === 1 || (zone === 'search' && (k === 'Backspace' && storeEl.querySelector('.ss-in').value));
    if (typing || (zone === 'search' && (k === 'ArrowLeft' || k === 'ArrowRight'))) return; // let the text box have it
    e.preventDefault(); e.stopImmediatePropagation(); if (!kd) return;
    var cols = 5, n = items.length;
    if (k === 'Escape' || k === 'Backspace' || k === 'GoBack' || k === 'BrowserBack') { closeStore(); return; }
    if (zone === 'search') {
      if (k === 'ArrowDown') zone = 'tabs'; else if (k === 'Enter') { if (e.repeat) return; var inp = storeEl.querySelector('.ss-in'); if (inp.value.trim()) { runSearch(); zone = 'grid'; } else { try { inp.click(); inp.focus(); } catch (x) {} return; } }
    } else if (zone === 'tabs') {
      if (k === 'ArrowRight') { tSel = Math.min(STABS.length - 1, tSel + 1); clearTimeout(srchT); srchT = setTimeout(pickTab, 350); } else if (k === 'ArrowLeft') { tSel = Math.max(0, tSel - 1); clearTimeout(srchT); srchT = setTimeout(pickTab, 350); }
      else if (k === 'ArrowUp') zone = 'search'; else if (k === 'ArrowDown') { if (n) zone = 'grid'; } else if (k === 'Enter') { pickTab(); }
    } else {
      if (k === 'ArrowRight') gSel = Math.min(n - 1, gSel + 1); else if (k === 'ArrowLeft') gSel = Math.max(0, gSel - 1);
      else if (k === 'ArrowDown') gSel = Math.min(n - 1, gSel + cols); else if (k === 'ArrowUp') { if (gSel < cols) zone = 'tabs'; else gSel -= cols; }
      else if (k === 'Enter') { if (!e.repeat) installApp(items[gSel]); return; }
    }
    updateSel();
  }

  // real icons on home tiles for web apps (site icon over the tile, name underneath)
  var icoT = 0;
  function enhanceTiles() {
    icoT = 0; var tl = document.querySelectorAll('[data-app]:not([data-ico])');
    for (var i = 0; i < tl.length; i++) {
      var t = tl[i]; t.setAttribute('data-ico', '1'); var id = t.getAttribute('data-app') || '';
      if (id.indexOf('web:') !== 0 || t.querySelector('img')) continue;
      var host; try { host = new URL(id.slice(4)).hostname; } catch (e) { continue; }
      t.style.setProperty('--ico', 'url(https://www.google.com/s2/favicons?domain=' + host + '&sz=128)'); t.classList.add('st-ico');
    }
  }
  function xIcoCss() { return '#root .st-ico{display:flex!important;align-items:flex-end!important;justify-content:center!important;padding-bottom:10px!important;text-align:center}#root .st-ico::before{content:"";position:absolute;left:50%;top:12%;width:46%;height:52%;transform:translateX(-50%);background:var(--ico) center/contain no-repeat;border-radius:22%;pointer-events:none}#root .st-ico>*{font-size:.6em!important;opacity:.92;position:relative;z-index:1}'; }
  try { new MutationObserver(function () { if (!icoT) icoT = setTimeout(enhanceTiles, 250); }).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}

  // after an install, spot the new app, pin it to the dock and tell the user
  function checkPending() {
    var pd = pend(); if (!pd.length || !B()) return; var m = installedMap(), left = [], b = B(), done = [];
    pd.forEach(function (p) { if (m[p]) done.push(p); else left.push(p); });
    if (!done.length) return; setPend(left);
    var f = b.get().favorites.slice(); done.forEach(function (p) { if (f.indexOf(p) < 0) f.unshift(p); });
    b.set({ favorites: f }); refresh();
    var nm = done.map(function (p) { var c = SCAT.filter(function (x) { return x.p === p; })[0]; return c ? c.n : p; }).join(', '); toast(nm + ' installed and added to your home screen');
  }
  setInterval(checkPending, 4000); window.addEventListener('focus', checkPending); document.addEventListener('visibilitychange', checkPending);
  // pin the store itself once
  setTimeout(function () { var b = B(); if (!b || S.storePinned) return; S.storePinned = true; var f = b.get().favorites.slice(); if (f.indexOf('store:android') < 0) { f.push('store:android'); b.set({ favorites: f }); } save(); }, 2500);

  // ---------- public API for the Look & Feel tabs ----------
  window.__studio = {
    cfg: C, tabs: TABS, presets: PN, extra: extra, openStore: openStore,
    state: function () { return S; },
    set: function (id, v) { S[id] = v; afterSet(id, v); if (id === 'idle') resetIdle(); if (id.indexOf('w_') === 0 || id.indexOf('w') === 0) drawDock(); apply(); },
    preset: function (n) { var keep = {}; C.forEach(function (o) { if (o.tab !== 'x_picture' && o.tab !== 'x_style') keep[o.id] = S[o.id]; }); S = Object.assign({}, JSON.parse(JSON.stringify(DEF)), keep, PRESETS[n] || {}); toast('Preset: ' + n); apply(); },
    reset: function (tab) { (TABS[tab] || []).forEach(function (id) { if (id in DEF) S[id] = DEF[id]; }); apply(); drawDock(); },
    run: runAct, sub: function (f) { subs.push(f); return function () { subs = subs.filter(function (x) { return x !== f; }); }; },
    swatch: SW, bgs: BGS,
    compare: function (v) { compare = v == null ? !compare : v; apply(); },
    setView: function (v) { view = v; drawDock(); },
    back: function () { if (S.backMode === 'home') return 'home'; var q = window.__nh || [], v; while (q.length) { v = q.pop(); if (v !== view) return v; } return 'home'; },
    toggle: function () { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ContextMenu' })); }
  };

  function mount() {
    if (dock) return;
    var b = document.body;
    ['st-vig', 'st-ov', 'st-grain'].forEach(function (i) { b.appendChild(el('div', i)); });
    dock = el('div', 'st-dock', 'stack'); b.appendChild(dock);
    menu = el('div', 'st-menu'); card = el('div', 'st-card'); menu.appendChild(card); b.appendChild(menu);
    toastEl = el('div', 'st-toast'); b.appendChild(toastEl);
    apply(); drawDock(); resetIdle();
  }
  apply();
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();


/* v41: apps rows slide one app at a time; nothing ever scrolls the page, so the wallpaper stays put. */
(function () {
  function fixX(t) { if (t && t.scrollLeft) { try { t.scrollTo({ left: 0, behavior: 'instant' }); } catch (e) {} if (t.scrollLeft) t.scrollLeft = 0; } }
  function keepX(orig) {
    return function () {
      var a = [], p = this.parentElement, se = document.scrollingElement;
      while (p) { a.push([p, p.scrollLeft]); p = p.parentElement; }
      var r = orig.apply(this, arguments);
      for (var i = 0; i < a.length; i++) if (a[i][0].scrollLeft !== a[i][1]) a[i][0].scrollLeft = a[i][1];
      if (se) fixX(se);
      return r;
    };
  }
  try { Element.prototype.scrollIntoView = keepX(Element.prototype.scrollIntoView); HTMLElement.prototype.focus = keepX(HTMLElement.prototype.focus); } catch (e) {}
  document.addEventListener('scroll', function (e) { fixX(e.target === document ? document.scrollingElement : e.target); }, true);
  var M = 70;
  document.addEventListener('focusin', function (e) {
    var el = e.target; if (!el || !el.closest) return;
    var tile = el.closest('[data-focus]'); if (!tile) return;
    var row = tile.parentElement, n = 0;
    while (row && row !== document.body && n < 5) {
      var cs = getComputedStyle(row);
      if (cs.display.indexOf('flex') > -1 && cs.flexDirection.indexOf('row') === 0 && cs.flexWrap === 'nowrap' && row.children.length > 2) break;
      row = row.parentElement; n++;
    }
    if (!row || row === document.body || n >= 5) return;
    var item = tile; while (item.parentElement && item.parentElement !== row) item = item.parentElement;
    if (item.parentElement !== row) return;
    var rr = row.getBoundingClientRect(), ir = item.getBoundingClientRect(), W = window.innerWidth;
    if (row.__x0 === undefined) row.__x0 = rr.left + (row.__tx || 0);
    var tx = row.__tx || 0, rel = ir.left - rr.left, nl = row.__x0 + rel, nr = nl + ir.width;
    var lo = nr - (W - M), hi = nl - M, v = tx;
    if (v < lo) v = lo; if (v > hi) v = hi; if (v < 0) v = 0;
    if (Math.abs(v - tx) > 0.5) {
      row.__tx = v; row.style.transition = 'transform .22s ease-out'; row.style.transform = 'translateX(' + (-v) + 'px)';
    }
  }, true);
})();

/* Birch boot animation: plays every time Birch OS opens. Compositor-only (opacity/transform) so it stays smooth. */
(function () {
  'use strict';
  var de = document.documentElement, done = false, ctx = null, master = null;
  var css = document.createElement('style');
  css.textContent =
    '#bb{position:fixed;inset:0;z-index:2147483647;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:1;transition:opacity .7s cubic-bezier(.4,0,.2,1)}' +
    '#bb.out{opacity:0}' +
    '#bb .gl{position:absolute;width:760px;height:760px;border-radius:50%;background:radial-gradient(closest-side,rgba(150,120,255,.38),rgba(90,150,255,.14) 55%,transparent 100%);opacity:0;transform:scale(.55);will-change:transform,opacity;animation:bbg 3s cubic-bezier(.22,.61,.36,1) .2s forwards}' +
    '#bb svg{position:relative;width:170px;height:170px;opacity:0;transform:scale(.86);will-change:transform,opacity;animation:bbl 1.5s cubic-bezier(.22,.61,.36,1) .35s forwards}' +
    '#bb .tx{position:relative;margin-top:30px;font:600 40px/1 Sora,system-ui,sans-serif;letter-spacing:.42em;padding-left:.42em;color:#fff;opacity:0;transform:translateY(14px);will-change:transform,opacity;animation:bbt 1.2s cubic-bezier(.22,.61,.36,1) 1.4s forwards}' +
    '#bb .ln{position:relative;margin-top:26px;width:220px;height:2px;background:linear-gradient(90deg,transparent,rgba(190,170,255,.9),transparent);opacity:0;transform:scaleX(.1);will-change:transform,opacity;animation:bbn 1.2s cubic-bezier(.22,.61,.36,1) 1.7s forwards}' +
    '@keyframes bbl{to{opacity:1;transform:scale(1)}}' +
    '@keyframes bbg{40%{opacity:1}to{opacity:.8;transform:scale(1.08)}}' +
    '@keyframes bbt{to{opacity:.94;transform:none}}' +
    '@keyframes bbn{to{opacity:1;transform:scaleX(1)}}';
  de.appendChild(css);
  var el = document.createElement('div'); el.id = 'bb';
  el.innerHTML = '<div class="gl"></div>' +
    '<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="bbgr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b79cff"/><stop offset="1" stop-color="#7fb2ff"/></linearGradient></defs>' +
    '<path d="M24 3 L38 24 H30 L41 38 H7 L18 24 H10 Z" fill="none" stroke="url(#bbgr)" stroke-width="2.4" stroke-linejoin="round"/>' +
    '<path d="M24 10 V45 M24 22 l-6 -5 M24 30 l7 -6 M24 36 l-8 -4" stroke="url(#bbgr)" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg>' +
    '<div class="tx">BIRCH OS</div><div class="ln"></div>';
  de.appendChild(el);

  function sound() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC(); if (ctx.resume) ctx.resume();
      var t = ctx.currentTime + 0.05;
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.connect(master);
      function tone(f, t0, a, peak, rel, type, dest) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type || 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(peak, t0 + a);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + rel);
        o.connect(g); g.connect(dest || lp); o.start(t0); o.stop(t0 + a + rel + 0.1);
      }
      // soft sub thump
      tone(55, t, 0.04, 0.30, 1.3, 'sine', master);
      // warm pad swell (A major add9, slightly detuned pairs)
      [220, 277.18, 329.63, 493.88].forEach(function (f, i) {
        tone(f, t + 0.1 + i * 0.12, 1.5, 0.05, 1.9, 'sine');
        tone(f * 1.004, t + 0.1 + i * 0.12, 1.5, 0.035, 1.9, 'triangle');
      });
      // clean chime as the wordmark lands
      tone(880, t + 1.45, 0.02, 0.09, 1.7, 'sine', master);
      tone(1318.51, t + 1.55, 0.02, 0.06, 1.6, 'sine', master);
      tone(1760, t + 1.65, 0.02, 0.03, 1.4, 'sine', master);
    } catch (e) {}
  }
  sound();

  function end() {
    if (done) return; done = true;
    el.classList.add('out');
    try { if (master) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(master.gain.value, ctx.currentTime); master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6); } } catch (e) {}
    setTimeout(function () { try { el.remove(); css.remove(); if (ctx) ctx.close(); } catch (e) {} }, 900);
    window.removeEventListener('keydown', onKey, true);
  }
  function onKey(e) {
    // browsers/WebViews that block autoplay: first key press starts the sound, a second press skips
    if (ctx && ctx.state === 'suspended') { ctx.resume(); return; }
    e.stopPropagation(); e.preventDefault(); end();
  }
  window.addEventListener('keydown', onKey, true);
  setTimeout(end, 3900);
})();
