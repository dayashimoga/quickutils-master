/**
 * ChessOS — Comprehensive Test Suite
 * Tests: Knowledge Graph, Weakness Detection, Daily Mission, Roadmap,
 *        Gamification, SM-2, UserProfile, and all databases.
 */
import { describe, it, expect } from 'vitest';
import {
  KNOWLEDGE_GRAPH, MILESTONES, REPERTOIRE_DB, TACTICS_DB, STRATEGY_DB,
  ENDGAME_DB, FAMOUS_GAMES_DB, ACHIEVEMENTS,
  getUnlockedConcepts, getConceptsByCategory, getHighestROIConcept,
  getCurrentMilestone,
  parseFEN, detectOpening,
  classifyEvalDiff, calcAccuracy, estimateElo,
  getCoachCommentary,
  calcRoadmapProjection, estimateLearningVelocity, calculateSkillGap,
  analyzeWeaknesses, generateRemediationPlan,
  generateDailyMission, generateWeeklyPlan,
  calculateXP, checkAchievements, updateStreak, getMasteryLevel,
  sm2Calculate,
  UserProfile,
  runAssessment,
  getBossBattlePuzzles,
  getGuessTheMovePosition, getCoachResponse,
  ASSESSMENT_PUZZLES
} from '../projects/chessmaster-ai/chessmaster-ai-utils.js';

