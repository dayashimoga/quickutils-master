(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// State
let s = {
    mode: 'pomodoro', // pomodoro, shortBreak, longBreak
    timeLeft: 25 * 60,
    isRunning: false,
    timer: null,
    settings: {
        pomodoro: parseInt(localStorage.getItem('focus_set_pomo')) || 25,
        shortBreak: parseInt(localStorage.getItem('focus_set_sb')) || 5,
        longBreak: parseInt(localStorage.getItem('focus_set_lb')) || 15,
        interval: parseInt(localStorage.getItem('focus_set_int')) || 4,
        autoStartBreak: localStorage.getItem('focus_set_ab') === 'true',
        autoStartPomodoro: localStorage.getItem('focus_set_ap') === 'true',
        strictMode: localStorage.getItem('focus_strict') === 'true'
    },
    stats: {
        pomodoros: parseInt(localStorage.getItem('focus_pomodoros') || '0'),
        focusTimeSecs: parseInt(localStorage.getItem('focus_time') || '0'),
        streak: parseInt(localStorage.getItem('focus_streak') || '0'),
        lastDate: localStorage.getItem('focus_last_date') || '',
        dailyPomos: parseInt(localStorage.getItem('focus_daily_pomos') || '0'),
        history: JSON.parse(localStorage.getItem('focus_history') || '{}'),
        achievements: JSON.parse(localStorage.getItem('focus_achievements') || '[]')
    },
    tasks: JSON.parse(localStorage.getItem('focus_tasks') || '[]'),
    activeTaskId: null,
    pomodoroCount: 0, // session count for long break logic
    activeSound: null
};

const circle = $('#progressRing');
const radius = circle.r.baseVal.value;
const circumference = radius * 2 * Math.PI;
circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;

// Elements
const timeDisplay = $('#timeDisplay');
const startBtn = $('#startBtn');
const resetBtn = $('#resetBtn');
const modeBtns = $$('.mode-btn');
const alarmSound = $('#alarm-sound');

function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;
}

function updateDisplay() {
    const mins = Math.floor(s.timeLeft / 60);
    const secs = s.timeLeft % 60;
    const timeStr = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    timeDisplay.textContent = timeStr;
    document.title = `${timeStr} — ${s.mode === 'pomodoro' ? 'Focus' : 'Break'} | FocusTimer`;
    
    const total = s.settings[s.mode] * 60;
    const percent = ((total - s.timeLeft) / total) * 100;
    setProgress(percent);
}

function switchMode(mode) {
    s.mode = mode;
    s.timeLeft = s.settings[mode] * 60;
    
    document.body.className = `theme-${mode}`;
    modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    
    if (s.isRunning) {
        clearInterval(s.timer);
        s.isRunning = false;
        startBtn.innerHTML = '▶ Start';
    }
    updateDisplay();
}

function completeSession() {
    alarmSound.play();
    if (s.mode === 'pomodoro') {
        s.pomodoroCount++;
        s.stats.pomodoros++;

    // Update Gamification & History
    const today = new Date().toISOString().split('T')[0];
    if (s.stats.lastDate !== today) {
        s.stats.dailyPomos = 0; // Reset daily
    }
    s.stats.dailyPomos++;
    if (!s.stats.history[today]) s.stats.history[today] = 0;
    s.stats.history[today]++;

        s.stats.focusTimeSecs += s.settings.pomodoro * 60;
        updateStats();
        
        if (s.activeTaskId) {
            const t = s.tasks.find(x => x.id === s.activeTaskId);
            if (t) { t.act++; saveTasks(); renderTasks(); }
        }
        
        if (s.pomodoroCount % s.settings.interval === 0) {
            switchMode('longBreak');
        } else {
            switchMode('shortBreak');
        }
        if (s.settings.autoStartBreak) toggleTimer();
    } else {
        switchMode('pomodoro');
        if (s.settings.autoStartPomodoro) toggleTimer();
    }
}

