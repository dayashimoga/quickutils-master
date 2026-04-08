import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
PROJECT_CONFIG_PATH = ROOT_DIR / "project_config.json"
# In-place patch
TERRAFORM_PROJECTS_DEST = ROOT_DIR / "terraform" / "projects.json"

def apply():
    # 1. Load the existing architecture from git baseline
    with open(TERRAFORM_PROJECTS_DEST, "r", encoding="utf-8") as f:
        arch = json.load(f)
        
    with open(PROJECT_CONFIG_PATH, "r", encoding="utf-8") as f:
        master_config = json.load(f)
    
    projects = master_config.get("projects", {})
    
    # 2. Add any missing newly created projects
    arch_repo_names = {v.get("repo_name", k) for k, v in arch.items()}
    for project_id, info in projects.items():
        if project_id not in arch_repo_names and project_id not in arch and project_id != "quickutils-master": # skip master to handle repo_name logic
            # clean domain
            domain_raw = info.get("SITE_URL", "")
            domain = domain_raw.replace("https://", "").replace("http://", "").strip("/")
            
            # Resilient static site build command caching all dependencies and global core styles
            arch[project_id] = {
                "directory": f"projects/{project_id}",
                "repo_name": project_id,
                "build_command": "mkdir -p dist && cp *.html *.css *.js dist/ || true; cp ../../shared/quickutils-core.* dist/ 2>null || true",
                "destination_dir": "dist",
                "custom_domain": domain,
                "root_dir": f"projects/{project_id}"
            }

    # 3. Synchronize custom domains strictly for existing elements
    for arch_key, config in arch.items():
        # Match repo_name to projects list from config
        repo_name = config.get("repo_name", arch_key)
        
        # In project_config.json, the key exactly matches repo_name in 100% of cases
        if repo_name in projects:
            domain_raw = projects[repo_name].get("SITE_URL", "")
            domain = domain_raw.replace("https://", "").replace("http://", "").strip("/")
            if domain:
                arch[arch_key]["custom_domain"] = domain
                
    # 4. Dump back to original terraform/projects.json safely
    with open(TERRAFORM_PROJECTS_DEST, "w", encoding="utf-8") as f:
        json.dump(arch, f, indent=4)
        
    print(f"Successfully merged {len(arch)} definitions safely into terraform/projects.json!")

if __name__ == "__main__":
    apply()
