import os
import sys
import json
import time
import urllib.request
import urllib.error
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
PROJECTS_JSON = ROOT_DIR / "terraform" / "projects.json"

def get_deployment_count(account_id, api_token, project_name):
    """Check how many deployments a project has to detect 522 states (0 deployments)."""
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/{project_name}/deployments"
    req = urllib.request.Request(url, method="GET")
    req.add_header("Authorization", f"Bearer {api_token}")
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read().decode("utf-8"))
        deployments = data.get("result", [])
        
        # Performance/Queue Fix: Purge pending builds prior to queueing a new one
        for dep in deployments:
            if dep.get('latest_stage', {}).get('status') in ['queued', 'building', 'active', 'pending', 'idle', 'initializing']:
                dep_id = dep.get('id')
                cancel_url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/{project_name}/deployments/{dep_id}/cancel"
                creq = urllib.request.Request(cancel_url, method="POST")
                creq.add_header("Authorization", f"Bearer {api_token}")
                try: 
                    urllib.request.urlopen(creq, timeout=10)
                    print(f"    - Purged hanging queued build for {project_name}")
                except Exception: 
                    pass
        
        return len(deployments)
    except Exception as e:
        print(f"⚠️ Could not check deployment count for {project_name}: {e}")
        return -1

def trigger_deployment(account_id, api_token, project_name):
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/{project_name}/deployments"
    req = urllib.request.Request(url, method="POST")
    req.add_header("Authorization", f"Bearer {api_token}")
    req.add_header("Content-Type", "application/json")
    # Send branch explicitly so Cloudflare fetches the latest commit instead of reusing the stale known hash
    payload = json.dumps({"branch": "main"}).encode("utf-8")
    try:
        resp = urllib.request.urlopen(req, data=payload, timeout=30)
        print(f"✅ Successfully queued deployment for {project_name}")
        return True
    except urllib.error.HTTPError as e:
        if e.code == 304:
            print(f"⏩ {project_name} skipped: HTTP 304 Not Modified (latest commit already deployed)")
            return True
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

    all_projects = get_all_project_names()
    if not all_projects:
        print("Could not determine project list from projects.json; aborting.")
        return

    deploy_list = set()

    # 1. Add explicitly changed projects
    if changed:
        if changed.strip() == "ALL":
            deploy_list.update(all_projects)
            print(f"🚀 Deploying ALL {len(all_projects)} projects via manual trigger...")
        else:
            changed_list = [p.strip() for p in changed.split(",") if p.strip()]
            deploy_list.update(changed_list)
            print(f"📝 Found {len(changed_list)} changed projects to deploy.")

    # 2. Add any projects with 0 deployments (522 error state)
    print("\n🔍 Checking all projects for 522 Not Deployed state (0 deployments)...")
    for project in all_projects:
        if project in deploy_list:
            continue # already queued
        
        count = get_deployment_count(account_id, api_token, project)
        if count == 0:
            print(f"⚠️ Alert: {project} has 0 prior deployments! Adding to queue to fix 522 error.")
            deploy_list.add(project)
        time.sleep(1) # small pause to respect Cloudflare API rate limits
        
    if not deploy_list:
        print("No projects to deploy and all existing projects have >0 deployments.")
        return

    print(f"\n🚀 Triggering CF rebuilds for {len(deploy_list)} projects...")
    success = 0
    for project in deploy_list:
        if trigger_deployment(account_id, api_token, project):
            success += 1
        time.sleep(5)
    
    print(f"\n📊 Deployment summary: {success}/{len(deploy_list)} projects queued/synced successfully.")

if __name__ == "__main__":
    main()
