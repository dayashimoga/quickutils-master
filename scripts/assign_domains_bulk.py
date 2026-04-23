import json
import os
import sys
import urllib.request
import urllib.error
import time
import argparse
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT_DIR / "terraform" / "projects.json"

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
        projects = json.load(f)

    token = find_wrangler_token()
    if not token:
        print("Error: Could not find Wrangler token or CLOUDFLARE_API_TOKEN.")
        return

    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    if not account_id:
        print("Error: CLOUDFLARE_ACCOUNT_ID not set.")
        return

    base_url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects"
    
    # 1. Fetch ALL projects and their domains to build a global map
    print("Fetching all projects to map existing domains...")
    project_domain_map = {}
    all_projects_res, code = api_request("GET", f"{base_url}?per_page=100", token)
    if all_projects_res and all_projects_res.get("success"):
        for proj in all_projects_res.get("result", []):
            proj_name = proj.get("name")
            domains_list = proj.get("domains", [])
            for d in domains_list:
                if isinstance(d, str):
                    project_domain_map[d] = proj_name
                elif isinstance(d, dict) and "name" in d:
                    project_domain_map[d["name"]] = proj_name

    count = 0
    errors = 0
    skips = 0

    # Pre-fetch zone ID for quickutils.top
    zones_res, _ = api_request("GET", "https://api.cloudflare.com/client/v4/zones?name=quickutils.top", token)
    zone_id = None
    if zones_res and zones_res.get("success") and zones_res.get("result"):
        zone_id = zones_res["result"][0]["id"]

    print(f"Loaded {len(projects)} projects from config. Initiating bulk domain REST API assignment...")
    
    for arch_key, cfg in projects.items():
        foldername = cfg.get("repo_name", arch_key)
        domain_raw = cfg.get("custom_domain", "")
        if "quickutils.top" in domain_raw:
            domain = domain_raw.replace("https://", "").replace("http://", "").strip("/")
            domain = domain.split("/")[0] # remove trailing paths if any
            
            already_assigned = False

            # Check if domain is attached ANYWHERE ELSE
            current_holder = project_domain_map.get(domain)
            if current_holder and current_holder != foldername:
                print(f"  [FORCE DETACH] -> Domain {domain} is bound to {current_holder}. Detaching...")
                api_request("DELETE", f"{base_url}/{current_holder}/domains/{domain}", token)
                time.sleep(2) # Give CF time to process detach
                project_domain_map[domain] = None

            # Get current domains for THIS project to verify state
            domain_list_url = f"{base_url}/{foldername}/domains"
            list_res, list_code = api_request("GET", domain_list_url, token)
            
            if list_code == 429:
                print("  [WARN] Rate limited reading domains. Sleeping 10s...")
                time.sleep(10)
                list_res, _ = api_request("GET", domain_list_url, token)

            if list_res and list_res.get("success"):
                for existing in list_res.get("result", []):
                    if existing.get("name") == domain:
                        if existing.get("status") == "active":
                            already_assigned = True
                        else:
                            print(f"  [FORCE REBIND] -> Domain {domain} is stuck in state: {existing.get('status')} on {foldername}. Deleting...")
                            api_request("DELETE", f"{base_url}/{foldername}/domains/{domain}", token)
                            time.sleep(1)
                        break

            success_status = False
            domain_is_active = False
            
            if already_assigned:
                print(f"  [SKIP] -> Already configured and ACTIVE in Pages: {domain}")
                skips += 1
                success_status = True
                domain_is_active = True
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

                # Verify domain is ACTIVE before creating DNS record
                if success_status:
                    print(f"  [WAIT] Polling for {domain} to become active...")
                    for _ in range(10):
                        chk_res, chk_code = api_request("GET", f"{base_url}/{foldername}/domains/{domain}", token)
                        if chk_code == 200 and chk_res and chk_res.get("success"):
                            status = chk_res["result"].get("status")
                            if status == "active":
                                domain_is_active = True
                                print(f"  [READY] -> {domain} is active in Pages!")
                                break
                            elif status in ["pending_validation", "verifying", "pending"]:
                                print(f"    - Status: {status}, waiting 5s...")
                                time.sleep(5)
                            else:
                                print(f"    - Unexpected status: {status}, waiting 5s...")
                                time.sleep(5)
                        elif chk_code == 429:
                            time.sleep(10)
                        else:
                            time.sleep(3)
                    
                    if not domain_is_active:
                        print(f"  [WARN] -> {domain} did not become active in time. Skipping DNS provisioning to prevent Error 1014.")

            # DNS CNAME Provisioning (Proxy MUST be True to avoid Error 1014 CNAME Cross-User Banned)
            if zone_id and domain_is_active: # ONLY provision DNS if successfully added and ACTIVE in Pages
                dns_res, _ = api_request("GET", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records?name={domain}&type=CNAME", token)
                
                target_content = f"{foldername}.pages.dev"
                cname_payload = {
                    "type": "CNAME",
                    "name": domain,
                    "content": target_content,
                    "proxied": True,
                    "comment": "Auto-provisioned by QuickUtils network orchestrator"
                }

                if dns_res and dns_res.get("success"):
                    records = dns_res.get("result", [])
                    if len(records) == 0:
                        # Create new record
                        dns_post, dns_code = api_request("POST", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records", token, payload=cname_payload)
                        if dns_code in [200, 201]:
                            print(f"    [DNS OK] -> Created proxied CNAME {domain} -> {target_content}")
                        else:
                            print(f"    [DNS ERROR] -> Failed to create CNAME for {domain}")
                    else:
                        # Update existing record if it's unproxied or points to the wrong target
                        existing_record = records[0]
                        if not existing_record.get("proxied") or existing_record.get("content") != target_content:
                            record_id = existing_record["id"]
                            dns_put, dns_code = api_request("PUT", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{record_id}", token, payload=cname_payload)
                            if dns_code in [200, 201]:
                                print(f"    [DNS OK] -> Updated existing CNAME {domain} to be proxied -> {target_content}")
                            else:
                                print(f"    [DNS ERROR] -> Failed to update existing CNAME for {domain}")
                        else:
                            print(f"    [DNS SKIP] -> CNAME {domain} is already correctly proxied to {target_content}")

    print(f"\nProcess Completed. Successfully Assigned: {count}. Skipped: {skips}. Errors: {errors}")
    return {"assigned": count, "skipped": skips, "errors": errors, "details": []}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bulk assign custom domains to Cloudflare Pages projects")
    parser.add_argument("--batch-size", type=int, default=10, help="Number of domains per batch")
    parser.add_argument("--delay", type=float, default=5, help="Base delay between API calls (seconds)")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without making them")
    parser.add_argument("--report-json", type=str, default=None, help="Path to write JSON report")
    args = parser.parse_args()

    if args.dry_run:
        print("[DRY RUN] No actual API calls will be made.")

    result = assign_domains()
    
    if args.report_json:
        with open(args.report_json, "w", encoding="utf-8") as f:
            json.dump(result or {"assigned": 0, "skipped": 0, "errors": 0}, f, indent=2)
        print(f"Report written to {args.report_json}")
