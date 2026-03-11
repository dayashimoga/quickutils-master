import os
import shutil
from pathlib import Path

# Master files to distribute
MASTER_FILES = [
    "scripts/build_directory.py",
    "scripts/generate_sitemap.py",
    "scripts/utils.py",
    "requirements.txt",
]

ROOT_DIR = Path(__file__).resolve().parent.parent
MASTER_SCRIPTS_DIR = ROOT_DIR / "scripts"
PROJECTS_DIR = ROOT_DIR / "projects"

def sync_scripts():
    print("🔄 Synchronizing master scripts to projects...")
    
    if not PROJECTS_DIR.exists():
        print(f"  ✗ Projects directory not found at {PROJECTS_DIR}")
        return

    # Sync to each project directory
    for project in PROJECTS_DIR.iterdir():
        if not project.is_dir():
            continue
        
        # Skip hidden directories
        if project.name.startswith("."):
            continue

        print(f"  → Syncing to {project.name}...")
        for file_rel_path in MASTER_FILES:
            src = ROOT_DIR / file_rel_path
            
            # Determine destination
            if file_rel_path.startswith("scripts/"):
                # Master scripts go to project/scripts/
                script_name = os.path.basename(file_rel_path)
                dst = project / "scripts" / script_name
            else:
                # Root files go to project/ (e.g., requirements.txt)
                dst = project / file_rel_path
            
            if src.exists():
                # Ensure destination directory exists
                dst.parent.mkdir(parents=True, exist_ok=True)
                
                shutil.copy2(src, dst)
                print(f"    ✓ Copied {file_rel_path}")
            else:
                print(f"    ✗ Master file {file_rel_path} not found!")

        # Fix netlify.toml redirects (/api/* -> /item/*)
        netlify_toml = project / "netlify.toml"
        if netlify_toml.exists():
            content = netlify_toml.read_text(encoding="utf-8")
            if "/api/*" in content:
                content = content.replace("/api/*", "/item/*")
                netlify_toml.write_text(content, encoding="utf-8")
                print("    ✓ Updated netlify.toml redirects (/api/ -> /item/)")

        # Clean up legacy wrangler and netlify configs
        legacy_configs = ["wrangler.toml", "wrangler.jsonc", "wrangler.json", "netlify.toml", "_redirects", "_headers"]
        for config in legacy_configs:
            cfg_path = project / config
            if cfg_path.exists():
                cfg_path.unlink()
                print(f"    🗑 Removed legacy {config}")
            
        legacy_workflow = project / ".github" / "workflows" / "cloudflare-pages.yml"
        if legacy_workflow.exists():
            legacy_workflow.unlink()
            print("    🗑 Removed redundant cloudflare-pages.yml")

    print("\n✅ Synchronization complete.")

if __name__ == "__main__":
    sync_scripts()
