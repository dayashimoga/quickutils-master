# Powershell Script to run ChessOS V2 Unit and E2E Test suites inside Docker containers

# Get absolute path of the root workspace directory
$WorkspaceRoot = (Get-Item "$PSScriptRoot\..\..").FullName

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "Step 1: Running ChessOS Vitest Unit Tests (Docker)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
docker run --rm -v "${WorkspaceRoot}:/app" -w /app node:20-slim npm run test:coverage

if ($LASTEXITCODE -ne 0) {
    Write-Error "Unit tests failed! Aborting E2E tests."
    Exit 1
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "Step 2: Running ChessOS Playwright E2E Tests (Docker)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
docker run --rm -v "${WorkspaceRoot}:/app" -w /app/projects/chessmaster-ai mcr.microsoft.com/playwright:v1.40.0-jammy /bin/bash -c "npm install && npx playwright test"

if ($LASTEXITCODE -ne 0) {
    Write-Error "E2E tests failed!"
    Exit 1
}

Write-Host "`n🎉 All test suites completed successfully!" -ForegroundColor Green
Exit 0
