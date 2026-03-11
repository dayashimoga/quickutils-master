import pytest
from pathlib import Path
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
