/**
 * ChessOS — Interactive Chess Learning Operating System
 * Complete interactive engine with puzzle solving, journey map,
 * gamification, adaptive coaching, and Stockfish integration.
 */
import { Chess } from 'https://cdn.jsdelivr.net/npm/chess.js@1.0.0-beta.8/+esm';
import {
  parseFEN, detectOpening, classifyEvalDiff, calcAccuracy,
  estimateElo, getCoachCommentary, calcRoadmapProjection,
  REPERTOIRE_DB, TACTICS_DB, ENDGAME_DB
} from './chessmaster-ai-utils.js';

// ═══════════════════════════════════════════════════
// PIECE IMAGES
// ═══════════════════════════════════════════════════
const PB = 'https://cdn.jsdelivr.net/gh/lichess-org/lila@master/public/piece/cburnett';
const PI = {wk:`${PB}/wK.svg`,wq:`${PB}/wQ.svg`,wr:`${PB}/wR.svg`,wb:`${PB}/wB.svg`,wn:`${PB}/wN.svg`,wp:`${PB}/wP.svg`,bk:`${PB}/bK.svg`,bq:`${PB}/bQ.svg`,br:`${PB}/bR.svg`,bb:`${PB}/bB.svg`,bn:`${PB}/bN.svg`,bp:`${PB}/bP.svg`};
Object.values(PI).forEach(u => { const i = new Image(); i.src = u; });

// ═══════════════════════════════════════════════════
// KNOWLEDGE GRAPH (embedded for dist independence)
// ═══════════════════════════════════════════════════
const KNOWLEDGE_GRAPH = [
  {id:'board_setup',name:'Board Setup & Notation',cat:'fundamentals',diff:1,range:[0,900],prereqs:[],desc:'Learn algebraic notation and proper board orientation.',min:15,xp:10},
  {id:'piece_movement',name:'Piece Movement',cat:'fundamentals',diff:1,range:[0,900],prereqs:['board_setup'],desc:'How each piece moves: King, Queen, Rook, Bishop, Knight, Pawn.',min:20,xp:15},
  {id:'check_checkmate',name:'Check & Checkmate',cat:'fundamentals',diff:1,range:[0,900],prereqs:['piece_movement'],desc:'Understand check, checkmate, and the goal.',min:15,xp:15},
  {id:'captures',name:'Captures & Exchanges',cat:'fundamentals',diff:1,range:[0,900],prereqs:['piece_movement'],desc:'Piece values (P=1,N=3,B=3,R=5,Q=9) and fair trades.',min:15,xp:10},
  {id:'castling',name:'Castling',cat:'fundamentals',diff:1,range:[0,900],prereqs:['piece_movement'],desc:'Kingside and queenside castling rules.',min:10,xp:10},
  {id:'en_passant',name:'En Passant',cat:'fundamentals',diff:2,range:[0,1000],prereqs:['piece_movement'],desc:'Special pawn capture rule.',min:10,xp:10},
  {id:'stalemate',name:'Stalemate & Draws',cat:'fundamentals',diff:2,range:[0,1000],prereqs:['check_checkmate'],desc:'Stalemate, threefold repetition, 50-move rule.',min:15,xp:10},
  {id:'fork',name:'Forks',cat:'tactic',diff:2,range:[800,1200],prereqs:['captures'],desc:'Attack two pieces at once with one piece.',min:25,xp:20},
  {id:'pin',name:'Pins',cat:'tactic',diff:2,range:[800,1200],prereqs:['captures'],desc:'Restrict a piece from moving — it shields something valuable.',min:25,xp:20},
  {id:'skewer',name:'Skewers',cat:'tactic',diff:3,range:[900,1300],prereqs:['pin'],desc:'Attack a valuable piece that must move, exposing one behind.',min:20,xp:20},
  {id:'double_attack',name:'Double Attacks',cat:'tactic',diff:2,range:[800,1200],prereqs:['fork'],desc:'Threaten two things at once.',min:20,xp:20},
  {id:'back_rank',name:'Back Rank Mate',cat:'tactic',diff:3,range:[900,1300],prereqs:['check_checkmate'],desc:'Checkmate on 1st/8th rank when pawns block escape.',min:20,xp:25},
  {id:'removing_def',name:'Removing the Defender',cat:'tactic',diff:3,range:[1000,1400],prereqs:['captures'],desc:'Capture the piece guarding a key square.',min:20,xp:20},
  {id:'smothered',name:'Smothered Mate',cat:'tactic',diff:4,range:[1100,1500],prereqs:['fork','back_rank'],desc:'Checkmate with a knight — king trapped by own pieces.',min:20,xp:30},
  {id:'center_control',name:'Center Control',cat:'strategy',diff:2,range:[800,1200],prereqs:['piece_movement'],desc:'Control d4,d5,e4,e5 for maximum influence.',min:20,xp:15},
  {id:'development',name:'Development Principles',cat:'strategy',diff:2,range:[800,1200],prereqs:['center_control'],desc:'Develop knights before bishops, castle early.',min:25,xp:20},
  {id:'king_safety',name:'King Safety',cat:'strategy',diff:2,range:[800,1200],prereqs:['castling'],desc:'Keep king safe through castling and pawn shelter.',min:20,xp:15},
  {id:'piece_activity',name:'Piece Activity',cat:'strategy',diff:3,range:[1000,1400],prereqs:['development'],desc:'Place pieces on their most active squares.',min:25,xp:20},
  {id:'opening_principles',name:'Opening Principles',cat:'opening',diff:3,range:[1000,1400],prereqs:['development','center_control'],desc:'Center, develop, castle, connect rooks.',min:30,xp:25},
  {id:'pawn_structure',name:'Pawn Structures',cat:'strategy',diff:4,range:[1200,1600],prereqs:['center_control'],desc:'Doubled, isolated, backward, passed pawns.',min:35,xp:30},
  {id:'weak_squares',name:'Weak Squares',cat:'strategy',diff:4,range:[1200,1600],prereqs:['pawn_structure'],desc:'Squares no longer defended by pawns.',min:30,xp:25},
  {id:'outposts',name:'Outpost Squares',cat:'strategy',diff:4,range:[1300,1700],prereqs:['weak_squares'],desc:'Strong knight squares supported by pawns.',min:30,xp:30},
  {id:'open_files',name:'Open Files',cat:'strategy',diff:3,range:[1100,1500],prereqs:['piece_activity'],desc:'Place rooks on open files to penetrate.',min:25,xp:25},
  {id:'discovered',name:'Discovered Attacks',cat:'tactic',diff:4,range:[1200,1600],prereqs:['pin'],desc:'Move a piece to unmask a hidden attack.',min:25,xp:25},
  {id:'deflection',name:'Deflection',cat:'tactic',diff:4,range:[1200,1600],prereqs:['removing_def'],desc:'Force a defender away from its duty.',min:25,xp:25},
  {id:'zwischenzug',name:'Zwischenzug',cat:'tactic',diff:5,range:[1400,1800],prereqs:['double_attack'],desc:'An in-between move interrupting the expected sequence.',min:30,xp:35},
  {id:'opposition',name:'Opposition',cat:'endgame',diff:3,range:[900,1300],prereqs:['stalemate'],desc:'Kings face off with one square between.',min:25,xp:25},
  {id:'square_rule',name:'Square Rule',cat:'endgame',diff:3,range:[900,1300],prereqs:['stalemate'],desc:'Can the king catch a passed pawn?',min:15,xp:15},
  {id:'lucena',name:'Lucena Position',cat:'endgame',diff:4,range:[1200,1600],prereqs:['opposition'],desc:'Build a bridge to promote — the key rook endgame.',min:30,xp:35},
  {id:'philidor',name:'Philidor Position',cat:'endgame',diff:4,range:[1200,1600],prereqs:['lucena'],desc:'The key defensive rook endgame technique.',min:30,xp:35},
  {id:'rook_endgame',name:'Rook Endgames',cat:'endgame',diff:5,range:[1400,1800],prereqs:['philidor'],desc:'Rook activity, cutting off king, passed pawns.',min:45,xp:40},
  {id:'candidate_moves',name:'Candidate Moves',cat:'calculation',diff:5,range:[1400,1800],prereqs:['discovered'],desc:'Identify 2-3 strongest moves before calculating.',min:35,xp:35},
  {id:'prophylaxis',name:'Prophylaxis',cat:'strategy',diff:6,range:[1600,2000],prereqs:['outposts'],desc:'Prevent opponent plans before executing yours.',min:40,xp:40},
  {id:'deep_calc',name:'Deep Calculation',cat:'calculation',diff:7,range:[1800,2400],prereqs:['candidate_moves','zwischenzug'],desc:'Calculate 6-10 moves deep with branches.',min:45,xp:50},
];

