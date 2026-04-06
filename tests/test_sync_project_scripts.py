import os
from pathlib import Path
from unittest.mock import patch, MagicMock

from scripts.sync_project_scripts import sync_scripts

@patch("scripts.sync_project_scripts.PROJECTS_DIR")
def test_sync_scripts_no_projects_dir(mock_projects_dir):
    mock_projects_dir.exists.return_value = False
    with patch("builtins.print") as mock_print:
        sync_scripts()
        mock_print.assert_any_call(f"  ✗ Projects directory not found at {mock_projects_dir}")

@patch("scripts.sync_project_scripts.PROJECTS_DIR")
def test_sync_scripts_no_master_dir(mock_projects_dir):
    mock_projects_dir.exists.return_value = True
    master_dir = MagicMock()
    master_dir.exists.return_value = False
    
    with patch("scripts.sync_project_scripts.Path.__truediv__", return_value=master_dir):
        # We also need to mock '/' operator on PROJECTS_DIR
        mock_projects_dir.__truediv__.return_value = master_dir
        with patch("builtins.print") as mock_print:
            sync_scripts()
            mock_print.assert_any_call(f"  ✗ Master project not found at {master_dir}")

def test_sync_scripts_success(tmp_path):
    # Setup fake structure
    projects_dir = tmp_path / "projects"
    projects_dir.mkdir()
    
    master_dir = projects_dir / "quickutils-master"
    master_dir.mkdir()
    
    # Create a project
    proj_dir = projects_dir / "test-directory"
    proj_dir.mkdir()
    
    # Hidden project (should skip)
    (projects_dir / ".hidden").mkdir()
    
    # Create fake files to be synced
    root_src = tmp_path
    
    # Fake MASTER_FILES subset
    master_files = [
        "scripts/fake_script.py", 
        "project_config.json",
        "src/templates/base.html"
    ]
    
    (root_src / "scripts").mkdir(parents=True, exist_ok=True)
    (root_src / "scripts/fake_script.py").write_text("print('test')")
    
    (root_src / "project_config.json").write_text("{}")
    
    (master_dir / "src" / "templates").mkdir(parents=True, exist_ok=True)
    (master_dir / "src/templates/base.html").write_text("html")
    
    with patch("scripts.sync_project_scripts.PROJECTS_DIR", projects_dir), \
         patch("scripts.sync_project_scripts.ROOT_DIR", root_src), \
         patch("scripts.sync_project_scripts.MASTER_FILES", master_files):
        
        sync_scripts()
        
        # Verify sync
        assert (proj_dir / "scripts" / "fake_script.py").exists()
        assert (proj_dir / "project_config.json").exists()
        assert (proj_dir / "src" / "templates" / "base.html").exists()

def test_sync_scripts_dashboard_skip(tmp_path):
    projects_dir = tmp_path / "projects"
    projects_dir.mkdir()
    master_dir = projects_dir / "quickutils-master"
    master_dir.mkdir()
    
    dash_dir = projects_dir / "market-digest"
    dash_dir.mkdir()
    
    root_src = tmp_path
    master_files = ["src/templates/base.html"]
    
    (master_dir / "src" / "templates").mkdir(parents=True, exist_ok=True)
    (master_dir / "src/templates/base.html").write_text("html")
    
    with patch("scripts.sync_project_scripts.PROJECTS_DIR", projects_dir), \
         patch("scripts.sync_project_scripts.ROOT_DIR", root_src), \
         patch("scripts.sync_project_scripts.MASTER_FILES", master_files):
        
        sync_scripts()
        
        # Should be skipped for market-digest
        assert not (dash_dir / "src" / "templates" / "base.html").exists()

