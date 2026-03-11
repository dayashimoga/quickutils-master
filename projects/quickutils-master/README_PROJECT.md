# ⚡ QuickUtils API Directory

> **The Ultimate Directory of Free, Open APIs** — searchable, categorized, and always up-to-date.

[![CI Tests](https://img.shields.io/badge/tests-128%20passed-brightgreen)](#) [![Coverage](https://img.shields.io/badge/coverage-93%25-brightgreen)](#) [![License](https://img.shields.io/badge/license-MIT-blue)](#)

---

## 🔥 Features

- **30+ curated APIs** across 14 categories (Animals, Finance, Science, Games, etc.)
- **SEO-optimized** static pages with JSON-LD, Open Graph, breadcrumbs, sitemap
- **Blazing fast** — pure HTML/CSS/JS, no JavaScript framework bloat
- **Dark/Light mode** with localStorage persistence
- **Mobile responsive** — looks great on phones, tablets, and desktops
- **Weekly auto-sync** — GitHub Actions fetches fresh data from public APIs
- **Social media bot** — daily automated posts to Mastodon
- **Monetization ready** — Google AdSense, Amazon Affiliates (books), Gumroad
- **93%+ test coverage** — 128 tests with pytest, coverage enforcement in CI
- **Zero cost hosting** — Netlify free tier (~8 min/month of 300 free build minutes)

---

## 🚀 Quick Start

### Prerequisites

- [Docker](https://www.docker.com/) (recommended) **OR** Python 3.11+
- Git

### Run Locally (Docker)

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/quickutils-directory.git
cd quickutils-directory

# Run tests
docker compose run --rm test

# Build the site
docker compose run --rm build

# Serve locally at http://localhost:8000
docker compose up serve
```

### Run Locally (Python venv)

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .\.venv\Scripts\activate
pip install -r requirements.txt

# Run tests
python -m pytest tests/ -v --cov=scripts --cov-report=term-missing

# Build the site
python -m scripts.build_directory
python -m scripts.generate_sitemap

# Serve locally
python -m http.server 8000 --directory dist
```

---

## 📁 Project Structure

```
├── .github/workflows/     # CI, weekly data sync, daily social bot
├── data/database.json     # API data (auto-updated weekly)
├── dist/                  # Built static site (git-ignored)
├── docs/                  # Architecture, setup guide, testing docs
├── scripts/               # Python build pipeline
│   ├── build_directory.py # Static site generator (Jinja2)
│   ├── fetch_data.py      # API data fetcher
│   ├── generate_sitemap.py# Sitemap + robots.txt builder
│   ├── post_social.py     # Mastodon auto-poster
│   └── utils.py           # Shared utilities
├── src/
│   ├── templates/         # 5 Jinja2 HTML templates
│   ├── css/styles.css     # Design system (~1200 lines)
│   └── js/main.js         # Theme toggle, mobile menu
├── tests/                 # 128 test cases, 93% coverage
├── Dockerfile             # Python 3.11 slim
├── docker-compose.yml     # test / build / serve services
├── netlify.toml           # Netlify build + headers config
└── requirements.txt       # Python dependencies
```

---

## 📖 Documentation

| Document | Description |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | Technical architecture, data flow, code walkthrough |
| [Technical Requirements](docs/TECHNICAL_REQUIREMENTS.md) | Python environment, dependencies, and build specs |
| [Setup Guide](docs/SETUP_GUIDE.md) | Quick start for AdSense, Amazon, Analytics, and domains |
| [Deployment & Monetization](DEPLOYMENT_AND_MONETIZATION.md) | Detailed walkthrough for Cloudflare, AdSense, and Affiliate setup |
| [Testing](docs/TESTING.md) | Test suite, coverage, CI pipeline documentation |

---

## 🛠️ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SITE_URL` | `https://directory.quickutils.top` | Base URL for canonical links and sitemap |
| `GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` | Google Analytics 4 measurement ID |
| `ADSENSE_PUBLISHER_ID` | `ca-pub-XXXXXXXXXX` | Google AdSense publisher ID |
| `AMAZON_AFFILIATE_TAG` | `quickutils-20` | Amazon Associates tracking tag |
| `CLOUDFLARE_ACCOUNT_ID` | — | Cloudflare Account ID for deployment |
| `CLOUDFLARE_API_TOKEN` | — | Cloudflare API Token for deployment |
| `MASTODON_ACCESS_TOKEN` | — | Mastodon API access token (for social bot) |
| `MASTODON_INSTANCE_URL` | `mastodon.social` | Mastodon instance URL |

---

## 📝 License

MIT License. See [LICENSE](LICENSE) for details.

Built with ❤️ and automation by [QuickUtils](https://quickutils.top).

## Features
- **Fuse.js Search**: Instant client-side fuzzy search.
- **RSS/Atom Feed**: Support for content aggregation via `feed.xml`.
- **Network Discovery**: Cross-linking footer for traffic movement between sister sites.
- **Programmatic SEO**: JSON-LD, OpenGraph, and Twitter Card support.
- **Programmatic SEO**: JSON-LD, OpenGraph, and Twitter Card support.
