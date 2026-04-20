/**
 * Tests for src/index.html structure
 * Covers: SEO, accessibility, navigation, sections
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');

describe('HTML Structure', () => {
    let html;

    beforeAll(() => {
        html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf-8');
    });

    test('has DOCTYPE', () => {
        expect(html.toLowerCase()).toContain('<!doctype html>');
    });

    test('has lang attribute', () => {
        expect(html).toContain('lang="en"');
    });

    test('has charset meta', () => {
        expect(html).toContain('charset="UTF-8"');
    });

    test('has viewport meta', () => {
        expect(html).toContain('name="viewport"');
    });

    test('has title tag', () => {
        expect(html).toMatch(/<title>.+<\/title>/);
    });

    test('has meta description', () => {
        expect(html).toContain('name="description"');
    });

    test('has Open Graph tags', () => {
        expect(html).toContain('og:title');
        expect(html).toContain('og:description');
    });

    test('has navigation', () => {
        expect(html).toContain('class="navbar"');
        expect(html).toContain('role="navigation"');
    });

    test('has hero section', () => {
        expect(html).toContain('id="hero"');
    });

    test('has daily fact section', () => {
        expect(html).toContain('id="daily-fact"');
    });

    test('has categories section', () => {
        expect(html).toContain('id="categories"');
    });

    test('has tools section', () => {
        expect(html).toContain('id="tools-section"');
    });

    test('has 3 tool tabs', () => {
        const tabs = (html.match(/class="tool-tab["|\s]/g) || []).length;
        expect(tabs).toBe(3);
    });

    test('has 3 tool panels', () => {
        const panels = (html.match(/class="tool-panel["|\s]/g) || []).length;
        expect(panels).toBe(3);
    });

    test('has footer', () => {
        expect(html).toContain('<footer');
        expect(html).toContain('2026');
    });

    test('links to style.css', () => {
        expect(html).toContain('css/style.css');
    });

    test('links to app.js', () => {
        expect(html).toContain('js/app.js');
    });

    test('has JSON-LD structured data', () => {
        expect(html).toContain('application/ld+json');
        expect(html).toContain('schema.org');
    });

    test('has favicon', () => {
        expect(html).toContain('rel="icon"');
    });

    test('has aria-label on navigation', () => {
        expect(html).toContain('aria-label="Main navigation"');
    });

    test('has mobile nav toggle', () => {
        expect(html).toContain('id="navToggle"');
    });

    describe('Integrations (GA, AdSense, Amazon, Pinterest)', () => {
        test('has Google Analytics GA4', () => {
            expect(html).toContain('googletagmanager.com/gtag/js?id=G-9PEGCBXCL7');
        });

        test('has Google AdSense publisher ID', () => {
            expect(html).toContain('ca-pub-5193703345853377');
        });

        test('has AdSense ad units', () => {
            expect(html).toContain('class="adsbygoogle"');
            expect(html).toContain('data-ad-slot="2246027256"');
        });

        test('has Pinterest domain verification', () => {
            expect(html).toContain('name="p:domain_verify"');
            expect(html).toContain('content="c816c2b41079835efd234cb5afef59bf"');
        });

        test('has Pinterest share button', () => {
            expect(html).toContain('pinterest.com/pin/create/button/');
        });

        test('has Amazon affiliate book recommendations', () => {
            expect(html).toContain('id="recommended-books"');
            expect(html).toContain('amazon.com/dp/');
            expect(html).toContain('tag=df-quickutils-21');
        });

        test('Amazon links use sponsored rel attribute', () => {
            expect(html).toContain('rel="noopener sponsored"');
        });
    });
});

describe('CSS Structure', () => {
    let css;

    beforeAll(() => {
        css = fs.readFileSync(path.join(SRC, 'css', 'style.css'), 'utf-8');
    });

    test('imports Google Fonts', () => {
        expect(css).toContain('fonts.googleapis.com');
    });

    test('has CSS custom properties', () => {
        expect(css).toContain(':root');
        expect(css).toContain('--clr-');
    });

    test('has responsive breakpoints', () => {
        expect(css).toContain('@media');
    });

    test('has balanced curly braces', () => {
        const opens = (css.match(/{/g) || []).length;
        const closes = (css.match(/}/g) || []).length;
        expect(opens).toBe(closes);
    });
});
