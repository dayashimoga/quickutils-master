import { Chess } from 'https://cdn.jsdelivr.net/npm/chess.js@1.0.0-beta.8/+esm';

// ═══════════════════════════════════════════════════
// PIECE IMAGE URLS (lichess cburnett set via jsDelivr)
// ═══════════════════════════════════════════════════
const PIECE_BASE = 'https://cdn.jsdelivr.net/gh/lichess-org/lila@master/public/piece/cburnett';
const PIECE_URLS = {
    wk: `${PIECE_BASE}/wK.svg`, wq: `${PIECE_BASE}/wQ.svg`, wr: `${PIECE_BASE}/wR.svg`,
    wb: `${PIECE_BASE}/wB.svg`, wn: `${PIECE_BASE}/wN.svg`, wp: `${PIECE_BASE}/wP.svg`,
    bk: `${PIECE_BASE}/bK.svg`, bq: `${PIECE_BASE}/bQ.svg`, br: `${PIECE_BASE}/bR.svg`,
    bb: `${PIECE_BASE}/bB.svg`, bn: `${PIECE_BASE}/bN.svg`, bp: `${PIECE_BASE}/bP.svg`,
};

// Preload piece images
Object.values(PIECE_URLS).forEach(url => { const img = new Image(); img.src = url; });

// ═══════════════════════════════════════════════════
// APPLICATION STATE
// ═══════════════════════════════════════════════════
let chess = new Chess();
let flipped = false;
let mode = 'play';      // 'play' | 'analyze'
let aiColor = 'b';
let aiLevel = 5;
let selectedSquare = null;
let validMovesForSelected = [];
let lastMoveSquares = [];

// Move history tracking
let moveHistory = [];    // [{san, from, to, fen}, ...]
let currentMoveIdx = -1; // -1 = starting position

// ═══════════════════════════════════════════════════
// DOM REFERENCES
// ═══════════════════════════════════════════════════
const boardEl           = document.getElementById('board');
const evalContainer     = document.getElementById('evalContainer');
const evalBar           = document.getElementById('evalBar');
const evalText          = document.getElementById('evalText');
const engineStatusEl    = document.getElementById('engineStatus');
const statusDot         = engineStatusEl.querySelector('.status-dot');
const movesListEl       = document.getElementById('movesList');
const promotionModal    = document.getElementById('promotionModal');
const gameResultEl      = document.getElementById('gameResult');

// ═══════════════════════════════════════════════════
// STOCKFISH ENGINE
// ═══════════════════════════════════════════════════
const STOCKFISH_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';
let engine = null;
let engineReady = false;

async function initEngine() {
    try {
        // Cross-origin workers need a blob URL wrapper
        const workerCode = `importScripts("${STOCKFISH_CDN}");`;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        engine = new Worker(blobUrl);
        engine.onmessage = onEngineMessage;
        engine.onerror = (e) => {
            console.error('Stockfish worker error:', e);
            setEngineStatus('error', 'Engine failed to load');
        };
        engine.postMessage('uci');
    } catch (e) {
        console.error('Stockfish load failed:', e);
        setEngineStatus('error', 'Engine unavailable');
    }
}

function onEngineMessage(event) {
    const line = event.data;

    if (line === 'uciok') {
        engineReady = true;
        engine.postMessage('isready');
    } else if (line === 'readyok') {
        setEngineStatus('ready', 'Engine Ready');
    } else if (typeof line === 'string' && line.startsWith('bestmove')) {
        const match = line.match(/^bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/);
        if (match && mode === 'play') {
            executeEngineMove(match[1]);
        }
        if (mode === 'analyze') {
            setEngineStatus('ready', 'Analysis complete');
        }
    } else if (typeof line === 'string' && line.includes('score')) {
        parseEvalFromInfo(line);
    }
}

