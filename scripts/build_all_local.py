import os
import subprocess
from pathlib import Path

def run_cmd(args, cwd):
    env = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUTF8="1")
    subprocess.run(args, cwd=str(cwd), env=env)

def main():
    root_dir = Path("h:/boring/projects")
    projects = [d for d in root_dir.iterdir() if d.is_dir() and d.name.endswith("-directory")]
    
    # Master Site is no longer built directly from root (src/data purged)

    # 2. Build Sub-Projects
    for proj in projects:
        print(f"\n--- Building Project: {proj.name} ---")
        if not (proj / "data" / "database.json").exists():
            run_cmd(["python", "scripts/fetch_data.py"], proj)
        
        run_cmd(["python", "scripts/build_directory.py"], proj)
        run_cmd(["python", "scripts/generate_sitemap.py"], proj)

if __name__ == "__main__":
    main()
