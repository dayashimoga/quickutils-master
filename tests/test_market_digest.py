import pytest
import json
import urllib.request
import importlib.util
import sys
from unittest.mock import patch, MagicMock

# Dynamically load the module because the folder has a hyphen
spec = importlib.util.spec_from_file_location("fetch_data", "projects/market-digest/fetch_data.py")
fetch_data = importlib.util.module_from_spec(spec)
sys.modules["fetch_data"] = fetch_data
spec.loader.exec_module(fetch_data)

calculate_rsi = fetch_data.calculate_rsi
calculate_macd = fetch_data.calculate_macd
get_signal = fetch_data.get_signal
detect_patterns = fetch_data.detect_patterns
calculate_deltas = fetch_data.calculate_deltas
calculate_forecast = fetch_data.calculate_forecast
fetch_yahoo_finance = fetch_data.fetch_yahoo_finance
fetch_rss_news = fetch_data.fetch_rss_news
main = fetch_data.main

def test_calculate_rsi():
    prices = [100, 102, 104, 103, 105, 107, 106, 108, 110, 109, 111, 113, 112, 114, 116]
    rsi = calculate_rsi(prices, 14)
    assert 0 <= rsi <= 100

    assert calculate_rsi([100]) == 50.0

def test_calculate_macd():
    prices = list(range(100, 150))
    macd = calculate_macd(prices)
    assert "macd" in macd
    assert "signal" in macd
    assert "hist" in macd

    assert calculate_macd([1]) == {"macd": 0, "signal": 0, "hist": 0}

def test_get_signal():
    assert get_signal(100, [100]*29) == "Hold"
    history = list(range(100, 131)) # 30 days
    assert get_signal(131, history) in ["Buy", "Strong Buy", "Hold", "Sell", "Strong Sell"]

def test_detect_patterns():
    assert detect_patterns([100]*29)["pattern"] == "None"
    history = list(range(100, 131))
    assert detect_patterns(history)["pattern"] in ["Bull Flag", "Cup & Handle", "Head & Shoulders", "Consolidation"]

def test_calculate_forecast():
    prices = list(range(100, 131))
    forecast = calculate_forecast(prices, 7)
    assert len(forecast) == 7
    assert forecast[0] > 100

    short_prices = [100, 101]
    assert calculate_forecast(short_prices, 7) == [101, 101, 101, 101, 101, 101, 101]

def test_calculate_deltas():
    history = list(range(100, 250))
    deltas = calculate_deltas(history)
    assert "delta_1d" in deltas
    assert "forecast_7d" in deltas
    assert "signal" in deltas

    assert calculate_deltas([])["current"] == 0

@patch('urllib.request.urlopen')
def test_fetch_yahoo_finance(mock_urlopen):
    mock_res = MagicMock()
    mock_res.read.return_value = json.dumps({
        "chart": {
            "result": [{
                "timestamp": [1620000000, 1620086400],
                "indicators": {"quote": [{"close": [100.0, 105.0]}]}
            }]
        }
    }).encode('utf-8')
    mock_urlopen.return_value = mock_res
    
    res = fetch_yahoo_finance('TEST')
    assert res == [100.0, 105.0]

@patch('urllib.request.urlopen')
def test_fetch_rss_news(mock_urlopen):
    mock_res = MagicMock()
    xml_content = """<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
    <channel>
      <title>Test News</title>
      <item>
        <title>Stock up</title>
        <link>http://example.com</link>
        <pubDate>Fri, 24 Apr 2026 00:00:00 GMT</pubDate>
      </item>
    </channel>
    </rss>"""
    mock_res.read.return_value = xml_content.encode('utf-8')
    mock_urlopen.return_value = mock_res
    
    news = fetch_rss_news([('http://test', 'Test Source')], limit=1)
    assert len(news) == 1
    assert news[0]['title'] == 'Stock up'

@patch.object(fetch_data, 'fetch_yahoo_finance')
@patch.object(fetch_data, 'fetch_rss_news')
@patch('time.sleep')
def test_main(mock_sleep, mock_rss, mock_yahoo):
    mock_yahoo.return_value = list(range(100, 350))
    mock_rss.return_value = [{"title": "Test", "link": "link", "time": "now", "source": "src"}]
    
    # Run main which writes to data.json
    main()
    
    with open('data.json', 'r') as f:
        data = json.load(f)
        
    assert "marketData" in data
    assert "macroData" in data
    assert data["marketData"]["regional"]["nifty"]["current"] == 349.0
    assert data["marketData"]["sectors"]["IT"]["current"] == 349.0