function setEngineStatus(state, text) {
    statusDot.className = 'status-dot ' + state;
    // Update text node (second child)
    const textNodes = [...engineStatusEl.childNodes].filter(n => n.nodeType === Node.TEXT_NODE);
    if (textNodes.length) textNodes[0].textContent = ' ' + text;
    else engineStatusEl.appendChild(document.createTextNode(' ' + text));
}

function parseEvalFromInfo(line) {
    const depthMatch = line.match(/depth (\d+)/);
    if (!depthMatch) return;

    let score = 0;
    let evalStr = '0.0';
    const isBlackTurn = chess.turn() === 'b';

    const mateMatch = line.match(/score mate (-?\d+)/);
    const cpMatch   = line.match(/score cp (-?\d+)/);

    if (mateMatch) {
        let mates = parseInt(mateMatch[1]);
        if (isBlackTurn) mates = -mates;
        score = mates > 0 ? 9999 : -9999;
        evalStr = (mates > 0 ? '+' : '') + 'M' + Math.abs(mates);
    } else if (cpMatch) {
        let cp = parseInt(cpMatch[1]);
        if (isBlackTurn) cp = -cp;
        score = cp;
        evalStr = (cp > 0 ? '+' : '') + (cp / 100).toFixed(1);
    } else {
        return;
    }

    evalText.textContent = evalStr;
    // Map score to bar height: 50% = even, clamped 3%–97%
    let pct = 50 + (score / 100) * 8;
    pct = Math.max(3, Math.min(97, pct));
    evalBar.style.height = pct + '%';
}

function requestEngineAnalysis(depthOverride) {
    if (!engineReady || !engine) return;
    engine.postMessage('stop');
    engine.postMessage('position fen ' + chess.fen());

    if (mode === 'play' && chess.turn() === aiColor) {
        setEngineStatus('thinking', 'AI thinking...');
        engine.postMessage('go depth ' + aiLevel);
    } else if (mode === 'analyze') {
        evalContainer.classList.remove('hidden');
        setEngineStatus('thinking', 'Analyzing...');
        engine.postMessage('go depth ' + (depthOverride || 18));
    }
}

function executeEngineMove(uci) {
    const from = uci.substring(0, 2);
    const to = uci.substring(2, 4);
    const promo = uci.length > 4 ? uci[4] : undefined;

    try {
        const move = chess.move({ from, to, promotion: promo });
        if (move) commitMove(move);
    } catch (e) {
        console.error('Engine move failed:', e);
    }
    setEngineStatus('ready', 'Engine Ready');
}

// ═══════════════════════════════════════════════════
// BOARD RENDERING
// ═══════════════════════════════════════════════════
function buildBoard() {
    boardEl.innerHTML = '';
    const files = flipped ? 'hgfedcba'.split('') : 'abcdefgh'.split('');
    const ranks = flipped ? '12345678'.split('') : '87654321'.split('');

    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            const sq = files[f] + ranks[r];
            const isLight = (r + f) % 2 === 0;

            const el = document.createElement('div');
            el.className = 'square ' + (isLight ? 'light' : 'dark');
            el.dataset.sq = sq;
            el.id = 'sq-' + sq;

            // Coordinates on edges
            if (f === 0) {
                const lbl = document.createElement('span');
                lbl.className = 'coord-rank';
                lbl.textContent = ranks[r];
                el.appendChild(lbl);
            }
            if (r === 7) {
                const lbl = document.createElement('span');
                lbl.className = 'coord-file';
                lbl.textContent = files[f];
                el.appendChild(lbl);
            }

            // Move indicator dot (hidden by default)
            const dot = document.createElement('div');
            dot.className = 'move-dot hidden';
            el.appendChild(dot);

            el.addEventListener('click', onSquareClick);
            boardEl.appendChild(el);
        }
    }
    renderPosition();
}

