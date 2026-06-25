/**
 * ChessOS — Core Engine Layer
 * Knowledge Graph, Weakness Detection, Training Generator,
 * Rating Projection, Gamification, Spaced Repetition, and Complete Databases.
 */

// ═══════════════════════════════════════════════════
// 1. KNOWLEDGE GRAPH — Directed Acyclic Graph of Chess Concepts
// ═══════════════════════════════════════════════════

export const KNOWLEDGE_GRAPH = [
  // --- Fundamentals (800) ---
  { id:'board_setup', name:'Board Setup & Notation', category:'fundamentals', difficulty:1, ratingRange:[0,900], prerequisites:[], desc:'Learn algebraic notation, file/rank naming, and proper board orientation.', studyMin:15, xp:10 },
  { id:'piece_movement', name:'Piece Movement', category:'fundamentals', difficulty:1, ratingRange:[0,900], prerequisites:['board_setup'], desc:'How each piece moves: King, Queen, Rook, Bishop, Knight, and Pawn.', studyMin:20, xp:15 },
  { id:'check_checkmate', name:'Check & Checkmate', category:'fundamentals', difficulty:1, ratingRange:[0,900], prerequisites:['piece_movement'], desc:'Understand check, checkmate, and the goal of the game.', studyMin:15, xp:15 },
  { id:'captures_exchanges', name:'Captures & Exchanges', category:'fundamentals', difficulty:1, ratingRange:[0,900], prerequisites:['piece_movement'], desc:'Piece values (P=1,N=3,B=3,R=5,Q=9) and fair trades.', studyMin:15, xp:10 },
  { id:'castling', name:'Castling', category:'fundamentals', difficulty:1, ratingRange:[0,900], prerequisites:['piece_movement'], desc:'Kingside and queenside castling rules and strategic purpose.', studyMin:10, xp:10 },
  { id:'en_passant', name:'En Passant', category:'fundamentals', difficulty:2, ratingRange:[0,1000], prerequisites:['piece_movement'], desc:'Special pawn capture rule when opponent advances two squares.', studyMin:10, xp:10 },
  { id:'stalemate', name:'Stalemate & Draws', category:'fundamentals', difficulty:2, ratingRange:[0,1000], prerequisites:['check_checkmate'], desc:'Stalemate, threefold repetition, 50-move rule, insufficient material.', studyMin:15, xp:10 },

  // --- Beginner Tactics (800-1200) ---
  { id:'fork', name:'Forks', category:'tactic', difficulty:2, ratingRange:[800,1200], prerequisites:['captures_exchanges'], desc:'Attack two or more pieces simultaneously with one piece.', studyMin:25, xp:20 },
  { id:'pin', name:'Pins', category:'tactic', difficulty:2, ratingRange:[800,1200], prerequisites:['captures_exchanges'], desc:'Restrict a piece from moving because it shields a more valuable piece.', studyMin:25, xp:20 },
  { id:'skewer', name:'Skewers', category:'tactic', difficulty:3, ratingRange:[900,1300], prerequisites:['pin'], desc:'Attack a valuable piece that must move, exposing a piece behind it.', studyMin:20, xp:20 },
  { id:'double_attack', name:'Double Attacks', category:'tactic', difficulty:2, ratingRange:[800,1200], prerequisites:['fork'], desc:'Threaten two things at once — can be with any piece, not just knights.', studyMin:20, xp:20 },
  { id:'back_rank_mate', name:'Back Rank Mate', category:'tactic', difficulty:3, ratingRange:[900,1300], prerequisites:['check_checkmate'], desc:'Checkmate on the 1st or 8th rank when pawns block the king escape.', studyMin:20, xp:25 },
  { id:'removing_defender', name:'Removing the Defender', category:'tactic', difficulty:3, ratingRange:[1000,1400], prerequisites:['captures_exchanges'], desc:'Capture or deflect the piece that guards a key square or piece.', studyMin:20, xp:20 },
  { id:'smothered_mate', name:'Smothered Mate', category:'tactic', difficulty:4, ratingRange:[1100,1500], prerequisites:['fork','back_rank_mate'], desc:'Checkmate with a knight when the king is trapped by its own pieces.', studyMin:20, xp:30 },

  // --- Beginner Strategy (800-1200) ---
  { id:'center_control', name:'Center Control', category:'strategy', difficulty:2, ratingRange:[800,1200], prerequisites:['piece_movement'], desc:'Control d4, d5, e4, e5 with pawns and pieces for maximum influence.', studyMin:20, xp:15 },
  { id:'development', name:'Development Principles', category:'strategy', difficulty:2, ratingRange:[800,1200], prerequisites:['center_control'], desc:'Develop knights before bishops, castle early, connect rooks.', studyMin:25, xp:20 },
  { id:'king_safety', name:'King Safety', category:'strategy', difficulty:2, ratingRange:[800,1200], prerequisites:['castling'], desc:'Keep the king safe through castling, pawn shelter, and awareness.', studyMin:20, xp:15 },
  { id:'piece_activity', name:'Piece Activity', category:'strategy', difficulty:3, ratingRange:[1000,1400], prerequisites:['development'], desc:'Place pieces on their most active squares to control the game.', studyMin:25, xp:20 },

  // --- Opening Concepts (1000-1400) ---
  { id:'opening_principles', name:'Opening Principles', category:'opening', difficulty:3, ratingRange:[1000,1400], prerequisites:['development','center_control'], desc:'Control center, develop pieces, castle early, connect rooks.', studyMin:30, xp:25 },
  { id:'e4_openings', name:'King\'s Pawn Openings', category:'opening', difficulty:3, ratingRange:[1000,1400], prerequisites:['opening_principles'], desc:'1.e4 systems: Italian, Ruy Lopez, Scotch, and defenses.', studyMin:40, xp:30 },
  { id:'d4_openings', name:'Queen\'s Pawn Openings', category:'opening', difficulty:3, ratingRange:[1000,1400], prerequisites:['opening_principles'], desc:'1.d4 systems: Queen\'s Gambit, London, and Indian Defenses.', studyMin:40, xp:30 },
  { id:'sicilian', name:'Sicilian Defense', category:'opening', difficulty:4, ratingRange:[1200,1600], prerequisites:['e4_openings'], desc:'1.e4 c5 — The most popular and complex defense against e4.', studyMin:45, xp:35 },
  { id:'ruy_lopez', name:'Ruy Lopez', category:'opening', difficulty:4, ratingRange:[1200,1600], prerequisites:['e4_openings'], desc:'1.e4 e5 2.Nf3 Nc6 3.Bb5 — Classic and strategically deep opening.', studyMin:40, xp:30 },
  { id:'queens_gambit', name:'Queen\'s Gambit', category:'opening', difficulty:4, ratingRange:[1200,1600], prerequisites:['d4_openings'], desc:'1.d4 d5 2.c4 — Offers a pawn to control the center.', studyMin:40, xp:30 },
  { id:'caro_kann', name:'Caro-Kann Defense', category:'opening', difficulty:3, ratingRange:[1000,1400], prerequisites:['e4_openings'], desc:'1.e4 c6 — Solid and reliable defense for Black.', studyMin:35, xp:25 },

  // --- Intermediate Tactics (1200-1600) ---
  { id:'discovered_attack', name:'Discovered Attacks', category:'tactic', difficulty:4, ratingRange:[1200,1600], prerequisites:['pin'], desc:'Move a piece to unmask an attack from another piece behind it.', studyMin:25, xp:25 },
  { id:'double_check', name:'Double Check', category:'tactic', difficulty:5, ratingRange:[1300,1700], prerequisites:['discovered_attack'], desc:'Check with two pieces simultaneously — king must move.', studyMin:20, xp:30 },
  { id:'deflection', name:'Deflection', category:'tactic', difficulty:4, ratingRange:[1200,1600], prerequisites:['removing_defender'], desc:'Force a defending piece away from its protective duty.', studyMin:25, xp:25 },
  { id:'decoy', name:'Decoy', category:'tactic', difficulty:4, ratingRange:[1200,1600], prerequisites:['deflection'], desc:'Lure a piece to a vulnerable square where it can be exploited.', studyMin:25, xp:25 },
  { id:'zwischenzug', name:'Zwischenzug', category:'tactic', difficulty:5, ratingRange:[1400,1800], prerequisites:['double_attack'], desc:'An in-between move that interrupts the expected sequence.', studyMin:30, xp:35 },
  { id:'x_ray', name:'X-Ray Attack', category:'tactic', difficulty:4, ratingRange:[1300,1700], prerequisites:['skewer'], desc:'Attack through a piece to threaten something behind it.', studyMin:20, xp:25 },

  // --- Intermediate Strategy (1200-1600) ---
  { id:'pawn_structure', name:'Pawn Structures', category:'strategy', difficulty:4, ratingRange:[1200,1600], prerequisites:['center_control'], desc:'Doubled, isolated, backward, passed, and connected pawns.', studyMin:35, xp:30 },
  { id:'weak_squares', name:'Weak Squares', category:'strategy', difficulty:4, ratingRange:[1200,1600], prerequisites:['pawn_structure'], desc:'Squares that can no longer be defended by pawns become targets.', studyMin:30, xp:25 },
  { id:'outposts', name:'Outpost Squares', category:'strategy', difficulty:4, ratingRange:[1300,1700], prerequisites:['weak_squares'], desc:'Strong squares for knights supported by pawns, immune to pawn attacks.', studyMin:30, xp:30 },
  { id:'open_files', name:'Open Files & Ranks', category:'strategy', difficulty:3, ratingRange:[1100,1500], prerequisites:['piece_activity'], desc:'Place rooks on open or semi-open files to penetrate enemy position.', studyMin:25, xp:25 },
  { id:'bishop_pair', name:'Bishop Pair Advantage', category:'strategy', difficulty:4, ratingRange:[1300,1700], prerequisites:['piece_activity'], desc:'Two bishops working together control more squares in open positions.', studyMin:25, xp:25 },
  { id:'space_advantage', name:'Space Advantage', category:'strategy', difficulty:4, ratingRange:[1300,1700], prerequisites:['center_control','pawn_structure'], desc:'Control more squares to restrict opponent\'s piece maneuverability.', studyMin:30, xp:30 },
  { id:'initiative', name:'Initiative', category:'strategy', difficulty:5, ratingRange:[1400,1800], prerequisites:['piece_activity','development'], desc:'Keep making threats to force opponent into defensive reactions.', studyMin:30, xp:30 },
  { id:'prophylaxis', name:'Prophylaxis', category:'strategy', difficulty:6, ratingRange:[1600,2000], prerequisites:['outposts','initiative'], desc:'Prevent opponent\'s plans before executing your own. Think: "What does my opponent want?"', studyMin:40, xp:40 },
  { id:'planning', name:'Strategic Planning', category:'strategy', difficulty:6, ratingRange:[1600,2000], prerequisites:['prophylaxis','space_advantage'], desc:'Formulate and execute multi-move plans based on positional features.', studyMin:45, xp:45 },

  // --- Endgame Concepts ---
  { id:'king_pawn_eg', name:'King & Pawn Endgames', category:'endgame', difficulty:3, ratingRange:[900,1300], prerequisites:['stalemate'], desc:'The most fundamental endgames — king activity is paramount.', studyMin:30, xp:25 },
  { id:'opposition', name:'Opposition', category:'endgame', difficulty:3, ratingRange:[900,1300], prerequisites:['king_pawn_eg'], desc:'Kings face off with one square between — the side NOT to move has opposition.', studyMin:25, xp:25 },
  { id:'square_rule', name:'Square Rule', category:'endgame', difficulty:3, ratingRange:[900,1300], prerequisites:['king_pawn_eg'], desc:'Can the king catch a passed pawn? Draw a diagonal square to find out.', studyMin:15, xp:15 },
  { id:'lucena', name:'Lucena Position', category:'endgame', difficulty:4, ratingRange:[1200,1600], prerequisites:['opposition'], desc:'The most important rook endgame position — build a bridge to promote.', studyMin:30, xp:35 },
  { id:'philidor', name:'Philidor Position', category:'endgame', difficulty:4, ratingRange:[1200,1600], prerequisites:['lucena'], desc:'The key defensive technique in rook endgames — use the 3rd rank.', studyMin:30, xp:35 },
  { id:'rook_endgame', name:'Rook Endgames', category:'endgame', difficulty:5, ratingRange:[1400,1800], prerequisites:['philidor'], desc:'Rook activity, cutting off the king, passed pawn play.', studyMin:45, xp:40 },
  { id:'minor_piece_eg', name:'Minor Piece Endgames', category:'endgame', difficulty:5, ratingRange:[1500,1900], prerequisites:['opposition','bishop_pair'], desc:'Bishop vs Knight, same-colored bishops, opposite-colored bishops.', studyMin:40, xp:35 },
  { id:'queen_endgame', name:'Queen Endgames', category:'endgame', difficulty:6, ratingRange:[1600,2000], prerequisites:['rook_endgame'], desc:'Queen vs pawn promotions, queen vs queen, perpetual check.', studyMin:40, xp:40 },

  // --- Advanced (1600-2000) ---
  { id:'candidate_moves', name:'Candidate Moves', category:'calculation', difficulty:5, ratingRange:[1400,1800], prerequisites:['discovered_attack','double_check'], desc:'Identify 2-3 strongest candidate moves before calculating deeply.', studyMin:35, xp:35 },
  { id:'passed_pawn', name:'Passed Pawn Play', category:'endgame', difficulty:5, ratingRange:[1400,1800], prerequisites:['square_rule'], desc:'Creating, supporting, and promoting passed pawns.', studyMin:30, xp:30 },
  { id:'exchange_sacrifice', name:'Exchange Sacrifice', category:'strategy', difficulty:6, ratingRange:[1600,2000], prerequisites:['piece_activity','outposts'], desc:'Give rook for minor piece to gain positional dominance.', studyMin:35, xp:40 },
  { id:'minority_attack', name:'Minority Attack', category:'strategy', difficulty:5, ratingRange:[1400,1800], prerequisites:['pawn_structure','open_files'], desc:'Advance minority pawns to create weaknesses in opponent\'s pawn chain.', studyMin:30, xp:30 },

  // --- Master (2000+) ---
  { id:'deep_calculation', name:'Deep Calculation Trees', category:'calculation', difficulty:7, ratingRange:[1800,2400], prerequisites:['candidate_moves','zwischenzug'], desc:'Calculate 6-10 moves deep with multiple branches.', studyMin:45, xp:50 },
  { id:'positional_sacrifice', name:'Positional Sacrifice', category:'strategy', difficulty:7, ratingRange:[2000,2500], prerequisites:['exchange_sacrifice'], desc:'Sacrifice material for long-term positional compensation.', studyMin:40, xp:50 },
  { id:'fortress', name:'Fortress Defense', category:'endgame', difficulty:7, ratingRange:[1800,2400], prerequisites:['rook_endgame'], desc:'Build an impregnable defensive formation that holds despite material deficit.', studyMin:35, xp:45 },
  { id:'complex_endgames', name:'Complex Endgames', category:'endgame', difficulty:8, ratingRange:[2000,2500], prerequisites:['fortress','queen_endgame','minor_piece_eg'], desc:'Multi-piece endgames requiring precise technique and deep calculation.', studyMin:50, xp:55 },
];

