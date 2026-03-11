# ⚡ DailyLift — Automated Static Website

> Daily motivational quotes, free online tools, and expert blog articles — 100% automated via GitHub Actions.

## 🚀 Features

- **Daily Quotes** — Fetched automatically from ZenQuotes API, updated via cron
- **Free Tools** — Bill Splitter, BMI Calculator, Unit Converter (all client-side)
- **Blog** — 10+ SEO-optimized evergreen articles, Markdown-based
- **PDF Generator** — Download 500+ quotes as a free PDF (client-side via pdf-lib)
- **Monetization Ready** — AdSense, Amazon/Flipkart affiliates, Gumroad placeholders
- **Full SEO** — Meta tags, Open Graph, Twitter Cards, JSON-LD, sitemap, robots.txt
- **Zero Maintenance** — GitHub Actions handles daily quotes, weekly rebuilds, and deploys

## 📁 Structure

```
├── .github/workflows/     # GitHub Actions (deploy, daily quote, weekly blog)
├── content/blog/          # Markdown blog articles
├── data/                  # Quote JSON data files
├── scripts/               # Node.js automation scripts
├── src/                   # Source HTML, CSS, JS
│   ├── css/style.css      # Design system
│   ├── js/app.js          # Main app logic
│   ├── tools/             # Interactive tool scripts
│   ├── index.html         # Homepage
│   ├── tools.html         # Tools page
│   ├── blog.html          # Blog listing
│   └── about.html         # About page
├── netlify.toml           # Netlify config
└── package.json           # Dependencies & scripts
```

## 🛠️ Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/dailylift.git
cd dailylift

# 2. Install dependencies
npm install

# 3. Build the site
npm run build

# 4. Preview locally
npm run dev
```

## ⚙️ GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token |
| `NETLIFY_SITE_ID` | Netlify site ID |
| `TWITTER_BEARER_TOKEN` | (Optional) Twitter API v2 bearer token |
| `IFTTT_WEBHOOK_KEY` | (Optional) IFTTT Maker webhook key |
| `SITE_URL` | (Optional) Your site URL for social posts |

## 📋 Automation Schedule

| Workflow | Schedule | Action |
|----------|----------|--------|
| `deploy.yml` | On push to `main` | Build & deploy to Netlify |
| `update-content.yml` | Daily midnight UTC | Fetch quote, post to social, commit |
| `weekly-blog.yml` | Sundays midnight UTC | Rebuild blog, commit changes |

## 💰 Monetization

1. **Google AdSense** — Replace `ca-pub-XXXX` in HTML files
2. **Amazon Associates** — Replace `YOUR_AFFILIATE_TAG` in affiliate links
3. **Gumroad** — Link your Gumroad products in the CTA section
4. **PDF Downloads** — Lead magnet for email capture

## 📄 License

MIT License — fork, customize, and deploy your own version!
