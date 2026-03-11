# Zero-Cost Architecture for Daily Quotes

This document explains the technical implementation of the "Quote of the Day" architecture designed to run at absolutely no cost regarding Netlify build minutes while maintaining a daily updated social media presence.

## The Problem
Previously, a GitHub Action triggered daily to fetch a new quote from an API (e.g., ZenQuotes or Quotable) and save it to `data/current-quote.json`. The action then committed this file to the `main` branch. Every commit on the `main` branch triggered a Netlify build, rapidly draining the 300 free monthly build minutes.

## The Solution
To fix this, we decoupled the **website quote display** from the **social media updates**.

### 1. Website Frontend (Client-side rendering)
Instead of relying on a newly built `current-quote.json`, the website holds a static database of 925 curated quotes in `data/quotes-collection.json`. 
In `src/js/app.js`, the application loads this JSON dynamically when the user visits the page. It picks exactly one quote **deterministically** based on the current mathematical real-world date (the epoch day):
```javascript
const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
const quoteIndex = daysSinceEpoch % quotes.length;
```
Because of this logic, the quote naturally changes every day at midnight local time inside the user's browser, without any files changing on the server, resulting in **0 Netlify builds**.

### 2. Social Media Automation
The GitHub Action (`.github/workflows/update-content.yml`) still runs every day at 00:00 UTC.
It executes `node scripts/fetch-quote.js` and `node scripts/post-social.js`.
It fetches a *brand new quote* from an external API, posts it to Mastodon, and then simply finishes the job. **It does not run `git commit`.**

Since public repositories get unlimited free minutes for GitHub Actions, the script costs $0, and no commits are pushed to Netlify, meaning your automated social media presence is also **0 Netlify builds**.

---

## What Could Go Wrong & How to Debug

### Issue: The Quote of the Day on the website is not changing.
* **Why it happens:** The user's browser might heavily cache the `app.js` file or the `data/quotes-collection.json` file.
* **How to verify:** Open the site in an Incognito window to check if the quote is the same.
* **How to fix / Prevents:** Netlify is already configured in `netlify.toml` to cache `/data/*` for 3600 seconds (1 hour) max. It will naturally refresh.

### Issue: The GitHub Action stops posting to Social Media.
* **Why it happens:** The external Quote API (ZenQuotes or Quotable) might be down, or the Mastodon Access Token has expired.
* **How to debug:**
  1. Go to your repository on GitHub.
  2. Click the **Actions** tab.
  3. Click the failed **Daily Quote Update** workflow run.
  4. Expand the "Post to Social Media" step. If it says `Unauthorized`, your Mastodon token expired and you need to update `MASTODON_ACCESS_TOKEN` in GitHub repository Secrets. If it fails on the fetch step, the Quote APIs are likely having an outage.

### Issue: The site is empty or throws JS errors after a Git push.
* **Why it happens:** A syntax error was introduced to `src/js/app.js` or `data/quotes-collection.json` is corrupted (e.g., missing a comma).
* **How to prevent & debug:** Run the Docker verification suite locally before pushing!
  ```bash
  docker compose run --rm ci npm run test
  ```
  If it passes perfectly, the code is safe to push. 

### Issue: Running out of quotes?
* **Why it happens:** Once the epoch day modulus wraps around (in about 2.5 years since we have 925 quotes), the quotes will start repeating in the exact same order.
* **How to fix:** We can run the `bulk-quotes.js` script to seamlessly download 500 more quotes to the collection and commit them to Git.

---

## Validation and Longevity

### 1. Will it work?
**Yes.** We have completely separated your website's "Quote of the Day" feature from your automated social media bot. 
- **The Website:** Instead of needing Netlify to rebuild the site every day to display a new quote, the site now uses a tiny piece of JavaScript (`app.js`) to look at the current calendar date and instantly pick one of the 925 quotes we saved in `quotes-collection.json`. Because no files are changed on the server, Netlify doesn't run a build, saving you 100% of your build minutes for that feature.
- **Social Media:** The GitHub Action (`update-content.yml`) still wakes up every day at midnight. Now, it just silently fetches a fresh quote from an external API (like ZenQuotes), posts it directly to Mastodon using your saved access token, and goes back to sleep. Since it no longer runs `git commit` to save the quote to your repo, it doesn't trigger Netlify.

### 2. How long will it post automatically with zero cost?
- **Social Media (Mastodon):** It will post **indefinitely**. Because it hits external APIs for fresh quotes every single day, it will never run out of content. As long as your Mastodon Access Token remains valid and your GitHub repository remains "Public", this will run forever at absolute zero cost (GitHub Actions are 100% free for public repositories).
- **Website Quotes:** We bulk-downloaded 925 handcrafted quotes directly into your `data/quotes-collection.json` file. Because the site selects one quote per day, it will run for **over 2.5 years (925 days)** before it ever repeats a Quote of the Day on your homepage.

### 3. How was this tested?
This architecture was rigorously tested locally in a sterile environment to ensure robustness:
1. **Docker Environment:** A Docker CI container (`boringwebsite-ci`) was created to ensure identical test running conditions across different machines.
2. **Time-Travel Unit Testing:** A comprehensive unit test (`tests/app.test.js`) was engineered. Using `JSDOM` and Jest's "fake timers", we simulated time travel, proving mathematically that if a user visits the site on Day 10, they see "Quote A", and on Day 11, they see "Quote B". We also asserted that UI fallback quotes load safely if the JSON load fails.
3. **Full Suite Verification:** The entire test suite (273 individual tests) executed within Docker. It meticulously checks the HTML structure, SEO tags, interactive tools, the Sitemap generator, and the Build script paths. All tests successfully passed.
