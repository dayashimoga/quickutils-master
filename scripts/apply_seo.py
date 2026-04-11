import os
import re

def update_seo_metadata():
    project_dir = "projects"
    
    if not os.path.exists(project_dir):
        print("Projects directory not found.")
        return

    count = 0
    for foldername in os.listdir(project_dir):
        # Allow looking in root or src/
        potential_paths = [
            os.path.join(project_dir, foldername, "index.html"),
            os.path.join(project_dir, foldername, "src", "index.html")
        ]
        
        html_path = None
        for p in potential_paths:
            if os.path.isfile(p):
                html_path = p
                break
        
        if not html_path:
            continue
        
        with open(html_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Try to extract the Title
        title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
        title_str = title_match.group(1) if title_match else f"{foldername.replace('-', ' ').title()} | QuickUtils"
        
        # Determine Description
        desc = None
        desc_search = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']', content, re.IGNORECASE)
        if desc_search:
            desc = desc_search.group(1)
        
        if not desc:
            hero_search = re.search(r'<p[^>]*class=["\'][^"\']*hero-sub[^"\']*["\'][^>]*>(.*?)</p>', content, re.DOTALL | re.IGNORECASE)
            if hero_search:
                desc = re.sub(r'<[^>]+>', '', hero_search.group(1)).strip()
            else:
                desc = f"Discover {foldername.replace('-', ' ')} - a professional and easy-to-use web utility by QuickUtils. High performance, mobile-friendly, and free to use."

        # Make description safe and truncate
        desc = desc.replace('"', '&quot;')
        if len(desc) > 160:
            desc = desc[:157] + "..."

        domain = "https://quickutils.top"
        url = f"{domain}/{foldername}/"
        
        # Tags to ensure are present
        tags_to_add = []
        if '<meta name="description"' not in content.lower():
            tags_to_add.append(f'<meta name="description" content="{desc}">')
        if '<meta name="keywords"' not in content.lower():
            tags_to_add.append(f'<meta name="keywords" content="QuickUtils, {foldername.replace("-", ", ")}, code, design, productivity, online tools">')
        if '<meta name="robots"' not in content.lower():
            tags_to_add.append('<meta name="robots" content="index, follow">')
        if '<link rel="canonical"' not in content.lower():
            tags_to_add.append(f'<link rel="canonical" href="{url}">')
        if 'property="og:title"' not in content.lower():
            tags_to_add.append(f'<meta property="og:title" content="{title_str}">')
        if 'property="og:description"' not in content.lower():
            tags_to_add.append(f'<meta property="og:description" content="{desc}">')
        if 'property="og:url"' not in content.lower():
            tags_to_add.append(f'<meta property="og:url" content="{url}">')
        if 'property="og:type"' not in content.lower():
            tags_to_add.append('<meta property="og:type" content="website">')
        if 'name="twitter:card"' not in content.lower():
            tags_to_add.append('<meta name="twitter:card" content="summary_large_image">')
        
        if not tags_to_add:
            continue

        seo_payload = "\n    ".join(tags_to_add)
        
        # Insert right after <title> or after charset/viewport
        if title_match:
            new_content = content.replace(title_match.group(0), title_match.group(0) + "\n    " + seo_payload)
        else:
            # Fallback insertion after <head>
            new_content = re.sub(r'(<head[^>]*>)', r'\1' + "\n    " + seo_payload, content, count=1, flags=re.IGNORECASE)
        
        if new_content != content:
            with open(html_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            count += 1
            print(f"Updated SEO for {foldername}")

    print(f"Applied SEO updates to {count} projects.")

if __name__ == "__main__":
    update_seo_metadata()