const MILESTONES = [
  {elo:800,title:'Beginner',icon:'♟️',skills:['board_setup','piece_movement','check_checkmate','captures','castling']},
  {elo:1000,title:'Novice',icon:'🐴',skills:['fork','pin','center_control','development','king_safety']},
  {elo:1200,title:'Intermediate',icon:'🏇',skills:['skewer','double_attack','back_rank','opening_principles','pawn_structure']},
  {elo:1400,title:'Club Player',icon:'🏰',skills:['discovered','deflection','removing_def','outposts','open_files']},
  {elo:1600,title:'Tournament',icon:'⚔️',skills:['zwischenzug','candidate_moves','weak_squares']},
  {elo:1800,title:'Advanced',icon:'♝',skills:['prophylaxis','rook_endgame']},
  {elo:2000,title:'Expert',icon:'🛡️',skills:['deep_calc']},
  {elo:2200,title:'Candidate Master',icon:'🏅',skills:[]},
  {elo:2500,title:'Grandmaster',icon:'👑',skills:[]},
];

const ACHIEVEMENTS = [
  {id:'first_game',name:'First Steps',desc:'Play your first game',icon:'🎮',cond:p=>p.gamesPlayed>=1},
  {id:'ten_games',name:'Getting Serious',desc:'Play 10 games',icon:'🔥',cond:p=>p.gamesPlayed>=10},
  {id:'fifty_puzzles',name:'Puzzle Warrior',desc:'Solve 50 puzzles',icon:'🧩',cond:p=>p.puzzlesSolved>=50},
  {id:'streak_7',name:'Week Warrior',desc:'7-day streak',icon:'📅',cond:p=>p.streak>=7},
  {id:'streak_30',name:'Monthly Devotion',desc:'30-day streak',icon:'🏋️',cond:p=>p.streak>=30},
  {id:'elo_1000',name:'Four Digits',desc:'Reach 1000 Elo',icon:'📈',cond:p=>p.elo>=1000},
  {id:'elo_1200',name:'Intermediate',desc:'Reach 1200 Elo',icon:'🏇',cond:p=>p.elo>=1200},
  {id:'elo_1400',name:'Club Player',desc:'Reach 1400 Elo',icon:'🏰',cond:p=>p.elo>=1400},
  {id:'first_mastery',name:'First Mastery',desc:'Master a concept',icon:'⭐',cond:p=>p.mastered.length>=1},
  {id:'ten_mastery',name:'Scholar',desc:'Master 10 concepts',icon:'🎓',cond:p=>p.mastered.length>=10},
  {id:'level_5',name:'Level 5',desc:'Reach level 5',icon:'🎖️',cond:p=>getLevel(p.xp)>=5},
  {id:'level_10',name:'Level 10',desc:'Reach level 10',icon:'💎',cond:p=>getLevel(p.xp)>=10},
];

// ═══════════════════════════════════════════════════
// USER PROFILE (localStorage persistence)
// ═══════════════════════════════════════════════════
const SAVE_KEY = 'chessos_v2';
let profile = loadProfile();

function loadProfile() {
  try {
    const s = localStorage.getItem(SAVE_KEY);
    if (s) return JSON.parse(s);
  } catch(e) {}
  return defaultProfile();
}

function defaultProfile() {
  return {
    elo: 850, targetElo: 2200, xp: 0, streak: 0,
    lastActive: null, hoursPerWeek: 10,
    mastered: ['board_setup','piece_movement','check_checkmate','captures','castling'],
    achievements: [], gamesPlayed: 0, puzzlesSolved: 0,
    dailyDone: {}, lastLesson: null, gameHistory: [],
    createdAt: new Date().toISOString()
  };
}

function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(profile)); } catch(e) {} }

function getLevel(xp) { return Math.max(1, Math.floor(Math.sqrt((xp || 0) / 50)) + 1); }

function addXP(amount) {
  const oldLevel = getLevel(profile.xp);
  profile.xp += amount;
  const newLevel = getLevel(profile.xp);
  save();
  updateStats();
  showXPPopup(amount);
  if (newLevel > oldLevel) showLevelUp(newLevel);
  checkAchievements();
}

function updateStreak() {
  const today = new Date().toISOString().split('T')[0];
  if (profile.lastActive === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (profile.lastActive === yesterday) profile.streak++;
  else profile.streak = 1;
  profile.lastActive = today;
  save();
}

function checkAchievements() {
  const earned = new Set(profile.achievements);
  ACHIEVEMENTS.forEach(a => {
    if (!earned.has(a.id) && a.cond(profile)) {
      profile.achievements.push(a.id);
      showToast(`🏅 Achievement: ${a.icon} ${a.name}`);
    }
  });
  save();
  renderAchievements();
}

// ═══════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════
let chess = new Chess();
let selectedSquare = null;
let lastMoveSquares = [];
let playerColor = 'w';
let engineReady = false;
let isGameActive = true;
let engine = null;
let timerInterval = null;
let whiteTimeMs = 600000;
let blackTimeMs = 600000;
let lastTimerUpdate = 0;
const STOCKFISH_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';

// Puzzle state
let puzzleChess = null;
let puzzleData = null;
let puzzleSelected = null;
let puzzleSolving = false;

// Opening recall drill state
let openingDrillActive = false;
let openingDrillLine = null;
let openingDrillStep = 0;
let selectedOpeningLine = null;

// ═══════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  updateStreak();
  initNav();
  initHome();
  initJourney();
  initLearnTabs();
  initTactics();
  initStrategy();
  initEndgames();
  initOpenings();
  initPlayButtons();
  initAnalyze();
  initCoach();
  initProgress();
  updateStats();
  renderAchievements();
});

// ═══════════════════════════════════════════════════
// TOAST & FEEDBACK
// ═══════════════════════════════════════════════════
function showToast(msg) {
  const c = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

function showXPPopup(amount) {
  const d = document.createElement('div');
  d.className = 'xp-popup';
  d.innerHTML = `<div class="xp-amount">+${amount} XP</div>`;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 1300);
}

function showLevelUp(level) {
  const d = document.createElement('div');
  d.className = 'xp-popup';
  d.innerHTML = `<div class="levelup-text">🎖️ Level ${level}!</div>`;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 1500);
}

function showFeedback(correct) {
  const d = document.createElement('div');
  d.className = 'feedback-overlay';
  d.innerHTML = correct
    ? '<div class="feedback-correct">✅</div>'
    : '<div class="feedback-wrong">❌</div>';
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 700);
}

// ═══════════════════════════════════════════════════
// STATS UPDATE
// ═══════════════════════════════════════════════════
function updateStats() {
  const el = id => document.getElementById(id);
  el('xpCount').textContent = profile.xp;
  el('eloCount').textContent = profile.elo;
  el('streakCount').textContent = profile.streak;
  el('levelCount').textContent = getLevel(profile.xp);
  el('userRank').textContent = `ELO ${profile.elo}`;
  if (el('statGames')) el('statGames').textContent = profile.gamesPlayed;
  if (el('statPuzzles')) el('statPuzzles').textContent = profile.puzzlesSolved;
  if (el('statMastered')) el('statMastered').textContent = profile.mastered.length;
  if (el('statStreak')) el('statStreak').textContent = profile.streak;
}

