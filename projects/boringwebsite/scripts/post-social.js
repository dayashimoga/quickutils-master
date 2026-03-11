/**
 * post-social.js — Posts daily quote to social media
 * Uses Mastodon API native integration (100% Free)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CURRENT_FILE = path.join(__dirname, '..', 'data', 'current-quote.json');
const SITE_URL = process.env.SITE_URL || 'https://quickutils.top';

// Mastodon Credentials
const MASTODON_TOKEN = process.env.MASTODON_ACCESS_TOKEN || '';
const MASTODON_INSTANCE = process.env.MASTODON_INSTANCE_URL || 'mastodon.social';

async function main() {
    console.log('📱 Social media posting...');

    let quote;
    try {
        quote = JSON.parse(fs.readFileSync(CURRENT_FILE, 'utf-8'));
    } catch (e) {
        console.error('❌ Cannot read current-quote.json:', e.message);
        process.exit(1);
    }

    const postContent = `✨ Today's Quote:\n\n"${quote.text}"\n— ${quote.author}\n\n🌐 More at ${SITE_URL}\n\n#motivation #quotes #dailyquotes #inspiration #dailylift`;

    console.log('📝 Prepared quote for Mastodon:');
    console.log(postContent);
    console.log('');

    if (MASTODON_TOKEN) {
        console.log(`🔗 Triggering Mastodon API posting to ${MASTODON_INSTANCE}...`);
        try {
            // Remove protocol if user included it in the variable
            const hostname = MASTODON_INSTANCE.replace(/^https?:\/\//, '').replace(/\/$/, '');
            const postData = JSON.stringify({
                status: postContent,
                visibility: 'public'
            });

            const options = {
                hostname: hostname,
                path: `/api/v1/statuses`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${MASTODON_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            await new Promise((resolve, reject) => {
                const req = https.request(options, (res) => {
                    res.on('data', () => { });
                    res.on('end', () => {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            console.log('✅ Mastodon API posted successfully (status:', res.statusCode + ')');
                            resolve();
                        } else {
                            console.error('❌ Mastodon API returned non-success status:', res.statusCode);
                            reject(new Error(`HTTP Status ${res.statusCode}`));
                        }
                    });
                });
                req.on('error', reject);
                req.write(postData);
                req.end();
            });
        } catch (e) {
            console.error('❌ Mastodon API post failed:', e.message);
        }
    } else {
        console.log('ℹ️ MASTODON_ACCESS_TOKEN not set — skipping social media post');
    }

    console.log('\n✨ Social media automation complete.');
}

main().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
