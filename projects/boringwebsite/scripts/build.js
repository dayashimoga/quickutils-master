/**
 * build.js — Main build script for DailyLift
 * Copies /src → /dist, converts blog Markdown → HTML, generates blog index, sitemap
 * Run via: npm run build
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

const SITE_URL = process.env.SITE_URL || 'https://quickutils.top';

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const DATA = path.join(ROOT, 'data');
const CONTENT = path.join(ROOT, 'content', 'blog');

// ── Helpers ──
function cleanDir(dir) {
  // If running in Docker (where dist is mounted), don't attempt to clean it completely
  // Let copyRecursive safely overwrite existing files
  if (process.env.IS_DOCKER) return;

  if (fs.existsSync(dir)) {
    // Since dist is a docker mounted volume, deleting the folder itself throws EBUSY
    // Read contents and delete them individually instead, skipping the root node
    const children = fs.readdirSync(dir);
    for (const file of children) {
      const curPath = path.join(dir, file);
      if (fs.statSync(curPath).isDirectory()) {
        cleanDir(curPath);
        try { fs.rmdirSync(curPath); } catch (e) { /* ignore EBUSY on subdirs if mounted */ }
      } else {
        fs.unlinkSync(curPath);
      }
    }
  } else {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    const parentDir = path.dirname(dest);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// ── Blog Processing ──
function processBlogPosts() {
  console.log('📝 Processing blog posts...');

  if (!fs.existsSync(CONTENT)) {
    console.log('ℹ️ No blog content directory found, skipping');
    return [];
  }

  const mdFiles = fs.readdirSync(CONTENT).filter(f => f.endsWith('.md'));
  const blogDir = path.join(DIST, 'blog');
  fs.mkdirSync(blogDir, { recursive: true });

  const blogIndex = [];

  // Blog post HTML template
  const postTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}} | DailyLift Blog</title>
  <meta name="description" content="{{description}}">
  <meta name="keywords" content="{{keywords}}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="{{title}}">
  <meta property="og:description" content="{{description}}">
  <meta property="og:url" content="${SITE_URL}/blog/{{slug}}.html">
  <meta property="og:image" content="${SITE_URL}/images/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${SITE_URL}/images/og-image.png">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
  <link rel="stylesheet" href="../css/style.css">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "{{title}}",
    "description": "{{description}}",
    "datePublished": "{{date}}",
    "author": {"@type": "Organization", "name": "DailyLift"}
  }
  </script>
  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5193703345853377" crossorigin="anonymous"></script>
</head>
<body>
  <div class="bg-glow" aria-hidden="true"></div>
  <nav class="navbar" role="navigation" aria-label="Main navigation">
    <div class="container">
      <a href="../index.html" class="nav-brand"><span class="brand-icon">⚡</span> DailyLift</a>
      <div class="nav-links" id="navLinks">
        <a href="../index.html">Home</a>
        <a href="../tools.html">Tools</a>
        <a href="../blog.html" class="active">Blog</a>
        <a href="../about.html">About</a>
      </div>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>

  <article class="section blog-post-page">
    <div class="container">
      <div class="blog-post-content">
        <div class="blog-post-meta">
          <span>📅 {{date}}</span>
          <span>⏱️ {{readTime}}</span>
        </div>
        <h1>{{title}}</h1>
        <div class="blog-post-body">
          {{content}}
        </div>
        <div style="margin-top: var(--space-2xl); padding-top: var(--space-xl); border-top: 1px solid var(--clr-glass-border);">
          <a href="../blog.html" class="btn btn-secondary">← Back to Blog</a>
        </div>
      </div>
    </div>
  </article>

  <!-- Ad Slot -->
  <div class="container" style="margin: var(--space-lg) auto;">
    <div class="ad-slot">
      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5193703345853377"
           crossorigin="anonymous"></script>
      <!-- DailyLift Blog Posts -->
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="ca-pub-5193703345853377"
           data-ad-slot="8571762456"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
      <script>
           (adsbygoogle = window.adsbygoogle || []).push({});
      </script>
    </div>
  </div>

  <footer class="footer">
    <div class="container">
      <div class="footer-bottom">
        <p>&copy; 2026 DailyLift. All rights reserved.</p>
        <div class="social-links">
          <a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter">𝕏</a>
          <a href="https://pinterest.com" target="_blank" rel="noopener" aria-label="Pinterest">P</a>
        </div>
      </div>
    </div>
  </footer>

  <script src="../js/app.js"></script>
