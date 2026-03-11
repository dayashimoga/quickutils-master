/**
 * Build script — copies src/ to dist/ and embeds database.json
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const DATA = path.join(__dirname, '..', 'data');
const DIST = path.join(__dirname, '..', 'dist');

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function build() {
    console.log('🔨 Building DailyFacts...');

    // Clean dist
    /* istanbul ignore next */
    if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
    fs.mkdirSync(DIST, { recursive: true });

    // Copy src to dist
    copyDir(SRC, DIST);
    console.log('  ✅ Copied src/ → dist/');

    // Copy data to dist
    const distData = path.join(DIST, 'data');
    /* istanbul ignore next */
    if (!fs.existsSync(distData)) fs.mkdirSync(distData, { recursive: true });
    if (fs.existsSync(path.join(DATA, 'database.json'))) {
        fs.copyFileSync(path.join(DATA, 'database.json'), path.join(distData, 'database.json'));
        const facts = JSON.parse(fs.readFileSync(path.join(DATA, 'database.json'), 'utf-8'));
        console.log('  ✅ Copied database.json (' + facts.length + ' facts)');
    }

    // Create robots.txt
    fs.writeFileSync(path.join(DIST, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://facts.quickutils.top/sitemap.xml\n');
    console.log('  ✅ Created robots.txt');

    console.log('✅ Build complete!');
}

build();

/* istanbul ignore next */
if (typeof module !== 'undefined') {
    module.exports = { copyDir, build };
}
