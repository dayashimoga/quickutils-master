import os
import pytest
from pathlib import Path

# Project root
ROOT_DIR = Path(__file__).parent.parent
BORING_DIR = ROOT_DIR / "projects" / "boringwebsite" / "src"

def test_privacy_policy_compliance():
    """Test that privacy.html includes AdSense and GDPR/CCPA clauses."""
    privacy_file = BORING_DIR / "privacy.html"
    if not privacy_file.exists():
        pytest.skip("privacy.html not found")
        
    content = privacy_file.read_text(encoding="utf-8").lower()
    
    assert "google adsense" in content, "Missing AdSense disclosure in privacy.html"
    assert "cookie" in content, "Missing Cookie policy in privacy.html"
    assert "gdpr" in content or "ccpa" in content, "Missing GDPR/CCPA references in privacy.html"

def test_terms_of_service_compliance():
    """Test that terms.html includes standard comprehensive terms."""
    terms_file = BORING_DIR / "terms.html"
    if not terms_file.exists():
        pytest.skip("terms.html not found")
        
    content = terms_file.read_text(encoding="utf-8").lower()
    assert "terms of service" in content, "Missing Terms of Service heading"
    assert "liability" in content, "Missing liability clause"

def test_robots_txt_sitemap():
    """Test that robots.txt includes the sitemap for SEO/AdSense visibility."""
    robots_file = BORING_DIR / "robots.txt"
    if not robots_file.exists():
        pytest.skip("robots.txt not found")
        
    content = robots_file.read_text(encoding="utf-8").lower()
    assert "sitemap: https://" in content, "Sitemap URL missing from robots.txt"

def test_affiliate_disclosure_exists():
    """Test that the affiliate disclosure page exists."""
    affiliate_file = BORING_DIR / "affiliate-disclosure.html"
    assert affiliate_file.exists(), "affiliate-disclosure.html should exist for FTC/Amazon compliance"
    content = affiliate_file.read_text(encoding="utf-8").lower()
    assert "amazon" in content, "Missing Amazon mention in affiliate disclosure"
