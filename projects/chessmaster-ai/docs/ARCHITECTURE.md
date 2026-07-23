# ChessOS V3 — Technical Architecture

## System Overview

ChessOS is a **static Single Page Application (SPA)** built with vanilla HTML/CSS/JavaScript. It requires zero backend infrastructure and runs entirely in the browser.

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Runtime                       │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  index.html   │  │  style.css   │  │ quickutils-  │  │
│  │  (866 lines)  │  │  (646 lines) │  │  core.css    │  │
│  └──────┬───────┘  └──────────────┘  └──────────────┘  │
│         │                                               │
│  ┌──────▼───────┐  ┌──────────────┐                    │
│  │  script.js    │◄─│ chessmaster- │                    │
│  │  (3800 lines) │  │ ai-utils.js  │                    │
│  │  ES Module    │  │ (1200 lines) │                    │
│  └──────┬───────┘  └──────────────┘                    │
│         │                                               │
│  ┌──────▼───────┐  ┌──────────────┐                    │
│  │  Chess.js     │  │ Stockfish.js │                    │
│  │  (CDN ESM)    │  │ (Web Worker) │                    │
│  └──────────────┘  └──────────────┘                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              localStorage                        │   │
│  │  Key: chessos_profile  │  Schema: V3             │   │
│  │  Migration: V1→V2→V3  │  Auto on load           │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
chessmaster-ai/
├── index.html              # SPA shell (866 lines) — all 20 view panels
├── script.js               # Main app logic (3800 lines) — UI, game, engine
├── chessmaster-ai-utils.js # Pure functions (1200 lines) — UserProfile, openings, analysis
├── style.css               # Design system (646 lines) — components, utilities, a11y
├── quickutils-core.js      # Shared framework utilities
├── quickutils-core.css     # Shared framework styles
├── _headers                # Security headers (CSP, XSS, CORS)
├── playwright.config.js    # E2E test config (cross-platform)
├── package.json            # Dependencies (Playwright only)
└── tests/
    └── chessmaster-ai.spec.js  # 24 E2E tests
```

## Module Responsibilities

### script.js (UI + Game Logic)
- View navigation and routing
- Chessboard rendering (`renderBoardTo`, `buildBoard`)
- Chess clock (`formatTime`, `startChessClock`, `stopChessClock`)
- Stockfish engine lifecycle (`initEngine`, `setupEngineListeners`, `makeAIMove`)
- Tournament system (`initTournamentView`, `startSwiss`, `startArena`)
- Community system (`initCommunityView`)
- All view initialization and event wiring

### chessmaster-ai-utils.js (Pure Domain Logic)
- `UserProfile` — state management with V3 schema migration
- `analyzeWeaknesses()` — dynamic weakness scoring from game history
- `analyzeGameErrors()` — deterministic game replay error detection
- `detectOpening()` — 50+ opening detection via move sequences
- `getCoachResponse()` — rule-based coach chat AI
- `calculateXP()` — XP reward calculation
- `calculateHeuristicEval()` — material-balance position evaluation
- `normalizeMove()` — SAN move normalization

## Data Flow

```
User Action → Event Handler → Chess.js (validation)
                                    │
                          ┌─────────▼──────────┐
                          │ Stockfish Worker    │
                          │ (bestmove + score)  │
                          └─────────┬──────────┘
                                    │
                          evaluateAndCoach()
                                    │
                          ┌─────────▼──────────┐
                          │ UserProfile.save()  │
                          │ → localStorage      │
                          └────────────────────┘
```

## External Dependencies

| Dependency | Source | Purpose |
|-----------|--------|---------|
| Chess.js | CDN ESM (unpkg) | Move validation, game state, FEN/PGN |
| Stockfish.js | CDN (jsdelivr) | AI opponent, position evaluation |
| Lichess Pieces | CDN (jsdelivr) | cburnett SVG piece set |
| Playwright | npm (devDependency) | E2E testing |

## Key Design Patterns

1. **Event delegation via `wireButton()`** — prevents listener duplication without cloneNode
2. **Schema migration via `UserProfile._migrate()`** — handles V1→V2→V3 upgrades
3. **Shared rendering via `renderRadarToSvg()`** — parameterized SVG radar chart
4. **Heuristic fallback** — `calculateHeuristicEval()` when Stockfish CDN fails
5. **Global error boundary** — `window.onerror` + `unhandledrejection` for crash resilience
