# pragma: no cover
import os
import sys
import json
import subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT_DIR = Path(__file__).resolve().parent.parent
PROJECTS_JSON = ROOT_DIR / "terraform" / "projects.json"
MAX_PARALLEL = 8  # Increased parallelism to optimize deploy speed

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

    # 1. Build
    try:
        full_cwd = ROOT_DIR / root_dir
        if not full_cwd.exists():
            print(f"⚠️ [{repo_name}] Directory {full_cwd} does not exist. Skipping.")
            return repo_name, False

        subprocess.run(build_cmd, shell=True, cwd=full_cwd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ [{repo_name}] Build failed: {e}")
        return repo_name, False

    # 2. Deploy
    dist_path = full_cwd / out_dir
    if not dist_path.exists():
        dist_path = full_cwd

    deploy_cmd = [
        "wrangler", "pages", "deploy",
        str(dist_path),
        "--project-name", repo_name,
        "--branch", "main",
        "--commit-dirty=true"
    ]

    max_retries = 8
    for attempt in range(max_retries):
        try:
            result = subprocess.run(deploy_cmd, check=True,
                                    stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                    timeout=120)
            print(f"✅ [{repo_name}] Deployed successfully")
            return repo_name, True
            
        except subprocess.CalledProcessError as e:
            stderr = e.stderr.decode() if e.stderr else ""
            stdout = e.stdout.decode() if e.stdout else ""
            
            # Auto-create if project missing
            if "could not find" in stderr.lower() or "project not found" in stderr.lower():
                if attempt == 0:
                    print(f"⚠️ [{repo_name}] Project not found on Cloudflare — creating it...")
                    try:
                        create_cmd = [
                            "npx", "wrangler@3", "pages", "project", "create",
                            repo_name, "--production-branch", "main"
                        ]
                        subprocess.run(create_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=30)
                        continue # Native retry
                    except Exception as e2:
                        print(f"❌ [{repo_name}] Create failed: {e2}")
                        return repo_name, False
                        
            # Cloudflare 429 Rate Limit Interception
            if "429" in stderr or "too many requests" in stderr.lower() or "429 Too Many Requests" in stdout:
                if attempt < max_retries - 1:
                    wait_time = 120 + (attempt * 60)
                    print(f"⏳ [{repo_name}] Rate limited by Cloudflare (429). Sleeping for {wait_time}s...")
                    import time
                    time.sleep(wait_time)
                    continue
                    
            print(f"❌ [{repo_name}] Deploy failed.\nSTDOUT:\n{stdout[-1000:]}\nSTDERR:\n{stderr[-1000:]}")
            return repo_name, False
            
        except subprocess.TimeoutExpired:
            print(f"❌ [{repo_name}] Deploy timed out after 120s")
            return repo_name, False


def main():
    changed = os.environ.get("CHANGED_PROJECTS", "")

    projects = get_projects_config()
    if not projects:
        return

    deploy_list = set()

    if changed:
        if changed.strip() == "ALL":
            deploy_list.update(projects.keys())
            print(f"🚀 Deploying ALL {len(deploy_list)} projects...")
        elif changed.strip() != "NONE":
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

    # Deploy in parallel batches
    success = 0
    failed = []
    print(f"\n🚀 Deploying {len(deploy_list)} projects ({MAX_PARALLEL} parallel)...\n")

    with ThreadPoolExecutor(max_workers=MAX_PARALLEL) as executor:
        futures = {
            executor.submit(run_build_and_deploy, key, projects[key]): key
            for key in deploy_list
        }
        for future in as_completed(futures):
            name, ok = future.result()
            if ok:
                success += 1
            else:
                failed.append(name)

    print(f"\n📊 Deployment: {success}/{len(deploy_list)} succeeded")
    if failed:
        print(f"❌ Failed: {', '.join(failed)}")


if __name__ == "__main__":
    main()
# Trigger Redeploy
# Trigger redeploy
