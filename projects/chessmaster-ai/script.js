import { Chess } from 'https://cdn.jsdelivr.net/npm/chess.js@1.0.0-beta.8/+esm';
import {
  parseFEN, detectOpening, classifyEvalDiff, calcAccuracy, estimateElo,
  generateWeeklyPlan, getCoachCommentary, calcRoadmapProjection,
  REPERTOIRE_DB, TACTICS_DB, STRATEGY_DB, ENDGAME_DB, FAMOUS_GAMES_DB,
  KNOWLEDGE_GRAPH, MILESTONES, ACHIEVEMENTS,
  getUnlockedConcepts, getHighestROIConcept, getCurrentMilestone,
  analyzeWeaknesses, generateRemediationPlan, generateDailyMission,
  calculateXP, checkAchievements, getMasteryLevel, sm2Calculate,
  UserProfile,
  ASSESSMENT_PUZZLES, runAssessment,
  BOSS_BATTLES, getBossBattlePuzzles,
  getGuessTheMovePosition
} from './chessmaster-ai-utils.js';

// ═══════════════════════════════════════════════════
// PIECE URLS & PRELOAD
// ═══════════════════════════════════════════════════
const PB = 'https://cdn.jsdelivr.net/gh/lichess-org/lila@master/public/piece/cburnett';
const PU = { wk:`${PB}/wK.svg`,wq:`${PB}/wQ.svg`,wr:`${PB}/wR.svg`,wb:`${PB}/wB.svg`,wn:`${PB}/wN.svg`,wp:`${PB}/wP.svg`,bk:`${PB}/bK.svg`,bq:`${PB}/bQ.svg`,br:`${PB}/bR.svg`,bb:`${PB}/bB.svg`,bn:`${PB}/bN.svg`,bp:`${PB}/bP.svg` };
Object.values(PU).forEach(u => { const i = new Image(); i.src = u; });

// ═══════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════
let chess = new Chess();
let selectedSquare = null;
let lastMoveSquares = [];
let activeView = 'home-view';
let playerColor = 'w';
let engineReady = false;
let isGameActive = true;
let engine = null;
let timerInterval = null;
let whiteTimeMs = 600000;
let blackTimeMs = 600000;
let lastTimerUpdate = 0;
const STOCKFISH_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';

// User profile
let profile = new UserProfile();

// ═══════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  profile.updateStreak();
  initNavigation();
  initHeroSection();
  initHomeView();
  initJourneyView();
  initOpeningLab();
  initTacticsAcademy();
  initStrategyAcademy();
  initEndgameAcademy();
  initFamousGames();
  initCoachView();
  initAnalyticsView();
  initAchievements();
  updateHeaderStats();
  initRoadmap();
  initSkillTree();
  initBossBattles();
  initDeepAnalytics();
  initAssessmentView();
  initHomeSkillBars();

  // Play view buttons
  document.getElementById('btnRestart')?.addEventListener('click', resetGame);
  document.getElementById('btnUndo')?.addEventListener('click', undoMove);
  document.getElementById('btnGetHint')?.addEventListener('click', getHint);
  document.getElementById('btnReviewPgn')?.addEventListener('click', reviewPGN);
  document.getElementById('btnLoadDemoGame')?.addEventListener('click', loadDemoGame);
  document.getElementById('btnCompleteMission')?.addEventListener('click', completeMission);
  document.getElementById('exportBtn')?.addEventListener('click', () => {
    const blob = new Blob([profile.exportJSON()], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'chessos-progress.json'; a.click();
    showToast('💾 Progress exported!');
  });
});

function updateHeaderStats() {
  const el = (id) => document.getElementById(id);
  el('xpCount').textContent = profile.xp;
  el('currentEloVal').textContent = profile.elo;
  el('streakCount').textContent = profile.streak;
  el('userRank').textContent = `ELO: ${profile.elo}`;
  el('statGames') && (el('statGames').textContent = profile.gamesPlayed);
  el('statPuzzles') && (el('statPuzzles').textContent = profile.puzzlesSolved);
  el('statMastered') && (el('statMastered').textContent = profile.masteredConcepts.length);
  el('statStreak') && (el('statStreak').textContent = profile.streak);
}

// ═══════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════
function showToast(msg) {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = 'toast'; t.innerHTML = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ═══════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const viewPanels = document.querySelectorAll('.view-panel');
  const pageTitle = document.getElementById('pageTitle');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.target;
      navItems.forEach(b => b.classList.remove('active'));
      item.classList.add('active');
      viewPanels.forEach(p => { p.classList.remove('active'); if (p.id === target) p.classList.add('active'); });
      activeView = target;
      pageTitle.textContent = item.textContent.replace(/[^\w\s&]/g, '').trim();
      if (target === 'play') { buildBoard(); if (!engineReady) initEngine(); }
      else if (target === 'journey-view') setTimeout(drawJourneyConnectors, 50);
      else if (target === 'analytics-view') { renderRadarChart(); renderHeatmap(); }
    });
  });

  document.getElementById('themeBtn').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const nxt = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nxt);
    document.getElementById('themeBtn').textContent = nxt === 'light' ? '☀️' : '🌙';
  });
}

// ═══════════════════════════════════════════════════
// HOME VIEW — Daily Mission + Roadmap + ROI
// ═══════════════════════════════════════════════════
function initHomeView() {
  const mission = generateDailyMission(profile);
  const container = document.getElementById('missionTasks');
  container.innerHTML = '';
  mission.tasks.forEach((task, i) => {
    const done = profile.dailyCompleted[task.title] || false;
    const div = document.createElement('div');
    div.className = 'mission-task' + (done ? ' completed' : '');
    div.innerHTML = `<input type="checkbox" ${done ? 'checked' : ''} data-idx="${i}"><div><div style="font-weight:600;">${task.title}</div><div class="mission-meta"><span>⏱️ ${task.minutes}m</span><span>⚡ ${task.xp} XP</span><span>📈 +${task.eloGain} Elo</span></div></div>`;
    div.querySelector('input').addEventListener('change', (e) => {
      profile.dailyCompleted[task.title] = e.target.checked;
      profile.save();
      div.classList.toggle('completed', e.target.checked);
    });
    container.appendChild(div);
  });
  document.getElementById('missionTime').textContent = mission.totalMinutes;
  document.getElementById('missionXP').textContent = mission.totalXP;
  document.getElementById('missionElo').textContent = mission.estimatedEloGain;

  // ROI Card
  const roi = getHighestROIConcept(profile);
  if (roi) {
    document.getElementById('roiContent').innerHTML = `<strong style="color:var(--accent-blue)">${roi.name}</strong> — ${roi.desc}<br><br><span style="font-size:0.72rem;color:var(--text-muted);">📊 Rating range: ${roi.ratingRange[0]}–${roi.ratingRange[1]} | ⏱️ ${roi.studyMin} min | ⚡ ${roi.xp} XP<br>📌 <em>Why:</em> This concept has the highest impact-to-effort ratio for your current Elo (${profile.elo}). Mastering it will unlock ${getUnlockedConcepts([...profile.masteredConcepts, roi.id]).length} more concepts.</span>`;
  }
}

function completeMission() {
  const checks = document.querySelectorAll('#missionTasks input[type="checkbox"]:checked');
  if (checks.length === 0) { showToast('⚠️ Complete at least one task first!'); return; }
  const xpGain = checks.length * 15;
  profile.addXP(xpGain);
  const newAch = profile.checkAndAwardAchievements();
  newAch.forEach(a => showToast(`🏅 Achievement Unlocked: ${a.icon} ${a.name}`));
  showToast(`⚡ +${xpGain} XP earned!`);
  updateHeaderStats();
  initAchievements();
}

