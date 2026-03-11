#!/usr/bin/env bash
# DailyLift — Local Run Script (Bash)
# Uses Docker — no local Node.js installation required.
#
# Usage:
#   ./run.sh test       # Run tests with coverage
#   ./run.sh build      # Build the site
#   ./run.sh serve      # Serve locally at http://localhost:3000
#   ./run.sh ci         # Full CI pipeline (lint + test + build)
#   ./run.sh quote      # Fetch daily quote
#   ./run.sh lint       # Run lint checks
#   ./run.sh clean      # Remove Docker containers and volumes
#   ./run.sh rebuild    # Force rebuild Docker image
#   ./run.sh shell      # Open a shell inside the container

set -e

IMAGE_NAME="dailylift-app"

header() {
    echo ""
    echo "===================================================="
    echo "  $1"
    echo "===================================================="
    echo ""
}

case "${1:-help}" in
    test)
        header "Running Tests with Coverage"
        docker compose run --rm test
        echo -e "\n✅ Coverage report: ./coverage/lcov-report/index.html"
        ;;
    build)
        header "Building Site"
        docker compose run --rm build
        echo -e "\n✅ Output: ./dist/"
        ;;
    serve)
        header "Building & Serving at http://localhost:3000"
        docker compose up --build serve
        ;;
    ci)
        header "Full CI Pipeline (Lint + Test + Build)"
        docker compose run --rm ci
        echo -e "\n✅ CI passed! Check ./coverage/ and ./dist/"
        ;;
    quote)
        header "Fetching Daily Quote"
        docker compose run --rm fetch-quote
        ;;
    lint)
        header "Running Lint Checks"
        docker compose run --rm lint
        ;;
    clean)
        header "Cleaning Docker Resources"
        docker compose down --rmi local --volumes --remove-orphans 2>/dev/null || true
        rm -rf ./dist ./coverage
        echo "✅ Cleaned!"
        ;;
    rebuild)
        header "Rebuilding Docker Image"
        docker compose build --no-cache
        echo "✅ Image rebuilt!"
        ;;
    shell)
        header "Opening Shell in Container"
        docker run --rm -it -v "$(pwd):/app" -w /app node:18-alpine sh
        ;;
    help|*)
        echo ""
        echo "DailyLift — Local Run Script (Docker-based)"
        echo ""
        echo "  ./run.sh test       Run tests with coverage report"
        echo "  ./run.sh build      Build the static site to ./dist/"
        echo "  ./run.sh serve      Build & serve at http://localhost:3000"
        echo "  ./run.sh ci         Full CI: lint + test + build"
        echo "  ./run.sh quote      Fetch today's daily quote"
        echo "  ./run.sh lint       Run lint checks"
        echo "  ./run.sh clean      Remove containers, images, and output"
        echo "  ./run.sh rebuild    Force-rebuild Docker image"
        echo "  ./run.sh shell      Open shell inside container"
        echo ""
        ;;
esac