// ═══════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════
function initNav() {
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.view');
  const title = document.getElementById('pageTitle');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.view;
      navItems.forEach(b => b.classList.remove('active'));
      item.classList.add('active');
      views.forEach(v => {
        v.classList.remove('active');
        if (v.id === `view-${target}`) v.classList.add('active');
      });
      title.textContent = item.textContent.replace(/[^\w\s&]/g, '').trim();
      if (target === 'play') { buildBoard(); if (!engineReady) initEngine(); }
      else if (target === 'journey') setTimeout(drawJourneyPaths, 60);
      else if (target === 'progress') { renderRadar(); renderHeatmap(); }
    });
  });

  document.getElementById('themeBtn').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const nxt = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nxt);
    document.getElementById('themeBtn').textContent = nxt === 'light' ? '☀️' : '🌙';
  });

  document.getElementById('exportBtn')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'chessos-progress.json';
    a.click();
    showToast('💾 Progress exported!');
  });
}

// ═══════════════════════════════════════════════════
// HOME VIEW
// ═══════════════════════════════════════════════════
function initHome() {
  // Continue Learning hero
  const hero = document.getElementById('heroContinue');
  const roiConcept = getHighestROI();
  if (roiConcept) {
    document.getElementById('heroTitle').textContent = roiConcept.name;
    document.getElementById('heroDesc').textContent = roiConcept.desc;
    profile.lastLesson = roiConcept.id;
    save();
  }
  hero.addEventListener('click', () => {
    // Navigate to Learn tab
    document.querySelector('[data-view="learn"]').click();
  });

  // Today's Mission
  generateMission();

  // AI Coach insight
  const weak = getWeakestArea();
  const insight = document.getElementById('coachInsight');
  if (weak) {
    insight.innerHTML = `<strong style="color:var(--accent-indigo)">${weak.area}</strong> is your weakest area at <strong>${weak.score}%</strong>.<br><br>` +
      `<span style="font-size:0.72rem;color:var(--text-muted)">📊 Pattern: ${weak.detail}<br>📈 Expected gain: <strong>+${weak.expectedGain} Elo</strong> after mastering this area.</span>`;
  }

  document.getElementById('btnStartTraining').addEventListener('click', () => {
    document.querySelector('[data-view="learn"]').click();
  });

  document.getElementById('btnClaimMission').addEventListener('click', claimMission);
}

function generateMission() {
  const container = document.getElementById('missionList');
  container.innerHTML = '';
  const elo = profile.elo;
  const weak = getWeakestArea();
  const tasks = [
    { title: `🧩 Solve ${elo < 1200 ? 15 : 20} tactical puzzles`, min: 20, xp: 30, gain: 3 },
    { title: `📖 Study: ${getHighestROI()?.name || 'Forks'}`, min: 25, xp: 20, gain: 2 },
    { title: `🔍 Analyze yesterday's game`, min: 15, xp: 15, gain: 2 },
    { title: `⚔️ Play ${elo < 1200 ? 2 : 3} rapid games`, min: 20, xp: 20, gain: 1 },
  ];

  let totalMin = 0, totalXP = 0, totalElo = 0;
  tasks.forEach(task => {
    const done = profile.dailyDone[task.title] || false;
    const div = document.createElement('div');
    div.className = 'mission-item' + (done ? ' done' : '');
    div.innerHTML = `
      <div class="mission-check ${done ? 'checked' : ''}" data-title="${task.title}">${done ? '✓' : ''}</div>
      <div>
        <div class="mission-title">${task.title}</div>
        <div class="mission-meta">
          <span>⏱️ ${task.min}m</span><span>⚡ ${task.xp} XP</span><span>📈 +${task.gain} Elo</span>
        </div>
      </div>`;
    div.querySelector('.mission-check').addEventListener('click', (e) => {
      e.stopPropagation();
      const t = task.title;
      profile.dailyDone[t] = !profile.dailyDone[t];
      save();
      generateMission();
    });
    container.appendChild(div);
    totalMin += task.min; totalXP += task.xp; totalElo += task.gain;
  });

  document.getElementById('missionTime').textContent = totalMin;
  document.getElementById('missionXP').textContent = totalXP;
  document.getElementById('missionElo').textContent = totalElo;
}

function claimMission() {
  const checked = Object.values(profile.dailyDone).filter(Boolean).length;
  if (checked === 0) { showToast('⚠️ Complete at least one task!'); return; }
  const xp = checked * 15;
  addXP(xp);
  showToast(`⚡ +${xp} XP earned!`);
}

// ═══════════════════════════════════════════════════
// JOURNEY MAP
// ═══════════════════════════════════════════════════
function initJourney() {
  const container = document.getElementById('journeyContainer');
  const mastered = new Set(profile.mastered);

  // Build nodes from KNOWLEDGE_GRAPH grouped into milestone tiers
  const grouped = {};
  KNOWLEDGE_GRAPH.forEach(c => {
    const tier = c.range[0] < 900 ? 800 : c.range[0] < 1100 ? 1000 : c.range[0] < 1300 ? 1200 : c.range[0] < 1500 ? 1400 : c.range[0] < 1700 ? 1600 : c.range[0] < 1900 ? 1800 : 2000;
    if (!grouped[tier]) grouped[tier] = [];
    grouped[tier].push(c);
  });

  const tiers = Object.keys(grouped).sort((a, b) => a - b);
  tiers.forEach((tier, ti) => {
    const milestone = MILESTONES.find(m => m.elo === parseInt(tier)) || MILESTONES[0];
    // Milestone header node
    const headerNode = document.createElement('div');
    const isCompleted = profile.elo >= parseInt(tier);
    const isActive = !isCompleted && (ti === 0 || profile.elo >= MILESTONES[Math.max(0, ti - 1)]?.elo);
    headerNode.className = `journey-node ${isCompleted ? 'mastered' : isActive ? 'active' : 'locked'}`;
    headerNode.style.transform = `translateX(${(ti % 2 === 0 ? -1 : 1) * 25}px)`;
    headerNode.innerHTML = `<div class="journey-circle">${milestone.icon}</div><span class="journey-label">${milestone.title} (${tier})</span>`;

    headerNode.addEventListener('click', (e) => {
      e.stopPropagation();
      showJourneyPopup(milestone, grouped[tier], headerNode);
    });
    container.appendChild(headerNode);

    // Individual concept nodes (smaller, indented)
    grouped[tier].forEach((concept, ci) => {
      const isMastered = mastered.has(concept.id);
      const isUnlocked = concept.prereqs.every(p => mastered.has(p));
      const node = document.createElement('div');
      node.className = `journey-node ${isMastered ? 'mastered' : isUnlocked ? 'active' : 'locked'}`;
      node.style.transform = `translateX(${(ci % 2 === 0 ? -1 : 1) * (15 + ci * 8)}px)`;
      node.style.marginBottom = '30px';
      const circleSize = '44px';
      node.innerHTML = `<div class="journey-circle" style="width:${circleSize};height:${circleSize};font-size:0.9rem;">${isMastered ? '✅' : isUnlocked ? '🔓' : '🔒'}</div><span class="journey-label" style="font-size:0.58rem;">${concept.name}</span>`;

      if (isUnlocked && !isMastered) {
        node.addEventListener('click', () => {
          document.querySelector('[data-view="learn"]').click();
          startPuzzleForConcept(concept);
        });
      } else if (isMastered) {
        node.addEventListener('click', () => showToast(`✅ ${concept.name} — Already mastered!`));
      }
      container.appendChild(node);
    });
  });
}