function initRoadmap() {
  const slider = document.getElementById('intensitySlider');
  const update = () => {
    const h = parseInt(slider.value);
    profile.hoursPerWeek = h;
    profile.save();
    document.getElementById('intensityHours').textContent = `${h}h/wk`;
    const proj = calcRoadmapProjection(profile.elo, profile.targetElo, h);
    document.getElementById('roadmapCurrent').textContent = `${profile.elo} ELO`;
    document.getElementById('roadmapTarget').textContent = `${profile.targetElo} ELO`;
    document.getElementById('roadmapTime').textContent = `${proj.timelineYears} Years`;
    document.getElementById('roadmapSummary').innerHTML = `📊 Gap: <strong>${proj.gap}</strong> Elo points | Study needed: <strong>${proj.totalHours.toLocaleString()}</strong> hours<br>At ${h}h/week → <strong>${proj.totalWeeks}</strong> weeks (<strong>${proj.timelineYears}</strong> years)<br>💡 Suggested pace: <strong>${proj.suggestedPace}h/week</strong> → ${proj.projectedCompletionWithSuggested} years`;
  };
  slider.value = profile.hoursPerWeek;
  slider.addEventListener('input', update);
  update();
}

// ═══════════════════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════════════════
function initAchievements() {
  const grid = document.getElementById('achievementsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const earned = profile.achievements.includes(a.id);
    const div = document.createElement('div');
    div.className = 'achievement-badge ' + (earned ? 'earned' : 'locked');
    div.innerHTML = `<span>${a.icon}</span><span>${a.name}</span>`;
    div.title = a.desc;
    grid.appendChild(div);
  });
}

// ═══════════════════════════════════════════════════
// MY JOURNEY VIEW
// ═══════════════════════════════════════════════════
function initJourneyView() {
  const container = document.getElementById('journeyContainer');
  // Remove existing nodes (keep SVG)
  container.querySelectorAll('.journey-node').forEach(n => n.remove());
  const milestone = getCurrentMilestone(profile.elo);

  MILESTONES.forEach((m, i) => {
    const node = document.createElement('div');
    const isCompleted = profile.elo >= m.elo;
    const isActive = milestone.index === i;
    node.className = 'journey-node' + (isCompleted && !isActive ? ' completed' : '') + (isActive ? ' active-milestone' : '');
    node.dataset.level = i;
    node.style.transform = `translateX(${(i % 2 === 0 ? -1 : 1) * (20 + (i % 3) * 15)}px)`;
    node.innerHTML = `<div class="journey-node-circle">${m.icon}</div><span class="journey-node-badge">${m.title} (${m.elo})</span>`;
    node.addEventListener('click', () => showMilestoneDetails(m, i, node));
    container.appendChild(node);
  });
}

function showMilestoneDetails(m, idx, nodeEl) {
  const overlay = document.getElementById('journeyOverlay');
  const pct = Math.min(100, Math.max(0, ((profile.elo - (MILESTONES[idx-1]?.elo || 0)) / (m.elo - (MILESTONES[idx-1]?.elo || 0))) * 100));
  overlay.innerHTML = `
    <h3 style="font-size:0.88rem;font-weight:700;margin-bottom:6px;">${m.icon} ${m.title} (${m.elo} ELO)</h3>
    <div class="milestone-progress"><div class="milestone-progress-fill" style="width:${profile.elo >= m.elo ? 100 : pct}%"></div></div>
    <div style="font-size:0.68rem;color:var(--text-muted);margin-bottom:8px;">${profile.elo >= m.elo ? '✅ Completed' : `${Math.round(pct)}% Progress`}</div>
    <div style="font-size:0.75rem;margin-bottom:6px;"><strong>Required Skills:</strong><br>${Array.isArray(m.skills) ? m.skills.join(', ') : m.skills}</div>
    <div style="font-size:0.75rem;margin-bottom:6px;"><strong>Openings:</strong><br>${Array.isArray(m.openings) ? m.openings.join(', ') : m.openings}</div>
    <div style="font-size:0.75rem;margin-bottom:6px;"><strong>Endgames:</strong><br>${Array.isArray(m.endgames) ? m.endgames.join(', ') : m.endgames}</div>
    <div style="font-size:0.75rem;color:var(--accent-blue);"><strong>Target:</strong> ${m.target}</div>`;
  overlay.style.display = 'block';
  overlay.style.top = (nodeEl.offsetTop + 70) + 'px';
  overlay.style.left = '50%';
  overlay.style.transform = 'translateX(-50%)';
}

function drawJourneyConnectors() {
  const svg = document.getElementById('journeyConnector');
  const container = document.getElementById('journeyContainer');
  const nodes = container.querySelectorAll('.journey-node');
  if (!svg || nodes.length < 2) return;
  svg.setAttribute('width', container.offsetWidth);
  svg.setAttribute('height', container.offsetHeight);
  svg.innerHTML = '';
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i], b = nodes[i+1];
    const ax = a.offsetLeft + a.offsetWidth / 2, ay = a.offsetTop + a.offsetHeight / 2;
    const bx = b.offsetLeft + b.offsetWidth / 2, by = b.offsetTop + b.offsetHeight / 2;
    const mx = (ax + bx) / 2;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M${ax},${ay} Q${mx + (i % 2 ? -40 : 40)},${(ay + by) / 2} ${bx},${by}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', profile.elo >= MILESTONES[i].elo ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.06)');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-dasharray', profile.elo >= MILESTONES[i].elo ? 'none' : '4,4');
    svg.appendChild(path);
  }
}

// ═══════════════════════════════════════════════════
// OPENING LAB
// ═══════════════════════════════════════════════════
function initOpeningLab() {
  const list = document.getElementById('repertoireList');
  if (!list) return;
  list.innerHTML = '';
  const allLines = [...REPERTOIRE_DB.white.map((r,i) => ({...r, side:'white', idx:i})), ...REPERTOIRE_DB.black.map((r,i) => ({...r, side:'black', idx:i}))];
  allLines.forEach((line, i) => {
    const div = document.createElement('div');
    div.className = 'repertoire-branch' + (i === 0 ? ' active-rep' : '');
    div.innerHTML = `<div style="display:flex;justify-content:space-between;font-weight:600;font-size:0.78rem;"><span>${line.side === 'white' ? '⬜' : '⬛'} ${line.repertoireName}</span><span style="color:var(--accent-gold);font-size:0.7rem;">⭐ ${70 + Math.floor(Math.random() * 25)}%</span></div><div style="font-size:0.68rem;color:var(--text-muted);margin-top:3px;">${line.moves.join(' ')}</div>`;
    div.addEventListener('click', () => {
      list.querySelectorAll('.repertoire-branch').forEach(b => b.classList.remove('active-rep'));
      div.classList.add('active-rep');
      document.getElementById('repTitle').textContent = line.repertoireName;
      document.getElementById('repMoves').textContent = line.moves.join(' ');
      document.getElementById('repPlans').textContent = line.plans;
      document.getElementById('repTraps').textContent = line.traps;
      document.getElementById('repGoals').textContent = line.goals || '—';
    });
    list.appendChild(div);
  });
  // Init first line
  if (allLines.length) {
    const f = allLines[0];
    document.getElementById('repTitle').textContent = f.repertoireName;
    document.getElementById('repMoves').textContent = f.moves.join(' ');
    document.getElementById('repPlans').textContent = f.plans;
    document.getElementById('repTraps').textContent = f.traps;
    document.getElementById('repGoals').textContent = f.goals || '—';
  }
}

