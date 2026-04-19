import json
import os
import sys
import urllib.request
import urllib.error
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT_DIR / "project_config.json"

WRANGLER_PATHS = [
    Path(os.environ.get("APPDATA", "C:/")) / ".wrangler" / "config" / "default.toml",
    Path(os.environ.get("LOCALAPPDATA", "C:/")) / ".wrangler" / "config" / "default.toml",
    Path.home() / "AppData" / "Roaming" / ".wrangler" / "config" / "default.toml",
    Path.home() / "AppData" / "Roaming" / "xdg.config" / ".wrangler" / "config" / "default.toml",
    Path.home() / ".config" / ".wrangler" / "config" / "default.toml",
    Path.home() / ".wrangler" / "config" / "default.toml",
]

def find_wrangler_token():
    for p in WRANGLER_PATHS:
        if p.exists():
            try:
                content = p.read_text(encoding="utf-8")
                for line in content.splitlines():
                    if line.startswith("oauth_token"):
                        token = line.split("=")[1].strip().strip('"').strip("'")
                        return token
            except Exception as e:
                pass
    return os.environ.get("CLOUDFLARE_API_TOKEN")

def api_request(method, url, token, payload=None):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    data = json.dumps(payload).encode("utf-8") if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8")), response.status
    except urllib.error.HTTPError as e:
        if e.code == 409 or e.code == 400: # Domain already bound or validation failed
            return {"success": False, "code": e.code, "msg": str(e)}, e.code
        return None, e.code
    except Exception as e:
        return None, 500

def assign_domains():
    if not CONFIG_PATH.exists():
        print(f"Error: {CONFIG_PATH} not found.")
        return

    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        master_config = json.load(f)

    projects = master_config.get("projects", {})
    count = 0
    errors = 0
    skips = 0

    token = find_wrangler_token()
    if not token:
        print("❌ Could not find active Wrangler OAuth token. Please login via wrangler or set CLOUDFLARE_API_TOKEN.")
        sys.exit(1)

    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    if not account_id:
        accounts_res, code = api_request("GET", "https://api.cloudflare.com/client/v4/accounts", token)
        if accounts_res and accounts_res.get("success") and accounts_res.get("result"):
            account_id = accounts_res["result"][0]["id"]
        else:
            print("❌ Could not fetch Account ID from API. Please set CLOUDFLARE_ACCOUNT_ID.")
            sys.exit(1)

    # Pre-fetch zone ID for quickutils.top
    zones_res, _ = api_request("GET", "https://api.cloudflare.com/client/v4/zones?name=quickutils.top", token)
    zone_id = None
    if zones_res and zones_res.get("success") and zones_res.get("result"):
        zone_id = zones_res["result"][0]["id"]

    base_url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects"
    print(f"Loaded {len(projects)} projects from config. Initiating bulk domain REST API assignment...")
    
    for foldername, cfg in projects.items():
        site_url = cfg.get("SITE_URL", "")
        if "quickutils.top" in site_url:
            domain = site_url.replace("https://", "").replace("http://", "").strip("/")
            domain = domain.split("/")[0] # remove trailing paths if any
            
            domain_list_url = f"{base_url}/{foldername}/domains"
            list_res, list_code = api_request("GET", domain_list_url, token)
            
            already_assigned = False
            if list_code == 200 and list_res and "result" in list_res:
                for existing in list_res["result"]:
                    if existing.get("name") == domain:
                        already_assigned = True
                        break
            
            success_status = False
            if already_assigned:
                print(f"  [SKIP] -> Already configured in Pages: {domain}")
                skips += 1
                success_status = True
            else:
                print(f"Assigning {domain} to {foldername}...")
                domain_add_url = f"{base_url}/{foldername}/domains"
                payload = {"name": domain}
                max_retries = 3
                
                for attempt in range(max_retries):
                    res, code = api_request("POST", domain_add_url, token, payload=payload)
                    
                    if code == 429:
                        wait_time = 10 * (2 ** attempt)
                        print(f"  [WARN] -> Rate limited (HTTP 429). Retrying in {wait_time}s...")
                        time.sleep(wait_time)
                        continue
                        
                    if code == 409 or code == 400 or (res and not res.get("success") and "already" in str(res).lower()):
                        print(f"  [SKIP] -> Bound simultaneously: {domain}")
                        skips += 1
                        success_status = True
                        break
                    elif res and res.get("success"):
                        count += 1
                        print(f"  [SUCCESS] -> {domain}")
                        success_status = True
                        break
                    else:
                        print(f"  [ERROR] -> Failed: {domain} (HTTP {code})")
                        break
                
                if not success_status and code != 400 and code != 409 and not (res and res.get("success")):
                    errors += 1
                    
                time.sleep(1.5) # Protect against rate-limits

    print(f"\\nProcess Completed. Successfully Assigned: {count}. Skipped: {skips}. Errors: {errors}")

if __name__ == "__main__":
    assign_domains()
