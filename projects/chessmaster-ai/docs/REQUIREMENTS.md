# ChessOS V3 — Requirements Specification

## Product Vision
Zero-cost adaptive chess learning platform that personalizes training based on player performance, weakness detection, and spaced repetition — from beginner (800 ELO) to master (2200+ ELO).

## Core Features

### F1: Adaptive Learning Engine
- **F1.1**: UserProfile V3 with schema migration (V1→V2→V3)
- **F1.2**: Dynamic weakness detection from game history, skill scores, and error tracking
- **F1.3**: Spaced repetition (SM-2) for opening repertoire and concept mastery
- **F1.4**: Knowledge Graph DAG with 35+ chess concepts and prerequisites
- **F1.5**: Daily mission generator targeting weakest areas
- **F1.6**: ELO estimation via sigmoid curve from assessment accuracy

### F2: Chess Engine Integration
- **F2.1**: Stockfish.js via CDN Web Worker with CORS blob workaround
- **F2.2**: Mock engine fallback when CDN is unavailable
- **F2.3**: Real centipawn evaluation for coach analysis
- **F2.4**: Heuristic evaluation fallback (material counting) for mock engine
- **F2.5**: Engine loading state indicator

### F3: Interactive Play
- **F3.1**: Full chess game against Stockfish AI at configurable depth
- **F3.2**: Working chess clock with 10-minute default, flag fall detection
- **F3.3**: Piece animations with cubic-bezier sliding
- **F3.4**: Legal move dots and capture highlights
- **F3.5**: Check highlight on king square
- **F3.6**: Board flip for black perspective
- **F3.7**: Keyboard navigation (arrow keys + Enter/Space)

### F4: Learning Modules
- **F4.1**: Tactics Academy — 20 puzzles across 10 motif categories, cycling via puzzleIndices
- **F4.2**: Opening Lab — 12 repertoire lines with step-by-step guided study
- **F4.3**: Strategy Academy — 9 interactive lessons with key square targeting
- **F4.4**: Endgame Academy — 12 positions across 4 tiers, full solution sequence validation
- **F4.5**: Famous Games — 10 annotated games with PGN replay and "Guess the Move"
- **F4.6**: Opening Detection — 50+ openings via move-sequence matching

### F5: Assessment & Gamification
- **F5.1**: Skill Assessment — 14 puzzles across 5 categories
- **F5.2**: Boss Battles — 7 timed puzzle challenges with certification
- **F5.3**: Skill Tree visualization with mastery tracking
- **F5.4**: Achievement system (16 achievements)
- **F5.5**: Quest system with daily tasks
- **F5.6**: XP/ELO/Streak tracking
- **F5.7**: Certificate modal (printable)

### F6: Tournament & Community
- **F6.1**: Swiss tournament — 4 rounds against ELO-matched AI opponents
- **F6.2**: Arena tournament — 5 rounds with time-based scoring
- **F6.3**: Tournament history persistence in UserProfile
- **F6.4**: Study groups with topic-based sessions
- **F6.5**: Local leaderboard from XP, puzzles, and concepts

### F7: Analytics & Review
- **F7.1**: PGN game review with deterministic accuracy analysis
- **F7.2**: Radar chart (shared renderer for both analytics views)
- **F7.3**: Knowledge graph heatmap
- **F7.4**: Weekly report generation
- **F7.5**: Actionable insights from game error tracking
- **F7.6**: Deep analytics dashboard with confidence-weighted heatmap

### F8: Visualization Lab
- **F8.1**: Blindfold board color trainer
- **F8.2**: Position memory trainer
- **F8.3**: Move sequence tracker
- **F8.4**: Calculation depth trainer

## Non-Functional Requirements

### NFR1: Accessibility (WCAG AA)
- ARIA roles on navigation, main content, grid, gridcell, alert
- ARIA labels on all board squares with piece info
- Keyboard navigation for chessboard
- Focus-visible outlines on all interactive elements
- `prefers-reduced-motion` media query
- Focus management on view change

### NFR2: Security
- HTML sanitization on user inputs (coach chat, PGN)
- Global error boundary (window.onerror + unhandledrejection)
- Content Security Policy via `_headers`
- No inline onclick handlers

### NFR3: Performance
- No build step — static file serving
- CDN-hosted dependencies (chess.js, Stockfish.js, piece SVGs)
- Piece image preloading
- 100ms chess clock interval for smooth countdown

### NFR4: Compatibility
- Cross-platform Playwright config (Windows + Unix)
- Dark/light theme toggle
- Mobile responsive layout (breakpoint: 768px)
