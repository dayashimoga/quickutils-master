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


// ── Presets ──
const PRESETS = [
    { name:'Sunset', type:'linear', angle:45, shape:'circle', pos:'center', stops:[{id:1,color:'#f59e0b',pos:0},{id:2,color:'#ef4444',pos:100}] },
    { name:'Ocean', type:'linear', angle:180, shape:'circle', pos:'center', stops:[{id:1,color:'#06b6d4',pos:0},{id:2,color:'#3b82f6',pos:100}] },
    { name:'Cyberpunk', type:'linear', angle:90, shape:'circle', pos:'center', stops:[{id:1,color:'#f43f5e',pos:0},{id:2,color:'#8b5cf6',pos:100}] },
    { name:'Forest', type:'radial', angle:90, shape:'circle', pos:'center', stops:[{id:1,color:'#10b981',pos:0},{id:2,color:'#064e3b',pos:100}] },
    { name:'Midnight', type:'linear', angle:135, shape:'circle', pos:'center', stops:[{id:1,color:'#1e1b4b',pos:0},{id:2,color:'#312e81',pos:45},{id:3,color:'#8b5cf6',pos:100}] },
    { name:'Peach', type:'radial', angle:90, shape:'circle', pos:'top left', stops:[{id:1,color:'#ffedd5',pos:0},{id:2,color:'#fdba74',pos:50},{id:3,color:'#f97316',pos:100}] },
];

function renderPresets() {
    const gallery = $('#presetGallery');
    if (!gallery) return;
    gallery.innerHTML = '';
    PRESETS.forEach(p => {
        // Generate CSS background string for preset
        const stopStr = p.stops.sort((a,b)=>a.pos-b.pos).map(st => `${st.color} ${st.pos}%`).join(', ');
        const bg = p.type==='linear' ? `linear-gradient(${p.angle}deg, ${stopStr})` : `radial-gradient(${p.shape} at ${p.pos}, ${stopStr})`;
        
        const div = document.createElement('div');
        div.style.height = '60px';
        div.style.borderRadius = '8px';
        div.style.background = bg;
        div.style.cursor = 'pointer';
        div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        div.title = p.name;
        div.addEventListener('click', () => {
            s.type = p.type;
            s.angle = p.angle;
            s.shape = p.shape;
            s.pos = p.pos;
            // Deep copy stops
            s.stops = JSON.parse(JSON.stringify(p.stops));
            s.activeStopId = s.stops[0].id;
            
            // Update UI elements
            $('input[name="gType"][value="'+s.type+'"]').checked = true;
            linearControls.style.display = s.type === 'linear' ? 'block' : 'none';
            radialControls.style.display = s.type === 'radial' ? 'block' : 'none';
            angleSlider.value = s.angle;
            angleReadout.textContent = `${s.angle}°`;
            radialShape.value = s.shape;
            radialPos.value = s.pos;
            
            renderPresets();
updateUI();
        });
        gallery.appendChild(div);
    });
}

// Elements
const previewArea = $('#previewArea');
const stopsTrack = $('#stopsTrack');
const stopsPreview = $('#stopsPreview');
const cssOutput = $('#cssOutput');
const animOutput = $('#animOutput');
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
    
    
    // Animation Output
    animOutput.value = `.animated-gradient {
    background: ${gradStr};
    background-size: 400% 400%;
    animation: gradientAnim 15s ease infinite;
}

@keyframes gradientAnim {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}`;

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
            renderPresets();
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
    renderPresets();
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
        renderPresets();
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
    renderPresets();
updateUI();
});

// Controls Events
typeRadios.forEach(r => r.addEventListener('change', (e) => {
    s.type = e.target.value;
    linearControls.style.display = s.type === 'linear' ? 'block' : 'none';
    radialControls.style.display = s.type === 'radial' ? 'block' : 'none';
    renderPresets();
updateUI();
}));

angleSlider.addEventListener('input', (e) => {
    s.angle = e.target.value;
    angleReadout.textContent = `${s.angle}°`;
    renderPresets();
updateUI();
});

radialShape.addEventListener('change', e => { s.shape = e.target.value; renderPresets();
updateUI(); });
radialPos.addEventListener('change', e => { s.pos = e.target.value; renderPresets();
updateUI(); });

stopColor.addEventListener('input', e => {
    const active = s.stops.find(st => st.id === s.activeStopId);
    if (active) { active.color = e.target.value; renderPresets();
updateUI(); }
});

stopHex.addEventListener('change', e => {
    const active = s.stops.find(st => st.id === s.activeStopId);
    let val = e.target.value;
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
        if(active) { active.color = val; renderPresets();
updateUI(); }
    }
});

stopPos.addEventListener('change', e => {
    const active = s.stops.find(st => st.id === s.activeStopId);
    let pos = parseInt(e.target.value);
    if (!isNaN(pos)) {
        pos = Math.max(0, Math.min(100, pos));
        if (active) { active.pos = pos; renderPresets();
updateUI(); }
    }
});

removeStopBtn.addEventListener('click', () => {
    if (s.stops.length <= 2) return;
    s.stops = s.stops.filter(st => st.id !== s.activeStopId);
    s.activeStopId = s.stops[0].id;
    renderPresets();
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
    renderPresets();
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


// ── Tabs ──
$('#tabCss').addEventListener('click', () => { $('#outCss').style.display='block'; $('#outAnim').style.display='none'; $('#outTw').style.display='none'; });
$('#tabAnim').addEventListener('click', () => { $('#outCss').style.display='none'; $('#outAnim').style.display='block'; $('#outTw').style.display='none'; });
$('#tabTw').addEventListener('click', () => { $('#outCss').style.display='none'; $('#outAnim').style.display='none'; $('#outTw').style.display='block'; });

const copyAnimBtn = $('#copyAnim');
copyAnimBtn.addEventListener('click', () => {
    animOutput.select();
    document.execCommand('copy');
    const orig = copyAnimBtn.textContent;
    copyAnimBtn.textContent = '✅ Copied!';
    setTimeout(() => copyAnimBtn.textContent = orig, 2000);
});

// Fullscreen
$('#fullScreenBtn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        previewArea.requestFullscreen().catch(err => {
            alert(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
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
renderPresets();
updateUI();

})();