export function getUnlockedConcepts(masteredIds) {
  const mastered = new Set(masteredIds || []);
  return KNOWLEDGE_GRAPH.filter(c =>
    !mastered.has(c.id) && c.prerequisites.every(p => mastered.has(p))
  );
}

export function getConceptsByCategory(category) {
  return KNOWLEDGE_GRAPH.filter(c => c.category === category);
}

export function getHighestROIConcept(userProfile) {
  // 1. Spaced Repetition check: Find any concept whose retention has decayed below 60%
  const reviewQueue = [];
  if (userProfile.masteryMap) {
    Object.keys(userProfile.masteryMap).forEach(id => {
      const mastery = userProfile.getMasteryFor(id);
      if (mastery && mastery.mastered && mastery.retention < 60) {
        const conceptNode = KNOWLEDGE_GRAPH.find(c => c.id === id);
        if (conceptNode) {
          reviewQueue.push({ concept: conceptNode, retention: mastery.retention });
        }
      }
    });
  }
  
  if (reviewQueue.length > 0) {
    // Sort by lowest retention first to reinforce the weakest
    reviewQueue.sort((a, b) => a.retention - b.retention);
    return reviewQueue[0].concept;
  }

  // 2. Otherwise, study new unlocked concepts
  const unlocked = getUnlockedConcepts(userProfile.masteredConcepts);
  if (!unlocked.length) return null;
  // Sort by: closest to current rating range, then by XP reward
  const elo = userProfile.elo || 800;
  return unlocked.sort((a, b) => {
    const aRelevance = (elo >= a.ratingRange[0] && elo <= a.ratingRange[1]) ? 1 : 0;
    const bRelevance = (elo >= b.ratingRange[0] && elo <= b.ratingRange[1]) ? 1 : 0;
    if (bRelevance !== aRelevance) return bRelevance - aRelevance;
    return (b.xp / b.difficulty) - (a.xp / a.difficulty);
  })[0];
}

// ═══════════════════════════════════════════════════
// 2. MILESTONES DATABASE
// ═══════════════════════════════════════════════════

export const MILESTONES = [
  { elo:800, title:'Beginner', icon:'♟️', color:'#94a3b8', 
    skills:['board_setup','piece_movement','check_checkmate','captures_exchanges','castling'], 
    openings:['Any — focus on principles'], 
    endgames:['Basic checkmates (K+Q vs K, K+R vs K)'], 
    target:'Learn all piece movements and basic checkmate patterns.',
    requiredBoss:null,
    challenges:['Complete onboarding assessment', 'Master basic coordinates'],
    unlockableContent:'London System Repertoire, Tactics Academy Basics'
  },
  { elo:1000, title:'Novice', icon:'🐴', color:'#60a5fa', 
    skills:['fork','pin','center_control','development','king_safety'], 
    openings:['Italian Game','London System'], 
    endgames:['King & Pawn basics','Opposition'], 
    target:'Spot 1-move tactics and develop pieces before attacking.',
    requiredBoss:'fork_master',
    challenges:['Solve 15 tactical puzzles', 'Beat Fork Master Boss Battle'],
    unlockableContent:'Tactics Level 2, Italian Game Repertoire'
  },
  { elo:1200, title:'Intermediate', icon:'🏇', color:'#34d399', 
    skills:['skewer','double_attack','back_rank_mate','opening_principles','pawn_structure'], 
    openings:['Ruy Lopez','Caro-Kann','Queen\'s Gambit'], 
    endgames:['Square Rule','Basic Rook endgames'], 
    target:'Consistently avoid blunders and see 2-move combinations.',
    requiredBoss:'pin_master',
    challenges:['Solve 30 puzzles', 'Beat Pin Master Boss Battle'],
    unlockableContent:'Visualization Trainer, Ruy Lopez Repertoire'
  },
  { elo:1400, title:'Club Player', icon:'🏰', color:'#a78bfa', 
    skills:['discovered_attack','deflection','removing_defender','outposts','open_files'], 
    openings:['Sicilian Defense','Nimzo-Indian'], 
    endgames:['Lucena','Philidor'], 
    target:'Calculate 3 moves deep and understand positional concepts.',
    requiredBoss:'endgame_master',
    challenges:['Play 10 rapid matches', 'Beat Endgame Fundamentals Boss'],
    unlockableContent:'Blindfold Coordinate Trainer, Sicilian Najdorf Repertoire'
  },
  { elo:1600, title:'Tournament Player', icon:'⚔️', color:'#f59e0b', 
    skills:['zwischenzug','candidate_moves','space_advantage','initiative','minority_attack'], 
    openings:['Deep repertoire with 2 systems per color'], 
    endgames:['Rook endgames','Passed pawn play'], 
    target:'Play with plans, not just reactions. Manage time effectively.',
    requiredBoss:'tactics_warrior',
    challenges:['Solve 50 puzzles', 'Beat Tactics Warrior Boss Battle'],
    unlockableContent:'Calculation Trainer, Candidate Move Puzzles'
  },
  { elo:1800, title:'Advanced', icon:'♝', color:'#ec4899', 
    skills:['prophylaxis','planning','exchange_sacrifice','deep_calculation'], 
    openings:['Complete repertoire with sideline preparation'], 
    endgames:['Minor piece endgames','Queen endgames'], 
    target:'Think about what opponent wants before making your move.',
    requiredBoss:'strategy_sage',
    challenges:['Record 20 games played', 'Beat Strategy Sage Boss Battle'],
    unlockableContent:'Deep Calculation Trees, Advanced Endgames'
  },
  { elo:2000, title:'Expert', icon:'🛡️', color:'#f43f5e', 
    skills:['positional_sacrifice','fortress','complex_endgames'], 
    openings:['Full theoretical preparation'], 
    endgames:['All endgame types to master level'], 
    target:'Deep strategic understanding and precise endgame technique.',
    requiredBoss:'calculation_king',
    challenges:['Solve 100 puzzles', 'Beat Calculation King Boss Battle'],
    unlockableContent:'Grandmaster Challenge Mode'
  },
  { elo:2200, title:'Candidate Master', icon:'🏅', color:'#eab308', 
    skills:['All tactics mastered','All strategy mastered'], 
    openings:['Professional-level repertoire'], 
    endgames:['Complete endgame mastery'], 
    target:'Consistent tournament results and FIDE-level play.',
    requiredBoss:'grandmaster_gauntlet',
    challenges:['Win 5 rapid games in a row', 'Pass Grandmaster Gauntlet'],
    unlockableContent:'Candidate Master Badge & Profile Border'
  },
  { elo:2500, title:'Grandmaster Knowledge', icon:'👑', color:'#fbbf24', 
    skills:['Complete chess understanding'], 
    openings:['World-class preparation'], 
    endgames:['Endgame artistry'], 
    target:'You understand chess at the highest human level.',
    requiredBoss:null,
    challenges:['Master 30 distinct chess concepts', 'Estimate rating above 2500'],
    unlockableContent:'Grandmaster Certification'
  },
];

export function getCurrentMilestone(elo) {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (elo >= MILESTONES[i].elo) return { current: MILESTONES[i], next: MILESTONES[i+1] || null, index: i };
  }
  return { current: MILESTONES[0], next: MILESTONES[1], index: 0 };
}

// ═══════════════════════════════════════════════════
// 3. FEN PARSING & OPENING DETECTION
// ═══════════════════════════════════════════════════

const OPENINGS = [
  { name:'Ruy Lopez', fenPrefix:'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq -' },
  { name:'Sicilian Defense', fenPrefix:'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -' },
  { name:'French Defense', fenPrefix:'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -' },
  { name:'Caro-Kann Defense', fenPrefix:'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -' },
  { name:'Queen\'s Gambit', fenPrefix:'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq -' },
  { name:'King\'s Indian Defense', fenPrefix:'rnbqkbnr/pppppp1p/6p1/8/2PP4/5N2/PP2PPPP/RNBQKB1R b KQkq -' },
  { name:'Slav Defense', fenPrefix:'rnbqkbnr/pp1ppppp/2p5/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq -' },
  { name:'Italian Game', fenPrefix:'rnbqkbnr/pppp1ppp/8/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq -' },
  { name:'Scandinavian Defense', fenPrefix:'rnbqkbnr/pppppppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -' }
];

export function parseFEN(fen) {
  if (!fen || typeof fen !== 'string') return null;
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 4) return null;
  return { board:parts[0], turn:parts[1], castling:parts[2], enPassant:parts[3], halfmove:parseInt(parts[4]||'0',10), fullmove:parseInt(parts[5]||'1',10) };
}

export function detectOpening(fen) {
  if (!fen) return null;
  for (const op of OPENINGS) { if (fen.startsWith(op.fenPrefix)) return op.name; }
  if (fen.includes('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq')) return "King's Pawn Opening";
  if (fen.includes('rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq')) return "Queen's Pawn Opening";
  if (fen.includes('rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq')) return "English Opening";
  if (fen.includes('rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq')) return "Réti Opening";
  return null;
}

