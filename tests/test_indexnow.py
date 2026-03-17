"""
Tests for indexnow_submit.py — search engine URL submission.
"""
import json
import os
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock
from urllib.error import URLError, HTTPError

import pytest

from scripts.indexnow_submit import parse_sitemap, submit_to_indexnow


class TestParseSitemap:
    """Test sitemap XML parsing."""

    def test_parses_valid_sitemap(self, tmp_path):
        sitemap = tmp_path / "sitemap.xml"
        sitemap.write_text(
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            "  <url><loc>https://example.com/page1</loc></url>\n"
            "  <url><loc>https://example.com/page2</loc></url>\n"
            "</urlset>",
            encoding="utf-8",
        )
        urls = parse_sitemap(str(sitemap))
        assert len(urls) == 2
        assert "https://example.com/page1" in urls
        assert "https://example.com/page2" in urls

    def test_returns_empty_for_invalid_xml(self, tmp_path):
        bad = tmp_path / "bad.xml"
        bad.write_text("not xml at all", encoding="utf-8")
        urls = parse_sitemap(str(bad))
        assert urls == []

    def test_returns_empty_for_missing_file(self):
        urls = parse_sitemap("/nonexistent/sitemap.xml")
        assert urls == []

    def test_handles_empty_sitemap(self, tmp_path):
        sitemap = tmp_path / "sitemap.xml"
        sitemap.write_text(
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            "</urlset>",
            encoding="utf-8",
        )
        urls = parse_sitemap(str(sitemap))
        assert urls == []


class TestSubmitToIndexNow:
    """Test IndexNow API submission with mocked HTTP."""

    def test_returns_false_for_empty_urls(self):
        result = submit_to_indexnow("example.com", "testkey", [])
        assert result is False

    @patch("scripts.indexnow_submit.urlopen")
    def test_successful_submission(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.__enter__ = MagicMock(return_value=mock_response)
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response

        result = submit_to_indexnow(
            "example.com", "testkey", ["https://example.com/page1"]
        )
        assert result is True

    @patch("scripts.indexnow_submit.urlopen")
    def test_accepted_202_response(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.status = 202
        mock_response.__enter__ = MagicMock(return_value=mock_response)
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response

        result = submit_to_indexnow(
            "example.com", "key", ["https://example.com/p"]
        )
        assert result is True

    @patch("scripts.indexnow_submit.urlopen")
    def test_http_error(self, mock_urlopen):
        mock_urlopen.side_effect = HTTPError(
            "https://api.indexnow.org/indexnow", 429, "Too Many Requests", {}, None
        )
        result = submit_to_indexnow(
            "example.com", "key", ["https://example.com/p"]
        )
        assert result is False

    @patch("scripts.indexnow_submit.urlopen")
    def test_url_error(self, mock_urlopen):
        mock_urlopen.side_effect = URLError("DNS failure")
        result = submit_to_indexnow(
            "example.com", "key", ["https://example.com/p"]
        )
        assert result is False

    @patch("scripts.indexnow_submit.urlopen")
    def test_unexpected_error(self, mock_urlopen):
        mock_urlopen.side_effect = RuntimeError("unexpected")
        result = submit_to_indexnow(
            "example.com", "key", ["https://example.com/p"]
        )
        assert result is False

    @patch("scripts.indexnow_submit.urlopen")
    def test_non_success_status(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.status = 500
        mock_response.__enter__ = MagicMock(return_value=mock_response)
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response

        result = submit_to_indexnow(
            "example.com", "key", ["https://example.com/p"]
        )
        assert result is False
