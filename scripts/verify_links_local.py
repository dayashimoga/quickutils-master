import os
import re
from pathlib import Path
from bs4 import BeautifulSoup

def verify_links_in_dist(dist_path):
    print(f"\n--- Verifying links in: {dist_path} ---")
    if not dist_path.exists():
        print(f"Error: {dist_path} does not exist. Build the project first.")
        return False, []

    errors = []
    html_files = list(dist_path.glob("**/*.html"))
    
    for html_file in html_files:
        with open(html_file, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')
            links = soup.find_all('a', href=True)
            
            for link in links:
                href = link['href']
                
                # Skip external links, anchors, and mailto
                if href.startswith(('http', '#', 'mailto:', 'tel:')):
                    continue
                
                # Normalize path
                # Handle absolute links within the site (starting with /)
                if href.startswith('/'):
                    target_path = dist_path / href.lstrip('/')
                else:
                    target_path = html_file.parent / href
                
                # Remove query params or fragments
                target_path = Path(str(target_path).split('?')[0].split('#')[0])
                
                # Check existence
                if not target_path.exists():
                    # Check if it's a directory and has index.html
                    if target_path.is_dir() and (target_path / "index.html").exists():
                        continue
                    
                    # Special case for directories without trailing slash
                    if (Path(str(target_path) + "/index.html")).exists():
                         continue

                    errors.append(f"Broken link in {html_file.relative_to(dist_path)}: {href} (Target not found: {target_path})")
    
    if not errors:
        print(f"All {len(html_files)} HTML files verified. No broken links found.")
        return True, []
    else:
        for err in errors:
            print(f"  [ERROR] {err}")
        return False, errors

def main():
    root_dir = Path(__file__).parent.parent / "projects"
    projects = [d for d in root_dir.iterdir() if d.is_dir() and d.name.endswith("-directory")]
    
    all_projects = []
    
    for p in projects:
        all_projects.append({"name": p.name, "path": p / "dist"})
    
    total_errors = []
    for proj in all_projects:
        success, errors = verify_links_in_dist(proj['path'])
        total_errors.extend(errors)
    
    print("\n" + "="*40)
    print("FINAL LINK VERIFICATION REPORT")
    print("="*40)
    if not total_errors:
        print("SUCCESS: No broken links found across the entire network.")
    else:
        print(f"FAILURE: Found {len(total_errors)} broken links.")
        # Exit with error to fail CI/CD if needed
        import sys
        sys.exit(1)

if __name__ == "__main__":
    main()