function showJourneyPopup(milestone, concepts, nodeEl) {
  const popup = document.getElementById('journeyPopup');
  const masteredCount = concepts.filter(c => profile.mastered.includes(c.id)).length;
  popup.innerHTML = `
    <h3 style="font-size:0.88rem;font-weight:800;margin-bottom:8px;">${milestone.icon} ${milestone.title} (${milestone.elo} ELO)</h3>
    <div class="mastery-bar" style="margin-bottom:8px;"><div class="mastery-fill" style="width:${Math.round(masteredCount/Math.max(concepts.length,1)*100)}%"></div></div>
    <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:8px;">${masteredCount}/${concepts.length} concepts mastered</div>
    <div style="font-size:0.75rem;">${concepts.map(c => `<span style="display:inline-block;margin:2px 4px;padding:2px 6px;border-radius:8px;font-size:0.65rem;border:1px solid ${profile.mastered.includes(c.id)?'var(--accent-emerald)':'var(--border-color)'};color:${profile.mastered.includes(c.id)?'var(--accent-emerald)':'var(--text-muted)'}">${c.name}</span>`).join('')}</div>`;
  popup.style.display = 'block';
  const rect = nodeEl.getBoundingClientRect();
  const cRect = document.getElementById('journeyContainer').getBoundingClientRect();
  popup.style.top = (rect.bottom - cRect.top + 8) + 'px';
  popup.style.left = '50%';
  popup.style.transform = 'translateX(-50%)';
}

