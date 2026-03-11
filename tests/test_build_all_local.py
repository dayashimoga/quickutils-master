from unittest.mock import patch, MagicMock
from pathlib import Path
from scripts.build_all_local import main

@patch("scripts.build_all_local.run_cmd")
@patch("scripts.build_all_local.Path")
def test_build_all_main(mock_path, mock_run):
    # Mock directory structure
    mock_root = MagicMock()
    mock_path.return_value = mock_root
    
    proj1 = MagicMock()
    proj1.name = "test-directory"
    proj1.is_dir.return_value = True
    
    # Mock files
    (proj1 / "data" / "database.json").exists.return_value = True
    (proj1 / "src").__str__.return_value = "src"
    (proj1 / "data").__str__.return_value = "data"
    (proj1 / "dist").__str__.return_value = "dist"
    
    mock_root.iterdir.return_value = [proj1]
    
    main()
    assert mock_run.call_count >= 2 # build and sitemap
