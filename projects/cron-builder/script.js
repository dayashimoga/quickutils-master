(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const PRESETS = [
    { expr: '* * * * *', desc: 'Every minute' },
    { expr: '*/5 * * * *', desc: 'Every 5 minutes' },
    { expr: '0 * * * *', desc: 'Every hour' },
    { expr: '0 */2 * * *', desc: 'Every 2 hours' },
    { expr: '0 9 * * 1-5', desc: 'Weekdays at 9 AM' },
    { expr: '0 0 * * *', desc: 'Daily at midnight' },
    { expr: '0 9,17 * * *', desc: '9 AM and 5 PM daily' },
    { expr: '0 0 * * 0', desc: 'Every Sunday at midnight' },
    { expr: '0 0 1 * *', desc: '1st of every month' },
    { expr: '0 0 1 1 *', desc: 'Yearly (Jan 1)' },
    { expr: '*/15 * * * *', desc: 'Every 15 minutes' },
    { expr: '0 6 * * 1', desc: 'Every Monday at 6 AM' },
];

// ── Cron Parser ──
function describeCron(expr) {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) return 'Invalid cron expression (need 5 fields)';
    const [min, hour, dom, mon, dow] = parts;
    let desc = 'At ';
    // Minute
    if (min === '*') desc += 'every minute';
    else if (min.startsWith('*/')) desc += `every ${min.slice(2)} minutes`;
    else desc += `minute ${min}`;
    // Hour
    if (hour === '*') desc += ' of every hour';
    else if (hour.startsWith('*/')) desc += ` every ${hour.slice(2)} hours`;
    else if (hour.includes(',')) desc += ` at ${hour.split(',').map(h => formatHour(h)).join(' and ')}`;
    else desc += ` at ${formatHour(hour)}`;
    // DOM
    if (dom !== '*') {
        if (dom.includes(',')) desc += ` on day ${dom} of the month`;
        else desc += ` on day ${dom} of the month`;
    }
    // Month
    if (mon !== '*') {
        if (mon.includes(',')) desc += ` in ${mon.split(',').map(m => MONTHS[parseInt(m)] || m).join(', ')}`;
        else desc += ` in ${MONTHS[parseInt(mon)] || mon}`;
    }
    // DOW
    if (dow !== '*') {
        if (dow === '1-5') desc += ', Monday through Friday';
        else if (dow === '0,6') desc += ', weekends only';
        else if (dow.includes(',')) desc += `, on ${dow.split(',').map(d => DAYS[parseInt(d)] || d).join(', ')}`;
        else if (dow.includes('-')) { const [s,e] = dow.split('-'); desc += `, ${DAYS[parseInt(s)]} through ${DAYS[parseInt(e)]}`; }
        else desc += `, on ${DAYS[parseInt(dow)] || dow}`;
    }
    return desc;
}

function formatHour(h) {
    const n = parseInt(h);
    if (isNaN(n)) return h;
    if (n === 0) return '12:00 AM';
    if (n < 12) return `${n}:00 AM`;
    if (n === 12) return '12:00 PM';
    return `${n - 12}:00 PM`;
}

// ── Next Runs Calculator ──
function getNextRuns(expr, count = 10) {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) return [];
    const [minP, hourP, domP, monP, dowP] = parts;
    const runs = [];
    const now = new Date();
    const check = new Date(now);
    check.setSeconds(0); check.setMilliseconds(0);
    const maxIter = 525600; // 1 year of minutes
    for (let i = 0; i < maxIter && runs.length < count; i++) {
        check.setMinutes(check.getMinutes() + 1);
        if (matchField(check.getMinutes(), minP) && matchField(check.getHours(), hourP) &&
            matchField(check.getDate(), domP) && matchField(check.getMonth() + 1, monP) &&
            matchField(check.getDay(), dowP)) {
            runs.push(new Date(check));
        }
    }
    return runs;
}

function matchField(value, pattern) {
    if (pattern === '*') return true;
    if (pattern.startsWith('*/')) return value % parseInt(pattern.slice(2)) === 0;
    if (pattern.includes(',')) return pattern.split(',').some(p => matchField(value, p));
    if (pattern.includes('-')) { const [a, b] = pattern.split('-').map(Number); return value >= a && value <= b; }
    return value === parseInt(pattern);
}

