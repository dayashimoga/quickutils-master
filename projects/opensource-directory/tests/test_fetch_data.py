"""Tests for scripts/fetch_data.py"""
import json
from unittest.mock import patch

import pytest
import responses

from scripts.fetch_data import (
    SEED_DATA_URL,
    deduplicate,
    fetch_and_save,
    get_seed_data,
    normalize_entry,
)


class TestNormalizeEntry:
    """Test entry normalization."""

    def test_valid_entry(self):
        raw = {
            "name": "Supabase",
            "alternative_to": "Firebase",
            "description": "Open source Firebase alternative",
            "category": "Database",
            "url": "https://supabase.com/",
            "github_repo": "https://github.com/supabase/supabase"
        }
        result = normalize_entry(raw)
        assert result is not None
        assert result["title"] == "Supabase"
        assert result["alternative_to"] == "Firebase"
        assert result["category"] == "Database"
        assert result["slug"] == "supabase-alternative-to-firebase"

    def test_missing_name_returns_none(self):
        raw = {"alternative_to": "Firebase", "category": "Database"}
        result = normalize_entry(raw)
        assert result is None

    def test_missing_alternative_to_returns_none(self):
        raw = {"name": "Supabase", "category": "Database"}
        result = normalize_entry(raw)
        assert result is None

    def test_whitespace_trimming(self):
        raw = {
            "name": "  Trimmed  ",
            "alternative_to": "  TrimmedAlt  ",
            "description": "  Desc  ",
            "category": "  Test  ",
            "url": "  https://test.com  ",
            "github_repo": "  https://github.com/test/test  ",
        }
        result = normalize_entry(raw)
        assert result["title"] == "Trimmed"
        assert result["alternative_to"] == "TrimmedAlt"
        assert result["description"] == "Desc"
        assert result["category"] == "Test"


class TestDeduplicate:
    """Test deduplication logic."""

    def test_removes_duplicates(self):
        items = [
            {"title": "API A", "slug": "api-a"},
            {"title": "API B", "slug": "api-b"},
            {"title": "API A Duplicate", "slug": "api-a"},
        ]
        result = deduplicate(items)
        assert len(result) == 2

    def test_sorted_by_title(self):
        items = [
            {"title": "Zeta API", "slug": "zeta"},
            {"title": "Alpha API", "slug": "alpha"},
            {"title": "Middle API", "slug": "middle"},
        ]
        result = deduplicate(items)
        assert result[0]["title"] == "Alpha API"
        assert result[1]["title"] == "Middle API"
        assert result[2]["title"] == "Zeta API"

    def test_empty_list(self):
        result = deduplicate([])
        assert result == []


class TestFetchAndSave:
    """Test the full fetch-and-save pipeline."""

    @responses.activate
    def test_successful_fetch(self, tmp_path):
        responses.add(
            responses.GET,
            SEED_DATA_URL,
            json=[
                {
                    "name": "Mattermost",
                    "alternative_to": "Slack",
                    "description": "Slack alternative",
                    "category": "Communication",
                }
            ],
            status=200,
        )

        with patch("scripts.fetch_data.DATA_DIR", tmp_path), \
             patch("scripts.utils.DATA_DIR", tmp_path):
            result = fetch_and_save()

        assert result is True
        db_path = tmp_path / "database.json"
        assert db_path.exists()

        items = json.loads(db_path.read_text(encoding="utf-8"))
        assert len(items) == 1
        assert items[0]["title"] == "Mattermost"

    @responses.activate
    def test_fallback_to_seed_data(self, tmp_path):
        # Trigger an error on the remote call
        responses.add(responses.GET, SEED_DATA_URL, status=500)

        with patch("scripts.fetch_data.DATA_DIR", tmp_path), \
             patch("scripts.utils.DATA_DIR", tmp_path):
            result = fetch_and_save()

        # It should still succeed by using get_seed_data()
        assert result is True
        db_path = tmp_path / "database.json"
        assert db_path.exists()

        items = json.loads(db_path.read_text(encoding="utf-8"))
        assert len(items) > 0
        assert items[0]["title"] in [item["name"] for item in get_seed_data()]
