import os
import json
import subprocess
from pathlib import Path
from unittest.mock import patch, MagicMock

from scripts.github_distribute import (
    get_username,
    get_projects,
    create_github_repo,
    sync_repo,
    main
)

@patch("scripts.github_distribute.requests.get")
@patch("scripts.github_distribute.PAT", "fake_token")
def test_get_username_api_success(mock_get, monkeypatch):
    monkeypatch.delenv("GITHUB_ACTOR", raising=False)
    monkeypatch.delenv("OWNER", raising=False)
    # reset cache
    import scripts.github_distribute
    scripts.github_distribute._username_cache = None
    
    # Needs a 200 OK response
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"login": "api_user"}
    mock_get.return_value = mock_resp
    
    user = get_username()
    assert user == "api_user"

@patch("scripts.github_distribute.PAT", None)
def test_get_username_no_pat(monkeypatch):
    monkeypatch.setenv("GITHUB_ACTOR", "ci_user")
    import scripts.github_distribute
    scripts.github_distribute._username_cache = None
    
    user = get_username()
    assert user == "ci_user"

def test_get_projects(tmp_path):
    with patch("scripts.github_distribute.Path") as mock_path:
        base_path = tmp_path
        mock_path.return_value.parent.parent = base_path
        
        projects_dir = base_path / "projects"
        projects_dir.mkdir()
        (projects_dir / "valid-proj").mkdir()
        (projects_dir / ".hidden").mkdir()
        (projects_dir / "quickutils-directory").mkdir()
        (projects_dir / "file.txt").touch()
        
        projs = get_projects()
        assert "valid-proj" in projs
        assert ".hidden" not in projs
        assert "quickutils-directory" not in projs

@patch("scripts.github_distribute.PAT", None)
@patch("scripts.github_distribute.get_username", return_value="testuser")
def test_create_repo_no_pat(mock_get_un):
    url = create_github_repo("myrepo")
    assert url == "https://github.com/testuser/myrepo.git"

@patch("scripts.github_distribute.PAT", "fake_pat")
@patch("scripts.github_distribute.get_username", return_value="testuser")
@patch("scripts.github_distribute.requests.post")
def test_create_repo_with_pat(mock_post, mock_get_un):
    mock_resp = MagicMock()
    mock_resp.status_code = 201
    mock_post.return_value = mock_resp
    
    url = create_github_repo("myrepo")
    assert url == "https://github.com/testuser/myrepo.git"

@patch("scripts.github_distribute.PAT", "fake_pat")
@patch("scripts.github_distribute.get_username", return_value="testuser")
@patch("scripts.github_distribute.requests.post")
def test_create_repo_fail(mock_post, mock_get_un):
    mock_resp = MagicMock()
    mock_resp.status_code = 403
    mock_post.return_value = mock_resp
    
    url = create_github_repo("myrepo")
    assert url is None

@patch("scripts.github_distribute.subprocess.run")
def test_sync_repo(mock_run, tmp_path):
    local_path = tmp_path / "local"
    local_path.mkdir()
    (local_path / "test.txt").touch()
    
    mock_run.return_value = MagicMock(returncode=0)
    sync_repo(str(local_path), "https://github.com/test/test.git")
    
    # Should call clone, add, commit, push
    assert mock_run.call_count >= 3

@patch("scripts.github_distribute.get_projects")
@patch("scripts.github_distribute.create_github_repo")
@patch("scripts.github_distribute.sync_repo")
def test_main(mock_sync, mock_create, mock_get_proj):
    mock_get_proj.return_value = {"proj1": "path/proj1"}
    mock_create.return_value = "https://url"
    
    main()
    mock_create.assert_called_once_with("proj1")
    mock_sync.assert_called_once_with("path/proj1", "https://url")
