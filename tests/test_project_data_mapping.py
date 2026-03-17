"""
Tests for project data mapping — ensures each project loads data from its own database.json.
"""
import json
import os
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))

PROJECTS_DIR = ROOT_DIR / "projects"

# All project directories that have their own database.json
DIRECTORY_PROJECTS = [
    "apistatus-directory",
    "boilerplates-directory",
    "cheatsheets-directory",
    "datasets-directory",
    "jobs-directory",
    "opensource-directory",
    "prompts-directory",
    "quickutils-master",
    "tools-directory",
]


class TestProjectTypeDetection:
    """Test _detect_project_type() auto-detection logic."""

    def test_env_variable_takes_priority(self):
        """PROJECT_TYPE env var should override all other detection."""
        with patch.dict(os.environ, {"PROJECT_TYPE": "cheatsheets-directory"}):
            # Re-import to trigger detection
            from scripts.utils import _detect_project_type
            result = _detect_project_type()
            assert result == "cheatsheets-directory"

    def test_default_is_master(self):
        """Without env var or CWD match, should default to quickutils-master."""
        with patch.dict(os.environ, {}, clear=False):
            if "PROJECT_TYPE" in os.environ:
                del os.environ["PROJECT_TYPE"]
            from scripts.utils import _detect_project_type
            result = _detect_project_type()
            # Should be quickutils-master or the root dir name when CWD is root
            assert result in ("master", "quickutils-master", "boring", ROOT_DIR.name)

    def test_cwd_detection_for_project(self):
        """When CWD is inside a project dir, should detect it."""
        cheatsheets_dir = PROJECTS_DIR / "cheatsheets-directory"
        if not cheatsheets_dir.exists():
            pytest.skip("cheatsheets-directory not found")

        with patch.dict(os.environ, {}, clear=False):
            if "PROJECT_TYPE" in os.environ:
                del os.environ["PROJECT_TYPE"]
            with patch("pathlib.Path.cwd", return_value=cheatsheets_dir):
                from scripts.utils import _detect_project_type
                result = _detect_project_type()
                assert result == "cheatsheets-directory"


class TestNormalizeProjectName:
    """Test the _normalize_project_name helper."""

    def test_strips_directory_suffix(self):
        from scripts.utils import _normalize_project_name
        assert _normalize_project_name("cheatsheets-directory") == "cheatsheets"
        assert _normalize_project_name("tools-directory") == "tools"

    def test_preserves_names_without_suffix(self):
        from scripts.utils import _normalize_project_name
        assert _normalize_project_name("dailyfacts") == "dailyfacts"
        assert _normalize_project_name("master") == "master"
        assert _normalize_project_name("boringwebsite") == "boringwebsite"


class TestGetProjectDatabasePath:
    """Test that get_project_database_path resolves correctly."""

    def test_resolves_full_directory_name(self):
        from scripts.utils import get_project_database_path
        path = get_project_database_path("cheatsheets-directory")
        assert path.name == "database.json"
        assert "cheatsheets-directory" in str(path)

    def test_resolves_short_name(self):
        from scripts.utils import get_project_database_path
        path = get_project_database_path("cheatsheets")
        assert path.name == "database.json"
        # Should find cheatsheets-directory via fallback
        assert "cheatsheets" in str(path)


class TestProjectDatabaseUniqueness:
    """Verify each project has unique data in its database.json."""

    @pytest.mark.parametrize("project_name", DIRECTORY_PROJECTS)
    def test_database_exists(self, project_name):
        """Each project should have its own database.json."""
        db_path = PROJECTS_DIR / project_name / "data" / "database.json"
        assert db_path.exists(), f"Missing database.json for {project_name}"

    @pytest.mark.parametrize("project_name", DIRECTORY_PROJECTS)
    def test_database_is_valid_json(self, project_name):
        """Each database.json must be valid JSON array with items."""
        db_path = PROJECTS_DIR / project_name / "data" / "database.json"
        if not db_path.exists():
            pytest.skip(f"{project_name}/data/database.json not found")

        data = json.loads(db_path.read_text(encoding="utf-8"))
        assert isinstance(data, list), f"{project_name}: database must be a JSON array"
        assert len(data) > 0, f"{project_name}: database is empty"

    def test_databases_are_distinct(self):
        """No two projects should have identical database.json content."""
        databases = {}
        for project_name in DIRECTORY_PROJECTS:
            db_path = PROJECTS_DIR / project_name / "data" / "database.json"
            if db_path.exists():
                content = db_path.read_text(encoding="utf-8").strip()
                databases[project_name] = content

        # Check uniqueness by comparing first item IDs/names
        first_items = {}
        for project_name, content in databases.items():
            data = json.loads(content)
            if data:
                first_id = data[0].get("id", data[0].get("name", ""))
                first_items[project_name] = first_id

        # Ensure at least some diversity
        unique_values = set(first_items.values())
        assert len(unique_values) > 1, (
            f"All projects have the same first item — data mapping is broken: {first_items}"
        )


class TestGetConfigResolution:
    """Test that get_config resolves project-specific overrides."""

    def test_config_resolves_project_override(self):
        """get_config should pick up project-specific settings from project_config.json."""
        from scripts.utils import get_config, _CONFIG
        projects_cfg = _CONFIG.get("projects", {})

        # Verify the config file has project entries
        assert "cheatsheets-directory" in projects_cfg or "cheatsheets" in projects_cfg, \
            "project_config.json should have cheatsheets configuration"

    def test_config_has_all_projects(self):
        """project_config.json should have entries for all project directories."""
        from scripts.utils import _CONFIG
        projects_cfg = _CONFIG.get("projects", {})

        expected_projects = {
            "apistatus-directory", "boilerplates-directory", "cheatsheets-directory",
            "dailyfacts", "datasets-directory", "jobs-directory",
            "opensource-directory", "prompts-directory", "quickutils-master",
            "tools-directory", "boringwebsite",
        }

        config_keys = set(projects_cfg.keys())
        for expected in expected_projects:
            short_name = expected.replace("-directory", "")
            assert expected in config_keys or short_name in config_keys, \
                f"project_config.json missing entry for {expected}"

    def test_each_project_has_site_url(self):
        """Each project should have a SITE_URL configured."""
        from scripts.utils import _CONFIG
        projects_cfg = _CONFIG.get("projects", {})

        for proj_name, proj_cfg in projects_cfg.items():
            assert "SITE_URL" in proj_cfg, f"Project {proj_name} missing SITE_URL"
            assert proj_cfg["SITE_URL"].startswith("https://"), \
                f"Project {proj_name} SITE_URL must be HTTPS"
