# QuickUtils API Directory: Deployment, Monetization, and Automation Guide

This document is the **Comprehensive Step-by-Step Configuration Guide** for the QuickUtils API Directory. It details exactly how to configure every third-party tool, automation script, and monetization platform integrated into the repository.

---

## 1. Hosting & Domain Setup (Cloudflare Pages)

QuickUtils API Directory uses a Zero-Cost Jamstack Architecture. It is hosted on Cloudflare Pages, which serves the static HTML/CSS/JS files globally for free.

### Step-by-Step Configuration:
1. **Purchase a Domain:** You are using `quickutils.top` (confirmed via Porkbun).
2. **Deploy on Cloudflare Pages:**
   - Log into [Cloudflare](https://dash.cloudflare.com/).
   - Connect your GitHub account and select your `boring-api-directory` repository.
   - Configure the Build settings:
     - **Build command:** `python -m scripts.build_directory && python -m scripts.generate_sitemap`
     - **Publish directory:** `dist`
3. **Configure the Custom Domain:**
   - In Cloudflare, go to **Pages** > **Custom domains**.
   - Enter `directory.quickutils.top`.
   - Ensure your DNS (Porkbun or Cloudflare) points to the `.pages.dev` URL.
4. **SSL Certificate:** Cloudflare automatically provides free SSL.

---

## 2. Traffic Analytics (Google Analytics 4)

Google Analytics (GA4) tracks your website visitors, page views, and user behavior.

### Step-by-Step Configuration:
1. **Create an Account:** Go to [Google Analytics](https://analytics.google.com/) and sign in.
2. **Create a Property:** Set up a new property using your website URL.
3. **Get the Measurement ID:** Create a **Web Data Stream** for your site. Once created, copy the **Measurement ID** (format: `G-XXXXXXXXXX`).
4. **Integration in QuickUtils:**
   - The Measurement ID `G-LKF615Z8NY` is integrated via GitHub Secrets.
   - Template files in `src/templates/` automatically include the tracking code.
   - Commit and push to trigger a build.

---

## 3. Passive Income (Google AdSense)

Google AdSense injects contextual banner ads into the website.

### Step-by-Step Configuration:
1. **Apply for AdSense:** Go to [Google AdSense](https://adsense.google.com/start/) and sign up.
2. **Add Your Site:** In the AdSense dashboard, navigate to **Sites** and add your domain.
3. **Get Your Publisher ID:** Note your Publisher ID (e.g., `ca-pub-5193703345853377`). This is already integrated into the `adsbygoogle.js` script tag in the `<head>` of all HTML pages.
4. **Generate Ad Units for Tracking:**
   - In AdSense, go to **Ads** > **By ad unit** > **Display ads**.
   - Create distinct ad units so you can track revenue per page type (e.g., "Homepage Banner", "Tools Page", "Blog Posts").
   - Click **Create** and copy the `data-ad-slot` number (e.g., `2246027256`) from the generated code snippet.
5. **Integration in QuickUtils:**
   - The Publisher ID `ca-pub-5193703345853377` is used in `src/ads.txt`.
   - Ad slots slots are handled dynamically in templates like `item.html`.
6. **Wait for Approval ("Getting Ready"):**
   - Google takes **3–14 days** to manually review the site for quality guidelines.
   - During the "Getting ready" state in your AdSense dashboard, **ads will intentionally appear as blank spaces** on your site. This is completely standard. 
   - **Do not remove your ad codes** during this time. Google's crawlers need to find the codes to verify your ownership.
7. **Configure `ads.txt` Integration:**
   - AdSense requires a file called `ads.txt` (Authorized Digital Sellers) at the root of your domain. It is a public ledger proving Google is authorized to sell your ad space.
   - We have already integrated this by placing `src/ads.txt` containing your publisher ID into the repository.
   - `scripts/build.js` automatically copies this file to your `dist/` directory during Netlify deployment so Google crawlers can successfully find `https://dailylift.site/ads.txt`. If you ever change your Publisher ID, update this file.

---

## 4. Affiliate Income (Amazon Associates)

Amazon Associates allows you to earn commissions when users click your links and buy recommended products (like books).

### Step-by-Step Configuration:
1. **Sign Up:** Create a free account at the [Amazon Associates Central](https://affiliate-program.amazon.com/).
2. **Get Tracking ID:** Note your Store/Tracking ID (e.g., `quickutils-21`).
3. **Generate Affiliate Links:**
   - Search for the product (e.g., *Atomic Habits*) on Amazon.
   - Use the **Amazon SiteStripe** toolbar at the top of the page to generate a "Text" link.
4. **Integration in QuickUtils:**
   - Set the `AMAZON_AFFILIATE_TAG` in GitHub Secrets (e.g., `quickutils-21`).
   - The `build_directory.py` script automatically injects this tag into all book links on API detail pages.

---

## 5. Digital Product Sales (Gumroad)

Gumroad is used to sell digital products directly to your audience (e.g., the PDF eBook of 500+ Quotes).

### Step-by-Step Configuration:
1. **Create an Account:** Sign up at [Gumroad](https://gumroad.com/).
2. **Create a Product:**
   - Go to **Products** > **New Product**.
   - Select "Digital Product".
   - Set the Price (you can set it to $0+ to allow "Pay what you want", offering it for free to build an email list).
   - Upload your PDF file (e.g., `DailyLift-500-Quotes.pdf`).
3. **Get the Checkout Link:** Publish the product and copy the share URL (e.g., `https://yourname.gumroad.com/l/quotes`).
4. **Integration in DailyLift:**
   - Open `src/index.html`.
   - Locate the download button: `<a href="#" id="downloadQuotePdf">📄 Download 500+ Quotes PDF (Free)</a>`.
   - Replace `#` with your Gumroad product URL. (Optionally, use the Gumroad overlay script for an in-page checkout).

---

## 6. Social Media Automation (Mastodon / Fediverse)

QuickUtils API Directory automatically posts a random daily API to a Mastodon social profile every day at 12:00 PM UTC, powered by a free GitHub Action.

### Step-by-Step Configuration:
1. **Create a Mastodon Account:** Go to a server like [mastodon.social](https://mastodon.social) and create your brand account.
2. **Generate API Token:**
   - In Mastodon, go to **Preferences** (Gear Icon) > **Development** > **New Application**.
   - Name the app (e.g., "DailyLift Bot").
   - Under Scopes, you only need to check `write:statuses`.
   - Click **Submit**, then click on the app name to view the **Access Token**. Copy this token.
3. **Add Secrets to GitHub:**
   - Go to your GitHub repository on github.com.
   - Navigate to **Settings** > **Secrets and variables** > **Actions** > **New repository secret**.
   - Create `MASTODON_ACCESS_TOKEN` and paste your token.
   - Create `MASTODON_INSTANCE_URL` and set it to your server (e.g., `mastodon.social`).
5. **Generating Link Previews (Open Graph Images):**
   - We have integrated an `og-image.png` file in the `src/images/` folder.
   - All HTML files (`index.html`, `tools.html`, etc.) contain `<meta property="og:image">` tags pointing to this file.
   - This ensures that when the automation posts your link to Mastodon (or if users share it on Twitter/LinkedIn), a rich, graphical preview card appears instead of a blank grey box.
