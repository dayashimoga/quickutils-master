# pragma: no cover
import os
import sys
import json
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
PROJECTS_JSON = ROOT_DIR / "terraform" / "projects.json"

def get_projects_config():
    try:
        with open(PROJECTS_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading projects.json: {e}")
        return {}

def run_build_and_deploy(project_key, config):
    repo_name = config.get("repo_name", project_key)
    build_cmd = config.get("build_command", "mkdir -p dist && cp -r * dist/ || true")
    root_dir = config.get("directory", config.get("root_dir", f"projects/{repo_name}"))
    out_dir = config.get("destination_dir", "dist")

    print(f"\n🚀 Processing {repo_name}...")
    
    # 1. Build
    try:
        full_cwd = ROOT_DIR / root_dir
        if not full_cwd.exists():
            print(f"⚠️ Directory {full_cwd} does not exist. Skipping.")
            return False
            
        print(f"🔨 Running build: {build_cmd}")
        subprocess.run(build_cmd, shell=True, cwd=full_cwd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Build failed for {repo_name}: {e}")
        return False
        
    # 2. Deploy
    try:
        dist_path = full_cwd / out_dir
        if not dist_path.exists():
            print(f"⚠️ Output directory {dist_path} not found!")
            # try fallback
            dist_path = full_cwd
            
        print(f"☁️ Deploying {dist_path} via Wrangler...")
        deploy_cmd = [
            "npx", "wrangler@latest", "pages", "deploy", 
            str(dist_path),
            "--project-name", repo_name,
            "--branch", "main"
        ]
        
        # Wrangler uses CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN from env
        result = subprocess.run(deploy_cmd, check=True)
        print(f"✅ Successfully deployed {repo_name}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Deployment failed for {repo_name}: {e}")
        return False

def main():
    changed = os.environ.get("CHANGED_PROJECTS", "")
    
    projects = get_projects_config()
    if not projects:
        return

    deploy_list = set()
    
    if changed:
        if changed.strip() == "ALL":
            deploy_list.update(projects.keys())
            print(f"🚀 Deploying ALL projects...")
        else:
            changed_list = [p.strip() for p in changed.split(",") if p.strip()]
            for p in changed_list:
                for k, v in projects.items():
                    if v.get("repo_name") == p or k == p:
                        deploy_list.add(k)
                        break
            print(f"📝 Found {len(deploy_list)} changed projects to deploy.")
            
    if not deploy_list:
        print("No projects to deploy.")
        return

    success = 0
    for key in deploy_list:
        if run_build_and_deploy(key, projects[key]):
            success += 1
            
    print(f"\n📊 Deployment summary: {success}/{len(deploy_list)} projects built and deployed successfully.")

if __name__ == "__main__":
    main()
