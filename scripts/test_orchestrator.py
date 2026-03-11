import os
import subprocess
import json
import sys
from pathlib import Path

def run_command(command, cwd):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass
    print(f"--- Running: {' '.join(command)} in {cwd} ---")
    env = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUTF8="1")
    try:
        result = subprocess.run(command, cwd=cwd, capture_output=True, text=True, encoding='utf-8', env=env)
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return 1, "", str(e)

def main():
    base_dir = Path(__file__).parent.parent
    root_dir = base_dir / "projects"
    
    if not root_dir.exists():
        print(f"Error: Projects directory not found at {root_dir}")
        sys.exit(1)
        
    results = []
    
    # 1. Process Master Repository (Full Coverage)
    print("\n--- Testing Master Repository ---")
    code, out, err = run_command(["pytest", "--cov=scripts", "--cov-report=json:coverage.json", "tests/"], base_dir)
    cov_file = base_dir / "coverage.json"
    master_cov = 0
    if cov_file.exists():
        with open(cov_file, 'r') as f:
            data = json.load(f)
            master_cov = data['totals']['percent_covered']
            results.append({"name": "quickutils-master", "coverage": master_cov, "status": "PASS" if code == 0 else "FAIL:\n" + out[-500:]})
    else:
        results.append({"name": "quickutils-master", "coverage": 0, "status": "FAIL (No Coverage)"})

    # 2. Process Python Directory Projects (Pass/Fail Only)
    python_projects = [d for d in root_dir.iterdir() if d.is_dir() and d.name.endswith("-directory")]
    for proj in python_projects:
        if not (proj / "tests").exists():
             results.append({"name": proj.name, "coverage": "N/A", "status": "SKIPPED (No Tests)"})
             continue
             
        code, out, err = run_command(["pytest", "tests/test_core_optimized.py"], proj)
        results.append({"name": proj.name, "coverage": "N/A", "status": "PASS" if code == 0 else "FAIL"})

    # 3. Process Node.js Project (boringwebsite)
    node_proj = root_dir / "boringwebsite"
    if node_proj.exists():
        try:
            subprocess.run(["npm", "--version"], capture_output=True, check=True)
            code, out, err = run_command(["npm", "test", "--", "--passWithNoTests"], node_proj)
            results.append({"name": "boringwebsite", "coverage": "N/A", "status": "PASS" if code == 0 else "FAIL"})
        except (FileNotFoundError, subprocess.CalledProcessError):
            print("  ⚠️ Warning: npm not found. Skipping Node.js tests for boringwebsite.")
            results.append({"name": "boringwebsite", "coverage": "N/A", "status": "SKIPPED (npm not found)"})

    # 4. Report
    print("\n" + "="*40)
    print("GLOBAL NETWORK TEST REPORT")
    print("="*40)
    all_pass = True
    for r in results:
        cov_str = f"{r['coverage']:>6.2f}%" if isinstance(r['coverage'], (int, float)) else f"{r['coverage']:>7}"
        status_line = r['status'].split("\n")[0]
        print(f"{r['name']:<25} | {cov_str} | {status_line}")
        if not r['status'].startswith("PASS") and not r['status'].startswith("SKIPPED"):
            all_pass = False
            if "FAIL:\n" in r['status']:
                print(r['status'])
    
    print("-"*40)
    print(f"MASTER SCRIPT COVERAGE: {master_cov:.2f}%")
    print(f"OVERALL STATUS: {'SUCCESS' if (all_pass and master_cov >= 90) else 'FAILURE'}")
    
    if not all_pass or master_cov < 90:
        sys.exit(1)

if __name__ == '__main__':
    main()
