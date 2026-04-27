import os, sys
from pathlib import Path
sys.path.insert(0, 'scripts')
from assign_domains_bulk import WRANGLER_PATHS

for p in WRANGLER_PATHS:
    exists = p.exists()
    label = "EXISTS" if exists else "      "
    print(f'  {label} {p}')
    if exists:
        content = p.read_text(encoding='utf-8')
        for line in content.splitlines():
            if 'token' in line.lower():
                val = line.split('=', 1)[1].strip().strip('"').strip("'")
                print(f'         -> token: {val[:8]}...{val[-4:]} (len={len(val)})')

# Also check where wrangler actually stores its config
xdg = Path(os.environ.get('XDG_CONFIG_HOME', ''))
home = Path.home()
print(f'\nHome: {home}')
print(f'APPDATA: {os.environ.get("APPDATA", "N/A")}')

# Check the node_modules wrangler path
node_config = home / '.wrangler' / 'config' / 'default.toml'
if node_config.exists():
    print(f'\n  Found: {node_config}')
    content = node_config.read_text(encoding='utf-8')
    for line in content.splitlines():
        if 'token' in line.lower():
            val = line.split('=', 1)[1].strip().strip('"').strip("'")
            print(f'  -> token: {val[:8]}...{val[-4:]} (len={len(val)})')

# XDG config home location
xdg_path = home / '.config' / 'wrangler' / 'config' / 'default.toml'
if xdg_path.exists():
    print(f'\n  Found XDG: {xdg_path}')
    content = xdg_path.read_text(encoding='utf-8')
    for line in content.splitlines():
        if 'token' in line.lower():
            val = line.split('=', 1)[1].strip().strip('"').strip("'")
            print(f'  -> token: {val[:8]}...{val[-4:]} (len={len(val)})')