function renderPosition() {
    // Clear all dynamic state from squares
    document.querySelectorAll('.piece').forEach(p => p.remove());
    document.querySelectorAll('.square').forEach(sq => {
        sq.classList.remove('highlight', 'in-check', 'selected', 'can-capture');
        const dot = sq.querySelector('.move-dot');
        if (dot) dot.classList.add('hidden');
    });

    // Highlight last move
    lastMoveSquares.forEach(s => {
        const el = document.getElementById('sq-' + s);
        if (el) el.classList.add('highlight');
    });

    // King in check
    if (chess.isCheck()) {
        const board = chess.board();
        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const p = board[r][f];
                if (p && p.type === 'k' && p.color === chess.turn()) {
                    const sq = 'abcdefgh'[f] + (8 - r);
                    const el = document.getElementById('sq-' + sq);
                    if (el) el.classList.add('in-check');
                }
            }
        }
    }

    // Draw pieces
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            const p = board[r][f];
            if (p) {
                const sq = 'abcdefgh'[f] + (8 - r);
                const sqEl = document.getElementById('sq-' + sq);
                if (sqEl) {
                    const pieceEl = document.createElement('div');
                    pieceEl.className = 'piece';
                    pieceEl.style.backgroundImage = `url(${PIECE_URLS[p.color + p.type]})`;
                    sqEl.appendChild(pieceEl);
                }
            }
        }
    }

    updateCapturedPieces();
    updateMovesList();
    checkGameEnd();
}

function updateCapturedPieces() {
    const history = chess.history({ verbose: true });
    let whiteScore = 0, blackScore = 0;
    const piecesValues = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9 };
    
    // Count pieces currently on board
    let whitePieces = { 'p': 0, 'n': 0, 'b': 0, 'r': 0, 'q': 0 };
    let blackPieces = { 'p': 0, 'n': 0, 'b': 0, 'r': 0, 'q': 0 };
    
    const board = chess.board();
    for (const row of board) {
        for (const p of row) {
            if (!p) continue;
            if (p.color === 'w' && piecesValues[p.type]) whitePieces[p.type]++;
            if (p.color === 'b' && piecesValues[p.type]) blackPieces[p.type]++;
        }
    }
    
    // Starting pieces - current pieces = captured by opponent
    const starting = { 'p': 8, 'n': 2, 'b': 2, 'r': 2, 'q': 1 };
    
    let capturedByWhiteHTML = '';
    let capturedByBlackHTML = '';
    
    // Calculate differences and generate HTML
    for (const type of ['q', 'r', 'b', 'n', 'p']) {
        const whiteMissing = Math.max(0, starting[type] - whitePieces[type]);
        const blackMissing = Math.max(0, starting[type] - blackPieces[type]);
        
        // White missing means black captured them
        for(let i=0; i<whiteMissing; i++) {
            capturedByBlackHTML += `<div class="captured-piece-img" style="background-image:url(${PIECE_URLS['w'+type]})"></div>`;
            blackScore += piecesValues[type];
        }
        
        // Black missing means white captured them
        for(let i=0; i<blackMissing; i++) {
            capturedByWhiteHTML += `<div class="captured-piece-img" style="background-image:url(${PIECE_URLS['b'+type]})"></div>`;
            whiteScore += piecesValues[type];
        }
    }
    
    const wScoreEl = document.getElementById('capturedWhite');
    const bScoreEl = document.getElementById('capturedBlack');
    
    if (wScoreEl) {
        wScoreEl.innerHTML = capturedByWhiteHTML + (whiteScore > blackScore ? `<span class="capture-score">+${whiteScore - blackScore}</span>` : '');
    }
    if (bScoreEl) {
        bScoreEl.innerHTML = capturedByBlackHTML + (blackScore > whiteScore ? `<span class="capture-score">+${blackScore - whiteScore}</span>` : '');
    }
}

