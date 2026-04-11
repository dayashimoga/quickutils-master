/* script.js for habit-streak */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });

    // State
    const lsKey = 'qu_habit_streak_data';
    let appData = {
        habits: [], // { id, name, created, log: ["YYYY-MM-DD", ...] }
    };

    function loadData() {
        const stored = localStorage.getItem(lsKey);
        if (stored) {
            try { appData = JSON.parse(stored); } catch(e){}
        }
        if(!appData.habits) appData.habits = [];
    }

    function saveData() {
        localStorage.setItem(lsKey, JSON.stringify(appData));
    }

    const todayStr = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })();

    function getStreak(habit) {
        if(!habit.log || habit.log.length === 0) return 0;
        const sortedLog = [...new Set(habit.log)].sort().reverse();
        let streak = 0;
        let d = new Date();
        
        // Ensure standard midnight comparison
        d.setHours(0,0,0,0);

        // Does the user have a hit today?
        let hitToday = sortedLog.includes(todayStr);
        let checkDate = new Date(d);
        if(!hitToday) {
            checkDate.setDate(checkDate.getDate() - 1); // allow 1 day grace
        }

        while(true) {
            let s = `${checkDate.getFullYear()}-${String(checkDate.getMonth()+1).padStart(2,'0')}-${String(checkDate.getDate()).padStart(2,'0')}`;
            if(sortedLog.includes(s)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }

    function renderHabits() {
        const container = $('#habitsList');
        container.innerHTML = '';
        
        if (appData.habits.length === 0) {
            container.innerHTML = `<p class="text-muted text-center py-4">No habits added yet. Start by entering a new habit above!</p>`;
            return;
        }

        appData.habits.forEach(h => {
            const isDoneToday = h.log.includes(todayStr);
            const streak = getStreak(h);
            
            const div = document.createElement('div');
            div.className = 'habit-item animate-in-up';
            div.innerHTML = `
                <div class="habit-info">
                    <h4 style="margin:0 0 4px 0">${h.name}</h4>
                    <span class="streak-badge">🔥 ${streak} day streak</span>
                    <button class="btn btn-ghost" style="padding:0; margin-left: 10px; font-size:12px; color:#ef4444;" onclick="QU_HabitApp.deleteHabit('${h.id}')">Delete</button>
                </div>
                <button class="btn-check ${isDoneToday ? 'checked' : ''}" onclick="QU_HabitApp.toggleHabit('${h.id}')">
                    ${isDoneToday ? '✓' : ''}
                </button>
            `;
            container.appendChild(div);
        });
    }

    function renderHeatmap() {
        const container = $('#heatmapContainer');
        container.innerHTML = '';
        
        // Generate last 365 days
        const cols = 52;
        const today = new Date();
        today.setHours(0,0,0,0);
        
        // Aggregate totals per day
        const globalLog = {};
        appData.habits.forEach(h => {
            h.log.forEach(d => { globalLog[d] = (globalLog[d] || 0) + 1; });
        });

        // Generate matrix: 7 rows (Sun-Sat), 52 cols
        const matrix = Array(7).fill(0).map(() => Array(cols).fill(null));
        
        let d = new Date(today);
        d.setDate(d.getDate() - (52 * 7) + 1); // Go back ~1 year
        
        for (let c = 0; c < cols; c++) {
            const colDiv = document.createElement('div');
            colDiv.className = 'heatmap-col';
            for (let r = 0; r < 7; r++) {
                if (d > today) {
                    const empty = document.createElement('div');
                    empty.className = 'heatmap-cell empty';
                    colDiv.appendChild(empty);
                } else {
                    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    const count = globalLog[dateStr] || 0;
                    
                    let level = 0;
                    if(count === 1) level = 1;
                    if(count === 2) level = 2;
                    if(count === 3) level = 3;
                    if(count >= 4) level = 4;

                    const cell = document.createElement('div');
                    cell.className = 'heatmap-cell';
                    cell.dataset.level = level;
                    cell.title = `${dateStr}: ${count} habits completed`;
                    colDiv.appendChild(cell);
                    
                    d.setDate(d.getDate() + 1);
                }
            }
            container.appendChild(colDiv);
        }
    }

    // Export api for inline html handlers
    window.QU_HabitApp = {
        toggleHabit: (id) => {
            const h = appData.habits.find(x => x.id === id);
            if(h) {
                const idx = h.log.indexOf(todayStr);
                if(idx > -1) h.log.splice(idx, 1);
                else h.log.push(todayStr);
                saveData();
                renderHabits();
                renderHeatmap();
            }
        },
        deleteHabit: (id) => {
            if(confirm("Delete this habit forever?")) {
                appData.habits = appData.habits.filter(x => x.id !== id);
                saveData();
                renderHabits();
                renderHeatmap();
            }
        }
    };

    $('#addHabitBtn').addEventListener('click', () => {
        const val = $('#habitInput').value.trim();
        if(val) {
            appData.habits.push({
                id: 'h_' + Date.now() + Math.random().toString(36).substr(2,5),
                name: val,
                created: todayStr,
                log: []
            });
            $('#habitInput').value = '';
            saveData();
            renderHabits();
            renderHeatmap();
        }
    });

    $('#habitInput').addEventListener('keypress', (e) => {
        if(e.key === 'Enter') $('#addHabitBtn').click();
    });

    // Boot
    loadData();
    renderHabits();
    renderHeatmap();
    renderDashboard();

    function renderDashboard() {
        const dr = $('#dashRate'), ds = $('#dashStreak'), dt = $('#dashTotal'), db = $('#dashBestDay');
        if(!dr) return;
        
        let totalCheckins = 0, bestStreak = 0;
        const dayCounts = {};
        const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        
        appData.habits.forEach(h => {
            totalCheckins += h.log.length;
            const streak = getStreak(h);
            if(streak > bestStreak) bestStreak = streak;
            h.log.forEach(d => { const day = new Date(d).getDay(); dayCounts[day] = (dayCounts[day]||0) + 1; });
        });
        
        const habitsCount = appData.habits.length;
        const rate = habitsCount > 0 ? Math.round((appData.habits.filter(h => h.log.includes(todayStr)).length / habitsCount) * 100) : 0;
        
        dr.textContent = rate + '%';
        ds.textContent = bestStreak;
        dt.textContent = totalCheckins;
        
        let bestDay = '—', bestDayCount = 0;
        Object.entries(dayCounts).forEach(([d, c]) => { if(c > bestDayCount) { bestDayCount = c; bestDay = days[d]; } });
        db.textContent = bestDay;
        
        // Weekly chart
        const chart = $('#weeklyChart');
        if(chart) {
            const cctx = chart.getContext('2d');
            const w = chart.width = chart.parentElement.clientWidth;
            const h = 150;
            cctx.clearRect(0,0,w,h);
            const max = Math.max(...Object.values(dayCounts), 1);
            days.forEach((d, i) => {
                const count = dayCounts[i] || 0;
                const bh = (count / max) * (h - 30);
                const x = (i / 7) * w + w/14;
                cctx.fillStyle = 'rgba(57,211,83,0.6)';
                cctx.fillRect(x - 15, h - 20 - bh, 30, bh);
                cctx.fillStyle = '#888';
                cctx.font = '11px Inter,sans-serif';
                cctx.textAlign = 'center';
                cctx.fillText(d, x, h - 5);
                cctx.fillText(count, x, h - 24 - bh);
            });
        }
    }
})();
