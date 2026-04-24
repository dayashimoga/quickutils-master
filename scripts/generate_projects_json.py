# pragma: no cover
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
    
    # 2. Add any missing newly created projects (ONLY if folder exists)
    arch_repo_names = {v.get("repo_name", k) for k, v in arch.items()}
    for project_id, info in projects.items():
        if project_id not in arch_repo_names and project_id not in arch and project_id != "quickutils-directory": # skip directory to handle repo_name logic
            # Safety: only add if the project folder actually exists
            project_folder = ROOT_DIR / "projects" / project_id
            if not project_folder.exists():
                continue
            
            # clean domain — skip if None or empty
            domain_raw = info.get("SITE_URL", "")
            if not domain_raw or domain_raw == "None" or "None" in str(domain_raw):
                continue
            domain = domain_raw.replace("https://", "").replace("http://", "").strip("/")
            if not domain or domain.startswith("None"):
                continue
            
            # Resilient static site build command caching all dependencies and global core styles
            if project_id.endswith("-directory"):
                build_cmd = f"python ../../scripts/build_directory.py --type {project_id.replace('-directory', '')} && mkdir -p dist && cp *.html *.css *.js dist/ || true; cp ../../shared/quickutils-core.* dist/ 2>null || true"
            elif project_id == "market-digest":
                build_cmd = "python fetch_data.py && mkdir -p dist && cp -r * dist/ || true"
            else:
                build_cmd = "mkdir -p dist && cp *.html *.css *.js dist/ || true; cp ../../shared/quickutils-core.* dist/ 2>null || true"
                
            arch[project_id] = {
                "directory": f"projects/{project_id}",
                "repo_name": project_id,
                "build_command": build_cmd,
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
                
        # Update build commands for directories and market-digest
        if arch_key.endswith("-directory"):
            arch[arch_key]["build_command"] = f"python ../../scripts/build_directory.py --type {arch_key.replace('-directory', '')} && mkdir -p dist && cp *.html *.css *.js dist/ || true; cp ../../shared/quickutils-core.* dist/ 2>null || true"
        elif arch_key == "market-digest":
            arch[arch_key]["build_command"] = "python fetch_data.py && mkdir -p dist && cp -r * dist/ || true"
        elif arch_key == "master" or arch_key == "quickutils-directory":
            arch[arch_key]["build_command"] = "python scripts/build_directory.py --type all && mkdir -p dist && cp *.html *.css *.js dist/ || true"
                
    # 4. Dump back to original terraform/projects.json safely
    with open(TERRAFORM_PROJECTS_DEST, "w", encoding="utf-8") as f:
        json.dump(arch, f, indent=4)
        
    print(f"Successfully merged {len(arch)} definitions safely into terraform/projects.json!")

if __name__ == "__main__":
    apply()
