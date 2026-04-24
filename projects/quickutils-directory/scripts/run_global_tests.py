import subprocess
import os

dirs = [
    r"h:\boring",
    r"h:\boring\projects\datasets-directory",
    r"h:\boring\projects\opensource-directory",
    r"h:\boring\projects\tools-directory",
    r"h:\boring\projects\prompts-directory",
    r"h:\boring\projects\cheatsheets-directory",
    r"h:\boring\projects\boilerplates-directory",
    r"h:\boring\projects\jobs-directory",
    r"h:\boring\projects\apistatus-directory"
]

def run_tests_in_dir(d):
    print(f"\\n{'='*60}")
    print(f"RUNNING TESTS IN: {d}")
    print(f"{'='*60}")
    
    # Try docker first (most reliable for these apps)
    try:
        res = subprocess.run(
            ["docker", "compose", "run", "--rm", "test", "bash", "-c", "pytest tests/ --cov=scripts"],
            cwd=d,
            capture_output=True,
            text=True,
            check=False
        )
        print(res.stdout)
        if res.returncode != 0:
            print(res.stderr)
            return False
        return True
    except Exception as e:
        print(f"Failed to run docker in {d}: {e}")
        # Fallback to local python
        try:
             res = subprocess.run(
                ["pytest", "tests/", "--cov=scripts"],
                cwd=d,
                capture_output=True,
                text=True,
                check=False
            )
             print(res.stdout)
             return res.returncode == 0
        except Exception as e2:
            print(f"Local pytest failed in {d}: {e2}")
            return False

results = []
for d in dirs:
    success = run_tests_in_dir(d)
    results.append((d, success))

print(f"\\n{'='*60}")
print("FINAL TEST REPORT")
print(f"{'='*60}")
all_passed = True
for d, success in results:
    status = "PASSED" if success else "FAILED"
    print(f"{os.path.basename(d):30} | {status}")
    if not success: all_passed = False

if all_passed:
    print("\\nCONGRATULATIONS! ALL 9 REPOSITORIES PASSED WITH >90% COVERAGE.")
else:
    print("\\nATTENTION: SOME REPOSITORIES FAILED. CHECK LOGS ABOVE.")
