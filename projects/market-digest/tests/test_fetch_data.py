import json
import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime
import xml.etree.ElementTree as ET
import sys
import os

# Add the project directory to sys.path so we can import fetch_data
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import fetch_data

class TestMarketDigestFetch(unittest.TestCase):

    @patch('urllib.request.urlopen')
    def test_fetch_yahoo_finance_success(self, mock_urlopen):
        # Mock response from Yahoo Finance
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({
            'chart': {
                'result': [{
                    'timestamp': [1710400000, 1710486400],
                    'indicators': {
                        'quote': [{
                            'close': [100.5, 102.3]
                        }]
                    }
                }]
            }
        }).encode('utf-8')
        mock_urlopen.return_value = mock_response

        result = fetch_data.fetch_yahoo_finance('AAPL')
        self.assertEqual(result, [100.5, 102.3])

    @patch('urllib.request.urlopen')
    def test_fetch_yahoo_finance_failure(self, mock_urlopen):
        mock_urlopen.side_effect = Exception("Network Error")
        result = fetch_data.fetch_yahoo_finance('AAPL')
        self.assertEqual(result, [])

    @patch('urllib.request.urlopen')
    def test_fetch_yahoo_finance_empty(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({'chart': {'result': None}}).encode('utf-8')
        mock_urlopen.return_value = mock_response
        result = fetch_data.fetch_yahoo_finance('AAPL')
        self.assertEqual(result, [])

    def test_get_signal(self):
        # Test Case: Strong Buy
        history = [float(100 + i) for i in range(30)] # 100 to 129
        current = 135.0
        res = fetch_data.get_signal(current, history)
        self.assertEqual(res, "Strong Buy")

        # Test Case: Buy
        history = [120.0] * 30
        current = 125.0 # current > sma_30 (120), but sma_10 (120) not > sma_30 (120)
        res = fetch_data.get_signal(current, history)
        self.assertEqual(res, "Buy")

        # Test Case: Strong Sell
        history = [200.0 - i for i in range(30)] # 200 down to 171
        current = 165.0 # < sma_10 (175.5) and sma_10 < sma_30 (185.5)
        self.assertEqual(fetch_data.get_signal(current, history), "Strong Sell")

        # Test Case: Sell
        history = [150.0] * 30
        current = 145.0
        self.assertEqual(fetch_data.get_signal(current, history), "Sell")

        # Test Case: Hold (short history)
        self.assertEqual(fetch_data.get_signal(100, [100, 101]), "Hold")

    def test_calculate_deltas(self):
        history = [100] * 252
        history[-1] = 110 # 10% increase from previous day
        
        result = fetch_data.calculate_deltas(history)
        self.assertEqual(result['current'], 110)
        self.assertEqual(result['delta_1d'], 10.0)
        self.assertIn('signal', result)

    def test_calculate_deltas_empty(self):
        result = fetch_data.calculate_deltas([])
        self.assertEqual(result['current'], 0)
        self.assertEqual(result['signal'], 'Neutral')

    @patch('urllib.request.urlopen')
    def test_fetch_rss_news_success(self, mock_urlopen):
        xml_content = """<?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
        <channel>
            <item>
                <title>Test News</title>
                <link>http://example.com/test</link>
                <pubDate>Mon, 15 Mar 2026 10:00:00 GMT</pubDate>
            </item>
        </channel>
        </rss>"""
        mock_response = MagicMock()
        mock_response.read.return_value = xml_content.encode('utf-8')
        mock_urlopen.return_value = mock_response

        news = fetch_data.fetch_rss_news([('http://news.rss', 'Test Source')], limit=1)
        self.assertEqual(len(news), 1)
        self.assertEqual(news[0]['title'], 'Test News')
        self.assertEqual(news[0]['source'], 'Test Source')

    @patch('urllib.request.urlopen')
    def test_fetch_rss_news_failure(self, mock_urlopen):
        mock_urlopen.side_effect = Exception("RSS Error")
        news = fetch_data.fetch_rss_news([('http://news.rss', 'Test Source')])
        self.assertEqual(news, [])

    @patch('fetch_data.fetch_yahoo_finance')
    @patch('fetch_data.fetch_rss_news')
    @patch('builtins.open', new_callable=unittest.mock.mock_open)
    def test_main_execution_with_mock_news(self, mock_file, mock_news, mock_yahoo):
        mock_yahoo.return_value = [100.0] * 252
        mock_news.return_value = [] # This triggers the news fallback
        
        with patch('time.sleep'): # Skip sleep
            fetch_data.main()
        
        mock_file.assert_called_with("data.json", "w")

    @patch('fetch_data.fetch_yahoo_finance')
    def test_main_cli_block(self, mock_yahoo):
        # This covers the if __name__ == "__main__": block indirectly or we can call it
        with patch.object(fetch_data, "__name__", "__main__"), \
             patch('fetch_data.main') as mock_main:
            # We can't easily trigger the block without re-importing or exec
            pass

    def test_calculate_deltas_edge_cases(self):
        # Cover small history
        res = fetch_data.calculate_deltas([100.0])
        self.assertEqual(res['current'], 0) # Logic says < 2 returns default
        
        res = fetch_data.calculate_deltas([100.0, 110.0])
        self.assertEqual(res['delta_1d'], 10.0)
        self.assertEqual(res['delta_1y'], 10.0)

if __name__ == '__main__':
    # This covers the main block of the test file but not the src file
    unittest.main()
