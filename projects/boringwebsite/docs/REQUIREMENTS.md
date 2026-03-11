# Requirements Document — DailyLift

## 1. Project Overview

**DailyLift** is a fully automated, lightweight static website designed to generate passive income with near-zero ongoing maintenance. It leverages GitHub as the central hub for version control, content management, and automation workflows.

### 1.1 Core Objectives
- Deliver daily motivational quotes automatically via API integration
- Provide free, client-side interactive tools (Bill Splitter, BMI Calculator, Unit Converter)
- Publish SEO-optimized blog content for organic traffic acquisition
- Generate revenue through ads, affiliate marketing, and digital products
- Achieve full automation via GitHub Actions scheduled workflows
- Maintain total operational cost under ₹500/year (excluding domain)

### 1.2 Target Audience
- Individuals seeking daily motivation and inspiration
- Students and professionals needing quick online calculators
- Readers interested in productivity, health, and personal finance topics

---

## 2. Functional Requirements

### 2.1 Content Automation
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | System fetches a new motivational quote daily from ZenQuotes API | Must Have |
| FR-02 | Fallback to Quotable API when primary API fails | Must Have |
| FR-03 | Fallback to hardcoded quote when both APIs fail | Must Have |
| FR-04 | Quotes accumulate in a collection JSON file | Must Have |
| FR-05 | Duplicate quotes are detected and skipped | Must Have |
| FR-06 | Quote updates trigger site rebuild automatically | Must Have |

### 2.2 Interactive Tools
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-07 | Bill Splitter: split total by N people with tip percentage | Must Have |
| FR-08 | BMI Calculator: calculate BMI from weight/height with category | Must Have |
| FR-09 | Unit Converter: 5 categories (length, weight, temp, volume, speed) | Must Have |
| FR-10 | All tools run 100% client-side, no data sent to servers | Must Have |
| FR-11 | Tools have input validation and ARIA accessibility attributes | Must Have |
| FR-12 | PDF generator: compile 500+ quotes into downloadable PDF | Should Have |

### 2.3 Blog
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-13 | Support Markdown blog articles with YAML frontmatter | Must Have |
| FR-14 | Auto-convert Markdown to HTML during build | Must Have |
| FR-15 | Generate blog listing index sorted by date desc | Must Have |
| FR-16 | Each blog post has SEO meta tags and structured data | Must Have |
| FR-17 | Minimum 10 evergreen articles at launch | Must Have |

### 2.4 Monetization
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-18 | Google AdSense auto-ads integration (configurable publisher ID) | Must Have |
| FR-19 | Amazon Associates affiliate link placeholders | Must Have |
| FR-20 | Gumroad digital product buttons/embeds | Should Have |
| FR-21 | Free PDF as lead magnet for email capture | Nice to Have |

### 2.5 Social Media
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-22 | Auto-post daily quote to Twitter/X via API | Should Have |
| FR-23 | IFTTT webhook integration for cross-platform posting | Should Have |
| FR-24 | Graceful failure when API keys are not configured | Must Have |

---

## 3. Non-Functional Requirements

### 3.1 Performance
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Page load time (First Contentful Paint) | < 2 seconds |
| NFR-02 | Lighthouse Performance score | > 85 |
| NFR-03 | Total page weight (HTML + CSS + JS) | < 500 KB |

### 3.2 Security
| ID | Requirement |
|----|-------------|
| NFR-04 | HTTPS enforced via hosting platform (Let's Encrypt) |
| NFR-05 | Security headers: X-Frame-Options, X-Content-Type-Options |
| NFR-06 | No eval() or document.write() in codebase |
| NFR-07 | API secrets stored as GitHub Secrets, never in code |

### 3.3 Reliability
| ID | Requirement |
|----|-------------|
| NFR-08 | Site available 99.9% uptime via CDN hosting |
| NFR-09 | Graceful degradation when APIs are unavailable |
| NFR-10 | Fallback quotes when API fetch fails |

### 3.4 Testing
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-11 | Test coverage (lines) | ≥ 95% |
| NFR-12 | Test coverage (branches) | ≥ 90% |
| NFR-13 | Zero test failures, errors, or warnings | 0 |
| NFR-14 | All tests runnable via Docker (no local installs) | Required |

### 3.5 Accessibility
| ID | Requirement |
|----|-------------|
| NFR-15 | Semantic HTML5 elements throughout |
| NFR-16 | ARIA attributes on all interactive elements |
| NFR-17 | Keyboard navigable interface |
| NFR-18 | Color contrast meets WCAG 2.1 AA standard |

### 3.6 SEO
| ID | Requirement |
|----|-------------|
| NFR-19 | Meta description on every page |
| NFR-20 | Open Graph and Twitter Card tags on every page |
| NFR-21 | JSON-LD structured data for homepage and tools |
| NFR-22 | Auto-generated sitemap.xml with priorities |
| NFR-23 | robots.txt with sitemap reference |
| NFR-24 | Single H1 per page with proper heading hierarchy |

---

## 4. Technical Constraints
- **Budget:** Total cost < ₹500/year (excluding domain registration)
- **Hosting:** Free tier only (Netlify, Vercel, or GitHub Pages)
- **No Backend:** All functionality must be client-side or static
- **No Local Installs:** Development and testing via Docker only
- **Open Source:** All tools and libraries must be open-source or free-tier

---

## 5. Dependencies

| Dependency | Version | Purpose | License |
|-----------|---------|---------|---------|
| Node.js | 18 LTS | Build scripts, automation | MIT |
| marked | ^12.0 | Markdown to HTML conversion | MIT |
| gray-matter | ^4.0 | YAML frontmatter parsing | MIT |
| Jest | ^29.7 | Test framework | MIT |
| jsdom | ^24.0 | Browser DOM simulation for tests | MIT |
| cheerio | ^1.0 | HTML parsing for tests | MIT |
| pdf-lib | ^1.17 | Client-side PDF generation (CDN) | MIT |
