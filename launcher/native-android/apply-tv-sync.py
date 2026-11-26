"""Idempotent compatibility patch for the launcher's existing native build."""
from pathlib import Path
import sys

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent

def replace(path, old, new):
    text = path.read_text()
    if new in text:
        return
    if old not in text:
        raise SystemExit(f"Launcher source changed; review {path.name} before building")
    path.write_text(text.replace(old, new, 1))

native = root / "src/com/birchos/launcher"
replace(native / "WebAppActivity.java",
    's.setUserAgentString("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");',
    's.setUserAgentString(s.getUserAgentString() + " BirchOSLauncher/1");')
replace(native / "WebAppActivity.java",
    'if(window.__birchChal)return;',
    "if(location.hostname==='birchos-tv.lovable.app'||window.__birchChal)return;")
replace(native / "WebAppActivity.java",
    'if(window.__birchWatch)return;',
    "if(location.hostname==='birchos-tv.lovable.app'||window.__birchWatch)return;")
replace(native / "WebAppActivity.java",
    '@JavascriptInterface public void save(String json) { Watch.save(WebAppActivity.this, json); }',
    '''@JavascriptInterface public void save(String json) { Watch.save(WebAppActivity.this, json); }
    @JavascriptInterface public void sync(String json) {
      if (json == null || json.length() > 100000) return;
      try {
        org.json.JSONArray incoming = new org.json.JSONArray(json);
        synchronized (Watch.class) {
          org.json.JSONArray next = new org.json.JSONArray();
          for (int i = 0; i < incoming.length() && next.length() < 20; i++) {
            org.json.JSONObject item = incoming.optJSONObject(i);
            if (item != null && item.optString("url").startsWith("https://birchos-tv.lovable.app/watch/")) next.put(item);
          }
          org.json.JSONArray current = Watch.read(WebAppActivity.this);
          for (int i = 0; i < current.length() && next.length() < 20; i++) {
            org.json.JSONObject item = current.optJSONObject(i);
            if (item != null && !item.optString("url").startsWith("https://birchos-tv.lovable.app/") && !"birchos-tv".equals(item.optString("source"))) next.put(item);
          }
          Watch.save(WebAppActivity.this, next.toString());
        }
      } catch (Throwable ignored) {}
    }''')

replace(native / "MainActivity.java",
    '  @Override protected void onPause() {',
    '''  @Override protected void onResume() {
    super.onResume();
    if (web == null) return;
    String rows = Watch.load(this);
    web.evaluateJavascript("localStorage.setItem('birch-watch-v1'," + JSONObject.quote(rows) + ");window.dispatchEvent(new Event('birch-watch-refresh'));", null);
  }

  @Override protected void onPause() {''')

for bundle in (root / "assets/www/assets").glob("index-*.js"):
    if 'function BCards({load,k,empty})' not in bundle.read_text():
        continue
    replace(bundle,
        'function BCards({load,k,empty}){let{data:n,loading:r}=Fr(load,[k],[]);',
        '''function BCards({load,k,empty}){let[v,setV]=h.useState(0);h.useEffect(()=>{if(k!==`watched`)return;let refresh=()=>setV(x=>x+1);window.addEventListener(`birch-watch-refresh`,refresh);return()=>window.removeEventListener(`birch-watch-refresh`,refresh)},[k]);let{data:n,loading:r}=Fr(load,[k,v],[]);''')
    break
else:
    raise SystemExit("Launcher Continue Watching bundle was not found")
print("Applied BirchOS TV history sync and Fire TV performance compatibility")
