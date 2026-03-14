// Expose window.ENV_VARS for Cloudflare Pages environment variables
window.ENV_VARS = {
    // These will be overridden during build/deployment, placeholders for local dev
    ALPHA_VANTAGE_API_KEY: "demo", 
    NEWS_API_BASE: "https://rss.app/feeds/v1.1", // Mock RSS proxy
};
