import os
import sys
import json
from bs4 import BeautifulSoup

base_path = 'h:/boring/projects'
projects = [d for d in os.listdir(base_path) if os.path.isdir(os.path.join(base_path, d)) and d != '.pytest_cache']

for proj in projects:
    proj_path = os.path.join(base_path, proj)
    db_path = os.path.join(proj_path, 'data', 'database.json')
    dist_index = os.path.join(proj_path, 'dist', 'index.html')
    
    if not os.path.exists(db_path):
        print(f"Skipping {proj}: No database.json")
        continue
        
    if not os.path.exists(dist_index):
        # We need to build it first
        os.system(f'cd {proj_path} && python ../../scripts/build_directory.py > NUL 2>&1')
        
    try:
        with open(db_path, 'r', encoding='utf-8') as f:
            db_data = json.load(f)
            db_slugs = {item['slug'] for item in db_data if 'slug' in item}
        
        with open(dist_index, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')
            links = soup.find_all('a', href=True)
            html_item_slugs = {link['href'].split('/')[-1].replace('.html', '') for link in links if '/item/' in link['href']}
            
        print(f"[OK] {proj:25} DB Items: {len(db_slugs):4} | Rendered Links to items: {len(html_item_slugs):4}")
    except Exception as e:
        print(f"[ERROR] {proj}: {e}")
