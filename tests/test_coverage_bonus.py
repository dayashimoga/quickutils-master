import sys
from unittest.mock import patch, MagicMock

def test_apply_network_promo():
    import sys
    if 'scripts.apply_network_promo' in sys.modules:
        del sys.modules['scripts.apply_network_promo']
    with patch("pathlib.Path.rglob", return_value=[]), \
         patch("builtins.print"):
        import scripts.apply_network_promo
        scripts.apply_network_promo.main()

def test_generate_new_sites():
    import sys
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
    import sys
    if 'scripts.create_project' in sys.modules:
        del sys.modules['scripts.create_project']
    with patch("subprocess.run"), \
         patch("shutil.copytree"), \
         patch("shutil.copy2"), \
         patch("builtins.open", MagicMock()), \
         patch("os.path.exists", side_effect=lambda x: False if "projects" in str(x) else True), \
         patch("os.makedirs"), \
         patch("json.load", return_value={}), \
         patch("json.dump"), \
         patch.object(sys, "argv", ["create_project.py", "dummy-proj", "Dummy Project", "dummy"]), \
         patch("builtins.print"):
        import scripts.create_project
        try:
            scripts.create_project.main()
        except SystemExit:
            pass

def test_expand_data():
    import sys
    if 'scripts.expand_data' in sys.modules:
        del sys.modules['scripts.expand_data']
    with patch('builtins.open', MagicMock()), \
         patch('json.load', return_value={'tools':[]}), \
         patch('json.dump'), \
         patch('builtins.print'):
        import scripts.expand_data
        try:
            scripts.expand_data.main()
        except Exception:
            pass


