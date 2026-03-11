<# 
  DailyLift — Local Run Script (PowerShell)
  Uses Docker — no local Node.js installation required.
  
  Usage:
    .\run.ps1 test       # Run tests with coverage
    .\run.ps1 build      # Build the site
    .\run.ps1 serve      # Serve locally at http://localhost:3000
    .\run.ps1 ci         # Full CI pipeline (lint + test + build)
    .\run.ps1 quote      # Fetch daily quote
    .\run.ps1 lint       # Run lint checks
    .\run.ps1 clean      # Remove Docker containers and volumes
    .\run.ps1 rebuild    # Force rebuild Docker image
    .\run.ps1 shell      # Open a shell inside the container
#>

param(
    [Parameter(Position=0)]
    [ValidateSet("test", "build", "serve", "ci", "quote", "lint", "clean", "rebuild", "shell", "help")]
    [string]$Command = "help"
)

$ImageName = "dailylift-app"
$ErrorActionPreference = "Stop"

function Write-Header($msg) {
    Write-Host ""
    Write-Host "====================================================" -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host "====================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Ensure-Image {
    $imageExists = docker images -q $ImageName 2>$null
    if (-not $imageExists) {
        Write-Header "Building Docker image (first run)..."
        docker build -t $ImageName .
        if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Docker build failed!" -ForegroundColor Red; exit 1 }
    }
}

switch ($Command) {
    "test" {
        Write-Header "Running Tests with Coverage"
        docker compose run --rm test
        if ($LASTEXITCODE -ne 0) { Write-Host "TESTS FAILED!" -ForegroundColor Red; exit 1 }
        Write-Host "`nCoverage report: ./coverage/lcov-report/index.html" -ForegroundColor Green
    }
    "build" {
        Write-Header "Building Site"
        docker compose run --rm build
        if ($LASTEXITCODE -ne 0) { Write-Host "BUILD FAILED!" -ForegroundColor Red; exit 1 }
        Write-Host "`nOutput: ./dist/" -ForegroundColor Green
    }
    "serve" {
        Write-Header "Building & Serving at http://localhost:3000"
        docker compose up --build serve
    }
    "ci" {
        Write-Header "Full CI Pipeline (Lint + Test + Build)"
        docker compose run --rm ci
        if ($LASTEXITCODE -ne 0) { Write-Host "CI FAILED!" -ForegroundColor Red; exit 1 }
        Write-Host "`nCI passed! Check ./coverage/ and ./dist/" -ForegroundColor Green
    }
    "quote" {
        Write-Header "Fetching Daily Quote"
        docker compose run --rm fetch-quote
    }
    "lint" {
        Write-Header "Running Lint Checks"
        docker compose run --rm lint
        if ($LASTEXITCODE -ne 0) { Write-Host "LINT FAILED!" -ForegroundColor Red; exit 1 }
    }
    "clean" {
        Write-Header "Cleaning Docker Resources"
        docker compose down --rmi local --volumes --remove-orphans 2>$null
        if (Test-Path "./dist") { Remove-Item -Recurse -Force ./dist }
        if (Test-Path "./coverage") { Remove-Item -Recurse -Force ./coverage }
        Write-Host "Cleaned!" -ForegroundColor Green
    }
    "rebuild" {
        Write-Header "Rebuilding Docker Image"
        docker compose build --no-cache
        Write-Host "Image rebuilt!" -ForegroundColor Green
    }
    "shell" {
        Write-Header "Opening Shell in Container"
        Ensure-Image
        docker run --rm -it -v "${PWD}:/app" -w /app $ImageName sh
    }
    "help" {
        Write-Host ""
        Write-Host "DailyLift — Local Run Script (Docker-based)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  .\run.ps1 test       Run tests with coverage report"
        Write-Host "  .\run.ps1 build      Build the static site to ./dist/"
        Write-Host "  .\run.ps1 serve      Build & serve at http://localhost:3000"
        Write-Host "  .\run.ps1 ci         Full CI: lint + test + build"
        Write-Host "  .\run.ps1 quote      Fetch today's daily quote"
        Write-Host "  .\run.ps1 lint       Run lint checks"
        Write-Host "  .\run.ps1 clean      Remove containers, images, and output"
        Write-Host "  .\run.ps1 rebuild    Force-rebuild Docker image"
        Write-Host "  .\run.ps1 shell      Open shell inside container"
        Write-Host ""
    }
}
