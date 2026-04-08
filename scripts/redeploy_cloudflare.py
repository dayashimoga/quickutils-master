import os
import sys
import json
import time
import urllib.request
import urllib.error

def trigger_deployment(account_id, api_token, project_name):
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/{project_name}/deployments"
    req = urllib.request.Request(url, method="POST")
    req.add_header("Authorization", f"Bearer {api_token}")
    try:
        urllib.request.urlopen(req)
        print(f"✅ Successfully queued deployment for {project_name}")
        return True
    except urllib.error.URLError as e:
        print(f"❌ Failed to queue {project_name}: {e}")
        return False

def main():
    changed = os.environ.get("CHANGED_PROJECTS", "")
    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    api_token = os.environ.get("CLOUDFLARE_API_TOKEN")

    if not changed or not account_id or not api_token:
        print("Missing environment variables for CF Deployment Sequence.")
        return

    changed_list = [p.strip() for p in changed.split(",") if p.strip() and p.strip() != "ALL"]
    
    if not changed_list:
        print("No specific projects changed; skipping sequential trigger.")
        return

    print(f"Triggering sequential CF rebuilds to bypass drop limit for {len(changed_list)} projects...")
    for project in changed_list:
        trigger_deployment(account_id, api_token, project)
        # Sleep for 15 seconds between triggers to gracefully ease the Cloudflare queue limits
        time.sleep(15)

if __name__ == "__main__":
    main()
