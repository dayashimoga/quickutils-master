import { describe, it, expect } from 'vitest';

/* ═══════════════════════════════════════════════════
   Web-Chess Unit Tests — Extracted Algorithm Tests
   Tests pure chess logic functions without DOM/Stockfish
   ═══════════════════════════════════════════════════ */

// ── FEN Parser (extracted logic) ──
function parseFEN(fen) {
    if (!fen || typeof fen !== 'string') return null;
    const parts = fen.split(' ');
    if (parts.length < 4) return null;
    const rows = parts[0].split('/');
    if (rows.length !== 8) return null;
    return { position: parts[0], turn: parts[1] || 'w', castling: parts[2] || '-', enPassant: parts[3] || '-',
        halfmove: parseInt(parts[4]) || 0, fullmove: parseInt(parts[5]) || 1 };
}

// ── Opening Detection ──
const OPENINGS_DB = {
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR': 'King\'s Pawn Opening',
    'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR': 'Queen\'s Pawn Opening',
    'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR': 'English Opening',
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR': 'Open Game',
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R': 'King\'s Knight Opening',
    'rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR': 'Alekhine\'s Defense',
    'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR': 'Sicilian Defense',
    'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR': 'French Defense',
    'rnbqkbnr/ppp1pppp/3p4/8/4P3/8/PPPP1PPP/RNBQKBNR': 'Pirc Defense',
};

function detectOpening(fen) {
    if (!fen) return null;
    const position = fen.split(' ')[0];
    return OPENINGS_DB[position] || null;
}

// ── Move Classification ──
function classifyEvalDiff(diff) {
    const abs = Math.abs(diff);
    if (abs >= 3.0) return { type: 'blunder', icon: '??', color: '#ef4444' };
    if (abs >= 1.5) return { type: 'mistake', icon: '?', color: '#f97316' };
    if (abs >= 0.5) return { type: 'inaccuracy', icon: '?!', color: '#eab308' };
    if (abs <= 0.1) return { type: 'best', icon: '!', color: '#22c55e' };
    return { type: 'good', icon: '', color: '#94a3b8' };
}

// ── Accuracy Calculation ──
function calcAccuracy(moves) {
    if (!moves || moves.length === 0) return 100;
    const weights = { best: 1.0, good: 0.8, inaccuracy: 0.5, mistake: 0.2, blunder: 0.0 };
    const total = moves.reduce((s, m) => s + (weights[m.type] ?? 0.5), 0);
    return Math.round((total / moves.length) * 100);
}

// ── ELO Rating Estimation ──
function estimateElo(accuracy) {
    if (accuracy >= 95) return '2200+';
    if (accuracy >= 85) return '1800-2200';
    if (accuracy >= 70) return '1400-1800';
    if (accuracy >= 50) return '1000-1400';
    return 'Below 1000';
}

// ── Board Coordinate Helpers ──
function algebraicToIndex(sq) {
    if (!sq || sq.length !== 2) return null;
    const file = sq.charCodeAt(0) - 97; // a=0, h=7
    const rank = parseInt(sq[1]) - 1;   // 1=0, 8=7
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
    return { file, rank };
}

function indexToAlgebraic(file, rank) {
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
    return String.fromCharCode(97 + file) + (rank + 1);
}

function squareColor(file, rank) {
    return (file + rank) % 2 === 0 ? 'dark' : 'light';
}

