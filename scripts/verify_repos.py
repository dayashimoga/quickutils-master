import os
import requests
import json
from pathlib import Path

# Load project config to get project names
PROJECTS_JSON = Path("terraform/projects.json")
PAT = os.environ.get("GH_PAT")

if not PAT:
    print("❌ Error: GH_PAT environment variable not found.")
    print("Usage: $env:GH_PAT='...'; python verify_repos.py")
    exit(1)

if not PROJECTS_JSON.exists():
    print(f"❌ Error: {PROJECTS_JSON} not found.")
    exit(1)

with open(PROJECTS_JSON, "r") as f:
    projects = json.load(f)

headers = {
    "Authorization": f"token {PAT}",
    "Accept": "application/vnd.github.v3+json"
}

# Get current user login
user_res = requests.get("https://api.github.com/user", headers=headers)
if user_res.status_code != 200:
    print(f"❌ Error: Failed to authenticate with GH_PAT ({user_res.status_code})")
    exit(1)

username = user_res.json().get("login")
print(f"✅ Authenticated as: {username}\n")

for key, config in projects.items():
    repo_name = config.get("repo_name")
    print(f"🔍 Checking {repo_name}...")
    
    # Check if repo exists
    repo_res = requests.get(f"https://api.github.com/repos/{username}/{repo_name}", headers=headers)
    
    if repo_res.status_code == 200:
        print(f"  ✅ Repository exists: https://github.com/{username}/{repo_name}")
    elif repo_res.status_code == 404:
        print(f"  🚀 Creating new repository: {repo_name}...")
        create_res = requests.post(
            "https://api.github.com/user/repos", 
            headers=headers, 
            json={
                "name": repo_name,
                "description": f"QuickUtils Component: {repo_name}",
                "private": False
            }
        )
        if create_res.status_code == 201:
            print(f"  ✨ Successfully created repository.")
        else:
            print(f"  ❌ Failed to create repository: {create_res.status_code} - {create_res.text}")
    else:
        print(f"  ❌ Error checking repository: {repo_res.status_code}")

print("\n🏁 Repository verification complete. You can now run the distribution script.")
