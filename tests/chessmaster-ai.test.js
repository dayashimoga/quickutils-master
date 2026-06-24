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
  UserProfile
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
    const profile = { elo: 1000, masteredConcepts: ['board_setup', 'piece_movement', 'check_checkmate', 'captures_exchanges', 'castling'] };
    const best = getHighestROIConcept(profile);
    expect(best).toBeTruthy();
    expect(best.ratingRange[0]).toBeLessThanOrEqual(1000);
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
  it('classifyEvalDiff identifies blunders', () => {
    expect(classifyEvalDiff(-2.5).type).toBe('blunder');
  });

  it('classifyEvalDiff identifies best moves', () => {
    expect(classifyEvalDiff(0.05).type).toBe('best');
  });

  it('classifyEvalDiff identifies brilliant moves', () => {
    expect(classifyEvalDiff(2.5).type).toBe('brilliant');
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

  it('returns commentary for brilliant moves', () => {
    const c = getCoachCommentary('Nxf7+', { from: 'e5', to: 'f7', flags: 'c' }, { type: 'brilliant' }, 'Sicilian');
    expect(c).toContain('Brilliant');
  });

  it('returns commentary for blunders', () => {
    const c = getCoachCommentary('Qh4', { from: 'd1', to: 'h4', flags: '' }, { type: 'blunder' }, null);
    expect(c).toContain('Blunder');
  });

  it('includes opening name for best moves', () => {
    const c = getCoachCommentary('e4', { from: 'e2', to: 'e4' }, { type: 'best' }, 'Ruy Lopez');
    expect(c).toContain('Ruy Lopez');
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
    const highElo = generateDailyMission({ elo: 1600, masteredConcepts: [], gameHistory: [] });
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
});
