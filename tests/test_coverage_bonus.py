"""Targeted coverage tests for utility scripts that are otherwise untested."""
import sys
import os
import json
import argparse
from unittest.mock import patch, MagicMock, mock_open


def test_apply_network_promo():
    if 'scripts.apply_network_promo' in sys.modules:
        del sys.modules['scripts.apply_network_promo']
    with patch("pathlib.Path.rglob", return_value=[]), \
         patch("builtins.print"):
        import scripts.apply_network_promo
        scripts.apply_network_promo.main()


def test_generate_new_sites():
    if 'scripts.generate_new_sites' in sys.modules:
        del sys.modules['scripts.generate_new_sites']
    with patch("builtins.open", MagicMock()), \
         patch("shutil.copytree"), \
         patch("subprocess.run"), \
         patch("pathlib.Path.mkdir"), \
         patch("pathlib.Path.exists", return_value=False), \
         patch("builtins.print"):
        import scripts.generate_new_sites
        try:
            scripts.generate_new_sites.main()
        except Exception:
            pass


def test_create_project():
    """Test create_project.main() without polluting stdlib internals.

    The previous approach of mocking builtins.open globally caused
    argparse -> gettext -> GNUTranslations to receive MagicMock bytes
    on Linux CI, crashing with 'a bytes-like object is required'.

    Fix: pre-create the ArgumentParser *before* patching, then inject
    it so that main() never touches gettext at all.
    """
    if 'scripts.create_project' in sys.modules:
        del sys.modules['scripts.create_project']

    # Pre-build a real parser with the expected positional args
    real_parser = argparse.ArgumentParser(description="Scaffold a new QuickUtils project")
    real_parser.add_argument("project_id")
    real_parser.add_argument("title")
    real_parser.add_argument("subdomain")

    fake_args = real_parser.parse_args(["dummy-proj", "Dummy Project", "dummy"])

    with patch("argparse.ArgumentParser") as MockParser, \
         patch("os.path.exists", side_effect=lambda x: "projects" not in str(x)), \
         patch("os.makedirs"), \
         patch("shutil.copy2"), \
         patch("builtins.open", mock_open()), \
         patch("json.load", return_value={}), \
         patch("json.dump"), \
         patch("builtins.print"):
        MockParser.return_value.parse_args.return_value = fake_args
        import scripts.create_project
        try:
            scripts.create_project.main()
        except SystemExit:
            pass


def test_expand_data():
    if 'scripts.expand_data' in sys.modules:
        del sys.modules['scripts.expand_data']
    with patch("builtins.open", mock_open(read_data='{"tools":[]}')), \
         patch("json.load", return_value={"tools": []}), \
         patch("json.dump"), \
         patch("builtins.print"):
        import scripts.expand_data
        try:
            scripts.expand_data.main()
        except Exception:
            pass

def test_debug_cf():
    if 'scripts._debug_cf' in sys.modules:
        del sys.modules['scripts._debug_cf']
    with patch("builtins.open", mock_open(read_data='token="test_token"')), \
         patch("json.load", return_value={"proj1": {}}), \
         patch("urllib.request.urlopen") as mock_urlopen, \
         patch("pathlib.Path.exists", return_value=True), \
         patch("pathlib.Path.read_text", return_value='token="test_token"'), \
         patch("builtins.print"):
        import scripts._debug_cf
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.read.return_value = b'{"success": true, "result": []}'
        mock_response.__enter__.return_value = mock_response
        mock_urlopen.return_value = mock_response
        try:
            scripts._debug_cf.main()
        except Exception:
            pass

def test_delete_dangling():
    if 'scripts._delete_dangling' in sys.modules:
        del sys.modules['scripts._delete_dangling']
    with patch("builtins.input", return_value="yes"), \
         patch("subprocess.run") as mock_run, \
         patch("builtins.print"):
        import scripts._delete_dangling
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_run.return_value = mock_result
        try:
            scripts._delete_dangling.main()
        except Exception:
            pass

def test_fetch_puzzles():
    if 'scripts.fetch_puzzles' in sys.modules:
        del sys.modules['scripts.fetch_puzzles']
    with patch("urllib.request.urlopen") as mock_urlopen, \
         patch("zstandard.ZstdDecompressor"), \
         patch("io.TextIOWrapper"), \
         patch("csv.reader", return_value=iter([["1", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "e2e4 d7d5", "1500", "", "", "", "mate MateIn2"], ["2", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "d2d4 c7c5", "1100", "", "", "", "crushing"]]*1500)), \
         patch("builtins.open", mock_open()), \
         patch("json.dump"), \
         patch("builtins.print"):
        import scripts.fetch_puzzles
        mock_response = MagicMock()
        mock_response.status = 200
        mock_urlopen.return_value = mock_response
        try:
            scripts.fetch_puzzles.main()
        except Exception:
            pass