function toggleTimer() {
    if (s.isRunning) {
        clearInterval(s.timer);
        startBtn.innerHTML = '▶ Start';
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(e => console.log(e));
        }
    } else {
        startBtn.innerHTML = '⏸ Pause';
        
        if (s.mode === 'pomodoro' && s.settings.strictMode) {
            if (Notification.permission !== "granted") {
                Notification.requestPermission();
            }
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(e => console.log(e));
            }
        }

        s.timer = setInterval(() => {
            s.timeLeft--;
            if (s.timeLeft <= 0) completeSession();
            else updateDisplay();
        }, 1000);
    }
    s.isRunning = !s.isRunning;
}

startBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', () => switchMode(s.mode));

modeBtns.forEach(btn => btn.addEventListener('click', () => switchMode(btn.dataset.mode)));

// Tasks
const taskForm = $('#taskForm'), taskInput = $('#taskInput'), estPomodoros = $('#estPomodoros'), taskList = $('#taskList');

function saveTasks() { localStorage.setItem('focus_tasks', JSON.stringify(s.tasks)); }

function renderTasks() {
    taskList.innerHTML = '';
    let totalEst = 0, totalAct = 0;
    s.tasks.forEach(t => {
        totalEst += t.est; totalAct += t.act;
        const li = document.createElement('li');
        li.className = `task-item ${t.completed ? 'completed' : ''} ${s.activeTaskId === t.id ? 'active' : ''}`;
        li.innerHTML = `
            <div class="task-check" onclick="toggleTask(${t.id}, event)">${t.completed ? '&#10003;' : ''}</div>
            <div class="task-content" onclick="setActiveTask(${t.id})">
                <div class="task-title">${t.title}</div>
                <div class="task-pomo">
                    ${Array(t.est).fill(0).map((_, i) => `<span class="pomo-dot ${i < t.act ? 'done' : ''}"></span>`).join('')}
                </div>
            </div>
            <div class="task-actions"><button onclick="deleteTask(${t.id}, event)">🗑️</button></div>
        `;
        taskList.appendChild(li);
    });
    $('#pomodorosTotal').textContent = `${totalAct} / ${totalEst}`;
    
    if (s.activeTaskId) {
        const activeT = s.tasks.find(x => x.id === s.activeTaskId);
        $('#currentTaskDisplay').innerHTML = `Focus on: <span>${activeT ? activeT.title : 'Deleted task'}</span>`;
    } else {
        $('#currentTaskDisplay').innerHTML = `Focus on: <span>Select a task</span>`;
    }
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!taskInput.value.trim()) return;
    const newTask = { id: Date.now(), title: taskInput.value.trim(), est: parseInt(estPomodoros.value)||1, act: 0, completed: false };
    s.tasks.push(newTask);
    if (!s.activeTaskId) s.activeTaskId = newTask.id;
    taskInput.value = ''; estPomodoros.value = 1;
    saveTasks(); renderTasks();
});

window.toggleTask = (id, e) => {
    e.stopPropagation();
    const t = s.tasks.find(x => x.id === id);
    if (t) { t.completed = !t.completed; saveTasks(); renderTasks(); }
};
window.setActiveTask = (id) => { s.activeTaskId = id; renderTasks(); };
window.deleteTask = (id, e) => {
    e.stopPropagation();
    s.tasks = s.tasks.filter(x => x.id !== id);
    if (s.activeTaskId === id) s.activeTaskId = null;
    saveTasks(); renderTasks();
};

// Sound
$$('.sound-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const sound = btn.dataset.sound;
        const audio = $(`#audio-${sound}`);
        if (!audio) return;
        
        if (s.activeSound === sound) {
            audio.pause();
            btn.classList.remove('active');
            s.activeSound = null;
        } else {
            if (s.activeSound) {
                $(`#audio-${s.activeSound}`).pause();
                $$('.sound-btn').forEach(b => b.classList.remove('active'));
            }
            audio.volume = $('#masterVol').value / 100;
            audio.play();
            btn.classList.add('active');
            s.activeSound = sound;
        }
    });
});

$('#masterVol').addEventListener('input', (e) => {
    if (s.activeSound) $(`#audio-${s.activeSound}`).volume = e.target.value / 100;
    alarmSound.volume = e.target.value / 100;
});