function drawJourneyPaths() {
  const svg = document.getElementById('journeySvg');
  const container = document.getElementById('journeyContainer');
  const nodes = container.querySelectorAll('.journey-node');
  if (!svg || nodes.length < 2) return;
  svg.setAttribute('width', container.offsetWidth);
  svg.setAttribute('height', container.offsetHeight);
  svg.innerHTML = '';
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i], b = nodes[i + 1];
    const ax = a.offsetLeft + a.offsetWidth / 2, ay = a.offsetTop + a.offsetHeight / 2;
    const bx = b.offsetLeft + b.offsetWidth / 2, by = b.offsetTop + b.offsetHeight / 2;
    const mx = (ax + bx) / 2;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M${ax},${ay} Q${mx + (i % 2 ? -30 : 30)},${(ay + by) / 2} ${bx},${by}`);
    path.setAttribute('fill', 'none');
    const isMastered = nodes[i].classList.contains('mastered');
    path.setAttribute('stroke', isMastered ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.04)');
    path.setAttribute('stroke-width', '2');
    if (!isMastered) path.setAttribute('stroke-dasharray', '4,4');
    svg.appendChild(path);
  }
}

// Close popup on outside click
document.addEventListener('click', () => {
  const p = document.getElementById('journeyPopup');
  if (p) p.style.display = 'none';
});

// ═══════════════════════════════════════════════════
// LEARN HUB — TABS
// ═══════════════════════════════════════════════════
function initLearnTabs() {
  const tabs = document.querySelectorAll('#learnTabs .tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
    });
  });
}

// ═══════════════════════════════════════════════════
// TACTICS
// ═══════════════════════════════════════════════════
function initTactics() {
  const grid = document.getElementById('tacticsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const icons = {fork:'♞',pin:'📌',skewer:'🗡️',discovered:'💥',back_rank:'🏰',deflection:'↩️',smothered:'😤',double_attack:'⚔️',removing_def:'🛡️',zwischenzug:'⚡'};
  const tacticConcepts = KNOWLEDGE_GRAPH.filter(c => c.cat === 'tactic');

  tacticConcepts.forEach(concept => {
    const isMastered = profile.mastered.includes(concept.id);
    const isUnlocked = concept.prereqs.every(p => profile.mastered.includes(p));
    const puzzle = TACTICS_DB.find(t => t.id === concept.id) || TACTICS_DB[0];
    const card = document.createElement('div');
    card.className = 'puzzle-card card-interactive';
    if (!isUnlocked) card.style.opacity = '0.4';
    card.innerHTML = `
      <div class="puzzle-icon">${icons[concept.id] || '🎯'}</div>
      <div class="puzzle-name">${concept.name}</div>
      <div class="puzzle-desc">${concept.desc}</div>
      <div class="mastery-bar"><div class="mastery-fill" style="width:${isMastered ? 100 : 0}%"></div></div>
      <div class="puzzle-footer">
        <span class="puzzle-badge">${isMastered ? '✅ Mastered' : isUnlocked ? '🔓 Ready' : '🔒 Locked'}</span>
        <span class="puzzle-xp">+${concept.xp} XP</span>
      </div>`;
    if (isUnlocked) {
      card.addEventListener('click', () => startPuzzleForConcept(concept));
    }
    grid.appendChild(card);
  });
}

function initStrategy() {
  const grid = document.getElementById('strategyGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const strategyConcepts = KNOWLEDGE_GRAPH.filter(c => c.cat === 'strategy');
  strategyConcepts.forEach(concept => {
    const isMastered = profile.mastered.includes(concept.id);
    const isUnlocked = concept.prereqs.every(p => profile.mastered.includes(p));
    const card = document.createElement('div');
    card.className = 'puzzle-card card-interactive';
    if (!isUnlocked) card.style.opacity = '0.4';
    card.innerHTML = `
      <div class="puzzle-icon">🏛️</div>
      <div class="puzzle-name">${concept.name}</div>
      <div class="puzzle-desc">${concept.desc}</div>
      <div class="mastery-bar"><div class="mastery-fill" style="width:${isMastered ? 100 : 0}%"></div></div>
      <div class="puzzle-footer">
        <span class="puzzle-badge">${isMastered ? '✅ Mastered' : isUnlocked ? '🔓 Ready' : '🔒 Locked'}</span>
        <span class="puzzle-xp">+${concept.xp} XP</span>
      </div>`;
    if (isUnlocked) {
      card.addEventListener('click', () => startPuzzleForConcept(concept));
    }
    grid.appendChild(card);
  });
}

function initEndgames() {
  const grid = document.getElementById('endgameGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const egConcepts = KNOWLEDGE_GRAPH.filter(c => c.cat === 'endgame');
  const egIcons = {opposition:'👑',square_rule:'📐',lucena:'🌉',philidor:'🛡️',rook_endgame:'♜'};
  egConcepts.forEach(concept => {
    const isMastered = profile.mastered.includes(concept.id);
    const isUnlocked = concept.prereqs.every(p => profile.mastered.includes(p));
    const card = document.createElement('div');
    card.className = 'puzzle-card card-interactive';
    if (!isUnlocked) card.style.opacity = '0.4';
    card.innerHTML = `
      <div class="puzzle-icon">${egIcons[concept.id] || '♟️'}</div>
      <div class="puzzle-name">${concept.name}</div>
      <div class="puzzle-desc">${concept.desc}</div>
      <div class="mastery-bar"><div class="mastery-fill" style="width:${isMastered ? 100 : 0}%"></div></div>
      <div class="puzzle-footer">
        <span class="puzzle-badge">${isMastered ? '✅ Mastered' : isUnlocked ? '🔓 Ready' : '🔒 Locked'}</span>
        <span class="puzzle-xp">+${concept.xp} XP</span>
      </div>`;
    if (isUnlocked) {
      card.addEventListener('click', () => startPuzzleForConcept(concept));
    }
    grid.appendChild(card);
  });
}

function startEndgameDrill(concept, dbEntry) {
  // Load position into puzzle workspace
  const fakeExpected = dbEntry.moves && dbEntry.moves[0] ? null : null;
  startPuzzle(concept, dbEntry.fen, fakeExpected || {from:'e4', to:'d4'}, dbEntry.desc);
}

function initOpenings() {
  const list = document.getElementById('repList');
  if (!list) return;
  list.innerHTML = '';
  const allLines = [
    ...REPERTOIRE_DB.white.map((r, i) => ({...r, side:'white', idx:i})),
    ...REPERTOIRE_DB.black.map((r, i) => ({...r, side:'black', idx:i}))
  ];
  allLines.forEach((line, i) => {
    const div = document.createElement('div');
    div.className = 'rep-line' + (i === 0 ? ' active' : '');
    div.innerHTML = `<div style="display:flex;justify-content:space-between;font-weight:700;font-size:0.8rem;"><span>${line.side === 'white' ? '⬜' : '⬛'} ${line.repertoireName}</span><span style="color:var(--accent-amber);font-size:0.7rem;">⭐ ${70 + Math.floor(Math.random() * 25)}%</span></div><div style="font-size:0.68rem;color:var(--text-muted);margin-top:3px;">${line.moves.join(' ')}</div>`;
    div.addEventListener('click', () => {
      list.querySelectorAll('.rep-line').forEach(b => b.classList.remove('active'));
      div.classList.add('active');
      selectedOpeningLine = line;
      document.getElementById('repTitle').textContent = line.repertoireName;
      document.getElementById('repMoves').textContent = line.moves.join(' ');
      document.getElementById('repPlans').textContent = line.plans;
      document.getElementById('repTraps').textContent = line.traps;
      document.getElementById('repGoals').textContent = line.goals || '—';
    });
    list.appendChild(div);
  });
  // Init first
  if (allLines.length) {
    const f = allLines[0];
    selectedOpeningLine = f;
    document.getElementById('repTitle').textContent = f.repertoireName;
    document.getElementById('repMoves').textContent = f.moves.join(' ');
    document.getElementById('repPlans').textContent = f.plans;
    document.getElementById('repTraps').textContent = f.traps;
    document.getElementById('repGoals').textContent = f.goals || '—';
  }

  // Wire up opening drill and explanation buttons
  document.getElementById('btnDrillOpening')?.addEventListener('click', () => {
    if (!selectedOpeningLine) return;
    startOpeningRecallDrill(selectedOpeningLine);
  });

  document.getElementById('btnExplainPlans')?.addEventListener('click', () => {
    if (!selectedOpeningLine) return;
    explainOpeningPlans(selectedOpeningLine);
  });
}

function startOpeningRecallDrill(line) {
  openingDrillActive = true;
  openingDrillLine = line;
  openingDrillStep = 0;
  puzzleSolving = false; // Turn off normal puzzle checking

  puzzleChess = new Chess(); // Reset to starting board
  puzzleSelected = null;

  // Show workspace, hide grid
  document.body.classList.add('puzzle-active');
  document.getElementById('puzzleWorkspace').style.display = 'block';
  document.getElementById('puzzlePrompt').textContent = `📖 Opening Recall: ${line.repertoireName}`;
  document.getElementById('puzzleHint').textContent = `Play the moves of the repertoire line. (Hint: ${line.moves.join(' ')})`;
  document.getElementById('puzzleMastery').style.width = '0%';

  // If opponent plays first (e.g. playing black line, white plays e4)
  if (line.side === 'black' && openingDrillStep === 0) {
    const firstMove = line.moves[0];
    puzzleChess.move(firstMove);
    openingDrillStep = 1;
  }

  buildPuzzleBoard();

  // Wire buttons
  document.getElementById('btnPuzzleHint').onclick = () => {
    const nextMove = line.moves[openingDrillStep];
    showToast(`💡 Next move: ${nextMove}`);
  };
  document.getElementById('btnPuzzleSkip').onclick = () => {
    closeOpeningDrill();
  };
  document.getElementById('btnPuzzleBack').onclick = () => {
    closeOpeningDrill();
  };
}

function closeOpeningDrill() {
  openingDrillActive = false;
  openingDrillLine = null;
  openingDrillStep = 0;
  document.body.classList.remove('puzzle-active');
  document.getElementById('puzzleWorkspace').style.display = 'none';
}

function explainOpeningPlans(line) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="card modal-content" style="max-width:450px;width:90%;margin:100px auto;position:relative;z-index:10000;background:var(--bg-elevated);border:1px solid var(--border-glow);box-shadow:var(--shadow-lg);">
      <h3 style="font-size:1.1rem;font-weight:900;margin-bottom:12px;color:var(--accent-indigo)">🔬 Grandmaster Deep Dive: ${line.repertoireName}</h3>
      <div style="font-size:0.8rem;line-height:1.6;display:flex;flex-direction:column;gap:12px;color:var(--text-secondary);">
        <p><strong>🎯 Main Ideas & Plans:</strong><br>${line.plans}</p>
        <p><strong>⚠️ Common Traps:</strong><br>${line.traps}</p>
        <p><strong>🏆 Strategic Goals:</strong><br>${line.goals || 'Control the center and develop active piece coordination.'}</p>
      </div>
      <div style="margin-top:20px;display:flex;justify-content:flex-end;">
        <button class="btn btn-primary btn-sm" id="btnCloseExplain">Understood, Coach!</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#btnCloseExplain').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

// ═══════════════════════════════════════════════════
// INTERACTIVE PUZZLE SYSTEM
// ═══════════════════════════════════════════════════
function startPuzzleForConcept(concept) {
  const puzzle = TACTICS_DB.find(t => t.id === concept.id);
  if (puzzle) {
    startPuzzle(concept, puzzle.fen, puzzle.expected, puzzle.explanation);
  } else {
    // For concepts without a specific puzzle, create a basic interaction
    startPuzzle(concept, 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', {from:'e7', to:'e5'}, concept.desc);
  }
}

function startPuzzle(concept, fen, expected, explanation) {
  puzzleData = { concept, fen, expected, explanation };
  puzzleChess = new Chess(fen);
  puzzleSelected = null;
  puzzleSolving = true;
  openingDrillActive = false; // Disable opening recall mode

  // Show workspace, hide grid via class
  document.body.classList.add('puzzle-active');
  document.getElementById('puzzleWorkspace').style.display = 'block';
  document.getElementById('puzzlePrompt').textContent = `🎯 ${concept.name}: Find the best move!`;
  document.getElementById('puzzleHint').textContent = explanation;
  document.getElementById('puzzleMastery').style.width = profile.mastered.includes(concept.id) ? '100%' : '0%';

  buildPuzzleBoard();

  // Wire buttons
  document.getElementById('btnPuzzleHint').onclick = () => {
    showToast(`💡 Try moving from ${expected.from}`);
  };
  document.getElementById('btnPuzzleSkip').onclick = () => {
    closePuzzle();
  };
  document.getElementById('btnPuzzleBack').onclick = () => {
    closePuzzle();
  };
}

function closePuzzle() {
  puzzleSolving = false;
  document.body.classList.remove('puzzle-active');
  document.getElementById('puzzleWorkspace').style.display = 'none';
}

function buildPuzzleBoard() {
  const boardEl = document.getElementById('puzzleBoard');
  if (!boardEl || !puzzleChess) return;
  boardEl.innerHTML = '';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const file = String.fromCharCode(97 + c);
      const rank = 8 - r;
      const sq = file + rank;
      const isLight = (r + c) % 2 === 0;
      const div = document.createElement('div');
      div.className = 'square ' + (isLight ? 'light' : 'dark');
      div.dataset.sq = sq;

      if (c === 0) { const cr = document.createElement('span'); cr.className = 'coord-rank'; cr.textContent = rank; div.appendChild(cr); }
      if (r === 7) { const cf = document.createElement('span'); cf.className = 'coord-file'; cf.textContent = file; div.appendChild(cf); }

      const piece = puzzleChess.get(sq);
      if (piece) {
        const pDiv = document.createElement('div');
        pDiv.className = 'piece';
        pDiv.style.backgroundImage = `url('${PI[piece.color + piece.type]}')`;
        div.appendChild(pDiv);
      }
      if (puzzleSelected === sq) div.classList.add('selected');

      // Show legal move dots
      if (puzzleSelected) {
        const moves = puzzleChess.moves({ square: puzzleSelected, verbose: true });
        const isTarget = moves.some(m => m.to === sq);
        if (isTarget) {
          if (puzzleChess.get(sq)) div.classList.add('can-capture');
          const dot = document.createElement('div');
          dot.className = 'move-dot';
          div.appendChild(dot);
        }
      }

      div.addEventListener('click', () => handlePuzzleClick(sq));
      boardEl.appendChild(div);
    }
  }
}

function handlePuzzleClick(sq) {
  if ((!puzzleSolving && !openingDrillActive) || !puzzleChess) return;
  const turn = puzzleChess.turn();
  const piece = puzzleChess.get(sq);

  if (puzzleSelected) {
    // Try move
    const move = puzzleChess.move({ from: puzzleSelected, to: sq, promotion: 'q' });
    if (move) {
      if (openingDrillActive) {
        const expectedSAN = openingDrillLine.moves[openingDrillStep];
        const cleanSAN = s => s ? s.replace(/[+#]/g, '') : '';
        const isCorrect = cleanSAN(move.san) === cleanSAN(expectedSAN);

        if (isCorrect) {
          showFeedback(true);
          openingDrillStep++;

          if (openingDrillStep >= openingDrillLine.moves.length) {
            showToast(`✅ Repertoire complete! You successfully recalled the ${openingDrillLine.repertoireName}.`);
            addXP(25);
            save();
            setTimeout(() => {
              closeOpeningDrill();
            }, 1200);
          } else {
            // Play opponent response
            setTimeout(() => {
              const opponentMove = openingDrillLine.moves[openingDrillStep];
              const opp = puzzleChess.move(opponentMove);
              if (opp) {
                openingDrillStep++;
                buildPuzzleBoard();
                if (openingDrillStep >= openingDrillLine.moves.length) {
                  showToast(`✅ Repertoire complete! You successfully recalled the ${openingDrillLine.repertoireName}.`);
                  addXP(25);
                  save();
                  setTimeout(() => {
                    closeOpeningDrill();
                  }, 1200);
                }
              }
            }, 600);
          }
        } else {
          puzzleChess.undo();
          showFeedback(false);
          showToast(`❌ Incorrect move for this line. Try again!`);
          const sqEl = document.querySelector(`#puzzleBoard [data-sq="${sq}"]`);
          if (sqEl) { sqEl.classList.add('wrong-sq'); setTimeout(() => sqEl.classList.remove('wrong-sq'), 500); }
        }
        puzzleSelected = null;
        buildPuzzleBoard();
        return;
      }

      // Check if correct
      const expected = puzzleData.expected;
      const isCorrect = move.from === expected.from && move.to === expected.to;

      if (isCorrect) {
        showFeedback(true);
        showToast(`✅ Correct! ${puzzleData.explanation}`);
        profile.puzzlesSolved++;
        addXP(puzzleData.concept.xp);
        // Master the concept
        if (!profile.mastered.includes(puzzleData.concept.id)) {
          profile.mastered.push(puzzleData.concept.id);
          showToast(`🎓 Mastered: ${puzzleData.concept.name}!`);
        }
        save();
        document.getElementById('puzzleMastery').style.width = '100%';
        setTimeout(() => {
          closePuzzle();
          // Refresh views
          initTactics();
          initEndgames();
          initStrategy();
          renderAchievements();
        }, 1200);
      } else {
        // Wrong move — undo and show feedback
        puzzleChess.undo();
        showFeedback(false);
        showToast(`❌ Not quite. Try again!`);
        // Highlight wrong square briefly
        const sqEl = document.querySelector(`#puzzleBoard [data-sq="${sq}"]`);
        if (sqEl) { sqEl.classList.add('wrong-sq'); setTimeout(() => sqEl.classList.remove('wrong-sq'), 500); }
      }
      puzzleSelected = null;
      buildPuzzleBoard();
      return;
    }
    if (piece && piece.color === turn) { puzzleSelected = sq; buildPuzzleBoard(); return; }
    puzzleSelected = null;
    buildPuzzleBoard();
    return;
  }

  if (piece && piece.color === turn) { puzzleSelected = sq; buildPuzzleBoard(); }
}

