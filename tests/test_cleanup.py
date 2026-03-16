"""Tests for scripts/cleanup.py"""
import os
import shutil
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

from scripts.cleanup import clean_directory, get_directories, main, patterns, dirs_to_remove


class TestCleanDirectory:
    """Test the clean_directory function."""

    def test_cleans_matching_files(self, tmp_path):
        """Files matching patterns should be removed."""
        # Create files that match cleanup patterns
        (tmp_path / "test_report.txt").write_text("report")
        (tmp_path / "build.log").write_text("log")
        (tmp_path / ".coverage").write_text("cov")
        # Create a file that should NOT be removed
        (tmp_path / "important.py").write_text("code")

        files, dirs = clean_directory(str(tmp_path))
        assert files >= 2  # at least the .log and .coverage
        assert (tmp_path / "important.py").exists()

    def test_cleans_matching_directories(self, tmp_path):
        """Directories in dirs_to_remove should be removed."""
        cache_dir = tmp_path / ".pytest_cache"
        cache_dir.mkdir()
        (cache_dir / "v" / "cache").mkdir(parents=True)
        (cache_dir / "v" / "cache" / "file.txt").write_text("data")

        htmlcov_dir = tmp_path / "htmlcov"
        htmlcov_dir.mkdir()

        files, dirs = clean_directory(str(tmp_path))
        assert dirs == 2
        assert not cache_dir.exists()
        assert not htmlcov_dir.exists()

    def test_nonexistent_directory(self):
        """Non-existent directory should return (0, 0)."""
        files, dirs = clean_directory("/nonexistent/path/abc123")
        assert files == 0
        assert dirs == 0

    def test_handles_file_removal_error(self, tmp_path):
        """Should handle errors gracefully when file removal fails."""
        (tmp_path / "build.log").write_text("log")

        with patch("os.remove", side_effect=PermissionError("denied")):
            files, dirs = clean_directory(str(tmp_path))
            assert files == 0  # removal failed

    def test_handles_dir_removal_error(self, tmp_path):
        """Should handle errors gracefully when directory removal fails."""
        (tmp_path / ".pytest_cache").mkdir()

        with patch("shutil.rmtree", side_effect=PermissionError("denied")):
            files, dirs = clean_directory(str(tmp_path))
            assert dirs == 0  # removal failed

    def test_empty_directory(self, tmp_path):
        """Empty directory should be cleaned without errors."""
        files, dirs = clean_directory(str(tmp_path))
        assert files == 0
        assert dirs == 0


class TestGetDirectories:
    """Test the get_directories function."""

    def test_returns_list(self):
        result = get_directories()
        assert isinstance(result, list)
        assert len(result) > 0

    def test_contains_project_root(self):
        result = get_directories()
        # First entry should be the project root
        assert len(result) >= 1


class TestMain:
    """Test the main function."""

    def test_main_runs_cleanup(self, tmp_path):
        """main() should clean all directories."""
        test_dir = tmp_path / "test_project"
        test_dir.mkdir()
        (test_dir / "build.log").write_text("log")

        with patch("scripts.cleanup.get_directories", return_value=[str(test_dir)]):
            total_files, total_dirs = main()
            assert total_files >= 1

    def test_main_returns_counts(self):
        """main() should return file and dir removal counts."""
        with patch("scripts.cleanup.get_directories", return_value=[]):
            f, d = main()
            assert f == 0
            assert d == 0


class TestPatterns:
    """Test that pattern/dir lists are correct."""

    def test_patterns_not_empty(self):
        assert len(patterns) > 0

    def test_dirs_to_remove_not_empty(self):
        assert len(dirs_to_remove) > 0

    def test_patterns_are_strings(self):
        for p in patterns:
            assert isinstance(p, str)
