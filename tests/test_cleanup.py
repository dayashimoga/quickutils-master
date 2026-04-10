import os
from unittest.mock import patch, MagicMock
from scripts.cleanup import get_directories, clean_directory, main

def test_get_directories():
    dirs = get_directories()
    assert len(dirs) > 0
    assert any("projects" in d for d in dirs)

@patch("scripts.cleanup.os.path.exists")
def test_clean_directory_not_exists(mock_exists):
    mock_exists.return_value = False
    f, d = clean_directory("nonexistent")
    assert f == 0
    assert d == 0

@patch("scripts.cleanup.os.path.exists")
@patch("scripts.cleanup.glob.glob")
@patch("scripts.cleanup.os.remove")
@patch("scripts.cleanup.shutil.rmtree")
def test_clean_directory_success(mock_rmtree, mock_remove, mock_glob, mock_exists):
    mock_exists.return_value = True
    
    # Return one fake file for every glob call
    def fake_glob(path):
        return [path + "_fake_match"]
        
    mock_glob.side_effect = fake_glob
    
    f, d = clean_directory("test_dir")
    
    assert f > 0
    assert d > 0
    assert mock_remove.called
    assert mock_rmtree.called

@patch("scripts.cleanup.os.path.exists")
@patch("scripts.cleanup.glob.glob")
@patch("scripts.cleanup.os.remove")
@patch("scripts.cleanup.shutil.rmtree")
def test_clean_directory_errors(mock_rmtree, mock_remove, mock_glob, mock_exists):
    mock_exists.return_value = True
    
    def fake_glob(path):
        return [path + "_fake_match"]
        
    mock_glob.side_effect = fake_glob
    mock_remove.side_effect = Exception("test file error")
    mock_rmtree.side_effect = Exception("test dir error")
    
    f, d = clean_directory("test_dir")
    
    assert f == 0
    assert d == 0
    assert mock_remove.called
    assert mock_rmtree.called

@patch("scripts.cleanup.get_directories")
@patch("scripts.cleanup.clean_directory")
def test_main(mock_clean, mock_get):
    mock_get.return_value = ["dir1", "dir2"]
    mock_clean.side_effect = [(2, 1), (1, 0)]
    
    f, d = main()
    assert f == 3
    assert d == 1
    assert mock_clean.call_count == 2