// ═══════════════════════════════════════════════════
// CLICK-TO-MOVE INTERACTION
// ═══════════════════════════════════════════════════
function onSquareClick(e) {
    // Block interaction during promotion
    if (!promotionModal.classList.contains('hidden')) return;

    // In play mode, block clicks when it's AI's turn
    if (mode === 'play' && chess.turn() === aiColor && !chess.isGameOver()) return;

    // If browsing history in analyze mode, jump to latest before allowing moves
    if (mode === 'analyze' && currentMoveIdx < moveHistory.length - 1) {
        jumpToMove(moveHistory.length - 1);
    }

    const sq = e.currentTarget.dataset.sq;
    const piece = chess.get(sq);

    if (selectedSquare) {
        // Check if clicked square is a valid target
        const targetMove = validMovesForSelected.find(m => m.to === sq);
        if (targetMove) {
            if (targetMove.flags.includes('p')) {
                // Pawn promotion
                showPromotionPicker(targetMove.from, targetMove.to);
            } else {
                const move = chess.move({ from: targetMove.from, to: targetMove.to });
                if (move) commitMove(move);
            }
            clearSelection();
            return;
        }
        // Clicked own piece → reselect
        if (piece && piece.color === chess.turn()) {
            selectSquare(sq);
            return;
        }
        clearSelection();
    } else {
        // Select a piece of the active color
        if (piece && piece.color === chess.turn()) {
            selectSquare(sq);
        }
    }
}

function selectSquare(sq) {
    clearSelection();
    selectedSquare = sq;
    document.getElementById('sq-' + sq).classList.add('selected');

    validMovesForSelected = chess.moves({ square: sq, verbose: true });

    validMovesForSelected.forEach(m => {
        const el = document.getElementById('sq-' + m.to);
        if (el) {
            if (m.captured) el.classList.add('can-capture');
            el.querySelector('.move-dot').classList.remove('hidden');
        }
    });
}

function clearSelection() {
    if (selectedSquare) {
        const el = document.getElementById('sq-' + selectedSquare);
        if (el) el.classList.remove('selected');
    }
    selectedSquare = null;
    validMovesForSelected = [];
    document.querySelectorAll('.square').forEach(sq => {
        sq.classList.remove('can-capture');
        const dot = sq.querySelector('.move-dot');
        if (dot) dot.classList.add('hidden');
    });
}

// ═══════════════════════════════════════════════════
// PROMOTION PICKER
// ═══════════════════════════════════════════════════
function showPromotionPicker(from, to) {
    const color = chess.turn();
    const pieces = ['q', 'r', 'b', 'n'];
    const container = promotionModal.querySelector('.promo-pieces');
    container.innerHTML = '';

    pieces.forEach(p => {
        const el = document.createElement('div');
        el.className = 'piece-opt';
        el.style.backgroundImage = `url(${PIECE_URLS[color + p]})`;
        el.onclick = (ev) => {
            ev.stopPropagation();
            promotionModal.classList.add('hidden');
            try {
                const move = chess.move({ from, to, promotion: p });
                if (move) commitMove(move);
            } catch (e) { console.error(e); }
        };
        container.appendChild(el);
    });

    promotionModal.classList.remove('hidden');
}

// ═══════════════════════════════════════════════════
// MOVE COMMIT & HISTORY
// ═══════════════════════════════════════════════════
function commitMove(move) {
    lastMoveSquares = [move.from, move.to];

    // Truncate future history if we're branching
    if (currentMoveIdx < moveHistory.length - 1) {
        moveHistory = moveHistory.slice(0, currentMoveIdx + 1);
    }

    moveHistory.push({
        san: move.san,
        from: move.from,
        to: move.to,
        fen: chess.fen(),
        flags: move.flags
    });
    currentMoveIdx = moveHistory.length - 1;

    // Play sound based on move characteristics
    playSound(move);

    renderPosition();

    // Request engine analysis or AI move
    if (!chess.isGameOver()) {
        requestEngineAnalysis();
    }
}

