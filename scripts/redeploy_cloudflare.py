import os
import sys
import json
import time
import urllib.request
import urllib.error
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
PROJECTS_JSON = ROOT_DIR / "terraform" / "projects.json"

def trigger_deployment(account_id, api_token, project_name):
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/{project_name}/deployments"
    req = urllib.request.Request(url, method="POST")
    req.add_header("Authorization", f"Bearer {api_token}")
    req.add_header("Content-Type", "application/json")
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        print(f"✅ Successfully queued deployment for {project_name}")
        return True
    except urllib.error.HTTPError as e:
        print(f"❌ Failed to queue {project_name}: HTTP Error {e.code}: {e.reason}")
        return False
    except urllib.error.URLError as e:
        print(f"❌ Failed to queue {project_name}: {e}")
        return False

def get_all_project_names():
    """Read all repo_name values from terraform/projects.json"""
    try:
        with open(PROJECTS_JSON, "r", encoding="utf-8") as f:
            projects = json.load(f)
        return [v.get("repo_name", k) for k, v in projects.items()]
    except Exception as e:
        print(f"Error reading projects.json: {e}")
        return []

def main():
    changed = os.environ.get("CHANGED_PROJECTS", "")
    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    api_token = os.environ.get("CLOUDFLARE_API_TOKEN")

    if not account_id or not api_token:
        print("Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN environment variables.")
        return

    if not changed:
        print("No CHANGED_PROJECTS set; skipping deployment trigger.")
        return

    # Determine project list
    if changed.strip() == "ALL":
        deploy_list = get_all_project_names()
        if not deploy_list:
            print("Could not determine project list from projects.json; aborting.")
            return
        print(f"🚀 Deploying ALL {len(deploy_list)} projects...")
    else:
        deploy_list = [p.strip() for p in changed.split(",") if p.strip()]

    if not deploy_list:
        print("No projects to deploy.")
        return

    print(f"Triggering sequential CF rebuilds for {len(deploy_list)} projects...")
    success = 0
    for project in deploy_list:
        if trigger_deployment(account_id, api_token, project):
            success += 1
        # Brief pause between triggers to avoid rate limiting
        time.sleep(5)
    
    print(f"\n📊 Deployment summary: {success}/{len(deploy_list)} projects queued successfully.")

if __name__ == "__main__":
    main()
