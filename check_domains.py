import os
import sys
import json
import urllib.request
sys.path.append(os.getcwd())
from scripts.assign_domains_bulk import find_wrangler_token, api_request

token = find_wrangler_token()
if not token:
    print("No token")
    sys.exit(1)

accounts_res, code = api_request("GET", "https://api.cloudflare.com/client/v4/accounts", token)
account_id = accounts_res["result"][0]["id"]

# Check web-chess domains
list_res, list_code = api_request("GET", f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/web-chess/domains", token)
print(f"web-chess domains HTTP {list_code}:")
if list_res and "result" in list_res:
    for d in list_res["result"]:
        print(f"  - {d.get('name')} (Status: {d.get('status')})")
else:
    print("  No domains found or error.", list_res)
