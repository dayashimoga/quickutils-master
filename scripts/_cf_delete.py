import sys, os, time
sys.path.insert(0, 'scripts')
from assign_domains_bulk import find_wrangler_token, api_request

token = find_wrangler_token()
account_id = '915a7dc9bdec5748478873f79c4b24b7'

projects_to_delete = {
    "stock-simulator": ["stocks.quickutils.top"],
    "beat-maker": ["beatmaker.quickutils.top"],
    "music-visualizer": [],
    "habit-streak": [],
    "dna-lab": ["dna.quickutils.top", "dnalab.quickutils.top"]
}

for project, domains in projects_to_delete.items():
    print(f"\\nProcessing: {project}")
    for domain in domains:
        url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/{project}/domains/{domain}"
        res, code = api_request('DELETE', url, token)
        if code == 200:
            print(f"  Successfully deleted domain {domain}")
        else:
            print(f"  Failed domain {domain}: HTTP {code} - {res}")
        time.sleep(1) # avoid rate limits
            
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/{project}"
    res, code = api_request('DELETE', url, token)
    if code == 200:
        print(f"  Successfully deleted project {project}")
    else:
        print(f"  Failed project {project}: HTTP {code} - {res}")
    time.sleep(1)

print("\\nDone.")