// ── Clock Time Formatting ──
function formatClockTime(totalSeconds) {
    if (totalSeconds <= 0) return '0:00';
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Puzzle Validation ──
function validatePuzzleMove(userMove, expectedMove) {
    if (!userMove || !expectedMove) return false;
    return userMove.from === expectedMove.from && userMove.to === expectedMove.to &&
           (!expectedMove.promotion || userMove.promotion === expectedMove.promotion);
}

// ── Academy XP Calculation ──
function calcXP(hintsUsed, timeSeconds, difficulty) {
    const base = { easy: 10, medium: 20, hard: 40, expert: 80 }[difficulty] || 20;
    const hintPenalty = hintsUsed * 5;
    const timeBonus = Math.max(0, 30 - timeSeconds) * 0.5;
    return Math.max(1, Math.round(base - hintPenalty + timeBonus));
}

// ═══════════════ TESTS ═══════════════

describe('FEN Parser', () => {
    it('parses starting position', () => {
        const r = parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        expect(r.turn).toBe('w'); expect(r.castling).toBe('KQkq'); expect(r.fullmove).toBe(1);
    });
    it('returns null for invalid FEN', () => { expect(parseFEN(null)).toBeNull(); expect(parseFEN('')).toBeNull(); expect(parseFEN('invalid')).toBeNull(); });
    it('parses mid-game FEN', () => {
        const r = parseFEN('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2');
        expect(r.turn).toBe('w'); expect(r.enPassant).toBe('e6'); expect(r.fullmove).toBe(2);
    });
    it('parses black to move', () => { const r=parseFEN('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'); expect(r.turn).toBe('b'); });
});

describe('Opening Detection', () => {
    it('detects King\'s Pawn', () => expect(detectOpening('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1')).toBe('King\'s Pawn Opening'));
    it('detects Queen\'s Pawn', () => expect(detectOpening('rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1')).toBe('Queen\'s Pawn Opening'));
    it('detects Sicilian', () => expect(detectOpening('rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2')).toBe('Sicilian Defense'));
    it('detects French', () => expect(detectOpening('rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2')).toBe('French Defense'));
    it('returns null for unknown', () => expect(detectOpening('8/8/8/8/8/8/8/8 w - - 0 1')).toBeNull());
    it('returns null for null', () => expect(detectOpening(null)).toBeNull());
});

describe('Move Classification', () => {
    it('blunder for >=3.0 diff', () => expect(classifyEvalDiff(3.5).type).toBe('blunder'));
    it('mistake for >=1.5', () => expect(classifyEvalDiff(2.0).type).toBe('mistake'));
    it('inaccuracy for >=0.5', () => expect(classifyEvalDiff(0.8).type).toBe('inaccuracy'));
    it('best for <=0.1', () => expect(classifyEvalDiff(0.05).type).toBe('best'));
    it('good for moderate', () => expect(classifyEvalDiff(0.3).type).toBe('good'));
    it('handles negative diffs', () => expect(classifyEvalDiff(-3.5).type).toBe('blunder'));
    it('includes color', () => expect(classifyEvalDiff(3.5).color).toMatch(/^#/));
    it('includes icon', () => expect(classifyEvalDiff(3.5).icon).toBe('??'));
});

describe('Accuracy Calculation', () => {
    it('100% for all best', () => expect(calcAccuracy([{type:'best'},{type:'best'}])).toBe(100));
    it('0% for all blunders', () => expect(calcAccuracy([{type:'blunder'},{type:'blunder'}])).toBe(0));
    it('100% for empty moves', () => expect(calcAccuracy([])).toBe(100));
    it('100% for null', () => expect(calcAccuracy(null)).toBe(100));
    it('mixed accuracy', () => { const a=calcAccuracy([{type:'best'},{type:'blunder'}]); expect(a).toBe(50); });
});

describe('ELO Estimation', () => {
    it('2200+ for 95+', () => expect(estimateElo(98)).toBe('2200+'));
    it('1800-2200 for 85-94', () => expect(estimateElo(90)).toBe('1800-2200'));
    it('1400-1800 for 70-84', () => expect(estimateElo(75)).toBe('1400-1800'));
    it('1000-1400 for 50-69', () => expect(estimateElo(60)).toBe('1000-1400'));
    it('Below 1000 for <50', () => expect(estimateElo(30)).toBe('Below 1000'));
});

describe('Board Coordinates', () => {
    it('a1 = file:0 rank:0', () => { const r=algebraicToIndex('a1'); expect(r.file).toBe(0); expect(r.rank).toBe(0); });
    it('h8 = file:7 rank:7', () => { const r=algebraicToIndex('h8'); expect(r.file).toBe(7); expect(r.rank).toBe(7); });
    it('e4 = file:4 rank:3', () => { const r=algebraicToIndex('e4'); expect(r.file).toBe(4); expect(r.rank).toBe(3); });
    it('null for invalid', () => { expect(algebraicToIndex('z9')).toBeNull(); expect(algebraicToIndex(null)).toBeNull(); });
    it('round-trip', () => expect(indexToAlgebraic(4,3)).toBe('e4'));
    it('indexToAlgebraic null for invalid', () => expect(indexToAlgebraic(-1,0)).toBeNull());
    it('dark square a1', () => expect(squareColor(0,0)).toBe('dark'));
    it('light square b1', () => expect(squareColor(1,0)).toBe('light'));
});

describe('Clock Formatting', () => {
    it('formats 600s as 10:00', () => expect(formatClockTime(600)).toBe('10:00'));
    it('formats 0 as 0:00', () => expect(formatClockTime(0)).toBe('0:00'));
    it('formats 90s as 1:30', () => expect(formatClockTime(90)).toBe('1:30'));
    it('handles negative', () => expect(formatClockTime(-5)).toBe('0:00'));
});

describe('Puzzle Validation', () => {
    it('correct move passes', () => expect(validatePuzzleMove({from:'e2',to:'e4'},{from:'e2',to:'e4'})).toBe(true));
    it('wrong move fails', () => expect(validatePuzzleMove({from:'e2',to:'e4'},{from:'d2',to:'d4'})).toBe(false));
    it('promotion must match', () => expect(validatePuzzleMove({from:'a7',to:'a8',promotion:'q'},{from:'a7',to:'a8',promotion:'q'})).toBe(true));
    it('null fails', () => expect(validatePuzzleMove(null,{from:'e2',to:'e4'})).toBe(false));
});

describe('Academy XP', () => {
    it('base XP for medium no hints', () => { const xp=calcXP(0,30,'medium'); expect(xp).toBe(20); });
    it('hint penalty reduces XP', () => { const xp=calcXP(3,30,'medium'); expect(xp).toBeLessThan(20); });
    it('fast solve gets time bonus', () => { const xp=calcXP(0,5,'medium'); expect(xp).toBeGreaterThan(20); });
    it('never below 1', () => expect(calcXP(10,100,'easy')).toBeGreaterThanOrEqual(1));
    it('expert gives more base XP', () => expect(calcXP(0,30,'expert')).toBeGreaterThan(calcXP(0,30,'easy')));
});
