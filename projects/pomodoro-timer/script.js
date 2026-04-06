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
        pomodoro: 25,
        shortBreak: 5,
        longBreak: 15,
        interval: 4,
        autoStartBreak: false,
        autoStartPomodoro: false
    },
    stats: {
        pomodoros: parseInt(localStorage.getItem('focus_pomodoros') || '0'),
        focusTimeSecs: parseInt(localStorage.getItem('focus_time') || '0'),
        streak: parseInt(localStorage.getItem('focus_streak') || '0'),
        lastDate: localStorage.getItem('focus_last_date') || ''
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
    } else {
        startBtn.innerHTML = '⏸ Pause';
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

function updateStats() {
    checkStreak();
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

// Init
if (localStorage.getItem('theme') === 'light') {
    document.documentElement.dataset.theme = 'light';
    $('#themeBtn').textContent = '☀️';
}
switchMode('pomodoro');
renderTasks();
updateStats();
})();