// Stats
function checkStreak() {
    const today = new Date().toDateString();
    if (s.stats.lastDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (s.stats.lastDate === yesterday && s.stats.pomodoros > parseInt(localStorage.getItem('focus_pomodoros') || '0')) {
            s.stats.streak++;
        } else if (s.stats.pomodoros > parseInt(localStorage.getItem('focus_pomodoros') || '0')) {
            s.stats.streak = 1;
        }
        s.stats.lastDate = today;
    }
}


// ── Achievements & Gamification ──
const ACH_DEFS = [
    { id: 'first_blood', icon: '🍅', title: 'First Tomato', desc: 'Complete 1 Pomodoro', check: (c) => c.pomodoros >= 1 },
    { id: 'marathon', icon: '🏃', title: 'Marathon', desc: 'Complete 4 Pomodoros in a day', check: (c) => c.dailyPomos >= 4 },
    { id: 'streak_3', icon: '🔥', title: 'On Fire', desc: '3 day streak', check: (c) => c.streak >= 3 },
    { id: 'streak_7', icon: '🚀', title: 'Unstoppable', desc: '7 day streak', check: (c) => c.streak >= 7 },
    { id: 'hours_10', icon: '⏳', title: 'Dedicated', desc: '10 hours total focus', check: (c) => c.focusTimeSecs >= 36000 },
    { id: 'hours_50', icon: '👑', title: 'Master', desc: '50 hours total focus', check: (c) => c.focusTimeSecs >= 180000 },
];

function evaluateAchievements() {
    let newAch = false;
    ACH_DEFS.forEach(a => {
        if (!s.stats.achievements.includes(a.id) && a.check(s.stats)) {
            s.stats.achievements.push(a.id);
            newAch = true;
            // Optionally could trigger a toast here
        }
    });
    if (newAch) {
        localStorage.setItem('focus_achievements', JSON.stringify(s.stats.achievements));
    }
}

function renderGamification() {
    // Render progress bar
    const goal = 4; // Hardcoded daily goal for now
    const pct = Math.min(100, (s.stats.dailyPomos / goal) * 100);
    $('#dailyGoalProgress').style.width = pct + '%';
    
    // Render chart
    const chart = $('#weeklyChart');
    const labels = $('#weeklyLabels');
    chart.innerHTML = ''; labels.innerHTML = '';
    
    // Last 7 days
    let maxVal = 1;
    const historyData = [];
    for (let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const val = s.stats.history[dStr] || 0;
        historyData.push({ day: d.toLocaleDateString('en-US',{weekday:'short'}).substring(0,1), val });
        if (val > maxVal) maxVal = val;
    }
    
    historyData.forEach(hd => {
        const hPct = (hd.val / maxVal) * 100;
        chart.innerHTML += `<div style="width:12%; background:var(--accent); height:${hPct}%; border-radius:2px 2px 0 0; min-height:4px;" title="${hd.val} pomodoros"></div>`;
        labels.innerHTML += `<span>${hd.day}</span>`;
    });
    
    // Render achievements
    const achGrid = $('#achGrid');
    achGrid.innerHTML = '';
    ACH_DEFS.forEach(a => {
        const unlocked = s.stats.achievements.includes(a.id);
        achGrid.innerHTML += `
            <div style="background:var(--bg-elevated); padding:0.5rem; border-radius:6px; display:flex; align-items:center; gap:0.5rem; opacity:${unlocked?1:0.4}">
                <div style="font-size:1.5rem; filter:${unlocked?'none':'grayscale(1)'}">${a.icon}</div>
                <div>
                    <div style="font-size:0.8rem; font-weight:600;">${a.title}</div>
                    <div style="font-size:0.6rem; color:var(--text-muted);">${a.desc}</div>
                </div>
            </div>
        `;
    });
    
    $('#statAchs').textContent = `${s.stats.achievements.length}/${ACH_DEFS.length}`;
}

