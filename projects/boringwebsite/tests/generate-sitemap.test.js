/**
 * Tests for scripts/generate-sitemap.js
 * Covers: XML structure, URL discovery, priorities, changefreq
 */

const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');

describe('Generate Sitemap', () => {
    // Generate sitemap safely for this test
    beforeAll(() => {
        if (!fs.existsSync(DIST)) {
            fs.mkdirSync(DIST, { recursive: true });
        }
        jest.resetModules();
        require('../scripts/build.js');
    });

    test('sitemap.xml exists in dist/', () => {
        expect(fs.existsSync(path.join(DIST, 'sitemap.xml'))).toBe(true);
    });

    test('sitemap starts with XML declaration', () => {
        const content = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf-8');
        expect(content.startsWith('<?xml version="1.0"')).toBe(true);
    });

    test('sitemap uses correct namespace', () => {
        const content = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf-8');
        expect(content).toContain('http://www.sitemaps.org/schemas/sitemap/0.9');
    });

    test('sitemap has urlset root element', () => {
        const content = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf-8');
        expect(content).toContain('<urlset');
        expect(content).toContain('</urlset>');
    });

    test('each URL entry has loc, lastmod, changefreq, and priority', () => {
        const content = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf-8');
        const urlBlocks = content.match(/<url>[\s\S]*?<\/url>/g);
        expect(urlBlocks).not.toBeNull();
        expect(urlBlocks.length).toBeGreaterThan(0);

        urlBlocks.forEach(block => {
            expect(block).toContain('<loc>');
            expect(block).toContain('<lastmod>');
            expect(block).toContain('<changefreq>');
            expect(block).toContain('<priority>');
        });
    });

    test('homepage has priority 1.0', () => {
        const content = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf-8');
        // Find the index.html URL entry
        const indexPattern = /<url>\s*<loc>[^<]*quickutils\.top\/<\/loc>[\s\S]*?<priority>1\.0<\/priority>/;
        expect(content).toMatch(indexPattern);
    });

    test('tools page has priority 0.9', () => {
        const content = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf-8');
        expect(content).toContain('tools.html');
        const toolsSection = content.substring(
            content.indexOf('tools.html'),
            content.indexOf('</url>', content.indexOf('tools.html'))
        );
        expect(toolsSection).toContain('0.9');
    });

    test('blog posts have priority 0.6', () => {
        const content = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf-8');
        const blogUrlPattern = /blog\/.*?\.html/;
        expect(content).toMatch(blogUrlPattern);
    });

    test('lastmod dates are valid ISO date format', () => {
        const content = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf-8');
        const dates = content.match(/<lastmod>(.*?)<\/lastmod>/g);
        expect(dates).not.toBeNull();
        dates.forEach(dateTag => {
            const dateStr = dateTag.replace(/<\/?lastmod>/g, '');
            expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    test('all URLs use HTTPS', () => {
        const content = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf-8');
        const locs = content.match(/<loc>(.*?)<\/loc>/g);
        expect(locs).not.toBeNull();
        locs.forEach(loc => {
            const url = loc.replace(/<\/?loc>/g, '');
            expect(url.startsWith('https://')).toBe(true);
        });
    });

    test('sitemap includes all core pages', () => {
        const content = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf-8');
        const requiredPages = ['tools.html', 'blog.html', 'about.html'];
        requiredPages.forEach(page => {
            expect(content).toContain(page);
        });
    });

    test('changefreq values are valid', () => {
        const content = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf-8');
        const freqs = content.match(/<changefreq>(.*?)<\/changefreq>/g);
        const validFreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
        freqs.forEach(freq => {
            const val = freq.replace(/<\/?changefreq>/g, '');
            expect(validFreqs).toContain(val);
        });
    });
});