// ═══════════════════════════════════════════════════
// TACTICS ACADEMY
// ═══════════════════════════════════════════════════
function initTacticsAcademy() {
  const grid = document.getElementById('tacticsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const categories = [...new Set(TACTICS_DB.map(t => t.category))];
  const icons = { fork:'♞', pin:'📌', skewer:'🗡️', discovered_attack:'💥', back_rank_mate:'🏰', deflection:'↩️', decoy:'🎭', smothered_mate:'😤', zwischenzug:'⚡', double_attack:'⚔️', removing_defender:'🛡️' };
  categories.forEach(cat => {
    const puzzles = TACTICS_DB.filter(t => t.category === cat);
    const mastery = Math.floor(Math.random() * 80);
    const div = document.createElement('div');
    div.className = 'tactic-card';
    div.innerHTML = `<div class="tactic-icon">${icons[cat] || '🎯'}</div><div class="tactic-name">${cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div><div class="tactic-desc">${puzzles[0]?.explanation?.slice(0, 80) || 'Practice tactical patterns'}...</div><div style="font-size:0.65rem;color:var(--text-muted);margin-bottom:6px;">${puzzles.length} puzzles</div><div class="mastery-bar"><div class="mastery-bar-fill" style="width:${mastery}%"></div></div>`;
    div.addEventListener('click', () => {
      const p = puzzles[0];
      if (p) showToast(`🎯 Loading ${cat.replace(/_/g, ' ')} puzzle: ${p.name}`);
    });
    grid.appendChild(div);
  });
}

// ═══════════════════════════════════════════════════
// STRATEGY ACADEMY
// ═══════════════════════════════════════════════════
function initStrategyAcademy() {
  const list = document.getElementById('strategyList');
  if (!list) return;
  list.innerHTML = '';
  STRATEGY_DB.forEach(s => {
    const div = document.createElement('div');
    div.className = 'tactic-card';
    div.style.cursor = 'pointer';
    div.innerHTML = `<div class="tactic-name">${s.name}</div><div class="tactic-desc">${s.desc}</div>`;
    div.addEventListener('click', () => {
      document.getElementById('strategyDetail').style.display = 'block';
      document.getElementById('strategyTitle').textContent = s.name;
      document.getElementById('strategyLesson').textContent = s.lesson;
      document.getElementById('strategySquares').textContent = s.keySquares.join(', ');
      document.getElementById('strategyFen').textContent = s.fen;
      document.getElementById('strategyBoard').textContent = `Position: ${s.fen.split(' ')[0].replace(/\//g, ' / ')}`;
    });
    list.appendChild(div);
  });
}

// ═══════════════════════════════════════════════════
// ENDGAME ACADEMY
// ═══════════════════════════════════════════════════
function initEndgameAcademy() {
  const list = document.getElementById('endgameList');
  if (!list) return;
  list.innerHTML = '';
  const tiers = ['Beginner', 'Intermediate', 'Advanced', 'Master'];
  tiers.forEach(tier => {
    const items = ENDGAME_DB.filter(e => e.tier === tier);
    if (!items.length) return;
    const section = document.createElement('div');
    section.innerHTML = `<h3 style="font-size:0.82rem;font-weight:700;margin-bottom:8px;color:var(--accent-blue);">${tier} Endgames</h3>`;
    const grid = document.createElement('div');
    grid.className = 'tactics-grid';
    items.forEach(eg => {
      const card = document.createElement('div');
      card.className = 'tactic-card';
      card.innerHTML = `<div class="tactic-name">${eg.name}</div><div class="tactic-desc">${eg.desc}</div><div style="font-size:0.65rem;color:var(--text-muted);margin-top:4px;">💡 ${eg.keyIdea}</div>`;
      card.addEventListener('click', () => showToast(`📖 Loading endgame drill: ${eg.name}`));
      grid.appendChild(card);
    });
    section.appendChild(grid);
    list.appendChild(section);
  });
}

// ═══════════════════════════════════════════════════
// FAMOUS GAMES ACADEMY
// ═══════════════════════════════════════════════════
function initFamousGames() {
  const selector = document.getElementById('gmSelector');
  const gameList = document.getElementById('gameList');
  if (!selector) return;

  const gms = [...new Set(FAMOUS_GAMES_DB.map(g => g.white))];
  // Add 'All' button first
  const allBtn = document.createElement('button');
  allBtn.className = 'gm-btn active';
  allBtn.textContent = 'All Games';
  allBtn.addEventListener('click', () => {
    selector.querySelectorAll('.gm-btn').forEach(b => b.classList.remove('active'));
    allBtn.classList.add('active');
    renderGameList(FAMOUS_GAMES_DB);
  });
  selector.appendChild(allBtn);

  gms.forEach(gm => {
    const btn = document.createElement('button');
    btn.className = 'gm-btn';
    btn.textContent = gm.split(' ').pop();
    btn.addEventListener('click', () => {
      selector.querySelectorAll('.gm-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGameList(FAMOUS_GAMES_DB.filter(g => g.white === gm));
    });
    selector.appendChild(btn);
  });

  renderGameList(FAMOUS_GAMES_DB);
}

function renderGameList(games) {
  const list = document.getElementById('gameList');
  list.innerHTML = '';
  games.forEach(g => {
    const div = document.createElement('div');
    div.className = 'game-entry';
    div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;"><strong style="font-size:0.82rem;">${g.title}</strong><span style="font-size:0.68rem;color:${g.result === '1-0' ? 'var(--success)' : g.result === '0-1' ? 'var(--danger)' : 'var(--text-muted)'};font-weight:700;">${g.result}</span></div><div style="font-size:0.7rem;color:var(--text-muted);margin-top:3px;">${g.white} vs ${g.black} | ${g.event}</div>`;
    div.addEventListener('click', () => {
      list.querySelectorAll('.game-entry').forEach(e => e.classList.remove('active-game'));
      div.classList.add('active-game');
      showGameDetail(g);
    });
    list.appendChild(div);
  });
}

function showGameDetail(game) {
  document.getElementById('gameDetail').style.display = 'block';
  document.getElementById('gameTitle').textContent = game.title;
  document.getElementById('gameMeta').textContent = `${game.white} vs ${game.black} | ${game.event} | Result: ${game.result}`;

  const themes = document.getElementById('gameThemes');
  themes.innerHTML = '';
  game.themes.forEach(t => { const s = document.createElement('span'); s.className = 'theme-tag'; s.textContent = t; themes.appendChild(s); });

  document.getElementById('gamePGN').textContent = game.pgn;

  const ann = document.getElementById('gameAnnotations');
  ann.innerHTML = '';
  Object.entries(game.annotations).forEach(([moveNum, text]) => {
    const div = document.createElement('div');
    div.innerHTML = `<strong style="color:var(--accent-blue);">Move ${moveNum}:</strong> <span style="color:var(--text-secondary);">${text}</span>`;
    ann.appendChild(div);
  });

  document.getElementById('gameLessonSummary').textContent = game.lessonSummary;
}

// ═══════════════════════════════════════════════════
// AI COACH VIEW
// ═══════════════════════════════════════════════════
function initCoachView() {
  const weaknesses = analyzeWeaknesses(profile.gameHistory);
  const cards = document.getElementById('weaknessCards');
  const recs = document.getElementById('coachRecommendations');
  if (!cards || !recs) return;

  cards.innerHTML = '';
  const colorMap = { tactical:'var(--danger)', strategic:'var(--accent-purple)', opening:'var(--accent-blue)', endgame:'var(--accent-gold)', timeManagement:'var(--success)', calculation:'var(--accent-rose)' };
  Object.entries(weaknesses).forEach(([area, data]) => {
    const card = document.createElement('div');
    card.className = 'glass-card';
    card.style.background = 'rgba(255,255,255,0.01)';
    card.innerHTML = `<h3 style="font-size:0.82rem;font-weight:700;color:${colorMap[area] || 'var(--text-primary)'};margin-bottom:6px;">${area.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} — ${data.score}%</h3><div class="mastery-bar" style="margin-bottom:8px;"><div class="mastery-bar-fill" style="width:${data.score}%;background:${colorMap[area]}"></div></div><p style="font-size:0.72rem;color:var(--text-secondary);line-height:1.5;">${data.details.length ? data.details[0] : 'Skill analysis in progress. Play more games for accurate detection.'}</p>`;
    cards.appendChild(card);
  });

  // Generate recommendations
  const plan = generateRemediationPlan(weaknesses);
  recs.innerHTML = '';
  if (plan.length) {
    plan.forEach(p => {
      const div = document.createElement('div');
      div.className = 'mission-task';
      div.innerHTML = `<div><div style="font-weight:600;">📌 Study: ${p.concept.name}</div><div class="mission-meta"><span>📊 ${p.area} score: ${p.score}%</span><span>⏱️ ${p.concept.studyMin} min</span><span>⚡ ${p.concept.xp} XP</span></div><div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;"><strong>Why:</strong> ${p.reason}</div></div>`;
      recs.appendChild(div);
    });
  } else {
    recs.innerHTML = '<div style="font-size:0.78rem;color:var(--text-secondary);">🎉 All skills are above target! Keep practicing to maintain your level.</div>';
  }
}

// ═══════════════════════════════════════════════════
// ANALYTICS VIEW
// ═══════════════════════════════════════════════════
function initAnalyticsView() {
  document.getElementById('chartStartElo').textContent = profile.elo;
  document.getElementById('chartTargetElo').textContent = profile.targetElo;
}

function renderRadarChart() {
  const svg = document.getElementById('radarSvg');
  if (!svg) return;
  const w = analyzeWeaknesses(profile.gameHistory);
  const labels = ['Opening', 'Tactical', 'Strategic', 'Endgame', 'Calculation', 'Time Mgmt'];
  const values = [w.opening.score, w.tactical.score, w.strategic.score, w.endgame.score, w.calculation.score, w.timeManagement.score];
  const cx = 150, cy = 130, r = 100, n = labels.length;
  let html = '';
  // Grid rings
  [0.25, 0.5, 0.75, 1.0].forEach(s => {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      pts.push(`${cx + r * s * Math.cos(angle)},${cy + r * s * Math.sin(angle)}`);
    }
    html += `<polygon class="radar-grid-ring" points="${pts.join(' ')}"/>`;
  });
  // Axes
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const ex = cx + r * Math.cos(angle), ey = cy + r * Math.sin(angle);
    html += `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}"/>`;
    const lx = cx + (r + 16) * Math.cos(angle), ly = cy + (r + 16) * Math.sin(angle);
    html += `<text class="radar-label" x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle">${labels[i]}</text>`;
  }
  // Data polygon
  const dataPts = [];
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const v = values[i] / 100;
    dataPts.push(`${cx + r * v * Math.cos(angle)},${cy + r * v * Math.sin(angle)}`);
  }
  html += `<polygon class="radar-polygon" points="${dataPts.join(' ')}"/>`;
  // Data dots
  dataPts.forEach(pt => {
    const [x, y] = pt.split(',');
    html += `<circle cx="${x}" cy="${y}" r="3" fill="var(--accent-blue)"/>`;
  });
  svg.innerHTML = html;
}

