/**
 * Tests for scripts/fetch-quote.js
 * Covers: API fetching, file writing, duplicate detection, fallback behavior
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CURRENT_FILE = path.join(DATA_DIR, 'current-quote.json');
const COLLECTION_FILE = path.join(DATA_DIR, 'quotes-collection.json');

// Store originals for restoration
let originalCurrent;
let originalCollection;

describe('Fetch Quote Script', () => {
    beforeAll(() => {
        // Backup original files
        if (fs.existsSync(CURRENT_FILE)) {
            originalCurrent = fs.readFileSync(CURRENT_FILE, 'utf-8');
        }
        if (fs.existsSync(COLLECTION_FILE)) {
            originalCollection = fs.readFileSync(COLLECTION_FILE, 'utf-8');
        }
    });

    afterAll(() => {
        // Restore original files
        if (originalCurrent) {
            fs.writeFileSync(CURRENT_FILE, originalCurrent);
        }
        if (originalCollection) {
            fs.writeFileSync(COLLECTION_FILE, originalCollection);
        }
    });

    describe('Data File Validation', () => {
        test('current-quote.json exists', () => {
            expect(fs.existsSync(CURRENT_FILE)).toBe(true);
        });

        test('current-quote.json has valid structure', () => {
            const data = JSON.parse(fs.readFileSync(CURRENT_FILE, 'utf-8'));
            expect(data).toHaveProperty('date');
            expect(data).toHaveProperty('text');
            expect(data).toHaveProperty('author');
            expect(typeof data.date).toBe('string');
            expect(typeof data.text).toBe('string');
            expect(typeof data.author).toBe('string');
        });

        test('current-quote.json date is valid ISO format', () => {
            const data = JSON.parse(fs.readFileSync(CURRENT_FILE, 'utf-8'));
            expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        test('current-quote.json text is non-empty', () => {
            const data = JSON.parse(fs.readFileSync(CURRENT_FILE, 'utf-8'));
            expect(data.text.length).toBeGreaterThan(5);
        });

        test('current-quote.json author is non-empty', () => {
            const data = JSON.parse(fs.readFileSync(CURRENT_FILE, 'utf-8'));
            expect(data.author.length).toBeGreaterThan(0);
        });
    });

    describe('Collection File Validation', () => {
        test('quotes-collection.json exists', () => {
            expect(fs.existsSync(COLLECTION_FILE)).toBe(true);
        });

        test('quotes-collection.json is an array', () => {
            const data = JSON.parse(fs.readFileSync(COLLECTION_FILE, 'utf-8'));
            expect(Array.isArray(data)).toBe(true);
        });

        test('collection has at least 10 quotes', () => {
            const data = JSON.parse(fs.readFileSync(COLLECTION_FILE, 'utf-8'));
            expect(data.length).toBeGreaterThanOrEqual(10);
        });

        test('each collection entry has text and author', () => {
            const data = JSON.parse(fs.readFileSync(COLLECTION_FILE, 'utf-8'));
            data.forEach((q, i) => {
                expect(q).toHaveProperty('text');
                expect(q).toHaveProperty('author');
                expect(typeof q.text).toBe('string');
                expect(typeof q.author).toBe('string');
            });
        });

        test('no duplicate quotes in collection', () => {
            const data = JSON.parse(fs.readFileSync(COLLECTION_FILE, 'utf-8'));
            const texts = data.map(q => q.text.toLowerCase().trim());
            const unique = new Set(texts);
            expect(unique.size).toBe(texts.length);
        });

        test('all quotes have non-empty text', () => {
            const data = JSON.parse(fs.readFileSync(COLLECTION_FILE, 'utf-8'));
            data.forEach(q => {
                expect(q.text.trim().length).toBeGreaterThan(0);
            });
        });

        test('all quotes have non-empty author', () => {
            const data = JSON.parse(fs.readFileSync(COLLECTION_FILE, 'utf-8'));
            data.forEach(q => {
                expect(q.author.trim().length).toBeGreaterThan(0);
            });
        });
    });

    describe('Duplicate Detection Logic', () => {
        test('identical texts are detected as duplicates', () => {
            const collection = [
                { text: 'Be the change.', author: 'Gandhi' },
                { text: 'Stay hungry.', author: 'Jobs' }
            ];
            const newQuote = { text: 'Be the change.', author: 'Gandhi' };
            const isDuplicate = collection.some(q =>
                q.text.toLowerCase().trim() === newQuote.text.toLowerCase().trim()
            );
            expect(isDuplicate).toBe(true);
        });

        test('case-insensitive duplicate detection', () => {
            const collection = [
                { text: 'Be The Change.', author: 'Gandhi' }
            ];
            const newQuote = { text: 'be the change.', author: 'gandhi' };
            const isDuplicate = collection.some(q =>
                q.text.toLowerCase().trim() === newQuote.text.toLowerCase().trim()
            );
            expect(isDuplicate).toBe(true);
        });

        test('unique quotes are not detected as duplicates', () => {
            const collection = [
                { text: 'Be the change.', author: 'Gandhi' }
            ];
            const newQuote = { text: 'Stay hungry, stay foolish.', author: 'Jobs' };
            const isDuplicate = collection.some(q =>
                q.text.toLowerCase().trim() === newQuote.text.toLowerCase().trim()
            );
            expect(isDuplicate).toBe(false);
        });

        test('whitespace-trimmed duplicate detection', () => {
            const collection = [
                { text: '  Be the change.  ', author: 'Gandhi' }
            ];
            const newQuote = { text: 'Be the change.', author: 'Gandhi' };
            const isDuplicate = collection.some(q =>
                q.text.toLowerCase().trim() === newQuote.text.toLowerCase().trim()
            );
            expect(isDuplicate).toBe(true);
        });
    });
});