function updateStats() {
    
    const today = new Date().toISOString().split('T')[0];
    if (s.stats.lastDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (s.stats.lastDate === yesterday && s.stats.history[yesterday] > 0) {
            s.stats.streak++;
        } else if (s.stats.lastDate !== today && s.stats.history[today] > 0) {
            s.stats.streak = 1;
        } else if (s.stats.lastDate !== today) {
            s.stats.streak = 0; // Lost streak
        }
    }
    s.stats.lastDate = today;

    evaluateAchievements();
    localStorage.setItem('focus_history', JSON.stringify(s.stats.history));
    localStorage.setItem('focus_daily_pomos', s.stats.dailyPomos);
    
    renderGamification();

    localStorage.setItem('focus_pomodoros', s.stats.pomodoros);
    localStorage.setItem('focus_time', s.stats.focusTimeSecs);
    localStorage.setItem('focus_streak', s.stats.streak);
    localStorage.setItem('focus_last_date', s.stats.lastDate);
    
    $('#statPomodoros').textContent = s.stats.pomodoros;
    $('#statStreak').textContent = `${s.stats.streak} Days`;
    const hrs = (s.stats.focusTimeSecs / 3600).toFixed(1);
    $('#statFocusTime').textContent = `${hrs}h`;
}

// Settings
$('#settingsBtn').addEventListener('click', () => $('#settingsModal').classList.add('active'));
$('#closeSettings').addEventListener('click', () => $('#settingsModal').classList.remove('active'));
$('#saveSettings').addEventListener('click', () => {
    s.settings.pomodoro = parseInt($('#setPomodoro').value) || 25;
    s.settings.shortBreak = parseInt($('#setShortBreak').value) || 5;
    s.settings.longBreak = parseInt($('#setLongBreak').value) || 15;
    s.settings.interval = parseInt($('#setInterval').value) || 4;
    s.settings.autoStartBreak = $('#setAutoBreak').checked;
    s.settings.autoStartPomodoro = $('#setAutoPomodoro').checked;
    s.settings.strictMode = $('#setStrictMode').checked;
    
    localStorage.setItem('focus_set_pomo', s.settings.pomodoro);
    localStorage.setItem('focus_set_sb', s.settings.shortBreak);
    localStorage.setItem('focus_set_lb', s.settings.longBreak);
    localStorage.setItem('focus_set_int', s.settings.interval);
    localStorage.setItem('focus_set_ab', s.settings.autoStartBreak);
    localStorage.setItem('focus_set_ap', s.settings.autoStartPomodoro);
    localStorage.setItem('focus_strict', s.settings.strictMode);

    $('#settingsModal').classList.remove('active');
    switchMode(s.mode); // Reset timer with new settings
});

$('#themeBtn').addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.dataset.theme === 'dark';
    html.dataset.theme = isDark ? 'light' : 'dark';
    $('#themeBtn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', html.dataset.theme);
});

// Strict Mode Tab Switching Interceptor
document.addEventListener("visibilitychange", () => {
    if (document.hidden && s.isRunning && s.mode === 'pomodoro' && s.settings.strictMode) {
        if (Notification.permission === "granted") {
            new Notification("🚨 Get back to work!", {
                body: "Strict Mode is enabled. Don't switch tabs while the Pomodoro is running!"
            });
        }
        alarmSound.currentTime = 0;
        alarmSound.play().catch(e=>console.log("Audio play failed on hidden:", e));
    }
});

// Init
if (localStorage.getItem('theme') === 'light') {
    document.documentElement.dataset.theme = 'light';
    $('#themeBtn').textContent = '☀️';
}
$('#setPomodoro').value = s.settings.pomodoro;
$('#setShortBreak').value = s.settings.shortBreak;
$('#setLongBreak').value = s.settings.longBreak;
$('#setInterval').value = s.settings.interval;
$('#setAutoBreak').checked = s.settings.autoStartBreak;
$('#setAutoPomodoro').checked = s.settings.autoStartPomodoro;
$('#setStrictMode').checked = s.settings.strictMode;

switchMode('pomodoro');
renderTasks();
updateStats();
})();
