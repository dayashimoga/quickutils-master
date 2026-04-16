"""
cf_extinguisher.py - Bypasses Cloudflare CLI limitations by hitting the REST API directly.
Extracts Wrangler OAuth token and deletes orphaned projects/custom domains safely.
"""

import os
import sys
import json
import urllib.request
import urllib.error
from pathlib import Path

if sys.platform == 'win32':
    try: sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except: pass

# Common locations for Wrangler token on Windows/Unix
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
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"HTTPError {e.code}: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Error: {e}")
    return None

def main():
    target_projects = sys.argv[1:]
    if not target_projects:
        # Default projects to extinguish to free slots
        target_projects = [
            "emoji-kitchen", "garden-planner", "ai-prompt-builder",
            "unit-converter", "meditation-journey", "dailyfacts",
            "meal-planner", "keyboard-tester", "color-palette",
            "password-fortress", "quickutils-master"
        ]

    token = find_wrangler_token()
    if not token:
        print("❌ Could not find active Wrangler OAuth token. Please login via wrangler or set CLOUDFLARE_API_TOKEN.")
        sys.exit(1)

    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    if not account_id:
        print("ℹ️ CLOUDFLARE_ACCOUNT_ID not in env, attempting to fetch from API...")
        accounts_res = api_request("GET", "https://api.cloudflare.com/client/v4/accounts", token)
        if accounts_res and accounts_res.get("success") and accounts_res.get("result"):
            account_id = accounts_res["result"][0]["id"]
            print(f"✅ Auto-detected Account ID: {account_id}")
        else:
            print("❌ Could not fetch Account ID from API. Please set CLOUDFLARE_ACCOUNT_ID.")
            sys.exit(1)

    print(f"🚀 Initializing Cloudflare REST API Extinguisher for {len(target_projects)} projects...")

    base_url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects"

    for project in target_projects:
        print(f"\nTargeting Project: {project}")
        # 1. Fetch domains
        domains_url = f"{base_url}/{project}/domains"
        domains_data = api_request("GET", domains_url, token)
        
        if domains_data and domains_data.get("success"):
            domains = domains_data.get("result", [])
            for dom in domains:
                dom_name = dom.get("name")
                # 2. Delete domain mapping
                print(f"  🔥 Extinguishing custom domain: {dom_name}...")
                del_dom_url = f"{domains_url}/{dom_name}"
                res = api_request("DELETE", del_dom_url, token)
                if res and res.get("success"):
                    print(f"    ✅ Domain {dom_name} wiped.")
        else:
            print(f"  ℹ️ No custom domains found or fetch failed for {project}.")

        # 3. Delete project
        print(f"  💣 Nuking project {project}...")
        project_url = f"{base_url}/{project}"
        proj_res = api_request("DELETE", project_url, token)
        if proj_res and proj_res.get("success"):
            print(f"    ✅ Project {project} erased. Slot freed.")
        else:
            print(f"    ⚠️ Failed to erase project {project}.")

    print("\n🏁 Extinguisher operations completed.")

if __name__ == "__main__":
    main()
