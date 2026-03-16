import pytest
import sys
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))

from scripts import utils

def test_project_config_valid():
    """Smoke test to ensure project_config.json is structurally valid."""
    config_file = ROOT_DIR / "project_config.json"
    assert config_file.exists(), "project_config.json is missing!"
    
    # This should not raise an error
    projects = utils.load_network_links()
    assert len(projects) > 0, "Failed to load project_config.json into network_links"

def test_python_syntax_smoke():
    """Run a quick syntax check on all python scripts in scripts/ directory."""
    scripts_dir = ROOT_DIR / "scripts"
    py_files = list(scripts_dir.glob("*.py"))
    
    assert len(py_files) > 0, "No Python scripts found in scripts/"
    
    for py_file in py_files:
        # Compile without executing
        try:
            with open(py_file, 'r', encoding='utf-8') as f:
                source = f.read()
            compile(source, filename=str(py_file), mode='exec')
        except SyntaxError as e:
            pytest.fail(f"Syntax error in {py_file.name}: {e}")
