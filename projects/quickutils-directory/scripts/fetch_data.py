"""
Data Fetcher for the Programmatic SEO Directory.

Fetches the public-apis dataset, normalizes entries, and saves to data/database.json.
Designed to run as a cron job via GitHub Actions. Exits gracefully on any failure.
"""
import json
import sys
from pathlib import Path

import requests

from scripts.utils import save_database, slugify, DATA_DIR, ensure_dir

# Primary source: public-apis API
PRIMARY_URL = "https://api.publicapis.org/entries"

# Fallback: GitHub raw JSON mirror
FALLBACK_URL = "https://raw.githubusercontent.com/public-apis/public-apis/master/scripts/tests/test_data.json"

# Alternative reliable source with full dataset
ALT_URL = "https://raw.githubusercontent.com/marcelscruz/public-apis/main/db/data.json"

REQUEST_TIMEOUT = 30


def fetch_from_primary() -> list | None:
    """Fetch entries from the public-apis API.

    Returns:
        List of raw entry dicts, or None on failure.
    """
    try:
        response = requests.get(PRIMARY_URL, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()

        if "entries" in data and isinstance(data["entries"], list):
            return data["entries"]

        return None
    except (requests.RequestException, json.JSONDecodeError, KeyError, ConnectionError, OSError):
        return None


def fetch_from_alternative() -> list | None:
    """Fetch entries from the alternative GitHub-hosted dataset.

    Returns:
        List of raw entry dicts, or None on failure.
    """
    try:
        response = requests.get(ALT_URL, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()

        if isinstance(data, list):
            return data

        return None
    except (requests.RequestException, json.JSONDecodeError):
        return None


def normalize_entry(raw: dict) -> dict | None:
    """Normalize a raw API entry into our standard schema.

    Args:
        raw: Raw entry dict from the data source.

    Returns:
        Normalized dict with standard keys, or None if the entry is invalid.
    """
    title = raw.get("API") or raw.get("name") or raw.get("title", "")
    description = raw.get("Description") or raw.get("description", "")

    if not title or not description:
        return None

    category = raw.get("Category") or raw.get("category", "Uncategorized")
    url = raw.get("Link") or raw.get("url") or raw.get("link", "")
    auth = raw.get("Auth") or raw.get("auth", "")
    https_support = raw.get("HTTPS") if raw.get("HTTPS") is not None else raw.get("https", True)
    cors = raw.get("Cors") or raw.get("cors", "unknown")

    return {
        "title": title.strip(),
        "description": description.strip(),
        "category": category.strip(),
        "url": url.strip(),
        "auth": auth.strip() if auth else "None",
        "https": bool(https_support),
        "cors": cors.strip() if isinstance(cors, str) else "unknown",
        "slug": slugify(title),
    }


def deduplicate(items: list) -> list:
    """Remove duplicate entries based on slug.

    Args:
        items: List of normalized item dicts.

    Returns:
        Deduplicated list, sorted by title for deterministic output.
    """
    seen = set()
    unique = []
    for item in items:
        if item["slug"] not in seen:
            seen.add(item["slug"])
            unique.append(item)

    return sorted(unique, key=lambda x: x["title"].lower())


def fetch_and_save() -> bool:
    """Main entry point: fetch data, normalize, deduplicate, and save.

    Returns:
        True if data was successfully fetched and saved, False otherwise.
    """
    print("📡 Fetching API directory data...")

    # Try primary source
    print("  → Trying primary source (api.publicapis.org)...")
    raw_entries = fetch_from_primary()

    # Fallback to alternative
    if not raw_entries:
        print("  → Primary failed. Trying alternative source (GitHub)...")
        raw_entries = fetch_from_alternative()

    if not raw_entries:
        print("  ✗ All sources failed. Skipping update.")
        return False

    print(f"  ✓ Fetched {len(raw_entries)} raw entries.")

    # Normalize
    normalized = []
    for raw in raw_entries:
        entry = normalize_entry(raw)
        if entry:
            normalized.append(entry)

    print(f"  ✓ Normalized {len(normalized)} valid entries.")

    # Deduplicate
    unique = deduplicate(normalized)
    print(f"  ✓ {len(unique)} unique entries after deduplication.")

    if not unique:
        print("  ✗ No valid entries found. Skipping update.")
        return False

    # Save
    ensure_dir(DATA_DIR)
    save_database(unique)
    print(f"  ✓ Saved to data/database.json")

    return True


def main():
    """CLI entry point. Exits 0 regardless to avoid breaking CI."""
    success = fetch_and_save()
    if success:
        print("✅ Data sync complete.")
    else:
        print("⚠️  Data sync skipped (source unavailable). Will retry next run.")

    # Always exit 0 so CI doesn't fail
    sys.exit(0)


if __name__ == "__main__":
    main()
