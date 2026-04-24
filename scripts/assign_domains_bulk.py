import json
import os
import sys
import urllib.request
import urllib.error
import time
import argparse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

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
                        return line.split("=")[1].strip().strip('"').strip("'")
            except Exception:
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
        if e.code == 409 or e.code == 400:
            return {"success": False, "code": e.code, "msg": str(e)}, e.code
        return None, e.code
    except Exception as e:
        return None, 500

def process_domain(domain, foldername, base_url, token, zone_id, project_domain_map):
    if not domain or domain.lower() == "none" or domain.startswith("none."):
        return "skip", f"  [SKIP] Invalid domain: {domain}"

    already_assigned = False
    current_holder = project_domain_map.get(domain)
    
    if current_holder and current_holder != foldername:
        print(f"  [FORCE DETACH] -> Domain {domain} is bound to {current_holder}. Detaching...")
        api_request("DELETE", f"{base_url}/{current_holder}/domains/{domain}", token)
        time.sleep(2)

    # Check if domain already exists on THIS project
    domain_list_url = f"{base_url}/{foldername}/domains"
    list_res, list_code = api_request("GET", domain_list_url, token)
    
    if list_code == 429:
        time.sleep(10)
        list_res, _ = api_request("GET", domain_list_url, token)

    if list_res and list_res.get("success"):
        for existing in list_res.get("result", []):
            if existing.get("name") == domain:
                if existing.get("status") == "active":
                    already_assigned = True
                else:
                    print(f"  [FORCE REBIND] -> Domain {domain} stuck ({existing.get('status')} on {foldername}). Deleting...")
                    api_request("DELETE", f"{base_url}/{foldername}/domains/{domain}", token)
                    time.sleep(1)
                break

    success_status = False
    domain_is_active = False
    action_type = "error"
    
    if already_assigned:
        action_type = "skip"
        success_status = True
        domain_is_active = True
        print(f"  [SKIP] -> Already configured & ACTIVE: {domain}")
    else:
        print(f"Assigning {domain} to {foldername}...")
        domain_add_url = f"{base_url}/{foldername}/domains"
        
        for attempt in range(3):
            res, code = api_request("POST", domain_add_url, token, payload={"name": domain})
            if code == 429:
                time.sleep(10 * (2 ** attempt))
                continue
            if code in (409, 400) or (res and not res.get("success") and "already" in str(res).lower()):
                action_type = "skip"
                success_status = True
                print(f"  [SKIP] -> Bound simultaneously: {domain}")
                break
            elif res and res.get("success"):
                action_type = "assigned"
                success_status = True
                print(f"  [SUCCESS] -> {domain}")
                break
            else:
                print(f"  [ERROR] -> Failed: {domain} (HTTP {code})")
                break
        
        time.sleep(1.5)

        if success_status:
            print(f"  [WAIT] Polling for {domain} to become active...")
            for _ in range(12):
                chk_res, chk_code = api_request("GET", f"{base_url}/{foldername}/domains/{domain}", token)
                if chk_code == 200 and chk_res and chk_res.get("success"):
                    status = chk_res["result"].get("status")
                    if status == "active":
                        domain_is_active = True
                        print(f"  [READY] -> {domain} is active!")
                        break
                    time.sleep(5)
                elif chk_code == 429:
                    time.sleep(10)
                else:
                    time.sleep(3)
            
            if not domain_is_active:
                print(f"  [WARN] -> {domain} did not become active in time. Skipping DNS provisioning.")

    # DNS CNAME Provisioning
    if zone_id and domain_is_active:
        target_content = f"{foldername}.pages.dev"
        cname_payload = {
            "type": "CNAME", "name": domain, "content": target_content,
            "proxied": True, "comment": "Auto-provisioned by QuickUtils orchestrator"
        }
        
        dns_res, _ = api_request("GET", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records?name={domain}&type=CNAME", token)
        if dns_res and dns_res.get("success"):
            records = dns_res.get("result", [])
            if len(records) == 0:
                dns_post, dns_code = api_request("POST", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records", token, payload=cname_payload)
                if dns_code in (200, 201):
                    print(f"    [DNS OK] -> Created proxied CNAME {domain} -> {target_content}")
            else:
                existing = records[0]
                if not existing.get("proxied") or existing.get("content") != target_content:
                    dns_put, dns_code = api_request("PUT", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{existing['id']}", token, payload=cname_payload)
                    if dns_code in (200, 201):
                        print(f"    [DNS OK] -> Updated CNAME {domain} -> {target_content}")
                else:
                    print(f"    [DNS SKIP] -> CNAME {domain} is already proxied correctly.")

    return action_type, f"Processed {domain}"


def assign_domains():
    if not CONFIG_PATH.exists():
        print(f"Error: {CONFIG_PATH} not found.")
        return

    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        projects = json.load(f)

    token = find_wrangler_token()
    if not token:
        print("Error: Could not find Wrangler token.")
        return

    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    if not account_id:
        print("Error: CLOUDFLARE_ACCOUNT_ID not set.")
        return

    base_url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects"
    
    print("Fetching all projects to map existing domains...")
    project_domain_map = {}
    all_projects_res, _ = api_request("GET", f"{base_url}?per_page=100", token)
    if all_projects_res and all_projects_res.get("success"):
        for proj in all_projects_res.get("result", []):
            proj_name = proj.get("name")
            for d in proj.get("domains", []):
                if isinstance(d, str): project_domain_map[d] = proj_name
                elif isinstance(d, dict) and "name" in d: project_domain_map[d["name"]] = proj_name

    zones_res, _ = api_request("GET", "https://api.cloudflare.com/client/v4/zones?name=quickutils.top", token)
    zone_id = zones_res["result"][0]["id"] if (zones_res and zones_res.get("success") and zones_res.get("result")) else None

    tasks = []
    for arch_key, cfg in projects.items():
        domain_raw = cfg.get("custom_domain", "")
        if "quickutils.top" in domain_raw:
            domain = domain_raw.replace("https://", "").replace("http://", "").strip("/").split("/")[0]
            foldername = cfg.get("repo_name", arch_key)
            tasks.append((domain, foldername))

    print(f"Initiating bulk domain REST API assignment for {len(tasks)} domains (using 8 parallel workers)...")
    
    stats = {"assigned": 0, "skipped": 0, "errors": 0}
    
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(process_domain, d, f, base_url, token, zone_id, project_domain_map): d for d, f in tasks}
        for future in as_completed(futures):
            domain = futures[future]
            try:
                action_type, msg = future.result()
                if action_type in stats:
                    stats[action_type] += 1
            except Exception as e:
                print(f"Error processing {domain}: {e}")
                stats["errors"] += 1

    print(f"\nProcess Completed. Assigned: {stats['assigned']}. Skipped: {stats['skipped']}. Errors: {stats['errors']}")
    return stats

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch-size", type=int, default=10)
    parser.add_argument("--delay", type=float, default=5)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--report-json", type=str, default=None)
    args = parser.parse_args()

    if not args.dry_run:
        result = assign_domains()
        if args.report_json and result:
            with open(args.report_json, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2)
