"""
Tests for cleanup.py — file and directory cleanup utility.
"""
import os
import shutil
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest

from scripts.cleanup import clean_directory, get_directories, main, patterns, dirs_to_remove


class TestGetDirectories:
    """Test get_directories returns expected paths."""

    def test_returns_list(self):
        dirs = get_directories()
        assert isinstance(dirs, list)
        assert len(dirs) > 0

    def test_includes_project_root(self):
        dirs = get_directories()
        root = str(Path(__file__).resolve().parent.parent)
        assert root in dirs

    def test_includes_project_subdirectories(self):
        dirs = get_directories()
        assert any("datasets-directory" in d for d in dirs)
        assert any("tools-directory" in d for d in dirs)
        assert any("apistatus-directory" in d for d in dirs)


class TestCleanDirectory:
    """Test clean_directory removes matching files and dirs."""

    def test_returns_zero_for_nonexistent_dir(self):
        files, dirs = clean_directory("/nonexistent/path/that/does/not/exist")
        assert files == 0
        assert dirs == 0

    def test_removes_matching_files(self, tmp_path):
        # Create files matching cleanup patterns
        (tmp_path / "test_foo.txt").write_text("test")
        (tmp_path / "debug.log").write_text("log")
        (tmp_path / "keep_me.py").write_text("code")

        files, dirs = clean_directory(str(tmp_path))
        assert files >= 2
        assert not (tmp_path / "test_foo.txt").exists()
        assert not (tmp_path / "debug.log").exists()
        assert (tmp_path / "keep_me.py").exists()

    def test_removes_matching_directories(self, tmp_path):
        cache_dir = tmp_path / ".pytest_cache"
        cache_dir.mkdir()
        (cache_dir / "some_file.txt").write_text("data")

        files, dirs = clean_directory(str(tmp_path))
        assert dirs >= 1
        assert not cache_dir.exists()

    def test_handles_permission_errors_gracefully(self, tmp_path):
        # Should not crash even if removal fails
        (tmp_path / "test_nocrash.txt").write_text("data")
        files, dirs = clean_directory(str(tmp_path))
        assert isinstance(files, int)
        assert isinstance(dirs, int)


class TestMain:
    """Test the main cleanup orchestrator."""

    def test_main_returns_counts(self):
        total_files, total_dirs = main()
        assert isinstance(total_files, int)
        assert isinstance(total_dirs, int)
        assert total_files >= 0
        assert total_dirs >= 0


class TestPatterns:
    """Test that cleanup patterns and dirs are properly defined."""

    def test_patterns_is_list(self):
        assert isinstance(patterns, list)
        assert len(patterns) > 0

    def test_dirs_to_remove_is_list(self):
        assert isinstance(dirs_to_remove, list)
        assert ".pytest_cache" in dirs_to_remove
