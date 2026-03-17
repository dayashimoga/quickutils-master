import os
import subprocess
import json
import sys
from pathlib import Path

# Ensure UTF-8 output handles emojis/special chars across all environments
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

def run_command(command, cwd, root_dir):
    print(f"\n🚀 [EXECUTING] {' '.join(command)}")
    print(f"📂 [LOCATION]  {cwd}")
    
    # Inject root_dir into PYTHONPATH so projects can find 'scripts.utils'
    env = dict(os.environ, 
               PYTHONIOENCODING="utf-8", 
               PYTHONUTF8="1",
               PYTHONPATH=str(root_dir))
    try:
        # Use subprocess.Popen to stream output if possible, or just run
        result = subprocess.run(command, cwd=cwd, capture_output=True, text=True, encoding='utf-8', env=env)
        if result.returncode != 0:
            print(f"❌ [FAILED] {cwd.name}")
        else:
            print(f"✅ [PASSED] {cwd.name}")
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        print(f"💥 [ERROR] {e}")
        return 1, "", str(e)

def main():
    base_dir = Path(__file__).parent.parent
    projects_root = base_dir / "projects"
    
    if not projects_root.exists():
        print(f"❌ Error: Projects directory not found at {projects_root}")
        sys.exit(1)
        
    results = []
    
    # 1. Process Master Repository (Full Coverage)
    print("\n--- 🛠️  Testing Master Repository ---")
    # Clean up old coverage
    cov_file = base_dir / "coverage.json"
    if cov_file.exists():
        cov_file.unlink()

    code, out, err = run_command(["pytest", "--cov=scripts", "--cov-report=json:coverage.json", "tests/"], base_dir, base_dir)
    
    master_cov = 0
    if cov_file.exists():
        try:
            with open(cov_file, 'r') as f:
                data = json.load(f)
                master_cov = data['totals']['percent_covered']
        except Exception as e:
            print(f"  ⚠️ Warning: Failed to parse coverage.json: {e}")

    results.append({
        "name": "quickutils-master (parent)", 
        "coverage": master_cov, 
        "status": "PASS" if code == 0 else "FAIL",
        "full_out": out,
        "full_err": err
    })

    # 2. Process all project directories (Dynamic Discovery)
    print("\n--- 🧪 Testing Child Projects ---")
    all_items = sorted(list(projects_root.iterdir()))
    for proj in all_items:
        # Filtering logic
        if not proj.is_dir() or proj.name.startswith("."):
            continue
        
        # quickutils-master as a child is a duplicate of the parent
        if proj.name in ["quickutils-master", "boringwebsite", "dailyfacts"]:
            continue

        if not (proj / "tests").exists():
             results.append({"name": proj.name, "coverage": "N/A", "status": "SKIPPED (No Tests)"})
             continue
             
        # Run tests for Python-based projects
        code, out, err = run_command(["pytest", "tests/"], proj, base_dir)
        results.append({
            "name": proj.name, 
            "coverage": "N/A", 
            "status": "PASS" if code == 0 else "FAIL",
            "full_out": out,
            "full_err": err
        })

    # 3. Process Node.js Projects
    for node_proj_name in ["boringwebsite", "dailyfacts"]:
        node_proj = projects_root / node_proj_name
        if node_proj.exists():
            print(f"\n--- 📦 Testing Node.js Project: {node_proj_name} ---")
            try:
                subprocess.run(["npm", "--version"], capture_output=True, check=True)
                code, out, err = run_command(["npm", "test", "--", "--passWithNoTests"], node_proj, base_dir)
                results.append({
                    "name": node_proj_name, 
                    "coverage": "N/A", 
                    "status": "PASS" if code == 0 else "FAIL",
                    "full_out": out,
                    "full_err": err
                })
            except (FileNotFoundError, subprocess.CalledProcessError):
                print(f"  ⚠️ Warning: npm not found. Skipping Node.js tests for {node_proj_name}.")
                results.append({"name": node_proj_name, "coverage": "N/A", "status": "SKIPPED (npm not found)"})

    # 4. Global Report
    print("\n" + "="*70)
    print(f"{'GLOBAL NETWORK TEST REPORT':^70}")
    print("="*70)
    print(f"{'Project Name':<35} | {'Coverage':<12} | {'Status'}")
    print("-" * 70)
    
    all_pass = True
    for r in results:
        cov_val = r.get('coverage', 0)
        cov_str = f"{cov_val:>10.2f}%" if isinstance(cov_val, (int, float)) else f"{cov_val:>11}"
        # Safeguard against unexpected types in status
        status_raw = str(r['status'])
        status_line = status_raw.split("\n")[0]
        
        print(f"{r['name']:<35} | {cov_str} | {status_line}")
        
        if not status_raw.startswith("PASS") and not status_raw.startswith("SKIPPED"):
            all_pass = False

    print("="*70)
    print(f"MASTER SCRIPT COVERAGE: {master_cov:.2f}%")
    
    # Requirement: 100% pass rate and > 90% coverage
    success = all_pass and master_cov >= 90
    print(f"OVERALL STATUS: {'✅ SUCCESS' if success else '❌ FAILURE'}")
    print("="*70)
    
    # Detailed failure breakdown
    if not all_pass:
        print("\n--- Failure Details ---")
        for r in results:
            status_str = str(r['status'])
            if not status_str.startswith("PASS") and not status_str.startswith("SKIPPED"):
                print(f"\n🚨 [{r['name']}] FAILED")
                if r.get('full_out'):
                    print(f"STDOUT:\n{r['full_out']}")
                if r.get('full_err'):
                    print(f"STDERR:\n{r['full_err']}")

    if not success:
        sys.exit(1)

if __name__ == '__main__':
    main()
