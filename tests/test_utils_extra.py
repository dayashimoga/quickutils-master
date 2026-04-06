import importlib
import os
import json
from pathlib import Path
from unittest.mock import patch

def test_reload_utils_for_coverage(monkeypatch, tmp_path):
    # Set up fake mono-repo structure
    projects_dir = tmp_path / "projects"
    proj_dir = projects_dir / "myproj-directory"
    (proj_dir / "data").mkdir(parents=True)
    (proj_dir / "src" / "templates").mkdir(parents=True)
    
    # Fake config json
    bad_config = tmp_path / "project_config.json"
    bad_config.write_text("not json")
    
    # Now reload the module
    import scripts.utils
    with patch("scripts.utils.PROJECT_ROOT", tmp_path), \
         patch("scripts.utils.CONFIG_PATH", bad_config), \
         patch("scripts.utils.Path.cwd", return_value=proj_dir):
         
        monkeypatch.delenv("PROJECT_TYPE", raising=False)
        importlib.reload(scripts.utils)
        
        assert scripts.utils.PROJECT_TYPE == "myproj"
        assert scripts.utils.SITE_TYPE == "APIs"
        assert scripts.utils.DEFAULT_SITE_URL == "https://myproj.quickutils.top"
        
        # Now trigger missing templates dir
        (proj_dir / "src" / "templates").rmdir()
        importlib.reload(scripts.utils)

def test_reload_utils_not_monorepo(monkeypatch, tmp_path):
    import scripts.utils
    with patch("scripts.utils.PROJECT_ROOT", tmp_path), \
         patch("scripts.utils._is_monorepo", False):
        # ensure directories don't exist to trigger warnings
        importlib.reload(scripts.utils)

def test_truncate_no_space():
    from scripts.utils import truncate
    res = truncate("longstringwithoutspace"*10, 10)
    assert res == "longstr..."
    
def test_project_root_detection(monkeypatch, tmp_path):
    import scripts.utils
    (tmp_path / "data").mkdir(parents=True)
    (tmp_path / "data" / "database.json").touch()
    
    with patch("scripts.utils.PROJECT_ROOT", tmp_path):
        monkeypatch.delenv("PROJECT_TYPE", raising=False)
        importlib.reload(scripts.utils)
        assert scripts.utils.PROJECT_TYPE == tmp_path.name
