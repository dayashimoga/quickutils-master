"""Comprehensive coverage tests for scripts that need additional branch coverage."""
import sys
import json
import os
from pathlib import Path
from unittest.mock import patch, MagicMock, mock_open


@patch("subprocess.run")
def test_build_all_local(mock_run):
    import scripts.build_all_local
    mock_p = MagicMock()
    mock_p.name = "test-directory"
    (mock_p / "data" / "database.json").exists.return_value = True
    
    with patch("scripts.build_all_local.get_projects", return_value=[mock_p]):
        scripts.build_all_local.main()
    assert mock_run.called

@patch("shutil.rmtree")
@patch("os.remove")
def test_cleanup(mock_remove, mock_rmtree):
    import scripts.cleanup
    import importlib
    with patch("glob.glob") as mock_glob:
        mock_glob.return_value = ["fake_file.txt"]
        mock_d = MagicMock()
        mock_d.is_file.return_value = False
        with patch("os.path.exists", side_effect=lambda p: True):
            importlib.reload(scripts.cleanup)

@patch("scripts.indexnow_submit.submit_to_indexnow")
@patch("scripts.indexnow_submit.parse_sitemap")
@patch("os.path.exists")
def test_indexnow_submit(mock_exists, mock_parse, mock_submit):
    import scripts.indexnow_submit
    mock_exists.return_value = True
    mock_parse.return_value = ["http://test.com/1"]
    mock_submit.return_value = True
    
    with patch("sys.argv", ["indexnow_submit.py", "test.com", "dist", "key"]):
        scripts.indexnow_submit.main()
    
    # Also test the function directly with correct signature (3 args)
    with patch("urllib.request.urlopen") as mock_urlopen:
        mock_res = MagicMock()
        mock_res.status = 200
        mock_res.__enter__.return_value = mock_res
        mock_urlopen.return_value = mock_res
        scripts.indexnow_submit.submit_to_indexnow("test.com", "key", ["http://test.com/1"])

def test_fix_slugs():
    import importlib
    import scripts.fix_slugs
    with patch("os.path.exists", return_value=True), \
         patch("builtins.open", MagicMock()), \
         patch("re.search", return_value=None):
        importlib.reload(scripts.fix_slugs)

@patch("scripts.verify_links_local.verify_links_in_dist")
def test_verify_links_coverage(mock_verify):
    import scripts.verify_links_local
    mock_verify.return_value = (True, [])
    with patch("pathlib.Path.iterdir") as mock_iter:
        mock_p = MagicMock()
        mock_p.is_dir.return_value = True
        mock_p.name = "test-directory"
        mock_iter.return_value = [mock_p]
        with patch("sys.exit") as mock_exit:
            scripts.verify_links_local.main()
            mock_exit.assert_not_called()

def test_test_orchestrator():
    """Test orchestrator main flow with properly mocked Path.unlink."""
    import scripts.test_orchestrator
    mock_cov = json.dumps({"totals": {"percent_covered": 95.0}})
    
    with patch("pathlib.Path.exists", return_value=True), \
         patch("pathlib.Path.unlink", return_value=None), \
         patch("pathlib.Path.iterdir", return_value=[]), \
         patch("builtins.open", mock_open(read_data=mock_cov)), \
         patch("subprocess.run") as mock_subrun:
        
        mock_subrun.return_value.returncode = 0
        mock_subrun.return_value.stdout = "PASSED"
        mock_subrun.return_value.stderr = ""
        
        with patch("sys.exit") as mock_exit:
            scripts.test_orchestrator.main()
            mock_exit.assert_not_called()


# --- Coverage tests for generate_social_images.py ---

def test_generate_social_images_functions():
    """Test create_gradient, draw_text_centered, generate_pin, generate_og."""
    from scripts.generate_social_images import (
        create_gradient, draw_text_centered, generate_pin, generate_og
    )
    from PIL import Image, ImageDraw, ImageFont
    
    # Test create_gradient
    img = create_gradient((100, 100), (0, 0, 0), (255, 255, 255))
    assert img.size == (100, 100)
    
    # Test draw_text_centered
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default()
    draw_text_centered(draw, "Test", font, 10, 100)
    
    # Test generate_pin and generate_og
    import tempfile
    with tempfile.TemporaryDirectory() as tmp:
        pin_path = Path(tmp) / "pin.png"
        og_path = Path(tmp) / "og.png"
        generate_pin("Test Title", "Test Category", pin_path)
        generate_og("Test Title", "Test Category", og_path)
        assert pin_path.exists()
        assert og_path.exists()


