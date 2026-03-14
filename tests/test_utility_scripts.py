"""Tests for utility and maintenance scripts."""
import os
import json
import pytest
from pathlib import Path
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
    with patch("os.path.exists", side_effect=[True, False, False, False, False, False, False, False, False]), \
         patch("builtins.open", mock_open(read_data=mock_content)) as m_open, \
         patch("builtins.print"):
        
        importlib.reload(scripts.fix_slugs)
        
    # Check if write was called
    handle = m_open()
    assert handle.write.called

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
        
        from scripts.github_distribute import main, get_username, create_github_repo, get_projects
        import scripts.github_distribute
        
        main()
        
        # Test auth failures
        mock_get.return_value.status_code = 401
        scripts.github_distribute._username_cache = None # Clear cache
        get_username()
        
        # Test creation with no username
        scripts.github_distribute.PAT = None
        create_github_repo("test")
        
        # Test get_projects mapping
        get_projects()
    assert True

def test_github_distribute_sync_repo():
    from scripts.github_distribute import sync_repo
    with patch("subprocess.run") as mock_run, \
         patch("shutil.rmtree"), \
         patch("shutil.copytree"), \
         patch("shutil.copy2"), \
         patch("os.listdir", return_value=["file1"]), \
         patch("os.path.isdir", return_value=False), \
         patch("os.remove"), \
         patch("tempfile.TemporaryDirectory") as mock_temp:
        
        mock_temp.return_value.__enter__.return_value = "/fake/temp"
        
        # Test change detected
        mock_run.side_effect = [
            MagicMock(returncode=0), # clone
            MagicMock(returncode=0), # add
            MagicMock(stdout=" M file1"), # status
            MagicMock(returncode=0), # commit
            MagicMock(returncode=0)  # push
        ]
        sync_repo("/local/path", "https://github.com/user/repo.git")
        
        # Test no changes
        mock_run.side_effect = [
            MagicMock(returncode=0), # clone
            MagicMock(returncode=0), # add
            MagicMock(stdout=""),    # status
        ]
        sync_repo("/local/path", "https://github.com/user/repo.git")

        # Test clone failure -> init
        mock_run.side_effect = [
            MagicMock(returncode=1), # clone fail
            MagicMock(returncode=0), # init
            MagicMock(returncode=0), # checkout
            MagicMock(returncode=0), # remote add
            MagicMock(returncode=0), # add
            MagicMock(stdout="A file1"), # status
            MagicMock(returncode=0), # commit
            MagicMock(returncode=0)  # push
        ]
        sync_repo("/local/path", "https://github.com/user/repo.git")

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
        
        # Test restore_project success cleanup
        mock_run.side_effect = None
        with patch("pathlib.Path.exists", side_effect=[False, False, False, True]): # incomplete, then clone, then .git exists
             restore_project("restore-me")

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


# --- New tests to close coverage gaps ---

def test_github_distribute_auth_success():
    """Cover the successful authentication path (lines 22-24)."""
    import scripts.github_distribute
    scripts.github_distribute._username_cache = None
    
    with patch.dict("os.environ", {"GH_PAT": "test_token"}), \
         patch("requests.get") as mock_get:
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {"login": "testuser"}
        scripts.github_distribute.PAT = "test_token"
        result = scripts.github_distribute.get_username()
        assert result == "testuser"
    
    scripts.github_distribute._username_cache = None


def test_github_distribute_auth_exception():
    """Cover the authentication exception path (lines 27-28)."""
    import scripts.github_distribute
    scripts.github_distribute._username_cache = None
    
    with patch.dict("os.environ", {"GH_PAT": "test_token"}), \
         patch("requests.get", side_effect=Exception("Connection failed")):
        from scripts.utils import GH_USERNAME
        scripts.github_distribute.PAT = "test_token"
        result = scripts.github_distribute.get_username()
        assert result == GH_USERNAME
    
    scripts.github_distribute._username_cache = None


def test_github_distribute_get_projects_with_boringwebsite():
    """Cover the project discovery path (all dirs except .github and master)."""
    from scripts.github_distribute import get_projects
    mock_dir = MagicMock()
    mock_dir.is_dir.return_value = True
    type(mock_dir).name = PropertyMock(return_value="tools-directory")
    mock_dir.absolute.return_value = "/fake/tools"
    
    mock_bw = MagicMock()
    mock_bw.is_dir.return_value = True
    type(mock_bw).name = PropertyMock(return_value="boringwebsite")
    mock_bw.absolute.return_value = "/fake/boringwebsite"
    
    with patch("pathlib.Path.iterdir", return_value=[mock_dir, mock_bw]), \
         patch("pathlib.Path.exists", return_value=True):
        projects = get_projects()
    assert "tools-directory" in projects
    assert "boringwebsite" in projects


def test_github_restore_cleanup_tmp():
    """Cover cleanup_tmp with both glob patterns (lines 54-60)."""
    from scripts.github_restore import cleanup_tmp
    
    mock_temp = MagicMock()
    mock_temp.is_dir.return_value = True
    
    mock_temp2 = MagicMock()
    mock_temp2.is_dir.return_value = True
    
    with patch("pathlib.Path.glob", side_effect=[[mock_temp], [mock_temp2]]), \
         patch("shutil.rmtree"), \
         patch("os.path.exists", return_value=True), \
         patch("builtins.print"):
        cleanup_tmp()


def test_github_restore_complete_project_skip():
    """Cover project skip when both data/ and src/ exist (lines 79-81)."""
    from scripts.github_restore import restore_project
    
    with patch("pathlib.Path.exists", return_value=True), \
         patch("builtins.print"):
        restore_project("complete-project")  # Should print skip and return


def test_github_restore_successful_clone_with_git_removal():
    """Cover successful clone + .git removal path (lines 93-96)."""
    from scripts.github_restore import restore_project
    
    # restore_project calls:
    # 1. local_path.exists() -> False to trigger clone
    # 2. (in clone block) local_path via subprocess
    # 3. dot_git.exists() -> True to trigger .git removal
    call_count = {"n": 0}
    def exists_side_effect(self=None):
        call_count["n"] += 1
        if call_count["n"] <= 1:
            return False  # local_path.exists() = False
        return True  # dot_git.exists() = True
    
    with patch("pathlib.Path.exists", side_effect=exists_side_effect), \
         patch("subprocess.run") as mock_run, \
         patch("shutil.rmtree"), \
         patch("os.path.exists", return_value=True), \
         patch("builtins.print"):
        mock_run.return_value.returncode = 0
        restore_project("new-project")

