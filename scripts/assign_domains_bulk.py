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

    base_url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects"
    print(f"Loaded {len(projects)} projects from config. Initiating bulk domain REST API assignment...")
    
    for foldername, cfg in projects.items():
        site_url = cfg.get("SITE_URL", "")
        if "quickutils.top" in site_url:
            domain = site_url.replace("https://", "").replace("http://", "").strip("/")
            domain = domain.split("/")[0] # remove trailing paths if any
            print(f"Assigning {domain} to {foldername}...")
            
            domain_add_url = f"{base_url}/{foldername}/domains"
            payload = {"name": domain}
            res, code = api_request("POST", domain_add_url, token, payload=payload)
            
            if code == 409 or code == 400 or (res and not res.get("success") and "already" in str(res).lower()):
                # 400 happens if domain is already active on another project or same
                print(f"  [SKIP] -> Already configured or bound: {domain}")
                skips += 1
            elif res and res.get("success"):
                count += 1
                print(f"  [SUCCESS] -> {domain}")
            else:
                print(f"  [ERROR] -> Failed: {domain} (HTTP {code})")
                errors += 1
                    
            time.sleep(0.5)

    print(f"\\nProcess Completed. Successfully Assigned: {count}. Skipped: {skips}. Errors: {errors}")

if __name__ == "__main__":
    assign_domains()