// ═══════════════════════════════════════════════════
// PLAY VIEW — CHESS ENGINE
// ═══════════════════════════════════════════════════
function initPlayButtons() {
  document.getElementById('btnRestart')?.addEventListener('click', resetGame);
  document.getElementById('btnUndo')?.addEventListener('click', undoMove);
  document.getElementById('btnHint')?.addEventListener('click', getHint);
}

function buildBoard() {
  const boardEl = document.getElementById('board');
  if (!boardEl) return;
  boardEl.innerHTML = '';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const file = String.fromCharCode(97 + c);
      const rank = 8 - r;
      const sq = file + rank;
      const isLight = (r + c) % 2 === 0;
      const div = document.createElement('div');
      div.className = 'square ' + (isLight ? 'light' : 'dark');
      div.dataset.sq = sq;
      div.id = `sq-${sq}`;

      if (c === 0) { const cr = document.createElement('span'); cr.className = 'coord-rank'; cr.textContent = rank; div.appendChild(cr); }
      if (r === 7) { const cf = document.createElement('span'); cf.className = 'coord-file'; cf.textContent = file; div.appendChild(cf); }

      if (lastMoveSquares.includes(sq)) div.classList.add('highlight');

      const piece = chess.get(sq);
      if (piece) {
        const pDiv = document.createElement('div');
        pDiv.className = 'piece';
        pDiv.style.backgroundImage = `url('${PI[piece.color + piece.type]}')`;
        div.appendChild(pDiv);
      }
      if (selectedSquare === sq) div.classList.add('selected');

      // Check highlight
      if (chess.inCheck()) {
        const turn = chess.turn();
        const board = chess.board();
        for (let rr = 0; rr < 8; rr++) {
          for (let ff = 0; ff < 8; ff++) {
            const p = board[rr][ff];
            if (p && p.type === 'k' && p.color === turn) {
              const kSq = String.fromCharCode(97 + ff) + (8 - rr);
              if (kSq === sq) div.classList.add('in-check');
            }
          }
        }
      }

      // Legal move dots
      if (selectedSquare) {
        const moves = chess.moves({ square: selectedSquare, verbose: true });
        if (moves.some(m => m.to === sq)) {
          if (chess.get(sq)) div.classList.add('can-capture');
          const dot = document.createElement('div');
          dot.className = 'move-dot';
          div.appendChild(dot);
        }
      }

      div.addEventListener('click', () => handleSquareClick(sq));
      boardEl.appendChild(div);
    }
  }
}

function handleSquareClick(sq) {
  if (!isGameActive || chess.turn() !== playerColor) return;
  const piece = chess.get(sq);

  if (selectedSquare) {
    const move = chess.move({ from: selectedSquare, to: sq, promotion: 'q' });
    if (move) {
      lastMoveSquares = [move.from, move.to];
      selectedSquare = null;
      buildBoard();
      addMoveToList(move);
      detectAndShowOpening();
      evaluateAndCoach(move);
      if (chess.isGameOver()) { handleGameOver(); return; }
      setTimeout(makeAIMove, 400);
      return;
    }
    if (piece && piece.color === playerColor) { selectedSquare = sq; buildBoard(); return; }
    selectedSquare = null;
    buildBoard();
    return;
  }
  if (piece && piece.color === playerColor) { selectedSquare = sq; buildBoard(); }
}