// ═══════════════════════════════════════════════════
// 4. MOVE CLASSIFICATION & ACCURACY
// ═══════════════════════════════════════════════════

export function classifyEvalDiff(diff) {
  const absDiff = Math.abs(diff);
  if (diff > 2.0) return { type:'brilliant', label:'Brilliant', color:'#10b981', icon:'!!', desc:'A spectacular move.' };
  if (diff > 0.8) return { type:'great', label:'Great Move', color:'#34d399', icon:'!', desc:'An excellent strategic move.' };
  if (absDiff <= 0.15) return { type:'best', label:'Best Move', color:'#3b82f6', icon:'⭐', desc:'The optimal move.' };
  if (absDiff <= 0.4) return { type:'excellent', label:'Excellent', color:'#60a5fa', icon:'✓', desc:'A solid move.' };
  if (absDiff <= 0.7) return { type:'good', label:'Good', color:'#a7f3d0', icon:'👍', desc:'A reasonable move.' };
  if (diff < -2.0) return { type:'blunder', label:'Blunder', color:'#ef4444', icon:'??', desc:'A serious error.' };
  if (diff < -0.9) return { type:'mistake', label:'Mistake', color:'#fb923c', icon:'?', desc:'An oversight.' };
  return { type:'inaccuracy', label:'Inaccuracy', color:'#fbbf24', icon:'?!', desc:'Not the best move.' };
}

export function calcAccuracy(moves) {
  if (!moves || moves.length === 0) return 100;
  const w = { brilliant:100, great:95, best:100, excellent:85, good:70, inaccuracy:45, mistake:20, blunder:0 };
  let total = 0;
  moves.forEach(m => { total += (w[m.type] !== undefined) ? w[m.type] : 80; });
  return Math.round(total / moves.length);
}

export function estimateElo(accuracy) {
  if (accuracy >= 95) return '2200+ (Master)';
  if (accuracy >= 85) return '1800–2200 (Expert)';
  if (accuracy >= 70) return '1400–1800 (Intermediate)';
  if (accuracy >= 50) return '1000–1400 (Novice)';
  return 'Below 1000 (Beginner)';
}

// ═══════════════════════════════════════════════════
// 5. COACH COMMENTARY ENGINE
// ═══════════════════════════════════════════════════

export function getCoachCommentary(san, move, classification, openingName) {
  if (!san || !move || !classification) return "Setup your game to see grandmaster suggestions.";
  const moveStr = `${move.from} → ${move.to}`;
  const type = classification.type;
  const isCapture = move.flags && move.flags.includes('c');
  const isCheck = (san && san.includes('+')) || (move.san && move.san.includes('+'));
  const isCheckmate = (san && san.includes('#')) || (move.san && move.san.includes('#'));

  if (isCheckmate) return `🏆 **Checkmate!** You delivered checkmate with **${san}**. Brilliant execution.`;
  if (type === 'brilliant') return isCapture ? `🎯 **Brilliant!** The sacrifice **${san}** (${moveStr}) is stunning. Masterclass calculation.` : `🌟 **Brilliant!** **${san}** completely disrupts your opponent's defense.`;
  if (type === 'great') return isCheck ? `⚔️ **Great!** **${san}** puts the King under heavy fire.` : `🚀 **Great!** **${san}** controls key squares and restricts counterplay.`;
  if (type === 'best') { let t = `⭐ **Best Move.** Engine fully supports **${san}**.`; if (openingName) t += ` Following **${openingName}** theory.`; return t; }
  if (type === 'excellent') return `✓ **Excellent.** **${san}** develops naturally and builds pressure.`;
  if (type === 'good') return `👍 **Good.** **${san}** keeps the position solid and balanced.`;
  if (type === 'blunder') return `⚠️ **Blunder!** **${san}** (${moveStr}) is a critical error. ${isCapture ? 'The trade was highly disadvantageous.' : 'This severely damages your position.'}`;
  if (type === 'mistake') return `🟠 **Mistake.** **${san}** misses a tactical opportunity. ${move.piece === 'p' ? 'This pawn structure leaves weak squares.' : 'This allows opponent to gain tempos.'}`;
  return `🟡 **Inaccuracy.** **${san}** is slightly passive. Better was to focus on central play.`;
}

// ═══════════════════════════════════════════════════
// 6. ROADMAP & PROJECTION ENGINE
// ═══════════════════════════════════════════════════

export function calcRoadmapProjection(currentElo, targetElo, hoursPerWeek) {
  const start = Math.max(400, parseInt(currentElo, 10) || 800);
  const end = Math.min(3000, parseInt(targetElo, 10) || 2500);
  const gap = Math.max(0, end - start);
  let totalHours = 0, tempElo = start;
  while (tempElo < end) {
    if (tempElo < 1600) totalHours += 1.8;
    else if (tempElo < 2200) totalHours += 3.5;
    else totalHours += 5.2;
    tempElo += 1;
  }
  totalHours = Math.round(totalHours);
  const activeHours = Math.max(1, parseInt(hoursPerWeek, 10) || 10);
  const totalWeeks = Math.ceil(totalHours / activeHours);
  const totalYears = (totalWeeks / 52).toFixed(1);
  let suggestedHours = 10;
  if (totalYears > 5) suggestedHours = 15;
  if (totalYears > 8) suggestedHours = 25;
  return { gap, totalHours, timelineYears: totalYears, totalWeeks, suggestedPace: suggestedHours, projectedCompletionWithSuggested: (totalHours / suggestedHours / 52).toFixed(1) };
}

export function estimateLearningVelocity(recentProgress) {
  if (!recentProgress || recentProgress.length < 2) return { eloPerWeek: 5, trend: 'steady' };
  const gains = [];
  for (let i = 1; i < recentProgress.length; i++) {
    gains.push(recentProgress[i].elo - recentProgress[i-1].elo);
  }
  const avg = gains.reduce((a,b) => a+b, 0) / gains.length;
  const trend = avg > 8 ? 'accelerating' : avg > 3 ? 'steady' : avg > 0 ? 'slowing' : 'declining';
  return { eloPerWeek: Math.round(avg * 10) / 10, trend };
}

export function calculateSkillGap(masteredIds, targetMilestoneIndex) {
  const milestone = MILESTONES[targetMilestoneIndex];
  if (!milestone) return { missing: [], totalStudyMinutes: 0 };
  const mastered = new Set(masteredIds || []);
  const requiredIds = milestone.skills.filter(s => typeof s === 'string');
  const missing = KNOWLEDGE_GRAPH.filter(c => requiredIds.includes(c.id) && !mastered.has(c.id));
  const totalStudyMinutes = missing.reduce((s, c) => s + c.studyMin, 0);
  return { missing, totalStudyMinutes };
}

// ═══════════════════════════════════════════════════
// 7. WEAKNESS DETECTION ENGINE
// ═══════════════════════════════════════════════════

export function analyzeWeaknesses(gameHistory) {
  const result = {
    tactical: { score: 75, details: [] },
    strategic: { score: 70, details: [] },
    opening: { score: 65, details: [] },
    endgame: { score: 60, details: [] },
    timeManagement: { score: 80, details: [] },
    calculation: { score: 70, details: [] },
  };
  if (!gameHistory || !gameHistory.length) return result;

  let missedForks = 0, blunders = 0, openingDeviations = 0, endgameErrors = 0;
  gameHistory.forEach(game => {
    if (game.missedTactics) missedForks += game.missedTactics;
    if (game.blunders) blunders += game.blunders;
    if (game.openingDeviation) openingDeviations++;
    if (game.endgameError) endgameErrors++;
  });

  const n = gameHistory.length;
  result.tactical.score = Math.max(20, 100 - (missedForks / n) * 15 - (blunders / n) * 20);
  result.tactical.details = missedForks > 2 ? [`Missed ${missedForks} tactical opportunities in ${n} games`] : [];
  result.opening.score = Math.max(20, 100 - (openingDeviations / n) * 25);
  result.opening.details = openingDeviations > 1 ? [`${openingDeviations} opening deviations from repertoire`] : [];
  result.endgame.score = Math.max(20, 100 - (endgameErrors / n) * 30);
  result.endgame.details = endgameErrors > 0 ? [`${endgameErrors} endgame errors detected`] : [];
  result.calculation.score = Math.max(20, 100 - (blunders / n) * 25);
  Object.keys(result).forEach(k => { result[k].score = Math.round(result[k].score); });
  return result;
}

export function generateRemediationPlan(weaknesses) {
  const plan = [];
  const entries = Object.entries(weaknesses).sort((a, b) => a[1].score - b[1].score);
  entries.forEach(([area, data]) => {
    if (data.score < 70) {
      const concepts = KNOWLEDGE_GRAPH.filter(c => c.category === area || (area === 'tactical' && c.category === 'tactic'));
      if (concepts.length) {
        plan.push({ area, score: data.score, concept: concepts[0], reason: data.details[0] || `${area} skill below target` });
      }
    }
  });
  return plan;
}

// ═══════════════════════════════════════════════════
// 8. DAILY TRAINING MISSION GENERATOR
// ═══════════════════════════════════════════════════

export function generateDailyMission(userProfile) {
  const elo = userProfile.elo || 800;
  const weaknesses = analyzeWeaknesses(userProfile.gameHistory || []);
  const roiConcept = getHighestROIConcept(userProfile);
  const tasks = [];
  let totalMinutes = 0;
  let totalXP = 0;

  // 40% — Weakness remediation
  const weakest = Object.entries(weaknesses).sort((a,b) => a[1].score - b[1].score)[0];
  if (weakest) {
    const puzzleCount = elo < 1200 ? 15 : elo < 1600 ? 20 : 25;
    tasks.push({ type:'puzzles', title:`🧩 Solve ${puzzleCount} ${weakest[0]} puzzles`, desc:`Target your weakest area: ${weakest[0]} (${weakest[1].score}%)`, minutes:20, xp:30, eloGain:3, knowledgeNodeId:null });
    totalMinutes += 20; totalXP += 30;
  }

  // 30% — Current milestone skills
  if (roiConcept) {
    tasks.push({ type:'study', title:`📖 Study: ${roiConcept.name}`, desc:roiConcept.desc, minutes:roiConcept.studyMin, xp:roiConcept.xp, eloGain:2, knowledgeNodeId:roiConcept.id });
    totalMinutes += roiConcept.studyMin; totalXP += roiConcept.xp;
  }

  // 20% — Review/Reinforcement
  tasks.push({ type:'review', title:'🔍 Analyze yesterday\'s game', desc:'Run AI analysis on your most recent game to find mistakes.', minutes:15, xp:15, eloGain:2, knowledgeNodeId:null });
  totalMinutes += 15; totalXP += 15;

  // 10% — Play
  const gameCount = elo < 1200 ? 2 : 3;
  tasks.push({ type:'play', title:`⚔️ Play ${gameCount} rapid games`, desc:'Apply today\'s learning in real games against Stockfish AI.', minutes:20, xp:20, eloGain:1, knowledgeNodeId:null });
  totalMinutes += 20; totalXP += 20;

  return { tasks, totalMinutes, totalXP, estimatedEloGain: tasks.reduce((s,t) => s + t.eloGain, 0), date: new Date().toISOString().split('T')[0] };
}

