# Changelog

## [3.0.1] - 2026-07-24

### 🔴 Critical Fixes
- **Fixed**: Cloudflare edge cache serving stale JS — added `?v=3.0.1` cache-bust to all 6 static assets
- **Fixed**: Navigation click handler missing view init calls for 7 views (deep-analytics, coach, community, assessment, boss, skilltree, vis-lab)
- **Fixed**: `navigateToView()` missing render calls for deep-analytics radar/heatmap/ELO chart

### ✨ Enhancements
- **Spaced Repetition**: SM-2 algorithm now wired on opening sequence completion — calculates next review date and interval
- **Opening Lab**: Repertoire list now shows next review date (📅 date or ⏰ Due now) per line
- **Cache-busting**: All CSS/JS assets include `?v=3.0.1` to prevent stale Cloudflare edge responses

### 📦 Deployment
- Synced all source → `dist/` directory
- Pushed to `origin/main` for Cloudflare Pages auto-deploy

## [3.0.0] - 2026-07-23

### 🔴 Critical Fixes (Sprint 1)
- **BREAKING**: Replaced all `Math.random()` evaluation with real Stockfish centipawn analysis
- **BREAKING**: Replaced Tournament Center `alert()` stubs with functional Swiss/Arena AI tournaments
- **BREAKING**: Replaced Community View hardcoded HTML with dynamic study groups and leaderboard
- Fixed game loss error categorization — now uses deterministic replay analysis
- Fixed Tactics Academy loading only first puzzle — now cycles via `puzzleIndices`
- Fixed Opening Detection — expanded from 12 FEN-only to 50+ move-sequence openings
- Added UserProfile schema versioning with V1→V2→V3 migration
- Fixed Boss Battle move validation — uses Chess.js SAN comparison
- Fixed Weakness Detection — dynamic scoring from `skillScores` and `gameErrors`
- Fixed Opening Lab mastery — uses real spaced-repetition data
- Removed all inline `onclick` handlers from HTML

### 🟠 Feature Completion (Sprint 2)
- Implemented working chess clock with `formatTime`, `startChessClock`, `stopChessClock`, and flag fall
- Consolidated duplicate radar chart functions into shared `renderRadarToSvg()`
- Fixed `analyzeWeaknesses()` callsites to pass correct arguments
- Added engine loading state toast and coach advice indicator
- Added `calculateHeuristicEval()` for mock engine evaluation
- Improved ELO estimation with sigmoid curve
- Replaced all 18 `cloneNode` anti-patterns with `wireButton()` utility
- Implemented full endgame solution sequence validation (multi-step tracking)
- Extracted 24 inline styles to CSS utility classes
- Expanded E2E test suite from 7 to 24 tests

### 🟡 Accessibility & Security (Sprint 3)
- Added ARIA roles (`navigation`, `main`, `grid`, `gridcell`, `alert`, `menubar`)
- Added ARIA labels on all 64 board squares with piece type and color
- Implemented keyboard navigation for chessboard (arrow keys + Enter/Space)
- Added `sanitizeHTML()` XSS prevention on coach chat and PGN inputs
- Added global error boundary (`window.onerror` + `unhandledrejection`)
- Added `:focus-visible` outlines on all interactive elements
- Added `prefers-reduced-motion` media query
- Added focus management on view change
- Created `_headers` file with CSP, XSS, CORS security headers

### 🟢 Documentation (Sprint 4)
- Created REQUIREMENTS.md
- Created GAP_ANALYSIS.md
- Created ARCHITECTURE.md
- Created DECISIONS.md (7 ADRs)
- Created SECURITY.md
- Created PERFORMANCE.md
- Created TODO.md
- Created this CHANGELOG.md
- Updated version to 3.0.0

### Technical Metrics
- script.js: ~3,800 lines
- chessmaster-ai-utils.js: ~1,200 lines
- style.css: ~650 lines
- index.html: ~866 lines
- E2E Tests: 24 tests
- Inline styles reduced: 353 → 298

## [2.0.3] - Previous
- Initial release with 19 navigation views
- Basic Stockfish integration
- Tactical puzzles, opening repertoire, strategy lessons
- Skill assessment, boss battles, skill tree
- AI coach, analytics, visualization lab
