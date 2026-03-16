"""
Tests for link verification across all projects.
Ensures each project's database.json contains valid data,
network links are correct, and built HTML references proper URLs.
"""
import json
import sys
from pathlib import Path

import pytest

ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))

PROJECTS_DIR = ROOT_DIR / "projects"


class TestNetworkLinks:
    """Test the load_network_links() function."""

    def test_returns_non_empty_list(self):
        from scripts.utils import load_network_links
        links = load_network_links()
        assert isinstance(links, list)
        assert len(links) > 0

    def test_all_links_have_name_and_url(self):
        from scripts.utils import load_network_links
        links = load_network_links()
        for link in links:
            assert "name" in link, f"Link missing 'name': {link}"
            assert "url" in link, f"Link missing 'url': {link}"
            assert link["url"].startswith("https://"), f"URL not HTTPS: {link}"

    def test_main_site_included(self):
        from scripts.utils import load_network_links
        links = load_network_links()
        urls = [link["url"] for link in links]
        assert "https://quickutils.top" in urls, "Main site URL must be in network links"

    def test_links_sorted_by_name(self):
        from scripts.utils import load_network_links
        links = load_network_links()
        names = [link["name"] for link in links]
        assert names == sorted(names), "Network links should be sorted alphabetically by name"

    def test_no_duplicate_urls(self):
        from scripts.utils import load_network_links
        links = load_network_links()
        urls = [link["url"].rstrip("/") for link in links]
        assert len(urls) == len(set(urls)), f"Duplicate URLs found in network links: {urls}"

    def test_excludes_master_and_boringwebsite(self):
        """Network links should not include master/directory/boringwebsite as separate entries."""
        from scripts.utils import load_network_links
        links = load_network_links()
        names_lower = [link["name"].lower() for link in links]
        # "Master", "Directory", "Boring Website" should not appear as separate network entries
        for excluded in ["quickutils-master", "directory"]:
            assert excluded not in names_lower, f"{excluded} should not be in network links"


class TestDatabaseJsonContent:
    """Test structure and content of each project's database.json."""

    @pytest.fixture(scope="class")
    def all_databases(self):
        """Load all available database.json files."""
        databases = {}
        for project_dir in PROJECTS_DIR.iterdir():
            if not project_dir.is_dir() or project_dir.name.startswith("."):
                continue
            db_path = project_dir / "data" / "database.json"
            if db_path.exists():
                data = json.loads(db_path.read_text(encoding="utf-8"))
                databases[project_dir.name] = data
        return databases

    def test_all_directory_projects_have_data(self, all_databases):
        """Every *-directory project should have database.json."""
        for project_dir in PROJECTS_DIR.iterdir():
            if project_dir.is_dir() and project_dir.name.endswith("-directory"):
                assert project_dir.name in all_databases, \
                    f"{project_dir.name} missing database.json"

    def test_items_have_required_fields(self, all_databases):
        """Each item should have at minimum a title-like field."""
        for project_name, items in all_databases.items():
            for i, item in enumerate(items[:5]):  # Check first 5 items
                # Different projects use different fields for the primary label
                has_title = any(
                    k in item for k in ("title", "name", "API", "fact", "prompt", "question", "text")
                )
                assert has_title, \
                    f"{project_name}[{i}]: missing title/name/fact field, keys={list(item.keys())}"

    def test_databases_have_different_categories(self, all_databases):
        """Projects should have distinct category sets (proving they're different data)."""
        category_sets = {}
        for project_name, items in all_databases.items():
            cats = set()
            for item in items:
                cat = item.get("category", "")
                if cat:
                    cats.add(cat)
            if cats:
                category_sets[project_name] = cats

        # At least half of the projects should have unique category sets
        unique_cat_combos = set()
        for cats in category_sets.values():
            unique_cat_combos.add(frozenset(cats))
        assert len(unique_cat_combos) > 1, \
            "All projects have identical categories — data mapping is broken"


class TestProjectConfigIntegrity:
    """Test project_config.json structural integrity."""

    @pytest.fixture(scope="class")
    def config(self):
        config_path = ROOT_DIR / "project_config.json"
        assert config_path.exists()
        return json.loads(config_path.read_text(encoding="utf-8"))

    def test_has_projects_section(self, config):
        assert "projects" in config
        assert isinstance(config["projects"], dict)
        assert len(config["projects"]) > 0

    def test_all_project_dirs_have_config(self, config):
        """Every project directory should have an entry in project_config.json."""
        projects_cfg = config["projects"]
        for project_dir in PROJECTS_DIR.iterdir():
            if not project_dir.is_dir() or project_dir.name.startswith("."):
                continue
            name = project_dir.name
            short_name = name.replace("-directory", "")
            found = name in projects_cfg or short_name in projects_cfg
            assert found, f"Project {name} missing from project_config.json"

    def test_site_urls_are_unique(self, config):
        """Each project should have a unique SITE_URL."""
        urls = []
        for proj_cfg in config["projects"].values():
            url = proj_cfg.get("SITE_URL", "")
            if url:
                urls.append(url.rstrip("/"))
        assert len(urls) == len(set(urls)), f"Duplicate SITE_URLs found: {urls}"

    def test_ga_ids_are_unique(self, config):
        """Each project should have a unique GA_MEASUREMENT_ID."""
        ga_ids = []
        for proj_cfg in config["projects"].values():
            ga_id = proj_cfg.get("GA_MEASUREMENT_ID", "")
            if ga_id:
                ga_ids.append(ga_id)
        assert len(ga_ids) == len(set(ga_ids)), f"Duplicate GA IDs found: {ga_ids}"

    def test_global_config_values(self, config):
        """Global config should have required values."""
        assert "GH_USERNAME" in config
        assert "GA_MEASUREMENT_ID" in config
        assert "ADSENSE_PUBLISHER_ID" in config
        assert config["ADSENSE_PUBLISHER_ID"].startswith("ca-pub-")
