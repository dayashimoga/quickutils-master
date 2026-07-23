# ChessOS V3 — Architecture Decision Records

## ADR-001: Static SPA with No Backend
**Status**: Accepted  
**Context**: Chess learning platforms typically require server infrastructure for multiplayer, user accounts, and engine analysis.  
**Decision**: Keep ChessOS as a fully client-side static SPA. Tournaments run against AI. Community features are local. Authentication is via localStorage.  
**Rationale**: Zero hosting cost, instant deployment to any static host, offline-capable with mock engine, no server maintenance burden.  
**Consequences**: No real multiplayer, no server-side puzzle database, limited social features.

## ADR-002: Stockfish via CDN Web Worker with Mock Fallback
**Status**: Accepted  
**Context**: Stockfish.js needs to run as a Web Worker. CDN loading can fail due to CORS, network issues, or ad blockers.  
**Decision**: Load Stockfish via `fetch()` → Blob → Web Worker (CORS workaround). If CDN fails, fall back to a mock engine using `makeHeuristicMove()`.  
**Rationale**: Blob workaround bypasses CORS restrictions. Mock engine ensures the app never breaks — the player always gets an opponent.  
**Consequences**: Mock engine plays weaker chess (material counting only). Coach analysis falls back to `calculateHeuristicEval()`.

## ADR-003: wireButton() Over cloneNode() for Event Binding
**Status**: Accepted  
**Context**: Views can be re-initialized multiple times (e.g., clicking between Opening Lab entries). The original pattern used `cloneNode(true)` + `replaceChild` to prevent duplicate listeners.  
**Decision**: Replace with `wireButton()` utility that stores the previous handler reference and calls `removeEventListener` before `addEventListener`.  
**Rationale**: cloneNode loses DOM state, creates orphaned elements, and is fragile. wireButton is O(1) and preserves DOM identity.  
**Consequences**: Simpler code, no memory leaks from orphaned clones.

## ADR-004: UserProfile Schema Versioning
**Status**: Accepted  
**Context**: Adding new features (tournaments, study groups, puzzle cycling) requires new fields in the persisted profile.  
**Decision**: Add `schemaVersion` field. `UserProfile._migrate()` runs on every load, applying incremental migrations (V1→V2→V3).  
**Rationale**: Users should never lose progress when the app updates. Migrations are deterministic and composable.  
**Consequences**: Migration code grows with each version. Must test upgrade paths.

## ADR-005: Deterministic Game Analysis Over Random
**Status**: Accepted  
**Context**: V2 used `Math.random()` for game evaluation, error categorization, and opening mastery percentages.  
**Decision**: Replace all random logic with deterministic analysis: `analyzeGameErrors()` replays moves, `detectOpening()` matches sequences, mastery uses SR data.  
**Rationale**: Random values destroy trust and produce nonsensical coaching. Deterministic analysis enables meaningful feedback.  
**Consequences**: Analysis quality is limited by heuristic depth (no deep Stockfish analysis per-move in PGN review).

## ADR-006: Shared Radar Chart Renderer
**Status**: Accepted  
**Context**: Two nearly identical radar chart functions existed (~50 lines each).  
**Decision**: Extract `renderRadarToSvg(svg, labels, values, cx, cy, r)` as a parameterized shared function.  
**Rationale**: DRY principle. Both analytics views now render consistently.

## ADR-007: HTML Sanitization for XSS Prevention
**Status**: Accepted  
**Context**: Coach chat accepts free-form user input that is rendered via innerHTML.  
**Decision**: Add `sanitizeHTML()` utility that uses `textContent` → `innerHTML` escaping. Applied to all user-input rendering paths.  
**Rationale**: Prevents script injection even though the app is client-only (stored XSS via localStorage is still a risk).
