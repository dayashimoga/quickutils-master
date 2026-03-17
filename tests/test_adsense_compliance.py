"""
Tests for Google AdSense compliance across the boringwebsite.
Validates: cookie consent, consistent navigation, footers, affiliate tags,
ads.txt correctness, and GDPR-related content.
"""
import os
import pytest
from pathlib import Path

# Project root
ROOT_DIR = Path(__file__).parent.parent
BORING_DIR = ROOT_DIR / "projects" / "boringwebsite" / "src"

# All HTML pages in the boringwebsite
HTML_PAGES = [
    "index.html",
    "about.html",
    "blog.html",
    "privacy.html",
    "terms.html",
    "affiliate-disclosure.html",
    "tools.html",
]


def _read_page(filename):
    """Read a boringwebsite HTML file, skip if missing."""
    path = BORING_DIR / filename
    if not path.exists():
        pytest.skip(f"{filename} not found")
    return path.read_text(encoding="utf-8")


# ── Content Compliance ────────────────────────────────────────────

class TestContentCompliance:
    """Test that required legal/policy content is present."""

    def test_privacy_policy_compliance(self):
        """privacy.html includes AdSense and GDPR/CCPA clauses."""
        content = _read_page("privacy.html").lower()
        assert "google adsense" in content, "Missing AdSense disclosure in privacy.html"
        assert "cookie" in content, "Missing Cookie policy in privacy.html"
        assert "gdpr" in content or "ccpa" in content, "Missing GDPR/CCPA references"

    def test_terms_of_service_compliance(self):
        """terms.html includes standard comprehensive terms."""
        content = _read_page("terms.html").lower()
        assert "terms of service" in content, "Missing Terms of Service heading"
        assert "liability" in content, "Missing liability clause"

    def test_affiliate_disclosure_exists(self):
        """affiliate-disclosure.html exists and has Amazon mention."""
        content = _read_page("affiliate-disclosure.html").lower()
        assert "amazon" in content, "Missing Amazon mention in affiliate disclosure"

    def test_robots_txt_has_sitemap(self):
        """robots.txt includes the sitemap for SEO/AdSense visibility."""
        robots_file = BORING_DIR / "robots.txt"
        if not robots_file.exists():
            pytest.skip("robots.txt not found")
        content = robots_file.read_text(encoding="utf-8").lower()
        assert "sitemap: https://" in content, "Sitemap URL missing from robots.txt"


# ── Cookie Consent ────────────────────────────────────────────────

class TestCookieConsent:
    """Test that cookie consent script is present on all pages."""

    @pytest.mark.parametrize("page", HTML_PAGES)
    def test_cookie_consent_script_included(self, page):
        """Every page should include cookie-consent.js."""
        content = _read_page(page)
        assert "cookie-consent.js" in content, \
            f"{page} is missing cookie-consent.js script"

    def test_cookie_consent_js_exists(self):
        """The cookie consent JS file should exist."""
        js_path = BORING_DIR / "js" / "cookie-consent.js"
        assert js_path.exists(), "cookie-consent.js file is missing"

    def test_cookie_consent_js_has_accept_button(self):
        """cookie-consent.js should have accept/reject buttons."""
        js_path = BORING_DIR / "js" / "cookie-consent.js"
        if not js_path.exists():
            pytest.skip("cookie-consent.js not found")
        content = js_path.read_text(encoding="utf-8")
        assert "cc-accept" in content, "Missing accept button in cookie consent"
        assert "cc-reject" in content, "Missing reject button in cookie consent"
        assert "privacy" in content.lower(), "Missing privacy policy link in cookie consent"


# ── Consistent Navigation ─────────────────────────────────────────

class TestConsistentNavigation:
    """Every page must have consistent header navigation."""

    @pytest.mark.parametrize("page", HTML_PAGES)
    def test_has_nav_element(self, page):
        """Each page should have a navigation bar."""
        content = _read_page(page)
        assert "<nav" in content, f"{page} missing <nav> element"

    @pytest.mark.parametrize("page", HTML_PAGES)
    def test_nav_has_home_link(self, page):
        """Navigation should always link to Home."""
        content = _read_page(page)
        assert 'href="index.html"' in content, f"{page} missing Home link"


# ── Consistent Footer ─────────────────────────────────────────────

class TestConsistentFooter:
    """Every page must have a footer with legal links."""

    @pytest.mark.parametrize("page", HTML_PAGES)
    def test_has_footer(self, page):
        """Each page should have a <footer> element."""
        content = _read_page(page)
        assert "<footer" in content, f"{page} missing footer"

    @pytest.mark.parametrize("page", HTML_PAGES)
    def test_footer_has_privacy_link(self, page):
        """Footer should link to Privacy Policy."""
        content = _read_page(page)
        assert "privacy.html" in content, f"{page} missing Privacy Policy link"

    @pytest.mark.parametrize("page", HTML_PAGES)
    def test_footer_has_terms_link(self, page):
        """Footer should link to Terms of Use."""
        content = _read_page(page)
        assert "terms.html" in content, f"{page} missing Terms of Use link"


# ── Affiliate Link Attributes ──────────────────────────────────────

class TestAffiliateLinks:
    """Test that all Amazon affiliate links have proper rel attributes."""

    def test_amazon_links_have_sponsored(self):
        """All Amazon affiliate links should have rel='sponsored'."""
        content = _read_page("index.html")
        # Find all Amazon links
        import re
        amazon_links = re.findall(
            r'<a[^>]*href="https://www\.amazon\.[^"]*"[^>]*>', content
        )
        for link in amazon_links:
            assert "sponsored" in link, \
                f"Amazon link missing 'sponsored' rel attribute: {link[:80]}"

    def test_amazon_india_links_have_tag(self):
        """Amazon India links should include the affiliate tag."""
        content = _read_page("index.html")
        import re
        amazon_in_links = re.findall(
            r'href="(https://www\.amazon\.in/[^"]*)"', content
        )
        for link in amazon_in_links:
            assert "tag=" in link, f"Amazon India link missing tag: {link}"


# ── ads.txt ────────────────────────────────────────────────────────

class TestAdsTxt:
    """Test ads.txt file content."""

    def test_ads_txt_exists(self):
        """ads.txt must exist for AdSense."""
        ads_path = BORING_DIR / "ads.txt"
        assert ads_path.exists(), "ads.txt is missing"

    def test_ads_txt_content(self):
        """ads.txt must contain the correct publisher ID."""
        ads_path = BORING_DIR / "ads.txt"
        if not ads_path.exists():
            pytest.skip("ads.txt not found")
        content = ads_path.read_text(encoding="utf-8")
        assert "google.com" in content, "ads.txt missing google.com entry"
        assert "pub-5193703345853377" in content, "ads.txt has wrong publisher ID"
        assert "DIRECT" in content, "ads.txt missing DIRECT relationship"
        assert "f08c47fec0942fa0" in content, "ads.txt missing Google cert authority ID"


# ── Branding Consistency ───────────────────────────────────────────

class TestBrandingConsistency:
    """All pages should use consistent QuickUtils branding."""

    @pytest.mark.parametrize("page", HTML_PAGES)
    def test_uses_quickutils_branding(self, page):
        """Pages should reference QuickUtils, not DailyLift."""
        content = _read_page(page)
        # The brand name in the nav should be QuickUtils
        assert "QuickUtils" in content, f"{page} missing QuickUtils branding"
