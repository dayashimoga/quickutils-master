import os
import pytest
from pathlib import Path
import sys

# Add scripts directory to path
ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))

from scripts import utils
from scripts import build_directory

def test_load_network_links():
    """Test that load_network_links returns valid project links."""
    links = utils.load_network_links()
    
    assert isinstance(links, list)
    assert len(links) > 0, "Should load at least one project from config"
    
    for link in links:
        assert 'name' in link
        assert 'url' in link
        assert link['url'].startswith('https://')

def test_footer_contains_network_links():
    """Test that the base template uses dynamic network links."""
    base_template = ROOT_DIR / "projects" / "quickutils-master" / "src" / "templates" / "base.html"
    if not base_template.exists():
        pytest.skip("base.html not found")
        
    content = base_template.read_text(encoding="utf-8")
    
    # It should iterate over network_links
    assert "{% for link in network_links %}" in content
    assert "{{ link.url }}" in content
    assert "{{ link.name }}" in content
