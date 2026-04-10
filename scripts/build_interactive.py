"""
Build Interactive Projects
Copies project files to dist/ and injects shared library (CSS + JS).
Used for all non-directory (interactive/SPA) projects.
"""
import os
import shutil
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
SHARED_DIR = ROOT_DIR / "shared"
PROJECTS_DIR = ROOT_DIR / "projects"

# Projects that use the interactive build (not Jinja2 directory system)
INTERACTIVE_PROJECTS = [
    "typing-test", "regex-playground", "pomodoro-timer", "data-converter",
    "budget-tracker", "habit-tracker", "gradient-studio", "ambient-mixer",
    "periodic-table", "pixel-art", "music-maker",
    # Phase 1 sites
    "chemistry-lab", "algorithm-visualizer", "code-arena", "quiz-master",
    "life-simulator", "whiteboard", "chart-maker", "css-battle",
    "retro-games", "unit-converter",
    # Phase 3 sites (v3)
    "circuit-designer", "color-palette", "markdown-editor", "physics-sandbox",
    "math-grapher", "json-explorer", "cron-builder", "emoji-kitchen",
    "ascii-art-studio", "password-fortress",
]

# Files to always copy from project root
STATIC_FILES = ["index.html", "style.css", "script.js"]
# Optional extras some projects may have
OPTIONAL_FILES = ["data.json", "worker.js", "sounds.json"]


def build_project(project_name: str):
    """Build a single interactive project into its dist/ folder."""
    project_dir = PROJECTS_DIR / project_name
    if not project_dir.exists():
        print(f"  ✗ Project {project_name} not found at {project_dir}")
        return False

    dist_dir = project_dir / "dist"
    dist_dir.mkdir(parents=True, exist_ok=True)

    # 1. Copy shared library files
    for shared_file in ["quickutils-core.css", "quickutils-core.js"]:
        src = SHARED_DIR / shared_file
        if src.exists():
            shutil.copy2(src, dist_dir / shared_file)
        else:
            print(f"  ✗ Shared file {shared_file} not found!")
            return False

    # 2. Copy project static files
    copied_files = []
    for f in STATIC_FILES:
        src = project_dir / f
        if src.exists():
            shutil.copy2(src, dist_dir / f)
            copied_files.append(f)
        else:
            print(f"  ✗ Missing required file: {project_name}/{f}")
            return False

    # 3. Copy optional files
    for f in OPTIONAL_FILES:
        src = project_dir / f
        if src.exists():
            shutil.copy2(src, dist_dir / f)
            copied_files.append(f)

    # 4. Inject shared library references into index.html
    index_path = dist_dir / "index.html"
    html = index_path.read_text(encoding="utf-8")

    # Inject CSS before closing </head> or before project's style.css
    if "quickutils-core.css" not in html:
        css_inject = '<link rel="stylesheet" href="quickutils-core.css">\n'
        if '<link rel="stylesheet" href="style.css">' in html:
            html = html.replace(
                '<link rel="stylesheet" href="style.css">',
                css_inject + '    <link rel="stylesheet" href="style.css">'
            )
        elif '</head>' in html:
            html = html.replace('</head>', f'    {css_inject}</head>')

    # Inject JS before project's script.js
    if "quickutils-core.js" not in html:
        js_inject = '<script src="quickutils-core.js"></script>\n'
        init_inject = '\n<script>document.addEventListener("DOMContentLoaded", () => { if(typeof QU !== "undefined") QU.init(); });</script>\n'
        if '<script src="script.js">' in html:
            html = html.replace(
                '<script src="script.js">',
                js_inject + '    <script src="script.js">'
            )
            html = html.replace('</body>', f'    {init_inject}</body>')
        elif '</body>' in html:
            html = html.replace('</body>', f'    {js_inject}    {init_inject}</body>')

    index_path.write_text(html, encoding="utf-8")

    print(f"  ✓ Built {project_name} → dist/ ({', '.join(copied_files)} + shared libs)")
    return True


def build_all():
    """Build all interactive projects."""
    print("🔨 Building interactive projects...")
    success = 0
    failed = 0

    for project in INTERACTIVE_PROJECTS:
        project_dir = PROJECTS_DIR / project
        if not project_dir.exists():
            continue  # Skip projects not yet created
        result = build_project(project)
        if result:
            success += 1
        else:
            failed += 1

    print(f"\n✅ Build complete: {success} succeeded, {failed} failed")
    return failed == 0


def get_build_command(project_name: str) -> str:
    """Generate the Cloudflare Pages build command for a project."""
    return f"pip install -r requirements.txt && python scripts/build_interactive.py --project {project_name}"


if __name__ == "__main__":
    import sys
    if "--project" in sys.argv:
        idx = sys.argv.index("--project") + 1
        if idx < len(sys.argv):
            build_project(sys.argv[idx])
        else:
            print("Usage: python build_interactive.py --project <name>")
    else:
        build_all()
