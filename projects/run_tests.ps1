$ErrorActionPreference = "Stop"

Write-Host "=========================================="
Write-Host " QuickUtils Dockerized Vitest Runner"
Write-Host "=========================================="

# Ensure Docker is running
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker is not running or not accessible. Please start Docker Desktop."
    exit 1
}

$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "Building test container..."
docker build -t quickutils-tests $projectRoot

Write-Host "Running tests in isolated container..."
docker run --rm -v "$($projectRoot)/coverage:/app/coverage" quickutils-tests

$testResult = $LASTEXITCODE

if ($testResult -eq 0) {
    Write-Host "[OK] All tests passed with target coverage!" -ForegroundColor Green
    Write-Host "Coverage report available at: $projectRoot\coverage\index.html"
} else {
    Write-Host "[X] Tests failed or coverage was not met!" -ForegroundColor Red
}

exit $testResult
