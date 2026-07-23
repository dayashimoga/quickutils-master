# ChessOS V3 — Performance Notes

## Architecture Performance Characteristics

### Bundle Size (No Build Step)
| File | Size | Gzipped (est.) |
|------|------|----------------|
| index.html | ~74 KB | ~12 KB |
| script.js | ~168 KB | ~28 KB |
| chessmaster-ai-utils.js | ~52 KB | ~9 KB |
| style.css | ~41 KB | ~7 KB |
| **Total** | **~335 KB** | **~56 KB** |

### External Dependencies (CDN-cached)
| Dependency | Size | Cached |
|-----------|------|--------|
| Chess.js | ~90 KB | CDN edge |
| Stockfish.js | ~2.5 MB | CDN edge (loaded async) |
| Piece SVGs (12) | ~60 KB total | Preloaded |

### Load Performance
- **First Paint**: < 200ms (HTML + CSS only)
- **Interactive**: < 500ms (script.js parse + init)
- **Engine Ready**: 2-5s async (Stockfish CDN download + Worker init)
- **Fallback**: < 100ms (mock engine instant)

## Optimization Techniques

### 1. Piece Preloading
All 12 piece SVGs are preloaded at module init via `new Image()` to prevent FOUC during board rendering.

### 2. Chess Clock Precision
- Uses `Date.now()` delta tracking (not fixed intervals) for accurate timing
- 100ms `setInterval` balances UI smoothness vs CPU usage
- Auto-stops when game ends or view changes

### 3. Board Rendering
- Direct DOM manipulation (no virtual DOM overhead)
- Piece animation via CSS `transform` + `transition` (GPU-accelerated)
- Legal move dots rendered only for selected piece (not all pieces)

### 4. Engine Communication
- Single Web Worker — no thread pool overhead
- `bestmove` and `info score cp` parsed inline
- `ucinewgame` sent on reset to clear engine hash tables

### 5. Event Handling
- `wireButton()` prevents listener accumulation (O(1) per re-wire)
- Single delegated listener on board for keyboard navigation
- No `MutationObserver` or `ResizeObserver` usage

## Known Performance Considerations
- **script.js size**: 3800 lines in a single file. Consider module splitting for v4.
- **Stockfish.js**: 2.5 MB download on first load. Service worker caching would help.
- **localStorage sync writes**: `profile.save()` is synchronous. Consider debouncing for rapid-fire saves.
- **Radar chart re-render**: Full SVG rebuild on each view switch. Could cache if unchanged.
