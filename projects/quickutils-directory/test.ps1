# test.ps1 - Automated test runner with virtual environment isolation
# Usage: .\test.ps1 [RepoPath1] [RepoPath2] ...
# If no args, tests the current directory.
# Creates a venv, installs requirements.txt, runs pytest with coverage, then removes the venv.

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
    if (-not (Test-Path $reqFile)) {
        Write-Host "  [SKIP] No requirements.txt found." -ForegroundColor Yellow
        return
    }

    $venvDir = Join-Path $RepoPath ".test-venv"
    $activate = Join-Path $venvDir "Scripts\Activate.ps1"

    try {
        # Step 1: Create virtual environment
        Write-Host "  [1/4] Creating virtual environment..." -ForegroundColor DarkGray
        python -m venv $venvDir 2>$null
        if (-not (Test-Path $activate)) {
            Write-Host "  [FAIL] Could not create venv at $venvDir" -ForegroundColor Red
            $script:allPassed = $false
            return
        }

        # Step 2: Activate and install dependencies
        Write-Host "  [2/4] Installing dependencies..." -ForegroundColor DarkGray
        & $activate
        & "$venvDir\Scripts\pip.exe" install -q -r $reqFile 2>$null

        # Step 3: Run pytest
        Write-Host "  [3/4] Running pytest..." -ForegroundColor DarkGray
        Push-Location $RepoPath
        & "$venvDir\Scripts\python.exe" -m pytest tests/ -q --tb=short 2>&1 | ForEach-Object { Write-Host "    $_" }
        $testExitCode = $LASTEXITCODE
        Pop-Location

        if ($testExitCode -eq 0) {
            Write-Host "  [PASS] All tests passed!" -ForegroundColor Green
        } else {
            Write-Host "  [FAIL] Tests failed (exit code: $testExitCode)" -ForegroundColor Red
            $script:allPassed = $false
        }
    }
    finally {
        # Step 4: Cleanup virtual environment
        Write-Host "  [4/4] Removing virtual environment..." -ForegroundColor DarkGray
        if (Test-Path $venvDir) {
            Remove-Item -Recurse -Force $venvDir 2>$null
        }
    }
}

# Determine which repos to test
if ($RepoPaths.Count -eq 0) {
    $RepoPaths = @((Get-Location).Path)
}

Write-Host "`nQuickUtils Test Runner (venv-isolated)" -ForegroundColor Magenta
Write-Host "Testing $($RepoPaths.Count) repo(s)...`n" -ForegroundColor Magenta

foreach ($repo in $RepoPaths) {
    $resolvedPath = Resolve-Path $repo -ErrorAction SilentlyContinue
    if ($resolvedPath) {
        Test-Repo -RepoPath $resolvedPath.Path
    } else {
        Write-Host "[WARN] Path not found: $repo" -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
if ($script:allPassed) {
    Write-Host "  ALL REPOS PASSED" -ForegroundColor Green
} else {
    Write-Host "  SOME REPOS FAILED" -ForegroundColor Red
}
Write-Host "========================================`n" -ForegroundColor Cyan
