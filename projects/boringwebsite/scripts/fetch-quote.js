/**
 * fetch-quote.js — Fetches a daily quote from ZenQuotes API
 * Writes to /data/current-quote.json and appends to /data/quotes-collection.json
 * Run via GitHub Actions: node scripts/fetch-quote.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CURRENT_FILE = path.join(DATA_DIR, 'current-quote.json');
const COLLECTION_FILE = path.join(DATA_DIR, 'quotes-collection.json');

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'DailyLift/1.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Failed to parse response: ' + data.substring(0, 200)));
                }
            });
        }).on('error', reject);
    });
}

async function fetchFromZenQuotes() {
    const data = await httpsGet('https://zenquotes.io/api/random');
    if (data && Array.isArray(data) && data.length > 0 && data[0].q) {
        return { text: data[0].q, author: data[0].a || 'Unknown' };
    }
    throw new Error('ZenQuotes: Invalid response');
}

async function fetchFromQuotable() {
    const data = await httpsGet('https://api.quotable.io/random');
    if (data && data.content) {
        return { text: data.content, author: data.author || 'Unknown' };
    }
    throw new Error('Quotable: Invalid response');
}

async function main() {
    console.log('🔄 Fetching daily quote...');

    let quote;
    try {
        quote = await fetchFromZenQuotes();
        console.log('✅ Fetched from ZenQuotes');
    } catch (e) {
        console.log('⚠️ ZenQuotes failed:', e.message);
        try {
            quote = await fetchFromQuotable();
            console.log('✅ Fetched from Quotable API');
        } catch (e2) {
            console.log('⚠️ Quotable failed:', e2.message);
            console.log('ℹ️ Using fallback quote');
            quote = {
                text: 'The best preparation for tomorrow is doing your best today.',
                author: 'H. Jackson Brown Jr.'
            };
        }
    }

    const today = new Date().toISOString().split('T')[0];
    const currentQuote = {
        date: today,
        text: quote.text,
        author: quote.author
    };

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Write current quote
    fs.writeFileSync(CURRENT_FILE, JSON.stringify(currentQuote, null, 2));
    console.log('📝 Updated current-quote.json');

    // Append to collection (avoid duplicates)
    let collection = [];
    if (fs.existsSync(COLLECTION_FILE)) {
        try {
            collection = JSON.parse(fs.readFileSync(COLLECTION_FILE, 'utf-8'));
        } catch (e) {
            collection = [];
        }
    }

    const isDuplicate = collection.some(q =>
        q.text.toLowerCase().trim() === quote.text.toLowerCase().trim()
    );

    if (!isDuplicate) {
        collection.push({ text: quote.text, author: quote.author });
        fs.writeFileSync(COLLECTION_FILE, JSON.stringify(collection, null, 2));
        console.log(`📚 Added to collection (total: ${collection.length} quotes)`);
    } else {
        console.log('ℹ️ Quote already in collection, skipping');
    }

    console.log(`\n✨ Today's quote: "${quote.text}" — ${quote.author}`);
}

main().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
