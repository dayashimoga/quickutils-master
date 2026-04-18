import json
import subprocess
from pathlib import Path
import time

ROOT_DIR = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT_DIR / "project_config.json"

def assign_domains():
    if not CONFIG_PATH.exists():
        print(f"Error: {CONFIG_PATH} not found.")
        return

    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        master_config = json.load(f)

    projects = master_config.get("projects", {})
    count = 0
    errors = 0

    print(f"Loaded {len(projects)} projects from config. Initiating bulk domain assignment...")
    
    for foldername, cfg in projects.items():
        site_url = cfg.get("SITE_URL", "")
        if "quickutils.top" in site_url:
            domain = site_url.replace("https://", "").replace("http://", "").strip("/")
            print(f"Assigning {domain} to {foldername}...")
            
            # Using try-except block securely
            try:
                import os
                npx_cmd = "npx.cmd" if os.name == "nt" else "npx"
                cmd = [npx_cmd, "wrangler@latest", "pages", "domain", "add", domain, "--project-name", foldername]
                subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=20)
                count += 1
                print(f"  [SUCCESS] -> {domain}")
            except subprocess.TimeoutExpired:
                print(f"  [TIMEOUT] -> Failed adding {domain}")
                errors += 1
            except subprocess.CalledProcessError as e:
                # Often occurs if it's already bound, which is perfectly fine
                stderr_text = e.stderr.decode("utf-8") if e.stderr else str(e)
                if "already bound" in stderr_text.lower() or "already configured" in stderr_text.lower() or "already exists" in stderr_text.lower() or "active" in stderr_text.lower() or "conflict" in stderr_text.lower():
                    print(f"  [SKIP] -> Already configured: {domain}")
                else:
                    print(f"  [ERROR] -> Failed: {domain}")
                    print(f"     Details: {stderr_text.strip()}")
                    errors += 1
                    
            # Let wrangler breath between requests
            time.sleep(1)

    print(f"\\nProcess Completed. Successfully Assigned: {count}. Errors: {errors}")

if __name__ == "__main__":
    assign_domains()
