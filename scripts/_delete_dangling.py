import subprocess
import json
import sys

projects_to_delete = {
    "stock-simulator": ["stocks.quickutils.top"],
    "beat-maker": ["beatmaker.quickutils.top"],
    "music-visualizer": [],
    "sound-lab": ["soundlab.quickutils.top"],
    "habit-streak": [],
    "dna-lab": ["dna.quickutils.top", "dnalab.quickutils.top"]
}

for project, domains in projects_to_delete.items():
    print(f"\\nProcessing project: {project}")
    for domain in domains:
        print(f"  Deleting custom domain: {domain}")
        cmd = f"npx wrangler pages domain delete {project} {domain} --yes"
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, encoding='utf-8')
            if result.returncode == 0:
                print(f"  Successfully deleted domain {domain}")
            else:
                print(f"  Failed to delete domain {domain}: {result.stderr.strip()}")
        except Exception as e:
            print(f"  Exception: {e}")
            
    print(f"  Deleting project: {project}")
    cmd = f"npx wrangler pages project delete {project} --yes"
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, encoding='utf-8')
        if result.returncode == 0:
            print(f"  Successfully deleted project {project}")
        else:
            print(f"  Failed to delete project {project}: {result.stderr.strip()}")
    except Exception as e:
        print(f"  Exception: {e}")

print("\\nCleanup complete.")
