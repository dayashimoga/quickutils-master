# ChessOS V3 — Security Model

## Threat Model
ChessOS is a client-side static SPA. The primary attack surface is:
1. **Stored XSS via localStorage** — malicious input persisted in profile
2. **CDN compromise** — tampered dependencies
3. **Clickjacking** — embedding in malicious iframes

## Mitigations

### Input Sanitization
- `sanitizeHTML(str)` escapes HTML entities in all user-provided content
- Applied to: coach chat messages, PGN text display
- Technique: `textContent` assignment to a throwaway div, then reading `innerHTML`

### Content Security Policy
Defined in `_headers` file for static hosting (Netlify/Cloudflare Pages):
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https://cdn.jsdelivr.net;
  connect-src 'self' https://cdn.jsdelivr.net;
  worker-src 'self' blob:;
  child-src blob:;
```

### Additional Headers
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-XSS-Protection: 1; mode=block` — legacy XSS filter
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Error Handling
- `window.onerror` global handler catches uncaught exceptions
- `unhandledrejection` handler catches async errors
- Both show recoverable toast messages without crashing the UI
- Console errors are logged for debugging

### Data Privacy
- All data stored in `localStorage` — never sent to any server
- No analytics, tracking, or telemetry
- Export feature allows users to download their data as JSON
- No cookies used

## Known Limitations
- `unsafe-inline` and `unsafe-eval` required for Chess.js ESM import and dynamic styles
- CDN dependencies are not SRI-pinned (Subresource Integrity)
- localStorage has no encryption — profile data is readable in DevTools