function playSound(move) {
    if (mode === 'analyze') return; // Don't spam sounds during PGN load or scrolling
    
    try {
        if (chess.isGameOver()) {
            document.getElementById('snd-end').play().catch(()=>{});
        } else if (chess.isCheck()) {
            document.getElementById('snd-check').play().catch(()=>{});
        } else if (move.flags.includes('c') || move.flags.includes('e')) { // capture or en passant
            document.getElementById('snd-capture').play().catch(()=>{});
        } else if (move.flags.includes('k') || move.flags.includes('q')) { // castling
            document.getElementById('snd-castle').play().catch(()=>{});
        } else {
            document.getElementById('snd-move').play().catch(()=>{});
        }
    } catch(e) {}
}

function jumpToMove(idx) {
    if (idx < -1 || idx >= moveHistory.length) return;
    currentMoveIdx = idx;

    if (idx === -1) {
        chess = new Chess();
        lastMoveSquares = [];
    } else {
        chess.load(moveHistory[idx].fen);
        lastMoveSquares = [moveHistory[idx].from, moveHistory[idx].to];
    }

    clearSelection();
    renderPosition();

    if (engine) engine.postMessage('stop');
    if (mode === 'analyze' && !chess.isGameOver()) {
        requestEngineAnalysis();
    }
}

// ═══════════════════════════════════════════════════
// MOVES LIST UI
// ═══════════════════════════════════════════════════
function updateMovesList() {
    let html = '';
    for (let i = 0; i < moveHistory.length; i += 2) {
        const m1 = moveHistory[i];
        const m2 = moveHistory[i + 1];
        const moveNum = Math.floor(i / 2) + 1;

        html += `<div class="move-row">`;
        html += `<span class="move-num">${moveNum}.</span>`;
        html += `<button class="move-btn ${currentMoveIdx === i ? 'active' : ''}" data-idx="${i}">${m1.san}</button>`;
        if (m2) {
            html += `<button class="move-btn ${currentMoveIdx === i + 1 ? 'active' : ''}" data-idx="${i + 1}">${m2.san}</button>`;
        }
        html += `</div>`;
    }
    movesListEl.innerHTML = html;

    // Scroll active move into view
    const active = movesListEl.querySelector('.move-btn.active');
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

    // Bind click handlers
    movesListEl.querySelectorAll('.move-btn').forEach(btn => {
        btn.onclick = () => jumpToMove(parseInt(btn.dataset.idx));
    });
}

// ═══════════════════════════════════════════════════
// GAME STATE CHECKS
// ═══════════════════════════════════════════════════
function checkGameEnd() {
    if (!chess.isGameOver()) {
        gameResultEl.classList.add('hidden');
        return;
    }

    let result = '';
    if (chess.isCheckmate()) {
        const winner = chess.turn() === 'w' ? 'Black' : 'White';
        result = `Checkmate! ${winner} wins.`;
    } else if (chess.isDraw()) {
        if (chess.isStalemate()) result = 'Draw — Stalemate';
        else if (chess.isThreefoldRepetition()) result = 'Draw — Threefold Repetition';
        else if (chess.isInsufficientMaterial()) result = 'Draw — Insufficient Material';
        else result = 'Draw — 50 Move Rule';
    }

    if (result) {
        gameResultEl.textContent = result;
        gameResultEl.classList.remove('hidden');
    }
}

// ═══════════════════════════════════════════════════
// UI EVENT BINDINGS
// ═══════════════════════════════════════════════════

// New game
document.getElementById('newGameBtn').addEventListener('click', () => {
    chess = new Chess();
    moveHistory = [];
    currentMoveIdx = -1;
    lastMoveSquares = [];

    aiLevel = parseInt(document.getElementById('aiLevel').value);
    const colorSel = document.getElementById('playerColor').value;
    if (colorSel === 'random') {
        aiColor = Math.random() > 0.5 ? 'w' : 'b';
    } else {
        aiColor = colorSel === 'w' ? 'b' : 'w';
    }

    flipped = (aiColor === 'w'); // Flip if AI plays white
    evalContainer.classList.add('hidden');
    gameResultEl.classList.add('hidden');
    buildBoard();

    if (aiColor === 'w') {
        requestEngineAnalysis(); // AI moves first
    }
});

