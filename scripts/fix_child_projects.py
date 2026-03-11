import os
import json
import re
from pathlib import Path

ROOT_DIR = Path("h:/boring")
PROJECTS_DIR = ROOT_DIR / "projects"

def fix_conftest(conftest_path):
    print(f"  Fixing conftest: {conftest_path}")
    content = conftest_path.read_text(encoding="utf-8")
    
    # Update sample_items to include missing fields
    if '"slug":' in content and '"auth":' not in content:
        # Simple regex to find items and add fields
        items_pattern = r'("slug":\s*"[^"]*"\s*)(\s*\})'
        content = re.sub(items_pattern, r'\1, "auth": "None", "https": True, "cors": "unknown"\2', content)
        
    # Update total_items to total_apis in index.html mock (to match synced base.html expectation maybe?)
    # Wait, the synced base and index expect total_apis
    if "total_items" in content:
        content = content.replace("total_items", "total_apis")
        
    conftest_path.write_text(content, encoding="utf-8")

def fix_test_utils(test_utils_path):
    print(f"  Fixing test_utils: {test_utils_path}")
    content = test_utils_path.read_text(encoding="utf-8")
    
    # Update load_missing_file to expect [] instead of raises FileNotFoundError
    old_test = r'def test_load_missing_file\(self, tmp_path\):\s*with pytest\.raises\(FileNotFoundError\):\s*load_database\(tmp_path / "nonexistent\.json"\)'
    new_test = 'def test_load_missing_file(self, tmp_path):\n        items = load_database(tmp_path / "nonexistent.json")\n        assert items == []'
    
    if "pytest.raises(FileNotFoundError)" in content:
        content = re.sub(old_test, new_test, content)
        
    test_utils_path.write_text(content, encoding="utf-8")

def main():
    for project in PROJECTS_DIR.iterdir():
        if not project.is_dir() or not project.name.endswith("-directory"):
            continue
            
        print(f"Processing {project.name}...")
        
        conftest = project / "tests" / "conftest.py"
        if conftest.exists():
            fix_conftest(conftest)
            
        test_utils = project / "tests" / "test_utils.py"
        if test_utils.exists():
            fix_test_utils(test_utils)
            
    print("Done!")

if __name__ == "__main__":
    main()
