/**
 * Tests for data/database.json
 * Covers: structure, uniqueness, categories, content quality
 */
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'database.json');

describe('Database JSON', () => {
    let facts;

    beforeAll(() => {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        facts = JSON.parse(raw);
    });

    test('file exists and is valid JSON', () => {
        expect(fs.existsSync(DB_PATH)).toBe(true);
        expect(() => JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))).not.toThrow();
    });

    test('contains at least 500 facts', () => {
        expect(facts.length).toBeGreaterThanOrEqual(500);
    });

    test('each fact has required fields', () => {
        facts.forEach(fact => {
            expect(fact).toHaveProperty('id');
            expect(fact).toHaveProperty('text');
            expect(fact).toHaveProperty('category');
            expect(fact).toHaveProperty('source');
        });
    });

    test('all IDs are unique', () => {
        const ids = facts.map(f => f.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    test('all fact texts are unique (no duplicates)', () => {
        const texts = facts.map(f => f.text.toLowerCase());
        expect(new Set(texts).size).toBe(texts.length);
    });

    test('fact text is non-empty and meaningful (min 20 chars)', () => {
        facts.forEach(fact => {
            expect(fact.text.trim().length).toBeGreaterThan(20);
        });
    });

    test('categories are from the expected set', () => {
        const expected = [
            'Science', 'History', 'Nature', 'Space', 'Human Body',
            'Animals', 'Technology', 'Food', 'Geography', 'Pop Culture'
        ];
        const categories = [...new Set(facts.map(f => f.category))];
        categories.forEach(cat => {
            expect(expected).toContain(cat);
        });
    });

    test('has facts in at least 8 categories', () => {
        const categories = [...new Set(facts.map(f => f.category))];
        expect(categories.length).toBeGreaterThanOrEqual(8);
    });

    test('each category has at least 50 facts', () => {
        const catCounts = {};
        facts.forEach(f => {
            catCounts[f.category] = (catCounts[f.category] || 0) + 1;
        });
        Object.values(catCounts).forEach(count => {
            expect(count).toBeGreaterThanOrEqual(50);
        });
    });

    test('sources are non-empty', () => {
        facts.forEach(fact => {
            expect(fact.source.trim().length).toBeGreaterThan(0);
        });
    });

    test('no fact text contains HTML tags', () => {
        facts.forEach(fact => {
            expect(fact.text).not.toMatch(/<[^>]+>/);
        });
    });
});
