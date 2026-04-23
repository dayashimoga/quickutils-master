import json
import os
import requests
import time
from pathlib import Path

# Pinterest Credentials (set these in your environment)
PINTEREST_APP_ID = os.environ.get("PINTEREST_APP_ID") or "1550101"
PINTEREST_ACCESS_TOKEN = os.environ.get("PINTEREST_ACCESS_TOKEN")
API_BASE_URL = "https://api.pinterest.com/v5"

if not PINTEREST_ACCESS_TOKEN:
    print("WARNING: PINTEREST_ACCESS_TOKEN not found in environment variables.")
    print("Please set it before running this script.")

# Project Roots
BORING_ROOT = Path("H:/boring")
BORINGWEBSITE_ROOT = Path("H:/boringwebsite")

def get_headers():
    if not PINTEREST_ACCESS_TOKEN:
        return {}
    return {
        "Authorization": f"Bearer {PINTEREST_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

def get_boards():
    """Fetch all boards for the authenticated user."""
    url = f"{API_BASE_URL}/boards"
    response = requests.get(url, headers=get_headers())
    if response.status_code == 200:
        return response.json().get("items", [])
    else:
        print(f"Error fetching boards: {response.text}")
        return []

def create_pin(board_id, title, description, link, image_url):
    """Create a new pin on a specific board."""
    url = f"{API_BASE_URL}/pins"
    payload = {
        "title": title[:100],
        "description": description[:500],
        "link": link,
        "board_id": board_id,
        "media_source": {
            "source_type": "image_url",
            "url": image_url
        }
    }
    response = requests.post(url, headers=get_headers(), json=payload)
    if response.status_code == 201:
        print(f"Successfully created pin: {title}")
        return response.json()
    else:
        print(f"Error creating pin '{title}': {response.text}")
        return None

def load_daily_facts():
    database_path = BORING_ROOT / "projects/dailyfacts/data/database.json"
    if database_path.exists():
        with open(database_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def load_directory_items(project_name):
    database_path = BORING_ROOT / f"projects/{project_name}/data/database.json"
    if database_path.exists():
        with open(database_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def automate_pinning(limit_per_category=5):
    boards = get_boards()
    if not boards:
        print("No boards found. Please create a board on Pinterest first.")
        return

    # Map categories to boards or use a default one
    default_board = boards[0]["id"]
    print(f"Using default board: {boards[0]['name']} ({default_board})")

    # 1. Pin Daily Facts
    print("\n--- Pinning Daily Facts ---")
    facts = load_daily_facts()
    for fact in facts[:limit_per_category]:
        title = f"Mind-Blowing Fact: {fact['category']}"
        description = f"{fact['text']} \n\nFound on DailyFacts."
        link = "https://facts.quickutils.top"
        # Placeholder image for now - in production, this should be a high-res infographic URL
        image_url = "https://facts.quickutils.top/images/og-image.png"
        create_pin(default_board, title, description, link, image_url)
        time.sleep(1) # Rate limiting

    # 2. Pin Tools from Directories
    directories = ["tools-directory", "opensource-directory", "datasets-directory"]
    for directory in directories:
        print(f"\n--- Pinning from {directory} ---")
        items = load_directory_items(directory)
        for item in items[:limit_per_category]:
            title = f"Useful Tool: {item['title']}"
            description = f"{item['description']} \n\nCheck it out on QuickUtils."
            link = f"https://{directory.split('-')[0]}.quickutils.top/api/{item['slug']}.html"
            image_url = "https://quickutils.top/images/og-image.png"
            create_pin(default_board, title, description, link, image_url)
            time.sleep(1)

if __name__ == "__main__":
    # To run: python scripts/pinterest_automation.py
    automate_pinning(limit_per_category=2) # Small limit for testing
