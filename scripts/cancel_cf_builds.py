import os
import requests
import sys

def main():
    token = os.environ.get('CLOUDFLARE_API_TOKEN')
    account = os.environ.get('CLOUDFLARE_ACCOUNT_ID')
    if not token or not account:
        print('Skipping cancel_cf_builds: No CF token found in environment.')
        return

    headers = {'Authorization': f'Bearer {token}'}
    url = f'https://api.cloudflare.com/client/v4/accounts/{account}/pages/projects'
    res = requests.get(url, headers=headers)
    if res.status_code != 200:
        print('Error fetching projects:', res.text)
        return

    projects = res.json().get('result', [])
    queued_count = 0
    disabled_count = 0
    for p in projects:
        p_name = p['name']
        
        # 1. Disable Automatic Deployments
        patch_url = f'{url}/{p_name}'
        patch_data = {
            "source": {
                "config": {
                    "production_deployment_enabled": False,
                    "deployments_enabled": False,
                    "preview_deployment_setting": "none"
                }
            }
        }
        # If project is GitHub-linked
        if p.get('source', {}).get('type') == 'github':
            patch_res = requests.patch(patch_url, headers=headers, json=patch_data)
            if patch_res.status_code == 200:
                disabled_count += 1

        # 2. Cancel Existing Queue
        d_url = f'{url}/{p_name}/deployments'
        d_res = requests.get(d_url, headers=headers)
        if d_res.status_code == 200:
            deps = d_res.json().get('result', [])
            for d in deps:
                stage = d.get('latest_stage', {})
                status = stage.get('status') if stage else ''
                if status in ['queued', 'building', 'active', 'idle'] or (not status and d.get('is_skipped') is not True):
                    cancel_url = f'{d_url}/{d["id"]}/cancel'
                    cancel_res = requests.post(cancel_url, headers=headers)
                    print(f'Canceling {p_name} deployment {d["id"]}: {cancel_res.status_code}')
                    queued_count += 1
                    break

    print(f'Cancelled {queued_count} queued deployments and disabled auto-git deployments for {disabled_count} out of {len(projects)} projects.')

if __name__ == '__main__':
    main()
