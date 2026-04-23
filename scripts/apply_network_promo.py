import os
import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT_DIR / "project_config.json"
PROJECT_DIR = ROOT_DIR / "projects"

def main():
    if not CONFIG_PATH.exists():
        print("Config not found")
        return
        
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        master_config = json.load(f)
        
    projects = master_config.get("projects", {})
    links = []
    for pid, pdata in projects.items():
        if "SITE_URL" in pdata and "quickutils.top" in pdata["SITE_URL"]:
            links.append({"name": pdata.get("SITE_NAME", pid.replace("-", " ").title()), "url": pdata["SITE_URL"]})
            
    # Sort alphabetically
    links.sort(key=lambda x: x["name"])
    
    html_ribbon_start = """
<!-- QuickUtils Network Promo -->
<div id="qu-promo-ribbon" style="position:relative; z-index:50; margin-top:2rem; padding:0; background:#111; border-top:1px solid rgba(128,128,128,0.3); text-align:center; font-family:sans-serif;">
   <button onclick="var c=document.getElementById('qu-promo-content');c.style.display=c.style.display==='none'?'block':'none';this.textContent=c.style.display==='none'?'🚀 Explore 90+ QuickUtils Apps ▼':'▲ Close'" style="width:100%;padding:10px;background:transparent;border:none;color:#aaa;cursor:pointer;font-size:0.85rem;font-family:inherit;">🚀 Explore 90+ QuickUtils Apps ▼</button>
   <div id="qu-promo-content" style="display:none; padding:1rem 1rem 2rem 1rem;">
   <div style="display:flex; flex-wrap:wrap; gap:0.5rem; justify-content:center; max-width:1200px; margin:0 auto;">
"""

    
    html_links = ""
    for l in links:
        html_links += f'      <a href="{l["url"]}" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">{l["name"]}</a>\n'

    html_ribbon_end = """
   </div>
   </div>
</div>
<!-- /QuickUtils Network Promo -->
"""
    
    full_ribbon = html_ribbon_start + html_links + html_ribbon_end
    
    count = 0
    for foldername in os.listdir(PROJECT_DIR):
        p_dir = PROJECT_DIR / foldername
        if not p_dir.is_dir():
            continue
            
        potential_paths = [
            p_dir / "index.html",
            p_dir / "src" / "index.html",
            p_dir / "public" / "index.html"
        ]
        
        target_html = None
        for path in potential_paths:
            if path.exists():
                target_html = path
                break
                
        if not target_html:
            continue
            
        with open(target_html, "r", encoding="utf-8") as f:
            content = f.read()
            
        if "id=\"qu-promo-ribbon\"" in content:
            # Avoid duplicate injection natively if the script runs multiple times
            import re
            content = re.sub(r'<!-- QuickUtils Network Promo -->.*?<!-- /QuickUtils Network Promo -->', full_ribbon, content, flags=re.DOTALL)
        else:
            # Inject before </body>
            if "</body>" in content:
                content = content.replace("</body>", f"{full_ribbon}\n</body>")
            else:
                content += f"\n{full_ribbon}"
                
        with open(target_html, "w", encoding="utf-8") as f:
            f.write(content)
        count += 1
        
    print(f"Successfully integrated Network Ribbon across {count} projects.")

if __name__ == "__main__":
    main()
