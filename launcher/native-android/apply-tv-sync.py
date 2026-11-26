"""Idempotent compatibility patch for the launcher's existing native build."""
from pathlib import Path
import sys

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent

def replace(path, old, new):
    text = path.read_text()
    if new in text:
        return True
    if old not in text:
        return False
    path.write_text(text.replace(old, new, 1))
    return True

native = root / "src/com/birchos/launcher"
web = native / "WebAppActivity.java"
main = native / "MainActivity.java"

# UA tag
replace(web,
    's.setUserAgentString("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");',
    's.setUserAgentString(s.getUserAgentString() + " BirchOSLauncher/1");')

# Ensure WatchBridge has sync method
wb = web.read_text()
if 'public void sync(String json)' not in wb:
    old_save = '@JavascriptInterface public void save(String json) { Watch.save(WebAppActivity.this, json); }'
    new_save = '''@JavascriptInterface public void save(String json) { Watch.save(WebAppActivity.this, json); }
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
    }'''
    if old_save in wb:
        web.write_text(wb.replace(old_save, new_save, 1))

mt = main.read_text()
if "birch-watch-refresh" not in mt and '@Override protected void onPause()' in mt:
    mt = mt.replace(
        '  @Override protected void onPause() {',
        '''  @Override protected void onResume() {
    super.onResume();
    if (web == null) return;
    String rows = Watch.load(this);
    web.evaluateJavascript("localStorage.setItem('birch-watch-v1'," + JSONObject.quote(rows) + ");window.dispatchEvent(new Event('birch-watch-refresh'));", null);
  }

  @Override protected void onPause() {''', 1)
    main.write_text(mt)

for bundle in (root / "assets/www/assets").glob("index-*.js"):
    text = bundle.read_text()
    if 'function BCards({load,k,empty})' not in text:
        continue
    if 'birch-watch-refresh' in text:
        break
    old = 'function BCards({load,k,empty}){let{data:n,loading:r}=Fr(load,[k],[]);'
    new = '''function BCards({load,k,empty}){let[v,setV]=h.useState(0);h.useEffect(()=>{if(k!==`watched`)return;let refresh=()=>setV(x=>x+1);window.addEventListener(`birch-watch-refresh`,refresh);return()=>window.removeEventListener(`birch-watch-refresh`,refresh)},[k]);let{data:n,loading:r}=Fr(load,[k,v],[]);'''
    if old in text:
        bundle.write_text(text.replace(old, new, 1))
    break

print("Applied BirchOS TV history sync and Fire TV performance compatibility")
