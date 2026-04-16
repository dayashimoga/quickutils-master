"""
cancel_cf_builds.py - Cancel queued CF builds for CHANGED projects only.
Skips auto-deploy disable since it's already been done network-wide.
Uses parallel processing for speed.
"""
import os
import sys
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

if sys.platform == 'win32':
    try: sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except: pass

TIMEOUT = 10
MAX_PARALLEL = 8


def api_call(method, url, headers, **kwargs):
    """Quick API call with 1 retry."""
    for attempt in range(2):
        try:
            r = getattr(requests, method)(url, headers=headers, timeout=TIMEOUT, **kwargs)
            if r.status_code == 429:
                wait = int(r.headers.get('Retry-After', 5))
                time.sleep(wait)
                continue
            return r
        except Exception:
            time.sleep(1)
    return None


def cancel_project_builds(name, base, headers):
    """Cancel all queued/active builds for a single project."""
    cancelled = 0
    r = api_call('get', f'{base}/{name}/deployments', headers)
    if not r or r.status_code != 200:
        return name, 0
    for dep in r.json().get('result', []):
        stage = dep.get('latest_stage') or {}
        status = stage.get('status', '')
        sname = stage.get('name', '')
        if status in ('active', 'idle', '') or sname in ('queued', 'initialize', 'clone_repo', 'build', 'deploy'):
            did = dep['id']
            cr = api_call('post', f'{base}/{name}/deployments/{did}/cancel', headers)
            if cr and cr.status_code == 200:
                cancelled += 1
    return name, cancelled


def main():
    token = os.environ.get('CLOUDFLARE_API_TOKEN')
    account = os.environ.get('CLOUDFLARE_ACCOUNT_ID')
    if not token or not account:
        print('Skipping: No CF credentials found.')
        return

    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    base = f'https://api.cloudflare.com/client/v4/accounts/{account}/pages/projects'

    # Determine which projects to process
    changed = os.environ.get('CHANGED_PROJECTS', '')

    if not changed or changed.strip() == 'NONE':
        print('No changed projects — skipping cancel.')
        return

    if changed.strip() == 'ALL':
        # Only when ALL is specified, fetch complete project list
        print('ALL projects changed — fetching project list...')
        project_names = []
        page = 1
        while True:
            r = api_call('get', base, headers, params={'page': page, 'per_page': 50})
            if not r or r.status_code != 200:
                break
            batch = r.json().get('result', [])
            if not batch:
                break
            project_names.extend([p['name'] for p in batch])
            total_pages = r.json().get('result_info', {}).get('total_pages', 1)
            if page >= total_pages:
                break
            page += 1
        print(f'Found {len(project_names)} projects')
    else:
        # Only cancel builds for changed projects
        project_names = [p.strip() for p in changed.split(',') if p.strip()]
        print(f'Cancelling builds for {len(project_names)} changed projects: {", ".join(project_names)}')

    if not project_names:
        print('No projects to process.')
        return

    # Cancel builds in parallel
    total_cancelled = 0
    with ThreadPoolExecutor(max_workers=MAX_PARALLEL) as executor:
        futures = {
            executor.submit(cancel_project_builds, name, base, headers): name
            for name in project_names
        }
        for future in as_completed(futures):
            name, count = future.result()
            if count > 0:
                print(f'  [{name}] Cancelled {count} builds')
                total_cancelled += count

    print(f'\n=== DONE === Cancelled {total_cancelled} builds across {len(project_names)} projects')


if __name__ == '__main__':
    main()
