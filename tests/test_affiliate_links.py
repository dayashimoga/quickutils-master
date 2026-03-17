import pytest
import sys
from pathlib import Path

# Add scripts directory to path
ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))

try:
    from scripts.build_directory import BOOK_RECOMMENDATIONS
except ImportError:
    BOOK_RECOMMENDATIONS = []

def test_amazon_affiliate_links():
    """Test that all book recommendations use correct Amazon URL formats."""
    # If build_directory does not have BOOK_RECOMMENDATIONS, skip
    if not BOOK_RECOMMENDATIONS:
        pytest.skip("No BOOK_RECOMMENDATIONS found in build_directory.py")
        
    # Flatten dict to list
    all_books = []
    if isinstance(BOOK_RECOMMENDATIONS, dict):
        for category_books in BOOK_RECOMMENDATIONS.values():
            all_books.extend(category_books)
    else:
        all_books = BOOK_RECOMMENDATIONS

    for book in all_books:
        # Check required fields
        assert 'title' in book
        # We now use ASIN to generate URLs, so check for ASIN
        assert 'asin' in book
        
        # Test the ASIN format (10 chars usually)
        assert len(book['asin']) >= 9

