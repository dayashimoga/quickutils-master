"""
Data Fetcher for the Open-Source Alternatives Directory.

Fetches data from an awesome-selfhosted or similar JSON list, normalizes entries, 
and saves to data/database.json.
"""
import json
import sys
from pathlib import Path

import requests

from scripts.utils import save_database, slugify, DATA_DIR, ensure_dir

# Since a perfect API for "SaaS to Open Source" doesn't exist out of the box with the exact schema,
# we will use a raw JSON file hosted on GitHub that we can manually curate or fork from an awesome-list.
# For now, we will seed it with a high-quality initial list so the site builds immediately.
SEED_DATA_URL = "https://raw.githubusercontent.com/dayashimoga/opensource-directory-data/main/data.json"

REQUEST_TIMEOUT = 30


def get_seed_data() -> list:
    """Provides seed data for the open-source directory if external source fails."""
    return [
        {
            "name": "Mattermost",
            "alternative_to": "Slack",
            "description": "Open-source, self-hostable Slack-alternative for secure collaboration.",
            "category": "Communication",
            "url": "https://mattermost.com/",
            "github_repo": "https://github.com/mattermost/mattermost",
        },
        {
            "name": "Supabase",
            "alternative_to": "Firebase",
            "description": "The open source Firebase alternative. Build in a weekend.",
            "category": "Database / Backend",
            "url": "https://supabase.com/",
            "github_repo": "https://github.com/supabase/supabase",
        },
        {
            "name": "Plausible Analytics",
            "alternative_to": "Google Analytics",
            "description": "A privacy-friendly, lightweight, and open-source Google Analytics alternative.",
            "category": "Analytics",
            "url": "https://plausible.io/",
            "github_repo": "https://github.com/plausible/analytics",
        },
        {
            "name": "Nextcloud",
            "alternative_to": "Google Drive / Dropbox",
            "description": "Safe home for all your data. A safe home for all your data.",
            "category": "File Storage",
            "url": "https://nextcloud.com/",
            "github_repo": "https://github.com/nextcloud/server",
        },
        {
            "name": "N8n",
            "alternative_to": "Zapier",
            "description": "Free and open node based Workflow Automation Tool.",
            "category": "Automation",
            "url": "https://n8n.io/",
            "github_repo": "https://github.com/n8n-io/n8n",
        },
        {
            "name": "Bitwarden",
            "alternative_to": "1Password / LastPass",
            "description": "Open source password management solutions for individuals, teams, and business organizations.",
            "category": "Security / Passwords",
            "url": "https://bitwarden.com/",
            "github_repo": "https://github.com/bitwarden/server",
        }
    ]


def normalize_entry(raw: dict) -> dict | None:
    """Normalize a raw entry into our standard schema."""
    name = raw.get("name")
    alternative_to = raw.get("alternative_to")
    description = raw.get("description", "")
    category = raw.get("category", "Uncategorized")
    url = raw.get("url", "")
    github_repo = raw.get("github_repo", "")

    if not name or not alternative_to:
        return None

    return {
        "title": name.strip(),
        "alternative_to": alternative_to.strip(),
        "description": description.strip(),
        "category": category.strip(),
        "url": url.strip(),
        "github_repo": github_repo.strip(),
        "slug": slugify(f"{name}-alternative-to-{alternative_to}"),
    }


def deduplicate(items: list) -> list:
    """Remove duplicate entries based on slug."""
    seen = set()
    unique = []
    for item in items:
        if item["slug"] not in seen:
            seen.add(item["slug"])
            unique.append(item)

    return sorted(unique, key=lambda x: x["title"].lower())


def fetch_and_save() -> bool:
    print("📡 Fetching Open Source Alternatives dataset...")

    try:
        response = requests.get(SEED_DATA_URL, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        raw_entries = response.json()
        print("  → Successfully fetched from remote data source.")
    except Exception as e:
        print(f"  → Warning: Remote fetch failed ({e}). Using built-in seed data.")
        raw_entries = get_seed_data()

    print(f"  ✓ Found {len(raw_entries)} raw entries.")

    normalized = []
    for raw in raw_entries:
        entry = normalize_entry(raw)
        if entry:
            normalized.append(entry)

    print(f"  ✓ Normalized {len(normalized)} valid entries.")

    unique = deduplicate(normalized)
    print(f"  ✓ {len(unique)} unique entries after deduplication.")

    ensure_dir(DATA_DIR)
    save_database(unique)
    print(f"  ✓ Saved to data/database.json")

    return True


def main():
    success = fetch_and_save()
    if success:
        print("✅ Data sync complete.")
    else:
        print("⚠️ Data sync skipped.")
    sys.exit(0)


if __name__ == "__main__":
    main()
