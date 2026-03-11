/**
 * Tests for scripts/lint-check.js
 * Covers: HTML lint, JS lint, YAML lint, JSON lint, CSS lint
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DATA = path.join(ROOT, 'data');

describe('Lint Checks', () => {
    describe('HTML Files', () => {
        const htmlFiles = ['index.html', 'tools.html', 'blog.html', 'about.html'];

        test.each(htmlFiles)('%s has DOCTYPE', (file) => {
            const content = fs.readFileSync(path.join(SRC, file), 'utf-8');
            expect(content).toContain('<!DOCTYPE html>');
        });

        test.each(htmlFiles)('%s has charset meta', (file) => {
            const content = fs.readFileSync(path.join(SRC, file), 'utf-8');
            expect(content).toContain('meta charset=');
        });

        test.each(htmlFiles)('%s has viewport meta', (file) => {
            const content = fs.readFileSync(path.join(SRC, file), 'utf-8');
            expect(content).toContain('meta name="viewport"');
        });

        test.each(htmlFiles)('%s has non-empty title', (file) => {
            const content = fs.readFileSync(path.join(SRC, file), 'utf-8');
            const match = content.match(/<title>([\s\S]*?)<\/title>/);
            expect(match).not.toBeNull();
            expect(match[1].trim().length).toBeGreaterThan(0);
        });

        test.each(htmlFiles)('%s has lang attribute', (file) => {
            const content = fs.readFileSync(path.join(SRC, file), 'utf-8');
            expect(content).toContain('lang="en"');
        });

        test.each(htmlFiles)('%s has Pinterest verification meta tag', (file) => {
            const content = fs.readFileSync(path.join(SRC, file), 'utf-8');
            expect(content).toContain('name="p:domain_verify"');
            expect(content).toContain('content="c816c2b41079835efd234cb5afef59bf"');
        });

        test('index.html has Amazon affiliate links', () => {
            const content = fs.readFileSync(path.join(SRC, 'index.html'), 'utf-8');
            expect(content).toContain('amazon.com/dp/');
            expect(content).toContain('tag=df-quickutils-21');
        });

        test('index.html has Pinterest share button', () => {
            const content = fs.readFileSync(path.join(SRC, 'index.html'), 'utf-8');
            expect(content).toContain('pinterest.com/pin/create/button/');
        });
    });

    describe('JavaScript Files', () => {
        function findJsFiles(dir) {
            const files = [];
            if (!fs.existsSync(dir)) return files;
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) files.push(...findJsFiles(full));
                else if (entry.name.endsWith('.js')) files.push(full);
            }
            return files;
        }

        const jsFiles = [
            ...findJsFiles(path.join(SRC, 'js')),
            ...findJsFiles(path.join(SRC, 'tools'))
        ];

        test('no JS file uses eval()', () => {
            jsFiles.forEach(file => {
                const content = fs.readFileSync(file, 'utf-8');
                expect(content).not.toContain('eval(');
            });
        });

        test('no JS file uses document.write()', () => {
            jsFiles.forEach(file => {
                const content = fs.readFileSync(file, 'utf-8');
                expect(content).not.toContain('document.write(');
            });
        });

        test('all JS files are non-empty', () => {
            jsFiles.forEach(file => {
                const content = fs.readFileSync(file, 'utf-8');
                expect(content.trim().length).toBeGreaterThan(10);
            });
        });
    });

    describe('JSON Files', () => {
        test('current-quote.json is valid JSON', () => {
            const content = fs.readFileSync(path.join(DATA, 'current-quote.json'), 'utf-8');
            expect(() => JSON.parse(content)).not.toThrow();
        });

        test('quotes-collection.json is valid JSON', () => {
            const content = fs.readFileSync(path.join(DATA, 'quotes-collection.json'), 'utf-8');
            expect(() => JSON.parse(content)).not.toThrow();
        });
    });

    describe('YAML Files', () => {
        function findYamlFiles(dir) {
            const files = [];
            if (!fs.existsSync(dir)) return files;
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) files.push(...findYamlFiles(full));
                else if (entry.name.endsWith('.yml') || entry.name.endsWith('.yaml')) files.push(full);
            }
            return files;
        }

        const yamlFiles = findYamlFiles(path.join(ROOT, '.github'));

        test('YAML files exist', () => {
            expect(yamlFiles.length).toBeGreaterThan(0);
        });

        test('no YAML file contains tabs', () => {
            yamlFiles.forEach(file => {
                const content = fs.readFileSync(file, 'utf-8');
                expect(content).not.toContain('\t');
            });
        });

        test('all YAML files are non-empty', () => {
            yamlFiles.forEach(file => {
                const content = fs.readFileSync(file, 'utf-8');
                expect(content.trim().length).toBeGreaterThan(10);
            });
        });
    });

    describe('CSS Files', () => {
        test('style.css has balanced curly braces', () => {
            const content = fs.readFileSync(path.join(SRC, 'css', 'style.css'), 'utf-8');
            const opens = (content.match(/{/g) || []).length;
            const closes = (content.match(/}/g) || []).length;
            expect(opens).toBe(closes);
        });

        test('style.css is non-empty', () => {
            const content = fs.readFileSync(path.join(SRC, 'css', 'style.css'), 'utf-8');
            expect(content.length).toBeGreaterThan(1000);
        });

        test('style.css imports Google Fonts', () => {
            const content = fs.readFileSync(path.join(SRC, 'css', 'style.css'), 'utf-8');
            expect(content).toContain('fonts.googleapis.com');
        });

        test('style.css defines CSS custom properties', () => {
            const content = fs.readFileSync(path.join(SRC, 'css', 'style.css'), 'utf-8');
            expect(content).toContain(':root');
            expect(content).toContain('--clr-');
        });

        test('style.css has responsive breakpoints', () => {
            const content = fs.readFileSync(path.join(SRC, 'css', 'style.css'), 'utf-8');
            expect(content).toContain('@media');
            expect(content).toContain('max-width');
        });
    });

    describe('File Structure', () => {
        test('required directories exist', () => {
            expect(fs.existsSync(path.join(ROOT, 'src'))).toBe(true);
            expect(fs.existsSync(path.join(ROOT, 'scripts'))).toBe(true);
            expect(fs.existsSync(path.join(ROOT, 'data'))).toBe(true);
            expect(fs.existsSync(path.join(ROOT, 'content', 'blog'))).toBe(true);
            expect(fs.existsSync(path.join(ROOT, '.github', 'workflows'))).toBe(true);
        });

        test('required root files exist', () => {
            expect(fs.existsSync(path.join(ROOT, 'package.json'))).toBe(true);
            expect(fs.existsSync(path.join(ROOT, 'README.md'))).toBe(true);
            expect(fs.existsSync(path.join(ROOT, '.gitignore'))).toBe(true);
            expect(fs.existsSync(path.join(ROOT, 'Dockerfile'))).toBe(true);
            expect(fs.existsSync(path.join(ROOT, 'docker-compose.yml'))).toBe(true);
        });

        test('blog has at least 10 markdown articles', () => {
            const mdFiles = fs.readdirSync(path.join(ROOT, 'content', 'blog')).filter(f => f.endsWith('.md'));
            expect(mdFiles.length).toBeGreaterThanOrEqual(10);
        });

        test('workflows directory has required YAML files', () => {
            const yamlFiles = fs.readdirSync(path.join(ROOT, '.github', 'workflows'));
            expect(yamlFiles).toContain('ci.yml');
            expect(yamlFiles).toContain('update-content.yml');
            expect(yamlFiles).toContain('weekly-blog.yml');
        });
    });
});
