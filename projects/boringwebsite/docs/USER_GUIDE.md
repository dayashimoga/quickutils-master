# User Guide — DailyLift

## Getting Started

### Prerequisites
- **Docker** installed on your system ([Get Docker](https://docs.docker.com/get-docker/))
- **Git** for version control
- No Node.js, npm, or other local tools required

### Clone & First Run

```bash
git clone https://github.com/YOUR_USERNAME/dailylift.git
cd dailylift
```

**Windows (PowerShell):**
```powershell
.\run.ps1 ci       # Run full CI: lint + test + build
.\run.ps1 serve    # Start local server at http://localhost:3000
```

**Linux/Mac (Bash):**
```bash
chmod +x run.sh
./run.sh ci        # Run full CI: lint + test + build
./run.sh serve     # Start local server at http://localhost:3000
```

---

## Available Commands

| Command | What it does |
|---------|-------------|
| `test` | Run test suite with coverage report |
| `build` | Build static site to `./dist/` |
| `serve` | Build & serve locally at http://localhost:3000 |
| `ci` | Full pipeline: lint → test → build |
| `quote` | Fetch today's daily quote from API |
| `lint` | Run lint checks on all files |
| `clean` | Remove containers, images, dist, coverage |
| `rebuild` | Force-rebuild Docker image |
| `shell` | Open a shell inside the container |

---

## Deployment

### Netlify (Recommended)

1. **Create Netlify account** at [netlify.com](https://www.netlify.com/)
2. **Connect GitHub repo** via Netlify Dashboard → "New site from Git"
3. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Set GitHub Secrets** for CI deploy:
   - `NETLIFY_AUTH_TOKEN`: Get from Netlify → User Settings → Applications
   - `NETLIFY_SITE_ID`: Get from Netlify → Site Settings → General

### Custom Domain

1. Register a domain (e.g., `.xyz` or `.site` — ₹70–200/year)
2. In Netlify Dashboard → Domain Settings → Add custom domain
3. Point DNS: Add CNAME record pointing to your Netlify subdomain
4. SSL is auto-provisioned by Netlify (Let's Encrypt)

---

## Content Management

### Adding Blog Posts

1. Create a new `.md` file in `content/blog/`
2. Include YAML frontmatter:
   ```yaml
   ---
   title: "Your Article Title"
   date: "2026-03-01"
   description: "SEO-optimized description for search engines"
   keywords: ["keyword1", "keyword2"]
   emoji: "📝"
   hue: 265
   ---
   ```
3. Write article body in Markdown
4. Commit and push — the CI pipeline will build and deploy automatically

### Updating Quotes

Quotes are fetched automatically daily via GitHub Actions. To manually fetch:
```
.\run.ps1 quote    # or ./run.sh quote
```

The quote appears in `data/current-quote.json` and is appended to `data/quotes-collection.json`.

---

## Monetization Setup

### Google AdSense
1. Sign up at [adsense.google.com](https://www.google.com/adsense/)
2. Replace `ca-pub-XXXX` in HTML files with your AdSense publisher ID
3. Uncomment the AdSense script tags in `src/index.html`

### Amazon Associates
1. Sign up at [affiliate-program.amazon.in](https://affiliate-program.amazon.in/)
2. Replace `YOUR_AFFILIATE_TAG` in the affiliate section of `src/index.html`

### Gumroad
1. Create products at [gumroad.com](https://gumroad.com/)
2. Update Gumroad button URLs in the CTA section

### Google Analytics
1. Create a property at [analytics.google.com](https://analytics.google.com/)
2. Replace `G-XXXX` in `src/index.html` with your Measurement ID
3. Uncomment the GA4 script tags

---

## Social Media Automation

### Twitter/X
1. Create a Developer App at [developer.twitter.com](https://developer.twitter.com/)
2. Generate OAuth 2.0 tokens with `tweet.write` permission
3. Add `TWITTER_BEARER_TOKEN` to GitHub Secrets

### IFTTT
1. Create an account at [ifttt.com](https://ifttt.com/)
2. Create an applet: Webhook trigger → Social media action
3. Add `IFTTT_WEBHOOK_KEY` to GitHub Secrets

---

## Testing

### Running Tests
```
.\run.ps1 test     # Run with coverage
```

### Coverage Report
After running tests, open `coverage/lcov-report/index.html` in your browser to view the detailed coverage report.

### Test Structure
- `tests/build.test.js` — Build pipeline verification
- `tests/fetch-quote.test.js` — Quote data validation
- `tests/generate-sitemap.test.js` — Sitemap XML validation
- `tests/post-social.test.js` — Social media formatting
- `tests/bill-splitter.test.js` — Bill Splitter calculations
- `tests/bmi-calculator.test.js` — BMI formula and categories
- `tests/unit-converter.test.js` — Unit conversion accuracy
- `tests/html-validation.test.js` — HTML structure and SEO
- `tests/lint.test.js` — Code quality and file structure

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Docker build fails | Run `.\run.ps1 rebuild` to force clean rebuild |
| Port 3000 in use | Stop other services on port 3000, or modify `docker-compose.yml` |
| Quote fetch fails | Check internet connection; fallback quote is used automatically |
| Tests fail | Run `.\run.ps1 test` and check output for details |
| Netlify deploy fails | Verify `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` secrets |
