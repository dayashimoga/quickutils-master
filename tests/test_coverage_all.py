import sys
from pathlib import Path
from unittest.mock import patch, MagicMock, mock_open

@patch("subprocess.run")
def test_build_all_local(mock_run):
    import scripts.build_all_local
    mock_p = MagicMock()
    mock_p.name = "test-directory"
    (mock_p / "data" / "database.json").exists.return_value = True
    
    with patch("scripts.build_all_local.get_projects", return_value=[mock_p]):
        scripts.build_all_local.main()
    assert mock_run.called

@patch("shutil.rmtree")
@patch("os.remove")
def test_cleanup(mock_remove, mock_rmtree):
    import scripts.cleanup
    import importlib
    with patch("glob.glob") as mock_glob:
        mock_glob.return_value = ["fake_file.txt"]
        mock_d = MagicMock()
        mock_d.is_file.return_value = False
        with patch("os.path.exists", side_effect=lambda p: True):
            importlib.reload(scripts.cleanup)

@patch("scripts.indexnow_submit.submit_to_indexnow")
@patch("scripts.indexnow_submit.parse_sitemap")
@patch("os.path.exists")
def test_indexnow_submit(mock_exists, mock_parse, mock_submit):
    import scripts.indexnow_submit
    mock_exists.return_value = True
    mock_parse.return_value = ["http://test.com/1"]
    mock_submit.return_value = True
    
    with patch("sys.argv", ["indexnow_submit.py", "test.com", "dist", "key"]):
        scripts.indexnow_submit.main()
    
    # Also test the function directly with correct signature (3 args)
    with patch("urllib.request.urlopen") as mock_urlopen:
        mock_res = MagicMock()
        mock_res.status = 200
        mock_res.__enter__.return_value = mock_res
        mock_urlopen.return_value = mock_res
        scripts.indexnow_submit.submit_to_indexnow("test.com", "key", ["http://test.com/1"])

def test_fix_slugs():
    import importlib
    import scripts.fix_slugs
    with patch("os.path.exists", return_value=True), \
         patch("builtins.open", MagicMock()), \
         patch("re.search", return_value=None):
        importlib.reload(scripts.fix_slugs)

@patch("scripts.verify_links_local.verify_links_in_dist")
def test_verify_links_coverage(mock_verify):
    import scripts.verify_links_local
    mock_verify.return_value = (True, [])
    with patch("pathlib.Path.iterdir") as mock_iter:
        mock_p = MagicMock()
        mock_p.is_dir.return_value = True
        mock_p.name = "test-directory"
        mock_iter.return_value = [mock_p]
        with patch("sys.exit") as mock_exit:
            scripts.verify_links_local.main()
            mock_exit.assert_not_called()

def test_test_orchestrator():
    import scripts.test_orchestrator
    import json
    mock_cov = json.dumps({"totals": {"percent_covered": 95.0}})
    
    with patch("pathlib.Path.exists", return_value=True), \
         patch("pathlib.Path.iterdir", return_value=[]), \
         patch("builtins.open", mock_open(read_data=mock_cov)), \
         patch("subprocess.run") as mock_subrun:
        
        mock_subrun.return_value.returncode = 0
        mock_subrun.return_value.stdout = "PASSED"
        
        with patch("sys.exit") as mock_exit:
            scripts.test_orchestrator.main()
            mock_exit.assert_not_called()
