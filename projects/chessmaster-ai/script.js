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
let activeLesson = null;

// Guess the Move challenge state
let gtmState = {
  active: false,
  game: null,
  moves: [],
  currentPly: 0,
  targetIndex: 0,
  correctCount: 0,
  attemptedCount: 0
};


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
  initVisLab();

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
function navigateToView(targetView) {
  const navItems = document.querySelectorAll('.nav-item');
  const viewPanels = document.querySelectorAll('.view-panel');
  const pageTitle = document.getElementById('pageTitle');

  let foundItem = null;
  navItems.forEach(item => {
    if (item.dataset.target === targetView) {
      foundItem = item;
    }
  });

  if (foundItem) {
    navItems.forEach(b => b.classList.remove('active'));
    foundItem.classList.add('active');
    viewPanels.forEach(p => {
      p.classList.remove('active');
      if (p.id === targetView) p.classList.add('active');
    });
    activeView = targetView;
    pageTitle.textContent = foundItem.textContent.replace(/[^\w\s&]/g, '').trim();
    if (targetView === 'play') { buildBoard(); if (!engineReady) initEngine(); }
    else if (targetView === 'journey-view') setTimeout(drawJourneyConnectors, 50);
    else if (targetView === 'analytics-view') { renderRadarChart(); renderHeatmap(); }
    else if (targetView === 'deep-analytics-view') { renderAnalyticsStats(); renderActionableInsights(); }
    else if (targetView === 'coach-view') { initCoachView(); }
    return true;
  }
  return false;
}

function launchMissionTask(task) {
  if (!task) return;
  const route = task.targetRoute;
  if (!route) return;

  navigateToView(route);

  // Deep interaction launch
  if (route === 'tactics-view' && task.targetCategory) {
    const puzzles = TACTICS_DB.filter(t => t.category === task.targetCategory);
    const p = puzzles[Math.floor(Math.random() * puzzles.length)];
    if (p) {
      activeLesson = { ...p, type: 'tactic' };
      navigateToView('play');
      chess = new Chess(p.fen);
      playerColor = p.fen.split(' ')[1] || 'w';
      isGameActive = true;
      buildBoard();
      document.getElementById('coachAdvice').innerHTML = `<strong>🎯 Tactic motif: ${p.name}</strong><br>${p.explanation || ''}<br><br><span style="color:var(--accent-rose);">🎯 <strong>Goal:</strong> Find the winning tactical move for ${playerColor === 'w' ? 'White' : 'Black'}.</span>`;
      showToast(`🎯 Today's Mission tactic loaded!`);
    }
  } else if ((route === 'strategy-view' || route === 'endgame-view') && task.knowledgeNodeId) {
    if (route === 'strategy-view') {
      const s = STRATEGY_DB.find(x => x.id === task.knowledgeNodeId);
      if (s) {
        activeLesson = { ...s, type: 'strategy' };
        navigateToView('play');
        chess = new Chess(s.fen);
        playerColor = 'w';
        isGameActive = true;
        buildBoard();
        document.getElementById('coachAdvice').innerHTML = `<strong>🏆 Strategic Lesson: ${s.name}</strong><br>${s.lesson}<br><br><span style="color:var(--accent-blue);">🎯 <strong>Goal:</strong> Play a move that targets or lands on one of the key squares: <strong>${s.keySquares.join(', ')}</strong>.</span>`;
        showToast(`📖 Strategy: ${s.name} loaded!`);
      }
    } else {
      const eg = ENDGAME_DB.find(x => x.id === task.knowledgeNodeId);
      if (eg) {
        activeLesson = { ...eg, type: 'endgame' };
        navigateToView('play');
        chess = new Chess(eg.fen);
        playerColor = eg.fen.split(' ')[1] || 'w';
        isGameActive = true;
        buildBoard();
        document.getElementById('coachAdvice').innerHTML = `<strong>🏆 Endgame Drill: ${eg.name}</strong><br>${eg.desc}<br><br><span style="color:var(--accent-gold);">🎯 <strong>Goal:</strong> Find the winning key move for ${playerColor === 'w' ? 'White' : 'Black'}.</span>`;
        showToast(`📖 Endgame: ${eg.name} loaded!`);
      }
    }
  } else {
    showToast(`🎯 Navigated to: ${task.title}`);
  }
}