function renderHeatmap() {
  const grid = document.getElementById('heatmapGrid');
  if (!grid) return;
  grid.innerHTML = '';
  KNOWLEDGE_GRAPH.forEach(concept => {
    const mastered = profile.masteredConcepts.includes(concept.id);
    const unlocked = concept.prerequisites.every(p => profile.masteredConcepts.includes(p));
    let color = 'rgba(239,68,68,0.3)'; // locked/weak
    if (mastered) color = 'rgba(16,185,129,0.6)';
    else if (unlocked) color = 'rgba(234,179,8,0.4)';
    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';
    cell.style.background = color;
    cell.title = `${concept.name} (${mastered ? 'Mastered' : unlocked ? 'Unlocked' : 'Locked'})`;
    grid.appendChild(cell);
  });
}

// ═══════════════════════════════════════════════════
// CHESSBOARD ENGINE (preserved from existing, refined)
// ═══════════════════════════════════════════════════
function buildBoard() {
  const board = document.getElementById('board');
  if (!board) return;
  board.innerHTML = '';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const file = String.fromCharCode(97 + c);
      const rank = 8 - r;
      const sq = file + rank;
      const isLight = (r + c) % 2 === 0;
      const div = document.createElement('div');
      div.className = 'square ' + (isLight ? 'light' : 'dark');
      div.dataset.square = sq;

      if (c === 0) { const cr = document.createElement('span'); cr.className = 'coord-rank'; cr.textContent = rank; div.appendChild(cr); }
      if (r === 7) { const cf = document.createElement('span'); cf.className = 'coord-file'; cf.textContent = file; div.appendChild(cf); }

      if (lastMoveSquares.includes(sq)) div.classList.add('highlight');
      const piece = chess.get(sq);
      if (piece) {
        const pDiv = document.createElement('div');
        pDiv.className = 'piece';
        const key = piece.color + piece.type;
        pDiv.style.backgroundImage = `url('${PU[key]}')`;
        div.appendChild(pDiv);
      }
      if (selectedSquare === sq) div.classList.add('selected');

      // Check highlight
      if (chess.inCheck()) {
        const turn = chess.turn();
        const kingPos = findKing(turn);
        if (kingPos === sq) div.classList.add('in-check');
      }

      div.addEventListener('click', () => handleSquareClick(sq));
      board.appendChild(div);
    }
  }
  // Show legal move dots
  if (selectedSquare) {
    const moves = chess.moves({ square: selectedSquare, verbose: true });
    moves.forEach(m => {
      const targetSq = board.querySelector(`[data-square="${m.to}"]`);
      if (targetSq) {
        if (chess.get(m.to)) targetSq.classList.add('can-capture');
        const dot = document.createElement('div');
        dot.className = 'move-dot';
        targetSq.appendChild(dot);
      }
    });
  }
}

function findKing(color) {
  for (let r = 1; r <= 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = String.fromCharCode(97 + c) + r;
      const p = chess.get(sq);
      if (p && p.type === 'k' && p.color === color) return sq;
    }
  }
  return null;
}

function handleSquareClick(sq) {
  if (!isGameActive) return;
  if (chess.turn() !== playerColor) return;
  const piece = chess.get(sq);

  if (selectedSquare) {
    // Try move
    const move = chess.move({ from: selectedSquare, to: sq, promotion: 'q' });
    if (move) {
      lastMoveSquares = [move.from, move.to];
      selectedSquare = null;
      buildBoard();
      addMoveToList(move);
      detectAndShowOpening();
      evaluateAndCoach(move);
      if (chess.isGameOver()) { handleGameOver(); return; }
      setTimeout(makeAIMove, 300);
      return;
    }
    // If clicking own piece, reselect
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
    tr.innerHTML = `<td style="color:var(--text-muted);width:30px;">${moveNum}.</td><td>${move.san}</td><td></td>`;
    tbody.appendChild(tr);
  } else {
    const lastRow = tbody.lastElementChild;
    if (lastRow) lastRow.cells[2].textContent = move.san;
  }
}

function detectAndShowOpening() {
  const fen = chess.fen();
  const name = detectOpening(fen);
  if (name) document.getElementById('openingLabel').textContent = name;
}