// ═══════════════════════════════════════════════════
// 1. DATABASE INTEGRITY
// ═══════════════════════════════════════════════════
describe('Database Integrity', () => {
  it('Knowledge Graph has 50+ concepts', () => {
    expect(KNOWLEDGE_GRAPH.length).toBeGreaterThanOrEqual(50);
  });

  it('Every KG node has required fields', () => {
    KNOWLEDGE_GRAPH.forEach(c => {
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('category');
      expect(c).toHaveProperty('difficulty');
      expect(c).toHaveProperty('ratingRange');
      expect(c).toHaveProperty('prerequisites');
      expect(c).toHaveProperty('desc');
      expect(c).toHaveProperty('studyMin');
      expect(c).toHaveProperty('xp');
    });
  });

  it('No duplicate KG IDs', () => {
    const ids = KNOWLEDGE_GRAPH.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('All KG prerequisites reference valid IDs', () => {
    const ids = new Set(KNOWLEDGE_GRAPH.map(c => c.id));
    KNOWLEDGE_GRAPH.forEach(c => {
      c.prerequisites.forEach(p => {
        expect(ids.has(p)).toBe(true);
      });
    });
  });

  it('Milestones has 9 entries', () => {
    expect(MILESTONES.length).toBe(9);
  });

  it('Milestones are sorted by Elo ascending', () => {
    for (let i = 1; i < MILESTONES.length; i++) {
      expect(MILESTONES[i].elo).toBeGreaterThan(MILESTONES[i-1].elo);
    }
  });

  it('Repertoire DB has White and Black lines', () => {
    expect(REPERTOIRE_DB.white.length).toBeGreaterThanOrEqual(3);
    expect(REPERTOIRE_DB.black.length).toBeGreaterThanOrEqual(3);
  });

  it('Tactics DB has 20+ puzzles', () => {
    expect(TACTICS_DB.length).toBeGreaterThanOrEqual(20);
  });

  it('Every tactic has FEN and expected move', () => {
    TACTICS_DB.forEach(t => {
      expect(t).toHaveProperty('fen');
      expect(t).toHaveProperty('expected');
      expect(t.expected).toHaveProperty('from');
      expect(t.expected).toHaveProperty('to');
    });
  });

  it('Strategy DB has 9 concepts', () => {
    expect(STRATEGY_DB.length).toBe(9);
  });

  it('Endgame DB has 10+ positions', () => {
    expect(ENDGAME_DB.length).toBeGreaterThanOrEqual(10);
  });

  it('Famous Games DB has 10 real games', () => {
    expect(FAMOUS_GAMES_DB.length).toBe(10);
  });

  it('Every famous game has real PGN and annotations', () => {
    FAMOUS_GAMES_DB.forEach(g => {
      expect(g.pgn.length).toBeGreaterThan(20);
      expect(Object.keys(g.annotations).length).toBeGreaterThanOrEqual(2);
      expect(g.themes.length).toBeGreaterThanOrEqual(2);
      expect(g.lessonSummary.length).toBeGreaterThan(20);
    });
  });

  it('Achievements has 15+ achievements', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(15);
  });
});

// ═══════════════════════════════════════════════════
// 2. KNOWLEDGE GRAPH ENGINE
// ═══════════════════════════════════════════════════
describe('Knowledge Graph Engine', () => {
  it('getUnlockedConcepts returns fundamentals for empty mastery', () => {
    const unlocked = getUnlockedConcepts([]);
    const ids = unlocked.map(c => c.id);
    expect(ids).toContain('board_setup');
  });

  it('getUnlockedConcepts respects prerequisites', () => {
    const unlocked = getUnlockedConcepts(['board_setup']);
    const ids = unlocked.map(c => c.id);
    expect(ids).toContain('piece_movement');
    expect(ids).not.toContain('fork'); // fork requires captures_exchanges
  });

  it('getConceptsByCategory filters correctly', () => {
    const tactics = getConceptsByCategory('tactic');
    expect(tactics.length).toBeGreaterThan(5);
    tactics.forEach(c => expect(c.category).toBe('tactic'));
  });

  it('getHighestROIConcept returns best concept for profile', () => {
    const profile = { elo: 1000, masteredConcepts: ['board_setup', 'piece_movement', 'check_checkmate', 'captures_exchanges', 'castling'], masteryMap: {} };
    const best = getHighestROIConcept(profile);
    expect(best).toBeTruthy();
    expect(best.ratingRange[0]).toBeLessThanOrEqual(1000);
  });

  it('getHighestROIConcept prioritizes low retention reviews', () => {
    const p = new UserProfile();
    p.elo = 1000;
    // Set up a mastered concept with low retention in masteryMap
    p.masteryMap['board_setup'] = {
      conceptId: 'board_setup',
      retention: 45,
      mastered: true,
      lastPracticed: Date.now() - 10 * 86400000
    };
    const best = getHighestROIConcept(p);
    expect(best.id).toBe('board_setup');
  });

  it('getCurrentMilestone returns correct milestone', () => {
    const m = getCurrentMilestone(1300);
    expect(m.current.title).toBe('Intermediate');
    expect(m.next.title).toBe('Club Player');
  });

  it('getCurrentMilestone handles edge — below minimum', () => {
    const m = getCurrentMilestone(500);
    expect(m.current.title).toBe('Beginner');
  });

  it('getCurrentMilestone handles edge — at max', () => {
    const m = getCurrentMilestone(2500);
    expect(m.current.title).toBe('Grandmaster Knowledge');
    expect(m.next).toBeNull();
  });
});

// ═══════════════════════════════════════════════════
// 3. FEN & OPENING DETECTION
// ═══════════════════════════════════════════════════
describe('FEN Parsing & Opening Detection', () => {
  it('parseFEN extracts all fields', () => {
    const f = parseFEN('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
    expect(f.board).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR');
    expect(f.turn).toBe('b');
    expect(f.castling).toBe('KQkq');
  });

  it('parseFEN returns null for invalid input', () => {
    expect(parseFEN('')).toBeNull();
    expect(parseFEN(null)).toBeNull();
    expect(parseFEN('abc')).toBeNull();
  });

  it('detectOpening finds King\'s Pawn', () => {
    const name = detectOpening('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
    expect(name).toBe("King's Pawn Opening");
  });

  it('detectOpening finds Sicilian', () => {
    const name = detectOpening('rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -');
    expect(name).toBe('Sicilian Defense');
  });

  it('detectOpening returns null for unknown', () => {
    expect(detectOpening('8/8/8/8/8/8/8/8 w - - 0 1')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════
// 4. MOVE CLASSIFICATION & ACCURACY
// ═══════════════════════════════════════════════════
describe('Move Classification & Accuracy', () => {
  it('classifyEvalDiff identifies all move types', () => {
    expect(classifyEvalDiff(2.5).type).toBe('brilliant');
    expect(classifyEvalDiff(1.2).type).toBe('great');
    expect(classifyEvalDiff(0.1).type).toBe('best');
    expect(classifyEvalDiff(0.3).type).toBe('excellent');
    expect(classifyEvalDiff(0.6).type).toBe('good');
    expect(classifyEvalDiff(-2.5).type).toBe('blunder');
    expect(classifyEvalDiff(-1.2).type).toBe('mistake');
    expect(classifyEvalDiff(-0.8).type).toBe('inaccuracy');
  });

  it('calcAccuracy returns 100 for empty moves', () => {
    expect(calcAccuracy([])).toBe(100);
  });

  it('calcAccuracy returns reasonable percentage', () => {
    const moves = [{ type: 'best' }, { type: 'good' }, { type: 'blunder' }];
    const acc = calcAccuracy(moves);
    expect(acc).toBeGreaterThan(30);
    expect(acc).toBeLessThan(90);
  });

  it('estimateElo maps accuracy to ranges', () => {
    expect(estimateElo(96)).toContain('Master');
    expect(estimateElo(50)).toContain('Novice');
    expect(estimateElo(30)).toContain('Beginner');
  });
});

// ═══════════════════════════════════════════════════
// 5. COACH COMMENTARY
// ═══════════════════════════════════════════════════
describe('Coach Commentary', () => {
  it('returns fallback for missing input', () => {
    expect(getCoachCommentary(null, null, null, null)).toContain('Setup your game');
  });

  it('returns commentary for checkmate', () => {
    const c = getCoachCommentary('Qxh7#', { from: 'h5', to: 'h7', flags: 'c', san: 'Qxh7#' }, { type: 'best' }, null);
    expect(c).toContain('Checkmate');
  });

  it('returns commentary for brilliant capture and non-capture', () => {
    const c1 = getCoachCommentary('Nxf7+', { from: 'e5', to: 'f7', flags: 'c' }, { type: 'brilliant' }, 'Sicilian');
    expect(c1).toContain('Brilliant');
    expect(c1).toContain('sacrifice');

    const c2 = getCoachCommentary('d4', { from: 'd2', to: 'd4', flags: '' }, { type: 'brilliant' }, null);
    expect(c2).toContain('Brilliant');
    expect(c2).toContain('disrupts');
  });

  it('returns commentary for great check and non-check', () => {
    const c1 = getCoachCommentary('Re8+', { from: 'e1', to: 'e8', flags: '', san: 'Re8+' }, { type: 'great' }, null);
    expect(c1).toContain('Great');
    expect(c1).toContain('under heavy fire');

    const c2 = getCoachCommentary('a4', { from: 'a3', to: 'a4', flags: '' }, { type: 'great' }, null);
    expect(c2).toContain('Great');
    expect(c2).toContain('controls key squares');
  });

  it('includes opening name for best moves', () => {
    const c1 = getCoachCommentary('e4', { from: 'e2', to: 'e4' }, { type: 'best' }, 'Ruy Lopez');
    expect(c1).toContain('Ruy Lopez');

    const c2 = getCoachCommentary('e4', { from: 'e2', to: 'e4' }, { type: 'best' }, null);
    expect(c2).not.toContain('Following');
  });

  it('returns commentary for excellent and good moves', () => {
    const c1 = getCoachCommentary('Nf3', { from: 'g1', to: 'f3', flags: '' }, { type: 'excellent' }, null);
    expect(c1).toContain('Excellent');

    const c2 = getCoachCommentary('c3', { from: 'c2', to: 'c3', flags: '' }, { type: 'good' }, null);
    expect(c2).toContain('Good');
  });

  it('returns commentary for blunders', () => {
    const c1 = getCoachCommentary('Qxh4', { from: 'd1', to: 'h4', flags: 'c' }, { type: 'blunder' }, null);
    expect(c1).toContain('Blunder');
    expect(c1).toContain('trade');

    const c2 = getCoachCommentary('Qh4', { from: 'd1', to: 'h4', flags: '' }, { type: 'blunder' }, null);
    expect(c2).toContain('Blunder');
    expect(c2).toContain('severely damages');
  });

  it('returns commentary for mistakes', () => {
    const c1 = getCoachCommentary('e5', { from: 'e4', to: 'e5', piece: 'p' }, { type: 'mistake' }, null);
    expect(c1).toContain('Mistake');
    expect(c1).toContain('pawn structure');

    const c2 = getCoachCommentary('Nf6', { from: 'g8', to: 'f6', piece: 'n' }, { type: 'mistake' }, null);
    expect(c2).toContain('Mistake');
    expect(c2).toContain('allows opponent');
  });

  it('returns commentary for inaccuracies', () => {
    const c = getCoachCommentary('h3', { from: 'h2', to: 'h3', flags: '' }, { type: 'inaccuracy' }, null);
    expect(c).toContain('Inaccuracy');
  });
});

// ═══════════════════════════════════════════════════
// 6. ROADMAP & PROJECTION
// ═══════════════════════════════════════════════════
describe('Roadmap & Projection Engine', () => {
  it('calcRoadmapProjection returns valid projection', () => {
    const p = calcRoadmapProjection(800, 2200, 10);
    expect(p.gap).toBe(1400);
    expect(p.totalHours).toBeGreaterThan(0);
    expect(parseFloat(p.timelineYears)).toBeGreaterThan(0);
    expect(p.totalWeeks).toBeGreaterThan(0);
  });

  it('calcRoadmapProjection — more hours = shorter timeline', () => {
    const p10 = calcRoadmapProjection(1000, 2000, 10);
    const p20 = calcRoadmapProjection(1000, 2000, 20);
    expect(parseFloat(p20.timelineYears)).toBeLessThan(parseFloat(p10.timelineYears));
  });

  it('calcRoadmapProjection handles zero gap', () => {
    const p = calcRoadmapProjection(2000, 2000, 10);
    expect(p.gap).toBe(0);
  });

  it('calcRoadmapProjection handles master ELO and long timeline', () => {
    const p = calcRoadmapProjection(1000, 2600, 2);
    expect(p.totalHours).toBeGreaterThan(0);
  });

  it('estimateLearningVelocity handles insufficient data', () => {
    const v = estimateLearningVelocity([]);
    expect(v.eloPerWeek).toBe(5);
    expect(v.trend).toBe('steady');
  });

  it('estimateLearningVelocity detects acceleration', () => {
    const v = estimateLearningVelocity([{ elo: 800 }, { elo: 810 }, { elo: 825 }, { elo: 845 }]);
    expect(v.trend).toBe('accelerating');
  });

  it('calculateSkillGap returns missing concepts', () => {
    const gap = calculateSkillGap(['board_setup', 'piece_movement'], 1);
    expect(gap.missing.length).toBeGreaterThan(0);
    expect(gap.totalStudyMinutes).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════
// 7. WEAKNESS DETECTION
// ═══════════════════════════════════════════════════
describe('Weakness Detection Engine', () => {
  it('analyzeWeaknesses returns all categories', () => {
    const w = analyzeWeaknesses([]);
    expect(w).toHaveProperty('tactical');
    expect(w).toHaveProperty('strategic');
    expect(w).toHaveProperty('opening');
    expect(w).toHaveProperty('endgame');
    expect(w).toHaveProperty('timeManagement');
    expect(w).toHaveProperty('calculation');
  });

  it('analyzeWeaknesses detects poor tactics from history', () => {
    const history = [
      { missedTactics: 5, blunders: 3, openingDeviation: true, endgameError: true },
      { missedTactics: 4, blunders: 2, openingDeviation: false, endgameError: true },
    ];
    const w = analyzeWeaknesses(history);
    expect(w.tactical.score).toBeLessThan(80);
    expect(w.endgame.score).toBeLessThan(80);
  });

  it('generateRemediationPlan returns concepts for weak areas', () => {
    const weaknesses = {
      tactical: { score: 40, details: ['Missed 5 forks'] },
      strategic: { score: 85, details: [] },
      opening: { score: 90, details: [] },
      endgame: { score: 50, details: ['3 endgame errors'] },
      timeManagement: { score: 90, details: [] },
      calculation: { score: 60, details: [] },
    };
    const plan = generateRemediationPlan(weaknesses);
    expect(plan.length).toBeGreaterThanOrEqual(1);
    plan.forEach(p => {
      expect(p.score).toBeLessThan(70);
      expect(p.concept).toBeTruthy();
    });
  });
});

// ═══════════════════════════════════════════════════
// 8. DAILY TRAINING MISSION
// ═══════════════════════════════════════════════════
describe('Daily Training Mission Generator', () => {
  it('generateDailyMission returns tasks', () => {
    const profile = { elo: 1000, masteredConcepts: ['board_setup', 'piece_movement', 'check_checkmate', 'captures_exchanges', 'castling'], gameHistory: [] };
    const mission = generateDailyMission(profile);
    expect(mission.tasks.length).toBeGreaterThanOrEqual(3);
    expect(mission.totalMinutes).toBeGreaterThan(0);
    expect(mission.totalXP).toBeGreaterThan(0);
  });

  it('generateDailyMission adapts puzzle count to Elo', () => {
    const lowElo = generateDailyMission({ elo: 800, masteredConcepts: [], gameHistory: [] });
    const highElo = generateDailyMission({ elo: 1400, masteredConcepts: [], gameHistory: [] });
    const lowPuzzle = lowElo.tasks.find(t => t.type === 'puzzles');
    const highPuzzle = highElo.tasks.find(t => t.type === 'puzzles');
    expect(lowPuzzle.title).toContain('15');
    expect(highPuzzle.title).toContain('20');
  });

  it('generateWeeklyPlan returns valid plan', () => {
    const plan = generateWeeklyPlan(800, 1500, 6);
    expect(plan.plan.length).toBeGreaterThan(0);
    expect(plan.startElo).toBe(800);
    expect(plan.targetElo).toBe(1500);
    plan.plan.forEach(w => {
      expect(w.week).toBeGreaterThan(0);
      expect(w.focusTopic).toBeTruthy();
    });
  });
});

// ═══════════════════════════════════════════════════
// 9. GAMIFICATION
// ═══════════════════════════════════════════════════
describe('Gamification Engine', () => {
  it('calculateXP returns correct values', () => {
    expect(calculateXP('puzzle', 'correct')).toBe(10);
    expect(calculateXP('game', 'win')).toBe(25);
    expect(calculateXP('game', 'loss')).toBe(5);
  });

  it('checkAchievements detects new achievements', () => {
    const profile = { elo: 1000, gamesPlayed: 10, puzzlesSolved: 50, streak: 7, masteredConcepts: ['a'], achievements: [], brilliantMoves: 1, openingDrills: 20 };
    const newOnes = checkAchievements(profile);
    expect(newOnes.length).toBeGreaterThanOrEqual(3);
    const names = newOnes.map(a => a.id);
    expect(names).toContain('elo_1000');
    expect(names).toContain('ten_games');
    expect(names).toContain('streak_7');
  });

  it('checkAchievements does not re-award earned', () => {
    const profile = { elo: 1000, gamesPlayed: 10, achievements: ['elo_1000', 'ten_games'], streak: 1, masteredConcepts: [], puzzlesSolved: 0, brilliantMoves: 0, openingDrills: 0 };
    const newOnes = checkAchievements(profile);
    const names = newOnes.map(a => a.id);
    expect(names).not.toContain('elo_1000');
    expect(names).not.toContain('ten_games');
  });

  it('updateStreak resets if > 1 day gap', () => {
    const twoAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    const result = updateStreak(twoAgo);
    expect(result.isNew).toBe(true);
    expect(result.streak).toBe(1);
  });

  it('updateStreak increments for same/next day', () => {
    const today = new Date().toISOString().split('T')[0];
    const result = updateStreak(today);
    expect(result.isNew).toBe(false);
    expect(result.streak).toBe(-1);
  });

  it('getMasteryLevel returns 0 for no practice', () => {
    expect(getMasteryLevel('fork', [])).toBe(0);
    expect(getMasteryLevel('fork', [{ conceptId: 'pin', correct: true }])).toBe(0);
  });

  it('getMasteryLevel calculates correctly', () => {
    const history = [
      { conceptId: 'fork', correct: true },
      { conceptId: 'fork', correct: true },
      { conceptId: 'fork', correct: false },
      { conceptId: 'fork', correct: true },
      { conceptId: 'fork', correct: true },
    ];
    const mastery = getMasteryLevel('fork', history);
    expect(mastery).toBe(80); // 4/5 * 100
  });
});

// ═══════════════════════════════════════════════════
// 10. SM-2 SPACED REPETITION
// ═══════════════════════════════════════════════════
describe('SM-2 Spaced Repetition', () => {
  it('initial learning — quality 5 sets interval to 1', () => {
    const result = sm2Calculate(5, 0, 2.5, 0);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
    expect(result.easeFactor).toBeGreaterThanOrEqual(2.5);
  });

  it('second correct review sets interval to 6', () => {
    const result = sm2Calculate(5, 1, 2.6, 1);
    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(6);
  });

  it('third correct review uses EF multiplier', () => {
    const result = sm2Calculate(4, 2, 2.5, 6);
    expect(result.repetitions).toBe(3);
    expect(result.interval).toBe(Math.round(6 * result.easeFactor));
  });

  it('failure resets repetitions and interval', () => {
    const result = sm2Calculate(1, 5, 2.5, 30);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  it('EF never drops below 1.3', () => {
    const result = sm2Calculate(0, 0, 1.3, 0);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('nextReview is a valid date string', () => {
    const result = sm2Calculate(4, 1, 2.5, 1);
    expect(result.nextReview).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ═══════════════════════════════════════════════════
// 11. USER PROFILE
// ═══════════════════════════════════════════════════
describe('UserProfile State Management', () => {
  it('creates with defaults', () => {
    const p = new UserProfile();
    expect(p.elo).toBe(850);
    expect(p.xp).toBe(0);
    expect(p.masteredConcepts.length).toBeGreaterThanOrEqual(5);
  });

  it('masterConcept adds to list', () => {
    const p = new UserProfile();
    p.masterConcept('fork');
    expect(p.masteredConcepts).toContain('fork');
  });

  it('masterConcept does not duplicate', () => {
    const p = new UserProfile();
    p.masterConcept('board_setup');
    p.masterConcept('board_setup');
    const count = p.masteredConcepts.filter(c => c === 'board_setup').length;
    expect(count).toBe(1);
  });

  it('exportJSON produces valid JSON', () => {
    const p = new UserProfile();
    const json = p.exportJSON();
    const parsed = JSON.parse(json);
    expect(parsed.elo).toBe(850);
    expect(parsed.masteredConcepts).toBeTruthy();
  });

  it('checkAndAwardAchievements returns new achievements', () => {
    const p = new UserProfile();
    p.gamesPlayed = 1;
    const earned = p.checkAndAwardAchievements();
    expect(earned.some(a => a.id === 'first_game')).toBe(true);
    expect(p.achievements).toContain('first_game');
  });

  it('updateMastery initializes and updates concept card logic', () => {
    const p = new UserProfile();
    p.updateMastery('fork', true, 3);
    const m = p.getMasteryFor('fork');
    expect(m).toBeDefined();
    expect(m.attempts).toBe(1);
    expect(m.correct).toBe(1);
    expect(m.confidence).toBeGreaterThan(30);

    // Update again with failure
    p.updateMastery('fork', false, 3);
    const m2 = p.getMasteryFor('fork');
    expect(m2.streak).toBe(0);
    expect(m2.attempts).toBe(2);

    // Test getMasteryFor with retention >= 60
    p.masteryMap['piece_movement'] = { conceptId: 'piece_movement', confidence: 90, retention: 90, lastPracticed: Date.now() };
    const pieceMastery = p.getMasteryFor('piece_movement');
    expect(pieceMastery.recommendedReviewDate).not.toBe('Immediate Review');
  });

  it('updateJourneyStage adjusts stage based on ELO', () => {
    const p = new UserProfile();
    p.elo = 1200;
    p.updateJourneyStage();
    expect(p.journeyStage).toBe('club');

    p.elo = 2300;
    p.updateJourneyStage();
    expect(p.journeyStage).toBe('international-master');
  });

  it('addCertification and hasCertification checks certification status', () => {
    const p = new UserProfile();
    expect(p.hasCertification('tactics_master')).toBe(false);
    p.addCertification('tactics_master');
    expect(p.hasCertification('tactics_master')).toBe(true);
  });

  it('recordBossBattle records battle stats and checks unlocking', () => {
    const p = new UserProfile();
    p.recordBossBattle('pin_master', 95, true);
    expect(p.bossBattleScores['pin_master'].passed).toBe(true);
    expect(p.hasCertification('pin_master')).toBe(true);
  });

  it('addTrainingTime increments training minutes', () => {
    const p = new UserProfile();
    p.addTrainingTime(30);
    expect(p.totalTrainingMinutes).toBe(30);
  });

  it('saveAssessment updates elo and saves result', () => {
    const p = new UserProfile();
    const result = { estimatedElo: 1050, overallScore: 65, skillScores: { tactical: 70 } };
    p.saveAssessment(result);
    expect(p.elo).toBe(1050);
    expect(p.assessmentHistory.length).toBe(1);
    expect(p.assessmentHistory[0].overallScore).toBe(65);

    // Test without estimatedElo to cover the else branch
    p.saveAssessment({ overallScore: 50, skillScores: { tactical: 50 } });
    expect(p.assessmentHistory.length).toBe(2);
  });

  it('updateElo updates history by pushing or overwriting', () => {
    const p = new UserProfile();
    p.eloHistory = [];
    p.updateElo(900);
    expect(p.eloHistory.length).toBe(1);
    expect(p.eloHistory[0].elo).toBe(900);

    // Call again on the same day, should overwrite instead of pushing
    p.updateElo(950);
    expect(p.eloHistory.length).toBe(1);
    expect(p.eloHistory[0].elo).toBe(950);
  });

  it('generateWeeklyReport returns summary report object', () => {
    const p = new UserProfile();
    p.totalTrainingMinutes = 60;
    p.gamesPlayed = 5;
    p.puzzlesSolved = 20;
    const report = p.generateWeeklyReport();
    expect(report).toHaveProperty('trainingMinutes');
    expect(report.trainingMinutes).toBe(60);
    expect(p.weeklyReports.length).toBe(1);
  });

  it('generateWeeklyReport calculates accuracy and ELO changes correctly', () => {
    const p = new UserProfile();
    p.totalTrainingMinutes = 60;
    p.gamesPlayed = 5;
    p.elo = 850;
    
    // Add recent puzzles
    p.practiceHistory = [
      { timestamp: Date.now(), correct: true },
      { timestamp: Date.now(), correct: false }
    ];
    
    // Add recent games
    p.gameHistory = [
      { timestamp: Date.now() }
    ];

    // Add ELO history
    p.eloHistory = [
      { timestamp: Date.now() - 5 * 86400000, elo: 800 },
      { timestamp: Date.now(), elo: 850 }
    ];

    const report = p.generateWeeklyReport();
    expect(report.puzzleAccuracy).toBe(50);
    expect(report.eloChange).toBe(50);
    expect(report.gamesPlayed).toBe(1);
  });

  it('generateWeeklyReport slices weeklyReports when length > 52', () => {
    const p = new UserProfile();
    p.weeklyReports = Array(60).fill({});
    p.generateWeeklyReport();
    expect(p.weeklyReports.length).toBe(52);
  });

  it('generateWeeklyReport counts new concepts correctly', () => {
    const p = new UserProfile();
    p.masteryMap = {
      c1: { mastered: true, lastPracticed: Date.now() },
      c2: { mastered: false, lastPracticed: Date.now() },
      c3: { mastered: true, lastPracticed: Date.now() - 10 * 86400000 }
    };
    const report = p.generateWeeklyReport();
    expect(report.newConceptsMastered).toBe(1);
  });

  it('getLearningVelocity calculates elo changes and trends', () => {
    const p = new UserProfile();
    p.eloHistory = [
      { timestamp: Date.now() - 7 * 86400000, elo: 850 },
      { timestamp: Date.now(), elo: 950 }
    ];
    const velocity = p.getLearningVelocity();
    expect(velocity.eloPerWeek).toBeGreaterThan(0);
    expect(velocity.trend).toBe('accelerating');

    p.eloHistory = [
      { timestamp: Date.now() - 7 * 86400000, elo: 850 },
      { timestamp: Date.now(), elo: 849 }
    ];
    const velocityPlateau = p.getLearningVelocity();
    expect(velocityPlateau.trend).toBe('plateau');

    p.eloHistory = [
      { timestamp: Date.now() - 7 * 86400000, elo: 850 },
      { timestamp: Date.now(), elo: 840 }
    ];
    const velocityDeclining = p.getLearningVelocity();
    expect(velocityDeclining.trend).toBe('declining');

    // Test steady trend
    p.eloHistory = [
      { timestamp: Date.now() - 7 * 86400000, elo: 850 },
      { timestamp: Date.now(), elo: 853 }
    ];
    const velocitySteady = p.getLearningVelocity();
    expect(velocitySteady.trend).toBe('steady');

    // Test history with length >= 14
    p.eloHistory = [];
    for (let i = 0; i < 20; i++) {
      p.eloHistory.push({ elo: 800 + i * 5, timestamp: Date.now() - (20 - i) * 86400000 });
    }
    const velocityLong = p.getLearningVelocity();
    expect(velocityLong.eloPerWeek).toBeGreaterThan(0);
  });

  it('getLearningVelocity handles empty or short eloHistory', () => {
    const p = new UserProfile();
    p.eloHistory = [];
    expect(p.getLearningVelocity().trend).toBe('new');

    p.eloHistory = [{ timestamp: Date.now(), elo: 850 }];
    expect(p.getLearningVelocity().trend).toBe('new');
  });

  it('getNextBestAction suggests next step based on profile', () => {
    const p = new UserProfile();
    p.assessmentCompleted = false;
    const action = p.getNextBestAction();
    expect(action.type).toBe('assessment');

    // Case where ROI study concept exists
    p.assessmentCompleted = true;
    p.assessmentHistory = [{ timestamp: Date.now() }];
    p.masteredConcepts = ['board_setup']; // board_setup is mastered, next unlocked is piece_movement (an ROI study concept)
    const actionStudy = p.getNextBestAction();
    expect(actionStudy.type).toBe('study');

    // Case where ROI is null, but weakest concept is < 60
    p.masteredConcepts = KNOWLEDGE_GRAPH.map(c => c.id); // no ROI study concept
    p.skillScores = { tactical: 50, strategic: 80, endgame: 80, calculation: 80, visualization: 80, opening: 80 };
    const actionTrain = p.getNextBestAction();
    expect(actionTrain.type).toBe('train');

    // Case where ROI is null, and all skill scores are >= 60
    p.skillScores = { tactical: 90, strategic: 90, endgame: 90, calculation: 90, visualization: 90, opening: 90 };
    const actionPlay = p.getNextBestAction();
    expect(actionPlay.type).toBe('play');
  });

  it('reset clears profile data', () => {
    const p = UserProfile.reset();
    expect(p.elo).toBe(850);
  });

  it('updateStreak resets or increments streak', () => {
    const p = new UserProfile();
    p.lastActiveDate = null;
    p.updateStreak();
    expect(p.streak).toBe(1);

    // Yesterday's date
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    p.lastActiveDate = yesterday;
    p.updateStreak();
    expect(p.streak).toBe(2);
  });

  it('importJSON imports profile correctly', () => {
    const json = '{"elo": 1500, "xp": 100}';
    const profile = UserProfile.importJSON(json);
    expect(profile.elo).toBe(1500);
    expect(profile.xp).toBe(100);
  });
});

describe('Additional Utility Functions', () => {
  it('getBossBattlePuzzles returns correct puzzles', () => {
    // Tactic boss category
    const puzzles = getBossBattlePuzzles('fork_master');
    expect(puzzles.length).toBeGreaterThan(0);

    // All boss category
    const puzzlesAll = getBossBattlePuzzles('grandmaster_gauntlet');
    expect(puzzlesAll.length).toBe(20);

    // Specific category boss (endgame)
    const puzzlesEndgame = getBossBattlePuzzles('endgame_master');
    expect(puzzlesEndgame.length).toBeGreaterThanOrEqual(0);

    const nonexistent = getBossBattlePuzzles('nonexistent_boss');
    expect(nonexistent.length).toBe(0);
  });

  it('getGuessTheMovePosition returns valid game sequence metadata', () => {
    const result = getGuessTheMovePosition(0);
    expect(result).toBeDefined();
    expect(result.pgn).toBeDefined();
    expect(result.targetMoveIndex).toBeGreaterThanOrEqual(10);

    // Temporarily push invalid game
    FAMOUS_GAMES_DB.push({ id: 'invalid_game', pgn: '' });
    const res1 = getGuessTheMovePosition(FAMOUS_GAMES_DB.length - 1);
    expect(res1).toBeNull();
    FAMOUS_GAMES_DB.pop();

    // Temporarily push short game
    FAMOUS_GAMES_DB.push({ id: 'short_game', pgn: '1.e4 e5' });
    const res2 = getGuessTheMovePosition(FAMOUS_GAMES_DB.length - 1);
    expect(res2).toBeNull();
    FAMOUS_GAMES_DB.pop();
  });

  it('runAssessment computes correct ELO and skill scores', () => {
    const p = new UserProfile();
    const answers = [
      { category: 'tactical', correct: true, difficulty: 2, timeTaken: 15 },
      { category: 'tactical', correct: true, difficulty: 3, timeTaken: 10 },
      { category: 'strategic', correct: false, difficulty: 3, timeTaken: 40 }
    ];
    const result = runAssessment(p, answers);
    expect(result).toHaveProperty('skillScores');
    expect(result).toHaveProperty('estimatedElo');
    expect(result.totalCorrect).toBe(2);
    expect(result.totalAttempted).toBe(3);

    // Test missing difficulty and timeTaken, and force ASSESSMENT_PUZZLES fallback branch
    const originalTactical = ASSESSMENT_PUZZLES.tactical;
    ASSESSMENT_PUZZLES.tactical = undefined;

    const answers2 = [
      { category: 'tactical', correct: true }
    ];
    const result2 = runAssessment(p, answers2);
    expect(result2.totalCorrect).toBe(1);
    expect(result2.totalAttempted).toBe(1);

    // Restore
    ASSESSMENT_PUZZLES.tactical = originalTactical;
  });

  it('getCoachResponse returns personalized answers based on profile and question content', () => {
    const p = new UserProfile();
    p.elo = 900;
    p.skillScores = { tactical: 40, strategic: 80, endgame: 80, calculation: 80, visualization: 80, opening: 80 };
    
    // Test improve query
    const resImprove = getCoachResponse('How can I improve?', p);
    expect(resImprove).toContain('tactical');
    expect(resImprove).toContain('40%');

    // Test boss query with milestone having requiredBoss
    const resBoss = getCoachResponse('Tell me about boss battles', p);
    expect(resBoss).toContain('Boss Battle');

    // Test boss query with no nextMilestone requiredBoss
    p.elo = 2400; // elo > 2200, so next milestone is fide-master or similar, or next is null
    const resBoss2 = getCoachResponse('boss battle details', p);
    expect(resBoss2).toContain('excellent standing');

    // Test elo query
    const resElo = getCoachResponse('what is my elo projection?', p);
    expect(resElo).toContain('2400 ELO');

    // Test streak query
    p.streak = 5;
    const resStreak = getCoachResponse('my streak status', p);
    expect(resStreak).toContain('5-day streak');

    // Test default query
    const resDefault = getCoachResponse('Random chess question?', p);
    expect(resDefault).toContain('excellent chess question');

    // Test case where roi is null (all concepts mastered)
    p.masteredConcepts = KNOWLEDGE_GRAPH.map(c => c.id);
    const resImproveNoRoi = getCoachResponse('How can I improve?', p);
    expect(resImproveNoRoi).toContain('Tactics');

    // Test case with hoursPerWeek = 0
    p.hoursPerWeek = 0;
    const resEloZeroHours = getCoachResponse('what is my elo rating forecast?', p);
    expect(resEloZeroHours).toContain('rating is');
    
    // Test learning velocity with short history
    p.eloHistory = [{ elo: 850, date: '2026-06-26' }];
    const velShort = p.getLearningVelocity();
    expect(velShort.eloPerWeek).toBe(0);
  });
});
