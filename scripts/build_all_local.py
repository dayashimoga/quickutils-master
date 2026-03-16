import os
import subprocess
from pathlib import Path


# Projects that are standalone HTML/JS apps and don't use the Jinja2 build pipeline
NON_JINJA_PROJECTS = {"market-digest", "price-comparator", "boringwebsite"}


def run_cmd(args, cwd, root_path):
    """Run a subprocess with proper encoding and Python path."""
    env = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUTF8="1")
    env["PYTHONPATH"] = str(root_path)
    result = subprocess.run(args, cwd=str(cwd), env=env, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout, end="")
    if result.returncode != 0 and result.stderr:
        print(f"  ⚠️ {result.stderr.strip()}")
    return result.returncode


def get_projects_root():
    return Path(__file__).parent.parent / "projects"


def get_projects():
    root = get_projects_root()
    return sorted(
        [d for d in root.iterdir() if d.is_dir() and not d.name.startswith(".")],
        key=lambda p: p.name,
    )


def main():
    projects = get_projects()
    ROOT_DIR = Path(__file__).parent.parent

    # Build All Projects
    for proj in projects:
        if proj.name in NON_JINJA_PROJECTS:
            print(f"\n--- Skipping {proj.name} (standalone HTML/JS app) ---")
            continue

        # Use the full directory name as PROJECT_TYPE
        # This matches the path resolution logic in utils.py
        ptype = proj.name
        
        print(f"\n--- Building Project: {proj.name} (type={ptype}) ---")
        
        # Set PROJECT_TYPE and path env vars so utils.py resolves correctly
        env_vars = {
            "PROJECT_TYPE": ptype,
            "PYTHONPATH": str(ROOT_DIR),
            "SRC_DIR": str(proj / "src"),
            "DATA_DIR": str(proj / "data"),
            "DIST_DIR": str(proj / "dist"),
        }
        os.environ.update(env_vars)

        if not (proj / "data" / "database.json").exists():
            print(f"  📥 Fetching data for {proj.name}...")
            run_cmd(["python", str(ROOT_DIR / "scripts/fetch_data.py")], proj, ROOT_DIR)
        
        run_cmd(["python", str(ROOT_DIR / "scripts/build_directory.py")], proj, ROOT_DIR)
        run_cmd(["python", str(ROOT_DIR / "scripts/generate_sitemap.py")], proj, ROOT_DIR)

    print("\n✅ All projects built successfully.")


if __name__ == "__main__":
    main()

