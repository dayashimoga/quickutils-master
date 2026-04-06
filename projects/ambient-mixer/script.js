(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Sound library with Mixkit preview URLs for demo purposes
const SOUNDS = [
    { id: 'rain', icon: '🌧️', name: 'Light Rain', url: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3' },
    { id: 'thunder', icon: '🌩️', name: 'Thunder', url: 'https://assets.mixkit.co/sfx/preview/mixkit-distant-thunder-explosion-1944.mp3' },
    { id: 'cafe', icon: '☕', name: 'Cafe Chatter', url: 'https://assets.mixkit.co/sfx/preview/mixkit-restaurant-crowd-ambience-443.mp3' },
    { id: 'fire', icon: '🔥', name: 'Campfire', url: 'https://assets.mixkit.co/sfx/preview/mixkit-camp-fire-burning-loop-238.mp3' },
    { id: 'forest', icon: '🌲', name: 'Forest', url: 'https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-and-insects-170.mp3' },
    { id: 'bird', icon: '🐦', name: 'Birds', url: 'https://assets.mixkit.co/sfx/preview/mixkit-morning-birds-2472.mp3' },
    { id: 'river', icon: '🌊', name: 'River Stream', url: 'https://assets.mixkit.co/sfx/preview/mixkit-small-river-stream-loop-2311.mp3' },
    { id: 'wind', icon: '💨', name: 'Wind', url: 'https://assets.mixkit.co/sfx/preview/mixkit-wind-howling-loop-2395.mp3' }
];

const state = {
    masterVolume: 0.5,
    isPlaying: false,
    sounds: {}, // track audio contexts/elements
    timer: null,
    timeLeft: 0
};

// Initialization
const grid = $('#soundGrid');
SOUNDS.forEach(s => {
    // Create Audio Element
    const audio = new Audio();
    audio.src = s.url;
    audio.loop = true;
    audio.volume = 0;
    document.body.appendChild(audio);
    
    state.sounds[s.id] = {
        audio: audio,
        volume: 0.5, // local volume (0-1)
        active: false
    };

    // Create UI Card
    const card = document.createElement('div');
    card.className = 'sound-card';
    card.id = `card-${s.id}`;
    card.innerHTML = `
        <div class="sc-header">
            <div class="sc-info">
                <div class="sc-icon">${s.icon}</div>
                <div class="sc-title">${s.name}</div>
            </div>
            <div class="sc-toggle" data-id="${s.id}">✓</div>
        </div>
        <div class="sc-controls">
            <input type="range" class="vol-slider sc-slider" data-id="${s.id}" min="0" max="100" value="50">
        </div>
    `;
    grid.appendChild(card);
});

// Sound Controls
$$('.sc-toggle').forEach(t => {
    t.addEventListener('click', () => {
        const id = t.dataset.id;
        const s = state.sounds[id];
        s.active = !s.active;
        
        t.classList.toggle('on', s.active);
        $(`#card-${id}`).classList.toggle('active', s.active);
        
        updateAudio(id);
        
        // Auto-play master if turning on a sound and it's stopped
        if (s.active && !state.isPlaying && getActiveSounds().length > 0) {
            toggleMasterPlay();
        } else if (!s.active && getActiveSounds().length === 0 && state.isPlaying) {
             toggleMasterPlay(); // Stop if all sounds off
        }
    });
});

$$('.sc-slider').forEach(sl => {
    sl.addEventListener('input', (e) => {
        const id = e.target.dataset.id;
        state.sounds[id].volume = e.target.value / 100;
        updateAudio(id);
    });
});

function getActiveSounds() {
    return Object.keys(state.sounds).filter(k => state.sounds[k].active);
}

function updateAudio(id) {
    const s = state.sounds[id];
    if (s.active && state.isPlaying) {
        s.audio.volume = s.volume * state.masterVolume;
        if (s.audio.paused) {
            // Must catch promise to avoid DOMException on first interact
            s.audio.play().catch(e => console.log('Audio play blocked:', e));
        }
    } else {
        s.audio.pause();
    }
}

function updateAllAudio() {
    Object.keys(state.sounds).forEach(id => updateAudio(id));
}

// Master Controls
const masterPlayBtn = $('#masterPlayBtn');
const masterVol = $('#masterVol');

function toggleMasterPlay() {
    state.isPlaying = !state.isPlaying;
    masterPlayBtn.textContent = state.isPlaying ? '⏸' : '▶';
    masterPlayBtn.classList.toggle('playing', state.isPlaying);
    updateAllAudio();
}

masterPlayBtn.addEventListener('click', toggleMasterPlay);

masterVol.addEventListener('input', (e) => {
    state.masterVolume = e.target.value / 100;
    $('#masterVolReadout').textContent = e.target.value + '%';
    updateAllAudio();
});

// Presets Logic
function loadPreset(mixObj) {
    // Reset all
    Object.keys(state.sounds).forEach(id => {
        state.sounds[id].active = !!mixObj[id];
        if (mixObj[id]) {
            state.sounds[id].volume = mixObj[id] / 100;
            $(`input[data-id="${id}"]`).value = mixObj[id];
        }
        
        const toggle = $(`.sc-toggle[data-id="${id}"]`);
        toggle.classList.toggle('on', !!mixObj[id]);
        $(`#card-${id}`).classList.toggle('active', !!mixObj[id]);
    });
    
    if (!state.isPlaying) toggleMasterPlay();
    else updateAllAudio();
}

function attachLoadPresetEvents() {
    $$('.load-btn').forEach(btn => {
        btn.onclick = function() {
            const mix = JSON.parse(this.closest('.preset-item').dataset.mix);
            loadPreset(mix);
        };
    });
    
    $$('.delete-preset-btn').forEach(btn => {
        btn.onclick = function(e) {
            e.stopPropagation();
            if(confirm('Delete preset?')) {
                const id = this.dataset.pid;
                let userPresets = JSON.parse(localStorage.getItem('ambient_presets') || '[]');
                userPresets = userPresets.filter(p => p.id !== id);
                localStorage.setItem('ambient_presets', JSON.stringify(userPresets));
                renderUserPresets();
            }
        };
    });
}

function renderUserPresets() {
    const list = $('#presetsList');
    // Remove existing user presets
    $$('.user-preset').forEach(el => el.remove());
    
    const userPresets = JSON.parse(localStorage.getItem('ambient_presets') || '[]');
    userPresets.forEach(p => {
        const el = document.createElement('div');
        el.className = 'preset-item user-preset';
        el.dataset.mix = JSON.stringify(p.mix);
        el.innerHTML = `
            <div class="preset-info">
                <h4>${escapeHtml(p.name)}</h4>
                <span>${Object.keys(p.mix).map(k => SOUNDS.find(s=>s.id===k)?.icon||'').join(' ')}</span>
            </div>
            <div style="display:flex;gap:5px">
                <button class="btn btn-sm btn-secondary load-btn">Load</button>
                <button class="btn btn-sm delete-preset-btn" data-pid="${p.id}" style="padding:0.4rem;background:transparent;border:none;color:var(--text-muted)">🗑️</button>
            </div>
        `;
        list.appendChild(el);
    });
    attachLoadPresetEvents();
}

// Modal
const modal = $('#saveModal');
$('#saveMixBtn').addEventListener('click', () => {
    const active = getActiveSounds();
    if (active.length === 0) return alert('Turn on at least one sound to save a mix.');
    modal.classList.add('active');
    $('#presetName').focus();
});

$('#closeModal').addEventListener('click', () => modal.classList.remove('active'));

$('#confirmSaveBtn').addEventListener('click', () => {
    const name = $('#presetName').value.trim();
    if (!name) return;
    
    const mix = {};
    getActiveSounds().forEach(id => {
        mix[id] = Math.round(state.sounds[id].volume * 100);
    });
    
    const userPresets = JSON.parse(localStorage.getItem('ambient_presets') || '[]');
    userPresets.push({ id: 'p_'+Date.now(), name, mix });
    localStorage.setItem('ambient_presets', JSON.stringify(userPresets));
    
    renderUserPresets();
    modal.classList.remove('active');
    $('#presetName').value = '';
});

// Sleep Timer
const timerSelect = $('#timerSelect');
const timerReadout = $('#timerReadout');
const timeLeftSpan = $('#timeLeft');

timerSelect.addEventListener('change', (e) => {
    clearInterval(state.timer);
    const mins = parseInt(e.target.value);
    
    if (mins === 0) {
        timerReadout.style.display = 'none';
        return;
    }
    
    state.timeLeft = mins * 60;
    timerReadout.style.display = 'block';
    
    state.timer = setInterval(() => {
        state.timeLeft--;
        const m = Math.floor(state.timeLeft / 60);
        const s = state.timeLeft % 60;
        timeLeftSpan.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        
        // Dynamic fade out in last 10 seconds
        if (state.timeLeft <= 10 && state.timeLeft > 0) {
            masterVol.value = (state.masterVolume * 100) * (state.timeLeft / 10);
            $('#masterVolReadout').textContent = Math.round(masterVol.value) + '%';
            state.masterVolume = masterVol.value / 100;
            updateAllAudio();
        }
        
        if (state.timeLeft <= 0) {
            clearInterval(state.timer);
            if (state.isPlaying) toggleMasterPlay();
            timerSelect.value = "0";
            timerReadout.style.display = 'none';
            // Restore volume visually
            masterVol.value = 50;
            state.masterVolume = 0.5;
            $('#masterVolReadout').textContent = '50%';
        }
    }, 1000);
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

// Init UI
renderUserPresets();

})();
