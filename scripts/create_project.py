# pragma: no cover
import os
import json
import argparse
import shutil
import sys

def main():
    parser = argparse.ArgumentParser(description="Scaffold a new QuickUtils project")
    parser.add_argument("project_id", help="The ID string of the project (e.g., 'flashcard-maker')")
    parser.add_argument("title", help="The display title of the project (e.g., 'Flashcard Maker')")
    parser.add_argument("subdomain", help="The subdomain prefix (e.g., 'flashcards')")
    args = parser.parse_args()

    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    projects_dir = os.path.join(root_dir, 'projects')
    target_dir = os.path.join(projects_dir, args.project_id)
    
    if os.path.exists(target_dir):
        print(f"Error: Project directory {target_dir} already exists.")
        sys.exit(1)
        
    os.makedirs(target_dir)
    print(f"Created project directory: {target_dir}")

    # Scaffold index.html
    html_content = f"""<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{args.title} | QuickUtils</title>
    <meta name="description" content="Free online {args.title.lower()} utility.">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛠️</text></svg>">
    <link rel="stylesheet" href="quickutils-core.css">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <nav class="navbar"><div class="container nav-inner">
        <a href="https://quickutils.top" class="brand">🚀 {args.title}</a>
        <div class="nav-links">
            <a href="https://ko-fi.com/dayatin" target="_blank" class="kofi-link">☕ Support</a>
            <button id="themeBtn" class="theme-btn">🌙</button>
        </div>
    </div></nav>
    <main class="container feature-page">
        <div class="glass-card">
            <h2>Welcome to {args.title}</h2>
            <p>Start building your amazing tool here.</p>
        </div>
    </main>
    <footer class="footer"><div class="container copyright">© 2026 QuickUtils. All rights reserved.</div></footer>
    <script src="quickutils-core.js"></script>
    <script src="script.js"></script>
</body>
</html>
"""
    with open(os.path.join(target_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html_content)

    css_content = f"/* style.css for {args.project_id} */\n"
    with open(os.path.join(target_dir, 'style.css'), 'w', encoding='utf-8') as f:
        f.write(css_content)

    js_content = f"""/* script.js for {args.project_id} */
'use strict';
(function(){{
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    
    // Initialize common utilities
    if(typeof QU !== 'undefined') QU.init({{ kofi: true, discover: true }});
    
    // Build your app here...
}})();
"""
    with open(os.path.join(target_dir, 'script.js'), 'w', encoding='utf-8') as f:
        f.write(js_content)

    # Automatically copy core dependencies
    shared_dir = os.path.join(root_dir, 'shared')
    if os.path.exists(os.path.join(shared_dir, 'quickutils-core.css')):
        shutil.copy2(os.path.join(shared_dir, 'quickutils-core.css'), os.path.join(target_dir, 'quickutils-core.css'))
    if os.path.exists(os.path.join(shared_dir, 'quickutils-core.js')):
        shutil.copy2(os.path.join(shared_dir, 'quickutils-core.js'), os.path.join(target_dir, 'quickutils-core.js'))

    # Update projects.json
    projects_json_path = os.path.join(root_dir, 'terraform', 'projects.json')
    if os.path.exists(projects_json_path):
        with open(projects_json_path, 'r', encoding='utf-8') as f:
            projects = json.load(f)
            
        projects[args.project_id] = {
            "directory": f"projects/{args.project_id}",
            "repo_name": args.project_id,
            "build_command": "mkdir -p dist && cp -r * dist/ 2>null || true; cp ../../shared/quickutils-core.* dist/ 2>null || true",
            "destination_dir": "dist",
            "custom_domain": f"{args.subdomain}.quickutils.top",
            "root_dir": f"projects/{args.project_id}"
        }
        
        with open(projects_json_path, 'w', encoding='utf-8') as f:
            json.dump(projects, f, indent=4)
        print(f"Updated terraform/projects.json with entry for {args.project_id}")

    print(f"Successfully scaffolded {args.project_id}!")

if __name__ == "__main__":
    main()
