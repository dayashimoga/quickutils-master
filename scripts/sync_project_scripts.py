import os
import json
import shutil

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    projects_json_path = os.path.join(root_dir, 'terraform', 'projects.json')
    dist_css_path = os.path.join(root_dir, 'shared', 'quickutils-core.css')
    dist_js_path = os.path.join(root_dir, 'shared', 'quickutils-core.js')
    
    if not os.path.exists(projects_json_path):
        print(f"Error: {projects_json_path} not found.")
        return
        
    if not os.path.exists(dist_css_path) or not os.path.exists(dist_js_path):
        print(f"Error: shared/ assets not found.")
        # But this script is just for copying.
    
    with open(projects_json_path, 'r', encoding='utf-8') as f:
        projects = json.load(f)
        
    success_count = 0
    for proj_key, proj_info in projects.items():
        if 'directory' in proj_info:
            target_dir = os.path.join(root_dir, proj_info['directory'])
            if os.path.exists(target_dir):
                try:
                    if os.path.exists(dist_css_path):
                        shutil.copy2(dist_css_path, os.path.join(target_dir, 'quickutils-core.css'))
                    if os.path.exists(dist_js_path):
                        shutil.copy2(dist_js_path, os.path.join(target_dir, 'quickutils-core.js'))
                    success_count += 1
                except Exception as e:
                    print(f"Failed to copy to {target_dir}: {e}")
            else:
                print(f"Warning: directory {target_dir} does not exist.")
                
    print(f"Successfully injected core assets into {success_count} project directories.")

if __name__ == "__main__":
    main()
