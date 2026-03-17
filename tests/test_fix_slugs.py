"""
Tests for fix_slugs.py — slug injection utility.
"""
import os
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest

from scripts.fix_slugs import update_utils_py, get_directories, main


class TestUpdateUtilsPy:
    """Test the update_utils_py function."""

    def test_updates_matching_file(self, tmp_path):
        utils = tmp_path / "utils.py"
        utils.write_text(
            '''import json
from pathlib import Path
DATA_DIR = Path("data")

def slugify(text):
    return text.lower().replace(" ", "-")

def load_database(path: Path = None) -> list:
    """Load the database."""
    if path is None:
        path = DATA_DIR / "database.json"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("database.json must contain a JSON array")
    return data
''',
            encoding="utf-8",
        )
        result = update_utils_py(str(utils))
        assert result is True
        content = utils.read_text(encoding="utf-8")
        assert "slug" in content

    def test_returns_false_for_no_match(self, tmp_path):
        utils = tmp_path / "utils.py"
        utils.write_text("# no matching function here\n", encoding="utf-8")
        result = update_utils_py(str(utils))
        assert result is False


class TestGetDirectories:
    """Test get_directories returns expected paths."""

    def test_returns_list(self):
        dirs = get_directories()
        assert isinstance(dirs, list)
        assert len(dirs) > 0

    def test_includes_known_projects(self):
        dirs = get_directories()
        joined = " ".join(dirs)
        assert "datasets-directory" in joined
        assert "tools-directory" in joined


class TestMain:
    """Test the main function."""

    def test_main_returns_count(self):
        # main() scans for utils.py in project dirs; should not crash
        result = main()
        assert isinstance(result, int)
        assert result >= 0
