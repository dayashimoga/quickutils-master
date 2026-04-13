"""
cancel_cf_builds.py - Disable auto-deploy and cancel queued builds on Cloudflare Pages.
Uses rate-limit-aware sequential processing with 1s delays between API calls.
"""
import os
import sys
import time
import requests

if sys.platform == 'win32':
    try: sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except: pass

TIMEOUT = 15
DELAY = 1.2  # seconds between API calls to avoid 429

def api_call(method, url, headers, **kwargs):
    """Rate-limit-aware API call with retry."""
    for attempt in range(3):
        try:
            r = getattr(requests, method)(url, headers=headers, timeout=TIMEOUT, **kwargs)
            if r.status_code == 429:
                wait = int(r.headers.get('Retry-After', 10))
                print(f'    Rate limited, waiting {wait}s...')
                time.sleep(wait)
                continue
            return r
        except requests.exceptions.Timeout:
            print(f'    Timeout (attempt {attempt+1})')
            time.sleep(3)
        except Exception as e:
            print(f'    Error: {e}')
            time.sleep(2)
    return None

def main():
    token = os.environ.get('CLOUDFLARE_API_TOKEN')
    account = os.environ.get('CLOUDFLARE_ACCOUNT_ID')
    if not token or not account:
        print('Skipping: No CF credentials found.')
        return

    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    base = f'https://api.cloudflare.com/client/v4/accounts/{account}/pages/projects'

    # 1. Fetch all projects (paginated)
    print('Fetching projects...')
    all_projects = []
    page = 1
    while True:
        r = api_call('get', base, headers, params={'page': page})
        if not r or r.status_code != 200:
            print(f'Failed to fetch page {page}')
            break
        batch = r.json().get('result', [])
        if not batch:
            break
        all_projects.extend(batch)
        total_pages = r.json().get('result_info', {}).get('total_pages', 1)
        print(f'  Page {page}/{total_pages}: {len(batch)} projects')
        if page >= total_pages:
            break
        page += 1
        time.sleep(DELAY)

    print(f'Total: {len(all_projects)} projects\n')
    if not all_projects:
        return

    disabled = 0
    cancelled = 0

    for i, p in enumerate(all_projects):
        name = p['name']
        print(f'[{i+1}/{len(all_projects)}] {name}')

        # Disable automatic GitHub deployments
        source = p.get('source') or {}
        if source.get('type') == 'github':
            cfg = source.get('config', {})
            patch_data = {
                "source": {
                    "type": "github",
                    "config": {
                        "owner": cfg.get('owner', ''),
                        "repo_name": cfg.get('repo_name', ''),
                        "production_branch": cfg.get('production_branch', 'main'),
                        "production_deployment_enabled": False,
                        "deployments_enabled": False,
                        "preview_deployment_setting": "none",
                        "preview_branch_includes": [],
                        "preview_branch_excludes": []
                    }
                }
            }
            r = api_call('patch', f'{base}/{name}', headers, json=patch_data)
            if r and r.status_code == 200:
                disabled += 1
                print(f'  -> Auto-deploy DISABLED')
            else:
                sc = r.status_code if r else 'N/A'
                print(f'  -> Disable failed ({sc})')
            time.sleep(DELAY)

        # Cancel queued deployments
        r = api_call('get', f'{base}/{name}/deployments', headers)
        if r and r.status_code == 200:
            for dep in r.json().get('result', []):
                stage = dep.get('latest_stage') or {}
                status = stage.get('status', '')
                sname = stage.get('name', '')
                if status in ('active', 'idle', '') or sname in ('queued', 'initialize', 'clone_repo', 'build', 'deploy'):
                    did = dep['id']
                    cr = api_call('post', f'{base}/{name}/deployments/{did}/cancel', headers)
                    if cr and cr.status_code == 200:
                        cancelled += 1
                        print(f'  -> Cancelled deployment {did[:10]}...')
                    time.sleep(DELAY)
        time.sleep(DELAY)

    print(f'\n=== DONE ===')
    print(f'Auto-deploy disabled: {disabled}/{len(all_projects)}')
    print(f'Builds cancelled: {cancelled}')

if __name__ == '__main__':
    main()
