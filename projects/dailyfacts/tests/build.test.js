/**
 * Tests for scripts/build.js
 * Covers: build output, file copying
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

describe('Build Script', () => {
    beforeAll(() => {
        // Run build
        jest.resetModules();
        require('../scripts/build.js');
    });

    test('creates dist directory', () => {
        expect(fs.existsSync(DIST)).toBe(true);
    });

    test('copies index.html to dist', () => {
        expect(fs.existsSync(path.join(DIST, 'index.html'))).toBe(true);
    });

    test('copies CSS to dist', () => {
        expect(fs.existsSync(path.join(DIST, 'css', 'style.css'))).toBe(true);
    });

    test('copies JS to dist', () => {
        expect(fs.existsSync(path.join(DIST, 'js', 'app.js'))).toBe(true);
    });

    test('copies database.json to dist/data', () => {
        expect(fs.existsSync(path.join(DIST, 'data', 'database.json'))).toBe(true);
    });

    test('creates robots.txt', () => {
        const robots = path.join(DIST, 'robots.txt');
        expect(fs.existsSync(robots)).toBe(true);
        expect(fs.readFileSync(robots, 'utf-8')).toContain('User-agent');
    });

    test('dist/index.html has DOCTYPE', () => {
        const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf-8');
        expect(html).toContain('<!DOCTYPE html>');
    });

    test('dist database.json is valid JSON with facts', () => {
        const data = JSON.parse(fs.readFileSync(path.join(DIST, 'data', 'database.json'), 'utf-8'));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
    });
});
