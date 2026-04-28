"""Comprehensive tests for scripts/assign_domains_bulk.py"""
import json
import os
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.assign_domains_bulk import (
    find_wrangler_token,
    api_request,
    process_domain,
    assign_domains,
)


# ─── find_wrangler_token() ───

@patch.dict(os.environ, {"CLOUDFLARE_API_TOKEN": "env-tok-bulk"}, clear=False)
def test_find_wrangler_token_env():
    """Falls back to CLOUDFLARE_API_TOKEN env var."""
    with patch("scripts.assign_domains_bulk.WRANGLER_PATHS", []):
        token = find_wrangler_token()
    assert token is not None


def test_find_wrangler_token_from_file(tmp_path):
    """Reads oauth_token from wrangler TOML."""
    config_file = tmp_path / "default.toml"
    config_file.write_text('oauth_token = "file-tok-456"')

    with patch("scripts.assign_domains_bulk.WRANGLER_PATHS", [config_file]):
        token = find_wrangler_token()
    assert token == "file-tok-456"


def test_find_wrangler_token_bad_file(tmp_path):
    """Handles unparseable config gracefully."""
    config_file = tmp_path / "default.toml"
    config_file.write_text("garbage content no equals sign")

    with patch("scripts.assign_domains_bulk.WRANGLER_PATHS", [config_file]), \
         patch.dict(os.environ, {"CLOUDFLARE_API_TOKEN": "fallback"}, clear=False):
        token = find_wrangler_token()
    assert token == "fallback"


# ─── api_request() ───

@patch("scripts.assign_domains_bulk.urllib.request.urlopen")
def test_api_request_success(mock_urlopen):
    """Successful API call returns parsed JSON."""
    mock_resp = MagicMock()
    mock_resp.read.return_value = json.dumps({"success": True}).encode()
    mock_resp.status = 200
    mock_resp.__enter__ = MagicMock(return_value=mock_resp)
    mock_resp.__exit__ = MagicMock(return_value=False)
    mock_urlopen.return_value = mock_resp

    result, code = api_request("GET", "https://api.cf.com/test", "tok")
    assert code == 200
    assert result["success"] is True


@patch("scripts.assign_domains_bulk.urllib.request.urlopen")
def test_api_request_409_conflict(mock_urlopen):
    """409 Conflict returns error dict instead of None."""
    import urllib.error
    mock_urlopen.side_effect = urllib.error.HTTPError(
        url="https://api.cf.com", code=409, msg="Conflict", hdrs={}, fp=None
    )
    result, code = api_request("POST", "https://api.cf.com/test", "tok", {"name": "x"})
    assert code == 409
    assert result is not None  # Returns error dict, not None


@patch("scripts.assign_domains_bulk.urllib.request.urlopen")
def test_api_request_400_bad_request(mock_urlopen):
    """400 returns error dict."""
    import urllib.error
    mock_urlopen.side_effect = urllib.error.HTTPError(
        url="https://api.cf.com", code=400, msg="Bad Request", hdrs={}, fp=None
    )
    result, code = api_request("POST", "https://api.cf.com/test", "tok")
    assert code == 400
    assert result is not None


@patch("scripts.assign_domains_bulk.urllib.request.urlopen")
def test_api_request_500_error(mock_urlopen):
    """500 error returns None."""
    import urllib.error
    mock_urlopen.side_effect = urllib.error.HTTPError(
        url="https://api.cf.com", code=500, msg="ISE", hdrs={}, fp=None
    )
    result, code = api_request("GET", "https://api.cf.com/test", "tok")
    assert code == 500
    assert result is None


@patch("scripts.assign_domains_bulk.urllib.request.urlopen")
def test_api_request_connection_error(mock_urlopen):
    """Network errors return None, 500."""
    mock_urlopen.side_effect = ConnectionError("down")
    result, code = api_request("GET", "https://api.cf.com/test", "tok")
    assert code == 500
    assert result is None


# ─── process_domain() ───

def test_process_domain_skip_none():
    """Skips domains that are None or 'none'."""
    action, msg = process_domain(None, "proj", "http://base", "tok", None, {})
    assert action == "skip"

    action, msg = process_domain("none.quickutils.top", "proj", "http://base", "tok", None, {})
    assert action == "skip"

    action, msg = process_domain("None", "proj", "http://base", "tok", None, {})
    assert action == "skip"


@patch("scripts.assign_domains_bulk.api_request")
@patch("scripts.assign_domains_bulk.time.sleep")
def test_process_domain_already_active(mock_sleep, mock_api):
    """Skips domain already active on the correct project."""
    def side_effect(method, url, token, payload=None):
        if method == "GET" and "domains" in url and "?" not in url:
            return {"success": True, "result": [{"name": "test.quickutils.top", "status": "active"}]}, 200
        return {"success": True, "result": []}, 200

    mock_api.side_effect = side_effect
    action, msg = process_domain("test.quickutils.top", "proj", "http://base", "tok", None, {})
    assert action == "skip"