// Load PGN
document.getElementById('loadPgnBtn').addEventListener('click', () => {
    const pgnText = document.getElementById('pgnInput').value.trim();
    if (!pgnText) return;

    const testChess = new Chess();
    try {
        testChess.loadPgn(pgnText);
    } catch (e) {
        alert('Invalid PGN. Please check the format and try again.');
        return;
    }

    // Rebuild history from the loaded PGN
    const history = testChess.history({ verbose: true });
    chess = new Chess();
    moveHistory = [];
    for (const h of history) {
        chess.move(h.san);
        moveHistory.push({ san: h.san, from: h.from, to: h.to, fen: chess.fen() });
    }
    currentMoveIdx = moveHistory.length - 1;
    lastMoveSquares = moveHistory.length > 0
        ? [moveHistory[currentMoveIdx].from, moveHistory[currentMoveIdx].to]
        : [];

    flipped = false;
    mode = 'analyze';
    evalContainer.classList.remove('hidden');
    buildBoard();
    requestEngineAnalysis();
});

const FAMOUS_GAMES = {
    opera: "1.e4 e5 2.Nf3 d6 3.d4 Bg4 4.dxe5 Bxf3 5.Qxf3 dxe5 6.Bc4 Nf6 7.Qb3 Qe7 8.Nc3 c6 9.Bg5 b5 10.Nxb5 cxb5 11.Bxb5+ Nbd7 12.O-O-O Rd8 13.Rxd7 Rxd7 14.Rd1 Qe6 15.Bxd7+ Nxd7 16.Qb8+ Nxb8 17.Rd8#",
    century: "1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2#",
    immortal: "1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 c6 5. Qd2 b5 6. f3 Nbd7 7. Nge2 Nb6 8. a3 Nc4 9. Qc1 Nxe3 10. Qxe3 Bg7 11. h4 h5 12. O-O-O b4 13. axb4 Rb8 14. Na2 a5 15. b5 cxb5 16. Kb1 Qc7 17. Nf4 O-O 18. g4 hxg4 19. h5 e5 20. h6 exf4 21. Qxf4 Bh8 22. h7+ Nxh7 23. Qh6 f6 24. Qxg6+ Qg7 25. Bc4+ bxc4 26. Qxg7+ Kxg7 27. Rdh1 Ng5 28. fxg4 Bd7 29. Rh6 Nxe4 30. Rh7+ Kg6 31. Rxd7 c3 32. b3 Rbe8 33. R7h6+ Kg5 34. R1h5+ Kxg4 35. Rh4+ Kf5 36. Rh5+ Ke6 37. Rh7 c2+ 38. Kxc2 Rc8+ 39. Kb2 Bg7 40. Rxg7 Rc7 41. d5+ Kf5 42. Nc3 Rxc3 43. Rxe4 Kxe4 44. Kxc3",
    deepblue: "1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nd7 5. Ng5 Ngf6 6. Bd3 e6 7. N1f3 h6 8. Nxe6 Qe7 9. O-O fxe6 10. Bg6+ Kd8 11. Bf4 b5 12. a4 Bb7 13. Re1 Nd5 14. Bg3 Kc8 15. axb5 cxb5 16. Qd3 Bc6 17. Bf5 exf5 18. Rxe7 Bxe7 19. c4",
    carlsen: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 h6 8. Bh4 Qb6 9. a3 Be7 10. Bf2 Qc7 11. Qf3 Nbd7 12. O-O-O b5 13. g4 g5 14. h4 gxf4 15. Be2 b4 16. axb4 Ne5 17. Qxf4 Nexg4 18. Bxg4 e5 19. Qxf6 Bxf6 20. Nd5 Qd8 21. Nf5 Bg5+ 22. hxg5 Bxf5 23. Bxf5 Qxg5+ 24. Be3 Qg2 25. Rdg1 Qe2 26. Re1 Qc4 27. Kb1 Rb8 28. Bb6 Kf8 29. Bc7 Rb7 30. Bxd6+ Ke8 31. Bxe5"
};

