import os
import subprocess
from pathlib import Path

def run_cmd(args, cwd, root_path):
    env = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUTF8="1")
    env["PYTHONPATH"] = str(root_path)
    subprocess.run(args, cwd=str(cwd), env=env)

def get_projects_root():
    return Path(__file__).parent.parent / "projects"

def get_projects():
    root = get_projects_root()
    return [d for d in root.iterdir() if d.is_dir() and not d.name.startswith(".")]

def main():
    projects = get_projects()
    ROOT_DIR = Path(__file__).parent.parent
    
    # 2. Build All Projects
    for proj in projects:
        # Determine Project Type
        ptype = proj.name.replace("-directory", "")
        if ptype == "quickutils-master":
            ptype = "master"
            
        print(f"\n--- Building Project: {proj.name} ({ptype}) ---")
        
        # Set PROJECT_TYPE and other env vars
        env_vars = {
            "PROJECT_TYPE": ptype,
            "PYTHONPATH": ".",
            "SRC_DIR": str(proj / "src"),
            "DATA_DIR": str(proj / "data"),
            "DIST_DIR": str(proj / "dist")
        }
        os.environ.update(env_vars)

        if not (proj / "data" / "database.json").exists():
            run_cmd(["python", str(ROOT_DIR / "scripts/fetch_data.py")], proj, ROOT_DIR)
        
        run_cmd(["python", str(ROOT_DIR / "scripts/build_directory.py")], proj, ROOT_DIR)
        run_cmd(["python", str(ROOT_DIR / "scripts/generate_sitemap.py")], proj, ROOT_DIR)

if __name__ == "__main__":
    main()
