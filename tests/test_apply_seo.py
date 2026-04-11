import os
import pytest
from scripts.apply_seo import update_seo_metadata
from pathlib import Path

def test_apply_seo_basic(tmp_path):
    # Setup mock projects directory
    projects_dir = tmp_path / "projects"
    projects_dir.mkdir()
    
    p1 = projects_dir / "test-project"
    p1.mkdir()
    html1 = p1 / "index.html"
    html1.write_text("<html><head><title>Test</title></head><body><p class='hero-sub'>Sub</p></body></html>")
    
    p2 = projects_dir / "src-project"
    p2.mkdir()
    src2 = p2 / "src"
    src2.mkdir()
    html2 = src2 / "index.html"
    html2.write_text("<html><head><title>Src Test</title></head><body></body></html>")
    
    # Change CWD to tmp_path temporarily
    old_cwd = os.getcwd()
    os.chdir(tmp_path)
    try:
        update_seo_metadata()
    finally:
        os.chdir(old_cwd)
        
    # Verify
    content1 = html1.read_text()
    assert 'name="description"' in content1
    assert 'content="Sub"' in content1
    assert 'link rel="canonical"' in content1
    
    content2 = html2.read_text()
    assert 'name="description"' in content2
    assert 'property="og:title" content="Src Test"' in content2
