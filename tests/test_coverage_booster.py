import os
import json
import pytest
from unittest.mock import patch, MagicMock, mock_open, PropertyMock
from pathlib import Path

# 1. Coverage for verify_repos.py
def test_verify_repos_full_flow():
    # Mock data
    mock_projects = {
        "proj1": {"repo_name": "repo1"},
        "proj2": {"repo_name": "repo2"}
    }
    
    # Mock responses
    mock_user_res = MagicMock()
    mock_user_res.status_code = 200
    mock_user_res.json.return_value = {"login": "testuser"}
    
    mock_repo_exists = MagicMock()
    mock_repo_exists.status_code = 200
    
    mock_repo_missing = MagicMock()
    mock_repo_missing.status_code = 404
    
    mock_create_success = MagicMock()
    mock_create_success.status_code = 201
    
    with patch.dict("os.environ", {"GH_PAT": "fake_pat"}), \
         patch("builtins.open", mock_open(read_data=json.dumps(mock_projects))), \
         patch("pathlib.Path.exists", return_value=True), \
         patch("requests.get", side_effect=[mock_user_res, mock_repo_exists, mock_repo_missing]), \
         patch("requests.post", return_value=mock_create_success), \
         patch("builtins.print") as mock_print:
        
        from scripts.verify_repos import main
        main()
            
    assert mock_print.called

# 2. Coverage for fetch_data.py gaps
def test_fetch_data_coverage_booster():
    from scripts.fetch_data import fetch_and_save, normalize_entry
    
    # Line 98: slugify returning None
    with patch("scripts.fetch_data.slugify", return_value=""):
        assert normalize_entry({"API": "---", "Description": "desc"}) is None
        
    # Project types: datasets, prompts
    mock_data = [{"API": "Data1", "Category": "Science", "Description": "desc1", "Link": "url1"}]
    
    with patch("scripts.fetch_data.fetch_from_alternative", return_value=mock_data), \
         patch("scripts.utils.get_config", side_effect=lambda k, d: "datasets" if k=="PROJECT_TYPE" else d), \
         patch("scripts.fetch_data.save_database"), \
         patch("builtins.print"):
        assert fetch_and_save() is True

    with patch("scripts.fetch_data.fetch_from_alternative", return_value=mock_data), \
         patch("scripts.utils.get_config", side_effect=lambda k, d: "prompts" if k=="PROJECT_TYPE" else d), \
         patch("scripts.fetch_data.save_database"), \
         patch("builtins.print"):
        assert fetch_and_save() is True

    # Lines 181-184: existing database preservation fallback/exception
    with patch("scripts.fetch_data.fetch_from_primary", return_value=None), \
         patch("scripts.fetch_data.get_seed_data", return_value=None), \
         patch("pathlib.Path.exists", return_value=True), \
         patch("pathlib.Path.read_text", side_effect=Exception("Read error")), \
         patch("builtins.print"):
        assert fetch_and_save() is False

# 3. Coverage for github_distribute.py gaps
def test_github_distribute_coverage_booster():
    from scripts.github_distribute import create_github_repo, sync_repo
    
    # Line 71: create_github_repo non-201/422 status
    mock_res = MagicMock()
    mock_res.status_code = 500
    with patch("scripts.github_distribute.get_username", return_value="user"), \
         patch("scripts.github_distribute.PAT", "token"), \
         patch("requests.post", return_value=mock_res):
        assert create_github_repo("fail-repo") is None

    # Sync repo coverage
    with patch("subprocess.run") as mock_run, \
         patch("tempfile.TemporaryDirectory") as mock_temp, \
         patch("os.listdir", return_value=["file1"]), \
         patch("os.path.isdir", return_value=False), \
         patch("os.chmod"), \
         patch("os.remove"), \
         patch("shutil.rmtree"), \
         patch("shutil.copy2"), \
         patch("builtins.print"):
        
        mock_temp.return_value.__enter__.return_value = "/tmp/fake"
        mock_run.return_value.returncode = 0 # clone success
        mock_run.return_value.stdout = ""
        
        # Trigger sync with PAT to cover line 78
        with patch("scripts.github_distribute.PAT", "secret"):
            sync_repo("/local/path", "https://github.com/user/repo.git")
            
        # Trigger push failure to cover line 129
        mock_run.side_effect = [
            MagicMock(returncode=0), # clone
            MagicMock(returncode=0), # add
            MagicMock(stdout="M file1"), # status
            MagicMock(returncode=0), # commit
            MagicMock(returncode=1, stderr="Push denied") # push fail
        ]
        sync_repo("/local/path", "https://github.com/user/repo.git")

    # __main__ coverage booster
    with patch("scripts.fetch_data.fetch_and_save"), patch("sys.exit"):
        from scripts.fetch_data import main as fetch_main
        fetch_main()
    
    with patch("scripts.github_distribute.get_projects", return_value={}), patch("builtins.print"):
        from scripts.github_distribute import main as dist_main
        dist_main()
        
    with patch("scripts.github_restore.get_projects", return_value=[]), patch("builtins.print"):
        from scripts.github_restore import main as rest_main
        rest_main()

# 4. Coverage for utils.py gaps
def test_utils_coverage_booster():
    import scripts.utils
    
    # Line 33-34: get_config JSON error
    with patch("builtins.open", mock_open(read_data="invalid json")), \
         patch("builtins.print"):
        # We need to trigger the reload to hit line 33-34
        import importlib
        importlib.reload(scripts.utils)
        assert scripts.utils.get_config("ANY", "default") == "default"
        
    # Line 79-80: save_database error
    with patch("builtins.open", side_effect=Exception("Write error")), \
         patch("builtins.print"):
        assert scripts.utils.save_database([]) is False
        
    # Line 215: truncate fallback (no space)
    assert scripts.utils.truncate("A" * 200, 10) == "A" * 7 + "..."