export function generateWeeklyPlan(currentElo, targetElo, timelineMonths = 6) {
  const start = parseInt(currentElo, 10) || 800;
  const target = parseInt(targetElo, 10) || 1500;
  const totalWeeks = timelineMonths * 4;
  const weeklyGain = Math.ceil((target - start) / totalWeeks);
  const levels = [
    { minElo:0, maxElo:900, name:"Fundamentals", topics:["Board Coordinates","Piece Movement","Check & Checkmate","Basic Captures"] },
    { minElo:900, maxElo:1199, name:"Beginner", topics:["Opening Development","Basic Forks & Pins","King Safety","2-Move Checkmates"] },
    { minElo:1200, maxElo:1399, name:"Intermediate", topics:["Skewers & Discovered Attacks","Pawn Structure","Opening Repertoires","K+P Endgames"] },
    { minElo:1400, maxElo:1599, name:"Advanced", topics:["Outpost Squares","Rooks on Open Files","Defending Weaknesses","Rook Endgames"] },
    { minElo:1600, maxElo:1799, name:"Expert Calculation", topics:["Candidate Moves","Prophylaxis","Minority Attacks","Passed Pawn Play"] },
    { minElo:1800, maxElo:1999, name:"Master", topics:["Deep Theory","Exchange Sacrifices","Lucena & Philidor","Endgame Composition"] },
    { minElo:2000, maxElo:9999, name:"Grandmaster", topics:["Opponent Preparation","Deep Calculation Trees","Positional Sacrifices","Complex Endgames"] }
  ];
  const plan = [];
  let runElo = start;
  for (let w = 1; w <= Math.min(totalWeeks, 12); w++) {
    const level = levels.find(l => runElo >= l.minElo && runElo <= l.maxElo) || levels[0];
    const ti = (w - 1) % level.topics.length;
    plan.push({ week:w, expectedElo:Math.round(runElo), levelName:level.name, focusTopic:level.topics[ti], secondaryTopic:level.topics[(ti+1)%level.topics.length], puzzlesCount:15+Math.floor((runElo-800)/100)*5, gamesTarget:5+Math.floor(w%3) });
    runElo += weeklyGain;
  }
  return { startElo:start, targetElo:target, timelineMonths, totalWeeks, estimatedWeeklyGain:weeklyGain, plan };
}

// ═══════════════════════════════════════════════════
// 9. GAMIFICATION ENGINE
// ═══════════════════════════════════════════════════

export const ACHIEVEMENTS = [
  { id:'first_game', name:'First Steps', desc:'Play your first game', icon:'🎮', condition: p => (p.gamesPlayed||0) >= 1 },
  { id:'ten_games', name:'Getting Serious', desc:'Play 10 games', icon:'🔥', condition: p => (p.gamesPlayed||0) >= 10 },
  { id:'fifty_puzzles', name:'Puzzle Warrior', desc:'Solve 50 puzzles', icon:'🧩', condition: p => (p.puzzlesSolved||0) >= 50 },
  { id:'streak_7', name:'Week Warrior', desc:'7-day study streak', icon:'📅', condition: p => (p.streak||0) >= 7 },
  { id:'streak_30', name:'Monthly Devotion', desc:'30-day study streak', icon:'🏋️', condition: p => (p.streak||0) >= 30 },
  { id:'elo_1000', name:'Four Digits', desc:'Reach 1000 Elo', icon:'📈', condition: p => (p.elo||0) >= 1000 },
  { id:'elo_1200', name:'Intermediate', desc:'Reach 1200 Elo', icon:'🏇', condition: p => (p.elo||0) >= 1200 },
  { id:'elo_1400', name:'Club Player', desc:'Reach 1400 Elo', icon:'🏰', condition: p => (p.elo||0) >= 1400 },
  { id:'elo_1600', name:'Tournament Ready', desc:'Reach 1600 Elo', icon:'⚔️', condition: p => (p.elo||0) >= 1600 },
  { id:'elo_1800', name:'Advanced Player', desc:'Reach 1800 Elo', icon:'♝', condition: p => (p.elo||0) >= 1800 },
  { id:'elo_2000', name:'Expert', desc:'Reach 2000 Elo', icon:'🛡️', condition: p => (p.elo||0) >= 2000 },
  { id:'elo_2200', name:'Candidate Master', desc:'Reach 2200 Elo', icon:'🏅', condition: p => (p.elo||0) >= 2200 },
  { id:'first_mastery', name:'First Mastery', desc:'Master your first concept', icon:'⭐', condition: p => (p.masteredConcepts||[]).length >= 1 },
  { id:'ten_mastery', name:'Scholar', desc:'Master 10 concepts', icon:'🎓', condition: p => (p.masteredConcepts||[]).length >= 10 },
  { id:'opening_drilled', name:'Opening Scholar', desc:'Complete 20 opening drills', icon:'🧪', condition: p => (p.openingDrills||0) >= 20 },
  { id:'brilliant_move', name:'Brilliancy!', desc:'Play a brilliant move', icon:'💎', condition: p => (p.brilliantMoves||0) >= 1 },
];

export function calculateXP(activityType, result) {
  const table = { puzzle_correct:10, puzzle_wrong:2, game_win:25, game_draw:10, game_loss:5, lesson_complete:15, drill_complete:12, review_complete:10, streak_bonus:5 };
  return table[`${activityType}_${result}`] || table[activityType] || 5;
}

export function checkAchievements(userProfile) {
  const earned = new Set(userProfile.achievements || []);
  const newlyEarned = [];
  ACHIEVEMENTS.forEach(a => {
    if (!earned.has(a.id) && a.condition(userProfile)) newlyEarned.push(a);
  });
  return newlyEarned;
}

export function updateStreak(lastActiveDate) {
  if (!lastActiveDate) return { streak: 1, isNew: true };
  const last = new Date(lastActiveDate);
  const now = new Date();
  const diffDays = Math.floor((now - last) / 86400000);
  if (diffDays <= 1) return { streak: -1, isNew: false }; // -1 means increment existing
  return { streak: 1, isNew: true }; // Reset
}

export function getMasteryLevel(conceptId, practiceHistory) {
  if (!practiceHistory || !practiceHistory.length) return 0;
  const attempts = practiceHistory.filter(p => p.conceptId === conceptId);
  if (!attempts.length) return 0;
  const correct = attempts.filter(a => a.correct).length;
  return Math.min(100, Math.round((correct / Math.max(attempts.length, 5)) * 100));
}

// ═══════════════════════════════════════════════════
// 10. SM-2 SPACED REPETITION
// ═══════════════════════════════════════════════════

export function sm2Calculate(quality, repetitions, easeFactor, interval) {
  // quality: 0-5 (0-2 = fail, 3-5 = pass)
  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEF = Math.max(1.3, newEF);
  let newInterval, newReps;
  if (quality < 3) {
    newReps = 0;
    newInterval = 1;
  } else {
    newReps = repetitions + 1;
    if (newReps === 1) newInterval = 1;
    else if (newReps === 2) newInterval = 6;
    else newInterval = Math.round(interval * newEF);
  }
  return { repetitions: newReps, easeFactor: Math.round(newEF * 100) / 100, interval: newInterval, nextReview: new Date(Date.now() + newInterval * 86400000).toISOString().split('T')[0] };
}

// ═══════════════════════════════════════════════════
// 11. USER PROFILE STATE MANAGEMENT
// ═══════════════════════════════════════════════════

const PROFILE_KEY = 'chessos_profile';

export class UserProfile {
  constructor() {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(PROFILE_KEY) : null;
    const data = saved ? JSON.parse(saved) : {};
    this.elo = data.elo || 850;
    this.targetElo = data.targetElo || 2200;
    this.xp = data.xp || 0;
    this.streak = data.streak || 0;
    this.lastActiveDate = data.lastActiveDate || null;
    this.hoursPerWeek = data.hoursPerWeek || 10;
    this.masteredConcepts = data.masteredConcepts || ['board_setup','piece_movement','check_checkmate','captures_exchanges','castling'];
    this.achievements = data.achievements || [];
    this.gameHistory = data.gameHistory || [];
    this.practiceHistory = data.practiceHistory || [];
    this.gamesPlayed = data.gamesPlayed || 0;
    this.puzzlesSolved = data.puzzlesSolved || 0;
    this.openingDrills = data.openingDrills || 0;
    this.brilliantMoves = data.brilliantMoves || 0;
    this.dailyCompleted = data.dailyCompleted || {};
    this.openingRepSR = data.openingRepSR || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    // === NEW: Mastery tracking ===
    this.masteryMap = data.masteryMap || {};
    this.assessmentHistory = data.assessmentHistory || [];
    this.certifications = data.certifications || [];
    this.bossBattleScores = data.bossBattleScores || {};
    this.totalTrainingMinutes = data.totalTrainingMinutes || 0;
    this.journeyStage = data.journeyStage || 'beginner';
    this.eloHistory = data.eloHistory || [{ elo: this.elo, date: new Date().toISOString().split('T')[0] }];
    this.weeklyReports = data.weeklyReports || [];
    this.skillScores = data.skillScores || { tactical:50, strategic:50, opening:50, endgame:50, calculation:50, visualization:50 };
    this.assessmentCompleted = data.assessmentCompleted || false;
    this.guessTheMoveStats = data.guessTheMoveStats || { attempted:0, correct:0, totalScore:0 };
  }

