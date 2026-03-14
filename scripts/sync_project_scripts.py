import os
import shutil
from pathlib import Path

# Master files to distribute
MASTER_FILES = [
    "scripts/build_directory.py",
    "scripts/generate_sitemap.py",
    "scripts/utils.py",
    "scripts/__init__.py",
    "scripts/generate_social_images.py",
    "scripts/check_links.py",
    "scripts/fetch_data.py",
    "scripts/generate_pins.py",
    "scripts/indexnow_submit.py",
    "scripts/post_pinterest.py",
    "scripts/post_social.py",
    "scripts/cleanup.py",
    "scripts/fix_slugs.py",
    "requirements.txt",
    "src/_redirects",
    "src/_headers",
    "src/templates/base.html",
    "src/templates/index.html",
    "src/templates/item.html",
    "src/templates/category.html",
    "src/templates/404.html",
    "src/templates/listicle.html",
    ".gitignore",
    "tests/conftest.py",
    "tests/test_templates.py",
    "tests/test_build_directory.py",
    "tests/test_generate_sitemap.py",
    "tests/test_utils.py",
    "tests/test_check_links.py",
    "tests/test_post_social.py",
    "tests/test_post_pinterest.py",
    "tests/test_core_optimized.py",
    "tests/test_fetch_data.py",
]

ROOT_DIR = Path(__file__).resolve().parent.parent
MASTER_SCRIPTS_DIR = ROOT_DIR / "scripts"
PROJECTS_DIR = ROOT_DIR / "projects"

def sync_scripts():
    print("🔄 Synchronizing master scripts to projects...")
    
    if not PROJECTS_DIR.exists():
        print(f"  ✗ Projects directory not found at {PROJECTS_DIR}")
        return

    MASTER_PROJECT_DIR = PROJECTS_DIR / "quickutils-master"
    if not MASTER_PROJECT_DIR.exists():
        print(f"  ✗ Master project not found at {MASTER_PROJECT_DIR}")
        return

    # Sync to each project directory
    for project in PROJECTS_DIR.iterdir():
        if not project.is_dir() or project.name == "quickutils-master":
            continue
        
        # Skip hidden directories
        if project.name.startswith("."):
            continue

        print(f"  → Syncing to {project.name}...")
        for file_rel_path in MASTER_FILES:
            if file_rel_path.startswith("scripts/") or file_rel_path.startswith("tests/") or file_rel_path in ["requirements.txt", ".gitignore"]:
                src = ROOT_DIR / file_rel_path
            else:
                src = MASTER_PROJECT_DIR / file_rel_path
            
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
