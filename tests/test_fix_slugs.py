"""Tests for scripts/fix_slugs.py"""
import os
from pathlib import Path
from unittest.mock import patch, mock_open, MagicMock

import pytest

from scripts.fix_slugs import update_utils_py, get_directories, main


class TestUpdateUtilsPy:
    """Test the update_utils_py function."""

    def test_updates_matching_pattern(self, tmp_path):
        """Should replace the old load_database pattern with slug-injecting version."""
        utils_file = tmp_path / "utils.py"
        old_content = '''import json
from pathlib import Path

DATA_DIR = Path("data")

def slugify(text):
    return text.lower().replace(" ", "-")

def load_database(path: Path = None) -> list:
    if path is None:
        path = DATA_DIR / "database.json"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("database.json must contain a JSON array")
    return data
'''
        utils_file.write_text(old_content, encoding="utf-8")
        result = update_utils_py(str(utils_file))
        assert result is True

        updated = utils_file.read_text(encoding="utf-8")
        assert "Inject slugs and titles if missing" in updated

    def test_no_match_returns_false(self, tmp_path):
        """Should return False when pattern isn't found."""
        utils_file = tmp_path / "utils.py"
        utils_file.write_text("# no load_database here", encoding="utf-8")
        result = update_utils_py(str(utils_file))
        assert result is False

    def test_preserves_other_code(self, tmp_path):
        """Should not alter code outside the matched pattern."""
        utils_file = tmp_path / "utils.py"
        content = '''HEADER = True

def load_database(path: Path = None) -> list:
    if path is None:
        path = DATA_DIR / "database.json"
    with open(path, "r") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("database.json must contain a JSON array")
    return data

FOOTER = True
'''
        utils_file.write_text(content, encoding="utf-8")
        update_utils_py(str(utils_file))
        updated = utils_file.read_text(encoding="utf-8")
        assert "HEADER = True" in updated
        assert "FOOTER = True" in updated


class TestGetDirectories:
    """Test the get_directories function."""

    def test_returns_list_of_strings(self):
        result = get_directories()
        assert isinstance(result, list)
        for d in result:
            assert isinstance(d, str)

    def test_includes_project_dirs(self):
        result = get_directories()
        # Should include apistatus-directory
        assert any("apistatus-directory" in d for d in result)


class TestMain:
    """Test the main function."""

    def test_main_updates_existing_files(self, tmp_path):
        """main() should iterate dirs and call update_utils_py."""
        scripts_dir = tmp_path / "scripts"
        scripts_dir.mkdir()
        utils_file = scripts_dir / "utils.py"
        utils_file.write_text("# empty", encoding="utf-8")

        with patch("scripts.fix_slugs.get_directories", return_value=[str(tmp_path)]):
            updated = main()
            # File exists but pattern doesn't match
            assert updated == 0

    def test_main_skips_missing_dirs(self):
        """main() should skip non-existent directories."""
        with patch("scripts.fix_slugs.get_directories", return_value=["/nonexistent"]):
            updated = main()
            assert updated == 0
