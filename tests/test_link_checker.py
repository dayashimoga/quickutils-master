import pytest
from pathlib import Path
from unittest.mock import patch
from scripts.check_links_local import check_links_in_dir

def test_check_links_in_dir(tmp_path):
    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "index.html").write_text('<a href="/other.html">Link</a><a href="rel.html">Rel</a><a href="/#frag">Frag</a>', encoding="utf-8")
    (dist / "other.html").write_text("Other", encoding="utf-8")
    (dist / "rel.html").write_text("Rel", encoding="utf-8")
    
    broken = check_links_in_dir(dist)
    assert len(broken) == 0

def test_broken_links(tmp_path):
    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "index.html").write_text('<a href="/missing.html">Broken</a>', encoding="utf-8")
    
    broken = check_links_in_dir(dist)
    assert len(broken) == 1
    assert broken[0][1] == "/missing.html"

def test_directory_link(tmp_path):
    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "subdir").mkdir()
    (dist / "subdir" / "index.html").write_text("Sub", encoding="utf-8")
    (dist / "index.html").write_text('<a href="/subdir">Subdir</a>', encoding="utf-8")
    
    broken = check_links_in_dir(dist)
    assert len(broken) == 0

def test_main_success(tmp_path, monkeypatch):
    # Setup mock structure
    root = tmp_path / "root"
    root.mkdir()
    (root / "dist").mkdir()
    (root / "dist" / "index.html").write_text('<a href="/">Home</a>', encoding="utf-8")
    
    projects = root / "projects"
    projects.mkdir()
    proj1 = projects / "proj1"
    proj1.mkdir()
    (proj1 / "dist").mkdir()
    (proj1 / "dist" / "index.html").write_text('<a href="/">Home</a>', encoding="utf-8")

    monkeypatch.chdir(root)
    from scripts.check_links_local import main
    with patch("sys.exit") as mock_exit:
        main()
        mock_exit.assert_called_once_with(0)

def test_main_failure(tmp_path, monkeypatch):
    root = tmp_path / "root_fail"
    root.mkdir()
    (root / "dist").mkdir()
    (root / "dist" / "index.html").write_text('<a href="/missing.html">Broken</a>', encoding="utf-8")

    monkeypatch.chdir(root)
    from scripts.check_links_local import main
    with patch("sys.exit") as mock_exit:
        main()
        mock_exit.assert_called_once_with(1)

def test_skip_external_links(tmp_path):
    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "index.html").write_text(
        '<a href="https://google.com">Ext</a>'
        '<a href="mailto:test@test.com">Mail</a>'
        '<a href="tel:123">Tel</a>'
        '<a href="#top">Anchor</a>', 
        encoding="utf-8"
    )
    broken = check_links_in_dir(dist)
    assert len(broken) == 0