// ── Render Functions ──
function update() {
    const expr = $('#cronInput').value;
    $('#cronDesc').textContent = describeCron(expr);
    renderNextRuns(expr);
    renderHeatmap(expr);
}

function renderNextRuns(expr) {
    const runs = getNextRuns(expr, 10);
    $('#nextRuns').innerHTML = runs.map((d, i) => {
        const dayName = DAYS[d.getDay()];
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return `<div class="next-run"><span>#${i + 1}</span><span class="day-name">${dayName}</span><span>${dateStr}</span><span>${timeStr}</span></div>`;
    }).join('') || '<p class="text-muted">No runs found in the next year</p>';
}

function renderHeatmap(expr) {
    const runs = getNextRuns(expr, 200);
    const dayCounts = {};
    runs.forEach(d => {
        const key = d.toISOString().split('T')[0];
        dayCounts[key] = (dayCounts[key] || 0) + 1;
    });
    const maxCount = Math.max(1, ...Object.values(dayCounts));
    // Show 35 days from today
    const days = [];
    const today = new Date();
    for (let i = 0; i < 35; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split('T')[0];
        const count = dayCounts[key] || 0;
        const intensity = count / maxCount;
        days.push({ date: key, count, intensity, day: DAYS[d.getDay()] });
    }
    $('#heatmap').innerHTML = days.map(d => {
        const bg = d.count === 0 ? 'var(--bg-input)' : `rgba(99,102,241,${0.2 + d.intensity * 0.8})`;
        return `<div class="heat-cell" style="background:${bg}" title="${d.day} ${d.date}: ${d.count} runs"></div>`;
    }).join('');
}

// ── Visual Builder ──
$('#buildBtn').addEventListener('click', () => {
    const min = $('#minute').value;
    const hour = $('#hour').value;
    const dom = $('#dom').value;
    const mon = $('#month').value;
    const dow = $('#dow').value;
    $('#cronInput').value = `${min} ${hour} ${dom} ${mon} ${dow}`;
    update();
});

$('#cronInput').addEventListener('input', update);

// ── Presets ──
$('#presets').innerHTML = PRESETS.map(p => `
    <div class="preset-item" data-expr="${p.expr}">
        <span class="preset-desc">${p.desc}</span>
        <span class="preset-expr">${p.expr}</span>
    </div>
`).join('');
$$('.preset-item').forEach(el => el.addEventListener('click', () => {
    $('#cronInput').value = el.dataset.expr;
    update();
}));

// ── Favorites ──
function renderFavorites() {
    const favs = JSON.parse(localStorage.getItem('qu_cron_favs') || '[]');
    $('#favorites').innerHTML = favs.map((f, i) => `
        <div class="fav-item" data-expr="${f.expr}">
            <span class="fav-expr">${f.expr}</span>
            <span>${f.desc}</span>
            <button class="fav-del" data-idx="${i}">✕</button>
        </div>
    `).join('') || '<p class="text-muted" style="font-size:.8rem">No saved favorites</p>';
    $$('.fav-item').forEach(el => el.addEventListener('click', e => {
        if (e.target.classList.contains('fav-del')) return;
        $('#cronInput').value = el.dataset.expr; update();
    }));
    $$('.fav-del').forEach(btn => btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        favs.splice(idx, 1);
        localStorage.setItem('qu_cron_favs', JSON.stringify(favs));
        renderFavorites();
    }));
}

$('#saveFavBtn').addEventListener('click', () => {
    const expr = $('#cronInput').value;
    const desc = describeCron(expr);
    const favs = JSON.parse(localStorage.getItem('qu_cron_favs') || '[]');
    if (!favs.some(f => f.expr === expr)) {
        favs.unshift({ expr, desc });
        localStorage.setItem('qu_cron_favs', JSON.stringify(favs));
        renderFavorites();
    }
});

// Theme
$('#themeBtn').addEventListener('click', () => { const h=document.documentElement;const d=h.dataset.theme==='dark';h.dataset.theme=d?'light':'dark';$('#themeBtn').textContent=d?'☀️':'🌙';localStorage.setItem('theme',h.dataset.theme); });
if(localStorage.getItem('theme')==='light'){document.documentElement.dataset.theme='light';$('#themeBtn').textContent='☀️';}

update();
renderFavorites();
})();
