"""
Enhanced smoke tests for all projects.
Validates structural integrity: database.json exists, templates exist,
project_config.json is valid, and Python scripts are syntactically correct.
"""
import json
import sys
import subprocess
from pathlib import Path

import pytest

ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))

PROJECTS_DIR = ROOT_DIR / "projects"

from scripts import utils


class TestProjectConfigSmoke:
    """Smoke tests for project_config.json."""

    def test_project_config_valid(self):
        """project_config.json is structurally valid."""
        config_file = ROOT_DIR / "project_config.json"
        assert config_file.exists(), "project_config.json is missing!"
        projects = utils.load_network_links()
        assert len(projects) > 0, "Failed to load project_config.json into network_links"

    def test_project_config_has_required_fields(self):
        """Config should have global required fields."""
        config_path = ROOT_DIR / "project_config.json"
        data = json.loads(config_path.read_text(encoding="utf-8"))
        for key in ["GH_USERNAME", "GA_MEASUREMENT_ID", "ADSENSE_PUBLISHER_ID"]:
            assert key in data, f"project_config.json missing {key}"


class TestPythonSyntaxSmoke:
    """Verify all Python scripts are syntactically correct."""

    def test_python_syntax_smoke(self):
        """Run a quick syntax check on all python scripts in scripts/ directory."""
        scripts_dir = ROOT_DIR / "scripts"
        py_files = list(scripts_dir.glob("*.py"))
        assert len(py_files) > 0, "No Python scripts found in scripts/"

        for py_file in py_files:
            try:
                with open(py_file, "r", encoding="utf-8") as f:
                    source = f.read()
                compile(source, filename=str(py_file), mode="exec")
            except SyntaxError as e:
                pytest.fail(f"Syntax error in {py_file.name}: {e}")


class TestProjectStructureSmoke:
    """Verify each project directory has expected structure."""

    @pytest.fixture(scope="class")
    def project_dirs(self):
        return [
            d for d in PROJECTS_DIR.iterdir()
            if d.is_dir() and not d.name.startswith(".")
        ]

    def test_projects_exist(self, project_dirs):
        """There should be at least 5 project directories."""
        assert len(project_dirs) >= 5, f"Only {len(project_dirs)} projects found"

    @pytest.mark.parametrize("project_name", [
        "apistatus-directory", "boilerplates-directory", "cheatsheets-directory",
        "datasets-directory", "jobs-directory", "opensource-directory",
        "prompts-directory", "quickutils-master", "tools-directory",
    ])
    def test_directory_project_has_database(self, project_name):
        """Each directory project should have data/database.json."""
        db_path = PROJECTS_DIR / project_name / "data" / "database.json"
        assert db_path.exists(), f"{project_name}/data/database.json missing"

    @pytest.mark.parametrize("project_name", [
        "apistatus-directory", "boilerplates-directory", "cheatsheets-directory",
        "datasets-directory", "jobs-directory", "opensource-directory",
        "prompts-directory", "quickutils-master", "tools-directory",
    ])
    def test_directory_project_has_templates(self, project_name):
        """Each directory project should have src/templates/ directory."""
        templates_dir = PROJECTS_DIR / project_name / "src" / "templates"
        assert templates_dir.exists(), f"{project_name}/src/templates missing"

    @pytest.mark.parametrize("project_name", [
        "apistatus-directory", "boilerplates-directory", "cheatsheets-directory",
        "datasets-directory", "jobs-directory", "opensource-directory",
        "prompts-directory", "quickutils-master", "tools-directory",
    ])
    def test_directory_project_database_valid(self, project_name):
        """Each database.json should be a valid non-empty JSON array."""
        db_path = PROJECTS_DIR / project_name / "data" / "database.json"
        if not db_path.exists():
            pytest.skip(f"database.json not found for {project_name}")
        data = json.loads(db_path.read_text(encoding="utf-8"))
        assert isinstance(data, list), f"{project_name}: database must be a list"
        assert len(data) > 0, f"{project_name}: database is empty"

    def test_boringwebsite_has_html(self):
        """boringwebsite should have index.html."""
        html = PROJECTS_DIR / "boringwebsite" / "src" / "index.html"
        assert html.exists(), "boringwebsite/src/index.html missing"


class TestDatabaseJsonSmoke:
    """Quick structural smoke tests for database.json files."""

    @pytest.fixture(scope="class")
    def all_db_sizes(self):
        """Get item counts across all databases."""
        sizes = {}
        for pd in PROJECTS_DIR.iterdir():
            db = pd / "data" / "database.json"
            if db.exists():
                data = json.loads(db.read_text(encoding="utf-8"))
                sizes[pd.name] = len(data) if isinstance(data, list) else 0
        return sizes

    def test_databases_are_non_trivial(self, all_db_sizes):
        """Databases should have a reasonable number of items."""
        for proj, count in all_db_sizes.items():
            assert count > 0, f"{proj}/database.json is empty"