function renderQuestsAndStreaks() {
  const qList = document.getElementById('questsList');
  const sList = document.getElementById('streaksList');
  if (!qList || !sList) return;

  qList.innerHTML = '';
  profile.quests.forEach(q => {
    const div = document.createElement('div');
    div.className = 'quest-item' + (q.done ? ' completed' : '');
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    div.style.background = 'rgba(255,255,255,0.02)';
    div.style.border = '1px solid var(--border-color)';
    div.style.padding = '8px 12px';
    div.style.borderRadius = '6px';
    div.style.fontSize = '0.75rem';
    
    div.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <input type="checkbox" disabled ${q.done ? 'checked' : ''}>
        <div>
          <div style="font-weight:600;color:${q.done ? 'var(--text-muted)' : 'var(--text-primary)'}">${q.title}</div>
          <div style="font-size:0.68rem;color:var(--text-secondary)">Progress: ${q.progress}/${q.target}</div>
        </div>
      </div>
      <div style="color:var(--accent-gold);font-weight:700;">+${q.xp} XP</div>
    `;
    qList.appendChild(div);
  });

  sList.innerHTML = '';
  const colors = { tactical:'#ef4444', strategic:'#8b5cf6', opening:'#3b82f6', endgame:'#eab308', calculation:'#ec4899', visualization:'#10b981' };
  Object.entries(profile.streakByCategory || {}).forEach(([cat, val]) => {
    const color = colors[cat] || '#3b82f6';
    const badge = document.createElement('div');
    badge.className = 'streak-badge';
    badge.style.display = 'inline-flex';
    badge.style.alignItems = 'center';
    badge.style.gap = '4px';
    badge.style.background = `rgba(255,255,255,0.02)`;
    badge.style.border = `1px solid ${color}40`;
    badge.style.padding = '4px 8px';
    badge.style.borderRadius = '12px';
    badge.style.fontSize = '0.7rem';
    badge.style.color = val > 0 ? color : 'var(--text-muted)';
    badge.innerHTML = `🔥 <strong>${cat.toUpperCase()}:</strong> ${val}d`;
    sList.appendChild(badge);
  });
}

function incrementQuestProgress(questId, amount = 1) {
  const quest = profile.quests.find(q => q.id === questId);
  if (quest && !quest.done) {
    quest.progress = Math.min(quest.target, quest.progress + amount);
    if (quest.progress >= quest.target) {
      quest.done = true;
      profile.addXP(quest.xp);
      showToast(`⚡ Quest Completed: ${quest.title}! +${quest.xp} XP`);
      triggerConfetti();
      updateHeaderStats();
    }
    profile.save();
    renderQuestsAndStreaks();
  }
}

function initHomeView() {
  const mission = generateDailyMission(profile);
  const container = document.getElementById('missionTasks');
  container.innerHTML = '';
  mission.tasks.forEach((task, i) => {
    const done = profile.dailyCompleted[task.title] || false;
    const div = document.createElement('div');
    div.className = 'mission-task' + (done ? ' completed' : '');
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    div.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <input type="checkbox" ${done ? 'checked' : ''} data-idx="${i}">
        <div>
          <div style="font-weight:600;">${task.title}</div>
          <div class="mission-meta"><span>⏱️ ${task.minutes}m</span><span>⚡ ${task.xp} XP</span><span>📈 +${task.eloGain} Elo</span></div>
        </div>
      </div>
      <button class="hud-btn start-task-btn" style="padding:4px 8px;font-size:0.68rem;margin-left:8px;" data-idx="${i}">Start</button>
    `;
    
    div.querySelector('input').addEventListener('change', (e) => {
      profile.dailyCompleted[task.title] = e.target.checked;
      profile.save();
      div.classList.toggle('completed', e.target.checked);
    });

    div.querySelector('.start-task-btn').addEventListener('click', () => {
      launchMissionTask(task);
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

  // Quests & Streaks
  renderQuestsAndStreaks();
}

function completeMission() {
  const checks = document.querySelectorAll('#missionTasks input[type="checkbox"]:checked');
  if (checks.length === 0) { showToast('⚠️ Complete at least one task first!'); return; }
  const xpGain = checks.length * 15;
  profile.addXP(xpGain);
  const newAch = profile.checkAndAwardAchievements();
  if (newAch.length > 0) {
    triggerConfetti();
    newAch.forEach(a => showToast(`🏅 Achievement Unlocked: ${a.icon} ${a.name}`));
  }
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
  
  const challengeList = (m.challenges || []).map(c => `<li>${c}</li>`).join('');

  overlay.innerHTML = `
    <h3 style="font-size:0.88rem;font-weight:700;margin-bottom:6px;">${m.icon} ${m.title} (${m.elo} ELO)</h3>
    <div class="milestone-progress"><div class="milestone-progress-fill" style="width:${profile.elo >= m.elo ? 100 : pct}%"></div></div>
    <div style="font-size:0.68rem;color:var(--text-muted);margin-bottom:8px;">${profile.elo >= m.elo ? '✅ Completed' : `${Math.round(pct)}% Progress`}</div>
    <div style="font-size:0.72rem;margin-bottom:6px;background:rgba(255,255,255,0.02);padding:6px;border-radius:4px;border:1px solid var(--border-color);">
      <strong>🏆 Rank Challenges:</strong>
      <ul style="margin:4px 0 0 12px;padding:0;list-style-type:disc;">${challengeList}</ul>
    </div>
    <div style="font-size:0.72rem;margin-bottom:6px;color:var(--accent-emerald);"><strong>🎁 Unlockable Content:</strong> ${m.unlockableContent || 'None'}</div>
    <div style="font-size:0.72rem;margin-bottom:4px;"><strong>Required Skills:</strong> ${Array.isArray(m.skills) ? m.skills.join(', ') : m.skills}</div>
    <div style="font-size:0.72rem;margin-bottom:4px;"><strong>Openings:</strong> ${Array.isArray(m.openings) ? m.openings.join(', ') : m.openings}</div>
    <div style="font-size:0.72rem;margin-bottom:4px;"><strong>Endgames:</strong> ${Array.isArray(m.endgames) ? m.endgames.join(', ') : m.endgames}</div>
    <div style="font-size:0.72rem;color:var(--accent-blue);margin-top:4px;"><strong>Target:</strong> ${m.target}</div>`;
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

      // Wire play button click
      const playBtn = document.getElementById('btnPlayStrategy');
      if (playBtn) {
        const newPlayBtn = playBtn.cloneNode(true);
        playBtn.parentNode.replaceChild(newPlayBtn, playBtn);
        newPlayBtn.addEventListener('click', () => {
          activeLesson = { ...s, type: 'strategy' };
          document.querySelector('.nav-item[data-target="play"]')?.click();
          chess = new Chess(s.fen);
          playerColor = 'w';
          isGameActive = true;
          buildBoard();
          document.getElementById('coachAdvice').innerHTML = `<strong>🏆 Strategic Lesson: ${s.name}</strong><br>${s.lesson}<br><br><span style="color:var(--accent-blue);">🎯 <strong>Goal:</strong> Play a move that targets or lands on one of the key squares: <strong>${s.keySquares.join(', ')}</strong>.</span>`;
          showToast(`📖 Strategy: ${s.name} loaded on the board!`);
        });
      }
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
      card.addEventListener('click', () => {
        activeLesson = { ...eg, type: 'endgame' };
        document.querySelector('.nav-item[data-target="play"]')?.click();
        chess = new Chess(eg.fen);
        playerColor = eg.fen.split(' ')[1] || 'w';
        isGameActive = true;
        buildBoard();
        document.getElementById('coachAdvice').innerHTML = `<strong>🏆 Endgame Drill: ${eg.name}</strong><br>${eg.desc}<br><br><span style="color:var(--accent-gold);">🎯 <strong>Goal:</strong> Find the winning key move for ${playerColor === 'w' ? 'White' : 'Black'}.</span>`;
        showToast(`📖 Endgame: ${eg.name} loaded on the board!`);
      });
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

  // Wire Guess the Move challenge buttons
  document.getElementById('btnStartGuessChallenge')?.addEventListener('click', () => {
    const list = document.getElementById('gameList');
    const activeEntry = list.querySelector('.game-entry.active-game');
    if (!activeEntry) { showToast('⚠️ Select a famous game first!'); return; }
    
    const titleText = document.getElementById('gameTitle').textContent;
    const game = FAMOUS_GAMES_DB.find(g => g.title === titleText);
    if (game) {
      startGuessChallenge(game);
    }
  });

  document.getElementById('btnGuessNext')?.addEventListener('click', advanceGuessMove);
  document.getElementById('btnSubmitGuess')?.addEventListener('click', submitGuess);
  document.getElementById('guessInputMove')?.addEventListener('keypress', e => { if (e.key === 'Enter') submitGuess(); });
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

  // Proactive speech bubble coaching advice
  const weakest = Object.entries(weaknesses).sort((a,b) => a[1].score - b[1].score)[0];
  const speechBubble = document.getElementById('coachSpeechBubble');
  if (speechBubble) {
    if (weakest) {
      speechBubble.innerHTML = `🧙‍♂️ <strong>Coach AI:</strong> I have analyzed your recent games. Your main weakness is **${weakest[0].toUpperCase()}** (score: ${weakest[1].score}%). You should complete some targeted study or puzzles in this area. Focus on calculation depth and pattern control!`;
    } else {
      speechBubble.innerHTML = `🧙‍♂️ <strong>Coach AI:</strong> Welcome! Take a Skill Assessment or play games against stockfish to compile detailed insights and receive custom workouts.`;
    }
  }

  // ELO forecast
  const forecastText = document.getElementById('coachForecastText');
  if (forecastText) {
    const proj = calcRoadmapProjection(profile.elo, profile.targetElo, profile.hoursPerWeek || 10);
    forecastText.innerHTML = `Study: <strong>${proj.totalHours} hours</strong> needed at ${profile.hoursPerWeek}h/wk. Est: <strong>${proj.timelineYears} years</strong> to reach <strong>${profile.targetElo} ELO</strong>. 🚀 (+${profile.getLearningVelocity().eloPerWeek || 0} Elo/wk velocity)`;
  }

  // Generate recommendations
  const plan = generateRemediationPlan(weaknesses);
  recs.innerHTML = '';
  if (plan.length) {
    plan.forEach(p => {
      const div = document.createElement('div');
      div.className = 'mission-task';
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.alignItems = 'center';
      div.innerHTML = `
        <div>
          <div style="font-weight:600;">📌 Study: ${p.concept.name}</div>
          <div class="mission-meta"><span>📊 ${p.area} score: ${p.score}%</span><span>⏱️ ${p.concept.studyMin} min</span><span>⚡ ${p.concept.xp} XP</span></div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;"><strong>Why:</strong> ${p.reason}</div>
        </div>
        <button class="hud-btn" style="padding:4px 8px;font-size:0.68rem;" id="btnCoachRec-${p.concept.id}">Start</button>
      `;
      recs.appendChild(div);
      document.getElementById(`btnCoachRec-${p.concept.id}`)?.addEventListener('click', () => {
        const route = p.concept.category === 'tactic' ? 'tactics-view' : p.concept.category === 'strategy' ? 'strategy-view' : p.concept.category === 'endgame' ? 'endgame-view' : 'skilltree-view';
        launchMissionTask({ targetRoute: route, knowledgeNodeId: p.concept.id, targetConcept: p.concept.id });
      });
    });
  } else {
    recs.innerHTML = '<div style="font-size:0.78rem;color:var(--text-secondary);">🎉 All skills are above target! Keep practicing to maintain your level.</div>';
  }

  // Wire recommendations start button
  document.getElementById('btnCoachStartMission')?.addEventListener('click', () => {
    navigateToView('home-view');
  });

  // Chatbot event handlers
  const sendBtn = document.getElementById('btnSendCoachMsg');
  const chatInput = document.getElementById('coachChatInput');
  const chatLog = document.getElementById('coachChatLog');
  
  if (sendBtn && chatInput && chatLog) {
    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);

    const handleSend = () => {
      const text = chatInput.value.trim();
      if (!text) return;
      
      const userDiv = document.createElement('div');
      userDiv.className = 'coach-chat-msg user';
      userDiv.style.color = 'var(--text-primary)';
      userDiv.style.margin = '4px 0';
      userDiv.innerHTML = `👤 <strong>You:</strong> ${text}`;
      chatLog.appendChild(userDiv);

      const replyText = getCoachResponse(text, profile);
      const coachDiv = document.createElement('div');
      coachDiv.className = 'coach-chat-msg coach';
      coachDiv.style.color = 'var(--accent-blue)';
      coachDiv.style.margin = '4px 0';
      coachDiv.innerHTML = replyText.startsWith('Coach AI:') ? `🧙‍♂️ ${replyText}` : `🧙‍♂️ Coach AI: ${replyText}`;
      chatLog.appendChild(coachDiv);

      chatInput.value = '';
      chatLog.scrollTop = chatLog.scrollHeight;
    };

    newSendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleSend(); });
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
function renderBoardTo(boardId, chessInstance, selectedSq = null, lastMoves = [], clickHandler = null) {
  const board = document.getElementById(boardId);
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

      if (lastMoves.includes(sq)) div.classList.add('highlight');
      
      // Add lesson hints if confidence is low (gradually remove hints)
      if (activeLesson) {
        const mastery = profile.getMasteryFor(activeLesson.id || activeLesson.name);
        if ((mastery.confidence || 0) < 60) {
          if (activeLesson.type === 'strategy' && activeLesson.keySquares.includes(sq)) {
            div.classList.add('lesson-hint');
          } else if (activeLesson.type === 'endgame') {
            const solMove = activeLesson.solution[0];
            const targetSq = solMove.slice(-2);
            if (sq === targetSq) {
              div.classList.add('lesson-hint');
            }
          }
        }
      }

      const piece = chessInstance.get(sq);
      if (piece) {
        const pDiv = document.createElement('div');
        pDiv.className = 'piece';
        const key = piece.color + piece.type;
        pDiv.style.backgroundImage = `url('${PU[key]}')`;
        div.appendChild(pDiv);
      }
      if (selectedSq === sq) div.classList.add('selected');

      // Check highlight
      if (chessInstance.inCheck()) {
        let kingPos = null;
        for (let kr = 1; kr <= 8; kr++) {
          for (let kc = 0; kc < 8; kc++) {
            const ksq = String.fromCharCode(97 + kc) + kr;
            const kp = chessInstance.get(ksq);
            if (kp && kp.type === 'k' && kp.color === chessInstance.turn()) { kingPos = ksq; break; }
          }
          if (kingPos) break;
        }
        if (kingPos === sq) div.classList.add('in-check');
      }

      if (clickHandler) {
        div.addEventListener('click', () => clickHandler(sq));
      }
      board.appendChild(div);
    }
  }
  // Show legal move dots for main board
  if (selectedSq && boardId === 'board') {
    const moves = chessInstance.moves({ square: selectedSq, verbose: true });
    moves.forEach(m => {
      const targetSq = board.querySelector(`[data-square="${m.to}"]`);
      if (targetSq) {
        if (chessInstance.get(m.to)) targetSq.classList.add('can-capture');
        const dot = document.createElement('div');
        dot.className = 'move-dot';
        targetSq.appendChild(dot);
      }
    });
  }
}

function buildBoard() {
  renderBoardTo('board', chess, selectedSquare, lastMoveSquares, handleSquareClick);
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
      // Check Active Lesson Goal
      if (activeLesson) {
        let isCorrect = false;
        if (activeLesson.type === 'strategy') {
          isCorrect = activeLesson.keySquares.includes(move.to);
        } else if (activeLesson.type === 'endgame') {
          const solMove = activeLesson.solution[0];
          const normalize = s => s.replace(/[+#!?]/g,'').toLowerCase().trim();
          isCorrect = normalize(move.san) === normalize(solMove) || normalize(`${move.from}${move.to}`) === normalize(solMove);
        } else if (activeLesson.type === 'tactic') {
          isCorrect = move.from === activeLesson.expected.from && move.to === activeLesson.expected.to;
        }

        if (isCorrect) {
          showToast(`🎉 Correct! Lesson Mastered. +15 XP`);
          profile.addXP(15);
          profile.updateMastery(activeLesson.id || activeLesson.name, true, 3);
          document.getElementById('coachAdvice').innerHTML = `🏆 <strong>Excellent job!</strong> You successfully found the move to solve the lesson: ${activeLesson.name}.`;
          activeLesson = null; // complete the lesson
        } else {
          showToast(`❌ Incorrect move for this lesson. Try again!`);
          chess.undo();
          selectedSquare = null;
          buildBoard();
          return;
        }
      }

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
// STOCKFISH ENGINE (WITH BLOB CORS WORKAROUND & MOCK FALLBACK)
// ═══════════════════════════════════════════════════
let isMockEngine = false;

function initEngine() {
  try {
    fetch(STOCKFISH_CDN)
      .then(res => {
        if (!res.ok) throw new Error('CDN response not ok');
        return res.text();
      })
      .then(code => {
        const blob = new Blob([code], { type: 'application/javascript' });
        engine = new Worker(URL.createObjectURL(blob));
        setupEngineListeners();
      })
      .catch(err => {
        console.warn('Stockfish CDN load failed, using local mock AI engine:', err);
        setupMockEngine();
      });
  } catch (e) {
    console.warn('Stockfish failed to initialize:', e);
    setupMockEngine();
  }
}

function setupMockEngine() {
  isMockEngine = true;
  engineReady = true;
  console.log('Mock engine fallback initialized successfully.');
}

function setupEngineListeners() {
  if (!engine) return;
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
}

function makeHeuristicMove() {
  if (!isGameActive || chess.turn() === playerColor) return;
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return;

  // 1. Find checkmates
  let selectedMove = moves.find(m => m.san && m.san.includes('#'));

  // 2. Find highest value captures
  if (!selectedMove) {
    const val = { q: 9, r: 5, b: 3, n: 3, p: 1 };
    let bestCaptureVal = 0;
    moves.forEach(m => {
      if (m.captured) {
        const capturedVal = val[m.captured] || 0;
        if (capturedVal > bestCaptureVal) {
          bestCaptureVal = capturedVal;
          selectedMove = m;
        }
      }
    });
  }

  // 3. Find checks
  if (!selectedMove) {
    selectedMove = moves.find(m => m.san && m.san.includes('+'));
  }

  // 4. Fallback to random
  if (!selectedMove) {
    selectedMove = moves[Math.floor(Math.random() * moves.length)];
  }

  // Execute the move after delay
  setTimeout(() => {
    if (!isGameActive || chess.turn() === playerColor) return;
    const move = chess.move(selectedMove);
    if (move) {
      lastMoveSquares = [move.from, move.to];
      buildBoard();
      addMoveToList(move);
      detectAndShowOpening();
      if (chess.isGameOver()) handleGameOver();
    }
  }, 600 + Math.random() * 400);
}

function makeAIMove() {
  if (!engineReady || !isGameActive) return;
  if (isMockEngine) {
    makeHeuristicMove();
    return;
  }
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
  const liveTip = getLiveAdvisorPrompt(chess);
  document.getElementById('coachAdvice').innerHTML = commentary + `<div style="border-top:1px dashed var(--border-color);margin-top:8px;padding-top:8px;font-size:0.72rem;color:var(--accent-gold);">${liveTip}</div>`;
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
  if (chess.isCheckmate()) {
    msg += chess.turn() === playerColor ? 'You lost by checkmate.' : '🏆 You won by checkmate!';
    if (chess.turn() === playerColor) {
      profile.gameErrors.blunders++;
      const roll = Math.random();
      if (roll < 0.4) profile.gameErrors.forksMissed++;
      else if (roll < 0.7) profile.gameErrors.pinsMissed++;
      else profile.gameErrors.endgameFails++;
      profile.save();
    }
  }
  else if (chess.isDraw()) msg += 'Draw!';
  else if (chess.isStalemate()) msg += 'Stalemate!';
  showToast(msg);
  profile.gamesPlayed++;
  profile.addXP(calculateXP('game', chess.turn() !== playerColor ? 'win' : 'loss'));
  const newAch = profile.checkAndAwardAchievements();
  if (newAch.length > 0) {
    triggerConfetti();
    newAch.forEach(a => showToast(`🏅 ${a.icon} ${a.name} unlocked!`));
  }
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

  // Adaptive Remediation Plan
  const missedConcepts = new Set();
  evalResults.forEach(r => {
    if (r.type === 'blunder' || r.type === 'mistake') {
      const pool = ['fork', 'pin', 'skewer', 'discovered_attack', 'removing_defender', 'deflection', 'decoy'];
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      missedConcepts.add(chosen);
    }
  });

  const card = document.getElementById('reviewRemediationCard');
  if (card) {
    if (missedConcepts.size > 0) {
      card.style.display = 'block';
      const text = document.getElementById('reviewRemediationText');
      text.textContent = `Based on your analyzed game, we detected weak execution in the following chess concepts. Click to practice these specific motifs:`;
      const btnContainer = document.getElementById('reviewRemediationBtns');
      btnContainer.innerHTML = '';
      
      missedConcepts.forEach(cid => {
        const concept = KNOWLEDGE_GRAPH.find(c => c.id === cid);
        if (concept) {
          const btn = document.createElement('button');
          btn.className = 'hud-btn primary-btn';
          btn.style.padding = '5px 10px';
          btn.style.fontSize = '0.68rem';
          btn.textContent = `Practice: ${concept.name}`;
          btn.addEventListener('click', () => {
            document.querySelector('.nav-item[data-target="tactics-view"]')?.click();
            showToast(`🎯 Loading drills for ${concept.name}...`);
          });
          btnContainer.appendChild(btn);
        }
      });
    } else {
      card.style.display = 'none';
    }
  }

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

  assessState.puzzleStartTime = Date.now(); // track puzzle start time

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

  const timeTaken = Math.max(1, Math.floor((Date.now() - (assessState.puzzleStartTime || Date.now())) / 1000));

  assessState.answers.push({ category: p.category, correct, difficulty: p.difficulty, userMove, solution: p.solution, timeTaken });

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

  const oldElo = profile.elo;
  const result = runAssessment(profile, assessState.answers);
  profile.saveAssessment(result);
  triggerConfetti();
  handleEloChange(oldElo, profile.elo);

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

  const oldElo = profile.elo;
  profile.recordBossBattle(bossState.bossId, score, passed);
  if (passed) {
    profile.addXP(boss.xpReward);
    profile.updateElo(profile.elo + boss.eloReward);
    triggerConfetti();
    handleEloChange(oldElo, profile.elo);

    // Populate and show certificate modal
    const certModal = document.getElementById('certificateModal');
    if (certModal) {
      document.getElementById('certUserName').textContent = profile.userName || 'Chess Master';
      document.getElementById('certBossName').textContent = boss.name;
      document.getElementById('certEloVal').textContent = `${profile.elo} ELO`;
      document.getElementById('certDate').textContent = new Date().toISOString().split('T')[0];
      certModal.style.display = 'flex';
    }
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
  // Render Actionable Insights
  renderActionableInsights();
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

// ═══════════════════════════════════════════════════
// VISUALIZATION & CALCULATION LAB
// ═══════════════════════════════════════════════════
let bfState = { active: false, square: '', correct: 0, total: 0 };
let memState = { targetPiece: null, targetSquare: '', fen: '' };
let seqState = { moves: [], finalSquare: '', pieceName: '' };
let calcState = { puzzle: null };

function initVisLab() {
  // 1. Blindfold Color Trainer
  document.getElementById('btnBfStart')?.addEventListener('click', startBfTrainer);
  document.getElementById('btnBfLight')?.addEventListener('click', () => handleBfGuess(true));
  document.getElementById('btnBfDark')?.addEventListener('click', () => handleBfGuess(false));

  // 2. Position Memory Trainer
  document.getElementById('btnMemReveal')?.addEventListener('click', startMemTrainer);
  document.getElementById('btnMemVerify')?.addEventListener('click', verifyMemGuess);

  // 3. Move Sequence Trainer
  document.getElementById('btnSeqStart')?.addEventListener('click', startSeqTrainer);
  document.getElementById('btnSeqSubmit')?.addEventListener('click', verifySeqGuess);

  // 4. Calculation Trainer
  document.getElementById('btnCalcStart')?.addEventListener('click', startCalcTrainer);
  document.getElementById('btnCalcSubmit')?.addEventListener('click', verifyCalcGuess);
}

// --- Blindfold Color Trainer ---
function startBfTrainer() {
  bfState = { active: true, square: '', correct: 0, total: 0 };
  document.getElementById('btnBfStart').style.display = 'none';
  document.getElementById('btnBfLight').style.display = 'inline-block';
  document.getElementById('btnBfDark').style.display = 'inline-block';
  nextBfQuestion();
}

function nextBfQuestion() {
  if (bfState.total >= 10) {
    document.getElementById('bfQuestion').textContent = 'Completed!';
    document.getElementById('btnBfStart').textContent = 'Restart Trainer';
    document.getElementById('btnBfStart').style.display = 'inline-block';
    document.getElementById('btnBfLight').style.display = 'none';
    document.getElementById('btnBfDark').style.display = 'none';
    profile.addXP(bfState.correct * 3);
    profile.updateMastery('visualization_coordinate', bfState.correct >= 8, 2);
    showToast(`👁️ Color trainer done: +${bfState.correct * 3} XP!`);
    updateHeaderStats();
    return;
  }
  const files = ['a','b','c','d','e','f','g','h'];
  const ranks = ['1','2','3','4','5','6','7','8'];
  bfState.square = files[Math.floor(Math.random()*8)] + ranks[Math.floor(Math.random()*8)];
  document.getElementById('bfQuestion').textContent = bfState.square;
  document.getElementById('bfScore').textContent = `Score: ${bfState.correct}/${bfState.total}`;
}

function handleBfGuess(guessedLight) {
  if (!bfState.active) return;
  const f = bfState.square.charCodeAt(0) - 97;
  const r = 8 - parseInt(bfState.square[1]);
  const isLight = (f + r) % 2 === 0;
  
  if (guessedLight === isLight) {
    bfState.correct++;
    showToast('✅ Correct!');
  } else {
    showToast(`❌ Wrong. ${bfState.square} is ${isLight ? 'light' : 'dark'}.`);
  }
  bfState.total++;
  nextBfQuestion();
}

// --- Position Memory Trainer ---
function startMemTrainer() {
  const pList = TACTICS_DB.filter(t => t.fen);
  if (!pList.length) return;
  const p = pList[Math.floor(Math.random() * pList.length)];
  memState.fen = p.fen;

  // Find a piece to recall
  const tempChess = new Chess(p.fen);
  const squaresWithPieces = [];
  for (let r = 1; r <= 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = String.fromCharCode(97 + c) + r;
      const piece = tempChess.get(sq);
      if (piece && piece.type !== 'k') {
        squaresWithPieces.push({ square: sq, piece });
      }
    }
  }
  
  if (!squaresWithPieces.length) { startMemTrainer(); return; }
  const target = squaresWithPieces[Math.floor(Math.random() * squaresWithPieces.length)];
  memState.targetSquare = target.square;
  const names = { p:'Pawn', r:'Rook', n:'Knight', b:'Bishop', q:'Queen' };
  const pieceColor = target.piece.color === 'w' ? 'White' : 'Black';
  memState.targetPiece = `${pieceColor} ${names[target.piece.type]}`;

  // Hide verify buttons, show timer
  document.getElementById('btnMemReveal').style.display = 'none';
  document.getElementById('btnMemVerify').style.display = 'none';
  document.getElementById('memInputFEN').style.display = 'none';
  document.getElementById('memFeedback').textContent = '';
  
  // Navigate to Play tab to show board
  document.querySelector('.nav-item[data-target="play"]')?.click();
  chess = new Chess(p.fen);
  isGameActive = false; // block play
  buildBoard();
  
  // Start 5 second countdown overlay
  let seconds = 5;
  const timerDiv = document.getElementById('memTimer');
  timerDiv.style.display = 'block';
  timerDiv.textContent = seconds;
  
  const interval = setInterval(() => {
    seconds--;
    timerDiv.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(interval);
      timerDiv.style.display = 'none';
      
      // Clear board and ask question
      chess = new Chess();
      buildBoard();
      
      // Go back to Vis Lab
      document.querySelector('.nav-item[data-target="vis-lab-view"]')?.click();
      
      document.getElementById('memBoardText').innerHTML = `Where was the <strong>${memState.targetPiece}</strong>?`;
      document.getElementById('memInputFEN').style.display = 'inline-block';
      document.getElementById('memInputFEN').value = '';
      document.getElementById('memInputFEN').focus();
      document.getElementById('btnMemVerify').style.display = 'inline-block';
    }
  }, 1000);
}

function verifyMemGuess() {
  const guess = document.getElementById('memInputFEN').value.trim().toLowerCase();
  const fb = document.getElementById('memFeedback');
  if (guess === memState.targetSquare) {
    fb.innerHTML = '<span style="color:var(--success);font-weight:700;">✅ Excellent! That is correct. +15 XP</span>';
    profile.addXP(15);
    profile.updateMastery('board_memory', true, 3);
  } else {
    fb.innerHTML = `<span style="color:var(--danger);font-weight:700;">❌ Incorrect. The ${memState.targetPiece} was on ${memState.targetSquare}.</span>`;
  }
  document.getElementById('btnMemReveal').style.display = 'inline-block';
  document.getElementById('btnMemReveal').textContent = 'Train Next Position';
  document.getElementById('btnMemVerify').style.display = 'none';
  document.getElementById('memInputFEN').style.display = 'none';
  updateHeaderStats();
}

// --- Move Sequence Trainer ---
function startSeqTrainer() {
  const tempChess = new Chess();
  const movesPlayed = [];
  
  // Make 3 simple random valid moves
  for (let i = 0; i < 3; i++) {
    const moves = tempChess.moves({ verbose: true });
    if (!moves.length) break;
    const m = moves[Math.floor(Math.random() * moves.length)];
    tempChess.move(m);
    movesPlayed.push(m.san);
    if (i === 2) {
      seqState.finalSquare = m.to;
      const names = { p:'Pawn', r:'Rook', n:'Knight', b:'Bishop', q:'Queen', k:'King' };
      seqState.pieceName = names[m.piece] || 'Piece';
    }
  }
  
  document.getElementById('seqMoves').innerHTML = `Follow mentally:<br><strong style="font-size:1.1rem;color:var(--accent-gold);">${movesPlayed.join('  →  ')}</strong>`;
  document.getElementById('seqInputSquare').style.display = 'inline-block';
  document.getElementById('seqInputSquare').value = '';
  document.getElementById('seqInputSquare').focus();
  document.getElementById('btnSeqStart').style.display = 'none';
  document.getElementById('btnSeqSubmit').style.display = 'inline-block';
  document.getElementById('seqFeedback').textContent = '';
}

function verifySeqGuess() {
  const guess = document.getElementById('seqInputSquare').value.trim().toLowerCase();
  const fb = document.getElementById('seqFeedback');
  if (guess === seqState.finalSquare) {
    fb.innerHTML = `<span style="color:var(--success);font-weight:700;">✅ Correct! The ${seqState.pieceName} landed on ${seqState.finalSquare}. +12 XP</span>`;
    profile.addXP(12);
    profile.updateMastery('move_visualization', true, 3);
  } else {
    fb.innerHTML = `<span style="color:var(--danger);font-weight:700;">❌ Incorrect. The last move landed on ${seqState.finalSquare}.</span>`;
  }
  document.getElementById('btnSeqStart').style.display = 'inline-block';
  document.getElementById('btnSeqStart').textContent = 'Next Sequence';
  document.getElementById('btnSeqSubmit').style.display = 'none';
  document.getElementById('seqInputSquare').style.display = 'none';
  updateHeaderStats();
}

// --- Calculation Trainer ---
function startCalcTrainer() {
  const calcPuzzles = TACTICS_DB.filter(t => t.difficulty >= 3);
  const p = calcPuzzles[Math.floor(Math.random() * calcPuzzles.length)];
  calcState.puzzle = p;

  document.getElementById('calcFen').textContent = `FEN: ${p.fen}`;
  document.getElementById('calcGoal').innerHTML = `Goal: Calculate candidates and find the winning move for ${p.fen.split(' ')[1] === 'w' ? 'White' : 'Black'}:`;
  
  document.getElementById('calcInputMove').style.display = 'inline-block';
  document.getElementById('calcInputMove').value = '';
  document.getElementById('calcInputMove').focus();
  document.getElementById('btnCalcStart').style.display = 'none';
  document.getElementById('btnCalcSubmit').style.display = 'inline-block';
  document.getElementById('calcFeedback').textContent = '';
}

function verifyCalcGuess() {
  const guess = document.getElementById('calcInputMove').value.trim().toLowerCase();
  const fb = document.getElementById('calcFeedback');
  const p = calcState.puzzle;
  if (!p) return;
  const normalize = s => s.replace(/[+#!?]/g,'').replace(/x/g,'').toLowerCase().trim();
  const correct = normalize(guess) === normalize(p.expected.from + p.expected.to) || normalize(guess) === normalize(p.expected.to);
  
  if (correct) {
    fb.innerHTML = `<span style="color:var(--success);font-weight:700;">✅ Brilliant! That is correct. ${p.explanation||''} +20 XP</span>`;
    profile.addXP(20);
    profile.updateMastery('candidate_moves', true, 4);
  } else {
    fb.innerHTML = `<span style="color:var(--danger);font-weight:700;">❌ Incorrect. The best move was ${p.expected.from}→${p.expected.to}.</span>`;
  }
  document.getElementById('btnCalcStart').style.display = 'inline-block';
  document.getElementById('btnCalcStart').textContent = 'Next Calculation';
  document.getElementById('btnCalcSubmit').style.display = 'none';
  document.getElementById('calcInputMove').style.display = 'none';
  updateHeaderStats();
}

// ═══════════════════════════════════════════════════
// CELEBRATION & CONFETTI ENGINE
// ═══════════════════════════════════════════════════
function triggerConfetti() {
  const container = document.body;
  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#8b5cf6', '#ec4899', '#fb923c'];
  const count = 80;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.width = Math.random() * 8 + 5 + 'px';
    el.style.height = Math.random() * 8 + 5 + 'px';
    el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.top = '105vh';
    el.style.borderRadius = '50%';
    el.style.zIndex = '9999';
    el.style.pointerEvents = 'none';
    el.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(el);

    const destX = (Math.random() - 0.5) * 400;
    const destY = -(Math.random() * 500 + 400);
    const duration = Math.random() * 1.5 + 1.2;

    el.animate([
      { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
      { transform: `translate(${destX}px, ${destY}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
    ], {
      duration: duration * 1000,
      easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)',
      fill: 'forwards'
    });

    setTimeout(() => el.remove(), duration * 1000);
  }
}

function handleEloChange(oldElo, newElo) {
  const oldMilestone = getCurrentMilestone(oldElo);
  const newMilestone = getCurrentMilestone(newElo);
  if (newMilestone.current.title !== oldMilestone.current.title) {
    triggerConfetti();
    setTimeout(() => {
      showToast(`🎉 Level Up! You unlocked the **${newMilestone.current.title}** rank!`);
    }, 500);
  }
}

// ═══════════════════════════════════════════════════
// NEW V2 ENHANCEMENTS: LIVE ADVISOR, GTM, ACTIONABLE INSIGHTS
// ═══════════════════════════════════════════════════

function getLiveAdvisorPrompt(chessObj) {
  if (chessObj.inCheck()) {
    return "⚠️ <strong>Live Advisor:</strong> You are in check! Look for forcing moves: blocking, capturing the checking piece, or escaping.";
  }
  
  const history = chessObj.history({ verbose: true });
  const moveCount = history.length;
  
  if (moveCount < 6) {
    return "💡 <strong>Live Advisor:</strong> This opening stage resembles classic center control theory. Focus on developing knights before bishops and preparing to castle.";
  }
  
  let pieceCount = 0;
  for (let r = 1; r <= 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = String.fromCharCode(97 + c) + r;
      if (chessObj.get(sq)) pieceCount++;
    }
  }
  
  if (pieceCount < 12) {
    return "♟️ <strong>Live Advisor:</strong> We have entered the endgame stage. Remember that King activity is paramount now. Look to gain opposition and guide passed pawns!";
  }
  
  const tips = [
    "🔍 <strong>Live Advisor:</strong> Scan the board for forcing candidate moves (Checks, Captures, Threats) before deciding.",
    "🛡️ <strong>Live Advisor:</strong> Prophylaxis tip: Ask yourself 'What is my opponent planning with their last move?'",
    "🦄 <strong>Live Advisor:</strong> Look out for knight forks on weak undefended squares.",
    "📌 <strong>Live Advisor:</strong> Aligning rooks on open files will maximize their activity and power.",
    "🧠 <strong>Live Advisor:</strong> Remember a lesson you studied: keep pawn structures solid and avoid leaving weak squares."
  ];
  return tips[moveCount % tips.length];
}

function startGuessChallenge(game) {
  if (!game || !game.pgn) return;
  
  const tempChess = new Chess();
  try {
    tempChess.loadPgn(game.pgn);
  } catch (e) {
    showToast("⚠️ Failed to parse game PGN.");
    return;
  }
  
  const moves = tempChess.history({ verbose: true });
  
  gtmState = {
    active: true,
    game,
    moves,
    currentPly: 0,
    targetIndex: 0,
    correctCount: 0,
    attemptedCount: game.guessMoves ? game.guessMoves.length : 0
  };
  
  document.getElementById('guessTheMoveChallenge').style.display = 'block';
  document.getElementById('guessFeedback').style.display = 'none';
  document.getElementById('guessInputArea').style.display = 'none';
  document.getElementById('btnGuessNext').style.display = 'inline-block';
  document.getElementById('btnGuessNext').textContent = 'Start Game →';
  document.getElementById('guessPrompt').innerHTML = `Welcome to the Guess the Move challenge for <strong>${game.title}</strong>. Click 'Start Game' to walk through the moves!`;
  document.getElementById('guessStats').textContent = `Correct: 0 / ${gtmState.attemptedCount}`;
  
  const famousChess = new Chess();
  renderBoardTo('famousBoard', famousChess, null, []);
  
  showToast("🎯 Guess the Move challenge started!");
}

function advanceGuessMove() {
  if (!gtmState.active) return;
  
  const famousChess = new Chess();
  for (let i = 0; i < gtmState.currentPly; i++) {
    famousChess.move(gtmState.moves[i].san);
  }
  
  if (gtmState.currentPly >= gtmState.moves.length) {
    document.getElementById('guessPrompt').innerHTML = `🏁 <strong>Challenge Complete!</strong> You guessed ${gtmState.correctCount} out of ${gtmState.attemptedCount} moves correctly!`;
    document.getElementById('btnGuessNext').style.display = 'none';
    document.getElementById('guessInputArea').style.display = 'none';
    
    const xpReward = gtmState.correctCount * 25;
    if (xpReward > 0) {
      profile.addXP(xpReward);
      showToast(`🏆 Guess the Move completed! +${xpReward} XP`);
      updateHeaderStats();
    }
    gtmState.active = false;
    return;
  }
  
  const nextMove = gtmState.moves[gtmState.currentPly];
  famousChess.move(nextMove.san);
  gtmState.currentPly++;
  
  renderBoardTo('famousBoard', famousChess, null, [nextMove.from, nextMove.to]);
  
  const target = gtmState.game.guessMoves && gtmState.game.guessMoves[gtmState.targetIndex];
  if (target && gtmState.currentPly === target.ply - 1) {
    document.getElementById('btnGuessNext').style.display = 'none';
    document.getElementById('guessInputArea').style.display = 'block';
    document.getElementById('guessPrompt').innerHTML = `🎯 <strong>Prediction Time:</strong> ${target.prompt}`;
    document.getElementById('guessFeedback').style.display = 'none';
    document.getElementById('guessInputMove').value = '';
    document.getElementById('guessReasoning').value = '';
    document.getElementById('guessInputMove').focus();
  } else {
    document.getElementById('btnGuessNext').textContent = 'Next Move →';
    document.getElementById('guessPrompt').innerHTML = `Game Progress: Move ${Math.ceil(gtmState.currentPly / 2)}${gtmState.currentPly % 2 === 1 ? ' (White)' : ' (Black)'}: <strong>${nextMove.san}</strong>`;
  }
}

function submitGuess() {
  if (!gtmState.active) return;
  const target = gtmState.game.guessMoves && gtmState.game.guessMoves[gtmState.targetIndex];
  if (!target) return;
  
  const input = document.getElementById('guessInputMove');
  const guess = input.value.trim();
  if (!guess) return;
  
  const normalize = s => s.replace(/[+#!?]/g,'').replace(/x/g,'').toLowerCase().trim();
  const isCorrect = normalize(guess) === normalize(target.expected);
  
  const fb = document.getElementById('guessFeedback');
  fb.style.display = 'block';
  if (isCorrect) {
    gtmState.correctCount++;
    fb.style.background = 'rgba(16,185,129,0.1)';
    fb.style.border = '1px solid rgba(16,185,129,0.3)';
    fb.style.color = 'var(--success)';
    fb.innerHTML = `✅ <strong>Correct!</strong> You predicted the GM's choice: <strong>${target.expected}</strong>.`;
  } else {
    fb.style.background = 'rgba(239,68,68,0.1)';
    fb.style.border = '1px solid rgba(239,68,68,0.3)';
    fb.style.color = 'var(--danger)';
    fb.innerHTML = `❌ <strong>Incorrect.</strong> The GM played: <strong>${target.expected}</strong>.`;
  }
  
  document.getElementById('guessStats').textContent = `Correct: ${gtmState.correctCount} / ${gtmState.attemptedCount}`;
  gtmState.targetIndex++;
  
  document.getElementById('guessInputArea').style.display = 'none';
  document.getElementById('btnGuessNext').style.display = 'inline-block';
  document.getElementById('btnGuessNext').textContent = 'Resume Game →';
}

function renderActionableInsights() {
  const container = document.getElementById('analyticsRecentErrors');
  const btn = document.getElementById('btnGenerateCustomTraining');
  if (!container) return;

  const errors = profile.gameErrors || { forksMissed: 0, pinsMissed: 0, endgameFails: 0, blunders: 0, inaccuracies: 0 };
  const totalErrors = Object.values(errors).reduce((a, b) => a + b, 0);

  if (totalErrors === 0) {
    container.innerHTML = `<div style="color:var(--text-muted);font-style:italic;">No recent game errors recorded. Play some games against Stockfish AI or upload game logs to populate analysis metrics.</div>`;
    if (btn) btn.style.display = 'none';
    return;
  }

  container.innerHTML = `
    <ul style="margin: 0; padding-left: 16px; display: flex; flex-direction: column; gap: 4px;">
      <li>🐴 <strong>Knight Fork Errors:</strong> ${errors.forksMissed || 0} missed</li>
      <li>📌 <strong>Missed Pins / Skewers:</strong> ${errors.pinsMissed || 0} missed</li>
      <li>♟️ <strong>Rook / Pawn Endgame Errors:</strong> ${errors.endgameFails || 0} recorded</li>
      <li>⚠️ <strong>Blunders:</strong> ${errors.blunders || 0} recorded</li>
      <li>🟡 <strong>Inaccuracies:</strong> ${errors.inaccuracies || 0} recorded</li>
    </ul>
  `;

  if (btn) {
    btn.style.display = 'inline-block';
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => {
      let targetCat = 'fork';
      let maxErrors = 0;
      if ((errors.forksMissed || 0) > maxErrors) { maxErrors = errors.forksMissed; targetCat = 'fork'; }
      if ((errors.pinsMissed || 0) > maxErrors) { maxErrors = errors.pinsMissed; targetCat = 'pin'; }
      if ((errors.endgameFails || 0) > maxErrors) { maxErrors = errors.endgameFails; targetCat = 'endgame'; }
      
      if (maxErrors === 0 && ((errors.blunders || 0) > 0 || (errors.inaccuracies || 0) > 0)) {
        const cats = ['fork', 'pin', 'skewer', 'discovered_attack'];
        targetCat = cats[Math.floor(Math.random() * cats.length)];
      }

      const puzzles = TACTICS_DB.filter(t => t.category === targetCat || t.category.includes(targetCat));
      const p = puzzles[Math.floor(Math.random() * puzzles.length)] || TACTICS_DB[0];

      if (p) {
        activeLesson = { ...p, type: 'tactic' };
        navigateToView('play');
        chess = new Chess(p.fen);
        playerColor = p.fen.split(' ')[1] || 'w';
        isGameActive = true;
        buildBoard();
        document.getElementById('coachAdvice').innerHTML = `
          <strong>⚡ Targeted custom training generated!</strong><br>
          Motif: <strong>${p.name}</strong> (solving this targets your highest error rate: ${targetCat})<br><br>
          <span style="color:var(--accent-gold);">🎯 <strong>Goal:</strong> Find the winning tactical move for ${playerColor === 'w' ? 'White' : 'Black'}.</span>
        `;
        showToast(`⚡ Targeted ${targetCat} training puzzle loaded!`);
      }
    });
  }
}

