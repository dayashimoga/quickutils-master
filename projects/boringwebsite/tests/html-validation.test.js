/**
 * Tests for HTML page structure, SEO, accessibility, and content
 * Uses cheerio for fast HTML parsing
 * Covers: meta tags, semantic HTML, navigation, footer, ARIA, structured data
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const SRC = path.join(__dirname, '..', 'src');
const PAGES = ['index.html', 'tools.html', 'blog.html', 'about.html'];

function loadPage(name) {
    return cheerio.load(fs.readFileSync(path.join(SRC, name), 'utf-8'));
}

describe('HTML Pages', () => {
    describe.each(PAGES)('%s', (pageName) => {
        let $;

        beforeAll(() => {
            $ = loadPage(pageName);
        });

        // SEO Tests
        test('has DOCTYPE declaration', () => {
            const raw = fs.readFileSync(path.join(SRC, pageName), 'utf-8');
            expect(raw.toLowerCase()).toContain('<!doctype html>');
        });

        test('has lang attribute on html element', () => {
            expect($('html').attr('lang')).toBe('en');
        });

        test('has charset meta tag', () => {
            expect($('meta[charset]').length).toBeGreaterThan(0);
        });

        test('has viewport meta tag', () => {
            expect($('meta[name="viewport"]').length).toBeGreaterThan(0);
        });

        test('has non-empty title tag', () => {
            const title = $('title').text().trim();
            expect(title.length).toBeGreaterThan(5);
        });

        test('has meta description', () => {
            const desc = $('meta[name="description"]').attr('content');
            expect(desc).toBeTruthy();
            expect(desc.length).toBeGreaterThan(20);
        });

        test('has Open Graph title', () => {
            const ogTitle = $('meta[property="og:title"]').attr('content');
            expect(ogTitle).toBeTruthy();
        });

        test('has Open Graph description', () => {
            const ogDesc = $('meta[property="og:description"]').attr('content');
            expect(ogDesc).toBeTruthy();
        });

        test('has Open Graph image', () => {
            const ogImage = $('meta[property="og:image"]').attr('content');
            expect(ogImage).toContain('pinterest-cover.png');
        });

        test('has Twitter Card image', () => {
            const twImage = $('meta[name="twitter:image"]').attr('content');
            expect(twImage).toContain('pinterest-cover.png');
        });

        // Navigation Tests
        test('has navigation navbar', () => {
            expect($('nav.navbar').length).toBe(1);
        });

        test('has brand logo/name', () => {
            expect($('.nav-brand').length).toBeGreaterThan(0);
        });

        test('has navigation links', () => {
            expect($('.nav-links a').length).toBeGreaterThanOrEqual(4);
        });

        test('has Home link', () => {
            const links = $('.nav-links a').map((_, el) => $(el).text().trim()).get();
            expect(links).toContain('Home');
        });

        test('has Tools link', () => {
            const links = $('.nav-links a').map((_, el) => $(el).text().trim()).get();
            expect(links).toContain('Tools');
        });

        test('has Blog link', () => {
            const links = $('.nav-links a').map((_, el) => $(el).text().trim()).get();
            expect(links).toContain('Blog');
        });

        test('has About link', () => {
            const links = $('.nav-links a').map((_, el) => $(el).text().trim()).get();
            expect(links).toContain('About');
        });

        test('has mobile nav toggle button', () => {
            expect($('.nav-toggle').length).toBe(1);
        });

        test('nav toggle has aria-label', () => {
            expect($('.nav-toggle').attr('aria-label')).toBeTruthy();
        });

        // Accessibility Tests
        test('navigation has role attribute', () => {
            expect($('nav').attr('role')).toBe('navigation');
        });

        test('navigation has aria-label', () => {
            expect($('nav').attr('aria-label')).toBeTruthy();
        });

        // Content Tests
        test('has exactly one h1 tag', () => {
            expect($('h1').length).toBe(1);
        });

        // Footer Tests
        test('has footer element', () => {
            expect($('footer').length).toBe(1);
        });

        test('footer has copyright text', () => {
            const footerText = $('footer').text();
            expect(footerText).toContain('2026');
            expect(footerText).toContain('DailyLift');
        });

        // Stylesheet Tests
        test('links to style.css', () => {
            const cssLinks = $('link[rel="stylesheet"]').map((_, el) => $(el).attr('href')).get();
            expect(cssLinks.some(href => href.includes('style.css'))).toBe(true);
        });

        // Script Tests
        test('links to app.js', () => {
            const scripts = $('script[src]').map((_, el) => $(el).attr('src')).get();
            expect(scripts.some(src => src.includes('app.js'))).toBe(true);
        });

        // Favicon
        test('has favicon', () => {
            expect($('link[rel="icon"]').length).toBeGreaterThan(0);
        });
    });

    // Page-specific tests
    describe('index.html specifics', () => {
        let $;
        beforeAll(() => { $ = loadPage('index.html'); });

        test('has hero section', () => {
            expect($('.hero').length).toBe(1);
        });

        test('has quote card', () => {
            expect($('.quote-card').length).toBeGreaterThan(0);
        });

        test('has tools section', () => {
            expect($('#tools-section').length).toBe(1);
        });

        test('has 10 tool cards', () => {
            expect($('.tool-card').length).toBe(10);
        });

        test('has blog section', () => {
            expect($('#blog-section').length).toBe(1);
        });

        test('has CTA section', () => {
            expect($('.cta-section').length).toBe(1);
        });

        test('has affiliate section', () => {
            const text = $('body').text();
            expect(text).toContain('Books We');
        });

        test('has JSON-LD structured data', () => {
            const ldScript = $('script[type="application/ld+json"]');
            expect(ldScript.length).toBeGreaterThan(0);
            const data = JSON.parse(ldScript.first().html());
            expect(data['@context']).toBe('https://schema.org');
        });

        test('has ad slots', () => {
            expect($('.ad-slot').length).toBeGreaterThanOrEqual(1);
        });

        test('hero has CTA buttons', () => {
            expect($('.hero-buttons .btn').length).toBeGreaterThanOrEqual(2);
        });

        test('has Google AdSense script integration', () => {
            const script = $('script[src*="adsbygoogle.js"]');
            expect(script.length).toBeGreaterThan(0);
            const src = script.attr('src');
            expect(src).toContain('ca-pub-5193703345853377');
        });

        test('uses page-specific AdSlot ID', () => {
            const raw = fs.readFileSync(path.join(SRC, 'index.html'), 'utf-8');
            expect(raw).toContain('data-ad-slot="2246027256"');
        });
    });

    describe('tools.html specifics', () => {
        let $;
        beforeAll(() => { $ = loadPage('tools.html'); });

        test('has tool tabs', () => {
            expect($('.tool-tab').length).toBe(7);
        });

        test('has bill splitter panel', () => {
            expect($('#panel-bill').length).toBe(1);
        });

        test('has BMI panel', () => {
            expect($('#panel-bmi').length).toBe(1);
        });

        test('has unit converter panel', () => {
            expect($('#panel-unit').length).toBe(1);
        });

        test('has loan EMI panel', () => {
            expect($('#panel-loan').length).toBe(1);
        });

        test('has insurance panel', () => {
            expect($('#panel-insurance').length).toBe(1);
        });

        test('has currency converter panel', () => {
            expect($('#panel-currency').length).toBe(1);
        });

        test('has tax calculator panel', () => {
            expect($('#panel-tax').length).toBe(1);
        });

        test('bill form has required inputs', () => {
            expect($('#billTotal').length).toBe(1);
            expect($('#billPeople').length).toBe(1);
            expect($('#billTip').length).toBe(1);
        });

        test('BMI form has required inputs', () => {
            expect($('#bmiWeight').length).toBe(1);
            expect($('#bmiHeight').length).toBe(1);
        });

        test('unit converter has category selector', () => {
            expect($('#unitCategory').length).toBe(1);
        });

        test('unit converter has 5 category options', () => {
            expect($('#unitCategory option').length).toBe(5);
        });

        test('has JSON-LD WebApplication structured data', () => {
            const ldScript = $('script[type="application/ld+json"]');
            expect(ldScript.length).toBeGreaterThan(0);
            const data = JSON.parse(ldScript.first().html());
            expect(data['@type']).toBe('WebApplication');
        });

        test('tool tabs have ARIA attributes', () => {
            $('.tool-tab').each((_, el) => {
                expect($(el).attr('role')).toBe('tab');
                expect($(el).attr('aria-selected')).toBeTruthy();
            });
        });

        test('tool panels have ARIA attributes', () => {
            $('.tool-panel').each((_, el) => {
                expect($(el).attr('role')).toBe('tabpanel');
            });
        });

        test('loads tool scripts', () => {
            const scripts = $('script[src]').map((_, el) => $(el).attr('src')).get();
            expect(scripts.some(s => s.includes('bill-splitter'))).toBe(true);
            expect(scripts.some(s => s.includes('bmi-calculator'))).toBe(true);
            expect(scripts.some(s => s.includes('unit-converter'))).toBe(true);
            expect(scripts.some(s => s.includes('loan-emi'))).toBe(true);
            expect(scripts.some(s => s.includes('insurance-estimator'))).toBe(true);
            expect(scripts.some(s => s.includes('currency-converter'))).toBe(true);
            expect(scripts.some(s => s.includes('tax-calculator'))).toBe(true);
        });

        test('uses page-specific AdSlot ID', () => {
            const raw = fs.readFileSync(path.join(SRC, 'tools.html'), 'utf-8');
            expect(raw).toContain('data-ad-slot="2573330311"');
        });
    });

    describe('about.html specifics', () => {
        let $;
        beforeAll(() => { $ = loadPage('about.html'); });

        test('has stats section', () => {
            expect($('.stat-item').length).toBeGreaterThanOrEqual(3);
        });

        test('has mission section', () => {
            const text = $('body').text();
            expect(text).toContain('Mission');
        });

        test('has tech stack description', () => {
            const text = $('body').text();
            expect(text).toContain('Frontend');
            expect(text).toContain('GitHub Actions');
        });

        test('uses page-specific AdSlot ID', () => {
            const raw = fs.readFileSync(path.join(SRC, 'about.html'), 'utf-8');
            expect(raw).toContain('data-ad-slot="1479740496"');
        });
    });

    describe('blog.html specifics', () => {
        let $;
        beforeAll(() => { $ = loadPage('blog.html'); });

        test('has blog grid', () => {
            expect($('.blog-grid').length).toBe(1);
        });

        test('uses page-specific AdSlot ID', () => {
            const raw = fs.readFileSync(path.join(SRC, 'blog.html'), 'utf-8');
            expect(raw).toContain('data-ad-slot="8571762456"');
        });
    });
});

describe('Root Files Verification', () => {
    test('ads.txt exists in src directory', () => {
        const adsTxtPath = path.join(SRC, 'ads.txt');
        expect(fs.existsSync(adsTxtPath)).toBe(true);
        const content = fs.readFileSync(adsTxtPath, 'utf-8');
        expect(content).toContain('google.com, pub-5193703345853377, DIRECT, f08c47fec0942fa0');
    });

    test('og-image.png exists in images directory', () => {
        const imgPath = path.join(SRC, 'images', 'og-image.png');
        expect(fs.existsSync(imgPath)).toBe(true);
    });
});
