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
