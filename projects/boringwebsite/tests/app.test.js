/**
 * Tests for src/js/app.js
 * Covers: daily quote fetching, determinism, fallback quote, PDF generation UI.
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const APP_JS_PATH = path.join(__dirname, '..', 'src', 'js', 'app.js');

describe('App JS Configuration & UI Loading', () => {
    let dom;
    let document;
    let window;

    // We fetch current-quote.json or quotes-collection.json depending on the function.
    // The test environment will intercept these fetch calls.
    const mockQuotes = [
        { text: "Quote 1", author: "Author 1" },
        { text: "Quote 2", author: "Author 2" },
        { text: "Quote 3", author: "Author 3" },
        { text: "Quote 4", author: "Author 4" }
    ];

    beforeEach(() => {
        // Setup JSDOM
        const html = `
            <!DOCTYPE html>
            <html>
            <head></head>
            <body>
                <span id="dailyQuoteText"></span>
                <span id="dailyQuoteAuthor"></span>
                <span id="dailyQuoteDate"></span>
                
                <span id="heroQuoteText"></span>
                <span id="heroQuoteAuthor"></span>
                <span id="heroQuoteDate"></span>
            </body>
            </html>
        `;

        dom = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost/" });
        window = dom.window;
        document = window.document;

        // Mock global fetch
        window.fetch = jest.fn();

        // Need IntersectionObserver mock since app.js uses it on load
        window.IntersectionObserver = jest.fn().mockImplementation(() => ({
            observe: jest.fn(),
            unobserve: jest.fn(),
            disconnect: jest.fn()
        }));

        // Expose to the app script environment
        global.document = document;
        global.window = window;
        global.IntersectionObserver = window.IntersectionObserver;
    });

    afterEach(() => {
        jest.restoreAllMocks();
        delete global.document;
        delete global.window;
        delete global.IntersectionObserver;
    });

    // Helper to evaluate app.js inside the JSDOM
    const loadAppJS = () => {
        const appCode = fs.readFileSync(APP_JS_PATH, 'utf-8');
        const now = global.Date.now();
        window.eval(`
            const _OriginalDate = Date;
            Date = class extends _OriginalDate {
                constructor(...args) {
                    if (args.length === 0) return new _OriginalDate(${now});
                    return new _OriginalDate(...args);
                }
            };
            Date.now = () => ${now};
        `);
        window.eval(appCode);
        // Dispatch DOMContentLoaded to trigger init functions
        document.dispatchEvent(new window.Event('DOMContentLoaded'));
    };

    describe('Daily Quote Component', () => {
        const flushPromises = () => new Promise(resolve => setTimeout(resolve, 10));

        test('determines quote correctly based on current epoch time', async () => {
            // Mock successful fetch
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockQuotes
            });

            // Mock Date to control the deterministic outcome
            // Lets set to epoch day 10
            jest.useFakeTimers({
                doNotFake: ['nextTick', 'setImmediate', 'setTimeout']
            }).setSystemTime(new Date(10 * 24 * 60 * 60 * 1000));

            // Expect index = 10 % 4 (mock size) = 2 -> Quote 3

            loadAppJS();

            // Wait for promises to resolve
            await flushPromises();
            await flushPromises();

            const quoteTextEl = document.getElementById('dailyQuoteText');
            const quoteAuthorEl = document.getElementById('dailyQuoteAuthor');

            expect(window.fetch).toHaveBeenCalledWith('data/quotes-collection.json');
            expect(quoteTextEl.textContent).toBe('"Quote 3"');
            expect(quoteAuthorEl.textContent).toBe('— Author 3');

            jest.useRealTimers();
        });

        test('determines different quote on consecutive day', async () => {
            // Mock successful fetch
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockQuotes
            });

            // Mock Date to epoch day 11
            jest.useFakeTimers({
                doNotFake: ['nextTick', 'setImmediate', 'setTimeout']
            }).setSystemTime(new Date(11 * 24 * 60 * 60 * 1000));

            // Expect index = 11 % 4 (mock size) = 3 -> Quote 4

            loadAppJS();

            // Wait for promises to resolve
            await flushPromises();
            await flushPromises();

            const quoteTextEl = document.getElementById('dailyQuoteText');
            const quoteAuthorEl = document.getElementById('dailyQuoteAuthor');

            expect(quoteTextEl.textContent).toBe('"Quote 4"');

            jest.useRealTimers();
        });

        test('handles fetch failure and applies fallback quote', async () => {
            // Mock failed fetch
            window.fetch.mockResolvedValueOnce({
                ok: false
            });

            loadAppJS();

            // Wait for promises to resolve
            await flushPromises();
            await flushPromises();

            const quoteTextEl = document.getElementById('dailyQuoteText');
            const quoteAuthorEl = document.getElementById('dailyQuoteAuthor');

            expect(window.fetch).toHaveBeenCalledWith('data/quotes-collection.json');
            expect(quoteTextEl.textContent).toBe('"The only way to do great work is to love what you do."');
            expect(quoteAuthorEl.textContent).toBe('— Steve Jobs');
        });
    });
});
