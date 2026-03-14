"""Tests for the local link checker."""
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
from scripts.check_links import check_links_in_dir, main

def test_check_links_in_dir_success(tmp_path):
    dist_dir = tmp_path / "dist"
    dist_dir.mkdir()
    index_html = dist_dir / "index.html"
    index_html.write_text('<a href="item/test.html">link</a>', encoding="utf-8")
    
    item_dir = dist_dir / "item"
    item_dir.mkdir()
    test_html = item_dir / "test.html"
    test_html.write_text("item", encoding="utf-8")
    
    broken = check_links_in_dir(dist_dir)
    assert len(broken) == 0

def test_check_links_in_dir_broken(tmp_path):
    dist_dir = tmp_path / "dist"
    dist_dir.mkdir()
    index_html = dist_dir / "index.html"
    index_html.write_text('<a href="missing.html">link</a>', encoding="utf-8")
    
    broken = check_links_in_dir(dist_dir)
    assert len(broken) == 1
    assert "missing.html" in broken[0][1]

def test_main_success(tmp_path):
    dist_dir = tmp_path / "dist"
    dist_dir.mkdir()
    
    with patch("scripts.check_links.Path", return_value=tmp_path), \
         patch("scripts.check_links.check_links_in_dir", return_value=[]), \
         patch("sys.exit") as mock_exit:
        # Mock Path("dist").exists()
        tmp_path.joinpath("dist").mkdir(exist_ok=True)
        main([])
        # Should exit with 0
        mock_exit.assert_called_once_with(0)

def test_main_failure(tmp_path):
    dist_dir = tmp_path / "dist"
    dist_dir.mkdir()
    
    with patch("scripts.check_links.Path", return_value=tmp_path), \
         patch("scripts.check_links.check_links_in_dir", return_value=[("index.html", "broken")]), \
         patch("sys.exit") as mock_exit:
        tmp_path.joinpath("dist").mkdir(exist_ok=True)
        main([])
        # Should exit with 1
        mock_exit.assert_called_once_with(1)
