# Features — DailyLift

## Core Features

### ⚡ Daily Motivational Quotes
- **Auto-fetched** from ZenQuotes API daily via GitHub Actions cron
- **Dual API fallback** — ZenQuotes → Quotable → hardcoded fallback
- **Quote collection** — accumulates 500+ quotes over time for PDF downloads
- **Hero display** — prominently featured on homepage with animated glass card
- **Duplicate detection** — prevents repeated quotes in collection

### 🛠️ Free Online Tools
All tools run 100% in the browser — zero data sent to any server.

| Tool | Features |
|------|----------|
| **Bill Splitter** | Total amount, N people, tip %, per-person breakdown, animated results |
| **BMI Calculator** | Weight/height inputs, BMI formula, 7 health categories, visual color gauge |
| **Unit Converter** | 5 categories (length, weight, temperature, volume, speed), swap button, instant conversion |

### 📝 Blog Platform
- **10+ evergreen articles** on productivity, health, finance, and motivation
- **Markdown-based** — easy to write and maintain
- **YAML frontmatter** — title, date, description, keywords, emoji
- **Auto-converted** to SEO-optimized HTML during build
- **Sorted chronologically** with read-time estimates

### 📄 PDF Generator
- Compiles 500+ accumulated quotes into a downloadable PDF
- Uses `pdf-lib` loaded from CDN — fully client-side
- Title page with branding, word-wrapped quotes, author attribution

---

## Automation Features

### 🔄 GitHub Actions Workflows
| Workflow | Schedule | Function |
|----------|----------|----------|
| `ci.yml` | Push / PR | Lint, test (95% coverage), build, verify |
| `deploy.yml` | Push to main | Build & deploy to Netlify |
| `update-content.yml` | Daily midnight UTC | Fetch quote, post to social, commit |
| `weekly-blog.yml` | Sundays midnight UTC | Rebuild blog content, commit |

### 📱 Social Media Automation
- Twitter/X API v2 auto-posting with hashtags
- IFTTT webhook integration for cross-platform sharing
- Graceful failure when API keys aren't configured

### 🏗️ Build Pipeline
- `npm run build` — single command for full site generation
- Markdown → HTML conversion with `marked` + `gray-matter`
- Auto-generated `sitemap.xml`, `robots.txt`, blog index JSON
- Source → dist copying with data file mirroring

---

## Design & UX Features

### 🎨 Premium Dark Mode Design
- Custom HSL color palette — purple/blue accent gradients
- Glassmorphism cards with backdrop-filter blur
- Animated floating background glows
- Smooth scroll-triggered fade-in animations
- Google Fonts (Inter for body, Outfit for headings)

### 📱 Responsive Design
- Mobile-first breakpoints at 768px and 480px
- Collapsible mobile navigation with animated toggle
- Flexible CSS Grid and Flexbox layouts
- Touch-friendly interactive elements

### ♿ Accessibility
- Semantic HTML5 (`<nav>`, `<article>`, `<footer>`, `<section>`)
- ARIA roles, labels, and live regions on all tools
- Screen-reader-only utility class (`.sr-only`)
- Keyboard navigable tabbed interface

---

## SEO Features

| Feature | Implementation |
|---------|---------------|
| Meta descriptions | Custom per-page, 150+ characters |
| Open Graph tags | Title, description, URL per page |
| Twitter Cards | Summary card with description |
| JSON-LD | WebSite schema (homepage), WebApplication (tools) |
| Sitemap | Auto-generated XML with priorities 0.5–1.0 |
| robots.txt | Allow all crawlers, sitemap reference |
| Heading hierarchy | Single H1 per page, semantic H2/H3 |
| Long-tail keywords | Targeted in content (e.g., "free online bill splitter with tip calculator") |

---

## Monetization Features

| Channel | Status | Notes |
|---------|--------|-------|
| Google AdSense | 🟡 Placeholder | Replace `ca-pub-XXXX` with publisher ID |
| Amazon Associates | 🟡 Placeholder | Replace affiliate tags in book links |
| Flipkart Affiliate | 🟡 Placeholder | Add product links for Indian audience |
| Gumroad | 🟡 Placeholder | Link digital products in CTA section |
| PDF Lead Magnet | ✅ Functional | Free 500+ quotes PDF download |
| UTM Tracking | 🟡 Placeholder | Add UTM params to affiliate links |

---

## DevOps & Quality Features

### 🐳 Docker-Based Development
- `Dockerfile` — Node 18 Alpine, reproducible builds
- `docker-compose.yml` — 6 services (test, build, serve, quote, lint, ci)
- `run.ps1` / `run.sh` — ergonomic CLI wrappers
- Zero local installs required

### 🧪 Test Suite
- **9 test files**, **150+ test cases**
- Jest + jsdom for browser simulation
- cheerio for HTML validation
- 95% coverage threshold enforced in CI
- Tests cover: build pipeline, data integrity, calculations, HTML SEO, lint

### 🔒 Security
- No server-side code (zero attack surface)
- No eval() or document.write()
- Security headers via `netlify.toml`
- API secrets in GitHub Secrets only
- HTTPS enforced via Let's Encrypt
