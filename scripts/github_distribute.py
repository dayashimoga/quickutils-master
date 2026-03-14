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
    
    # Priority: 1. GITHUB_ACTOR (CI), 2. Explicit OWNER env, 3. GH_USERNAME from config
    username = os.environ.get("GITHUB_ACTOR") or os.environ.get("OWNER") or GH_USERNAME
    
    if PAT:
        # Get/Verify GitHub Username via API
        try:
            user_res = requests.get("https://api.github.com/user", headers={"Authorization": f"token {PAT}"})
            if user_res.status_code == 200:
                username = user_res.json().get("login")
                print(f"Authenticated as: {username}")
            else:
                print(f"Warning: Failed to verify token ({user_res.status_code}). Using {username}")
        except Exception as e:
            print(f"Warning: Error during authentication: {e}. Using {username}")
    else:
        print(f"Warning: GH_PAT not found. API features (repo creation) will be disabled. Using {username}")
    
    _username_cache = username
    return username

def get_projects():
    BASE_PATH = Path(__file__).parent.parent
    PROJECTS_DIR = BASE_PATH / "projects"
    projects = {}
    
    # Dynamically discover all project directories
    if PROJECTS_DIR.exists():
        for d in PROJECTS_DIR.iterdir():
            if d.is_dir() and not d.name.startswith(".") and d.name != "quickutils-master":
                projects[d.name] = str(d.absolute())
            
    return projects

def create_github_repo(repo_name):
    username = get_username()
    print(f"\nProcessing {repo_name}...")
    
    if not PAT:
        return f"https://github.com/{username}/{repo_name}.git"
        
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
    print(f"  Syncing {local_path} to {remote_url}...")
    auth_url = remote_url
    if PAT:
        auth_url = remote_url.replace("https://", f"https://{PAT}@")
    
    import tempfile
    import shutil
    import stat

    # Helper function to handle read-only files on Windows
    def remove_readonly(func, path, excinfo):
        os.chmod(path, stat.S_IWRITE)
        func(path)

    with tempfile.TemporaryDirectory() as temp_dir:
        # Clone existing repo
        clone_cmd = ["git", "clone", auth_url, temp_dir]
        res = subprocess.run(clone_cmd, capture_output=True)
        if res.returncode != 0:
            print(f"  Warning: Could not clone, initializing new repo instead.")
            subprocess.run(["git", "init"], cwd=temp_dir, check=False)
            subprocess.run(["git", "checkout", "-b", "main"], cwd=temp_dir, check=False)
            subprocess.run(["git", "remote", "add", "origin", auth_url], cwd=temp_dir, check=False)

        # Remove everything except .git
        for item in os.listdir(temp_dir):
            if item == ".git":
                continue
            item_path = os.path.join(temp_dir, item)
            if os.path.isdir(item_path):
                shutil.rmtree(item_path, onerror=remove_readonly)
            else:
                os.remove(item_path)

        # Copy new files
        for item in os.listdir(local_path):
            if item == ".git": # Don't copy local .git if it inadvertently exists
                continue
            s = os.path.join(local_path, item)
            d = os.path.join(temp_dir, item)
            if os.path.isdir(s):
                shutil.copytree(s, d)
            else:
                shutil.copy2(s, d)

        # Add and check changes
        subprocess.run(["git", "add", "."], cwd=temp_dir, check=False)
        status_res = subprocess.run(["git", "status", "--porcelain"], cwd=temp_dir, capture_output=True, text=True)
        
        if status_res.stdout.strip():
            print(f"  Changes detected. Committing and pushing...")
            subprocess.run(["git", "commit", "-m", "Automation: Sync from Master Repository"], cwd=temp_dir, check=False)
            push_res = subprocess.run(["git", "push", "-u", "origin", "main"], cwd=temp_dir, capture_output=True, text=True)
            if push_res.returncode != 0:
                 print(f"  Push output: {push_res.stderr}")
        else:
            print(f"  No changes to sync for {local_path}.")

def main():
    projects = get_projects()
    for repo_name, local_path in projects.items():
        clone_url = create_github_repo(repo_name)
        if clone_url:
            sync_repo(local_path, clone_url)
            
    print("\nAll projects synchronized successfully.")

if __name__ == "__main__":
    main()