const famousGamesSelect = document.getElementById('famousGames');
if (famousGamesSelect) {
    famousGamesSelect.addEventListener('change', (e) => {
        const key = e.target.value;
        if (!key || !FAMOUS_GAMES[key]) return;
        
        document.getElementById('pgnInput').value = FAMOUS_GAMES[key];
        document.getElementById('loadPgnBtn').click();
        
        // Jump to the beginning of the game to start playback from the start
        jumpToMove(-1);
        
        // Ensure playback triggers
        setTimeout(() => {
            const btnAutoPlay = document.getElementById('btnAutoPlay');
            if (btnAutoPlay && !btnAutoPlay.classList.contains('active')) {
                btnAutoPlay.click();
            }
        }, 500);
    });
}


// Reset board
document.getElementById('resetBoardBtn').addEventListener('click', () => {
    chess = new Chess();
    moveHistory = [];
    currentMoveIdx = -1;
    lastMoveSquares = [];
    flipped = false;
    evalContainer.classList.remove('hidden');
    gameResultEl.classList.add('hidden');
    buildBoard();

    if (engine) engine.postMessage('stop');
    evalText.textContent = '0.0';
    evalBar.style.height = '50%';
});

// Move navigation buttons
document.getElementById('btnStart').onclick = () => jumpToMove(-1);
document.getElementById('btnPrev').onclick  = () => jumpToMove(currentMoveIdx - 1);
document.getElementById('btnNext').onclick  = () => jumpToMove(currentMoveIdx + 1);
document.getElementById('btnEnd').onclick   = () => jumpToMove(moveHistory.length - 1);

let autoPlayTimer = null;
const btnAutoPlay = document.getElementById('btnAutoPlay');
if (btnAutoPlay) {
    btnAutoPlay.onclick = () => {
        if (autoPlayTimer) {
            clearInterval(autoPlayTimer);
            autoPlayTimer = null;
            btnAutoPlay.classList.remove('active');
        } else {
            btnAutoPlay.classList.add('active');
            autoPlayTimer = setInterval(() => {
                if (currentMoveIdx >= moveHistory.length - 1) {
                    clearInterval(autoPlayTimer);
                    autoPlayTimer = null;
                    btnAutoPlay.classList.remove('active');
                } else {
                    jumpToMove(currentMoveIdx + 1);
                }
            }, 1000);
        }
    };
}

// Keyboard shortcuts
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); jumpToMove(currentMoveIdx - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); jumpToMove(currentMoveIdx + 1); }
    if (e.key === 'Home')       { e.preventDefault(); jumpToMove(-1); }
    if (e.key === 'End')        { e.preventDefault(); jumpToMove(moveHistory.length - 1); }
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

        btn.classList.add('active');
        const tab = btn.dataset.tab;
        mode = tab;
        document.getElementById('tab-' + tab).classList.remove('hidden');

        if (mode === 'analyze') {
            evalContainer.classList.remove('hidden');
            if (!chess.isGameOver()) requestEngineAnalysis();
        } else {
            evalContainer.classList.add('hidden');
            if (engine) engine.postMessage('stop');
        }
    });
});

// Theme toggle
document.getElementById('themeBtn').addEventListener('click', () => {
    const root = document.documentElement;
    if (root.getAttribute('data-theme') === 'dark') {
        root.setAttribute('data-theme', 'light');
        document.getElementById('themeBtn').textContent = '☀️';
    } else {
        root.setAttribute('data-theme', 'dark');
        document.getElementById('themeBtn').textContent = '🌙';
    }
});

// ═══════════════════════════════════════════════════
// BOOTSTRAP
// ═══════════════════════════════════════════════════
initEngine();
buildBoard();
