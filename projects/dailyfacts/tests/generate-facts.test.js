/**
 * Tests for scripts/generate-facts.js
 * Covers: generation, categories, uniqueness, all batches
 */
const { generateDatabase, CATEGORIES, FACTS_BY_CATEGORY, EXTRA_FACTS, EXTRA_FACTS_2, EXTRA_FACTS_3 } = require('../scripts/generate-facts');

describe('Generate Facts Script', () => {
    let facts;

    beforeAll(() => {
        facts = generateDatabase();
    });

    test('generates 1000 facts', () => {
        expect(facts.length).toBe(1000);
    });

    test('all 10 categories are defined', () => {
        expect(CATEGORIES.length).toBe(10);
    });

    test('base facts has all categories', () => {
        CATEGORIES.forEach(cat => {
            expect(FACTS_BY_CATEGORY[cat]).toBeDefined();
            expect(FACTS_BY_CATEGORY[cat].length).toBeGreaterThan(0);
        });
    });

    test('extra facts batch 1 has all categories', () => {
        CATEGORIES.forEach(cat => {
            expect(EXTRA_FACTS[cat]).toBeDefined();
            expect(EXTRA_FACTS[cat].length).toBeGreaterThan(0);
        });
    });

    test('extra facts batch 2 has all categories', () => {
        CATEGORIES.forEach(cat => {
            expect(EXTRA_FACTS_2[cat]).toBeDefined();
            expect(EXTRA_FACTS_2[cat].length).toBeGreaterThan(0);
        });
    });

    test('extra facts batch 3 has all categories', () => {
        CATEGORIES.forEach(cat => {
            expect(EXTRA_FACTS_3[cat]).toBeDefined();
            expect(EXTRA_FACTS_3[cat].length).toBeGreaterThan(0);
        });
    });

    test('each fact has required fields', () => {
        facts.forEach(f => {
            expect(f).toHaveProperty('id');
            expect(f).toHaveProperty('text');
            expect(f).toHaveProperty('category');
            expect(f).toHaveProperty('source');
        });
    });

    test('IDs are sequential starting from 1', () => {
        facts.forEach((f, i) => {
            expect(f.id).toBe(i + 1);
        });
    });

    test('all texts are unique', () => {
        const texts = facts.map(f => f.text.toLowerCase());
        expect(new Set(texts).size).toBe(texts.length);
    });

    test('categories are from CATEGORIES constant', () => {
        facts.forEach(f => {
            expect(CATEGORIES).toContain(f.category);
        });
    });

    test('each category has exactly 100 facts', () => {
        const counts = {};
        facts.forEach(f => { counts[f.category] = (counts[f.category] || 0) + 1; });
        CATEGORIES.forEach(cat => {
            expect(counts[cat]).toBe(100);
        });
    });
});
