from unittest.mock import patch, MagicMock
from pathlib import Path
from scripts.build_all_local import main

@patch("scripts.build_all_local.run_cmd")
@patch("scripts.build_all_local.get_projects")
def test_build_all_main(mock_get, mock_run):
    # Mock projects
    proj1 = MagicMock()
    proj1.name = "test-directory"
    
    # Mock files
    (proj1 / "data" / "database.json").exists.return_value = True
    
    mock_get.return_value = [proj1]
    
    main()
    assert mock_run.call_count >= 2 # build and sitemap
