#!/usr/bin/env python3
"""
QuickUtils Directory Site Static Generator.

Reads data/database.json from each directory project and generates
a complete index.html with the QuickUtils glassmorphism design system.

Usage:
    python scripts/build_directory.py --type tools
    python scripts/build_directory.py --type opensource
    python scripts/build_directory.py --type all
"""
import json
import os
import sys
import argparse
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent

DIRECTORY_TYPES = {
    "tools": {"title": "Tools Directory", "icon": "🛠️", "desc": "Curated collection of developer tools and utilities"},
    "opensource": {"title": "Open Source Directory", "icon": "📦", "desc": "Discover popular open source projects and libraries"},
    "boilerplates": {"title": "Boilerplates Directory", "icon": "🏗️", "desc": "Ready-to-use project templates and boilerplates"},
    "apistatus": {"title": "API Status Directory", "icon": "🔌", "desc": "Monitor API availability and documentation links"},
    "prompts": {"title": "Prompts Directory", "icon": "💬", "desc": "AI prompt templates for ChatGPT, Claude, and more"},
    "jobs": {"title": "Jobs Directory", "icon": "💼", "desc": "Remote developer job boards and career resources"},
    "cheatsheets": {"title": "Cheatsheets Directory", "icon": "📋", "desc": "Quick reference guides for programming languages and tools"},
    "datasets": {"title": "Datasets Directory", "icon": "📊", "desc": "Free datasets for machine learning and data science"},
}


def generate_html(dir_type, items):
    """Generate a complete HTML page for a directory."""
    config = DIRECTORY_TYPES.get(dir_type, {"title": dir_type.title() + " Directory", "icon": "📁", "desc": ""})
    categories = sorted(set(item.get("category", "Uncategorized") for item in items))

    cat_options = "\n".join(f'            <option value="{c}">{c}</option>' for c in categories)
    
    cards_html = ""
    for item in items:
        name = item.get("name") or item.get("title") or "Untitled"
        desc = item.get("description", "No description available.")
        url = item.get("url", "#")
        cat = item.get("category", "Uncategorized")
        auth = item.get("auth", "")
        https_badge = '<span class="badge badge-green">HTTPS</span>' if item.get("https") else ""
        auth_badge = f'<span class="badge badge-yellow">{auth}</span>' if auth and auth != "None" else ""
        
        cards_html += f"""
        <div class="dir-card" data-category="{cat}">
            <div class="card-top">
                <h3><a href="{url}" target="_blank" rel="noopener">{name}</a></h3>
                <span class="card-category">{cat}</span>
            </div>
            <p class="card-desc">{desc[:200]}</p>
            <div class="card-badges">{https_badge}{auth_badge}</div>
        </div>"""

    return f"""<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{config['title']} | QuickUtils</title>
    <meta name="description" content="{config['desc']}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://{dir_type}.quickutils.top/">
    <meta property="og:title" content="{config['title']} | QuickUtils">
    <meta property="og:description" content="{config['desc']}">
    <meta property="og:type" content="website">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="quickutils-core.css">
    <style>
        :root {{
            --bg: #0a0a0f; --bg-card: rgba(18,18,30,0.85); --text: #e8e8f0;
            --text-muted: #888; --accent: #6366f1; --border: rgba(255,255,255,0.08);
            --radius: 12px;
        }}
        [data-theme="light"] {{
            --bg: #f5f5fa; --bg-card: rgba(255,255,255,0.9); --text: #1a1a2e;
            --text-muted: #666; --border: rgba(0,0,0,0.08);
        }}
        * {{ margin:0; padding:0; box-sizing:border-box; }}
        body {{ font-family:'Inter',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; }}
        .container {{ max-width:1200px; margin:0 auto; padding:0 1.5rem; }}
        .navbar {{ background:rgba(10,10,15,0.8); backdrop-filter:blur(20px); border-bottom:1px solid var(--border); padding:0.75rem 0; position:sticky; top:0; z-index:100; }}
        .nav-inner {{ display:flex; align-items:center; justify-content:space-between; }}
        .brand {{ text-decoration:none; color:var(--text); font-weight:700; font-size:1.25rem; }}
        .hero {{ text-align:center; padding:2.5rem 0 1.5rem; }}
        .hero h1 {{ font-size:clamp(1.8rem,4vw,2.5rem); font-weight:800; margin-bottom:0.5rem; }}
        .hero p {{ color:var(--text-muted); max-width:500px; margin:0 auto; }}
        .gradient-text {{ background:linear-gradient(135deg,#6366f1,#a855f7,#ec4899); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }}
        .controls {{ display:flex; gap:1rem; margin:1.5rem 0; flex-wrap:wrap; align-items:center; }}
        .controls input, .controls select {{ padding:0.6rem 1rem; background:var(--bg-card); border:1px solid var(--border); border-radius:8px; color:var(--text); font-size:0.9rem; outline:none; }}
        .controls input {{ flex:1; min-width:200px; }}
        .controls input:focus, .controls select:focus {{ border-color:var(--accent); }}
        .count-badge {{ padding:0.4rem 1rem; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.3); border-radius:20px; font-size:0.85rem; color:var(--accent); font-weight:600; }}
        .dir-grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1rem; margin:1.5rem 0 3rem; }}
        .dir-card {{ background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:1.25rem; transition:all 0.3s; }}
        .dir-card:hover {{ border-color:var(--accent); transform:translateY(-3px); box-shadow:0 8px 24px rgba(99,102,241,0.15); }}
        .card-top {{ display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem; margin-bottom:0.5rem; }}
        .card-top h3 {{ font-size:1rem; font-weight:600; }}
        .card-top a {{ color:var(--text); text-decoration:none; }}
        .card-top a:hover {{ color:var(--accent); }}
        .card-category {{ font-size:0.7rem; padding:2px 8px; border-radius:12px; background:rgba(99,102,241,0.1); color:var(--accent); white-space:nowrap; }}
        .card-desc {{ font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin-bottom:0.5rem; }}
        .card-badges {{ display:flex; gap:0.3rem; flex-wrap:wrap; }}
        .badge {{ padding:2px 8px; border-radius:10px; font-size:0.65rem; font-weight:600; }}
        .badge-green {{ background:rgba(16,185,129,0.15); color:#10b981; }}
        .badge-yellow {{ background:rgba(245,158,11,0.15); color:#f59e0b; }}
        .footer {{ border-top:1px solid var(--border); padding:2rem 0; text-align:center; color:var(--text-muted); font-size:0.85rem; }}
        .footer a {{ color:var(--accent); text-decoration:none; }}
        .empty-state {{ text-align:center; padding:3rem; color:var(--text-muted); }}
    </style>
</head>
<body>
<nav class="navbar"><div class="container nav-inner">
    <a href="/" class="brand">{config['icon']} {config['title']}</a>
    <a href="https://quickutils.top" style="color:var(--text-muted);text-decoration:none;font-size:0.9rem;">QuickUtils ↗</a>
</div></nav>

<main class="container">
    <section class="hero">
        <h1>{config['icon']} <span class="gradient-text">{config['title']}</span></h1>
        <p>{config['desc']}</p>
    </section>

    <div class="controls">
        <input type="text" id="searchInput" placeholder="Search {len(items)} entries..." oninput="filterCards()">
        <select id="categoryFilter" onchange="filterCards()">
            <option value="">All Categories</option>
{cat_options}
        </select>
        <span class="count-badge" id="countBadge">{len(items)} items</span>
    </div>

    <div class="dir-grid" id="dirGrid">
{cards_html}
    </div>
</main>

<footer class="footer"><div class="container">
    <p>Part of <a href="https://quickutils.top">QuickUtils</a> — 90+ free web tools</p>
</div></footer>

<script>
function filterCards() {{
    const q = document.getElementById('searchInput').value.toLowerCase();
    const cat = document.getElementById('categoryFilter').value;
    let visible = 0;
    document.querySelectorAll('.dir-card').forEach(card => {{
        const text = card.textContent.toLowerCase();
        const cardCat = card.dataset.category;
        const show = text.includes(q) && (cat === '' || cardCat === cat);
        card.style.display = show ? '' : 'none';
        if (show) visible++;
    }});
    document.getElementById('countBadge').textContent = visible + ' items';
}}
</script>
</body>
</html>"""


