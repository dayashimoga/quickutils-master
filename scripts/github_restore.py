import os
import shutil
import subprocess
from pathlib import Path
import time
import stat

# Configuration
from scripts.utils import GH_USERNAME
USERNAME = GH_USERNAME
BASE_PATH = Path(__file__).parent.parent
PROJECTS_DIR = BASE_PATH / "projects"

def get_projects():
    return [
        "apistatus-directory",
        "boilerplates-directory",
        "cheatsheets-directory",
        "dailyfacts",
        "datasets-directory",
        "jobs-directory",
        "opensource-directory",
        "prompts-directory",
        "quotes-directory",
        "tools-directory",
        "travellogs-directory",
        "boringwebsite",
        "quickutils-master"
    ]

def remove_readonly(func, path, excinfo):
    os.chmod(path, stat.S_IWRITE)
    func(path)

def safe_rmtree(path, retries=5, delay=1):
    """Try to remove a directory with retries for Windows locks."""
    for i in range(retries):
        try:
            if os.path.exists(path):
                shutil.rmtree(path, onerror=remove_readonly)
            return True
        except Exception as e:
            if i < retries - 1:
                print(f"  Retrying removal of {path} ({i+1}/{retries})...")
                time.sleep(delay)
            else:
                print(f"  ❌ Failed to remove {path}: {e}")
                return False

def cleanup_tmp():
    """Remove any leftover temp directories."""
    print("🧹 Cleaning up temporary directories...")
    for d in PROJECTS_DIR.glob("*_temp"):
        if d.is_dir():
            print(f"  Removing {d}...")
            safe_rmtree(d)
    for d in PROJECTS_DIR.glob("*-temp*"):
        if d.is_dir():
            print(f"  Removing {d}...")
            safe_rmtree(d)

def restore_project(repo_name):
    print(f"\n🚀 Restoring {repo_name}...")
    local_path = PROJECTS_DIR / repo_name
    remote_url = f"https://github.com/{USERNAME}/{repo_name}.git"
    
    # 1. Clear existing directory if it's broken (missing data/src)
    # Special case for quickutils-master: if it's the current working dir's PARENT or similar, be careful.
    # But here it's inside projects/, so it's a clone.
    
    has_data = (local_path / "data").exists()
    has_src = (local_path / "src").exists()
    
    if local_path.exists() and (not has_data or not has_src):
        print(f"  ⚠️ {repo_name} is incomplete. Removing to re-clone...")
        if not safe_rmtree(local_path):
            return

    if local_path.exists():
        print(f"  ✅ {repo_name} appears complete. Skipping.")
        return

    # 2. Clone fresh
    print(f"  Cloning {remote_url}...")
    try:
        subprocess.run(["git", "clone", remote_url, str(local_path)], check=True, capture_output=True)
    except Exception as e:
        print(f"  ❌ Error cloning {repo_name}: {e}")
        return

    # 3. Strip .git to make it a regular directory in the master repo
    dot_git = local_path / ".git"
    if dot_git.exists():
        safe_rmtree(dot_git)
    
    print(f"  ✨ Successfully restored {repo_name}")

def main():
    if not PROJECTS_DIR.exists():
        PROJECTS_DIR.mkdir(parents=True)
        
    cleanup_tmp()
    
    projects = get_projects()
    for repo_name in projects:
        restore_project(repo_name)
    
    print("\n🏁 All projects restored.")

if __name__ == "__main__":
    main()
