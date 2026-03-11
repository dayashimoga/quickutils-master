"""
Shared test fixtures for the Programmatic SEO Directory test suite.
"""
import json
import os
import sys
from pathlib import Path

import pytest

# Ensure the project root is in sys.path for imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


@pytest.fixture
def sample_items():
    """A small sample dataset for testing."""
    return [
        {
            "title": "Mattermost",
            "alternative_to": "Slack",
            "description": "Open-source, self-hostable Slack-alternative",
            "category": "Communication",
            "url": "https://mattermost.com/",
            "github_repo": "https://github.com/mattermost/mattermost",
            "slug": "mattermost-alternative-to-slack",
        },
        {
            "title": "Supabase",
            "alternative_to": "Firebase",
            "description": "The open source Firebase alternative",
            "category": "Database",
            "url": "https://supabase.com/",
            "github_repo": "https://github.com/supabase/supabase",
            "slug": "supabase-alternative-to-firebase",
        },
        {
            "title": "Plausible Analytics",
            "alternative_to": "Google Analytics",
            "description": "A privacy-friendly Google Analytics alternative",
            "category": "Analytics",
            "url": "https://plausible.io/",
            "github_repo": "https://github.com/plausible/analytics",
            "slug": "plausible-analytics-alternative-to-google-analytics",
        },
        {
            "title": "PostHog",
            "alternative_to": "Mixpanel",
            "description": "Open source product analytics",
            "category": "Analytics",
            "url": "https://posthog.com/",
            "github_repo": "https://github.com/posthog/posthog",
            "slug": "posthog-alternative-to-mixpanel",
        },
        {
            "title": "Nextcloud",
            "alternative_to": "Google Drive",
            "description": "Safe home for all your data",
            "category": "Storage",
            "url": "https://nextcloud.com/",
            "github_repo": "https://github.com/nextcloud/server",
            "slug": "nextcloud-alternative-to-google-drive",
        },
    ]


@pytest.fixture
def sample_database_path(tmp_path, sample_items):
    """Creates a temporary database.json file with sample data."""
    db_path = tmp_path / "database.json"
    db_path.write_text(json.dumps(sample_items, indent=2), encoding="utf-8")
    return db_path


@pytest.fixture
def sample_raw_api_entries():
    """Raw API entries as returned by the public-apis API."""
    return [
        {
            "name": "Mattermost",
            "alternative_to": "Slack",
            "description": "Open-source Slack alternative",
            "category": "Communication",
            "url": "https://mattermost.com/",
            "github_repo": "https://github.com/mattermost/mattermost"
        },
        {
            "name": "Supabase",
            "alternative_to": "Firebase",
            "description": "Firebase alternative",
            "category": "Database",
            "url": "https://supabase.com/",
            "github_repo": "https://github.com/supabase/supabase"
        },
        {
            "name": "Plausible Analytics",
            "alternative_to": "Google Analytics",
            "description": "Google Analytics alternative",
            "category": "Analytics",
            "url": "https://plausible.io/",
            "github_repo": "https://github.com/plausible/analytics"
        },
    ]


@pytest.fixture
def templates_dir(tmp_path):
    """Creates a temporary templates directory with minimal templates."""
    tpl_dir = tmp_path / "src" / "templates"
    tpl_dir.mkdir(parents=True)

    # Minimal base template
    base = tpl_dir / "base.html"
    base.write_text(
        '<!DOCTYPE html><html lang="en"><head>'
        "<title>{{ page_title }}</title>"
        '<meta name="description" content="{{ page_description }}">'
        '<link rel="canonical" href="{{ canonical_url }}">'
        "</head><body>"
        "{% block content %}{% endblock %}"
        "</body></html>",
        encoding="utf-8",
    )

    # Index template
    index = tpl_dir / "index.html"
    index.write_text(
        '{% extends "base.html" %}'
        "{% block content %}"
        "<h1>{{ site_name }}</h1>"
        "<p>{{ total_items }} APIs in {{ total_categories }} categories</p>"
        "{% for cat in categories %}"
        '<a href="/category/{{ cat.slug }}.html">{{ cat.name }} ({{ cat.count }})</a>'
        "{% endfor %}"
        "{% for item in featured_items %}"
        '<a href="/item/{{ item.slug }}.html">{{ item.title }}</a>'
        "{% endfor %}"
        "{% endblock %}",
        encoding="utf-8",
    )

    # Item template
    item = tpl_dir / "item.html"
    item.write_text(
        '{% extends "base.html" %}'
        "{% block content %}"
        "<h1>{{ item.title }}</h1>"
        "<p>{{ item.description }}</p>"
        "<p>Category: {{ item.category }}</p>"
        "<p>Alternative to: {{ item.alternative_to }}</p>"
        '<a href="{{ item.url }}">Visit</a>'
        "{% for rel in related_items %}"
        '<a href="/item/{{ rel.slug }}.html">{{ rel.title }}</a>'
        "{% endfor %}"
        "{% endblock %}",
        encoding="utf-8",
    )

    # Category template
    category = tpl_dir / "category.html"
    category.write_text(
        '{% extends "base.html" %}'
        "{% block content %}"
        "<h1>{{ category_name }}</h1>"
        "<p>{{ item_count }} APIs</p>"
        "{% for item in items %}"
        '<a href="/item/{{ item.slug }}.html">{{ item.title }}</a>'
        "{% endfor %}"
        "{% for cat in all_categories %}"
        '<a href="/category/{{ cat.slug }}.html">{{ cat.name }}</a>'
        "{% endfor %}"
        "{% endblock %}",
        encoding="utf-8",
    )

    # 404 template
    notfound = tpl_dir / "404.html"
    notfound.write_text(
        '{% extends "base.html" %}'
        "{% block content %}"
        "<h1>404</h1><p>Not Found</p>"
        "{% endblock %}",
        encoding="utf-8",
    )

    return tpl_dir