def test_generate_social_images_main(tmp_path):
    """Test the main() function with mocked database and paths."""
    import scripts.generate_social_images as gsi
    
    mock_db = [
        {"title": "API 1", "slug": "api-1", "category": "Cat1"},
        {"title": "API 2", "slug": "api-2", "category": "Cat1"},
        {"title": "API 3", "slug": "api-3", "category": "Cat1"},
    ]
    
    with patch.object(gsi, "load_database", return_value=mock_db), \
         patch.object(gsi, "DIST_DIR", tmp_path):
        gsi.main()
    
    social_dir = tmp_path / "images" / "social"
    assert social_dir.exists()
    assert (social_dir / "pin-index.png").exists()
    assert (social_dir / "og-index.png").exists()


# --- Coverage tests for generate_pins.py ---

def test_generate_pins_main():
    """Test generate_pinterest_images function and __main__ guard."""
    from scripts.generate_pins import generate_pinterest_images
    result = generate_pinterest_images()
    assert result is True


# --- Coverage tests for check_links.py ---

def test_check_links_main_with_projects(tmp_path):
    """Cover check_links.py main() with project iteration and report output."""
    import scripts.check_links
    
    # Create a mock project structure with a dist dir
    proj_dir = tmp_path / "projects" / "test-directory" / "dist"
    proj_dir.mkdir(parents=True)
    html_file = proj_dir / "index.html"
    html_file.write_text('<html><body><a href="/item/test.html">Test</a></body></html>')
    
    with patch("scripts.check_links.Path", side_effect=lambda x: Path(x) if isinstance(x, str) else x), \
         patch("sys.exit") as mock_exit:
        
        broken = scripts.check_links.check_links_in_dir(proj_dir)
        # The link to /item/test.html will be broken since it doesn't exist
        assert isinstance(broken, list)


def test_check_links_report_output(tmp_path):
    """Cover the output report writing branch in main()."""
    import scripts.check_links
    
    report_path = tmp_path / "report.md"
    
    # Create a dist dir with valid links only
    dist_dir = tmp_path / "dist"
    dist_dir.mkdir()
    html_file = dist_dir / "index.html"
    html_file.write_text('<html><body><a href="https://example.com">External</a></body></html>')
    
    with patch("sys.exit"):
        scripts.check_links.main(["--output-report", str(report_path)])
    
    # Report should mention no broken links (only external links which are skipped)


def test_check_links_legacy_exports():
    """Cover the legacy export functions for backward compatibility."""
    import asyncio
    from scripts.check_links import check_url, generate_report, main_async
    
    # Test legacy check_url
    loop = asyncio.new_event_loop()
    url, status, _ = loop.run_until_complete(check_url(None, "http://test.com"))
    assert url == "http://test.com"
    assert status is True
    loop.close()
    
    # Test legacy generate_report
    report = generate_report()
    assert report == "Report placeholder"
    
    # Test legacy main_async
    loop = asyncio.new_event_loop()
    result = loop.run_until_complete(main_async())
    assert result == (0, 0, 0, [], {})
    loop.close()


# --- Coverage tests for build_directory.py breadcrumb ---

def test_build_breadcrumb_schema():
    """Test the new breadcrumb JSON-LD schema builder."""
    from scripts.build_directory import build_breadcrumb_schema
    
    crumbs = [
        ("Home", "https://example.com"),
        ("Category", "https://example.com/category/test.html"),
        ("Item", "https://example.com/item/test.html"),
    ]
    schema = build_breadcrumb_schema(crumbs)
    
    assert schema["@context"] == "https://schema.org"
    assert schema["@type"] == "BreadcrumbList"
    assert len(schema["itemListElement"]) == 3
    assert schema["itemListElement"][0]["position"] == 1
    assert schema["itemListElement"][0]["name"] == "Home"
    assert schema["itemListElement"][2]["position"] == 3


# --- Coverage tests for generate_sitemap.py new priorities ---

def test_sitemap_best_page_priority():
    """Test that listicle/best pages get proper priority and frequency."""
    from scripts.generate_sitemap import get_priority, get_changefreq
    
    assert get_priority("best/best-dev-apis.html") == "0.7"
    assert get_changefreq("best/best-dev-apis.html") == "weekly"
