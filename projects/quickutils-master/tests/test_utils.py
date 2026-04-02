"""Tests for scripts/utils.py"""
import json
from pathlib import Path

import pytest

from scripts.utils import (
    ensure_dir,
    get_categories,
    get_config,
    load_database,
    save_database,
    slugify,
    truncate,
)

class TestGetConfig:
    def test_get_config_bool_parsing(self):
        import os
        from unittest.mock import patch
        
        with patch.dict(os.environ, {"TEST_TRUE": "yes", "TEST_FALSE": "0", "TEST_VAL": "hello"}):
            assert get_config("TEST_TRUE", False) is True
            assert get_config("TEST_FALSE", True) is False
            assert get_config("TEST_VAL", "") == "hello"


class TestSlugify:
    """Test the slugify utility function."""

    def test_basic_text(self):
        assert slugify("Hello World") == "hello-world"

    def test_special_characters(self):
        assert slugify("Spaces & Symbols!!") == "spaces-symbols"

    def test_unicode_text(self):
        assert slugify("Ünïcödé Têxt") == "unicode-text"

    def test_leading_trailing_spaces(self):
        assert slugify("  trim me  ") == "trim-me"

    def test_multiple_hyphens(self):
        assert slugify("too---many---hyphens") == "too-many-hyphens"

    def test_numbers_preserved(self):
        assert slugify("API v2.0") == "api-v2-0"

    def test_empty_string(self):
        assert slugify("") == ""

    def test_only_special_chars(self):
        assert slugify("!@#$%") == ""

    def test_already_slugified(self):
        assert slugify("already-a-slug") == "already-a-slug"

    def test_mixed_case(self):
        assert slugify("CamelCase API") == "camelcase-api"


class TestLoadDatabase:
    """Test the load_database function."""

    def test_load_valid_json(self, sample_database_path):
        items = load_database(sample_database_path)
        assert isinstance(items, list)
        assert len(items) == 5
        assert items[0]["title"] == "Dog API"

    def test_load_missing_file(self, tmp_path):
        items = load_database(tmp_path / "nonexistent.json")
        assert items == []

    def test_load_invalid_json(self, tmp_path):
        bad_file = tmp_path / "bad.json"
        bad_file.write_text("not json at all", encoding="utf-8")
        with pytest.raises(json.JSONDecodeError):
            load_database(bad_file)

    def test_load_non_array_json(self, tmp_path):
        bad_file = tmp_path / "object.json"
        bad_file.write_text('{"key": "value"}', encoding="utf-8")
        with pytest.raises(ValueError, match="must contain a JSON array"):
            load_database(bad_file)

    def test_load_database_default_path(self):
        from unittest.mock import patch
        with patch("scripts.utils.DATA_DIR", Path("/tmp/nonexistent_data")):
            items = load_database()
            assert items == []

    def test_load_database_missing_fields(self, tmp_path):
        bad_file = tmp_path / "missing.json"
        bad_file.write_text('[{"some_key": "val"}]', encoding="utf-8")
        items = load_database(bad_file)
        item = items[0]
        
        assert item["title"] == "Unknown Item"
        assert item["slug"] == "unknown-item"
        assert item["cors"] == "unknown"
        assert item["auth"] == "None"
        assert item["https"] is True
        assert item["category"] == "Uncategorized"
        assert item["url"] == "#"

    def test_load_database_with_id_no_title(self, tmp_path):
        bad_file = tmp_path / "missing2.json"
        bad_file.write_text('[{"id": "Test-ID", "name": "Real Name"}]', encoding="utf-8")
        items = load_database(bad_file)
        item = items[0]
        
        assert item["title"] == "Real Name"
        assert item["slug"] == "test-id"


class TestSaveDatabase:
    """Test the save_database function."""

    def test_save_and_reload(self, tmp_path, sample_items):
        path = tmp_path / "output" / "db.json"
        save_database(sample_items, path)

        assert path.exists()
        loaded = load_database(path)
        assert len(loaded) == len(sample_items)

    def test_deterministic_sorting(self, tmp_path, sample_items):
        path = tmp_path / "db.json"
        save_database(sample_items, path)

        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        # Keys should be sorted alphabetically within each item
        assert content.index('"category"') < content.index('"url"')
        assert content.index('"category"') < content.index('"description"')

    def test_creates_parent_dirs(self, tmp_path, sample_items):
        path = tmp_path / "deep" / "nested" / "dir" / "db.json"
        save_database(sample_items, path)
        assert path.exists()


class TestEnsureDir:
    """Test the ensure_dir function."""

    def test_creates_directory(self, tmp_path):
        new_dir = tmp_path / "new" / "nested"
        ensure_dir(new_dir)
        assert new_dir.is_dir()

    def test_existing_directory(self, tmp_path):
        # Should not raise
        ensure_dir(tmp_path)
        assert tmp_path.is_dir()


class TestGetCategories:
    """Test the get_categories function."""

    def test_groups_correctly(self, sample_items):
        cats = get_categories(sample_items)
        assert "Animals" in cats
        assert "Weather" in cats
        assert len(cats["Animals"]) == 2
        assert len(cats["Weather"]) == 1

    def test_sorted_alphabetically(self, sample_items):
        cats = get_categories(sample_items)
        keys = list(cats.keys())
        assert keys == sorted(keys)

    def test_empty_list(self):
        cats = get_categories([])
        assert cats == {}

    def test_uncategorized_items(self):
        items = [{"title": "Test", "slug": "test"}]
        cats = get_categories(items)
        assert "Uncategorized" in cats

    def test_all_items_present(self, sample_items):
        cats = get_categories(sample_items)
        total = sum(len(v) for v in cats.values())
        assert total == len(sample_items)


class TestTruncate:
    """Test the truncate utility function."""

    def test_short_text(self):
        assert truncate("short", 160) == "short"

    def test_long_text(self):
        long = "a " * 200
        result = truncate(long, 50)
        assert len(result) <= 50
        assert result.endswith("...")

    def test_empty_string(self):
        assert truncate("") == ""

    def test_none_input(self):
        assert truncate(None) == ""

    def test_exact_length(self):
        text = "x" * 160
        assert truncate(text, 160) == text

    def test_truncate_no_spaces(self):
        text = "a" * 200
        res = truncate(text, max_length=50)
        assert len(res) == 50
        assert res.endswith("...")
