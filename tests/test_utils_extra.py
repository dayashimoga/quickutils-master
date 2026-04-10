import importlib
import os
import json
from pathlib import Path
from unittest.mock import patch

def test_reload_utils_not_monorepo(monkeypatch, tmp_path):
    import scripts.utils
    with patch("scripts.utils.PROJECT_ROOT", tmp_path), \
         patch("scripts.utils._is_monorepo", False):
        # ensure directories don't exist to trigger warnings
        importlib.reload(scripts.utils)

def test_truncate_no_space():
    from scripts.utils import truncate
    res = truncate("longstringwithoutspace"*10, 10)
    assert res == "longstr..."
    
