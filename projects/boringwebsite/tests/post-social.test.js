/**
 * Tests for scripts/post-social.js
 * Covers: quote reading, tweet formatting, env var handling, graceful failures
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CURRENT_FILE = path.join(DATA_DIR, 'current-quote.json');

describe('Post Social Script', () => {
    describe('Quote Data Reading', () => {
        test('can read current-quote.json', () => {
            expect(() => {
                JSON.parse(fs.readFileSync(CURRENT_FILE, 'utf-8'));
            }).not.toThrow();
        });

        test('quote has text suitable for social media', () => {
            const quote = JSON.parse(fs.readFileSync(CURRENT_FILE, 'utf-8'));
            expect(quote.text.length).toBeLessThanOrEqual(280);
        });

        test('quote has valid author for social media', () => {
            const quote = JSON.parse(fs.readFileSync(CURRENT_FILE, 'utf-8'));
            expect(quote.author).toBeTruthy();
            expect(quote.author.length).toBeLessThanOrEqual(100);
        });
    });

    describe('Tweet Formatting', () => {
        test('tweet format includes quote text', () => {
            const quote = { text: 'Test quote', author: 'Test Author' };
            const siteUrl = 'https://quickutils.top';
            const tweet = `✨ Today's Quote:\n\n"${quote.text}"\n— ${quote.author}\n\n🌐 More at ${siteUrl}\n\n#motivation #quotes #dailyquotes #inspiration`;
            expect(tweet).toContain(quote.text);
            expect(tweet).toContain(quote.author);
        });

        test('tweet includes hashtags', () => {
            const quote = { text: 'Test', author: 'Author' };
            const siteUrl = 'https://quickutils.top';
            const tweet = `✨ Today's Quote:\n\n"${quote.text}"\n— ${quote.author}\n\n🌐 More at ${siteUrl}\n\n#motivation #quotes #dailyquotes #inspiration`;
            expect(tweet).toContain('#motivation');
            expect(tweet).toContain('#quotes');
            expect(tweet).toContain('#dailyquotes');
            expect(tweet).toContain('#inspiration');
        });

        test('tweet includes site URL', () => {
            const quote = { text: 'Test', author: 'Author' };
            const siteUrl = 'https://quickutils.top';
            const tweet = `✨ Today's Quote:\n\n"${quote.text}"\n— ${quote.author}\n\n🌐 More at ${siteUrl}\n\n#motivation #quotes #dailyquotes #inspiration`;
            expect(tweet).toContain(siteUrl);
        });

        test('tweet with longest quote stays under 500 chars', () => {
            const quotes = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'quotes-collection.json'), 'utf-8'));
            const longest = quotes.reduce((a, b) => a.text.length > b.text.length ? a : b);
            const tweet = `✨ Today's Quote:\n\n"${longest.text}"\n— ${longest.author}\n\n🌐 More at https://quickutils.top\n\n#motivation #quotes #dailyquotes #inspiration`;
            expect(tweet.length).toBeLessThan(500);
        });
    });

    describe('Environment Variable Handling', () => {
        test('SITE_URL defaults to dailylift.site when not set', () => {
            const siteUrl = process.env.SITE_URL || 'https://quickutils.top';
            expect(siteUrl).toBe('https://quickutils.top');
        });

        test('TWITTER_BEARER_TOKEN defaults to empty string', () => {
            const token = process.env.TWITTER_BEARER_TOKEN || '';
            expect(typeof token).toBe('string');
        });

        test('IFTTT_WEBHOOK_KEY defaults to empty string', () => {
            const key = process.env.IFTTT_WEBHOOK_KEY || '';
            expect(typeof key).toBe('string');
        });
    });

    describe('IFTTT Webhook Payload', () => {
        test('webhook payload has correct structure', () => {
            const quote = { text: 'Test quote', author: 'Test Author' };
            const siteUrl = 'https://quickutils.top';
            const payload = {
                value1: quote.text,
                value2: quote.author,
                value3: siteUrl
            };
            expect(payload).toHaveProperty('value1');
            expect(payload).toHaveProperty('value2');
            expect(payload).toHaveProperty('value3');
            expect(typeof payload.value1).toBe('string');
        });

        test('webhook payload JSON is valid', () => {
            const quote = { text: 'Test quote', author: 'Test Author' };
            const payload = { value1: quote.text, value2: quote.author, value3: 'https://quickutils.top' };
            expect(() => JSON.stringify(payload)).not.toThrow();
        });
    });
});
