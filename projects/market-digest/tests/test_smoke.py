import unittest
import os
import json

class TestMarketDigestSmoke(unittest.TestCase):
    def setUp(self):
        self.base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

    def test_essential_files_exist(self):
        for filename in ['index.html', 'style.css', 'script.js', 'data.json']:
            path = os.path.join(self.base_path, filename)
            self.assertTrue(os.path.exists(path), f"Missing essential file: {filename}")

    def test_index_html_content(self):
        path = os.path.join(self.base_path, 'index.html')
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            self.assertIn('<link rel="stylesheet" href="style.css">', content)
            self.assertIn('<script src="script.js"></script>', content)
            self.assertIn('Market Digest', content)

    def test_data_json_validity(self):
        path = os.path.join(self.base_path, 'data.json')
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            self.assertIn('marketData', data)
            self.assertIn('regional', data['marketData'])
            self.assertIn('global', data['marketData'])

if __name__ == '__main__':
    unittest.main()