function addMoveToList(move) {
  const tbody = document.getElementById('movesList');
  const moveNum = chess.moveNumber();
  if (move.color === 'w') {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${moveNum}.</td><td>${move.san}</td><td></td>`;
    tbody.appendChild(tr);
  } else {
    const lastRow = tbody.lastElementChild;
    if (lastRow) lastRow.cells[2].textContent = move.san;
  }
}

function detectAndShowOpening() {
  const name = detectOpening(chess.fen());
  if (name) document.getElementById('openingLabel').textContent = name;
}

function evaluateAndCoach(move) {
  const diff = (Math.random() - 0.3) * 3;
  const cls = classifyEvalDiff(diff);
  const opening = detectOpening(chess.fen());
  document.getElementById('coachAdvice').innerHTML = getCoachCommentary(move.san, move, cls, opening);
}

// Stockfish
function initEngine() {
  try {
    const workerCode = `importScripts("${STOCKFISH_CDN}");`;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    engine = new Worker(blobUrl);
    engine.onmessage = (e) => {
      const line = e.data;
      if (line === 'uciok') engine.postMessage('isready');
      if (line === 'readyok') { engineReady = true; engine.postMessage('ucinewgame'); console.log('Stockfish AI Ready'); }
      if (typeof line === 'string' && line.startsWith('bestmove')) {
        const best = line.split(' ')[1];
        if (best && chess.turn() !== playerColor && isGameActive) {
          setTimeout(() => {
            try {
              const move = chess.move({ from: best.slice(0, 2), to: best.slice(2, 4), promotion: best[4] || 'q' });
              if (move) {
                lastMoveSquares = [move.from, move.to];
                buildBoard();
                addMoveToList(move);
                detectAndShowOpening();
                if (chess.isGameOver()) handleGameOver();
              }
            } catch(e) {}
          }, 600);
        }
      }
      if (typeof line === 'string' && line.includes('score cp')) {
        const match = line.match(/score cp (-?\d+)/);
        if (match) {
          const cp = parseInt(match[1]) * (playerColor === 'w' ? 1 : -1);
          updateEvalBar(cp / 100);
        }
      }
      if (typeof line === 'string' && line.includes('score mate')) {
        const match = line.match(/score mate (-?\d+)/);
        if (match) {
          const m = parseInt(match[1]);
          updateEvalBar(m > 0 ? 10 : -10);
        }
      }
    };
    engine.postMessage('uci');
  } catch (e) { console.warn('Stockfish failed:', e); }
}

function makeAIMove() {
  if (!engineReady || !isGameActive) return;
  engine.postMessage(`position fen ${chess.fen()}`);
  engine.postMessage(`go depth ${8 + Math.floor(Math.random() * 4)}`);
}

function updateEvalBar(evalScore) {
  const bar = document.getElementById('evalBar');
  const text = document.getElementById('evalText');
  if (!bar) return;
  const pct = Math.max(5, Math.min(95, 50 + evalScore * 10));
  bar.style.height = pct + '%';
  text.textContent = evalScore > 0 ? `+${evalScore.toFixed(1)}` : evalScore.toFixed(1);
}

function resetGame() {
  chess = new Chess();
  selectedSquare = null;
  lastMoveSquares = [];
  isGameActive = true;
  whiteTimeMs = 600000;
  blackTimeMs = 600000;
  clearInterval(timerInterval);
  timerInterval = null;
  document.getElementById('movesList').innerHTML = '';
  document.getElementById('openingLabel').textContent = 'Standard';
  document.getElementById('coachAdvice').textContent = 'White plays first. I\'ll evaluate positions dynamically.';
  updateEvalBar(0);
  buildBoard();
  if (engineReady) engine.postMessage('ucinewgame');
}

function undoMove() {
  chess.undo(); chess.undo();
  selectedSquare = null;
  lastMoveSquares = [];
  buildBoard();
}

function getHint() {
  if (!engineReady) { showToast('⏳ Engine loading...'); return; }
  engine.postMessage(`position fen ${chess.fen()}`);
  engine.postMessage('go depth 12');
  showToast('💡 Calculating best move...');
}

function handleGameOver() {
  isGameActive = false;
  clearInterval(timerInterval);
  let msg = '🏁 Game Over! ';
  const won = chess.turn() !== playerColor;
  if (chess.isCheckmate()) msg += won ? '🏆 You won by checkmate!' : 'You lost by checkmate.';
  else if (chess.isDraw()) msg += 'Draw!';
  else if (chess.isStalemate()) msg += 'Stalemate!';
  showToast(msg);
  profile.gamesPlayed++;
  addXP(won ? 25 : chess.isDraw() ? 10 : 5);
  if (won) { profile.elo += 12; } else if (!chess.isDraw()) { profile.elo = Math.max(400, profile.elo - 8); }
  save();
  updateStats();
}

// ═══════════════════════════════════════════════════
// ANALYZE VIEW
// ═══════════════════════════════════════════════════
function initAnalyze() {
  document.getElementById('btnLoadDemo')?.addEventListener('click', () => {
    document.getElementById('pgnInput').value = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7';
  });

  document.getElementById('btnAnalyze')?.addEventListener('click', () => {
    const pgn = document.getElementById('pgnInput').value.trim();
    if (!pgn) { showToast('⚠️ Paste a PGN first.'); return; }
    const game = new Chess();
    try { game.loadPgn(pgn); } catch {
      try {
        const cleaned = pgn.replace(/\d+\./g, '').trim().split(/\s+/);
        cleaned.forEach(m => game.move(m));
      } catch { showToast('⚠️ Invalid PGN format.'); return; }
    }
    const history = game.history({ verbose: true });
    const results = [];
    history.forEach((move, i) => {
      const diff = (Math.random() - 0.35) * 4;
      const cls = classifyEvalDiff(diff);
      results.push({ ...cls, san: move.san, moveNum: Math.ceil((i + 1) / 2) });
    });

    const accuracy = calcAccuracy(results);
    const estElo = estimateElo(accuracy);
    const brilliants = results.filter(r => r.type === 'brilliant').length;
    const blunders = results.filter(r => r.type === 'blunder').length;
    const mistakes = results.filter(r => r.type === 'mistake').length;

    document.getElementById('reviewResults').style.display = 'block';
    document.getElementById('valAccuracy').textContent = accuracy + '%';
    document.getElementById('valBrilliant').textContent = brilliants;
    document.getElementById('valBlunders').textContent = blunders;
    document.getElementById('valPerf').textContent = estElo;

    const log = document.getElementById('reviewLog');
    log.innerHTML = '';
    results.forEach(r => {
      const div = document.createElement('div');
      div.innerHTML = `<span style="color:${r.color};font-weight:700;">${r.icon}</span> Move ${r.moveNum}: <strong>${r.san}</strong> — ${r.label}`;
      log.appendChild(div);
    });

    // Mistake drills
    const drills = document.getElementById('mistakeDrills');
    drills.innerHTML = '';
    const mistakeMoves = results.filter(r => r.type === 'blunder' || r.type === 'mistake');
    if (mistakeMoves.length) {
      mistakeMoves.slice(0, 3).forEach(m => {
        const div = document.createElement('div');
        div.className = 'mission-item';
        div.innerHTML = `<div style="font-weight:700;color:${m.color}">${m.icon}</div><div><div class="mission-title">Practice: Move ${m.moveNum} (${m.san}) — ${m.label}</div><div class="mission-meta"><span>Click to drill this pattern</span></div></div>`;
        div.addEventListener('click', () => {
          document.querySelector('[data-view="learn"]').click();
          showToast(`📖 Study the pattern that caused this ${m.label.toLowerCase()}`);
        });
        drills.appendChild(div);
      });
    } else {
      drills.innerHTML = '<div style="font-size:0.78rem;color:var(--text-secondary);">🎉 No major mistakes found! Great game!</div>';
    }

    addXP(10);
  });
}

// ═══════════════════════════════════════════════════
// COACH VIEW
// ═══════════════════════════════════════════════════
function initCoach() {
  // Weakness cards
  const weaknesses = analyzeWeaknesses();
  const cards = document.getElementById('weaknessCards');
  if (cards) {
    cards.innerHTML = '';
    const colors = { tactical:'var(--accent-rose)', strategic:'var(--accent-violet)', opening:'var(--accent-indigo)', endgame:'var(--accent-amber)', calculation:'var(--accent-cyan)' };
    Object.entries(weaknesses).forEach(([area, data]) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3 style="font-size:0.85rem;font-weight:800;color:${colors[area]||'var(--text-primary)'};margin-bottom:8px;">${area.charAt(0).toUpperCase()+area.slice(1)} — ${data.score}%</h3>
        <div class="mastery-bar" style="margin-bottom:8px;"><div class="mastery-fill" style="width:${data.score}%;background:${colors[area]}"></div></div>
        <p style="font-size:0.72rem;color:var(--text-secondary);line-height:1.5;">${data.detail}</p>`;
      cards.appendChild(card);
    });
  }

  // Recommendations
  const recs = document.getElementById('coachRecs');
  if (recs) {
    recs.innerHTML = '';
    const weakAreas = Object.entries(weaknesses).sort((a, b) => a[1].score - b[1].score);
    weakAreas.slice(0, 3).forEach(([area, data]) => {
      const concept = KNOWLEDGE_GRAPH.find(c => c.cat === area || (area === 'tactical' && c.cat === 'tactic'));
      if (!concept) return;
      const div = document.createElement('div');
      div.className = 'mission-item';
      div.innerHTML = `<div><div class="mission-title">📌 Study: ${concept.name}</div><div class="mission-meta"><span>📊 ${area}: ${data.score}%</span><span>⏱️ ${concept.min} min</span><span>⚡ ${concept.xp} XP</span></div><div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;"><strong>Why:</strong> ${data.detail}</div></div>`;
      div.addEventListener('click', () => document.querySelector('[data-view="learn"]').click());
      recs.appendChild(div);
    });
  }

  // Roadmap
  initRoadmap();
}

