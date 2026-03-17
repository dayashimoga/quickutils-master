import os
import shutil
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock

from scripts.cleanup import get_directories, patterns, dirs_to_remove as cleanup_dirs
from scripts.fix_slugs import update_utils_py

@pytest.fixture
def temp_repo(tmp_path):
    """Create a mock repository structure for testing."""
    repo = tmp_path / "repo"
    repo.mkdir()
    
    # Create some dummy files to clean up
    (repo / "test_file.txt").write_text("test")
    (repo / "final_test_report.txt").write_text("report")
    (repo / "error.log").write_text("error")
    
    # Create a dummy .pytest_cache
    cache_dir = repo / ".pytest_cache"
    cache_dir.mkdir()
    (cache_dir / "v" / "cache").mkdir(parents=True)
    
    # Create a mock projects structure
    projects = repo / "projects"
    projects.mkdir()
    p1 = projects / "test-project"
    p1.mkdir()
    (p1 / "scripts").mkdir()
    
    # Mock utils.py for fix_slugs
    utils_py = p1 / "scripts" / "utils.py"
    utils_py.write_text("""
def load_database(path: Path = None) -> list:
    if path is None:
        path = DATA_DIR / "database.json"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("database.json must contain a JSON array")
    return data
""")
    
    return repo

def test_cleanup_logic(temp_repo):
    """Test the logic used in cleanup.py (simulated)."""
    # Since cleanup.py runs on import/execution, we test the logic patterns
    # rather than the script directly to avoid cleaning the actual project.
    
    # 1. Test pattern matching
    assert "test_*.txt" in patterns
    assert "final_test_report.txt" in patterns
    
    # 2. Verify directory removal logic
    assert ".pytest_cache" in cleanup_dirs
    
    # 3. Verify get_directories returns a list
    dirs = get_directories()
    assert isinstance(dirs, list)
    assert len(dirs) > 0

def test_fix_slugs_replacement(temp_repo):
    """Test that fix_slugs correctly replaces the load_database function."""
    utils_path = temp_repo / "projects" / "test-project" / "scripts" / "utils.py"
    
    update_utils_py(str(utils_path))
    
    content = utils_path.read_text()
    assert "Inject slugs and titles if missing" in content
    assert "item[\"slug\"] = slugify(str(item[\"id\"]))" in content
    assert "return data" in content

def test_utils_path_resolution():
    """Test that utils.py paths are correctly resolved in different environments."""
    from scripts.utils import PROJECT_ROOT, DATA_DIR, SRC_DIR
    
    assert PROJECT_ROOT.exists()
    # DATA_DIR/SRC_DIR might be relative paths from env or absolute;
    # just verify they are Path objects and PROJECT_ROOT is valid
    assert isinstance(DATA_DIR, Path)
    assert isinstance(SRC_DIR, Path)

def test_generate_pins_logic():
    """Test the logic in generate_pins.py."""
    import scripts.generate_pins as gen_pins
    assert gen_pins.generate_pinterest_images() is True

def test_indexnow_parse_sitemap(tmp_path):
    """Test parsing sitemap in indexnow_submit.py."""
    from scripts.indexnow_submit import parse_sitemap
    sitemap = tmp_path / "sitemap.xml"
    sitemap.write_text("""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://test.com/1</loc></url>
  <url><loc>https://test.com/2</loc></url>
</urlset>""")
    urls = parse_sitemap(str(sitemap))
    assert urls == ["https://test.com/1", "https://test.com/2"]

@patch("scripts.indexnow_submit.urlopen")
def test_indexnow_submit_success(mock_urlopen):
    """Test successful submission in indexnow_submit.py."""
    from scripts.indexnow_submit import submit_to_indexnow
    
    mock_response = MagicMock()
    mock_response.status = 200
    mock_urlopen.return_value.__enter__.return_value = mock_response
    
    result = submit_to_indexnow("test.com", "key123", ["https://test.com/1"])
    assert result is True

@patch("scripts.indexnow_submit.urlopen")
def test_indexnow_submit_failure(mock_urlopen):
    """Test failed submission in indexnow_submit.py."""
    from scripts.indexnow_submit import submit_to_indexnow
    
    # Mock a 403 Forbidden
    mock_response = MagicMock()
    mock_response.status = 403
    mock_urlopen.return_value.__enter__.return_value = mock_response
    
    result = submit_to_indexnow("test.com", "key123", ["https://test.com/1"])
    assert result is False
