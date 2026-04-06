import json
import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
PROJECT_CONFIG_PATH = ROOT_DIR / "project_config.json"
TERRAFORM_PROJECTS_PATH = ROOT_DIR / "terraform" / "projects.json"

def generate():
    if not PROJECT_CONFIG_PATH.exists():
        print("✗ project_config.json not found!")
        return

    config = json.loads(PROJECT_CONFIG_PATH.read_text(encoding="utf-8"))
    projects = config.get("projects", {})
    
    terraform_projects = {}
    
    for key, data in projects.items():
        base_cmd = "mkdir -p dist && cp index.html style.css script.js dist/"
        # For python Jinja directories
        if "directory" in key:
            base_cmd = "export PYTHONPATH=$PYTHONPATH:. && pip install -r requirements.txt && python scripts/fetch_data.py && python scripts/build_directory.py && python scripts/generate_sitemap.py"

        terraform_projects[key] = {
            "directory": f"projects/{key}",
            "repo_name": key,
            "build_command": base_cmd,
            "destination_dir": "dist",
            "custom_domain": data.get("SITE_URL", "").replace("https://", "").replace("http://", "").strip("/"),
            "root_dir": f"projects/{key}"
        }
        
    TERRAFORM_PROJECTS_PATH.write_text(json.dumps(terraform_projects, indent=4), encoding="utf-8")
    print(f"✅ Generated terraform/projects.json with {len(terraform_projects)} projects.")

if __name__ == "__main__":
    generate()
