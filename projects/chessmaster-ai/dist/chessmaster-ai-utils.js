/**
 * ChessMaster AI - Core Algorithmic Utilities
 * Contains FEN parsing, opening detection, ELO planning, accuracy calculations,
 * opening repertoires, tactics databases, and roadmap projections.
 */

// Basic openings database for detection
const OPENINGS = [
    { name: 'Ruy Lopez', fenPrefix: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq -' },
    { name: 'Sicilian Defense', fenPrefix: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -' },
    { name: 'French Defense', fenPrefix: 'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -' },
    { name: 'Caro-Kann Defense', fenPrefix: 'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -' },
    { name: 'Queen\'s Gambit', fenPrefix: 'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq -' },
    { name: 'King\'s Indian Defense', fenPrefix: 'rnbqkbnr/pppppp1p/6p1/8/2PP4/5N2/PP2PPPP/RNBQKB1R b KQkq -' },
    { name: 'Slav Defense', fenPrefix: 'rnbqkbnr/pp1ppppp/2p5/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq -' },
    { name: 'Italian Game', fenPrefix: 'rnbqkbnr/pppp1ppp/8/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq -' },
    { name: 'Scandinavian Defense', fenPrefix: 'rnbqkbnr/pppppppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -' }
];

/**
 * Parses a FEN string into its components.
 */
export function parseFEN(fen) {
    if (!fen || typeof fen !== 'string') return null;
    const parts = fen.trim().split(/\s+/);
    if (parts.length < 4) return null;
    return {
        board: parts[0],
        turn: parts[1],
        castling: parts[2],
        enPassant: parts[3],
        halfmove: parseInt(parts[4] || '0', 10),
        fullmove: parseInt(parts[5] || '1', 10)
    };
}

/**
 * Detects the opening name from a FEN string.
 */
export function detectOpening(fen) {
    if (!fen) return null;
    const parsed = parseFEN(fen);
    if (!parsed) return null;

    // Check for direct prefixes
    for (const opening of OPENINGS) {
        if (fen.startsWith(opening.fenPrefix)) {
            return opening.name;
        }
    }

    // Fallbacks based on first move structures
    if (fen.includes('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq')) {
        return "King's Pawn Opening";
    }
    if (fen.includes('rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq')) {
        return "Queen's Pawn Opening";
    }
    if (fen.includes('rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq')) {
        return "English Opening";
    }
    if (fen.includes('rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq')) {
        return "Réti Opening";
    }

    return null;
}

/**
 * Classifies a move based on the evaluation difference before and after.
 */
export function classifyEvalDiff(diff, isTurnWhite) {
    const absDiff = Math.abs(diff);

    if (diff > 2.0) {
        return { type: 'brilliant', label: 'Brilliant', color: '#10b981', icon: '!!', desc: 'A spectacular move that opens up a clear tactical path.' };
    }
    if (diff > 0.8) {
        return { type: 'great', label: 'Great Move', color: '#34d399', icon: '!', desc: 'An excellent strategic move that puts severe pressure on the opponent.' };
    }
    if (absDiff <= 0.15) {
        return { type: 'best', label: 'Best Move', color: '#3b82f6', icon: '⭐', desc: 'The optimal move in this position as verified by Stockfish.' };
    }
    if (absDiff <= 0.4) {
        return { type: 'excellent', label: 'Excellent', color: '#60a5fa', icon: '✓', desc: 'A solid developmental move that maintains your positional advantage.' };
    }
    if (absDiff <= 0.7) {
        return { type: 'good', label: 'Good', color: '#a7f3d0', icon: '👍', desc: 'A reasonable move that keeps the game dynamically balanced.' };
    }
    if (diff < -2.0) {
        return { type: 'blunder', label: 'Blunder', color: '#ef4444', icon: '??', desc: 'A serious error that immediately gives away material or position.' };
    }
    if (diff < -0.9) {
        return { type: 'mistake', label: 'Mistake', color: '#fb923c', icon: '?', desc: 'An oversight that worsens your position and allows active counters.' };
    }
    
    return { type: 'inaccuracy', label: 'Inaccuracy', color: '#fbbf24', icon: '?!', desc: 'Not the best move. It slightly weakens your position or structure.' };
}

/**
 * Computes game accuracy score (0-100) based on move classifications.
 */
export function calcAccuracy(moves) {
    if (!moves || moves.length === 0) return 100;
    
    let totalScore = 0;
    const weights = {
        'brilliant': 100,
        'great': 95,
        'best': 100,
        'excellent': 85,
        'good': 70,
        'inaccuracy': 45,
        'mistake': 20,
        'blunder': 0
    };

    moves.forEach(m => {
        const type = m.type || 'excellent';
        totalScore += (weights[type] !== undefined) ? weights[type] : 80;
    });

    return Math.round(totalScore / moves.length);
}

/**
 * Estimates ELO based on accuracy.
 */
export function estimateElo(accuracy) {
    if (accuracy >= 95) return '2200+ (Master)';
    if (accuracy >= 85) return '1800 - 2200 (Expert)';
    if (accuracy >= 70) return '1400 - 1800 (Intermediate)';
    if (accuracy >= 50) return '1000 - 1400 (Novice)';
    return 'Below 1000 (Beginner)';
}

/**
 * Generates an educational weekly curriculum plan based on current ELO, target ELO, and timeline.
 */
export function generateWeeklyPlan(currentElo, targetElo, timelineMonths = 6) {
    const start = parseInt(currentElo, 10) || 800;
    const target = parseInt(targetElo, 10) || 1500;
    const totalWeeks = timelineMonths * 4;
    const eloGainNeeded = target - start;
    const weeklyGain = Math.ceil(eloGainNeeded / totalWeeks);

    const levels = [
        { minElo: 0, maxElo: 900, name: "Level 0: Absolute Fundamentals", topics: ["Board Coordinates", "Piece Movement Mechanics", "Check & Checkmate Concepts", "Basic Captures & Trades"] },
        { minElo: 900, maxElo: 1199, name: "Level 1: Beginner Foundation", topics: ["Opening Development Rules", "Basic Pins and Forks", "King Safety & Castling", "2-Move Checkmates"] },
        { minElo: 1200, maxElo: 1399, name: "Level 2: Intermediate Tactics", topics: ["Skewers & Discovered Attacks", "Pawn Structure Basics", "Opening Repertoires (e4/d4)", "King & Pawn Endgames"] },
        { minElo: 1400, maxElo: 1599, name: "Level 3: Advanced Strategy", topics: ["Outpost Squares for Knights", "Rooks on Open Files", "Defending Weaknesses", "Rook & Pawn Endgames"] },
        { minElo: 1600, maxElo: 1799, name: "Level 4: Expert Calc", topics: ["Candidate Move Calculation", "Prophylaxis (Preventive moves)", "Minority Attacks", "Passed Pawn Promotion Mechanics"] },
        { minElo: 1800, maxElo: 1999, name: "Level 5: Master Repertoire", topics: ["Deep Opening Theory", "Positional Exchange Sacrifices", "Lucena & Philidor Positions", "Endgame Composition Study"] },
        { minElo: 2000, maxElo: 9999, name: "Level 6: Grandmaster Preparation", topics: ["Professional Opponent Prep", "Psychological Profile Building", "Super-Deep Calculation Trees", "Complex Pawn Storm Defenses"] }
    ];

    const plan = [];
    let runningElo = start;

    for (let w = 1; w <= Math.min(totalWeeks, 12); w++) {
        const level = levels.find(l => runningElo >= l.minElo && runningElo <= l.maxElo) || levels[0];
        const topicIndex = (w - 1) % level.topics.length;
        const mainTopic = level.topics[topicIndex];
        const subTopic = level.topics[(topicIndex + 1) % level.topics.length];

        plan.push({
            week: w,
            expectedElo: Math.round(runningElo),
            levelName: level.name,
            focusTopic: mainTopic,
            secondaryTopic: subTopic,
            puzzlesCount: 15 + Math.floor((runningElo - 800) / 100) * 5,
            gamesTarget: 5 + Math.floor(w % 3)
        });

        runningElo += weeklyGain;
    }

    return {
        startElo: start,
        targetElo: target,
        timelineMonths,
        totalWeeks,
        estimatedWeeklyGain: weeklyGain,
        plan
    };
}

/**
 * Returns highly detailed, Grandmaster-level coach commentary based on evaluation, move type, and board concepts.
 */
export function getCoachCommentary(san, move, classification, openingName) {
    if (!san || !move || !classification) return "Setup your game to see grandmaster suggestions.";

    const moveStr = `${move.from} → ${move.to}`;
    const type = classification.type;

    const isPawn = move.piece === 'p';
    const isKnight = move.piece === 'n';
    const isBishop = move.piece === 'b';
    const isRook = move.piece === 'r';
    const isQueen = move.piece === 'q';
    const isKing = move.piece === 'k';
    const isCapture = move.flags && move.flags.includes('c');
    const isCheck = (san && san.includes('+')) || (move.san && move.san.includes('+'));
    const isCheckmate = (san && san.includes('#')) || (move.san && move.san.includes('#'));

    if (isCheckmate) {
        return `🏆 **Checkmate!** You delivered checkmate with **${san}** using excellent coordination. The game is over! Brilliant execution.`;
    }

    if (type === 'brilliant') {
        if (isCapture) {
            return `🎯 **Brilliant!** The sacrifice **${san}** (${moveStr}) is a stunning choice. You gave up material to force open your opponent's king safety or create an unstoppable pin. Absolutely masterclass calculation.`;
        }
        return `🌟 **Brilliant Move!** **${san}** is incredibly deep. It looks quiet but completely disrupts your opponent's defense, seizing initiative or threatening a devastating double attack.`;
    }

    if (type === 'great') {
        if (isCheck) {
            return `⚔️ **Great Move!** **${san}** puts their King under heavy fire, disrupting coordination and forcing their pieces into passive defense.`;
        }
        if (isCapture) {
            return `📈 **Great Decision!** Capturing with **${san}** wins vital material or removes their most active piece, giving you structural control.`;
        }
        return `🚀 **Great Strategic Move!** Placing your piece with **${san}** controls key central squares and restricts opponent counterplay.`;
    }

    if (type === 'best') {
        let txt = `⭐ **Best Move.** The engine fully supports **${san}** (${moveStr}).`;
        if (openingName) {
            txt += ` You are following established book theory in the **${openingName}** which develops pieces actively.`;
        } else if (isKnight) {
            txt += ` Knights belong in the center or on strong outpost squares. This placement maximizes its jump range.`;
        } else if (isBishop) {
            txt += ` Placing the bishop on this diagonal exerts long-range pressure and dominates the board.`;
        } else if (isRook) {
            txt += ` Rooks belong on open files or controlling the 7th rank. This move positions it perfectly.`;
        } else if (isPawn) {
            txt += ` Controlling the center with pawn pushes is fundamental. This keeps your structures stable.`;
        } else {
            txt += ` This maintains optimal tension and pushes your opponent to find difficult responses.`;
        }
        return txt;
    }

    if (type === 'excellent') {
        return `✓ **Excellent move.** **${san}** develops your pieces naturally, increases king safety, and continues building pressure. A highly professional choice.`;
    }

    if (type === 'good') {
        return `👍 **Good choice.** **${san}** keeps your position dynamically solid. While not the sharpest continuation, it keeps the game balanced and avoids immediate threats.`;
    }

    if (type === 'blunder') {
        let err = `⚠️ **Blunder!** Moving the piece with **${san}** (${moveStr}) is a critical error.`;
        if (isCapture) {
            err += ` The trade was highly disadvantageous, losing high-value material for nothing.`;
        } else if (isKnight || isBishop || isRook || isQueen) {
            err += ` This leaves the piece undefended or hangs a key defender, allowing your opponent to gain a decisive advantage.`;
        } else if (isKing) {
            err += ` This exposes your king to immediate tactical attacks, undermining your safety.`;
        } else {
            err += ` This severely damages your position. Try to look for undefended pieces before moving.`;
        }
        return err;
    }

    if (type === 'mistake') {
        let mis = `🟠 **Mistake.** Playing **${san}** (${moveStr}) misses a major tactical opportunity or weakens your structure.`;
        if (isPawn) {
            mis += ` Creating this pawn structure leaves permanent weak squares that opponent knights can exploit.`;
        } else {
            mis += ` This allows your opponent to gain tempos by attacking this piece or developing with threat.`;
        }
        return mis;
    }

    let inac = `🟡 **Inaccuracy.** **${san}** is slightly passive.`;
    if (isKing) {
        inac += ` Moving the king here was unnecessary and slightly delays your active rook connections.`;
    } else if (isPawn) {
        inac += ` This pawn push is premature. It creates holes in your camp and doesn't fight for the center.`;
    } else {
        inac += ` It relaxes pressure and gives your opponent time to coordinate their pieces. Better was to focus on central development.`;
    }
    return inac;
}

// ═══════════════════════════════════════════════════
// NEW: ROADMAP ENGINE & CURRICULUM DATABASES
// ═══════════════════════════════════════════════════

/**
 * Calculates adaptive Grandmaster roadmap metrics.
 */
export function calcRoadmapProjection(currentElo, targetElo, hoursPerWeek) {
    const start = Math.max(400, parseInt(currentElo, 10) || 800);
    const end = Math.min(3000, parseInt(targetElo, 10) || 2500);
    const gap = Math.max(0, end - start);
    
    // Scale hours needed: roughly 1.8 hours of study per ELO point below 1600,
    // scaling up to 3.5 hours/ELO point between 1600-2200, and 5.0 hours/ELO above 2200.
    let totalHours = 0;
    let tempElo = start;
    
    while (tempElo < end) {
        if (tempElo < 1600) {
            totalHours += 1.8;
        } else if (tempElo < 2200) {
            totalHours += 3.5;
        } else {
            totalHours += 5.2;
        }
        tempElo += 1;
    }

    totalHours = Math.round(totalHours);
    const activeHoursPerWeek = Math.max(1, parseInt(hoursPerWeek, 10) || 10);
    const totalWeeks = Math.ceil(totalHours / activeHoursPerWeek);
    const totalYears = (totalWeeks / 52).toFixed(1);
    
    // Suggest adjustments
    let suggestedHours = 10;
    if (totalYears > 5) {
        suggestedHours = 15;
    }
    if (totalYears > 8) {
        suggestedHours = 25;
    }

    return {
        gap,
        totalHours,
        timelineYears: totalYears,
        totalWeeks,
        suggestedPace: suggestedHours,
        projectedCompletionWithSuggested: (totalHours / suggestedHours / 52).toFixed(1)
    };
}

/**
 * Repertoire Lab database containing White/Black lines.
 */
export const REPERTOIRE_DB = {
    white: [
        {
            trigger: '1.e4',
            opponentResponse: 'e5',
            repertoireName: 'Ruy Lopez',
            moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'],
            plans: 'Control the center, pressure the Nc6 knight defending e5, and prepare to castle early.',
            traps: 'Noah\'s Ark Trap: If white gets too greedy, black traps the light-squared bishop with a6, b5, and c4.',
            goals: 'Exert long-term pressure on the e5 pawn and establish dominance on the d4 square.'
        },
        {
            trigger: '1.e4',
            opponentResponse: 'c5',
            repertoireName: 'Open Sicilian',
            moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4'],
            plans: 'Create active central piece development, utilize open c-file threats, and start kingside pawn storms.',
            traps: 'Siberian Trap: Beware of queen captures hanging mate on h2 if development is rushed.',
            goals: 'Fight asymmetry and prevent black from establishing full center presence.'
        },
        {
            trigger: '1.e4',
            opponentResponse: 'c6',
            repertoireName: 'Caro-Kann Advance',
            moves: ['e4', 'c6', 'd4', 'd5', 'e5'],
            plans: 'Clamp down space in the center, restrict their light-squared bishop, and expand on the kingside.',
            traps: 'Smyslov Trap: Do not permit early knight checks exposing weak f7 squares.',
            goals: 'Build a space advantages early on to choke black\'s development.'
        }
    ],
    black: [
        {
            trigger: 'Against e4',
            opponentResponse: '1.e4',
            repertoireName: 'Caro-Kann Defense',
            moves: ['c6', 'd4', 'd5'],
            plans: 'Establish solid pawn wall in center, activate light-squared bishop to f5, and prepare counter-attacks on d4.',
            traps: 'Légal\'s Mate traps: Always secure f7 before pushing knight outposts.',
            goals: 'Dismantle white\'s active center from a rock-solid structural baseline.'
        },
        {
            trigger: 'Against d4',
            opponentResponse: '1.d4',
            repertoireName: 'Slav Defense',
            moves: ['d5', 'c4', 'c6'],
            plans: 'Support the d5 center pawn structurally with c6, develop bishop to f5/g4, and play solid development.',
            traps: 'Exchange traps: Retain the d5 focal point to avoid opening key files prematurely.',
            goals: 'Neutralize Queen\'s pawn aggression without locking in the light-squared bishop.'
        }
    ]
};

/**
 * Tactics and concepts levels catalog for ChessOS interactive learning.
 */
export const TACTICS_DB = [
    // --- FUNDAMENTALS ---
    {
        id: 'board_setup',
        name: 'Board Setup & Notation',
        desc: 'Learn algebraic notation and proper board orientation.',
        fen: 'rnbqkbnr/pppppppp/8/8/4K3/8/PPPPPPPP/RNBQ1BNR w KQkq - 0 1',
        expected: { from: 'e4', to: 'e1' },
        explanation: 'Excellent! The White King starts on the e1 square, right between the Queen (d1) and the King\'s Bishop (f1).'
    },
    {
        id: 'piece_movement',
        name: 'Piece Movement',
        desc: 'How each piece moves: King, Queen, Rook, Bishop, Knight, Pawn.',
        fen: 'rnbqkbnr/ppp1pppp/8/3p4/8/2N5/PPPPPPPP/R1BQKBNR w KQkq - 0 2',
        expected: { from: 'c3', to: 'd5' },
        explanation: 'Great move! The Knight jumps in an L-shape (two squares forward, one square sideways) to capture the undefended d5 pawn.'
    },
    {
        id: 'check_checkmate',
        name: 'Check & Checkmate',
        desc: 'Understand check, checkmate, and the goal.',
        fen: 'k7/8/1Q6/8/8/8/8/R3K3 w - - 0 1',
        expected: { from: 'b6', to: 'b7' },
        explanation: 'Checkmate! The Black King is under direct attack by the Queen and has no escape squares.'
    },
    {
        id: 'captures',
        name: 'Captures & Exchanges',
        desc: 'Piece values (P=1,N=3,B=3,R=5,Q=9) and fair trades.',
        fen: 'r1bqkbnr/ppp2ppp/2n5/1B1pp3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4',
        expected: { from: 'f3', to: 'e5' },
        explanation: 'Nice capture! The e5 pawn is undefended and free for the taking.'
    },
    {
        id: 'castling',
        name: 'Castling',
        desc: 'Kingside and queenside castling rules.',
        fen: 'rnbqk2r/pppp1ppp/5n2/4p3/4P3/5N2/PPPPBPPP/RNBQK2R w KQkq - 4 4',
        expected: { from: 'e1', to: 'g1' },
        explanation: 'Perfect! Kingside castling secures your King behind a pawn shield and develops your Rook.'
    },
    {
        id: 'en_passant',
        name: 'En Passant',
        desc: 'Special pawn capture rule.',
        fen: 'rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3',
        expected: { from: 'e5', to: 'f6' },
        explanation: 'En Passant! You captured the f5 pawn diagonally because it had just moved two squares forward.'
    },
    {
        id: 'stalemate',
        name: 'Stalemate & Draws',
        desc: 'Stalemate, threefold repetition, 50-move rule.',
        fen: 'k7/p7/1Q6/8/8/8/8/4K3 w - - 0 1',
        expected: { from: 'b6', to: 'b7' },
        explanation: 'Smart choice! Capturing the pawn on b7 delivers checkmate. Moving to c7 would have trapped the King without check, causing a draw by stalemate.'
    },

    // --- TACTICS ---
    {
        id: 'fork',
        name: 'Forks',
        desc: 'Attack two pieces at once with one piece.',
        fen: 'q3k3/8/8/3N4/8/8/8/4K3 w - - 0 1',
        expected: { from: 'd5', to: 'c7' },
        explanation: 'Knight Fork! The knight on c7 checks the King on e8 and attacks the Queen on a8 at the same time.'
    },
    {
        id: 'pin',
        name: 'Pins',
        desc: 'Restrict a piece from moving — it shields something valuable.',
        fen: 'r1bqk1nr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 4',
        expected: { from: 'f3', to: 'e5' },
        explanation: 'The c6 Knight is pinned to the King by your Bishop, so it cannot capture your Knight on e5.'
    },
    {
        id: 'skewer',
        name: 'Skewers',
        desc: 'Attack a valuable piece that must move, exposing one behind.',
        fen: 'k7/8/8/8/8/5B2/8/7q w - - 0 1',
        expected: { from: 'f3', to: 'c6' },
        explanation: 'Skewer! Bishop to c6 checks the King on a8, and when the King moves, you capture the Queen on h1.'
    },
    {
        id: 'double_attack',
        name: 'Double Attacks',
        desc: 'Threaten two things at once.',
        fen: 'rnbqkbnr/ppp2ppp/8/3pp3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3',
        expected: { from: 'd1', to: 'h5' },
        explanation: 'Double Attack! The Queen on h5 threatens both the weak f7 square and the e5 pawn.'
    },
    {
        id: 'back_rank',
        name: 'Back Rank Mate',
        desc: 'Checkmate on 1st/8th rank when pawns block escape.',
        fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
        expected: { from: 'e1', to: 'e8' },
        explanation: 'Back Rank Mate! The Rook checks the King on the 8th rank, where it is trapped by its own pawns.'
    },
    {
        id: 'removing_def',
        name: 'Removing the Defender',
        desc: 'Capture the piece guarding a key square.',
        fen: 'r1bqk2r/ppp2ppp/2n5/1B1pp3/4N3/5N2/PPPP1PPP/R1BQK2R w KQkq - 0 6',
        expected: { from: 'b5', to: 'c6' },
        explanation: 'Removing the Defender! By capturing the Knight on c6, you eliminate the defender of the e5 pawn.'
    },
    {
        id: 'smothered',
        name: 'Smothered Mate',
        desc: 'Checkmate with a knight — king trapped by own pieces.',
        fen: '6rk/6pp/8/4N3/8/8/6PP/6RK w - - 0 1',
        expected: { from: 'e5', to: 'f7' },
        explanation: 'Smothered Mate! The Knight checks on f7, and the King cannot escape because it is surrounded by its own pieces.'
    },
    {
        id: 'discovered',
        name: 'Discovered Attacks',
        desc: 'Move a piece to unmask a hidden attack.',
        fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQ1RK1 w kq - 4 6',
        expected: { from: 'f3', to: 'e5' },
        explanation: 'Discovered Attack! Moving the knight to e5 attacks the black pawn and opens the Rook\'s path.'
    },
    {
        id: 'deflection',
        name: 'Deflection',
        desc: 'Force a defender away from its duty.',
        fen: '3r2k1/5ppp/8/q7/8/2Q5/5PPP/3R2K1 w - - 0 1',
        expected: { from: 'd1', to: 'd8' },
        explanation: 'Deflection! Rxd8+ forces the Black Queen to capture, deflecting it away from protecting the critical a5 square.'
    },
    {
        id: 'zwischenzug',
        name: 'Zwischenzug',
        desc: 'An in-between move interrupting the expected sequence.',
        fen: 'r1bqk2r/ppp2ppp/2n5/1B1pp3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5',
        expected: { from: 'f3', to: 'e5' },
        explanation: 'Zwischenzug! Instead of moving your attacked bishop, you play Nxe5 first to create a stronger counter-threat.'
    },

    // --- STRATEGY ---
    {
        id: 'center_control',
        name: 'Center Control',
        desc: 'Control d4,d5,e4,e5 for maximum influence.',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        expected: { from: 'e2', to: 'e4' },
        explanation: 'Center Control! 1.e4 immediately controls key central squares and opens lines for your Bishop and Queen.'
    },
    {
        id: 'development',
        name: 'Development Principles',
        desc: 'Develop knights before bishops, castle early.',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
        expected: { from: 'g1', to: 'f3' },
        explanation: 'Development! Nf3 develops a minor piece actively and prepares castling.'
    },
    {
        id: 'king_safety',
        name: 'King Safety',
        desc: 'Keep king safe through castling and pawn shelter.',
        fen: 'rnbqk2r/pppp1ppp/5n2/4p3/4P3/5N2/PPPPBPPP/RNBQK2R w KQkq - 4 4',
        expected: { from: 'e1', to: 'g1' },
        explanation: 'King Safety! Castling puts the King in a safe corner and connects the Rooks.'
    },
    {
        id: 'piece_activity',
        name: 'Piece Activity',
        desc: 'Place pieces on their most active squares.',
        fen: 'rnbqkbnr/ppp2ppp/3p4/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3',
        expected: { from: 'f1', to: 'c4' },
        explanation: 'Piece Activity! Placing the Bishop on c4 puts it on its most active diagonal, targeting the f7 square.'
    },
    {
        id: 'opening_principles',
        name: 'Opening Principles',
        desc: 'Center, develop, castle, connect rooks.',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
        expected: { from: 'b8', to: 'c6' },
        explanation: 'Opening Principles! Nc6 develops a piece toward the center while defending the e5 pawn.'
    },
    {
        id: 'pawn_structure',
        name: 'Pawn Structures',
        desc: 'Doubled, isolated, backward, passed pawns.',
        fen: 'rnbqkbnr/ppp2ppp/8/3pp3/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3',
        expected: { from: 'e4', to: 'd5' },
        explanation: 'Pawn Structure! Capturing the pawn maintains center control and structural balance.'
    },
    {
        id: 'weak_squares',
        name: 'Weak Squares',
        desc: 'Squares no longer defended by pawns.',
        fen: 'rnbqkbnr/pp1p1ppp/8/2p1p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 2 3',
        expected: { from: 'c3', to: 'd5' },
        explanation: 'Weak Square! Black\'s pawn push left the d5 square undefended. Your Knight occupies it as a strong outpost.'
    },
    {
        id: 'outposts',
        name: 'Outpost Squares',
        desc: 'Strong knight squares supported by pawns.',
        fen: 'r1bqkbnr/pp1p1ppp/2n5/2p1p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 2 4',
        expected: { from: 'c3', to: 'd5' },
        explanation: 'Outpost! The d5 square is supported by a pawn and cannot be attacked by opponent pawns.'
    },
    {
        id: 'open_files',
        name: 'Open Files',
        desc: 'Place rooks on open files to penetrate.',
        fen: '4r1k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1',
        expected: { from: 'd1', to: 'd7' },
        explanation: 'Open Files! Placing the Rook on the open d-file and invading the 7th rank maximizes rook activity.'
    },
    {
        id: 'prophylaxis',
        name: 'Prophylaxis',
        desc: 'Prevent opponent plans before executing yours.',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/3P1N2/PPP1BPPP/RNBQK2R w KQkq - 1 4',
        expected: { from: 'h2', to: 'h3' },
        explanation: 'Prophylaxis! Playing h3 prevents Black from playing Bg4 and pinning your knight.'
    },

    // --- ENDGAMES ---
    {
        id: 'opposition',
        name: 'Opposition',
        desc: 'Kings face off with one square between.',
        fen: '8/8/8/8/4K3/4P3/8/8 w - - 0 1',
        expected: { from: 'e4', to: 'd4' },
        explanation: 'Opposition! Kd4 takes the opposition, preventing the black king from defending the key squares.'
    },
    {
        id: 'square_rule',
        name: 'Square Rule',
        desc: 'Can the king catch a passed pawn?',
        fen: '8/8/8/8/8/p7/k7/4K3 w - - 0 1',
        expected: { from: 'e1', to: 'd2' },
        explanation: 'Square Rule! Moving to d2 puts your King inside the \'square\' of the passed pawn, allowing you to catch it.'
    },
    {
        id: 'lucena',
        name: 'Lucena Position',
        desc: 'Build a bridge to promote — the key rook endgame.',
        fen: '1K6/P7/8/8/8/8/1r6/k7 w - - 0 1',
        expected: { from: 'b8', to: 'a7' },
        explanation: 'Lucena Position! Moving the King to a7 prepares promotion while shielding the pawn with your Rook.'
    },
    {
        id: 'philidor',
        name: 'Philidor Position',
        desc: 'The key defensive rook endgame technique.',
        fen: '8/8/3R4/8/2k5/2p5/1r6/3K4 b - - 0 1',
        expected: { from: 'b2', to: 'h2' },
        explanation: 'Philidor Defense! Keep the Rook on the 3rd rank (or 6th rank for Black) to check the King from behind once the pawn advances.'
    },
    {
        id: 'rook_endgame',
        name: 'Rook Endgames',
        desc: 'Rook activity, cutting off king, passed pawns.',
        fen: '8/8/3R4/8/2k5/2p5/7r/3K4 w - - 0 1',
        expected: { from: 'd1', to: 'c1' },
        explanation: 'Rook Endgame! Kc1 keeps the King active and supports defensive operations.'
    },

    // --- CALCULATION ---
    {
        id: 'candidate_moves',
        name: 'Candidate Moves',
        desc: 'Identify 2-3 strongest moves before calculating.',
        fen: 'r1bqk2r/ppp2ppp/2n5/1B1pp3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5',
        expected: { from: 'b5', to: 'c6' },
        explanation: 'Candidate Moves! Bxc6+ is the strongest forcing candidate move, disrupting Black\'s pawn structure.'
    },
    {
        id: 'deep_calc',
        name: 'Deep Calculation',
        desc: 'Calculate 6-10 moves deep with branches.',
        fen: 'r1bqk2r/ppp2ppp/2n5/1B1pp3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5',
        expected: { from: 'f3', to: 'e5' },
        explanation: 'Deep Calculation! Calculating the forcing lines shows that Nxe5 wins material since the pinned knight cannot recapture.'
    }
];

/**
 * Endgame Academy database (kept for backward compatibility).
 */
export const ENDGAME_DB = [
    {
        id: 'opposition',
        name: 'Opposition Concept',
        tier: 'Beginner',
        desc: 'Position kings directly opposite with one square between to block their advancement.',
        fen: '8/8/8/8/4K3/4P3/8/8 w - - 0 1',
        moves: ['Kd4', 'Ke4']
    },
    {
        id: 'lucena',
        name: 'Lucena Position',
        tier: 'Intermediate',
        desc: 'Build a bridge with a rook to shield your king from checks and promote your passed pawn.',
        fen: '1K6/P7/8/8/8/8/1r6/k7 w - - 0 1',
        moves: ['Rb7', 'Ra7']
    }
];