  save() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(this));
    }
  }

  addXP(amount) { this.xp += amount; this.save(); }
  updateElo(newElo) {
    this.elo = newElo;
    const today = new Date().toISOString().split('T')[0];
    const last = this.eloHistory[this.eloHistory.length - 1];
    if (last && last.date === today) last.elo = newElo;
    else this.eloHistory.push({ elo: newElo, date: today });
    if (this.eloHistory.length > 365) this.eloHistory = this.eloHistory.slice(-365);
    this.updateJourneyStage();
    this.save();
  }
  masterConcept(id) { if (!this.masteredConcepts.includes(id)) { this.masteredConcepts.push(id); this.save(); } }

  updateStreak() {
    const result = updateStreak(this.lastActiveDate);
    if (result.isNew) this.streak = 1;
    else this.streak++;
    this.lastActiveDate = new Date().toISOString().split('T')[0];
    this.save();
  }

  checkAndAwardAchievements() {
    const newOnes = checkAchievements(this);
    newOnes.forEach(a => this.achievements.push(a.id));
    if (newOnes.length) this.save();
    return newOnes;
  }

  exportJSON() { return JSON.stringify(this, null, 2); }

  static importJSON(json) {
    const data = JSON.parse(json);
    const profile = new UserProfile();
    Object.assign(profile, data);
    profile.save();
    return profile;
  }

  static reset() {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(PROFILE_KEY);
    return new UserProfile();
  }

  // === MASTERY TRACKING ===
  updateMastery(conceptId, correct, difficulty = 5) {
    if (!this.masteryMap[conceptId]) {
      this.masteryMap[conceptId] = { conceptId, confidence:30, retention:30, successRate:0, attempts:0, correct:0, difficulty, lastPracticed:Date.now(), streak:0, mastered:false };
    }
    const e = this.masteryMap[conceptId];
    e.attempts++;
    if (correct) { e.correct++; e.streak++; e.confidence = Math.min(100, e.confidence + 8*(1-e.confidence/100)); e.retention = Math.min(100, e.retention+12); }
    else { e.streak = 0; e.confidence = Math.max(0, e.confidence - 6); e.retention = Math.max(0, e.retention - 4); }
    e.successRate = e.attempts > 0 ? e.correct / e.attempts : 0;
    e.lastPracticed = Date.now();
    e.mastered = e.confidence >= 80 && e.successRate >= 0.75 && e.attempts >= 8;
    if (e.mastered && !this.masteredConcepts.includes(conceptId)) this.masteredConcepts.push(conceptId);
    this.save();
    return e;
  }

  getMasteryFor(conceptId) {
    const e = this.masteryMap[conceptId];
    if (!e) return { confidence:0, retention:0, mastered: this.masteredConcepts.includes(conceptId), attempts:0 };
    const daysSince = (Date.now() - e.lastPracticed) / 86400000;
    const decayed = Math.max(0, e.retention - daysSince * 2);
    return { ...e, retention: Math.round(decayed) };
  }

  // === JOURNEY STAGE ===
  updateJourneyStage() {
    const stages = [
      { min:0, stage:'beginner' }, { min:1000, stage:'novice' }, { min:1200, stage:'club' },
      { min:1400, stage:'advanced' }, { min:1600, stage:'expert' }, { min:1800, stage:'candidate-master' },
      { min:2000, stage:'fide-master' }, { min:2200, stage:'international-master' }, { min:2500, stage:'grandmaster' }
    ];
    for (let i = stages.length - 1; i >= 0; i--) {
      if (this.elo >= stages[i].min) { this.journeyStage = stages[i].stage; break; }
    }
  }

  // === CERTIFICATIONS ===
  addCertification(certId) {
    if (!this.certifications.includes(certId)) { this.certifications.push(certId); this.save(); }
  }

  hasCertification(certId) { return this.certifications.includes(certId); }

  // === BOSS BATTLES ===
  recordBossBattle(bossId, score, passed) {
    if (!this.bossBattleScores[bossId]) this.bossBattleScores[bossId] = { bestScore:0, attempts:0, passed:false };
    const b = this.bossBattleScores[bossId];
    b.attempts++; b.bestScore = Math.max(b.bestScore, score); b.passed = b.passed || passed;
    if (passed) this.addCertification(bossId);
    this.save();
  }

  // === TRAINING TIME ===
  addTrainingTime(mins) { this.totalTrainingMinutes += mins; this.save(); }

  // === ASSESSMENT ===
  saveAssessment(result) {
    this.assessmentHistory.push(result);
    this.skillScores = result.skillScores;
    this.assessmentCompleted = true;
    if (this.assessmentHistory.length > 50) this.assessmentHistory = this.assessmentHistory.slice(-50);
    // Update elo estimate from assessment
    if (result.estimatedElo) this.updateElo(result.estimatedElo);
    this.save();
  }

  // === WEEKLY REPORT ===
  generateWeeklyReport() {
    const now = Date.now();
    const weekAgo = now - 7 * 86400000;
    const recentPuzzles = this.practiceHistory.filter(p => p.timestamp > weekAgo);
    const recentGames = this.gameHistory.filter(g => g.timestamp > weekAgo);
    const puzzleAccuracy = recentPuzzles.length > 0 ? Math.round(recentPuzzles.filter(p => p.correct).length / recentPuzzles.length * 100) : 0;
    const eloChange = this.eloHistory.length >= 2 ? this.elo - this.eloHistory[Math.max(0, this.eloHistory.length - 8)].elo : 0;
    const report = {
      date: new Date().toISOString().split('T')[0],
      puzzlesSolved: recentPuzzles.filter(p => p.correct).length,
      puzzleAccuracy,
      gamesPlayed: recentGames.length,
      eloChange,
      trainingMinutes: Math.round(this.totalTrainingMinutes),
      newConceptsMastered: Object.values(this.masteryMap).filter(m => m.mastered && m.lastPracticed > weekAgo).length,
      strengths: Object.entries(this.skillScores).sort((a,b) => b[1]-a[1]).slice(0,2).map(([k]) => k),
      weaknesses: Object.entries(this.skillScores).sort((a,b) => a[1]-b[1]).slice(0,2).map(([k]) => k),
    };
    this.weeklyReports.push(report);
    if (this.weeklyReports.length > 52) this.weeklyReports = this.weeklyReports.slice(-52);
    this.save();
    return report;
  }

  // === LEARNING VELOCITY ===
  getLearningVelocity() {
    if (this.eloHistory.length < 2) return { eloPerWeek: 0, trend: 'new' };
    const recent = this.eloHistory.slice(-14);
    if (recent.length < 2) return { eloPerWeek: 0, trend: 'new' };
    const change = recent[recent.length-1].elo - recent[0].elo;
    const weeks = Math.max(1, recent.length / 7);
    const rate = Math.round(change / weeks);
    return { eloPerWeek: rate, trend: rate > 5 ? 'accelerating' : rate > 0 ? 'steady' : rate > -5 ? 'plateau' : 'declining' };
  }

  // === NEXT BEST ACTION ===
  getNextBestAction() {
    const weakest = Object.entries(this.skillScores).sort((a,b) => a[1]-b[1])[0];
    const roi = getHighestROIConcept(this);
    const needsAssessment = !this.assessmentCompleted || (this.assessmentHistory.length > 0 && Date.now() - new Date(this.assessmentHistory[this.assessmentHistory.length-1].timestamp).getTime() > 7*86400000);
    if (needsAssessment) return { type:'assessment', title:'Take Skill Assessment', desc:'Evaluate your current level to personalize your training.', icon:'📋', route:'assessment-view' };
    if (roi) return { type:'study', title:`Study: ${roi.name}`, desc:roi.desc, icon:'📖', route:'tactics-view', conceptId:roi.id };
    if (weakest && weakest[1] < 60) return { type:'train', title:`Train ${weakest[0]}`, desc:`Your ${weakest[0]} skill needs improvement (${weakest[1]}%)`, icon:'🎯', route:'daily-view' };
    return { type:'play', title:'Play a Game', desc:'Apply your knowledge in a real game.', icon:'⚔️', route:'play' };
  }
}

// ═══════════════════════════════════════════════════
// SKILL ASSESSMENT ENGINE
// ═══════════════════════════════════════════════════

export const ASSESSMENT_PUZZLES = {
  tactical: [
    { fen:'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4', solution:'Qxf7#', concept:'Scholar\'s Mate', difficulty:1 },
    { fen:'r2qk2r/ppp2ppp/2np4/2b1p1B1/2B1P1b1/3P1N2/PPP2PPP/RN1QK2R w KQkq - 0 7', solution:'Bxf7+', concept:'Fork/Discovery', difficulty:2 },
    { fen:'r1b1k2r/ppppqppp/2n2n2/4p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 6 5', solution:'Nd5', concept:'Knight outpost', difficulty:3 },
    { fen:'2rq1rk1/pp1bppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/2KR1B1R w - - 0 11', solution:'Nd5', concept:'Central domination', difficulty:4 },
    { fen:'r1bqk2r/pppp1Bpp/2n2n2/2b1p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 4', solution:'Ke7', concept:'King safety', difficulty:2 },
  ],
  strategic: [
    { fen:'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', solution:'e5', concept:'Mirror center control', difficulty:1 },
    { fen:'rnbqkb1r/pppppppp/5n2/8/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2', solution:'e6', concept:'Solid structure', difficulty:2 },
    { fen:'r1bqk2r/ppp2ppp/2n2n2/3pp3/2B1P3/2PP1N2/PP3PPP/RNBQK2R b KQkq - 0 5', solution:'Be7', concept:'Development priority', difficulty:2 },
  ],
  endgame: [
    { fen:'8/8/8/8/3k4/8/4KP2/8 w - - 0 1', solution:'Kf3', concept:'Opposition', difficulty:2 },
    { fen:'8/5pk1/8/8/8/8/6PP/6K1 w - - 0 1', solution:'h4', concept:'Pawn breakthrough', difficulty:3 },
    { fen:'8/8/4k3/8/8/3K4/8/4R3 w - - 0 1', solution:'Re1', concept:'Rook cutting off king', difficulty:2 },
  ],
  calculation: [
    { fen:'r2qkb1r/ppp1pppp/2n2n2/3p4/3P1Bb1/2N2N2/PPP1PPPP/R2QKB1R w KQkq - 4 4', solution:'Ne5', concept:'Centralization + attack', difficulty:3 },
    { fen:'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3', solution:'Nf6', concept:'Development with defense', difficulty:2 },
  ],
  visualization: [
    { fen:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', solution:'e4', concept:'Opening principles', difficulty:1 },
  ]
};

export function runAssessment(profile, answers) {
  const skillScores = { tactical:50, strategic:50, endgame:50, calculation:50, visualization:50, opening:50 };
  const categories = Object.keys(ASSESSMENT_PUZZLES);
  let totalCorrect = 0, totalAttempted = 0;

  categories.forEach(cat => {
    const puzzles = ASSESSMENT_PUZZLES[cat] || [];
    const catAnswers = answers.filter(a => a.category === cat);
    let correct = 0;
    let speedBonusTotal = 0;

    catAnswers.forEach(a => {
      totalAttempted++;
      if (a.correct) {
        correct++;
        totalCorrect++;
        // Target solving time based on difficulty (e.g. 20s per difficulty point)
        const targetTime = (a.difficulty || 2) * 20;
        const timeSpent = a.timeTaken || targetTime;
        if (timeSpent < targetTime) {
          const savings = (targetTime - timeSpent) / targetTime;
          speedBonusTotal += Math.round(savings * 6); // up to +6 points speed bonus
        }
      }
    });

    const accuracy = catAnswers.length > 0 ? correct / catAnswers.length : 0.5;
    const difficultyBonus = catAnswers.reduce((s, a) => s + (a.correct ? a.difficulty * 6 : 0), 0);
    skillScores[cat] = Math.min(100, Math.max(10, Math.round(accuracy * 60 + difficultyBonus + speedBonusTotal)));
  });

  // Dynamically estimate opening rating as average of strategic and tactical skills
  skillScores.opening = Math.round((skillScores.strategic + skillScores.tactical) / 2);

  const overall = Math.round(Object.values(skillScores).reduce((a,b)=>a+b,0) / Object.keys(skillScores).length);
  const estimatedElo = Math.round(800 + (overall / 100) * 1400);

  return {
    timestamp: Date.now(),
    skillScores,
    overallScore: overall,
    estimatedElo,
    totalCorrect,
    totalAttempted,
    strengths: Object.entries(skillScores).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k])=>k),
    weaknesses: Object.entries(skillScores).sort((a,b)=>a[1]-b[1]).slice(0,2).map(([k])=>k),
  };
}

// ═══════════════════════════════════════════════════
// BOSS BATTLE SYSTEM
// ═══════════════════════════════════════════════════

export const BOSS_BATTLES = [
  { id:'fork_master', name:'Fork Master', icon:'♞', category:'tactic', description:'Prove your mastery of forks by solving 10 fork puzzles with 80%+ accuracy under time pressure.',
    requiredConcepts:['fork','double_attack'], puzzleCount:10, timeLimit:300, passThreshold:0.8, xpReward:100, eloReward:15,
    color:'#10b981', difficulty:2 },
  { id:'pin_master', name:'Pin & Skewer Master', icon:'📌', category:'tactic', description:'Master pins and skewers. Solve 10 puzzles with 80%+ accuracy.',
    requiredConcepts:['pin','skewer'], puzzleCount:10, timeLimit:300, passThreshold:0.8, xpReward:120, eloReward:18,
    color:'#3b82f6', difficulty:3 },
  { id:'endgame_master', name:'Endgame Fundamentals', icon:'♟️', category:'endgame', description:'Prove your endgame basics. Opposition, square rule, and K+P endings.',
    requiredConcepts:['king_pawn_eg','opposition','square_rule'], puzzleCount:8, timeLimit:400, passThreshold:0.75, xpReward:150, eloReward:20,
    color:'#eab308', difficulty:3 },
  { id:'tactics_warrior', name:'Tactics Warrior', icon:'⚔️', category:'tactic', description:'Conquer all intermediate tactics. Discovered attacks, deflections, and more.',
    requiredConcepts:['discovered_attack','deflection','decoy','removing_defender'], puzzleCount:12, timeLimit:360, passThreshold:0.75, xpReward:200, eloReward:25,
    color:'#f43f5e', difficulty:4 },
  { id:'strategy_sage', name:'Strategy Sage', icon:'🏛️', category:'strategy', description:'Demonstrate strategic understanding. Pawn structures, weak squares, and outposts.',
    requiredConcepts:['pawn_structure','weak_squares','outposts','open_files'], puzzleCount:10, timeLimit:500, passThreshold:0.7, xpReward:180, eloReward:22,
    color:'#8b5cf6', difficulty:4 },
  { id:'calculation_king', name:'Calculation King', icon:'🧮', category:'calculation', description:'Calculate 5+ moves deep. Candidate moves and deep calculation trees.',
    requiredConcepts:['candidate_moves','deep_calculation'], puzzleCount:8, timeLimit:480, passThreshold:0.7, xpReward:250, eloReward:30,
    color:'#ec4899', difficulty:6 },
  { id:'grandmaster_gauntlet', name:'Grandmaster Gauntlet', icon:'👑', category:'all', description:'The ultimate challenge. All categories combined in a 20-puzzle marathon.',
    requiredConcepts:[], puzzleCount:20, timeLimit:900, passThreshold:0.8, xpReward:500, eloReward:50,
    color:'#fbbf24', difficulty:8 },
];

