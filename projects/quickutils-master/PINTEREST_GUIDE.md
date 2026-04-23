# Pinterest Traffic Engine Guide

## 1. How Pinterest Integration Works
Pinterest acts as a visual search engine rather than a traditional social network. Users (Pinners) actively search for ideas, tools, and facts. When they click a Pin, it drives them directly to your website.

To make this work automatically for your network of sites, we have implemented:
1. **Domain Verification:** Claiming your website domains on Pinterest using a special meta tag. This tells Pinterest you own the content, unlocking analytics and boosting domain authority.
2. **Open Graph Integration:** By having Open Graph (`og:`) meta tags on your site, Pinterest automatically pulls the correct title, description, and preview image when someone saves a link.
3. **Pinterest Tag (Conversion Tracking):** A JavaScript snippet that tracks user actions on your site to see what leads to maximum engagement.
4. **Automated Pinning:** A Python script (`pinterest_automation.py`) that runs on a schedule. It connects to the Pinterest API using your Access Token, creates a visual Pin using your generated vertical cover images, and links back to your specific tools, facts, and directory items.

## 2. Core Requirements to Drive Traffic
- **Vertical Imagery (2:3 Aspect ratio):** Pins must be visually striking and vertical (e.g., 1000x1500 px). Square or horizontal images perform poorly on the mobile-heavy Pinterest feed. *We have completely custom generated vertical abstract backgrounds for your sites.*
- **Consistent Daily Pinning:** Pinterest algorithms strictly favor active accounts. Our automation script is heavily designed to organically pin 3-5 items a day rather than 100 all at once (which triggers spam filters).
- **Keyword-Rich Descriptions:** Just like Google SEO, Pinterest needs text descriptions. Your tool titles and project descriptions double as SEO keywords.
- **Claimed Domains:** Ensure the meta tag `<meta name="p:domain_verify"...>` remains active across all sites.

## 3. Step-by-Step Configuration Guide

### Step 1: Claim Domains on Pinterest
1. Log into your Pinterest Business Account.
2. Go to **Settings > Claimed Accounts**.
3. Add your domains (`quickutils.top`, `dailyfacts.quickutils.top`, etc.).
4. Select "Add HTML tag". 
5. Pinterest will crawl the `<meta name="p:domain_verify" content="c816c2b41079835efd234cb5afef59bf">` tag that is already present in your HTML templates and verify ownership.

### Step 2: Set up the Pinterest App for Automation
1. Go to Pinterest Developers (developers.pinterest.com).
2. Create an App to get your **App ID** and **App Secret**.
3. Generate an **Access Token** with permissions for `boards:read`, `boards:write`, `pins:read`, `pins:write`.

### Step 3: Configure Automation Script
The `pinterest_automation.py` script is located in `H:\boring\scripts\`.
It requires the following Environment Variable to be set where the script runs (like GitHub Actions):
`PINTEREST_ACCESS_TOKEN` = *[Your generated token]*

To run it manually locally for testing:
```bash
cd H:\boring
$env:PINTEREST_ACCESS_TOKEN="your_token_here"
python -m scripts.pinterest_automation
```

### Step 4: Asset Integration
We have successfully generated 5 unique vertical pin images and placed them in your website directories. They are referenced in the `og:image` tags in the HTML. Pinterest will automatically use these beautiful vertical abstract headers when you or anyone else shares a link to your site.
