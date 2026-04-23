"""Tests for scripts/build_directory.py"""
import json
import shutil
from pathlib import Path
from unittest.mock import patch

import pytest

from scripts.build_directory import (
    DIRECTORY_TYPES,
    build_directory,
    generate_html,
    main,
)


class TestGenerateHtml:
    """Test HTML generation."""

    def test_generates_valid_html(self):
        items = [
            {"name": "Test Tool", "description": "A test tool", "url": "https://example.com", "category": "Testing"}
        ]
        html = generate_html("tools", items)
        assert "<!DOCTYPE html>" in html
        assert "Test Tool" in html
        assert "A test tool" in html
        assert "https://example.com" in html

    def test_empty_items(self):
        html = generate_html("tools", [])
        assert "<!DOCTYPE html>" in html
        assert "0 items" in html

    def test_multiple_categories(self):
        items = [
            {"name": "A", "category": "Cat1", "url": "#", "description": "desc"},
            {"name": "B", "category": "Cat2", "url": "#", "description": "desc"},
        ]
        html = generate_html("tools", items)
        assert "Cat1" in html
        assert "Cat2" in html

    def test_unknown_dir_type_fallback(self):
        html = generate_html("unknown_type", [{"name": "X", "category": "Y", "url": "#", "description": "d"}])
        assert "Unknown_Type Directory" in html

    def test_https_badge(self):
        items = [{"name": "X", "https": True, "category": "C", "url": "#", "description": "d"}]
        html = generate_html("tools", items)
        assert "HTTPS" in html

    def test_auth_badge(self):
        items = [{"name": "X", "auth": "apiKey", "category": "C", "url": "#", "description": "d"}]
        html = generate_html("tools", items)
        assert "apiKey" in html

    def test_no_auth_badge_for_none(self):
        items = [{"name": "X", "auth": "None", "category": "C", "url": "#", "description": "d"}]
        html = generate_html("tools", items)
        # "None" auth should not produce an auth badge in the card
        assert '<span class="badge badge-yellow">None</span>' not in html

    def test_description_truncation(self):
        long_desc = "A" * 300
        items = [{"name": "X", "description": long_desc, "category": "C", "url": "#"}]
        html = generate_html("tools", items)
        # Description should be truncated to 200 chars
        assert "A" * 200 in html
        assert "A" * 201 not in html

    def test_all_directory_types(self):
        for dir_type in DIRECTORY_TYPES:
            html = generate_html(dir_type, [])
            assert DIRECTORY_TYPES[dir_type]["title"] in html
            assert DIRECTORY_TYPES[dir_type]["icon"] in html

    def test_filter_script_present(self):
        items = [{"name": "X", "category": "C", "url": "#", "description": "d"}]
        html = generate_html("tools", items)
        assert "filterCards" in html


class TestBuildDirectory:
    """Test the build_directory function."""

    def test_build_with_valid_data(self, tmp_path, monkeypatch):
        import scripts.build_directory as bd

        monkeypatch.setattr(bd, "ROOT_DIR", tmp_path)
        project_dir = tmp_path / "projects" / "tools-directory"
        data_dir = project_dir / "data"
        data_dir.mkdir(parents=True)
        with open(data_dir / "database.json", "w") as f:
            json.dump([{"name": "Tool", "category": "Dev", "url": "#", "description": "d"}], f)

        result = build_directory("tools")
        assert result is True
        assert (project_dir / "index.html").exists()
        assert (project_dir / "dist" / "index.html").exists()

    def test_build_missing_project(self, tmp_path, monkeypatch):
        import scripts.build_directory as bd

        monkeypatch.setattr(bd, "ROOT_DIR", tmp_path)
        result = build_directory("nonexistent")
        assert result is False

    def test_build_missing_database(self, tmp_path, monkeypatch):
        import scripts.build_directory as bd

        monkeypatch.setattr(bd, "ROOT_DIR", tmp_path)
        project_dir = tmp_path / "projects" / "tools-directory"
        project_dir.mkdir(parents=True)

        result = build_directory("tools")
        assert result is True
        # Should have created the empty database.json
        assert (project_dir / "data" / "database.json").exists()

    def test_build_dict_database(self, tmp_path, monkeypatch):
        import scripts.build_directory as bd

        monkeypatch.setattr(bd, "ROOT_DIR", tmp_path)
        project_dir = tmp_path / "projects" / "tools-directory"
        data_dir = project_dir / "data"
        data_dir.mkdir(parents=True)
        with open(data_dir / "database.json", "w") as f:
            json.dump({"tool1": {"name": "T", "category": "C"}}, f)

        result = build_directory("tools")
        assert result is True


class TestMain:
    """Test the main CLI function."""

    def test_main_all(self, tmp_path, monkeypatch):
        import scripts.build_directory as bd
        import sys

        monkeypatch.setattr(bd, "ROOT_DIR", tmp_path)
        monkeypatch.setattr(sys, "argv", ["build_directory.py", "--type", "all"])

        # Create project dirs for all types
        for dtype in DIRECTORY_TYPES:
            project_dir = tmp_path / "projects" / f"{dtype}-directory"
            data_dir = project_dir / "data"
            data_dir.mkdir(parents=True)
            with open(data_dir / "database.json", "w") as f:
                json.dump([], f)

        main()

    def test_main_single(self, tmp_path, monkeypatch):
        import scripts.build_directory as bd
        import sys

        monkeypatch.setattr(bd, "ROOT_DIR", tmp_path)
        monkeypatch.setattr(sys, "argv", ["build_directory.py", "--type", "tools"])

        project_dir = tmp_path / "projects" / "tools-directory"
        data_dir = project_dir / "data"
        data_dir.mkdir(parents=True)
        with open(data_dir / "database.json", "w") as f:
            json.dump([], f)

        main()
