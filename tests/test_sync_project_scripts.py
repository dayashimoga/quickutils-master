"""Tests for scripts/sync_project_scripts.py"""
import os
import shutil
from pathlib import Path
from scripts.sync_project_scripts import sync_scripts, MASTER_FILES
import scripts.sync_project_scripts

def test_sync_scripts_basic(tmp_path, monkeypatch):
    # Setup mock root structure
    root = tmp_path / "root"
    root.mkdir()
    # Create projects directory
    projects_dir = root / "projects"
    projects_dir.mkdir()
    
    master_proj = projects_dir / "quickutils-master"
    master_proj.mkdir()
    
    # Create master files
    for f_rel in MASTER_FILES:
        if f_rel.startswith("scripts/") or f_rel.startswith("tests/") or f_rel in ["requirements.txt", ".gitignore", "project_config.json"]:
            f_path = root / f_rel
        else:
            f_path = master_proj / f_rel
        f_path.parent.mkdir(parents=True, exist_ok=True)
        f_path.write_text(f"content of {f_rel}", encoding="utf-8")
        
    proj1 = projects_dir / "project1"
    proj1.mkdir()
    
    # Create legacy files in project1
    (proj1 / "wrangler.toml").write_text("legacy config", encoding="utf-8")
    (proj1 / "netlify.toml").write_text('redirects = "/api/* /item/*"', encoding="utf-8")
    
    # Monkeypatch ROOT_DIR and PROJECTS_DIR in the script
    monkeypatch.setattr(scripts.sync_project_scripts, "ROOT_DIR", root)
    monkeypatch.setattr(scripts.sync_project_scripts, "PROJECTS_DIR", projects_dir)
    
    # Run sync
    sync_scripts()
    
    # Verify files were copied
    for f_rel in MASTER_FILES:
        if f_rel.startswith("scripts/"):
            script_name = os.path.basename(f_rel)
            dst = proj1 / "scripts" / script_name
        else:
            dst = proj1 / f_rel
        assert dst.exists(), f"{dst} should exist after sync"
        assert dst.read_text(encoding="utf-8") == f"content of {f_rel}"
        
    # Verify legacy files were removed
    assert not (proj1 / "wrangler.toml").exists()
    
    # Verify netlify.toml was updated then deleted (it's in legacy_configs)
    # Actually, in sync_scripts, netlify.toml is updated AND then unlinked in legacy_configs.
    # Let's check the code:
    # legacy_configs = ["wrangler.toml", "wrangler.jsonc", "wrangler.json", "netlify.toml", "_redirects", "_headers"]
    # So netlify.toml SHOULD be gone.
    assert not (proj1 / "netlify.toml").exists()

def test_sync_scripts_missing_projects(tmp_path, monkeypatch):
    root = tmp_path / "root"
    root.mkdir()
    projects_dir = root / "nonexistent"
    
    monkeypatch.setattr(scripts.sync_project_scripts, "ROOT_DIR", root)
    monkeypatch.setattr(scripts.sync_project_scripts, "PROJECTS_DIR", projects_dir)
    
    # Should not raise exception
    sync_scripts()

def test_sync_scripts_skips_hidden_dirs(tmp_path, monkeypatch):
    root = tmp_path / "root"
    root.mkdir()
    projects_dir = root / "projects"
    projects_dir.mkdir()
    
    hidden_proj = projects_dir / ".hidden"
    hidden_proj.mkdir()
    
    monkeypatch.setattr(scripts.sync_project_scripts, "ROOT_DIR", root)
    monkeypatch.setattr(scripts.sync_project_scripts, "PROJECTS_DIR", projects_dir)
    
    sync_scripts()
    # verify no files created in hidden proj
    assert not (hidden_proj / "scripts").exists()
