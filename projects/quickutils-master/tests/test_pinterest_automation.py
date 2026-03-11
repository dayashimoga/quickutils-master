import os
import json
import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path
from scripts.pinterest_automation import (
    get_headers,
    get_boards,
    create_pin,
    load_daily_facts,
    load_directory_items,
    automate_pinning
)

def test_get_headers_no_token():
    with patch.dict(os.environ, {}, clear=True):
        # We need to re-import or reload to pick up env changes if they are global
        # But get_headers checks the global PINTEREST_ACCESS_TOKEN which is set at import
        with patch("scripts.pinterest_automation.PINTEREST_ACCESS_TOKEN", None):
            assert get_headers() == {}

def test_get_headers_with_token():
    with patch("scripts.pinterest_automation.PINTEREST_ACCESS_TOKEN", "test_token"):
        headers = get_headers()
        assert headers["Authorization"] == "Bearer test_token"
        assert headers["Content-Type"] == "application/json"

@patch("requests.get")
def test_get_boards_success(mock_get):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"items": [{"id": "board1", "name": "Board 1"}]}
    mock_get.return_value = mock_response

    boards = get_boards()
    assert len(boards) == 1
    assert boards[0]["id"] == "board1"

@patch("requests.get")
def test_get_boards_failure(mock_get):
    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_response.text = "Unauthorized"
    mock_get.return_value = mock_response

    boards = get_boards()
    assert boards == []

@patch("requests.post")
def test_create_pin_success(mock_post):
    mock_response = MagicMock()
    mock_response.status_code = 201
    mock_response.json.return_value = {"id": "pin1"}
    mock_post.return_value = mock_response

    result = create_pin("board1", "Title", "Desc", "link", "img")
    assert result == {"id": "pin1"}

@patch("requests.post")
def test_create_pin_failure(mock_post):
    mock_response = MagicMock()
    mock_response.status_code = 400
    mock_response.text = "Bad Request"
    mock_post.return_value = mock_response

    result = create_pin("board1", "Title", "Desc", "link", "img")
    assert result is None

# Better approach for file loading tests
def test_load_daily_facts_exists():
    mock_data = [{"id": 1, "text": "Fact"}]
    with patch("pathlib.Path.exists", return_value=True):
        with patch("builtins.open", MagicMock()):
            with patch("json.load", return_value=mock_data):
                facts = load_daily_facts()
                assert facts == mock_data

def test_load_daily_facts_not_exists():
    with patch("pathlib.Path.exists", return_value=False):
        facts = load_daily_facts()
        assert facts == []

def test_load_directory_items_exists():
    mock_data = [{"title": "Tool"}]
    with patch("pathlib.Path.exists", return_value=True):
        with patch("builtins.open", MagicMock()):
            with patch("json.load", return_value=mock_data):
                items = load_directory_items("tools-directory")
                assert items == mock_data

@patch("scripts.pinterest_automation.get_boards")
@patch("scripts.pinterest_automation.load_daily_facts")
@patch("scripts.pinterest_automation.load_directory_items")
@patch("scripts.pinterest_automation.create_pin")
@patch("time.sleep")
def test_automate_pinning(mock_sleep, mock_create, mock_load_dir, mock_load_facts, mock_get_boards):
    mock_get_boards.return_value = [{"id": "board1", "name": "Default"}]
    mock_load_facts.return_value = [{"category": "Cat", "text": "Fact"}]
    mock_load_dir.return_value = [{"title": "Tool", "description": "Desc", "slug": "slug"}]
    
    automate_pinning(limit_per_category=1)
    
    assert mock_create.call_count >= 2 # One for daily facts, one for at least one directory
    mock_sleep.assert_called()

@patch("scripts.pinterest_automation.get_boards")
def test_automate_pinning_no_boards(mock_get_boards):
    mock_get_boards.return_value = []
    with patch("scripts.pinterest_automation.create_pin") as mock_create:
        automate_pinning()
        mock_create.assert_not_called()
