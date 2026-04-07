(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Parse local habits or default
let habits = JSON.parse(localStorage.getItem('habits_data') || '[]');
const todayStr = getLocalIsoDate();

function getLocalIsoDate(date = new Date()) {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
}

function init() {
    $('#currentDateStr').textContent = new Date().toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' });
    renderHabits();
    renderHeatmap();
    updateStats();
}

function save() {
    localStorage.setItem('habits_data', JSON.stringify(habits));
    updateStats();
    renderHeatmap();
}


function renderHabits() {
    const list = $('#habitsList');
    if (habits.length === 0) {
        list.innerHTML = '<div class="glass-card" style="text-align:center;color:var(--text-muted)">No habits yet. Click + New Habit to start tracking.</div>';
        return;
    }

    // Group by category
    const grouped = {};
    habits.forEach(h => {
        const cat = h.category || 'Other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(h);
    });

    let html = '';
    
    // Calculate last 7 days for weekly view header
    const daysArr = [];
    for(let i=6; i>=0; i--) {
        const d = new Date(); d.setDate(d.getDate()-i);
        daysArr.push(d);
    }

    // Build the grid
    for(const cat in grouped) {
        html += `<h4 style="margin-top:1.5rem; margin-bottom:0.5rem; color:var(--text-muted); font-size:0.9rem; text-transform:uppercase; letter-spacing:1px">${cat}</h4>`;
        
        grouped[cat].forEach(h => {
            const isDoneToday = (h.logs || []).includes(todayStr);
            let currentStreak = 0;
            let checkDate = new Date();
            
            // Calculate streak
            while (true) {
                const dStr = getLocalIsoDate(checkDate);
                if ((h.logs || []).includes(dStr)) {
                    currentStreak++; checkDate.setDate(checkDate.getDate() - 1);
                } else if (dStr === todayStr) { checkDate.setDate(checkDate.getDate() - 1); }
                else { break; }
            }

            // Generate 7-day checkboxes
            let weeklyHtml = '<div style="display:flex; gap:6px;">';
            daysArr.forEach(d => {
                const dStr = getLocalIsoDate(d);
                const done = (h.logs || []).includes(dStr);
                const isToday = dStr === todayStr;
                weeklyHtml += `
                    <div style="display:flex; flex-direction:column; align-items:center; gap:4px;" title="${d.toLocaleDateString()}">
                        <span style="font-size:0.6rem; color:var(--text-muted); font-weight:${isToday?'bold':''};">${d.toLocaleDateString('en-US',{weekday:'short'})[0]}</span>
                        <div class="check-btn sm ${done?'done':''}" style="width:24px; height:24px; min-width:24px; font-size:0.8rem; border-color:${h.color}; ${done?`background:${h.color}`:''}" onclick="toggleHabitDate('${h.id}','${dStr}')">${done?'✓':''}</div>
                    </div>
                `;
            });
            weeklyHtml += '</div>';

            html += `
            <div class="habit-item" style="display:flex; flex-direction:column; align-items:stretch;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div class="habit-info">
                        <div class="habit-color" style="background:${h.color}"></div>
                        <div class="habit-details">
                            <h3 style="font-size:1rem; margin:0;">${escapeHtml(h.name)}</h3>
                            <div class="streak-badge ${currentStreak > 0 ? 'active' : ''}" style="margin-top:4px;">🔥 ${currentStreak}</div>
                        </div>
                    </div>
                    <div class="habit-actions">
                        <button class="delete-btn" onclick="deleteHabit('${h.id}')" title="Delete habit">🗑️</button>
                    </div>
                </div>
                <!-- Weekly View -->
                <div style="display:flex; justify-content:flex-end; border-top:1px dashed var(--border); padding-top:8px;">
                    ${weeklyHtml}
                </div>
            </div>`;
        });
    }
    list.innerHTML = html;
}

window.toggleHabitDate = (id, dStr) => {
    const h = habits.find(x => x.id === id);
    if (!h) return;
    if (!h.logs) h.logs = [];
    const idx = h.logs.indexOf(dStr);
    if (idx === -1) h.logs.push(dStr);
    else h.logs.splice(idx, 1);
    save();
    renderHabits();
};

// Also replace toggleHabit in case it's lingering
window.toggleHabit = (id) => window.toggleHabitDate(id, todayStr);

function renderHeatmap() {
    const grid = $('#heatmapGrid');
    const cols = 52; // 52 weeks
    let cellHtml = '';
    
    // Create activity map
    const activityMap = {};
    const actCounts = {};
    if (habits.length > 0) {
        habits.forEach(h => {
            (h.logs || []).forEach(date => {
                activityMap[date] = (activityMap[date] || 0) + 1;
            });
        });
        
        let maxAct = 0;
        for (const k in activityMap) {
            actCounts[k] = activityMap[k];
            if (activityMap[k] > maxAct) maxAct = activityMap[k];
        }
        
        // Normalize to 1-4 levels
        for (const k in actCounts) {
            actCounts[k] = Math.ceil((actCounts[k] / (habits.length || 1)) * 4);
            if (actCounts[k] > 4) actCounts[k] = 4;
        }
    }

    const today = new Date();
    // Start drawing from 364 days ago
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < 7; r++) {
            const daysOffset = (cols - 1 - c) * 7 + (6 - r);
            const d = new Date(today);
            d.setDate(d.getDate() - daysOffset);
            
            if (d > today) {
                cellHtml += `<div class="day-cell" style="visibility:hidden"></div>`;
                continue;
            }
            
            const dStr = getLocalIsoDate(d);
            const level = actCounts[dStr] || 0;
            const formatted = d.toLocaleDateString();
            const actStr = activityMap[dStr] ? `${activityMap[dStr]} completed on ${formatted}` : `No activity on ${formatted}`;
            
            cellHtml += `<div class="day-cell l${level}" data-title="${actStr}"></div>`;
        }
    }
    grid.innerHTML = cellHtml;
    
    // Scroll to right
    const scrollCont = $('.heatmap-scroll');
    scrollCont.scrollLeft = scrollCont.scrollWidth;
}