@patch("scripts.assign_domains_bulk.api_request")
@patch("scripts.assign_domains_bulk.time.sleep")
def test_process_domain_assign_success(mock_sleep, mock_api):
    """Successfully assigns a new domain."""
    call_count = {"n": 0}

    def side_effect(method, url, token, payload=None):
        call_count["n"] += 1
        if method == "GET" and "/domains" in url and "?" not in url and "/domains/" not in url:
            return {"success": True, "result": []}, 200  # No existing domains
        if method == "POST" and "/domains" in url:
            return {"success": True}, 200  # Assignment success
        if method == "GET" and "/domains/" in url:
            return {"success": True, "result": {"status": "active"}}, 200  # Poll active
        return {"success": True, "result": []}, 200

    mock_api.side_effect = side_effect
    action, msg = process_domain("new.quickutils.top", "proj", "http://base", "tok", None, {})
    assert action == "assigned"


@patch("scripts.assign_domains_bulk.api_request")
@patch("scripts.assign_domains_bulk.time.sleep")
def test_process_domain_force_detach(mock_sleep, mock_api):
    """Force detaches domain from wrong project before assigning."""
    detach_called = []

    def side_effect(method, url, token, payload=None):
        if method == "DELETE" and "other-proj" in url:
            detach_called.append(url)
            return None, 200
        if method == "GET" and "/domains" in url and "?" not in url and "/domains/" not in url:
            return {"success": True, "result": []}, 200
        if method == "POST":
            return {"success": True}, 200
        if method == "GET" and "/domains/" in url:
            return {"success": True, "result": {"status": "active"}}, 200
        return {"success": True, "result": []}, 200

    mock_api.side_effect = side_effect
    domain_map = {"detach.quickutils.top": "other-proj"}
    action, msg = process_domain("detach.quickutils.top", "my-proj", "http://base", "tok", None, domain_map)
    assert len(detach_called) == 1


@patch("scripts.assign_domains_bulk.api_request")
@patch("scripts.assign_domains_bulk.time.sleep")
def test_process_domain_rate_limited(mock_sleep, mock_api):
    """Handles 429 rate limiting on domain list."""
    call_count = {"n": 0}

    def side_effect(method, url, token, payload=None):
        call_count["n"] += 1
        if method == "GET" and "/domains" in url and "?" not in url and "/domains/" not in url:
            if call_count["n"] == 1:
                return None, 429  # First call rate limited
            return {"success": True, "result": []}, 200
        if method == "POST":
            return {"success": True}, 200
        if method == "GET" and "/domains/" in url:
            return {"success": True, "result": {"status": "active"}}, 200
        return {"success": True, "result": []}, 200

    mock_api.side_effect = side_effect
    action, msg = process_domain("rate.quickutils.top", "proj", "http://base", "tok", None, {})
    # Should retry after rate limit
    assert call_count["n"] >= 2


@patch("scripts.assign_domains_bulk.api_request")
@patch("scripts.assign_domains_bulk.time.sleep")
def test_process_domain_dns_provisioning(mock_sleep, mock_api):
    """Creates DNS CNAME when zone_id is provided."""
    dns_calls = []

    def side_effect(method, url, token, payload=None):
        if method == "GET" and "/domains" in url and "/domains/" not in url and "?" not in url:
            return {"success": True, "result": [{"name": "dns.quickutils.top", "status": "active"}]}, 200
        # Per-project lookup for subdomain resolution
        if method == "GET" and url.endswith("/proj"):
            return {"success": True, "result": {"subdomain": "proj-abc.pages.dev", "latest_deployment": {"url": "https://proj-abc.pages.dev"}}}, 200
        if "dns_records" in url and method == "GET":
            return {"success": True, "result": []}, 200  # No existing DNS
        if "dns_records" in url and method == "POST":
            dns_calls.append(payload)
            return {"success": True}, 201
        return {"success": True, "result": {}}, 200

    mock_api.side_effect = side_effect
    action, msg = process_domain("dns.quickutils.top", "proj", "http://base", "tok", "zone-123", {})
    assert len(dns_calls) == 1
    assert dns_calls[0]["type"] == "CNAME"
    assert dns_calls[0]["content"] == "proj-abc.pages.dev"  # Verified correct subdomain


# ─── assign_domains() ───

def test_assign_domains_missing_config(tmp_path):
    """Returns early when config file missing."""
    with patch("scripts.assign_domains_bulk.CONFIG_PATH", tmp_path / "missing.json"):
        result = assign_domains()
    assert result is None