def build_directory(dir_type):
    """Build a single directory site."""
    project_dir = ROOT_DIR / "projects" / f"{dir_type}-directory"
    if not project_dir.exists():
        # Try without -directory suffix
        project_dir = ROOT_DIR / "projects" / dir_type
        if not project_dir.exists():
            print(f"  [SKIP] Project directory not found: {dir_type}")
            return False
    
    data_file = project_dir / "data" / "database.json"
    if not data_file.exists():
        print(f"  [WARN] No database.json found for {dir_type}, creating empty one")
        data_file.parent.mkdir(parents=True, exist_ok=True)
        with open(data_file, "w", encoding="utf-8") as f:
            json.dump([], f)
    
    with open(data_file, "r", encoding="utf-8") as f:
        items = json.load(f)
    
    if not isinstance(items, list):
        items = list(items.values()) if isinstance(items, dict) else []
    
    html = generate_html(dir_type, items)
    
    index_path = project_dir / "index.html"
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(html)
    
    # Also create dist directory for build output
    dist_dir = project_dir / "dist"
    dist_dir.mkdir(exist_ok=True)
    with open(dist_dir / "index.html", "w", encoding="utf-8") as f:
        f.write(html)
    
    print(f"  [OK] Generated {index_path} ({len(items)} items)")
    return True


def main():
    parser = argparse.ArgumentParser(description="Generate directory site HTML")
    parser.add_argument("--type", required=True, help="Directory type (tools, opensource, etc.) or 'all'")
    args = parser.parse_args()
    
    if args.type == "all":
        types = list(DIRECTORY_TYPES.keys())
    else:
        types = [args.type]
    
    success = 0
    for t in types:
        print(f"Building {t}-directory...")
        if build_directory(t):
            success += 1
    
    print(f"\nBuilt {success}/{len(types)} directory sites successfully.")


if __name__ == "__main__":
    main()
