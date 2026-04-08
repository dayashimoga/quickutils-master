'use strict';
(function(){
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
let clocks = JSON.parse(localStorage.getItem('qu_clocks')) || [
    'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'
];

function updateClocks() {
    const now = new Date();
    const grid = $('#clocksGrid');
    if(grid.innerHTML === '' && clocks.length > 0) {
        renderGrid();
    }
    
    clocks.forEach(tz => {
        const el = document.getElementById('clock-'+tz.replace(/\W/g,'_'));
        if(!el) return;
        
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz, hour: 'numeric', minute: '2-digit', second: '2-digit',
            hour12: false, weekday: 'short', month: 'short', day: 'numeric'
        });
        const parts = formatter.formatToParts(now);
        let h=0, m=0, s=0, dateStr='';
        parts.forEach(p => {
            if(p.type==='hour') h = parseInt(p.value);
            if(p.type==='minute') m = parseInt(p.value);
            if(p.type==='second') s = parseInt(p.value);
        });
        
        const dateFmt = new Intl.DateTimeFormat('en-US', {timeZone: tz, dateStyle: 'full'});
        dateStr = dateFmt.format(now);
        
        const hDeg = (h % 12 + m/60) * 30;
        const mDeg = (m + s/60) * 6;
        const sDeg = s * 6;
        
        el.querySelector('.hand-hour').style.transform = `rotate(${hDeg}deg)`;
        el.querySelector('.hand-minute').style.transform = `rotate(${mDeg}deg)`;
        el.querySelector('.hand-second').style.transform = `rotate(${sDeg}deg)`;
        
        el.querySelector('.clock-digital').textContent = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
        el.querySelector('.clock-date').textContent = dateStr;
    });
}

function renderGrid() {
    const grid = $('#clocksGrid');
    grid.innerHTML = '';
    clocks.forEach(tz => {
        const id = 'clock-'+tz.replace(/\W/g,'_');
        const city = tz.split('/').pop().replace(/_/g, ' ');
        const offset = getOffset(tz);
        grid.innerHTML += `
            <div class="clock-card" id="${id}">
                <button class="remove-btn" onclick="removeClock('${tz}')">✕</button>
                <div class="clock-city">${city}</div>
                <div class="clock-analog">
                    <div class="clock-face">
                        <div class="clock-hand hand-hour"></div>
                        <div class="clock-hand hand-minute"></div>
                        <div class="clock-hand hand-second"></div>
                        <div class="clock-center"></div>
                    </div>
                </div>
                <div class="clock-digital">00:00</div>
                <div class="clock-date">Date</div>
                <div class="clock-offset">${offset}</div>
            </div>
        `;
    });
}

function getOffset(tz) {
    const d = new Date();
    const tzStr = d.toLocaleString('en-US', {timeZone: tz, timeZoneName: 'shortOffset'});
    return tzStr.split(' ').pop();
}

window.removeClock = function(tz) {
    clocks = clocks.filter(c => c !== tz);
    saveClocks();
    renderGrid();
};

function saveClocks() {
    localStorage.setItem('qu_clocks', JSON.stringify(clocks));
}

// Add Modal
const addModal = $('#addModal');
const tzSearch = $('#tzSearch');
const tzList = $('#tzList');
let allTz = [];
try { allTz = Intl.supportedValuesOf('timeZone'); } catch(e) {}

$('#addClockBtn').addEventListener('click', () => {
    addModal.classList.add('active');
    renderTzList(allTz);
});
$('#closeAdd').addEventListener('click', () => addModal.classList.remove('active'));

tzSearch.addEventListener('input', e => {
    const val = e.target.value.toLowerCase();
    const filtered = allTz.filter(tz => tz.toLowerCase().includes(val));
    renderTzList(filtered);
});

function renderTzList(list) {
    tzList.innerHTML = list.slice(0, 50).map(tz => 
        `<div class="tz-item" onclick="addClock('${tz}')">${tz.replace(/_/g, ' ')} (${getOffset(tz)})</div>`
    ).join('');
}

window.addClock = function(tz) {
    if(!clocks.includes(tz)) {
        clocks.push(tz);
        saveClocks();
        renderGrid();
    }
    addModal.classList.remove('active');
    tzSearch.value = '';
};

// Meeting Planner
$('#meetingBtn').addEventListener('click', () => {
    $('#meetingModal').classList.add('active');
    renderMeetingGrid();
});
$('#closeMeeting').addEventListener('click', () => $('#meetingModal').classList.remove('active'));

function renderMeetingGrid() {
    if(clocks.length === 0) return;
    const grid = $('#meetingGrid');
    let html = '<table><thead><tr><th>Timezone</th>';
    for(let i=0; i<24; i++) {
        html += `<th>${i}:00</th>`;
    }
    html += '</tr></thead><tbody>';
    
    clocks.forEach(tz => {
        const city = tz.split('/').pop().replace(/_/g, ' ');
        html += `<tr><td><strong>${city}</strong></td>`;
        const now = new Date();
        const baseFmt = new Intl.DateTimeFormat('en-US', {timeZone: tz, hour: 'numeric', hour12: false});
        const currentH = parseInt(baseFmt.format(now));
        
        for(let i=0; i<24; i++) {
            const h = (currentH + i) % 24;
            let cls = '';
            if(h >= 9 && h < 18) cls = 'work-hours';
            else if(h < 7 || h > 22) cls = 'sleep-hours';
            html += `<td class="${cls}">${h.toString().padStart(2,'0')}:00</td>`;
        }
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    grid.innerHTML = html;
}

setInterval(updateClocks, 1000);
updateClocks();

if(typeof QU !== 'undefined') QU.init({kofi:true, discover:true});
})();