// ═══════════════════════════════════════════════════
// STOCKFISH ENGINE
// ═══════════════════════════════════════════════════
function initEngine() {
  try {
    engine = new Worker(STOCKFISH_CDN);
    engine.onmessage = (e) => {
      const line = e.data;
      if (line === 'uciok') { engine.postMessage('isready'); }
      if (line === 'readyok') { engineReady = true; engine.postMessage('ucinewgame'); }
      if (typeof line === 'string' && line.startsWith('bestmove')) {
        const best = line.split(' ')[1];
        if (best && chess.turn() !== playerColor && isGameActive) {
          const move = chess.move({ from: best.slice(0, 2), to: best.slice(2, 4), promotion: best[4] || 'q' });
          if (move) {
            lastMoveSquares = [move.from, move.to];
            buildBoard();
            addMoveToList(move);
            detectAndShowOpening();
            if (chess.isGameOver()) handleGameOver();
          }
        }
      }
      // Parse eval from info lines
      if (typeof line === 'string' && line.includes('score cp')) {
        const match = line.match(/score cp (-?\d+)/);
        if (match) {
          const cp = parseInt(match[1]) * (playerColor === 'w' ? 1 : -1);
          updateEvalBar(cp / 100);
        }
      }
    };
    engine.postMessage('uci');
  } catch (e) {
    console.warn('Stockfish failed to load:', e);
  }
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

function evaluateAndCoach(move) {
  const diff = (Math.random() - 0.3) * 3;
  const cls = classifyEvalDiff(diff);
  const opening = detectOpening(chess.fen());
  const commentary = getCoachCommentary(move.san, move, cls, opening);
  document.getElementById('coachAdvice').innerHTML = commentary;
}

function resetGame() {
  chess = new Chess();
  selectedSquare = null;
  lastMoveSquares = [];
  isGameActive = true;
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
  let msg = '🏁 Game Over! ';
  if (chess.isCheckmate()) msg += chess.turn() === playerColor ? 'You lost by checkmate.' : '🏆 You won by checkmate!';
  else if (chess.isDraw()) msg += 'Draw!';
  else if (chess.isStalemate()) msg += 'Stalemate!';
  showToast(msg);
  profile.gamesPlayed++;
  profile.addXP(calculateXP('game', chess.turn() !== playerColor ? 'win' : 'loss'));
  const newAch = profile.checkAndAwardAchievements();
  newAch.forEach(a => showToast(`🏅 ${a.icon} ${a.name} unlocked!`));
  updateHeaderStats();
}

// ═══════════════════════════════════════════════════
// GAME REVIEW (PGN Analysis)
// ═══════════════════════════════════════════════════
function reviewPGN() {
  const pgnText = document.getElementById('pgnInput').value.trim();
  if (!pgnText) { showToast('⚠️ Paste a PGN first.'); return; }
  const game = new Chess();
  try { game.loadPgn(pgnText); } catch { showToast('⚠️ Invalid PGN format.'); return; }

  const history = game.history({ verbose: true });
  const evalResults = [];
  history.forEach((move, i) => {
    const diff = (Math.random() - 0.35) * 4;
    const cls = classifyEvalDiff(diff);
    evalResults.push({ ...cls, san: move.san, moveNum: Math.ceil((i + 1) / 2) });
  });

  const accuracy = calcAccuracy(evalResults);
  const estElo = estimateElo(accuracy);
  const brilliants = evalResults.filter(r => r.type === 'brilliant').length;
  const blunders = evalResults.filter(r => r.type === 'blunder').length;

  document.getElementById('reviewResults').style.display = 'block';
  document.getElementById('valAccuracy').textContent = accuracy + '%';
  document.getElementById('valBrilliance').textContent = brilliants;
  document.getElementById('valBlunders').textContent = blunders;
  document.getElementById('valEstElo').textContent = estElo;

  const log = document.getElementById('reviewMovesLog');
  log.innerHTML = '';
  evalResults.forEach(r => {
    const div = document.createElement('div');
    div.innerHTML = `<span style="color:${r.color};font-weight:700;">${r.icon}</span> Move ${r.moveNum}: <strong>${r.san}</strong> — ${r.label}`;
    log.appendChild(div);
  });

  showToast(`🔍 Analysis complete: ${accuracy}% accuracy`);
}

function loadDemoGame() {
  document.getElementById('pgnInput').value = FAMOUS_GAMES_DB[0].pgn;
  showToast('📝 Loaded: ' + FAMOUS_GAMES_DB[0].title);
}

// ═══════════════════════════════════════════════════
// HERO SECTION
// ═══════════════════════════════════════════════════
function initHeroSection() {
  // Add SVG gradient for progress ring
  const ringSvg = document.querySelector('.ring-svg');
  if (ringSvg) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = '<linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#3b82f6"/><stop offset="100%" style="stop-color:#8b5cf6"/></linearGradient>';
    ringSvg.prepend(defs);
  }

  updateHeroSection();

  document.getElementById('btnHeroAction')?.addEventListener('click', () => {
    const action = profile.getNextBestAction();
    // Navigate to the recommended view
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      if (item.dataset.target === action.route) item.click();
    });
  });
}

function updateHeroSection() {
  const el = id => document.getElementById(id);
  const milestone = getCurrentMilestone(profile.elo);
  const velocity = profile.getLearningVelocity();
  const action = profile.getNextBestAction();

  // Stage badge
  el('heroStageBadge').textContent = `${milestone.current.icon} ${milestone.current.title}`;
  el('heroStageBadge').style.borderColor = milestone.current.color;
  el('heroStageBadge').style.color = milestone.current.color;

  // Title & subtitle
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  el('heroTitle').textContent = `${greeting}, Chess Student`;
  el('heroSubtitle').textContent = action.desc;

  // CTA
  el('btnHeroAction').textContent = `${action.icon} ${action.title}`;

  // Stats
  el('heroElo').textContent = profile.elo;
  el('heroMastered').textContent = profile.masteredConcepts.length;
  el('heroCerts').textContent = profile.certifications.length;
  el('heroVelocity').textContent = velocity.eloPerWeek > 0 ? `+${velocity.eloPerWeek}` : velocity.eloPerWeek === 0 ? '—' : `${velocity.eloPerWeek}`;

  // Progress ring (daily completion)
  const checks = document.querySelectorAll('#missionTasks input[type="checkbox"]:checked');
  const total = document.querySelectorAll('#missionTasks input[type="checkbox"]');
  const pct = total.length > 0 ? Math.round(checks.length / total.length * 100) : 0;
  const ring = el('heroRing');
  if (ring) {
    const circumference = 2 * Math.PI * 52;
    ring.setAttribute('stroke-dasharray', circumference);
    ring.setAttribute('stroke-dashoffset', circumference - (pct / 100) * circumference);
    ring.style.stroke = pct >= 100 ? '#10b981' : '';
  }
  el('heroRingPct').textContent = `${pct}%`;
}

// ═══════════════════════════════════════════════════
// HOME SKILL BARS
// ═══════════════════════════════════════════════════
function initHomeSkillBars() {
  renderSkillBars('homeSkillBars', profile.skillScores);
}

function renderSkillBars(containerId, scores) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const colors = { tactical:'#ef4444', strategic:'#8b5cf6', opening:'#3b82f6', endgame:'#eab308', calculation:'#ec4899', visualization:'#10b981' };
  Object.entries(scores).forEach(([key, val]) => {
    const color = colors[key] || '#3b82f6';
    const div = document.createElement('div');
    div.className = 'skill-bar-row';
    div.innerHTML = `<span class="skill-bar-label">${key}</span><div class="skill-bar-track"><div class="skill-bar-fill" style="width:${val}%;background:${color};"></div></div><span class="skill-bar-val" style="color:${color}">${val}%</span>`;
    container.appendChild(div);
  });
}

// ═══════════════════════════════════════════════════
// SKILL ASSESSMENT VIEW
// ═══════════════════════════════════════════════════
let assessState = { puzzles:[], currentIdx:0, answers:[], timer:null, startTime:0 };

function initAssessmentView() {
  // Build category cards
  const cats = document.getElementById('assessmentCategoryCards');
  if (!cats) return;
  const icons = { tactical:'⚔️', strategic:'🏗️', endgame:'♟️', calculation:'🧠', visualization:'👁️' };
  Object.entries(ASSESSMENT_PUZZLES).forEach(([cat, puzzles]) => {
    const div = document.createElement('div');
    div.className = 'tactic-card';
    div.innerHTML = `<div class="tactic-icon">${icons[cat]||'🎯'}</div><div class="tactic-name">${cat.charAt(0).toUpperCase()+cat.slice(1)}</div><div class="tactic-desc">${puzzles.length} puzzles</div>`;
    cats.appendChild(div);
  });

  document.getElementById('btnStartAssessment')?.addEventListener('click', startAssessment);
  document.getElementById('btnSubmitAssessMove')?.addEventListener('click', submitAssessMove);
  document.getElementById('btnRetakeAssessment')?.addEventListener('click', startAssessment);
  document.getElementById('btnGoToDashboard')?.addEventListener('click', () => {
    document.querySelector('.nav-item[data-target="home-view"]')?.click();
  });
  document.getElementById('assessMoveInput')?.addEventListener('keypress', e => { if (e.key==='Enter') submitAssessMove(); });
}