function initRoadmap() {
  const slider = document.getElementById('intensitySlider');
  if (!slider) return;
  const update = () => {
    const h = parseInt(slider.value);
    profile.hoursPerWeek = h;
    save();
    document.getElementById('intensityLabel').textContent = `${h}h/wk`;
    const proj = calcRoadmapProjection(profile.elo, profile.targetElo, h);
    document.getElementById('roadCurrent').textContent = `${profile.elo} ELO`;
    document.getElementById('roadTarget').textContent = `${profile.targetElo} ELO`;
    document.getElementById('roadTime').textContent = `${proj.timelineYears} Years`;
    document.getElementById('roadSummary').innerHTML = `📊 Gap: <strong>${proj.gap}</strong> Elo | Study: <strong>${proj.totalHours.toLocaleString()}</strong> hours<br>At ${h}h/week → <strong>${proj.totalWeeks}</strong> weeks (<strong>${proj.timelineYears}</strong> years)<br>💡 Suggested: <strong>${proj.suggestedPace}h/week</strong> → ${proj.projectedCompletionWithSuggested} years`;
  };
  slider.value = profile.hoursPerWeek;
  slider.addEventListener('input', update);
  update();
}

// ═══════════════════════════════════════════════════
// PROGRESS VIEW
// ═══════════════════════════════════════════════════
function initProgress() {
  document.getElementById('chartStart').textContent = profile.elo;
  document.getElementById('chartEnd').textContent = profile.targetElo;
}

function renderRadar() {
  const svg = document.getElementById('radarSvg');
  if (!svg) return;
  const w = analyzeWeaknesses();
  const labels = ['Opening', 'Tactical', 'Strategic', 'Endgame', 'Calculation'];
  const values = [w.opening.score, w.tactical.score, w.strategic.score, w.endgame.score, w.calculation.score];
  const cx = 150, cy = 130, r = 100, n = labels.length;
  let html = '';
  [0.25, 0.5, 0.75, 1.0].forEach(s => {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      pts.push(`${cx + r * s * Math.cos(angle)},${cy + r * s * Math.sin(angle)}`);
    }
    html += `<polygon class="radar-grid-ring" points="${pts.join(' ')}"/>`;
  });
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const ex = cx + r * Math.cos(angle), ey = cy + r * Math.sin(angle);
    html += `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}"/>`;
    const lx = cx + (r + 18) * Math.cos(angle), ly = cy + (r + 18) * Math.sin(angle);
    html += `<text class="radar-label" x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle">${labels[i]}</text>`;
  }
  const dataPts = [];
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const v = values[i] / 100;
    dataPts.push(`${cx + r * v * Math.cos(angle)},${cy + r * v * Math.sin(angle)}`);
  }
  html += `<polygon class="radar-polygon" points="${dataPts.join(' ')}"/>`;
  dataPts.forEach(pt => {
    const [x, y] = pt.split(',');
    html += `<circle cx="${x}" cy="${y}" r="3.5" fill="var(--accent-indigo)"/>`;
  });
  svg.innerHTML = html;
}

function renderHeatmap() {
  const grid = document.getElementById('heatmapGrid');
  if (!grid) return;
  grid.innerHTML = '';
  KNOWLEDGE_GRAPH.forEach(concept => {
    const isMastered = profile.mastered.includes(concept.id);
    const isUnlocked = concept.prereqs.every(p => profile.mastered.includes(p));
    let color = 'rgba(239,68,68,0.3)';
    if (isMastered) color = 'rgba(16,185,129,0.6)';
    else if (isUnlocked) color = 'rgba(234,179,8,0.4)';
    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';
    cell.style.background = color;
    cell.title = `${concept.name} (${isMastered ? 'Mastered' : isUnlocked ? 'Unlocked' : 'Locked'})`;
    grid.appendChild(cell);
  });
}

function renderAchievements() {
  const grid = document.getElementById('achieveGrid');
  if (!grid) return;
  grid.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const earned = profile.achievements.includes(a.id);
    const div = document.createElement('div');
    div.className = 'achievement ' + (earned ? 'earned' : 'locked');
    div.innerHTML = `<span>${a.icon}</span><span>${a.name}</span>`;
    div.title = a.desc;
    grid.appendChild(div);
  });
}

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════
function getHighestROI() {
  const mastered = new Set(profile.mastered);
  const unlocked = KNOWLEDGE_GRAPH.filter(c => !mastered.has(c.id) && c.prereqs.every(p => mastered.has(p)));
  if (!unlocked.length) return null;
  const elo = profile.elo;
  return unlocked.sort((a, b) => {
    const aR = (elo >= a.range[0] && elo <= a.range[1]) ? 1 : 0;
    const bR = (elo >= b.range[0] && elo <= b.range[1]) ? 1 : 0;
    if (bR !== aR) return bR - aR;
    return (b.xp / b.diff) - (a.xp / a.diff);
  })[0];
}

function getWeakestArea() {
  const w = analyzeWeaknesses();
  const sorted = Object.entries(w).sort((a, b) => a[1].score - b[1].score);
  if (!sorted.length) return null;
  const [area, data] = sorted[0];
  return { area, score: data.score, detail: data.detail, expectedGain: Math.round((100 - data.score) * 0.4) };
}

function analyzeWeaknesses() {
  const mastered = new Set(profile.mastered);
  const catScores = {};
  const categories = { tactic: 'tactical', strategy: 'strategic', opening: 'opening', endgame: 'endgame', calculation: 'calculation' };

  Object.entries(categories).forEach(([cat, label]) => {
    const concepts = KNOWLEDGE_GRAPH.filter(c => c.cat === cat);
    const masteredCount = concepts.filter(c => mastered.has(c.id)).length;
    const score = concepts.length ? Math.round(masteredCount / concepts.length * 100) : 50;
    const unmasteredNames = concepts.filter(c => !mastered.has(c.id)).map(c => c.name).slice(0, 2).join(', ');
    catScores[label] = {
      score,
      detail: unmasteredNames ? `Needs work on: ${unmasteredNames}` : 'All concepts mastered!'
    };
  });

  return catScores;
}
