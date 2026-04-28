"""
Cloudflare Pages orphan cleanup script.
Lists all Cloudflare Pages projects via API and compares against
terraform/projects.json. Optionally deletes projects that exist in
Cloudflare but NOT in the repo configuration.

Usage:
    python scripts/cf_cleanup_orphans.py --dry-run     # Preview only
    python scripts/cf_cleanup_orphans.py               # Delete orphans
"""
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


def find_token():
    """Find Cloudflare API token from wrangler config or env."""
    wrangler_paths = [
        Path(os.environ.get("APPDATA", "C:/")) / ".wrangler" / "config" / "default.toml",
        Path.home() / ".config" / ".wrangler" / "config" / "default.toml",
        Path.home() / ".wrangler" / "config" / "default.toml",
    ]
    for p in wrangler_paths:
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
    """Make a Cloudflare API request."""
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
        return None, e.code
    except Exception:
        return None, 500


def main():
    parser = argparse.ArgumentParser(description="Clean up orphaned Cloudflare Pages projects")
    parser.add_argument("--dry-run", action="store_true", help="Preview only, don't delete")
    parser.add_argument("--report-json", type=str, default=None, help="Path to write report")
    args = parser.parse_args()

    if not CONFIG_PATH.exists():
        print(f"Error: {CONFIG_PATH} not found.")
        sys.exit(1)

    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        projects_config = json.load(f)

    token = find_token()
    if not token:
        print("Error: No API token found.")
        sys.exit(1)

    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    if not account_id:
        print("Error: CLOUDFLARE_ACCOUNT_ID not set.")
        sys.exit(1)

    # Get all repo_names from config
    known_names = set()
    for key, cfg in projects_config.items():
        known_names.add(cfg.get("repo_name", key))
        known_names.add(key)

    # Fetch all Cloudflare Pages projects
    base_url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects"
    all_cf_projects = []
    page = 1
    while True:
        res, code = api_request("GET", f"{base_url}?per_page=50&page={page}", token)
        if not res or not res.get("success"):
            break
        results = res.get("result", [])
        if not results:
            break
        all_cf_projects.extend(results)
        if len(results) < 100:
            break
        page += 1
        time.sleep(1)

    cf_names = {p["name"] for p in all_cf_projects}
    orphans = cf_names - known_names

    print(f"\n{'='*60}")
    print(f"Cloudflare Pages projects: {len(cf_names)}")
    print(f"Repo config projects: {len(known_names)}")
    print(f"Orphaned projects: {len(orphans)}")
    print(f"{'='*60}\n")

    report = {"total_cf": len(cf_names), "total_config": len(known_names), "orphans": [], "deleted": [], "errors": []}

    if not orphans:
        print("✅ No orphaned projects found. Everything is in sync!")
    else:
        for name in sorted(orphans):
            report["orphans"].append(name)
            if args.dry_run:
                print(f"  [DRY RUN] Would delete: {name}")
            else:
                print(f"  Deleting orphan: {name} ...", end=" ")
                del_res, del_code = api_request("DELETE", f"{base_url}/{name}", token)
                if del_code in [200, 204]:
                    print("✅ Deleted")
                    report["deleted"].append(name)
                else:
                    print(f"❌ Failed (HTTP {del_code})")
                    report["errors"].append({"name": name, "code": del_code})
                time.sleep(2)

    if args.report_json:
        with open(args.report_json, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        print(f"\nReport written to {args.report_json}")


if __name__ == "__main__":
    main()