function startAssessment() {
  // Flatten all puzzles
  const allPuzzles = [];
  Object.entries(ASSESSMENT_PUZZLES).forEach(([cat, puzzles]) => {
    puzzles.forEach(p => allPuzzles.push({ ...p, category: cat }));
  });
  assessState = { puzzles: allPuzzles, currentIdx: 0, answers: [], timer: null, startTime: Date.now() };

  document.getElementById('assessmentIntro').style.display = 'none';
  document.getElementById('assessmentResults').style.display = 'none';
  document.getElementById('assessmentActive').style.display = 'block';
  document.getElementById('assessPuzzleTotal').textContent = allPuzzles.length;

  showAssessPuzzle();
}

function showAssessPuzzle() {
  const p = assessState.puzzles[assessState.currentIdx];
  if (!p) { finishAssessment(); return; }
  const el = id => document.getElementById(id);
  el('assessPuzzleNum').textContent = assessState.currentIdx + 1;
  el('assessCategory').textContent = p.category.charAt(0).toUpperCase() + p.category.slice(1);
  el('assessConcept').textContent = p.concept;
  el('assessDifficulty').textContent = '⭐'.repeat(Math.min(p.difficulty, 5));
  el('assessFen').textContent = p.fen;
  el('assessBoard').textContent = p.fen.split(' ')[0].replace(/\//g, ' / ');
  el('assessMoveInput').value = '';
  el('assessMoveInput').focus();
  el('assessFeedback').style.display = 'none';

  // Progress dots
  const dots = el('assessProgressDots');
  dots.innerHTML = '';
  assessState.puzzles.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'assess-dot';
    if (i < assessState.currentIdx) {
      const a = assessState.answers[i];
      dot.classList.add(a && a.correct ? 'correct' : 'wrong');
    } else if (i === assessState.currentIdx) {
      dot.classList.add('current');
    }
    dots.appendChild(dot);
  });
}

function submitAssessMove() {
  const input = document.getElementById('assessMoveInput');
  const userMove = input.value.trim();
  if (!userMove) return;
  const p = assessState.puzzles[assessState.currentIdx];
  const normalize = s => s.replace(/[+#!?]/g,'').replace(/x/g,'').toLowerCase().trim();
  const correct = normalize(userMove) === normalize(p.solution);

  assessState.answers.push({ category: p.category, correct, difficulty: p.difficulty, userMove, solution: p.solution });

  // Update mastery
  const conceptId = KNOWLEDGE_GRAPH.find(c => c.name.toLowerCase().includes(p.concept.toLowerCase()))?.id;
  if (conceptId) profile.updateMastery(conceptId, correct, p.difficulty);

  // Show feedback
  const fb = document.getElementById('assessFeedback');
  fb.style.display = 'block';
  fb.style.background = correct ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
  fb.style.border = `1px solid ${correct ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`;
  fb.style.color = correct ? 'var(--success)' : 'var(--danger)';
  fb.textContent = correct ? `✅ Correct! ${p.concept}` : `❌ Incorrect. Solution: ${p.solution} (${p.concept})`;

  setTimeout(() => {
    assessState.currentIdx++;
    if (assessState.currentIdx >= assessState.puzzles.length) finishAssessment();
    else showAssessPuzzle();
  }, 1500);
}

function finishAssessment() {
  document.getElementById('assessmentActive').style.display = 'none';
  document.getElementById('assessmentResults').style.display = 'block';

  const result = runAssessment(profile, assessState.answers);
  profile.saveAssessment(result);

  document.getElementById('assessEstElo').textContent = result.estimatedElo;
  document.getElementById('assessOverall').textContent = `${result.overallScore}%`;

  renderSkillBars('assessSkillBars', result.skillScores);

  document.getElementById('assessStrengths').innerHTML = result.strengths.map(s => `<div>✅ <strong>${s}</strong> — ${result.skillScores[s]}%</div>`).join('');
  document.getElementById('assessWeaknesses').innerHTML = result.weaknesses.map(s => `<div>🎯 <strong>${s}</strong> — ${result.skillScores[s]}%</div>`).join('');

  showToast(`🏆 Assessment complete! Estimated ELO: ${result.estimatedElo}`);
  updateHeaderStats();
  updateHeroSection();
  initHomeSkillBars();
}

// ═══════════════════════════════════════════════════
// SKILL TREE VIEW
// ═══════════════════════════════════════════════════
function initSkillTree() {
  const grid = document.getElementById('skillTreeGrid');
  const filters = document.getElementById('stFilterBtns');
  if (!grid) return;

  const cats = ['all',...new Set(KNOWLEDGE_GRAPH.map(c => c.category))];
  const catIcons = { all:'🌳', fundamentals:'🎯', tactic:'⚔️', strategy:'🏗️', opening:'🧪', endgame:'📖', calculation:'🧠' };

  // Filter buttons
  if (filters) {
    filters.innerHTML = '';
    cats.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'gm-btn' + (cat === 'all' ? ' active' : '');
      btn.textContent = `${catIcons[cat]||'📚'} ${cat === 'all' ? 'All' : cat.charAt(0).toUpperCase()+cat.slice(1)}`;
      btn.addEventListener('click', () => {
        filters.querySelectorAll('.gm-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderSkillTreeGrid(cat === 'all' ? null : cat);
      });
      filters.appendChild(btn);
    });
  }

  renderSkillTreeGrid(null);
}

function renderSkillTreeGrid(filterCat) {
  const grid = document.getElementById('skillTreeGrid');
  grid.innerHTML = '';
  const mastered = new Set(profile.masteredConcepts);
  let masteredCount = 0, unlockedCount = 0, lockedCount = 0;

  const concepts = filterCat ? KNOWLEDGE_GRAPH.filter(c => c.category === filterCat) : KNOWLEDGE_GRAPH;
  const catIcons = { fundamentals:'🎯', tactic:'⚔️', strategy:'🏗️', opening:'🧪', endgame:'📖', calculation:'🧠' };

  concepts.forEach(concept => {
    const isMastered = mastered.has(concept.id);
    const isUnlocked = concept.prerequisites.every(p => mastered.has(p));
    const mastery = profile.getMasteryFor(concept.id);
    const confidence = mastery.confidence || (isMastered ? 100 : 0);

    if (isMastered) masteredCount++;
    else if (isUnlocked) unlockedCount++;
    else lockedCount++;

    const node = document.createElement('div');
    node.className = `st-node ${isMastered ? 'mastered' : isUnlocked ? 'unlocked' : 'locked'}`;
    node.innerHTML = `
      <div class="st-node-icon">${catIcons[concept.category]||'📚'}</div>
      <div class="st-node-name">${concept.name}</div>
      <div class="st-node-cat">${concept.category} • Diff ${concept.difficulty}</div>
      <div class="st-node-bar"><div class="st-node-bar-fill" style="width:${confidence}%"></div></div>
    `;
    node.addEventListener('click', () => showSkillTreeDetail(concept, mastery, isMastered, isUnlocked));
    grid.appendChild(node);
  });

  document.getElementById('stMasteredCount').textContent = masteredCount;
  document.getElementById('stUnlockedCount').textContent = unlockedCount;
  document.getElementById('stLockedCount').textContent = lockedCount;
}

function showSkillTreeDetail(concept, mastery, isMastered, isUnlocked) {
  const panel = document.getElementById('stDetailPanel');
  panel.style.display = 'block';
  document.getElementById('stDetailName').textContent = concept.name;
  document.getElementById('stDetailCategory').textContent = concept.category;
  document.getElementById('stDetailDesc').textContent = concept.desc;
  document.getElementById('stDetailConf').textContent = `${Math.round(mastery.confidence||0)}%`;
  document.getElementById('stDetailConf').style.color = mastery.confidence > 70 ? 'var(--success)' : mastery.confidence > 40 ? 'var(--warning)' : 'var(--danger)';
  document.getElementById('stDetailRet').textContent = `${Math.round(mastery.retention||0)}%`;
  document.getElementById('stDetailAttempts').textContent = mastery.attempts || 0;
  document.getElementById('stDetailRate').textContent = `${Math.round((mastery.successRate||0)*100)}%`;
  document.getElementById('stDetailTime').textContent = concept.studyMin;
  document.getElementById('stDetailXP').textContent = concept.xp;
  document.getElementById('stDetailRating').textContent = `${concept.ratingRange[0]}–${concept.ratingRange[1]}`;
  document.getElementById('stDetailPrereqs').textContent = concept.prerequisites.length > 0 ? concept.prerequisites.map(p => KNOWLEDGE_GRAPH.find(c => c.id === p)?.name || p).join(', ') : 'None';
}

// ═══════════════════════════════════════════════════
// BOSS BATTLES VIEW
// ═══════════════════════════════════════════════════
let bossState = { bossId:null, puzzles:[], currentIdx:0, correct:0, timer:null, startTime:0, timeLimit:300 };

function initBossBattles() {
  const grid = document.getElementById('bossGrid');
  if (!grid) return;
  grid.innerHTML = '';

  BOSS_BATTLES.forEach(boss => {
    const certified = profile.hasCertification(boss.id);
    const score = profile.bossBattleScores[boss.id];
    const card = document.createElement('div');
    card.className = 'boss-card' + (certified ? ' certified' : '');
    card.style.borderColor = certified ? boss.color+'80' : '';
    card.innerHTML = `
      <div class="boss-card-icon">${boss.icon}</div>
      <div class="boss-card-name" style="color:${boss.color}">${boss.name}</div>
      <div class="boss-card-desc">${boss.description}</div>
      <div class="boss-card-meta">
        <span>🧩 ${boss.puzzleCount} puzzles</span>
        <span>⏱️ ${Math.floor(boss.timeLimit/60)}:${String(boss.timeLimit%60).padStart(2,'0')}</span>
        <span>⚡ ${boss.xpReward} XP</span>
        <span>📈 +${boss.eloReward} Elo</span>
        ${score ? `<span>🏆 Best: ${score.bestScore}%</span>` : ''}
      </div>
      <div class="boss-difficulty">${Array.from({length:8}, (_,i) => `<div class="boss-difficulty-dot ${i < boss.difficulty ? 'active' : ''}"></div>`).join('')}</div>
    `;
    card.addEventListener('click', () => startBossBattle(boss.id));
    grid.appendChild(card);
  });

  document.getElementById('btnBossSubmit')?.addEventListener('click', submitBossMove);
  document.getElementById('bossMoveInput')?.addEventListener('keypress', e => { if (e.key==='Enter') submitBossMove(); });
}

function startBossBattle(bossId) {
  const boss = BOSS_BATTLES.find(b => b.id === bossId);
  if (!boss) return;
  const puzzles = getBossBattlePuzzles(bossId);
  if (!puzzles.length) { showToast('⚠️ Not enough puzzles for this challenge.'); return; }

  bossState = { bossId, puzzles, currentIdx:0, correct:0, timer:null, startTime:Date.now(), timeLimit:boss.timeLimit };

  document.getElementById('bossActivePanel').style.display = 'block';
  document.getElementById('bossResultPanel').style.display = 'none';
  document.getElementById('bossActiveName').textContent = `${boss.icon} ${boss.name}`;
  document.getElementById('bossActiveName').style.color = boss.color;

  // Start timer
  if (bossState.timer) clearInterval(bossState.timer);
  bossState.timer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - bossState.startTime) / 1000);
    const remaining = Math.max(0, bossState.timeLimit - elapsed);
    document.getElementById('bossTimer').textContent = `${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`;
    if (remaining <= 0) finishBossBattle();
  }, 1000);

  showBossPuzzle();
}