function checkMilestones() {
    const milestoneCont = $('#milestonesRow');
    if (!milestoneCont) return;
    let totalLogs = 0;
    habits.forEach(h => totalLogs += (h.logs || []).length);
    
    let html = '';
    const defs = [
        { id:'start', t:'First Step', d:'Log your first habit', c: totalLogs >= 1 },
        { id:'ten', t:'Getting Started', d:'10 total completions', c: totalLogs >= 10 },
        { id:'fifty', t:'Consistent', d:'50 total completions', c: totalLogs >= 50 },
        { id:'hundred', t:'Habit Master', d:'100 completions', c: totalLogs >= 100 }
    ];
    
    let unlocked = 0;
    defs.forEach(m => {
        if(m.c) {
            unlocked++;
            html += `<div style="background:var(--bg-elevated); padding:0.5rem 1rem; border-radius:20px; font-size:0.8rem; border:1px solid var(--accent); white-space:nowrap;">🌟 ${m.t}</div>`;
        }
    });

    if (unlocked > 0) {
        milestoneCont.style.display = 'flex';
        milestoneCont.innerHTML = html;
    }
}

function updateStats() {
    checkMilestones();

    $('#totalHabits').textContent = habits.length;

    // Calc perfect days
    const datesMap = {};
    habits.forEach(h => {
        (h.logs || []).forEach(d => datesMap[d] = (datesMap[d] || 0) + 1);
    });
    
    let perfects = 0;
    for (const k in datesMap) {
        if (datesMap[k] === habits.length && habits.length > 0) perfects++;
    }
    $('#perfectDays').textContent = perfects;

    // Best overall streak
    let overallBest = 0;
    habits.forEach(h => {
        let currentS = 0;
        let maxS = 0;
        const sortedLogs = [...(h.logs || [])].sort();
        
        for (let i = 0; i < sortedLogs.length; i++) {
            if (i === 0) { currentS = 1; maxS = 1; continue; }
            
            const d1 = new Date(sortedLogs[i-1]);
            const d2 = new Date(sortedLogs[i]);
            const diffDays = Math.round((d2 - d1) / 86400000);
            
            if (diffDays === 1) {
                currentS++;
                if (currentS > maxS) maxS = currentS;
            } else {
                currentS = 1;
            }
        }
        if (maxS > overallBest) overallBest = maxS;
    });
    $('#bestStreak').textContent = overallBest;
}

window.toggleHabit = (id) => {
    const h = habits.find(x => x.id === id);
    if (!h) return;
    
    if (!h.logs) h.logs = [];
    const idx = h.logs.indexOf(todayStr);
    
    if (idx === -1) h.logs.push(todayStr);
    else h.logs.splice(idx, 1);
    
    save();
    renderHabits();
};

window.deleteHabit = (id) => {
    if (confirm('Are you sure you want to delete this habit? All history will be lost.')) {
        habits = habits.filter(x => x.id !== id);
        save();
        renderHabits();
    }
};

// Modals & Forms
const modal = $('#habitModal'), form = $('#habitForm'), nameIn = $('#habitName');

$('#newHabitBtn').addEventListener('click', () => { modal.classList.add('active'); nameIn.focus(); });
$('#closeModal').addEventListener('click', () => modal.classList.remove('active'));

let selectedColor = '#3b82f6';
$$('.color-opt').forEach(opt => {
    opt.addEventListener('click', () => {
        $$('.color-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        selectedColor = opt.dataset.color;
    });
});

form.addEventListener('submit', e => {
    e.preventDefault();
    if (!nameIn.value.trim()) return;
    
    habits.push({
        id: 'h_' + Date.now(),
        name: nameIn.value.trim(),
        category: $("#habitCategory") ? $("#habitCategory").value : "Other",
        color: selectedColor,
        created: todayStr,
        logs: []
    });
    
    save();
    renderHabits();
    nameIn.value = '';
    modal.classList.remove('active');
});

// Theme
$('#themeBtn').addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.dataset.theme === 'dark';
    html.dataset.theme = isDark ? 'light' : 'dark';
    $('#themeBtn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', html.dataset.theme);
});

if (localStorage.getItem('theme') === 'light') {
    document.documentElement.dataset.theme = 'light';
    $('#themeBtn').textContent = '☀️';
}

function escapeHtml(s) { return s.replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

init();
})();
