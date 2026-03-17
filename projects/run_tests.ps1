$ErrorActionPreference = "Stop"

Write-Host "=========================================="
Write-Host "🚀 Starting Isolated Test Runner via Docker"
Write-Host "=========================================="

# Ensure Docker is running
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker is not running or not accessible. Please start Docker Desktop."
    exit 1
}

# The host directory
$projectRoot = "H:\boring\projects"

Write-Host "Pulling Playwright test image (mcr.microsoft.com/playwright:v1.40.0-jammy)..."
# Pull quietly
docker pull mcr.microsoft.com/playwright:v1.40.0-jammy -q

Write-Host "Running tests in isolated container..."
# Run the node container
# Map the H:\boring\projects directory to /projects in the container
# Use bash to install packages inside the test-runner folder and execute vitest & playwright
docker run --rm `
    -v "$($projectRoot):/projects" `
    -w /projects/test-runner `
    mcr.microsoft.com/playwright:v1.40.0-jammy `
    bash -c "npm install && npx playwright install --with-deps && npm test"

$testResult = $LASTEXITCODE

if ($testResult -eq 0) {
    Write-Host "✅ All tests passed successfully with target coverage!" -ForegroundColor Green
} else {
    Write-Host "❌ Tests failed or coverage was not met!" -ForegroundColor Red
}

exit $testResult
