import os
import json
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock, mock_open

def test_generate_social_images_logic():
    mock_db = [
        {"title": "Test Tool", "category": "Test", "slug": "test-tool", "description": "Desc"}
    ]
    
    with patch("scripts.generate_social_images.load_database", return_value=mock_db), \
         patch("scripts.generate_social_images.Image.new") as mock_new, \
         patch("scripts.generate_social_images.ImageFont.truetype") as mock_font, \
         patch("scripts.generate_social_images.ensure_dir"), \
         patch("builtins.print"):
        
        # Mocking Image behavior
        mock_img = MagicMock()
        mock_new.return_value = mock_img
        
        from scripts.generate_social_images import main
        main()
        
        # Verify that save was called at least for index and one tool
        assert mock_img.save.called

def test_build_listicle_pages_logic():
    from scripts.build_directory import build_listicle_pages
    mock_env = MagicMock()
    mock_template = MagicMock()
    mock_env.get_template.return_value = mock_template
    
    mock_categories = {
        "Test Category": [
            {"title": "A", "slug": "a", "category": "Test Category", "description": "D1"},
            {"title": "B", "slug": "b", "category": "Test Category", "description": "D2"},
            {"title": "C", "slug": "c", "category": "Test Category", "description": "D3"}
        ]
    }
    
    with patch("scripts.build_directory.DIST_DIR", Path("/tmp/dist")), \
         patch("scripts.build_directory.ensure_dir"), \
         patch("pathlib.Path.write_text") as mock_write, \
         patch("builtins.print"):
        
        build_listicle_pages(mock_env, mock_categories)
        
        assert mock_template.render.called
        assert mock_write.called

def test_auto_file_generation_logic():
    from scripts.build_directory import copy_static_assets
    
    with patch("scripts.build_directory.SRC_DIR", Path("/tmp/src")), \
         patch("scripts.build_directory.DIST_DIR", Path("/tmp/dist")), \
         patch("scripts.build_directory.SITE_URL", "https://test.com"), \
         patch("scripts.build_directory.ENABLE_ADSENSE", True), \
         patch("scripts.build_directory.ADSENSE_PUBLISHER_ID", "pub-123"), \
         patch("scripts.build_directory.GOOGLE_SITE_VERIFICATION", "token"), \
         patch("pathlib.Path.exists", return_value=False), \
         patch("pathlib.Path.write_text") as mock_write, \
         patch("builtins.print"):
        
        copy_static_assets()
        
        # Check if robots.txt, ads.txt, and verification file were written
        assert any("User-agent" in str(args[0]) for args, kwargs in mock_write.call_args_list)
        assert any("pub-123" in str(args[0]) for args, kwargs in mock_write.call_args_list)
        assert any("google-site-verification" in str(args[0]) for args, kwargs in mock_write.call_args_list)
