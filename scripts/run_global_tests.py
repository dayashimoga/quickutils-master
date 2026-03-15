import subprocess
import os
import sys
import json
from pathlib import Path

# Base directories
BASE_DIR = Path(r"h:\boring")
PROJECTS_DIR = BASE_DIR / "projects"

# List all project directories from projects.json if possible, or manual list
dirs = [str(BASE_DIR)]
if (BASE_DIR / "projects.json").exists():
    with open(BASE_DIR / "projects.json", "r") as f:
        projects_data = json.load(f)
        for p_key, p_val in projects_data.items():
            p_path = PROJECTS_DIR / p_val.get("directory", p_key)
            if p_path.exists():
                dirs.append(str(p_path))

def run_tests_in_dir(d):
    print(f"\n{'='*60}")
    print(f"RUNNING TESTS IN: {d}")
    print(f"{'='*60}")
    
    success = True
    
    # 1. Run Pytest with Coverage
    print(f"--- Running Pytest ---")
    try:
        # Avoid coverage for very small projects or use standard approach
        cmd = [sys.executable, "-m", "pytest", "tests/", "--cov=scripts", "--cov-report=term-missing"]
        if "boringwebsite" in d:
             # boringwebsite might not have 'scripts' inside but uses root scripts
             cmd = [sys.executable, "-m", "pytest", "tests/"] 
             
        res = subprocess.run(cmd, cwd=d, capture_output=True, text=True, check=False)
        print(res.stdout)
        if res.returncode != 0:
            print(f"❌ Pytest failed with exit code {res.returncode}")
            print(res.stderr)
            success = False
        else:
            print(f"✅ Pytest passed")
    except Exception as e:
        print(f"❌ Pytest execution error: {e}")
        success = False

    # 2. Run Smoke Test (if dist exists or after a build)
    dist_dir = Path(d) / "dist"
    if dist_dir.exists():
        print(f"--- Running Smoke Test ---")
        smoke_cmd = [sys.executable, str(BASE_DIR / "scripts" / "smoke_test.py"), str(dist_dir)]
        sres = subprocess.run(smoke_cmd, capture_output=True, text=True)
        print(sres.stdout)
        if sres.returncode != 0:
            success = False

    return success

if __name__ == "__main__":
    results = []
    for d in dirs:
        success = run_tests_in_dir(d)
        results.append((d, success))

    print(f"\n{'='*60}")
    print("FINAL GLOBAL TEST REPORT")
    print(f"{'='*60}")
    all_passed = True
    for d, success in results:
        status = "PASSED" if success else "FAILED"
        print(f"{os.path.basename(d):35} | {status}")
        if not success: all_passed = False

    if all_passed:
        print("\n✅ ALL PROJECTS PASSED WITH REQUIRED COVERAGE AND SMOKE TESTS.")
        sys.exit(0)
    else:
        print("\n❌ SOME PROJECTS FAILED. REVIEW LOGS ABOVE.")
        sys.exit(1)
