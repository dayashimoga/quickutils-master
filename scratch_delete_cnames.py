import sys
import os
import urllib.request
sys.path.append(os.getcwd())
try:
    from scripts.assign_domains_bulk import find_wrangler_token
except ImportError:
    print("Cannot import")
    sys.exit(1)

token = find_wrangler_token()
print(f"Token acquired. Length: {len(token) if token else 0}")
if not token: sys.exit(1)

req = urllib.request.Request("https://api.cloudflare.com/client/v4/zones?name=quickutils.top", headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as r:
        print(f"HTTP {r.status}")
        data = r.read().decode('utf-8')
        print(data[:200])
except Exception as e:
    print(f"Exception: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
