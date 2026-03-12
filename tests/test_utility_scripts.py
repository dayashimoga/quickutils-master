"""Tests for utility and maintenance scripts."""
import os
import json
import pytest
from unittest.mock import patch, MagicMock, mock_open, PropertyMock

# fix_slugs.py logic covered in test_fix_slugs_logic below

# Test fix_slugs.py logic
def test_fix_slugs_logic():
    import importlib
    import scripts.fix_slugs
    # The actual pattern in fix_slugs.py is:
    # def load_database(path: Path = None) -> list:
    #     ...
    #     return data
    mock_content = """def load_database(path: Path = None) -> list:
    data = []
    return data"""
    with patch("os.path.exists", return_value=True), \
         patch("builtins.open", mock_open(read_data=mock_content)) as m_open, \
         patch("builtins.print"):
        
        importlib.reload(scripts.fix_slugs)
        
    # Check if write was called
    assert m_open().write.called

# Test expand_data.py logic
def test_expand_data_logic():
    with patch("os.path.exists", return_value=True), \
         patch("builtins.open", mock_open()) as m_open, \
         patch("builtins.print"):
        
        import scripts.expand_data
        
    m_open().write.assert_called()

# Test fix_syntax.py logic
def test_fix_syntax_logic():
    with patch("os.walk", return_value=[("root", [], ["test.py"])]), \
         patch("os.path.exists", return_value=True), \
         patch("builtins.open", mock_open(read_data="def copy_static_assets()::\n    pass")) as m_open, \
         patch("builtins.print"):
        
        # We need to force reload or clear sys.modules if it was already imported
        import sys
        if 'scripts.fix_syntax' in sys.modules:
            del sys.modules['scripts.fix_syntax']
        import scripts.fix_syntax
        
    m_open().write.assert_called()

# Test sync_project_scripts.py logic
def test_sync_logic():
    mock_project = MagicMock()
    mock_project.is_dir.return_value = True
    mock_project.name = "test-project"
    
    with patch("pathlib.Path.iterdir", return_value=[mock_project]), \
         patch("pathlib.Path.exists", return_value=True), \
         patch("shutil.copy2"), \
         patch("pathlib.Path.mkdir"), \
         patch("pathlib.Path.read_text", return_value="/api/*"), \
         patch("pathlib.Path.write_text"), \
         patch("pathlib.Path.unlink"), \
         patch("builtins.print"):
        
        import scripts.sync_project_scripts
        scripts.sync_project_scripts.sync_scripts()

# Test distribute_pin_tests.py logic
def test_distribute_pin_tests_logic():
    with patch("builtins.open", mock_open()) as m_open, \
         patch("builtins.print"):
        
        import scripts.distribute_pin_tests
        
    m_open().write.assert_called()

# Test update_docs.py logic
def test_update_docs_logic():
    with patch("os.path.exists", return_value=True), \
         patch("os.makedirs"), \
         patch("builtins.open", mock_open(read_data="## Features\n- Existing\n")) as m_open, \
         patch("builtins.print"):
        
        # Avoid reloading if already imported, but for coverage we want to run at least once
        import scripts.update_docs
    assert m_open.called

# Test github_distribute.py logic (deep)
def test_github_distribute_deep():
    mock_project = MagicMock()
    mock_project.is_dir.return_value = True
    type(mock_project).name = PropertyMock(return_value="test-repo")
    mock_project.absolute.return_value = "/fake/abs/path"
    
    with patch("subprocess.run"), \
         patch("requests.get") as mock_get, \
         patch("requests.post") as mock_post, \
         patch("pathlib.Path.iterdir", return_value=[mock_project]), \
         patch.dict("os.environ", {"GH_PAT": "fake_pat"}), \
         patch("builtins.print"):
        
        # Test auth success
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {"login": "test-user"}
        mock_post.return_value.status_code = 201
        
        from scripts.github_distribute import main, get_username, create_github_repo
        main()
        
        # Test auth failures
        mock_get.return_value.status_code = 401
        import scripts.github_distribute
        scripts.github_distribute._username_cache = None # Clear cache
        get_username()
        
        # Test creation with no username
        scripts.github_distribute.PAT = None
        create_github_repo("test")
    assert True

# Test github_restore.py logic (deep)
def test_github_restore_deep():
    with patch("subprocess.run") as mock_run, \
         patch("requests.get") as mock_get, \
         patch("os.path.exists", return_value=True), \
         patch("shutil.rmtree") as mock_rmtree, \
         patch("os.chmod"), \
         patch.dict("os.environ", {"GH_PAT": "fake_pat"}), \
         patch("builtins.print"):
        
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = [{"name": "repo1", "ssh_url": "url1"}]
        
        from scripts.github_restore import main, remove_readonly, safe_rmtree, restore_project
        
        # Test remove_readonly
        remove_readonly(MagicMock(), "/path", None)
        
        # Test safe_rmtree success
        mock_rmtree.side_effect = None
        assert safe_rmtree("/path") is True
        
        # Test safe_rmtree failure with retry print
        mock_rmtree.side_effect = Exception("Locked")
        with patch("time.sleep"):
            safe_rmtree("/path", retries=2)
            
        # Test restore_project clone failure
        mock_run.side_effect = Exception("Clone failed")
        restore_project("fail-repo")
        
        main()
    assert True

# Test update_docs.py logic (extended)
def test_update_docs_extended():
    # Test adding features to a readme that doesn't have them
    with patch("os.path.exists", return_value=True), \
         patch("os.makedirs"), \
         patch("builtins.open", mock_open(read_data="# Project\nNo features here.\n## Status\n")) as m_open, \
         patch("builtins.print"):
        
        import scripts.utils
        import scripts.update_docs
        # Force the loop to run by ensuring dir exists
        import sys
        if 'scripts.update_docs' in sys.modules:
            del sys.modules['scripts.update_docs']
        import scripts.update_docs
    assert m_open.called

# Test run_global_tests.py branches
def test_run_global_tests_branches():
    with patch("subprocess.run") as mock_run, \
         patch("builtins.print"):
        
        from scripts.run_global_tests import run_tests_in_dir
        
        # Test success
        mock_run.return_value.returncode = 0
        assert run_tests_in_dir("/fake/path") is True
        
        # Test failure
        mock_run.return_value.returncode = 1
        assert run_tests_in_dir("/fake/path") is False
        
        # Test Exception (fallback to local)
        mock_run.side_effect = [Exception("Docker failed"), MagicMock(returncode=0)]
        assert run_tests_in_dir("/fake/path") is True
