# run_tests_isolated.ps1 - Automated test runner with strict environment isolation
# Usage: .\run_tests_isolated.ps1 [RepoPath1] [RepoPath2] ...
# If no args, tests the current directory and all subdirectories in projects/

param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$RepoPaths
)

$ErrorActionPreference = "Continue"
$script:allPassed = $true

function Test-Repo {
    param([string]$RepoPath)

    $repoName = Split-Path $RepoPath -Leaf
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  Testing: $repoName" -ForegroundColor Cyan
    Write-Host "  Path:    $RepoPath" -ForegroundColor DarkGray
    Write-Host "========================================" -ForegroundColor Cyan

    $reqFile = Join-Path $RepoPath "requirements.txt"
    $pkgFile = Join-Path $RepoPath "package.json"

    if (-not (Test-Path $reqFile) -and -not (Test-Path $pkgFile)) {
        Write-Host "  [SKIP] No requirements.txt or package.json found." -ForegroundColor Yellow
        return
    }

    # --- PYTHON TESTS ---
    if (Test-Path $reqFile) {
        $venvDir = Join-Path $RepoPath ".test-venv"
        $activate = Join-Path $venvDir "Scripts\Activate.ps1"

        try {
            Write-Host "  [PYTHON] Creating isolated venv..." -ForegroundColor DarkGray
            python -m venv $venvDir 2>$null
            
            if (-not (Test-Path $activate)) {
                Write-Host "  [FAIL] Could not create venv at $venvDir" -ForegroundColor Red
                $script:allPassed = $false
            } else {
                Write-Host "  [PYTHON] Installing dependencies..." -ForegroundColor DarkGray
                & $activate
                & "$venvDir\Scripts\pip.exe" install -q -r $reqFile 2>$null
                
                # Check if pytest is installed, if not, install it
                & "$venvDir\Scripts\pip.exe" install -q pytest pytest-cov responses 2>$null

                Write-Host "  [PYTHON] Running pytest..." -ForegroundColor DarkGray
                Push-Location $RepoPath
                & "$venvDir\Scripts\python.exe" -m pytest tests/ -q --tb=short 2>&1 | ForEach-Object { Write-Host "    $_" }
                $testExitCode = $LASTEXITCODE
                Pop-Location

                if ($testExitCode -eq 0) {
                    Write-Host "  [PASS] Python tests passed!" -ForegroundColor Green
                } else {
                    Write-Host "  [FAIL] Python tests failed (exit code: $testExitCode)" -ForegroundColor Red
                    $script:allPassed = $false
                }
            }
        }
        finally {
            Write-Host "  [PYTHON] Removing virtual environment..." -ForegroundColor DarkGray
            if (Test-Path $venvDir) {
                Remove-Item -Recurse -Force $venvDir 2>$null
            }
        }
    }

    # --- NODE/PLAYWRIGHT TESTS ---
    if (Test-Path $pkgFile) {
        Write-Host "  [NODE] Running tests using isolated Docker container..." -ForegroundColor DarkGray
        
        # We mount the directory into a playwright container to ensure UI tests have browsers
        # Replace backslashes for Docker volume mapping on Windows
        $containerPath = "/app"
        $winPath = $RepoPath -replace '\\', '/'
        
        $dockerCmd = "docker run --rm -v ""${winPath}:${containerPath}"" -w ${containerPath} mcr.microsoft.com/playwright:v1.40.0-jammy /bin/bash -c ""npm ci && npm test"""
        
        try {
            Push-Location $RepoPath
            Invoke-Expression $dockerCmd 2>&1 | ForEach-Object { Write-Host "    $_" }
            $dockerExitCode = $LASTEXITCODE
            Pop-Location

            if ($dockerExitCode -eq 0) {
                Write-Host "  [PASS] Node/UI tests passed!" -ForegroundColor Green
            } else {
                Write-Host "  [FAIL] Node/UI tests failed (exit code: $dockerExitCode)" -ForegroundColor Red
                $script:allPassed = $false
            }
        } catch {
            Write-Host "  [FAIL] Docker execution error: $_" -ForegroundColor Red
            $script:allPassed = $false
        }
    }
}

# Determine which repos to test
if ($RepoPaths.Count -eq 0) {
    $subProjects = Get-ChildItem -Path (Join-Path (Get-Location).Path "projects") -Directory | Select-Object -ExpandProperty FullName
    $rootProject = (Get-Location).Path
    $RepoPaths = @($rootProject) + $subProjects
}

Write-Host "`nStrict Isolated Test Runner (venv + Docker)" -ForegroundColor Magenta
Write-Host "Testing $($RepoPaths.Count) repo(s)...`n" -ForegroundColor Magenta

foreach ($repo in $RepoPaths) {
    if (Test-Path $repo) {
        Test-Repo -RepoPath $repo
    } else {
        Write-Host "[WARN] Path not found: $repo" -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
if ($script:allPassed) {
    Write-Host "  ALL ISOLATED TESTS PASSED" -ForegroundColor Green
} else {
    Write-Host "  SOME TESTS FAILED" -ForegroundColor Red
}
Write-Host "========================================`n" -ForegroundColor Cyan