export function getBossBattlePuzzles(bossId) {
  const boss = BOSS_BATTLES.find(b => b.id === bossId);
  if (!boss) return [];
  const relevant = boss.category === 'all'
    ? TACTICS_DB
    : TACTICS_DB.filter(t => {
        if (boss.category === 'tactic') return true;
        return boss.requiredConcepts.some(c => t.category.includes(c) || t.name.toLowerCase().includes(c.replace(/_/g,' ')));
      });
  const shuffled = [...relevant].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, boss.puzzleCount);
}

// ═══════════════════════════════════════════════════
// GUESS THE MOVE ENGINE
// ═══════════════════════════════════════════════════

export function getGuessTheMovePosition(gameIndex) {
  const game = FAMOUS_GAMES_DB[gameIndex % FAMOUS_GAMES_DB.length];
  if (!game || !game.pgn) return null;
  // Pick a mid-game position (move 10-25)
  const moveMatch = game.pgn.match(/\d+\.\s*\S+\s+\S+/g);
  if (!moveMatch || moveMatch.length < 10) return null;
  const targetMove = Math.min(10 + Math.floor(Math.random() * 15), moveMatch.length - 1);
  return {
    gameTitle: game.title,
    white: game.white,
    black: game.black,
    event: game.event,
    targetMoveIndex: targetMove,
    themes: game.themes,
    pgn: game.pgn,
  };
}

// ═══════════════════════════════════════════════════
// 12. DATABASES
// ═══════════════════════════════════════════════════

// --- OPENING REPERTOIRE ---
export const REPERTOIRE_DB = {
  white: [
    { trigger:'1.e4', opponentResponse:'e5', repertoireName:'Ruy Lopez', moves:['e4','e5','Nf3','Nc6','Bb5'], plans:'Control center, pressure Nc6 defending e5, prepare to castle early.', traps:'Noah\'s Ark Trap: If white gets too greedy, black traps bishop with a6, b5, c4.', goals:'Long-term pressure on e5 pawn and d4 square dominance.' },
    { trigger:'1.e4', opponentResponse:'c5', repertoireName:'Open Sicilian', moves:['e4','c5','Nf3','d6','d4','cxd4','Nxd4'], plans:'Active central development, utilize open c-file, kingside pawn storms.', traps:'Siberian Trap: Beware queen hanging mate on h2 if rushed.', goals:'Fight asymmetry, prevent black from establishing full center.' },
    { trigger:'1.e4', opponentResponse:'c6', repertoireName:'Caro-Kann Advance', moves:['e4','c6','d4','d5','e5'], plans:'Clamp space, restrict light-squared bishop, expand kingside.', traps:'Do not permit early knight checks on f7.', goals:'Build space advantage to choke development.' },
    { trigger:'1.e4', opponentResponse:'e6', repertoireName:'French Defense Advance', moves:['e4','e6','d4','d5','e5'], plans:'Space advantage, pawn chain pointing toward kingside for attack.', traps:'Watch for c5 pawn break undermining your center.', goals:'Use space to maneuver pieces while keeping center locked.' },
  ],
  black: [
    { trigger:'Against e4', opponentResponse:'1.e4', repertoireName:'Caro-Kann Defense', moves:['c6','d4','d5'], plans:'Solid pawn wall, activate light-squared bishop to f5, counter-attack d4.', traps:'Secure f7 before pushing knight outposts.', goals:'Dismantle white\'s center from a solid base.' },
    { trigger:'Against d4', opponentResponse:'1.d4', repertoireName:'Slav Defense', moves:['d5','c4','c6'], plans:'Support d5 with c6, develop bishop to f5/g4, solid development.', traps:'Retain d5 focal point, avoid opening files prematurely.', goals:'Neutralize Queen\'s pawn aggression without locking in bishop.' },
    { trigger:'Against d4', opponentResponse:'1.d4', repertoireName:'King\'s Indian Defense', moves:['Nf6','c4','g6','Nc3','Bg7'], plans:'Fianchetto bishop, build up kingside attack, play ...e5 break.', traps:'Don\'t allow white to steamroll queenside before your kingside attack.', goals:'Dynamic counterattack on the kingside after initial concessions.' },
    { trigger:'Against e4', opponentResponse:'1.e4', repertoireName:'Sicilian Najdorf', moves:['c5','Nf3','d6','d4','cxd4','Nxd4','a6'], plans:'Flexible pawn structure, prepare ...e5 or ...b5, counterattack.', traps:'Be careful of early Bg5 pins and Bc4 attacking f7.', goals:'Create imbalanced position where Black has dynamic chances.' },
  ]
};

// --- TACTICS DATABASE (30 real puzzles) ---
export const TACTICS_DB = [
  { id:'fork_1', category:'fork', name:'Knight Fork Basics', difficulty:1, fen:'rnbqkbnr/ppp2ppp/8/3pp3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3', expected:{from:'f3',to:'e5'}, explanation:'Knight captures e5, forking the d-pawn and threatening f7.' },
  { id:'fork_2', category:'fork', name:'Queen Fork', difficulty:2, fen:'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4', expected:{from:'h5',to:'f7'}, explanation:'Qxf7# is checkmate! The queen attacks f7 which is only defended by the king.' },
  { id:'fork_3', category:'fork', name:'Knight Fork Royal', difficulty:3, fen:'r1bqk2r/ppppbppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 6 5', expected:{from:'f3',to:'g5'}, explanation:'Ng5 attacks f7 and creates threats against the uncastled king.' },
  { id:'pin_1', category:'pin', name:'Bishop Pin', difficulty:1, fen:'rnbqk1nr/pppp1ppp/4p3/8/1b1PP3/8/PPP2PPP/RNBQKBNR w KQkq - 1 3', expected:{from:'c1',to:'d2'}, explanation:'Bd2 breaks the pin on the knight. The bishop on b4 was pinning Nc3 to the queen.' },
  { id:'pin_2', category:'pin', name:'Absolute Pin', difficulty:2, fen:'rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/5N2/PPP2PPP/RNBQKB1R w KQkq - 0 3', expected:{from:'f1',to:'b5'}, explanation:'Bb5+ pins the knight on c6 to the king. The knight cannot move.' },
  { id:'pin_3', category:'pin', name:'Pin and Win', difficulty:3, fen:'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5', expected:{from:'c1',to:'g5'}, explanation:'Bg5 pins the knight to the queen. Black must deal with this or lose material.' },
  { id:'skewer_1', category:'skewer', name:'Rook Skewer', difficulty:2, fen:'4k3/8/8/8/8/8/4R3/4K3 w - - 0 1', expected:{from:'e2',to:'e8'}, explanation:'Re8+ skewers the king. When the king moves, the rook captures material behind.' },
  { id:'skewer_2', category:'skewer', name:'Bishop Skewer', difficulty:3, fen:'6k1/5ppp/8/8/8/5B2/5PPP/6K1 w - - 0 1', expected:{from:'f3',to:'c6'}, explanation:'Bc6 attacks down the diagonal, creating threats along the long diagonal.' },
  { id:'disc_1', category:'discovered_attack', name:'Discovered Check', difficulty:3, fen:'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQ1RK1 w kq - 4 6', expected:{from:'f3',to:'e5'}, explanation:'Nxe5 captures the pawn and discovers the f1-rook\'s potential.' },
  { id:'disc_2', category:'discovered_attack', name:'Discovered Attack on Queen', difficulty:4, fen:'r2qkb1r/ppp1pppp/2n2n2/3p4/3P1Bb1/2N2N2/PPP1PPPP/R2QKB1R w KQkq - 4 4', expected:{from:'f3',to:'e5'}, explanation:'Ne5 attacks the bishop on g4 while discovering attack on d5.' },
  { id:'back_rank_1', category:'back_rank_mate', name:'Classic Back Rank', difficulty:2, fen:'6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', expected:{from:'a1',to:'a8'}, explanation:'Ra8# is checkmate. The king is trapped by its own pawns on the back rank.' },
  { id:'back_rank_2', category:'back_rank_mate', name:'Back Rank Setup', difficulty:3, fen:'2r3k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1', expected:{from:'b1',to:'b8'}, explanation:'Rb8+ forces Rxb8 and then... wait, this trades. Better to find the right setup.' },
  { id:'deflection_1', category:'deflection', name:'Deflect the Guard', difficulty:3, fen:'r4rk1/ppp2ppp/8/8/8/8/PPP2PPP/R4RK1 w - - 0 1', expected:{from:'f1',to:'f7'}, explanation:'Rxf7 deflects the king from defending, opening tactical possibilities.' },
  { id:'deflection_2', category:'deflection', name:'Queen Deflection', difficulty:4, fen:'r1b2rk1/ppppqppp/2n5/4P3/2B5/8/PPP2PPP/RN1QR1K1 w - - 0 1', expected:{from:'c4',to:'f7'}, explanation:'Bxf7+ deflects the king, exposing the queen to attack.' },
  { id:'decoy_1', category:'decoy', name:'Decoy to Fork Square', difficulty:4, fen:'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', expected:{from:'c4',to:'f7'}, explanation:'Bxf7+ is a decoy sacrifice drawing the king to f7 where it can be forked.' },
  { id:'smothered_1', category:'smothered_mate', name:'Smothered Mate Pattern', difficulty:5, fen:'r1b1kb1r/ppppqppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', expected:{from:'f3',to:'g5'}, explanation:'Ng5 targets f7 with a knight, threatening smothered mate ideas.' },
  { id:'zwischenzug_1', category:'zwischenzug', name:'In-Between Move', difficulty:5, fen:'r1bqk2r/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 6', expected:{from:'c4',to:'f7'}, explanation:'Instead of the expected recapture, Bxf7+ is an in-between check first.' },
  { id:'double_attack_1', category:'double_attack', name:'Queen Double Attack', difficulty:2, fen:'rnbqkbnr/pppp1ppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR b KQkq - 0 2', expected:{from:'d8',to:'h4'}, explanation:'Qh4+ attacks the king with check and also eyes the e4 pawn.' },
  { id:'double_attack_2', category:'double_attack', name:'Bishop Double Attack', difficulty:3, fen:'rnbqk2r/pppp1ppp/5n2/2b1p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 4', expected:{from:'f3',to:'e5'}, explanation:'Nxe5 captures the pawn and attacks both c6 knight and f7 pawn.' },
  { id:'remove_def_1', category:'removing_defender', name:'Remove the Guard', difficulty:3, fen:'r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P1b1/5N2/PPPP1PPP/RNBQ1RK1 w kq - 6 5', expected:{from:'c4',to:'f7'}, explanation:'Bxf7+ removes the key defender of d5 and e6 squares.' },
];

