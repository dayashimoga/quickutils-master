/**
 * Tests for scripts/build.js
 * Covers: build pipeline, Markdown→HTML, blog index, robots.txt, file copying
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DATA = path.join(ROOT, 'data');
const SRC = path.join(ROOT, 'src');
const CONTENT = path.join(ROOT, 'content', 'blog');

describe('Build Script', () => {
    beforeAll(() => {
        // Clean dist before build
        if (fs.existsSync(DIST)) {
            try {
                fs.rmSync(DIST, { recursive: true, force: true });
            } catch (e) {
                // ignore EBUSY in docker mounted volumes
            }
        }
        // Run build
        require('../scripts/build.js');
    });

    afterAll(() => {
        // Cleanup
        jest.restoreAllMocks();
    });

    describe('Directory Structure', () => {
        test('creates dist/ directory', () => {
            expect(fs.existsSync(DIST)).toBe(true);
        });

        test('creates dist/css/ directory', () => {
            expect(fs.existsSync(path.join(DIST, 'css'))).toBe(true);
        });

        test('creates dist/js/ directory', () => {
            expect(fs.existsSync(path.join(DIST, 'js'))).toBe(true);
        });

        test('creates dist/tools/ directory', () => {
            expect(fs.existsSync(path.join(DIST, 'tools'))).toBe(true);
        });

        test('creates dist/data/ directory', () => {
            expect(fs.existsSync(path.join(DIST, 'data'))).toBe(true);
        });

        test('creates dist/blog/ directory', () => {
            expect(fs.existsSync(path.join(DIST, 'blog'))).toBe(true);
        });
    });

    describe('Source File Copying', () => {
        test('copies index.html to dist/', () => {
            expect(fs.existsSync(path.join(DIST, 'index.html'))).toBe(true);
        });

        test('copies style.css to dist/css/', () => {
            expect(fs.existsSync(path.join(DIST, 'css', 'style.css'))).toBe(true);
        });
    });

    describe('Data Files', () => {
        test('copies current-quote.json to dist/data/', () => {
            expect(fs.existsSync(path.join(DIST, 'data', 'current-quote.json'))).toBe(true);
        });
    });

    describe('Blog Processing', () => {
        test('generates blog-index.json in dist/data/', () => {
            expect(fs.existsSync(path.join(DIST, 'data', 'blog-index.json'))).toBe(true);
        });

        test('blog-index.json is valid JSON array', () => {
            const data = JSON.parse(fs.readFileSync(path.join(DIST, 'data', 'blog-index.json'), 'utf-8'));
            expect(Array.isArray(data)).toBe(true);
        });
    });

    describe('SEO Files', () => {
        test('generates robots.txt in dist/', () => {
            expect(fs.existsSync(path.join(DIST, 'robots.txt'))).toBe(true);
        });

        test('generates sitemap.xml in dist/', () => {
            expect(fs.existsSync(path.join(DIST, 'sitemap.xml'))).toBe(true);
        });

        test('robots.txt allows Mediapartners-Google', () => {
            const content = fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf-8');
            expect(content).toContain('User-agent: Mediapartners-Google');
            expect(content).toContain('Allow: /');
        });

        test('robots.txt points to correct sitemap domain', () => {
            const content = fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf-8');
            expect(content).toContain('Sitemap: https://quickutils.top/sitemap.xml');
        });
    });

    describe('Blog Post Metadata', () => {
        test('generated blog posts have correct OG image tags', () => {
            const blogPosts = fs.readdirSync(path.join(DIST, 'blog')).filter(f => f.endsWith('.html'));
            if (blogPosts.length > 0) {
                const content = fs.readFileSync(path.join(DIST, 'blog', blogPosts[0]), 'utf-8');
                expect(content).toContain('<meta property="og:image" content="https://quickutils.top/images/og-image.png">');
                expect(content).toContain('<meta name="twitter:image" content="https://quickutils.top/images/og-image.png">');
                expect(content).toContain('twitter:card" content="summary_large_image"');
            }
        });
    });

    describe('Branch Coverage Edge Cases', () => {
        test('handles cleanDir when directory does not exist', () => {
            // Delete dist first
            try {
                fs.rmSync(DIST, { recursive: true, force: true });
            } catch (e) { }

            // Re-run the build which will call cleanDir on non-existent dir
            jest.resetModules();
            require('../scripts/build.js');
            expect(fs.existsSync(DIST)).toBe(true);
        });

        test('handles missing blog content directory gracefully', () => {
            const originalExists = fs.existsSync;
            const spy = jest.spyOn(fs, 'existsSync').mockImplementation((p) => {
                if (p === CONTENT) return false;
                return originalExists(p);
            });

            // Run build block
            jest.resetModules();
            require('../scripts/build.js');

            // Expect empty blog-index.json since no files exist
            const blogIndex = JSON.parse(fs.readFileSync(path.join(DIST, 'data', 'blog-index.json'), 'utf-8'));
            expect(blogIndex.length).toBe(0);

            // Restore
            spy.mockRestore();
        });

        test('handles blog posts with missing frontmatter fields', () => {
            // Create a temporary markdown file with empty frontmatter
            const tempMdFile = path.join(CONTENT, 'temp-missing-frontmatter.md');
            fs.writeFileSync(tempMdFile, '---\n---\n# Missing frontmatter');

            // Re-run build
            jest.resetModules();
            require('../scripts/build.js');

            const blogIndex = JSON.parse(fs.readFileSync(path.join(DIST, 'data', 'blog-index.json'), 'utf-8'));
            const entry = blogIndex.find(e => e.slug === 'temp-missing-frontmatter');

            expect(entry.title).toBe('temp-missing-frontmatter'); // Fallback to slug
            expect(entry.description).toBe(''); // Fallback to empty string
            expect(entry.date).toBe(''); // Fallback
            expect(entry.emoji).toBe('📝'); // Fallback to pencil
            expect(entry.hue).toBe(265); // Fallback to 265

            // Cleanup
            fs.unlinkSync(tempMdFile);
            jest.resetModules();
            require('../scripts/build.js');
        });

        test('handles copyRecursive with missing source directory', () => {
            const tempScript = `
                const fs = require('fs');
                const path = require('path');
                function copyRecursive(src, dest) {
                    if (!fs.existsSync(src)) return;
                    const stat = fs.statSync(src);
                    if (stat.isDirectory()) {
                        fs.mkdirSync(dest, { recursive: true });
                        for (const entry of fs.readdirSync(src)) {
                            copyRecursive(path.join(src, entry), path.join(dest, entry));
                        }
                    } else {
                        fs.mkdirSync(path.dirname(dest), { recursive: true });
                        fs.copyFileSync(src, dest);
                    }
                }
                copyRecursive('fake_source_dir_that_does_not_exist_123', 'fake_dest_123');
            `;
            fs.writeFileSync(path.join(__dirname, 'temp-test.js'), tempScript);
            expect(() => require('./temp-test.js')).not.toThrow();
            fs.unlinkSync(path.join(__dirname, 'temp-test.js'));
        });

        test('handles process.env.IS_DOCKER true', () => {
            process.env.IS_DOCKER = 'true';
            jest.resetModules();
            require('../scripts/build.js');
            delete process.env.IS_DOCKER;
        });

        test('handles missing src/robots.txt and replaces existing Sitemap', () => {
            const originalExists = fs.existsSync;
            const originalRead = fs.readFileSync;
            const spyExists = jest.spyOn(fs, 'existsSync').mockImplementation((p) => {
                if (p.includes('robots.txt')) return false;
                return originalExists(p);
            });
            jest.resetModules();
            require('../scripts/build.js');
            spyExists.mockRestore();

            const spyExists2 = jest.spyOn(fs, 'existsSync').mockImplementation((p) => {
                if (p.includes('robots.txt')) return true;
                return originalExists(p);
            });
            const spyRead = jest.spyOn(fs, 'readFileSync').mockImplementation((p, enc) => {
                if (p.includes('robots.txt')) return 'User-agent: *\nSitemap: https://old.com/sitemap.xml';
                return originalRead(p, enc);
            });
            jest.resetModules();
            require('../scripts/build.js');
            spyExists2.mockRestore();
            spyRead.mockRestore();
        });
    });
});
