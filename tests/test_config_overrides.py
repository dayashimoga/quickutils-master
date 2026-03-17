import os
import json
import pytest
from pathlib import Path
from unittest.mock import patch

def test_config_inheritance_logic():
    from scripts.utils import get_config
    
    # Mock configuration with global and project-specific keys
    mock_config = {
        "GA_MEASUREMENT_ID": "GLOBAL-GA",
        "AMAZON_AFFILIATE_TAG": "GLOBAL-AMAZON",
        "SITE_URL": "https://global.com",
        "projects": {
            "test-project": {
                "GA_MEASUREMENT_ID": "PROJECT-GA",
                "SITE_URL": "https://project.com"
                # AMAZON_AFFILIATE_TAG is missing, should fallback to global
            }
        }
    }
    
    with patch("scripts.utils._CONFIG", mock_config):
        # 1. Test global fallback (when PROJECT_TYPE doesn't match)
        with patch("scripts.utils.PROJECT_TYPE", "other-project"):
            assert get_config("GA_MEASUREMENT_ID", "default") == "GLOBAL-GA"
            assert get_config("AMAZON_AFFILIATE_TAG", "default") == "GLOBAL-AMAZON"
            
        # 2. Test project override
        with patch("scripts.utils.PROJECT_TYPE", "test-project"):
            assert get_config("GA_MEASUREMENT_ID", "default") == "PROJECT-GA"
            assert get_config("SITE_URL", "default") == "https://project.com"
            # Fallback to global for missing key in project block
            assert get_config("AMAZON_AFFILIATE_TAG", "default") == "GLOBAL-AMAZON"

def test_individual_project_ids_resolution():
    """Verify that each project can resolve its unique IDs from the actual project_config.json."""
    from scripts.utils import get_config, PROJECT_ROOT
    
    config_path = PROJECT_ROOT / "project_config.json"
    if not config_path.exists():
        pytest.skip("project_config.json not found")
        
    with open(config_path, "r", encoding="utf-8") as f:
        real_config = json.load(f)
        
    with patch("scripts.utils._CONFIG", real_config):
        # Test dailyfacts specifically (known to have overrides)
        with patch("scripts.utils.PROJECT_TYPE", "dailyfacts"):
            assert get_config("GA_MEASUREMENT_ID", "") == "G-9PEGCBXCL7"
            assert get_config("SITE_URL", "") == "https://facts.quickutils.top"
            assert get_config("ENABLE_ADSENSE", False) is True
            
        # Test a standard directory (should have its specific SITE_URL but global AdSense)
        with patch("scripts.utils.PROJECT_TYPE", "tools-directory"):
            assert get_config("SITE_URL", "") == "https://tools.quickutils.top"
            assert get_config("ENABLE_ADSENSE", True) is True # From global