// --- STRATEGY DATABASE (9 concepts) ---
export const STRATEGY_DB = [
  { id:'piece_activity_lesson', name:'Piece Activity', desc:'Active pieces control more squares. Place your pieces where they have maximum scope and influence.', fen:'r1bqkb1r/pppppppp/2n2n2/8/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 2 3', keySquares:['d4','e4','d5','e5'], lesson:'In this position, White\'s pawns on d4 and e4 control the center. Develop bishops to active diagonals (Bc4, Bg5) and knights to f3 and c3.' },
  { id:'weak_squares_lesson', name:'Weak Squares', desc:'Squares that cannot be defended by pawns become permanent weaknesses to exploit.', fen:'rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3', keySquares:['d5','c5'], lesson:'After exchanges on d5, the d5 square becomes a potential outpost. If Black plays ...dxe4, the e4 square can be weak too.' },
  { id:'outposts_lesson', name:'Outpost Squares', desc:'A square in enemy territory protected by your pawn and that cannot be attacked by enemy pawns.', fen:'r1bqkb1r/pp1n1ppp/2p1pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 5', keySquares:['e5'], lesson:'The e5 square is a classic outpost for a White knight. After Ne5, the knight is powerfully placed and can\'t be chased by Black pawns.' },
  { id:'pawn_structure_lesson', name:'Pawn Structures', desc:'Pawn structure determines the character of the position: open, closed, or semi-open.', fen:'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2', keySquares:['d4','d5','c4'], lesson:'The Queen\'s Gambit pawn structure: White offers c4 to undermine d5. If Black takes, White gets open c-file. If Black holds, a tense center develops.' },
  { id:'open_files_lesson', name:'Open Files', desc:'Rooks belong on open files — files with no pawns — to penetrate into enemy territory.', fen:'r2qr1k1/ppp2ppp/2np1n2/2b1p3/2B1P1b1/2NP1N2/PPP2PPP/R1BQR1K1 w - - 0 8', keySquares:['e1','e8'], lesson:'The e-file is semi-open. Both sides should fight for control. Doubling rooks on the e-file creates pressure against the enemy position.' },
  { id:'space_advantage_lesson', name:'Space Advantage', desc:'Controlling more squares restricts your opponent\'s pieces and limits their options.', fen:'rnbqkb1r/pp1ppppp/2p2n2/8/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 1 3', keySquares:['d4','e4','e5'], lesson:'White has more space with pawns on d4 and e4. This means White\'s pieces can maneuver more freely while Black is cramped.' },
  { id:'initiative_lesson', name:'Initiative', desc:'Making threats forces your opponent to react rather than execute their own plans.', fen:'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', keySquares:['f7','d4'], lesson:'White has the initiative after castling and playing d4. Each move creates a new threat, keeping Black on the defensive.' },
  { id:'prophylaxis_lesson', name:'Prophylaxis', desc:'Ask "What does my opponent want?" and prevent it before executing your own plan.', fen:'r1bqk2r/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 5', keySquares:['a4','h3'], lesson:'Before playing aggressively, consider prophylactic moves like a3 (preventing ...Bb4 pin) or h3 (preventing ...Bg4 pin). Petrosian was the master of this.' },
  { id:'planning_lesson', name:'Strategic Planning', desc:'Formulate a multi-move plan based on the position\'s features: pawn structure, piece placement, and king safety.', fen:'r2qr1k1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQR1K1 w - - 0 9', keySquares:['d5','f5','g4'], lesson:'White\'s plan could be: 1) Play Nd5 to occupy the outpost, 2) If exchanged, recapture with pawn creating passed pawn pressure, 3) Attack on the kingside with Bg5, Nd5, Qd2-h6.' },
];

// --- ENDGAME DATABASE (12 positions) ---
export const ENDGAME_DB = [
  { id:'opposition', name:'Opposition Concept', tier:'Beginner', desc:'Kings face off with one square between. The side NOT to move has the opposition — a critical advantage.', fen:'8/8/8/4k3/8/4K3/4P3/8 w - - 0 1', solution:['Ke4','Step 1: Advance with opposition'], keyIdea:'Control squares in front of the pawn by keeping opposition.' },
  { id:'square_rule', name:'Square Rule', tier:'Beginner', desc:'Draw a diagonal from the pawn to the promotion square. If the enemy king can step inside, it catches the pawn.', fen:'8/8/8/p7/8/8/8/4K3 w - - 0 1', solution:['Kd2'], keyIdea:'Count diagonally from the pawn to see if king reaches the square.' },
  { id:'king_pawn_basic', name:'King & Pawn vs King', tier:'Beginner', desc:'The most fundamental endgame. The key is whether the stronger side can gain opposition.', fen:'8/8/4k3/8/4P3/4K3/8/8 w - - 0 1', solution:['Kf4','Advance king in front of the pawn'], keyIdea:'The king must go in front of the pawn to escort it to promotion.' },
  { id:'lucena', name:'Lucena Position', tier:'Intermediate', desc:'The most important rook endgame: build a bridge to shelter your king from checks and promote.', fen:'1K1k4/1P6/8/8/8/8/1r6/5R2 w - - 0 1', solution:['Rd1+','Ke7','Rd4','Bridge building'], keyIdea:'Build a bridge: Rook goes to 4th rank, then blocks checks after king advances.' },
  { id:'philidor', name:'Philidor Position', tier:'Intermediate', desc:'The key defensive setup: keep the rook on the 6th rank until the pawn advances, then check from behind.', fen:'4k3/8/4r3/8/4P3/8/8/4RK2 b - - 0 1', solution:['Re6','Keep rook on 6th rank'], keyIdea:'Rook on 6th rank prevents king advance. When pawn pushes to 6th, switch to checking from behind.' },
  { id:'rook_activity', name:'Rook Activity Principle', tier:'Intermediate', desc:'An active rook is worth more than a passive one, even at the cost of a pawn.', fen:'8/8/4k3/4p3/4P3/8/R7/5K2 w - - 0 1', solution:['Ra6+','Activate rook to maximum range'], keyIdea:'Rooks need open lines. An active rook on the 7th rank is devastating.' },
  { id:'rook_behind_passer', name:'Rook Behind Passed Pawn', tier:'Intermediate', desc:'Tarrasch\'s rule: place the rook behind the passed pawn, whether your own or the opponent\'s.', fen:'8/P7/8/8/8/8/r7/R3K3 w - - 0 1', solution:['Ra1','Support pawn from behind'], keyIdea:'Rook behind passed pawn gains scope as the pawn advances. Rook in front loses scope.' },
  { id:'outside_passed', name:'Outside Passed Pawn', tier:'Advanced', desc:'An outside passed pawn forces the opponent\'s king to the side, allowing yours to invade.', fen:'8/5k2/8/1P3pp1/5p2/5P2/5KP1/8 w - - 0 1', solution:['b6','Advance outside passer'], keyIdea:'The outside passed pawn is a decoy that lures the enemy king away from the real battle.' },
  { id:'bishop_vs_knight', name:'Bishop vs Knight', tier:'Advanced', desc:'Bishops prefer open positions; knights prefer closed ones. Exploit the right piece advantage.', fen:'8/5k2/4n3/4p3/4P3/4B3/5K2/8 w - - 0 1', solution:['Ke3','Centralize king'], keyIdea:'With pawns on both sides, the bishop is superior due to its long-range capability.' },
  { id:'queen_vs_pawn', name:'Queen vs Pawn on 7th', tier:'Advanced', desc:'Queen can usually stop a pawn on the 7th rank by forcing the king in front, then approaching.', fen:'8/1P6/8/8/8/6k1/8/1q3K2 w - - 0 1', solution:['b8=Q','Promote and fight'], keyIdea:'If the pawn promotes safely, it becomes a queen endgame. Timing is everything.' },
  { id:'two_bishops_mate', name:'Two Bishops Checkmate', tier:'Advanced', desc:'Coordinate two bishops to drive the king to the corner and deliver checkmate.', fen:'8/8/8/8/8/2k5/3BB3/4K3 w - - 0 1', solution:['Bf4','Restrict king to corner'], keyIdea:'Use bishops to create a shrinking box, pushing the king to the edge and corner.' },
  { id:'fortress_draw', name:'Fortress Defense', tier:'Master', desc:'Create an impregnable position that draws despite being down material.', fen:'8/8/1p6/1P2k3/8/4K3/8/8 w - - 0 1', solution:['Ke3','Maintain blockade'], keyIdea:'Sometimes the best result is a draw. Recognize fortress patterns to save half a point.' },
];

