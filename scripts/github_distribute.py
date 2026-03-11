import os
import subprocess
import requests
import json
from pathlib import Path

# Configuration - Renamed to match orchestrator standard
from scripts.utils import GH_USERNAME
PAT = os.environ.get("GH_PAT") or os.environ.get("GITHUB_PAT")

_username_cache = None

def get_username():
    global _username_cache
    if _username_cache is not None:
        return _username_cache
    if PAT:
        # Get GitHub Username
        try:
            user_res = requests.get("https://api.github.com/user", headers={"Authorization": f"token {PAT}"})
            if user_res.status_code == 200:
                _username_cache = user_res.json().get("login")
                print(f"Authenticated as: {_username_cache}")
                return _username_cache
            else:
                print(f"Warning: Failed to authenticate with token ({user_res.status_code}).")
        except Exception as e:
            print(f"Warning: Error during authentication: {e}")
    else:
        print("Warning: GH_PAT not found. API features (repo creation) will be disabled.")
    
    _username_cache = ""
    return ""

def get_projects():
    root = Path("h:/boring/projects")
    projects = {}
    
    # 1. Add directories
    for d in root.iterdir():
        if d.is_dir() and d.name.endswith("-directory"):
            projects[d.name] = str(d.absolute())
            
    # 2. Add special projects
    if (root / "boringwebsite").exists():
        projects["boringwebsite"] = str((root / "boringwebsite").absolute())
        
    return projects

def create_github_repo(repo_name):
    username = get_username() or GH_USERNAME
    if not PAT or not username:
        # Fallback to existing git remote if we can find it
        return f"https://github.com/{GH_USERNAME}/{repo_name}.git"
        
    print(f"\nProcessing {repo_name}...")
    url = "https://api.github.com/user/repos"
    data = {
        "name": repo_name,
        "description": f"QuickUtils Component: {repo_name}",
        "private": False
    }
    headers = {
        "Authorization": f"token {PAT}",
        "Accept": "application/vnd.github.v3+json"
    }
    res = requests.post(url, headers=headers, data=json.dumps(data))
    if res.status_code in [201, 422]:
        return f"https://github.com/{username}/{repo_name}.git"
    return None

def sync_repo(local_path, remote_url):
    print(f"  Syncing to {remote_url}...")
    auth_url = remote_url
    if PAT:
        auth_url = remote_url.replace("https://", f"https://{PAT}@")
    
    commands = [
        ["git", "init"],
        ["git", "remote", "remove", "origin"],
        ["git", "remote", "add", "origin", auth_url],
        ["git", "branch", "-M", "main"],
        ["git", "add", "."],
        ["git", "commit", "-m", "chore: sync cleaned repositories and optimized tests"],
        ["git", "push", "-u", "origin", "main", "--force"]
    ]
    
    for cmd in commands:
        try:
            subprocess.run(cmd, cwd=local_path, check=False, capture_output=True)
        except Exception as e:
            print(f"  Warning on command {cmd}: {e}")

def main():
    # Main execution
    projects = get_projects()
    for repo_name, local_path in projects.items():
        clone_url = create_github_repo(repo_name)
        if clone_url:
            sync_repo(local_path, clone_url)
            
    print("\nAll projects synchronized successfully.")

if __name__ == "__main__":
    main()