def test_assign_domains_missing_token(tmp_path):
    """Returns early when no token found."""
    config_path = tmp_path / "projects.json"
    config_path.write_text(json.dumps({}))

    with patch("scripts.assign_domains_bulk.CONFIG_PATH", config_path), \
         patch("scripts.assign_domains_bulk.find_wrangler_token", return_value=None):
        result = assign_domains()
    assert result is None


def test_assign_domains_missing_account_id(tmp_path):
    """Returns early when CLOUDFLARE_ACCOUNT_ID not set."""
    config_path = tmp_path / "projects.json"
    config_path.write_text(json.dumps({}))

    with patch("scripts.assign_domains_bulk.CONFIG_PATH", config_path), \
         patch("scripts.assign_domains_bulk.find_wrangler_token", return_value="tok"), \
         patch.dict(os.environ, {}, clear=True):
        result = assign_domains()
    assert result is None


@patch("scripts.assign_domains_bulk.process_domain")
@patch("scripts.assign_domains_bulk.api_request")
@patch("scripts.assign_domains_bulk.time.sleep")
def test_assign_domains_full_run(mock_sleep, mock_api, mock_process):
    """Full orchestration with mocked process_domain."""
    config = {
        "proj-a": {"custom_domain": "a.quickutils.top", "repo_name": "proj-a"},
        "proj-b": {"custom_domain": "b.quickutils.top", "repo_name": "proj-b"},
    }
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(config, f)
        config_path = Path(f.name)

    try:
        def mock_api_side(method, url, token, payload=None):
            if "per_page=100" in url:
                return {"success": True, "result": []}, 200
            if "zones" in url:
                return {"success": True, "result": [{"id": "zone-abc"}]}, 200
            return {"success": True, "result": []}, 200

        mock_api.side_effect = mock_api_side
        mock_process.return_value = ("assigned", "ok")

        with patch("scripts.assign_domains_bulk.CONFIG_PATH", config_path), \
             patch("scripts.assign_domains_bulk.find_wrangler_token", return_value="tok"), \
             patch.dict(os.environ, {"CLOUDFLARE_ACCOUNT_ID": "acc-123"}):
            stats = assign_domains()

        assert stats is not None
        assert mock_process.call_count == 2
    finally:
        config_path.unlink(missing_ok=True)


@patch("scripts.assign_domains_bulk.process_domain")
@patch("scripts.assign_domains_bulk.api_request")
@patch("scripts.assign_domains_bulk.time.sleep")
def test_assign_domains_skips_non_quickutils(mock_sleep, mock_api, mock_process):
    """Skips domains not containing quickutils.top."""
    config = {
        "proj-a": {"custom_domain": "a.quickutils.top", "repo_name": "proj-a"},
        "proj-b": {"custom_domain": "other.example.com", "repo_name": "proj-b"},
    }
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(config, f)
        config_path = Path(f.name)

    try:
        def mock_api_side(method, url, token, payload=None):
            if "per_page=100" in url:
                return {"success": True, "result": []}, 200
            if "zones" in url:
                return {"success": True, "result": [{"id": "zone-abc"}]}, 200
            return {"success": True, "result": []}, 200

        mock_api.side_effect = mock_api_side
        mock_process.return_value = ("assigned", "ok")

        with patch("scripts.assign_domains_bulk.CONFIG_PATH", config_path), \
             patch("scripts.assign_domains_bulk.find_wrangler_token", return_value="tok"), \
             patch.dict(os.environ, {"CLOUDFLARE_ACCOUNT_ID": "acc-123"}):
            stats = assign_domains()

        # Only proj-a should be processed (has quickutils.top domain)
        assert mock_process.call_count == 1
    finally:
        config_path.unlink(missing_ok=True)


@patch("scripts.assign_domains_bulk.process_domain")
@patch("scripts.assign_domains_bulk.api_request")
@patch("scripts.assign_domains_bulk.time.sleep")
def test_assign_domains_exception_in_thread(mock_sleep, mock_api, mock_process):
    """Handles exceptions from ThreadPoolExecutor futures."""
    config = {"proj-a": {"custom_domain": "a.quickutils.top", "repo_name": "proj-a"}}
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(config, f)
        config_path = Path(f.name)

    try:
        def mock_api_side(method, url, token, payload=None):
            if "per_page=100" in url:
                return {"success": True, "result": []}, 200
            if "zones" in url:
                return {"success": True, "result": [{"id": "zone-abc"}]}, 200
            return {"success": True, "result": []}, 200

        mock_api.side_effect = mock_api_side
        mock_process.side_effect = RuntimeError("Thread boom")

        with patch("scripts.assign_domains_bulk.CONFIG_PATH", config_path), \
             patch("scripts.assign_domains_bulk.find_wrangler_token", return_value="tok"), \
             patch.dict(os.environ, {"CLOUDFLARE_ACCOUNT_ID": "acc-123"}):
            stats = assign_domains()

        assert stats["error"] == 1
    finally:
        config_path.unlink(missing_ok=True)