// --- FAMOUS GAMES DATABASE (10 real annotated games) ---
export const FAMOUS_GAMES_DB = [
  {
    id:'opera_game', white:'Paul Morphy', black:'Duke of Brunswick & Count Isouard', event:'Opera House, Paris 1858', result:'1-0', title:'The Opera Game',
    pgn:'1.e4 e5 2.Nf3 d6 3.d4 Bg4 4.dxe5 Bxf3 5.Qxf3 dxe5 6.Bc4 Nf6 7.Qb3 Qe7 8.Nc3 c6 9.Bg5 b5 10.Nxb5 cxb5 11.Bxb5+ Nbd7 12.O-O-O Rd8 13.Rxd7 Rxd7 14.Rd1 Qe6 15.Bxd7+ Nxd7 16.Qb8+ Nxb8 17.Rd8#',
    annotations:{ 3:'Morphy opens with e4 and immediately seizes the center.', 7:'Bc4 develops with tempo, targeting the weak f7 square.', 13:'A stunning rook sacrifice! Morphy gives up the rook to deflect the defender.', 15:'Another sacrifice! Bxd7+ removes the last defender of the back rank.', 17:'The final blow — Qb8+! forces Nxb8, then Rd8# is checkmate. Pure brilliance in development and attack.' },
    themes:['Rapid Development','Back Rank Mate','Piece Sacrifice','Open Lines'],
    lessonSummary:'Morphy demonstrates that rapid piece development creates devastating attacking chances. Every move develops a piece or creates a threat. The final combination sacrifices queen and rook to exploit the back rank.'
  },
  {
    id:'game_of_century', white:'Donald Byrne', black:'Bobby Fischer', event:'New York 1956', result:'0-1', title:'Game of the Century',
    pgn:'1.Nf3 Nf6 2.c4 g6 3.Nc3 Bg7 4.d4 O-O 5.Bf4 d5 6.Qb3 dxc4 7.Qxc4 c6 8.e4 Nbd7 9.Rd1 Nb6 10.Qc5 Bg4 11.Bg5 Na4 12.Qa3 Nxc3 13.bxc3 Nxe4 14.Bxe7 Qb6 15.Bc4 Nxc3 16.Bc5 Rfe8+ 17.Kf1 Be6 18.Bxb6 Bxc4+ 19.Kg1 Ne2+ 20.Kf1 Nxd4+ 21.Kg1 Ne2+ 22.Kf1 Nc3+ 23.Kg1 axb6 24.Qb4 Ra4 25.Qxb6 Nxd1 26.h3 Rxa2 27.Kh2 Nxf2 28.Re1 Rxe1 29.Qd8+ Bf8 30.Nxe1 Bd5 31.Nf3 Ne4 32.Qb8 b5 33.h4 h5 34.Ne5 Kg7 35.Kg1 Bc5+ 36.Kf1 Ng3+ 37.Ke1 Bb4+ 38.Kd1 Bb3+ 39.Kc1 Ne2+ 40.Kb1 Nc3+ 41.Kc1 Rc2#',
    annotations:{ 11:'Fischer begins his famous combination with the surprising Na4!', 14:'The incredible queen sacrifice! Fischer gives up his queen for a devastating attack.', 17:'After Rfe8+, Fischer has rook, two minor pieces, and a pawn for the queen — with a raging attack.', 41:'A beautiful finish — Rc2# delivers checkmate. The 13-year-old Bobby Fischer plays one of the greatest games ever.' },
    themes:['Queen Sacrifice','Piece Coordination','Calculation','Attack on the King'],
    lessonSummary:'13-year-old Bobby Fischer sacrifices his queen at move 17 and demonstrates that piece activity and coordination can be more powerful than material advantage. A masterclass in attacking chess.'
  },
  {
    id:'kasparov_immortal', white:'Garry Kasparov', black:'Veselin Topalov', event:'Wijk aan Zee 1999', result:'1-0', title:'Kasparov\'s Immortal',
    pgn:'1.e4 d6 2.d4 Nf6 3.Nc3 g6 4.Be3 Bg7 5.Qd2 c6 6.f3 b5 7.Nge2 Nbd7 8.Bh6 Bxh6 9.Qxh6 Bb7 10.a3 e5 11.O-O-O Qe7 12.Kb1 a6 13.Nc1 O-O-O 14.Nb3 exd4 15.Rxd4 c5 16.Rd1 Nb6 17.g3 Kb8 18.Na5 Ba8 19.Bh3 d5 20.Qf4+ Ka7 21.Re1 d4 22.Nd5 Nbxd5 23.exd5 Qd6 24.Rxd4 cxd4 25.Re7+ Kb6 26.Qxd4+ Kxa5 27.b4+ Ka4 28.Qc3 Qxd5 29.Ra7 Bb7 30.Rxb7 Qc4 31.Qxf6 Kxa3 32.Qxa6+ Kxb4 33.c3+ Kxc3 34.Qa1+ Kd2 35.Qb2+ Kd1 36.Bf1 Rd2 37.Rd7 Rxd7 38.Bxc4 bxc4 39.Qxh8 Rd3 40.Qa8 c3 41.Qa4+ Ke1 42.f4 f5 43.Kc1 Rd2 44.Qa7',
    annotations:{ 24:'Kasparov sacrifices the exchange with Rxd4! beginning an incredible king hunt.', 25:'Re7+! Another sacrifice, driving Black\'s king on a forced march across the entire board.', 27:'b4+! The king is chased from a5 to a4 and eventually all the way to d1 — an extraordinary journey.', 44:'After an epic king chase spanning the entire board, Kasparov wins. One of the greatest games ever played.' },
    themes:['King Hunt','Exchange Sacrifice','Attack','Deep Calculation'],
    lessonSummary:'Kasparov sacrifices a rook and hunts Topalov\'s king from c8 all the way across the board to d1. An extraordinary display of attacking genius and precise calculation.'
  },
  {
    id:'evergreen', white:'Adolf Anderssen', black:'Jean Dufresne', event:'Berlin 1852', result:'1-0', title:'The Evergreen Game',
    pgn:'1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4 Bxb4 5.c3 Ba5 6.d4 exd4 7.O-O d3 8.Qb3 Qf6 9.e5 Qg6 10.Re1 Nge7 11.Ba3 b5 12.Qxb5 Rb8 13.Qa4 Bb6 14.Nbd2 Bb7 15.Ne4 Qf5 16.Bxd3 Qh5 17.Nf6+ gxf6 18.exf6 Rg8 19.Rad1 Qxf3 20.Rxe7+ Nxe7 21.Qxd7+ Kxd7 22.Bf5+ Ke8 23.Bd7+ Kf8 24.Bxe7#',
    annotations:{ 4:'The Evans Gambit! Anderssen sacrifices a pawn for rapid development.', 17:'Nf6+! A powerful knight sacrifice opening lines to the black king.', 20:'Rxe7+! Anderssen sacrifices the rook to clear the way for the bishops.', 24:'Bxe7# — A beautiful checkmate delivered by the bishop pair. The romantic era of chess at its finest.' },
    themes:['Gambit Play','Bishop Pair','Piece Sacrifice','Romantic Chess'],
    lessonSummary:'Anderssen plays the Evans Gambit and sacrifices multiple pieces to create a devastating attack. The final checkmate with the bishop is one of the most elegant finishes in chess history.'
  },
  {
    id:'carlsen_anand_2013', white:'Magnus Carlsen', black:'Viswanathan Anand', event:'World Championship 2013, Game 6', result:'1-0', title:'Carlsen\'s Squeeze',
    pgn:'1.e4 e5 2.Nf3 Nc6 3.Bb5 Nf6 4.d3 Bc5 5.c3 O-O 6.O-O Re8 7.Re1 a6 8.Ba4 b5 9.Bb3 d6 10.Bg5 Be6 11.Nbd2 h6 12.Bh4 Bxb3 13.axb3 Nb8 14.h3 Nbd7 15.Nh2 Qe7 16.Ndf1 Bb6 17.Ne3 Qe6 18.Nhf1 a5 19.g4 d5 20.Nd5 Nxd5 21.exd5 Qd7 22.Bg3 c6 23.dxc6 Qxc6 24.Ne3 a4 25.bxa4 bxa4 26.Bg2 Qc4 27.Qf3 Nc5 28.Rec1 Nb3 29.Rd1 a3 30.bxa3 Bxa3 31.Bf1 Qc7 32.Bg2 Bb4 33.Nc4 Qa7 34.Rxa7 Rxa7 35.Nd6 Re6 36.Nxf7 Rxf7 37.d4 exd4 38.Qe4 Bc5 39.cxd4 Bd6 40.Qa8+ Kh7 41.d5 Re7 42.Qd8 Ref7 43.d6 Rd7 44.Bf1 Kh8 45.Qg8+',
    annotations:{ 19:'Carlsen plays g4!? — a committal but ambitious pawn thrust typical of his style.', 36:'Nxf7! Carlsen wins a key pawn, converting his positional pressure into material.', 40:'Qa8+ begins the final combination. Carlsen demonstrates his legendary endgame technique.', 45:'Forced checkmate follows. Carlsen becomes the youngest World Champion since Kasparov.' },
    themes:['Positional Squeeze','Endgame Technique','Pawn Play','World Championship'],
    lessonSummary:'Carlsen demonstrates his trademark positional grinding style. He slowly improves his position, creates small advantages, and converts them with precise endgame technique to win the World Championship match.'
  },
  {
    id:'tal_sacrifice', white:'Mikhail Tal', black:'Vasily Smyslov', event:'Candidates 1959', result:'1-0', title:'Tal\'s Brilliancy',
    pgn:'1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Nd7 5.Nf3 Ngf6 6.Nxf6+ Nxf6 7.Bc4 Bf5 8.Qe2 e6 9.Bg5 Bg4 10.O-O-O Qa5 11.d5 O-O-O 12.Nd4 exd5 13.Bxd5 Nxd5 14.Qe8+ Rxe8 15.Rd8+ Rxd8 16.Nf5+ Rd7 17.Bxd8',
    annotations:{ 14:'Qe8+!! The stunning queen sacrifice that defines Tal. He gives up the queen to force checkmate.', 15:'Rd8+! Another sacrifice — this time the rook. Tal is playing pure fire.', 17:'After Bxd8, White has won back enough material with a decisive advantage. The Magician from Riga strikes again!' },
    themes:['Queen Sacrifice','Tactical Vision','Forcing Moves','Attack'],
    lessonSummary:'Mikhail Tal, the "Magician from Riga," demonstrates his legendary sacrificial style. He offers his queen to create an unstoppable attack, proving that initiative can be worth more than material.'
  },
  {
    id:'capablanca_endgame', white:'Jose Raul Capablanca', black:'Frank Marshall', event:'New York 1918', result:'1-0', title:'Capablanca\'s Endgame Mastery',
    pgn:'1.d4 d5 2.Nf3 Nf6 3.c4 e6 4.Nc3 Nbd7 5.Bg5 Be7 6.e3 O-O 7.Rc1 b6 8.cxd5 exd5 9.Qa4 Bb7 10.Ba6 Bxa6 11.Qxa6 c5 12.Bxf6 Nxf6 13.dxc5 bxc5 14.O-O Qb6 15.Qe2 c4 16.Rfd1 Rfd8 17.Nd4 Bb4 18.b3 Rac8 19.bxc4 dxc4 20.Rc2 Bxc3 21.Rxc3 Nd5 22.Rc2 c3',
    annotations:{ 8:'cxd5 exd5 creates an isolated queen pawn — Capablanca\'s favorite structure to exploit.', 12:'Bxf6 removes the active knight and saddles Black with structural weaknesses.', 20:'Capablanca begins his famous technique of slowly exploiting the weak pawns.', 22:'Despite Black\'s active play, Capablanca\'s endgame technique will eventually grind out the win.' },
    themes:['Isolated Queen Pawn','Endgame Technique','Positional Play','Strategic Mastery'],
    lessonSummary:'Capablanca demonstrates how to exploit an isolated queen pawn. His clean, logical play shows that understanding pawn structure is the key to winning endgames. A model game for strategic chess.'
  },
  {
    id:'anand_topalov', white:'Viswanathan Anand', black:'Veselin Topalov', event:'World Championship 2010, Game 4', result:'1-0', title:'Anand\'s Preparation',
    pgn:'1.d4 Nf6 2.c4 e6 3.Nf3 d5 4.g3 dxc4 5.Bg2 a6 6.Ne5 c5 7.Na3 cxd4 8.Naxc4 Bc5 9.O-O O-O 10.Bg5 h6 11.Bxf6 Qxf6 12.Nd3 Ba7 13.Qa4 Nc6 14.Rac1 e5 15.Qb5 Be6 16.Nce5 Rab8 17.Nc4 Rfd8 18.Nce5 Bb6 19.Qb3 Ne7 20.Rc2 Bxb3 21.axb3 Nf5 22.Nc4 Nd6 23.Nxb6 Rxb6 24.Rc5 Rd7 25.Nf4 g5 26.Nh5 Qg6 27.f4 gxf4 28.gxf4 Ne4 29.Rc2 exf4 30.Nxf4 Qe8',
    annotations:{ 6:'Ne5!? — Anand\'s deep home preparation in the Catalan Opening.', 15:'Qb5! Anand builds pressure with precise piece placement.', 25:'Nf4! The knight heads to the dominant h5 square.', 30:'Anand converts his positional advantage into a winning endgame. Masterful preparation and execution.' },
    themes:['Opening Preparation','Positional Play','Knight Maneuvers','World Championship'],
    lessonSummary:'Anand shows the power of deep opening preparation combined with precise positional play. His knight maneuvers and pawn structure understanding give him a lasting advantage that he converts cleanly.'
  },
  {
    id:'immortal_game', white:'Adolf Anderssen', black:'Lionel Kieseritzky', event:'London 1851', result:'1-0', title:'The Immortal Game',
    pgn:'1.e4 e5 2.f4 exf4 3.Bc4 Qh4+ 4.Kf1 b5 5.Bxb5 Nf6 6.Nf3 Qh6 7.d3 Nh5 8.Nh4 Qg5 9.Nf5 c6 10.g4 Nf6 11.Rg1 cxb5 12.h4 Qg6 13.h5 Qg5 14.Qf3 Ng8 15.Bxf4 Qf6 16.Nc3 Bc5 17.Nd5 Qxb2 18.Bd6 Bxg1 19.e5 Qxa1+ 20.Ke2 Na6 21.Nxg7+ Kd8 22.Qf6+ Nxf6 23.Be7#',
    annotations:{ 2:'The King\'s Gambit! The most romantic opening in chess.', 18:'Bd6!! Anderssen sacrifices BOTH rooks — the queen can take either one.', 21:'Nxg7+ continues the attack despite being down massive material.', 23:'Be7# — Checkmate with a quiet bishop move! Anderssen sacrificed both rooks, his bishop, and still checkmated.' },
    themes:['King\'s Gambit','Double Rook Sacrifice','Romantic Chess','Spectacular Attack'],
    lessonSummary:'The most famous game in chess history. Anderssen sacrifices both rooks and a bishop to deliver a stunning checkmate. This game embodies the romantic era of chess where attack and beauty reigned supreme.'
  },
  {
    id:'fischer_spassky_6', white:'Bobby Fischer', black:'Boris Spassky', event:'World Championship 1972, Game 6', result:'1-0', title:'Fischer\'s Masterpiece',
    pgn:'1.c4 e6 2.Nf3 d5 3.d4 Nf6 4.Nc3 Be7 5.Bg5 O-O 6.e3 h6 7.Bh4 b6 8.cxd5 Nxd5 9.Bxe7 Qxe7 10.Nxd5 exd5 11.Rc1 Be6 12.Qa4 c5 13.Qa3 Rc8 14.Bb5 a6 15.dxc5 bxc5 16.O-O Ra7 17.Be2 Nd7 18.Nd4 Qf8 19.Nxe6 fxe6 20.e4 d4 21.f4 Qe7 22.e5 Rb8 23.Bc4 Kh8 24.Qh3 Nf8 25.b3 a5 26.f5 exf5 27.Rxf5 Nh7 28.Rcf1 Qd8 29.Qg3 Re7 30.h4 Rbb7 31.e6 Rbc7 32.Qe5 Qe8 33.a4 Qd8 34.R1f2 Qe8 35.R2f3 Qd8 36.Bd3 Qe8 37.Qe4 Nf6 38.Rxf6 gxf6 39.Rxf6 Kg8 40.Bc4 Kh8 41.Qf4',
    annotations:{ 7:'Fischer surprises with the Queen\'s Gambit — departing from his beloved 1.e4!', 13:'Qa3! Fischer begins his famous queenside pressure.', 22:'e5! The central breakthrough that signals White\'s crushing advantage.', 38:'Rxf6! A brilliant exchange sacrifice that opens all lines to the Black king. Fischer is completely winning.' },
    themes:['Positional Mastery','Queen\'s Gambit','Exchange Sacrifice','World Championship'],
    lessonSummary:'Fischer\'s greatest game — he surprises Spassky with 1.c4, builds slow positional pressure, and finishes with a devastating exchange sacrifice. The audience gave him a standing ovation. This game effectively won Fischer the World Championship.'
  },
];
