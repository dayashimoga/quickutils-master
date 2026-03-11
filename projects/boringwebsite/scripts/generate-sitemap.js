/**
 * generate-sitemap.js — Generates sitemap.xml from all HTML files in dist/
 * Run via: node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const SITE_URL = process.env.SITE_URL || 'https://quickutils.top';

function findHtmlFiles(dir, base = '') {
    const files = [];
    if (!fs.existsSync(dir)) return files;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const rel = path.join(base, entry.name);
        if (entry.isDirectory()) {
            files.push(...findHtmlFiles(path.join(dir, entry.name), rel));
        } else if (entry.name.endsWith('.html')) {
            files.push(rel.replace(/\\/g, '/'));
        }
    }
    return files;
}

function main() {
    console.log('🗺️ Generating sitemap.xml...');

    const htmlFiles = findHtmlFiles(DIST_DIR);
    const today = new Date().toISOString().split('T')[0];

    const urls = htmlFiles.map(file => {
        const loc = file === 'index.html' ? '' : file;
        const priority = file === 'index.html' ? '1.0'
            : file === 'tools.html' ? '0.9'
                : file === 'blog.html' ? '0.8'
                    : file.startsWith('blog/') ? '0.6'
                        : '0.5';
        const changefreq = file === 'index.html' ? 'daily'
            : file.startsWith('blog/') ? 'monthly'
                : 'weekly';

        return `  <url>
    <loc>${SITE_URL}/${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`.trim();

    const outputPath = path.join(DIST_DIR, 'sitemap.xml');
    fs.writeFileSync(outputPath, sitemap);
    console.log(`✅ Generated sitemap.xml with ${urls.length} URLs at ${outputPath}`);
}

main();