</body>
</html>`;

  for (const mdFile of mdFiles) {
    const raw = fs.readFileSync(path.join(CONTENT, mdFile), 'utf-8');
    const { data: frontmatter, content } = matter(raw);

    const slug = mdFile.replace('.md', '');
    const htmlContent = marked(content);
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200)) + ' min read';

    const html = postTemplate
      .replace(/\{\{title\}\}/g, frontmatter.title || slug)
      .replace(/\{\{description\}\}/g, frontmatter.description || '')
      .replace(/\{\{keywords\}\}/g, (frontmatter.keywords || []).join(', '))
      .replace(/\{\{date\}\}/g, frontmatter.date || '')
      .replace(/\{\{slug\}\}/g, slug)
      .replace(/\{\{readTime\}\}/g, readTime)
      .replace('{{content}}', htmlContent);

    fs.writeFileSync(path.join(blogDir, slug + '.html'), html);

    blogIndex.push({
      slug,
      title: frontmatter.title || slug,
      description: frontmatter.description || '',
      date: frontmatter.date || '',
      readTime,
      emoji: frontmatter.emoji || '📝',
      hue: frontmatter.hue || 265
    });

    console.log(`  ✅ ${slug}.html`);
  }

  // Sort by date descending
  blogIndex.sort((a, b) => new Date(b.date) - new Date(a.date));

  return blogIndex;
}

// ── Main Build ──
function build() {
  console.log('🔨 Building DailyLift...\n');

  // 1. Clean dist (Skip if Docker mounted volume)
  if (!process.env.IS_DOCKER) {
    cleanDir(DIST);
    console.log('🧹 Cleaned dist/');
  } else {
    console.log('🧹 Skipped cleaning dist/ (Docker environment)');
  }

  // 2. Copy src → dist
  copyRecursive(SRC, DIST);
  console.log('📁 Copied src/ → dist/');

  // Copy CSS/Images explicitly
  copyRecursive(path.join(__dirname, '../src/css'), path.join(DIST, 'css'));
  if (fs.existsSync(path.join(__dirname, '../src/images'))) {
    copyRecursive(path.join(__dirname, '../src/images'), path.join(DIST, 'images'));
  }
  console.log('📁 Copied src/css/ and src/images/ → dist/');

  // Copy ads.txt
  if (fs.existsSync(path.join(__dirname, '../src/ads.txt'))) {
    fs.copyFileSync(path.join(__dirname, '../src/ads.txt'), path.join(DIST, 'ads.txt'));
    console.log('📑 Copied ads.txt to root');
  }

  // 3. Copy data → dist/data
  copyRecursive(DATA, path.join(DIST, 'data'));
  console.log('📊 Copied data/ → dist/data/');

  // 4. Process blog posts
  const blogIndex = processBlogPosts();

  // 5. Write blog index JSON
  const blogIndexPath = path.join(DIST, 'data', 'blog-index.json');
  fs.mkdirSync(path.dirname(blogIndexPath), { recursive: true });
  fs.writeFileSync(blogIndexPath, JSON.stringify(blogIndex, null, 2));
  console.log(`📑 Generated blog-index.json (${blogIndex.length} posts)`);

  // 6. Generate robots.txt
  let robotsTxt = '';
  if (fs.existsSync(path.join(SRC, 'robots.txt'))) {
    robotsTxt = fs.readFileSync(path.join(SRC, 'robots.txt'), 'utf-8');
  } else {
    robotsTxt = `User-agent: *\nAllow: /\n\nUser-agent: Mediapartners-Google\nAllow: /\n`;
  }

  // Ensure sitemap is appended
  if (!robotsTxt.includes('Sitemap:')) {
    robotsTxt += `\nSitemap: ${SITE_URL}/sitemap.xml`;
  } else {
    // Replace old sitemap if it exists
    robotsTxt = robotsTxt.replace(/Sitemap: .*/, `Sitemap: ${SITE_URL}/sitemap.xml`);
  }

  fs.writeFileSync(path.join(DIST, 'robots.txt'), robotsTxt.trim());
  console.log('🤖 Generated robots.txt');

  // 7. Generate sitemap
  require('./generate-sitemap.js');

  // 8. Generate Cloudflare Pages configuration
  const headers = `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/css/*
  Cache-Control: public, max-age=31536000, immutable

/js/*
  Cache-Control: public, max-age=31536000, immutable

/data/*
  Cache-Control: public, max-age=3600`;

  fs.writeFileSync(path.join(DIST, '_headers'), headers);
  fs.writeFileSync(path.join(DIST, '_redirects'), ''); // Empty for now
  console.log('☁️ Generated Cloudflare Pages _headers and _redirects');

  console.log('\n✅ Build complete! Output: dist/');
}

build();