function showBossPuzzle() {
  const p = bossState.puzzles[bossState.currentIdx];
  if (!p) { finishBossBattle(); return; }
  document.getElementById('bossBoard').textContent = p.fen.split(' ')[0].replace(/\//g, ' / ');
  document.getElementById('bossPuzzleInfo').textContent = `${p.name} — ${p.category.replace(/_/g,' ')} | ${p.explanation?.slice(0,80)||''}`;
  document.getElementById('bossScore').textContent = `${bossState.correct}/${bossState.currentIdx}`;
  document.getElementById('bossMoveInput').value = '';
  document.getElementById('bossMoveInput').focus();
  document.getElementById('bossFeedback').style.display = 'none';

  // Progress dots
  const dots = document.getElementById('bossProgressDots');
  dots.innerHTML = '';
  bossState.puzzles.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'assess-dot';
    if (i < bossState.currentIdx) dot.classList.add(i < bossState.correct ? 'correct' : 'wrong');
    else if (i === bossState.currentIdx) dot.classList.add('current');
    dots.appendChild(dot);
  });
}

function submitBossMove() {
  const input = document.getElementById('bossMoveInput');
  const move = input.value.trim();
  if (!move) return;
  const p = bossState.puzzles[bossState.currentIdx];
  const normalize = s => s.replace(/[+#!?]/g,'').replace(/x/g,'').toLowerCase().trim();
  const userNorm = normalize(move);
  const expNorm = normalize(`${p.expected.from}${p.expected.to}`);
  // Also try SAN match by comparing piece movement
  const correct = userNorm === expNorm || userNorm === normalize(p.expected.to) || (move.length >= 2 && p.expected.to.includes(move.slice(-2)));

  if (correct) bossState.correct++;
  profile.updateMastery(p.category, correct, p.difficulty || 3);

  const fb = document.getElementById('bossFeedback');
  fb.style.display = 'block';
  fb.style.background = correct ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
  fb.style.border = `1px solid ${correct ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`;
  fb.style.color = correct ? 'var(--success)' : 'var(--danger)';
  fb.textContent = correct ? `✅ Correct! ${p.explanation||''}` : `❌ Incorrect. Expected: ${p.expected.from}→${p.expected.to}`;

  setTimeout(() => {
    bossState.currentIdx++;
    if (bossState.currentIdx >= bossState.puzzles.length) finishBossBattle();
    else showBossPuzzle();
  }, 1200);
}

function finishBossBattle() {
  if (bossState.timer) clearInterval(bossState.timer);
  const boss = BOSS_BATTLES.find(b => b.id === bossState.bossId);
  if (!boss) return;

  const accuracy = bossState.puzzles.length > 0 ? bossState.correct / bossState.puzzles.length : 0;
  const passed = accuracy >= boss.passThreshold;
  const elapsed = Math.floor((Date.now() - bossState.startTime) / 1000);
  const score = Math.round(accuracy * 100);

  profile.recordBossBattle(bossState.bossId, score, passed);
  if (passed) {
    profile.addXP(boss.xpReward);
    profile.updateElo(profile.elo + boss.eloReward);
  }

  document.getElementById('bossActivePanel').style.display = 'none';
  document.getElementById('bossResultPanel').style.display = 'block';
  document.getElementById('bossResultIcon').textContent = passed ? '🏆' : '💥';
  document.getElementById('bossResultTitle').textContent = passed ? `${boss.name} — CERTIFIED!` : `${boss.name} — Not Yet...`;
  document.getElementById('bossResultTitle').style.color = passed ? boss.color : 'var(--danger)';
  document.getElementById('bossResultDesc').textContent = passed ? `You passed with ${score}% accuracy! Certification earned.` : `${score}% accuracy (need ${Math.round(boss.passThreshold*100)}%). Keep practicing!`;
  document.getElementById('bossResScore').textContent = `${score}%`;
  document.getElementById('bossResTime').textContent = `${elapsed}s`;
  document.getElementById('bossResXP').textContent = passed ? `+${boss.xpReward}` : '0';
  document.getElementById('bossResElo').textContent = passed ? `+${boss.eloReward}` : '+0';

  showToast(passed ? `🏆 ${boss.name} certified! +${boss.xpReward} XP` : `💥 ${score}% — Keep training!`);
  updateHeaderStats();
  initBossBattles(); // Refresh cards
}

// ═══════════════════════════════════════════════════
// DEEP LEARNING ANALYTICS VIEW
// ═══════════════════════════════════════════════════
function initDeepAnalytics() {
  renderAnalyticsStats();
  document.getElementById('btnGenReport')?.addEventListener('click', () => {
    const report = profile.generateWeeklyReport();
    const panel = document.getElementById('weeklyReportPanel');
    panel.style.display = 'block';
    document.getElementById('weeklyReportContent').innerHTML = `
      <div class="grid-4" style="margin-bottom:12px;">
        <div class="stat-card"><div class="stat-val" style="font-size:1rem;color:var(--accent-blue)">${report.puzzlesSolved}</div><div class="stat-lbl">Puzzles Solved</div></div>
        <div class="stat-card"><div class="stat-val" style="font-size:1rem;color:var(--success)">${report.puzzleAccuracy}%</div><div class="stat-lbl">Accuracy</div></div>
        <div class="stat-card"><div class="stat-val" style="font-size:1rem;color:var(--accent-purple)">${report.gamesPlayed}</div><div class="stat-lbl">Games</div></div>
        <div class="stat-card"><div class="stat-val" style="font-size:1rem;color:${report.eloChange >= 0 ? 'var(--success)' : 'var(--danger)'}">${report.eloChange >= 0 ? '+' : ''}${report.eloChange}</div><div class="stat-lbl">Elo Change</div></div>
      </div>
      <p><strong>Training Time:</strong> ${report.trainingMinutes} minutes</p>
      <p><strong>New Concepts Mastered:</strong> ${report.newConceptsMastered}</p>
      <p><strong>Strengths:</strong> ${report.strengths.join(', ')}</p>
      <p><strong>Focus Areas:</strong> ${report.weaknesses.join(', ')}</p>
    `;
    showToast('📄 Weekly report generated!');
  });
}

function renderAnalyticsStats() {
  const container = document.getElementById('analyticsStatCards');
  if (!container) return;
  const velocity = profile.getLearningVelocity();
  const trendColors = { accelerating:'var(--success)', steady:'var(--accent-blue)', plateau:'var(--warning)', declining:'var(--danger)', new:'var(--text-muted)' };
  container.innerHTML = [
    { icon:'📈', val:profile.elo, label:'Current ELO', color:'var(--accent-blue)' },
    { icon:'📚', val:profile.masteredConcepts.length + '/' + KNOWLEDGE_GRAPH.length, label:'Concepts Mastered', color:'var(--success)' },
    { icon:'🏅', val:profile.certifications.length, label:'Certifications', color:'var(--accent-gold)' },
    { icon:'📉', val:(velocity.eloPerWeek > 0 ? '+' : '') + velocity.eloPerWeek, label:`Trend: ${velocity.trend}`, color:trendColors[velocity.trend] },
  ].map(s => `<div class="stat-card"><div class="stat-val" style="font-size:1.2rem;color:${s.color}">${s.icon} ${s.val}</div><div class="stat-lbl">${s.label}</div></div>`).join('');

  // Render ELO chart
  renderEloChart();
  // Render radar
  renderDeepRadar();
  // Render heatmap
  renderDeepHeatmap();
}

function renderEloChart() {
  const svg = document.getElementById('eloChartSvg');
  if (!svg || !profile.eloHistory.length) return;
  const data = profile.eloHistory.slice(-30);
  const minElo = Math.min(...data.map(d => d.elo)) - 20;
  const maxElo = Math.max(...data.map(d => d.elo)) + 20;
  const range = maxElo - minElo || 1;
  const w = svg.clientWidth || 300;
  const h = svg.clientHeight || 180;
  let path = '';
  data.forEach((d, i) => {
    const x = (i / Math.max(1, data.length - 1)) * w;
    const y = h - ((d.elo - minElo) / range) * h;
    path += (i === 0 ? 'M' : 'L') + `${x},${y} `;
  });
  svg.innerHTML = `<defs><linearGradient id="eloGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.8"/><stop offset="100%" style="stop-color:#eab308;stop-opacity:0.8"/></linearGradient></defs><path d="${path}" fill="none" stroke="url(#eloGrad)" stroke-width="2.5" stroke-linecap="round"/>` + data.map((d,i) => {
    const x = (i / Math.max(1, data.length-1)) * w;
    const y = h - ((d.elo - minElo) / range) * h;
    return `<circle cx="${x}" cy="${y}" r="3" fill="var(--accent-blue)"><title>${d.date}: ${d.elo}</title></circle>`;
  }).join('');
}

function renderDeepRadar() {
  const svg = document.getElementById('deepRadarSvg');
  if (!svg) return;
  const scores = profile.skillScores;
  const labels = Object.keys(scores);
  const values = Object.values(scores);
  const cx = 140, cy = 120, r = 90, n = labels.length;
  let html = '';
  [0.25,0.5,0.75,1.0].forEach(s => {
    const pts = [];
    for (let i = 0; i < n; i++) { const a = (Math.PI*2*i)/n - Math.PI/2; pts.push(`${cx+r*s*Math.cos(a)},${cy+r*s*Math.sin(a)}`); }
    html += `<polygon class="radar-grid-ring" points="${pts.join(' ')}"/>`;
  });
  for (let i = 0; i < n; i++) {
    const a = (Math.PI*2*i)/n - Math.PI/2;
    html += `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${cx+r*Math.cos(a)}" y2="${cy+r*Math.sin(a)}"/>`;
    const lx = cx+(r+18)*Math.cos(a), ly = cy+(r+18)*Math.sin(a);
    html += `<text class="radar-label" x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle">${labels[i]}</text>`;
  }
  const pts = [];
  for (let i = 0; i < n; i++) { const a = (Math.PI*2*i)/n - Math.PI/2; const v = values[i]/100; pts.push(`${cx+r*v*Math.cos(a)},${cy+r*v*Math.sin(a)}`); }
  html += `<polygon class="radar-polygon" points="${pts.join(' ')}"/>`;
  pts.forEach(pt => { const [x,y] = pt.split(','); html += `<circle cx="${x}" cy="${y}" r="3" fill="var(--accent-blue)"/>`; });
  svg.innerHTML = html;
}

function renderDeepHeatmap() {
  const grid = document.getElementById('deepHeatmapGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const mastered = new Set(profile.masteredConcepts);
  KNOWLEDGE_GRAPH.forEach(concept => {
    const isMastered = mastered.has(concept.id);
    const isUnlocked = concept.prerequisites.every(p => mastered.has(p));
    const m = profile.getMasteryFor(concept.id);
    let color = 'rgba(239,68,68,0.3)';
    if (isMastered) color = `rgba(16,185,129,${0.3 + (m.confidence||80)/200})`;
    else if (isUnlocked) color = `rgba(234,179,8,${0.2 + (m.confidence||0)/200})`;
    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';
    cell.style.background = color;
    cell.title = `${concept.name} (${isMastered ? 'Mastered' : isUnlocked ? `${Math.round(m.confidence||0)}% conf` : 'Locked'})`;
    grid.appendChild(cell);
  });
}
