import os
import sys
from pathlib import Path

def smoke_test(dist_dir, expected_keywords=None):
    index_path = Path(dist_dir) / "index.html"
    if not index_path.exists():
        print(f"❌ Smoke Test Failed: {index_path} does not exist.")
        return False
    
    content = index_path.read_text(encoding="utf-8")
    if not content.strip():
        print(f"❌ Smoke Test Failed: {index_path} is empty.")
        return False
    
    if expected_keywords:
        for kw in expected_keywords:
            if kw.lower() not in content.lower():
                print(f"❌ Smoke Test Failed: Keyword '{kw}' not found in {index_path}")
                return False
                
    print(f"✅ Smoke Test Passed for {dist_dir}")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python smoke_test.py <dist_dir> [keyword1] [keyword2] ...")
        sys.exit(1)
        
    dist = sys.argv[1]
    args = list(sys.argv)
    keywords = args[2:] if len(args) > 2 else ["QuickUtils", "copyright"]
    if smoke_test(dist, keywords):
        sys.exit(0)
    else:
        sys.exit(1)
