(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// State
let s = {
    type: 'linear', // linear, radial
    angle: 90,
    shape: 'circle',
    pos: 'center',
    stops: [
        { id: 1, color: '#8b5cf6', pos: 0 },
        { id: 2, color: '#ec4899', pos: 100 }
    ],
    activeStopId: 1
};

// Elements
const previewArea = $('#previewArea');
const stopsTrack = $('#stopsTrack');
const stopsPreview = $('#stopsPreview');
const cssOutput = $('#cssOutput');
const twOutput = $('#twOutput');

const typeRadios = $$('input[name="gType"]');
const linearControls = $('#linearControls');
const radialControls = $('#radialControls');
const angleSlider = $('#angleSlider');
const angleReadout = $('#angleReadout');
const radialShape = $('#radialShape');
const radialPos = $('#radialPos');

const stopColor = $('#stopColor');
const stopHex = $('#stopHex');
const stopPos = $('#stopPos');
const removeStopBtn = $('#removeStop');

function sortStops() {
    s.stops.sort((a, b) => a.pos - b.pos);
}

function getGradientString(forPreview = false) {
    sortStops();
    const stopStr = s.stops.map(st => `${st.color} ${st.pos}%`).join(', ');
    if (s.type === 'linear') {
        return `linear-gradient(${forPreview ? 90 : s.angle}deg, ${stopStr})`;
    } else {
        return `radial-gradient(${s.shape} at ${s.pos}, ${stopStr})`;
    }
}

function updateUI() {
    sortStops();
    const gradStr = getGradientString();
    
    // Update main preview
    previewArea.style.background = gradStr;
    
    // Update track preview (always linear 90deg)
    stopsPreview.style.background = `linear-gradient(90deg, ${s.stops.map(st => `${st.color} ${st.pos}%`).join(', ')})`;
    
    // Output code
    cssOutput.value = `background: ${gradStr};`;
    
    // Basic TW output (Tailwind doesn't perfectly support arbitrary complex gradients natively without arbitrary values or plugins, so we generate arbitrary values)
    if (s.type === 'linear') {
        twOutput.value = `bg-[linear-gradient(${s.angle}deg,${s.stops.map(st => `${st.color}_${st.pos}%`).join(',')})]`;
    } else {
        twOutput.value = `bg-[radial-gradient(${s.shape}_at_${s.pos.replace(' ', '_')},${s.stops.map(st => `${st.color}_${st.pos}%`).join(',')})]`;
    }

    renderThumbs();
    updateActiveStopUI();
}

function renderThumbs() {
    // Remove old thumbs
    $$('.stop-thumb').forEach(el => el.remove());
    
    s.stops.forEach(st => {
        const thumb = document.createElement('div');
        thumb.className = `stop-thumb ${st.id === s.activeStopId ? 'active' : ''}`;
        thumb.style.left = `${st.pos}%`;
        thumb.style.backgroundColor = st.color;
        thumb.dataset.id = st.id;
        
        thumb.addEventListener('mousedown', startDrag);
        thumb.addEventListener('click', (e) => {
            e.stopPropagation();
            s.activeStopId = st.id;
            updateUI();
        });
        
        stopsTrack.appendChild(thumb);
    });
}

function updateActiveStopUI() {
    const active = s.stops.find(st => st.id === s.activeStopId);
    if (!active) {
        if (s.stops.length > 0) s.activeStopId = s.stops[0].id;
        return;
    }
    
    stopColor.value = active.color;
    stopHex.value = active.color.toUpperCase();
    stopPos.value = active.pos;
    removeStopBtn.disabled = s.stops.length <= 2;
}

// Dragging Logic
let isDragging = false;
function startDrag(e) {
    isDragging = true;
    s.activeStopId = parseInt(e.target.dataset.id);
    updateUI();
    
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
}

function onDrag(e) {
    if (!isDragging) return;
    const rect = stopsTrack.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let pos = Math.round((x / rect.width) * 100);
    pos = Math.max(0, Math.min(100, pos));
    
    const active = s.stops.find(st => st.id === s.activeStopId);
    if (active && active.pos !== pos) {
        active.pos = pos;
        updateUI();
    }
}

function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
}

// Adding stops
stopsTrack.addEventListener('click', (e) => {
    if (e.target !== stopsTrack && e.target !== stopsPreview) return;
    const rect = stopsTrack.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let pos = Math.round((x / rect.width) * 100);
    pos = Math.max(0, Math.min(100, pos));
    
    const newId = Date.now();
    s.stops.push({
        id: newId,
        color: '#ffffff', // Default
        pos: pos
    });
    s.activeStopId = newId;
    updateUI();
});

// Controls Events
typeRadios.forEach(r => r.addEventListener('change', (e) => {
    s.type = e.target.value;
    linearControls.style.display = s.type === 'linear' ? 'block' : 'none';
    radialControls.style.display = s.type === 'radial' ? 'block' : 'none';
    updateUI();
}));

angleSlider.addEventListener('input', (e) => {
    s.angle = e.target.value;
    angleReadout.textContent = `${s.angle}°`;
    updateUI();
});

radialShape.addEventListener('change', e => { s.shape = e.target.value; updateUI(); });
radialPos.addEventListener('change', e => { s.pos = e.target.value; updateUI(); });

stopColor.addEventListener('input', e => {
    const active = s.stops.find(st => st.id === s.activeStopId);
    if (active) { active.color = e.target.value; updateUI(); }
});

stopHex.addEventListener('change', e => {
    const active = s.stops.find(st => st.id === s.activeStopId);
    let val = e.target.value;
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
        if(active) { active.color = val; updateUI(); }
    }
});

stopPos.addEventListener('change', e => {
    const active = s.stops.find(st => st.id === s.activeStopId);
    let pos = parseInt(e.target.value);
    if (!isNaN(pos)) {
        pos = Math.max(0, Math.min(100, pos));
        if (active) { active.pos = pos; updateUI(); }
    }
});

removeStopBtn.addEventListener('click', () => {
    if (s.stops.length <= 2) return;
    s.stops = s.stops.filter(st => st.id !== s.activeStopId);
    s.activeStopId = s.stops[0].id;
    updateUI();
});

function randomHexColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

$('#randomizeBtn').addEventListener('click', () => {
    s.type = Math.random() > 0.5 ? 'linear' : 'radial';
    $('input[name="gType"][value="'+s.type+'"]').checked = true;
    linearControls.style.display = s.type === 'linear' ? 'block' : 'none';
    radialControls.style.display = s.type === 'radial' ? 'block' : 'none';
    
    s.angle = Math.floor(Math.random() * 360);
    angleSlider.value = s.angle;
    angleReadout.textContent = `${s.angle}°`;
    
    s.stops = [
        { id: 1, color: randomHexColor(), pos: 0 },
        { id: 2, color: randomHexColor(), pos: 100 }
    ];
    s.activeStopId = 1;
    updateUI();
});

// Copy buttons
const copyCssBtn = $('#copyCss');
copyCssBtn.addEventListener('click', () => {
    cssOutput.select();
    document.execCommand('copy');
    const orig = copyCssBtn.textContent;
    copyCssBtn.textContent = '✅ Copied!';
    setTimeout(() => copyCssBtn.textContent = orig, 2000);
});

const copyTwBtn = $('#copyTw');
copyTwBtn.addEventListener('click', () => {
    twOutput.select();
    document.execCommand('copy');
    const orig = copyTwBtn.textContent;
    copyTwBtn.textContent = '✅ Copied!';
    setTimeout(() => copyTwBtn.textContent = orig, 2000);
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

// Init
updateUI();

})();
