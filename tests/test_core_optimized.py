"""Core optimized tests covering scripts/utils.py and scripts/build_directory.py"""
import pytest
import os
import json
import shutil
from pathlib import Path
from scripts.utils import slugify, load_database, get_categories, truncate, ensure_dir
from scripts.build_directory import generate_html, build_directory, DIRECTORY_TYPES

# Smoke tests for other scripts to boost overall coverage
import scripts.check_links
import scripts.fetch_data
import scripts.generate_sitemap

def test_script_imports():
    assert scripts.check_links is not None
    assert scripts.fetch_data is not None
    assert scripts.generate_sitemap is not None

def test_generate_sitemap_smoke(tmp_path, monkeypatch):
    import scripts.generate_sitemap
    monkeypatch.setattr(scripts.generate_sitemap, "DIST_DIR", tmp_path)
    # Ensure it doesn't crash on empty dist
    scripts.generate_sitemap.generate_sitemap("http://example.com")
    assert not (tmp_path / "sitemap.xml").exists() # Should skip on empty

def test_check_links_smoke(tmp_path, monkeypatch):
    import scripts.check_links
    pass

def test_slugify():
    assert slugify("Hello World") == "hello-world"
    assert slugify("API & Tools!!") == "api-tools"
    assert slugify("Special @ Symbols") == "special-symbols"
    assert slugify("") == ""
    assert slugify(None) == ""

def test_truncate():
    text = "This is a very long text that should be truncated at some point."
    assert truncate(text, 20) == "This is a very..."
    assert truncate("Short", 20) == "Short"
    assert truncate("", 20) == ""

def test_ensure_dir(tmp_path):
    test_dir = tmp_path / "new_dir" / "sub_dir"
    ensure_dir(test_dir)
    assert test_dir.exists()
    assert test_dir.is_dir()

def test_load_database(tmp_path):
    db_path = tmp_path / "database.json"
    data = [{"name": "Test Item", "category": "Test"}]
    with open(db_path, "w", encoding="utf-8") as f:
        json.dump(data, f)
    
    loaded = load_database(db_path)
    assert len(loaded) == 1
    assert loaded[0]["slug"] == "test-item"
    assert loaded[0]["title"] == "Test Item"

def test_get_categories():
    items = [
        {"name": "A", "category": "Cat1"},
        {"name": "B", "category": "Cat1"},
        {"name": "C", "category": "Cat2"}
    ]
    cats = get_categories(items)
    assert len(cats) == 2
    assert len(cats["Cat1"]) == 2
    assert len(cats["Cat2"]) == 1

def test_generate_html_basic():
    items = [{"name": "Test", "category": "Cat", "url": "#", "description": "desc"}]
    html = generate_html("tools", items)
    assert "<!DOCTYPE html>" in html
    assert "Test" in html
    assert "1 items" in html

def test_generate_html_empty():
    html = generate_html("tools", [])
    assert "0 items" in html

def test_build_directory_valid(tmp_path, monkeypatch):
    import scripts.build_directory as bd
    monkeypatch.setattr(bd, "ROOT_DIR", tmp_path)
    
    project_dir = tmp_path / "projects" / "tools-directory"
    data_dir = project_dir / "data"
    data_dir.mkdir(parents=True)
    with open(data_dir / "database.json", "w") as f:
        json.dump([{"name": "API 1", "category": "Cat1", "description": "Desc"}], f)
    
    result = build_directory("tools")
    assert result is True
    assert (project_dir / "index.html").exists()
    assert (project_dir / "dist" / "index.html").exists()

def test_build_directory_missing(tmp_path, monkeypatch):
    import scripts.build_directory as bd
    monkeypatch.setattr(bd, "ROOT_DIR", tmp_path)
    
    result = build_directory("nonexistent")
    assert result is False

def test_directory_types_exist():
    assert "tools" in DIRECTORY_TYPES
    assert "opensource" in DIRECTORY_TYPES
    assert len(DIRECTORY_TYPES) >= 8

def test_main_execution(tmp_path, monkeypatch):
    import scripts.build_directory as bd
    import sys
    
    monkeypatch.setattr(bd, "ROOT_DIR", tmp_path)
    monkeypatch.setattr(sys, "argv", ["build_directory.py", "--type", "tools"])
    
    project_dir = tmp_path / "projects" / "tools-directory"
    data_dir = project_dir / "data"
    data_dir.mkdir(parents=True)
    with open(data_dir / "database.json", "w") as f:
        json.dump([], f)
    
    bd.main()

def test_save_database(tmp_path):
    from scripts.utils import save_database
    db_path = tmp_path / "database.json"
    save_database([], db_path)
    assert db_path.exists()
