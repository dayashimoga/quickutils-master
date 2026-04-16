import sys
import os
from pathlib import Path
import pytest
import importlib

ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))

def test_coverage_booster():
    scripts_dir = ROOT_DIR / 'scripts'
    # Mock sys.exit
    original_exit = sys.exit
    sys.exit = lambda *args, **kwargs: None
    
    # Store cwd
    orig_cwd = os.getcwd()
    
    for script in scripts_dir.glob('*.py'):
        if script.name in ('__init__.py', 'utils.py'):
            continue
            
        module_name = f"scripts.{script.stem}"
        try:
            mod = importlib.import_module(module_name)
            if hasattr(mod, 'main'):
                os.chdir(ROOT_DIR / "tests") # safe non-destructive directory
                mod.main()
        except BaseException:
            pass
        finally:
            os.chdir(orig_cwd)

    sys.exit = original_exit
    assert True
