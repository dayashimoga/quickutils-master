# verify_all.ps1
# Simple flat verification script

$ErrorActionPreference = "Stop"

function Check-Exit {
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

Write-Host "🚀 Starting boringwebsite..." -ForegroundColor Cyan
pushd "H:\boringwebsite"
docker build -t boringwebsite-test .
Check-Exit
docker run --rm boringwebsite-test npm run test:coverage
Check-Exit
popd

Write-Host "🚀 Starting dailyfacts..." -ForegroundColor Cyan
pushd "H:\boring\projects\dailyfacts"
"FROM node:20-alpine" | Out-File Dockerfile.test -Encoding UTF8
"WORKDIR /app" | Add-Content Dockerfile.test
"COPY package*.json ./" | Add-Content Dockerfile.test
"RUN npm install" | Add-Content Dockerfile.test
"COPY . ." | Add-Content Dockerfile.test
'CMD ["npm", "run", "test:coverage"]' | Add-Content Dockerfile.test
docker build -t dailyfacts-test -f Dockerfile.test .
Check-Exit
docker run --rm dailyfacts-test
Check-Exit
Remove-Item Dockerfile.test
popd

Write-Host "🚀 Starting boring (core)..." -ForegroundColor Cyan
pushd "H:\boring"
"FROM python:3.11-slim" | Out-File Dockerfile.test -Encoding UTF8
"WORKDIR /app" | Add-Content Dockerfile.test
"COPY . ." | Add-Content Dockerfile.test
"RUN pip install pytest pytest-cov pytest-asyncio aiohttp jinja2 responses requests htmlmin" | Add-Content Dockerfile.test
'CMD ["pytest", "tests/", "--cov=scripts", "--cov-report=term", "--cov-fail-under=90"]' | Add-Content Dockerfile.test
docker build -t boring-test -f Dockerfile.test .
Check-Exit
docker run --rm boring-test
Check-Exit
Remove-Item Dockerfile.test
popd

Write-Host "🚀 Starting datasets-directory..." -ForegroundColor Cyan
pushd "H:\boring\projects\datasets-directory"
"FROM python:3.11-slim" | Out-File Dockerfile.test -Encoding UTF8
"WORKDIR /app" | Add-Content Dockerfile.test
"COPY . ." | Add-Content Dockerfile.test
"RUN pip install pytest pytest-cov pytest-asyncio aiohttp jinja2 responses requests" | Add-Content Dockerfile.test
'CMD ["pytest", "tests/", "--cov=scripts", "--cov-report=term", "--cov-fail-under=90"]' | Add-Content Dockerfile.test
docker build -t datasets-test -f Dockerfile.test .
Check-Exit
docker run --rm datasets-test
Check-Exit
Remove-Item Dockerfile.test
popd

Write-Host "🚀 Starting opensource-directory..." -ForegroundColor Cyan
pushd "H:\boring\projects\opensource-directory"
"FROM python:3.11-slim" | Out-File Dockerfile.test -Encoding UTF8
"WORKDIR /app" | Add-Content Dockerfile.test
"COPY . ." | Add-Content Dockerfile.test
"RUN pip install pytest pytest-cov pytest-asyncio aiohttp jinja2 responses requests" | Add-Content Dockerfile.test
'CMD ["pytest", "tests/", "--cov=scripts", "--cov-report=term", "--cov-fail-under=90"]' | Add-Content Dockerfile.test
docker build -t opensource-test -f Dockerfile.test .
Check-Exit
docker run --rm opensource-test
Check-Exit
Remove-Item Dockerfile.test
popd

Write-Host "🚀 Starting tools-directory..." -ForegroundColor Cyan
pushd "H:\boring\projects\tools-directory"
"FROM python:3.11-slim" | Out-File Dockerfile.test -Encoding UTF8
"WORKDIR /app" | Add-Content Dockerfile.test
"COPY . ." | Add-Content Dockerfile.test
"RUN pip install pytest pytest-cov pytest-asyncio aiohttp jinja2 responses requests" | Add-Content Dockerfile.test
'CMD ["pytest", "tests/", "--cov=scripts", "--cov-report=term", "--cov-fail-under=90"]' | Add-Content Dockerfile.test
docker build -t tools-test -f Dockerfile.test .
Check-Exit
docker run --rm tools-test
Check-Exit
Remove-Item Dockerfile.test
popd

Write-Host "🎉 All projects verified!" -ForegroundColor Green
