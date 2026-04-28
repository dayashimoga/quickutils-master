/* =============================================
   Music Maker — Web Audio Engine
   Professional step sequencer, synthesizer,
   effects processing, and recording.
   ============================================= */
import { rotatePattern } from './music-maker-utils.js';

(() => {
'use strict';

// ── Audio Context ──
let audioCtx = null;
let masterGain = null;
let analyser = null;
let compressor = null;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.75;
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.ratio.value = 4;
    compressor.knee.value = 30;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    masterGain.connect(compressor);
    compressor.connect(analyser);
    analyser.connect(audioCtx.destination);
}

// ── State ──
const DRUMS = [
    { id: 'kick',    name: 'Kick',     key: 'q' },
    { id: 'snare',   name: 'Snare',    key: 'w' },
    { id: 'hihat',   name: 'Hi-Hat',   key: 'e' },
    { id: 'openhat', name: 'Open Hat', key: 'r' },
    { id: 'clap',    name: 'Clap',     key: 't' },
    { id: 'tom',     name: 'Tom',      key: 'y' },
    { id: 'ride',    name: 'Ride',     key: 'u' },
    { id: 'crash',   name: 'Crash',    key: 'i' },
];

const STEPS = 16;
let PATTERNS = Array.from({ length: 4 }, () => ({ drums: DRUMS.map(() => Array(STEPS).fill(false)), synth: Array(STEPS).fill(null) }));
const drumVolumes = DRUMS.map(() => 0.8);

let currentPattern = 0;
let isPlaying = false;
let currentStep = -1;
let bpm = 120;
let swing = 0;
let stepTimer = null;

let history = { stack: [], index: -1 };
function saveHistory() {
    const state = JSON.parse(JSON.stringify(PATTERNS));
    history.stack = history.stack.slice(0, history.index + 1);
    history.stack.push(state);
    if (history.stack.length > 50) history.stack.shift();
    else history.index++;
}
function doUndo() {
    if (history.index > 0) {
        history.index--;
        PATTERNS = JSON.parse(JSON.stringify(history.stack[history.index]));
        buildSequencer();
    }
}
function doRedo() {
    if (history.index < history.stack.length - 1) {
        history.index++;
        PATTERNS = JSON.parse(JSON.stringify(history.stack[history.index]));
        buildSequencer();
    }
}

let synthNoteToPlace = "C4";
// Synth state
let synthWave = 'sine';
let synthOctave = 4;
let synthEnvelope = { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3 };
let synthFilter = 5000;
let synthResonance = 1;
let synthDetune = 0;
let synthVolume = 0.7;
let activeNotes = {};

// Effects state
const effects = {
    reverb: { enabled: false, decay: 2.0, mix: 0.3, node: null, gainWet: null, gainDry: null },
    delay: { enabled: false, time: 0.3, feedback: 0.4, mix: 0.25, node: null, feedbackGain: null, gainWet: null, gainDry: null },
    distortion: { enabled: false, drive: 20, node: null },
    compressor: { enabled: true }
};

// Presets
const DRUM_PRESETS = {
    house: [
        [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
        [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
        [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    ],
    hiphop: [
        [1,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
        [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
        [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    ],
    techno: [
        [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
        [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
        [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
        [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        [0,0,0,1, 0,0,0,1, 0,0,0,0, 0,0,0,0],
        [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
        [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    ]
};

const SYNTH_PRESETS = {
    default: { wave: 'sine', attack: 10, decay: 200, sustain: 60, release: 300, filter: 5000, resonance: 1, detune: 0 },
    fatbass: { wave: 'sawtooth', attack: 10, decay: 300, sustain: 40, release: 150, filter: 800, resonance: 8, detune: -12 },
    leady: { wave: 'square', attack: 20, decay: 100, sustain: 80, release: 200, filter: 8000, resonance: 5, detune: 5 },
    pad: { wave: 'triangle', attack: 800, decay: 1000, sustain: 100, release: 1500, filter: 2000, resonance: 1, detune: -5 },
    pluck: { wave: 'square', attack: 5, decay: 100, sustain: 0, release: 100, filter: 3000, resonance: 10, detune: 0 }
};

// ── Drum Synthesis ──
function playDrum(drumId, vol = 0.8) {
    initAudio();
    const t = audioCtx.currentTime;
    const v = vol;

    switch (drumId) {
        case 'kick': {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
            gain.gain.setValueAtTime(v, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(t);
            osc.stop(t + 0.4);
            // Add click
            const click = audioCtx.createOscillator();
            const cGain = audioCtx.createGain();
            click.type = 'square';
            click.frequency.value = 800;
            cGain.gain.setValueAtTime(v * 0.3, t);
            cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
            click.connect(cGain);
            cGain.connect(masterGain);
            click.start(t);
            click.stop(t + 0.02);
            break;
        }
        case 'snare': {
            const noise = createNoise(audioCtx, 0.15);
            const nGain = audioCtx.createGain();
            const nFilter = audioCtx.createBiquadFilter();
            nFilter.type = 'highpass';
            nFilter.frequency.value = 1000;
            nGain.gain.setValueAtTime(v * 0.6, t);
            nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            noise.connect(nFilter);
            nFilter.connect(nGain);
            nGain.connect(masterGain);
            // Body
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
            gain.gain.setValueAtTime(v * 0.5, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(t);
            osc.stop(t + 0.1);
            break;
        }
        case 'hihat': {
            const noise = createNoise(audioCtx, 0.06);
            const gain = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 7000;
            gain.gain.setValueAtTime(v * 0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
            break;
        }
        case 'openhat': {
            const noise = createNoise(audioCtx, 0.3);
            const gain = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 8000;
            filter.Q.value = 2;
            gain.gain.setValueAtTime(v * 0.35, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
            break;
        }
        case 'clap': {
            for (let i = 0; i < 3; i++) {
                const noise = createNoise(audioCtx, 0.04);
                const gain = audioCtx.createGain();
                const filter = audioCtx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 2500;
                gain.gain.setValueAtTime(0, t + i * 0.015);
                gain.gain.linearRampToValueAtTime(v * 0.5, t + i * 0.015 + 0.001);
                gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.015 + 0.04);
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(masterGain);
            }
            break;
        }
        case 'tom': {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(60, t + 0.2);
            gain.gain.setValueAtTime(v * 0.7, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(t);
            osc.stop(t + 0.25);
            break;
        }
        case 'ride': {
            const noise = createNoise(audioCtx, 0.5);
            const gain = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 9000;
            gain.gain.setValueAtTime(v * 0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
            break;
        }
        case 'crash': {
            const noise = createNoise(audioCtx, 0.8);
            const gain = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 5000;
            gain.gain.setValueAtTime(v * 0.4, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
            break;
        }
    }
}

function createNoise(ctx, duration) {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.start(ctx.currentTime);
    return source;
}

// ── Synth ──
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

function noteToFreq(note, octave) {
    const noteIndex = NOTE_NAMES.indexOf(note);
    const midi = (octave + 1) * 12 + noteIndex;
    return 440 * Math.pow(2, (midi - 69) / 12);
}

function playSynthNote(note, octave) {
    initAudio();
    const key = note + octave;
    if (activeNotes[key]) return;

    const t = audioCtx.currentTime;
    const freq = noteToFreq(note, octave);

    const osc = audioCtx.createOscillator();
    osc.type = synthWave;
    osc.frequency.value = freq;
    osc.detune.value = synthDetune;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = synthFilter;
    filter.Q.value = synthResonance;

    const envGain = audioCtx.createGain();
    envGain.gain.setValueAtTime(0, t);
    envGain.gain.linearRampToValueAtTime(synthVolume, t + synthEnvelope.attack);
    envGain.gain.linearRampToValueAtTime(synthVolume * synthEnvelope.sustain, t + synthEnvelope.attack + synthEnvelope.decay);

    osc.connect(filter);
    filter.connect(envGain);
    envGain.connect(masterGain);
    osc.start(t);

    activeNotes[key] = { osc, envGain, filter };
    highlightPianoKey(note, octave, true);
}

function stopSynthNote(note, octave) {
    const key = note + octave;
    const noteObj = activeNotes[key];
    if (!noteObj) return;

    const t = audioCtx.currentTime;
    noteObj.envGain.gain.cancelScheduledValues(t);
    noteObj.envGain.gain.setValueAtTime(noteObj.envGain.gain.value, t);
    noteObj.envGain.gain.linearRampToValueAtTime(0, t + synthEnvelope.release);
    noteObj.osc.stop(t + synthEnvelope.release + 0.05);

    delete activeNotes[key];
    highlightPianoKey(note, octave, false);
}

// ── Step Sequencer Engine ──
function startSequencer() {
    if (isPlaying) return;
    initAudio();
    isPlaying = true;
    currentStep = -1;
    document.getElementById('playBtn').classList.add('active');
    document.getElementById('playBtn').textContent = '⏸';
    tick();
}

function stopSequencer() {
    isPlaying = false;
    currentStep = -1;
    if (stepTimer) clearTimeout(stepTimer);
    document.getElementById('playBtn').classList.remove('active');
    document.getElementById('playBtn').textContent = '▶';
    document.querySelectorAll('.seq-step.current').forEach(el => el.classList.remove('current'));
    document.getElementById('beatDisplay').textContent = '1.1';
    document.getElementById('timeDisplay').textContent = '0:00';
}

function tick() {
    if (!isPlaying) return;
    currentStep = (currentStep + 1) % STEPS;

    // Clear previous highlights
    document.querySelectorAll('.seq-step.current').forEach(el => el.classList.remove('current'));

    
    // Play synth
    const synthNote = PATTERNS[currentPattern].synth[currentStep];
    if (synthNote) {
        const noteMatch = synthNote.match(/([A-G]#?)(\d)/);
        if (noteMatch) {
            playSynthNote(noteMatch[1], parseInt(noteMatch[2]));
            // Auto release after 1 step
            const releaseTime = (60 / bpm) * 1000 / 4;
            setTimeout(() => stopSynthNote(noteMatch[1], parseInt(noteMatch[2])), releaseTime * 0.8);
        }
    }
    
    // Play active drums
    const pattern = PATTERNS[currentPattern].drums;
    
    DRUMS.forEach((drum, drumIdx) => {
        if (pattern[drumIdx][currentStep]) {
            playDrum(drum.id, drumVolumes[drumIdx]);
        }
        // Highlight current step
        const stepEl = document.querySelector(`.seq-row[data-drum="${drum.id}"] .seq-step[data-step="${currentStep}"]`);
        if (stepEl) stepEl.classList.add('current');
    });

    // Update display
    const beat = Math.floor(currentStep / 4) + 1;
    const subBeat = (currentStep % 4) + 1;
    document.getElementById('beatDisplay').textContent = `${beat}.${subBeat}`;

    // Calculate next step timing with swing
    const baseInterval = (60 / bpm) * 1000 / 4; // 16th notes
    let interval = baseInterval;
    if (swing > 0 && currentStep % 2 === 0) {
        interval = baseInterval * (1 + swing * 0.004);
    } else if (swing > 0) {
        interval = baseInterval * (1 - swing * 0.004);
    }

    stepTimer = setTimeout(tick, interval);
}

// ── Build UI ──
function buildSequencer() {
    const grid = document.getElementById('sequencerGrid');
    grid.innerHTML = '';

    DRUMS.forEach((drum, drumIdx) => {
        const row = document.createElement('div');
        row.className = 'seq-row';
        row.dataset.drum = drum.id;

        const label = document.createElement('div');
        label.className = 'seq-label';
        label.textContent = drum.name;
        label.title = `Click to preview ${drum.name}`;
        label.addEventListener('click', () => { initAudio(); playDrum(drum.id); });
        row.appendChild(label);

        for (let s = 0; s < STEPS; s++) {
            const step = document.createElement('div');
            step.className = 'seq-step';
            step.dataset.step = s;
            if (s % 4 === 0) step.classList.add('beat-marker');
            if (PATTERNS[currentPattern].drums[drumIdx][s]) step.classList.add('active');
            step.addEventListener('click', () => {
                saveHistory();
                PATTERNS[currentPattern].drums[drumIdx][s] = !PATTERNS[currentPattern].drums[drumIdx][s];
                step.classList.toggle('active');
            });
            row.appendChild(step);
        }

        // Volume slider per row
        const vol = document.createElement('input');
        vol.type = 'range';
        vol.className = 'slider seq-vol';
        vol.min = 0; vol.max = 100; vol.value = drumVolumes[drumIdx] * 100;
        vol.title = `${drum.name} volume`;
        vol.addEventListener('input', () => { drumVolumes[drumIdx] = vol.value / 100; });
        row.appendChild(vol);

        grid.appendChild(row);
    });

    // Add Synth Roll Row
    const synthRow = document.createElement('div');
    synthRow.className = 'seq-row synth-row';
    const sLabel = document.createElement('div');
    sLabel.className = 'seq-label';
    sLabel.innerHTML = `Melody<br><small style="color:var(--text-muted)">[${synthNoteToPlace}]</small>`;
    sLabel.title = "Click a piano key to change note, then click grid to plot";
    synthRow.appendChild(sLabel);
    
    for (let s = 0; s < STEPS; s++) {
        const step = document.createElement('div');
        step.className = 'seq-step synth-step';
        step.dataset.step = s;
        if (s % 4 === 0) step.classList.add('beat-marker');
        const note = PATTERNS[currentPattern].synth[s];
        if (note) {
            step.classList.add('active');
            step.textContent = note.replace(/\d/, '');
        }
        step.addEventListener('click', () => {
            saveHistory();
            if (step.classList.contains('active')) {
                PATTERNS[currentPattern].synth[s] = null;
                step.classList.remove('active');
                step.textContent = '';
            } else {
                PATTERNS[currentPattern].synth[s] = synthNoteToPlace;
                step.classList.add('active');
                step.textContent = synthNoteToPlace.replace(/\d/, '');
            }
        });
        synthRow.appendChild(step);
    }
    grid.appendChild(synthRow);
}

function buildPiano() {
    const keyboard = document.getElementById('pianoKeyboard');
    keyboard.innerHTML = '';
    const notes = NOTE_NAMES;
    const octave = synthOctave;

    // Build 2 octaves
    for (let oct = octave; oct <= octave + 1; oct++) {
        for (let i = 0; i < notes.length; i++) {
            const note = notes[i];
            const isBlack = note.includes('#');
            const key = document.createElement('div');
            key.className = `piano-key ${isBlack ? 'black' : 'white'}`;
            key.dataset.note = note;
            key.dataset.octave = oct;
            if (!isBlack) key.textContent = `${note}${oct}`;

            key.addEventListener('mousedown', (e) => {
                e.preventDefault();
                playSynthNote(note, oct); synthNoteToPlace = note + oct; buildSequencer();
            });
            key.addEventListener('mouseup', () => stopSynthNote(note, oct));
            key.addEventListener('mouseleave', () => stopSynthNote(note, oct));
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                playSynthNote(note, oct); synthNoteToPlace = note + oct; buildSequencer();
            }, { passive: false });
            key.addEventListener('touchend', () => stopSynthNote(note, oct));

            keyboard.appendChild(key);
        }
    }
}

function highlightPianoKey(note, octave, active) {
    const key = document.querySelector(`.piano-key[data-note="${note}"][data-octave="${octave}"]`);
    if (key) {
        if (active) key.classList.add('playing');
        else key.classList.remove('playing');
    }
}

// ── Keyboard Mapping (QWERTY → Notes) ──
const KEY_MAP = {
    'a': 'C', 'w': 'C#', 's': 'D', 'e': 'D#', 'd': 'E',
    'f': 'F', 't': 'F#', 'g': 'G', 'y': 'G#', 'h': 'A',
    'u': 'A#', 'j': 'B', 'k': 'C', 'o': 'C#', 'l': 'D'
};

const heldKeys = new Set();

document.addEventListener('keydown', (e) => {
    if (e.repeat || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    const k = e.key.toLowerCase();

    if (k === ' ') {
        e.preventDefault();
        isPlaying ? stopSequencer() : startSequencer();
        return;
    }
    if (k === 'escape') { stopSequencer(); return; }
    if (k === 'z' && !e.ctrlKey) { changeOctave(-1); return; }
    if (k === 'x' && !e.ctrlKey) { changeOctave(1); return; }
    if (k === 'z' && e.ctrlKey) { doUndo(); return; }
    if (k === 'y' && e.ctrlKey) { doRedo(); return; }
    if (k === 'r' && !e.ctrlKey) { toggleRecording(); return; }
    if (k === '?') { document.getElementById('shortcutsModal').style.display = 'flex'; return; }

    // Piano keys
    if (KEY_MAP[k] && !heldKeys.has(k)) {
        heldKeys.add(k);
        const note = KEY_MAP[k];
        let oct = synthOctave;
        if (['k', 'o', 'l'].includes(k)) oct = synthOctave + 1;
        playSynthNote(note, oct); synthNoteToPlace = note + oct; buildSequencer();
    }
});

document.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    heldKeys.delete(k);
    if (KEY_MAP[k]) {
        const note = KEY_MAP[k];
        let oct = synthOctave;
        if (['k', 'o', 'l'].includes(k)) oct = synthOctave + 1;
        stopSynthNote(note, oct);
    }
});

function changeOctave(delta) {
    const sel = document.getElementById('octaveSelect');
    const newOct = Math.max(2, Math.min(6, synthOctave + delta));
    synthOctave = newOct;
    sel.value = newOct;
    buildPiano();
}

// ── Recording ──
function toggleRecording() {
    if (!isRecording) {
        initAudio();
        const dest = audioCtx.createMediaStreamDestination();
        analyser.connect(dest);
        mediaRecorder = new MediaRecorder(dest.stream);
        recordedChunks = [];
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
        mediaRecorder.onstop = exportRecording;
        mediaRecorder.start();
        isRecording = true;
        document.getElementById('recordBtn').classList.add('recording');
        document.getElementById('recordBtn').textContent = '⏹ Stop';
    } else {
        mediaRecorder.stop();
        isRecording = false;
        document.getElementById('recordBtn').classList.remove('recording');
        document.getElementById('recordBtn').textContent = '⏺ Rec';
    }
}

function exportRecording() {
    const blob = new Blob(recordedChunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `musicmaker-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
}

// ── Export WAV ──
document.getElementById('exportBtn').addEventListener('click', () => {
    if (!isRecording) {
        toggleRecording();
        if (!isPlaying) startSequencer();
        // Record 8 bars then stop
        const bars = 8;
        const duration = (60 / bpm) * 4 * bars * 1000;
        setTimeout(() => {
            toggleRecording();
            stopSequencer();
        }, duration);
    }
});

// ── Visualizer ──
function drawVisualizer() {
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');
    const mode = document.getElementById('vizMode').value;
    const W = canvas.width = canvas.clientWidth * 2;
    const H = canvas.height = canvas.clientHeight * 2;
    ctx.scale(1, 1);

    function draw() {
        requestAnimationFrame(draw);
        if (!analyser) { ctx.clearRect(0, 0, W, H); return; }

        if (mode === 'waveform') {
            const data = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteTimeDomainData(data);
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-input').trim() || 'rgba(0,0,0,0.3)';
            ctx.fillRect(0, 0, W, H);
            ctx.lineWidth = 2;
            ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#8b5cf6';
            ctx.beginPath();
            const sliceWidth = W / data.length;
            let x = 0;
            for (let i = 0; i < data.length; i++) {
                const v = data[i] / 128.0;
                const y = (v * H) / 2;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                x += sliceWidth;
            }
            ctx.lineTo(W, H / 2);
            ctx.stroke();
        } else if (mode === 'frequency') {
            const data = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(data);
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-input').trim() || 'rgba(0,0,0,0.3)';
            ctx.fillRect(0, 0, W, H);
            const barW = (W / data.length) * 2.5;
            for (let i = 0; i < data.length; i++) {
                const barH = (data[i] / 255) * H;
                const hue = (i / data.length) * 270 + 200;
                ctx.fillStyle = `hsl(${hue}, 80%, 55%)`;
                ctx.fillRect(i * barW, H - barH, barW - 1, barH);
            }
        } else if (mode === 'circular') {
            const data = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(data);
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-input').trim() || 'rgba(0,0,0,0.3)';
            ctx.fillRect(0, 0, W, H);
            const cx = W / 2, cy = H / 2, r = Math.min(cx, cy) * 0.6;
            const bars = 120;
            for (let i = 0; i < bars; i++) {
                const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
                const val = data[Math.floor(i * data.length / bars)] / 255;
                const barLen = val * r * 0.8;
                const x1 = cx + Math.cos(angle) * r;
                const y1 = cy + Math.sin(angle) * r;
                const x2 = cx + Math.cos(angle) * (r + barLen);
                const y2 = cy + Math.sin(angle) * (r + barLen);
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineWidth = 2;
                const hue = (i / bars) * 270 + 200;
                ctx.strokeStyle = `hsl(${hue}, 80%, 55%)`;
                ctx.stroke();
            }
        }
    }
    draw();
}

// ── Wire Controls ──
function wireControls() {
    // Transport
    document.getElementById('playBtn').addEventListener('click', () => {
        isPlaying ? stopSequencer() : startSequencer();
    });
    document.getElementById('stopBtn').addEventListener('click', stopSequencer);
    document.getElementById('recordBtn').addEventListener('click', toggleRecording);

    // Tempo
    const tempoSlider = document.getElementById('tempoSlider');
    const tempoInput = document.getElementById('tempoInput');
    tempoSlider.addEventListener('input', () => { bpm = parseInt(tempoSlider.value); tempoInput.value = bpm; });
    tempoInput.addEventListener('change', () => { bpm = Math.max(40, Math.min(240, parseInt(tempoInput.value) || 120)); tempoSlider.value = bpm; tempoInput.value = bpm; });

    // Master Volume
    document.getElementById('masterVolume').addEventListener('input', (e) => {
        if (masterGain) masterGain.gain.value = e.target.value / 100;
    });

    // Swing
    document.getElementById('swingSlider').addEventListener('input', (e) => {
        swing = parseInt(e.target.value);
        document.getElementById('swingReadout').textContent = swing + '%';
    });

    // Pattern select
    document.getElementById('patternSelect').addEventListener('change', (e) => {
        saveHistory();
        currentPattern = parseInt(e.target.value);
        buildSequencer();
    });

    // Clear pattern
    document.getElementById('clearPattern').addEventListener('click', () => {
        saveHistory();
        PATTERNS[currentPattern].drums = DRUMS.map(() => Array(STEPS).fill(false)); PATTERNS[currentPattern].synth = Array(STEPS).fill(null);
        buildSequencer();
    });

    // Random pattern
    document.getElementById('randomPattern').addEventListener('click', () => {
        saveHistory();
        PATTERNS[currentPattern].drums = DRUMS.map((_, i) => {
            const density = i === 0 ? 0.25 : i <= 2 ? 0.35 : 0.15;
            return Array.from({ length: STEPS }, () => Math.random() < density);
        });
        buildSequencer();
    });

    // Rotate pattern
    const rotateBtn = document.getElementById('rotateBtn');
    if (rotateBtn) {
        rotateBtn.addEventListener('click', () => {
            saveHistory();
            PATTERNS[currentPattern].drums = rotatePattern(PATTERNS[currentPattern].drums, 1);
            const synth = PATTERNS[currentPattern].synth;
            PATTERNS[currentPattern].synth = [...synth.slice(-1), ...synth.slice(0, -1)];
            buildSequencer();
        });
    }

    // Undo/Redo
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.addEventListener('click', doUndo);
    if (redoBtn) redoBtn.addEventListener('click', doRedo);

    // Waveform selection
    document.querySelectorAll('.wave-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.wave-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            synthWave = btn.dataset.wave;
        });
    });

    // Drum Presets
    const drumPresetSelect = document.getElementById('drumPresetSelect');
    if (drumPresetSelect) {
        drumPresetSelect.addEventListener('change', (e) => {
            const p = DRUM_PRESETS[e.target.value];
            if (p) {
                PATTERNS[currentPattern].drums = DRUMS.map((_, i) => p[i] ? p[i].map(x=>!!x) : Array(STEPS).fill(false));
                buildSequencer();
            }
            e.target.value = '';
        });
    }

    // Synth Presets
    const synthPresetSelect = document.getElementById('synthPresetSelect');
    if (synthPresetSelect) {
        synthPresetSelect.addEventListener('change', (e) => {
            const p = SYNTH_PRESETS[e.target.value];
            if (p) {
                document.querySelectorAll('.wave-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.wave === p.wave);
                });
                synthWave = p.wave;
                document.getElementById('attackKnob').value = p.attack;
                document.getElementById('decayKnob').value = p.decay;
                document.getElementById('sustainKnob').value = p.sustain;
                document.getElementById('releaseKnob').value = p.release;
                document.getElementById('filterKnob').value = p.filter;
                document.getElementById('resonanceKnob').value = p.resonance;
                document.getElementById('detuneKnob').value = p.detune;
                // Dispatch input to update internals and displays
                ['attackKnob', 'decayKnob', 'sustainKnob', 'releaseKnob', 'filterKnob', 'resonanceKnob', 'detuneKnob'].forEach(id => {
                    document.getElementById(id).dispatchEvent(new Event('input'));
                });
            }
            e.target.value = '';
        });
    }

    // Octave
    document.getElementById('octaveSelect').addEventListener('change', (e) => {
        synthOctave = parseInt(e.target.value);
        buildPiano();
    });

    // ADSR knobs
    wireKnob('attackKnob', 'attackVal', (v) => { synthEnvelope.attack = v / 1000; return v + 'ms'; });
    wireKnob('decayKnob', 'decayVal', (v) => { synthEnvelope.decay = v / 1000; return v + 'ms'; });
    wireKnob('sustainKnob', 'sustainVal', (v) => { synthEnvelope.sustain = v / 100; return v + '%'; });
    wireKnob('releaseKnob', 'releaseVal', (v) => { synthEnvelope.release = v / 1000; return v + 'ms'; });
    wireKnob('filterKnob', 'filterVal', (v) => { synthFilter = v; return v >= 1000 ? (v/1000).toFixed(1) + 'kHz' : v + 'Hz'; });
    wireKnob('resonanceKnob', 'resonanceVal', (v) => { synthResonance = v; return v.toString(); });
    wireKnob('detuneKnob', 'detuneVal', (v) => { synthDetune = v; return v + '¢'; });
    wireKnob('synthVolume', 'synthVolVal', (v) => { synthVolume = v / 100; return v + '%'; });

    
    // Save/Load
    document.getElementById('saveSongBtn').addEventListener('click', () => {
        const songData = {
            bpm, swing, PATTERNS, currentPattern,
            synthWave, synthOctave, synthEnvelope, synthFilter, synthResonance, synthDetune, synthVolume
        };
        const str = btoa(JSON.stringify(songData));
        prompt("Copy this string to save your song:", str);
    });
    document.getElementById('loadSongBtn').addEventListener('click', () => {
        const str = prompt("Paste your song string here:");
        if (!str) return;
        try {
            const songData = JSON.parse(atob(str));
            bpm = songData.bpm;
            document.getElementById('tempoSlider').value = bpm;
            document.getElementById('tempoInput').value = bpm;
            swing = songData.swing || 0;
            document.getElementById('swingSlider').value = swing;
            document.getElementById('swingReadout').textContent = swing + '%';
            
            PATTERNS = songData.PATTERNS;
            currentPattern = songData.currentPattern || 0;
            document.getElementById('patternSelect').value = currentPattern;
            
            synthWave = songData.synthWave || 'sine';
            synthOctave = songData.synthOctave || 4;
            document.getElementById('octaveSelect').value = synthOctave;
            
            if (songData.synthEnvelope) synthEnvelope = songData.synthEnvelope;
            synthFilter = songData.synthFilter || 5000;
            synthResonance = songData.synthResonance || 1;
            synthDetune = songData.synthDetune || 0;
            synthVolume = songData.synthVolume || 0.7;
            
            buildSequencer();
            buildPiano();
            document.querySelectorAll('.wave-btn').forEach(b => b.classList.toggle('active', b.dataset.wave === synthWave));
        } catch (err) {
            alert("Invalid song data!");
        }
    });

    // Soundboard
    document.getElementById('openSoundboardBtn').addEventListener('click', () => {
        document.getElementById('effectsPanel').style.display = 'none';
        document.getElementById('soundboardPanel').style.display = 'block';
    });
    document.getElementById('closeSoundboardBtn').addEventListener('click', () => {
        document.getElementById('soundboardPanel').style.display = 'none';
        document.getElementById('effectsPanel').style.display = 'block';
    });
    
    document.querySelectorAll('.drum-pad').forEach(pad => {
        const drum = pad.dataset.drum;
        pad.addEventListener('mousedown', () => { playDrum(drum); pad.classList.add('active'); });
        pad.addEventListener('mouseup', () => pad.classList.remove('active'));
        pad.addEventListener('mouseleave', () => pad.classList.remove('active'));
        pad.addEventListener('touchstart', (e) => { e.preventDefault(); playDrum(drum); pad.classList.add('active'); });
        pad.addEventListener('touchend', () => pad.classList.remove('active'));
    });
    
    // Link QWERTY keys to drum pads when soundboard is open
    const DRUM_KEYS = { 'q':'kick', 'w':'snare', 'e':'hihat', 'r':'openhat', 't':'clap', 'y':'tom', 'u':'ride', 'i':'crash' };
    document.addEventListener('keydown', (e) => {
        if (e.repeat || e.target.tagName === 'INPUT') return;
        const k = e.key.toLowerCase();
        if (DRUM_KEYS[k] && document.getElementById('soundboardPanel').style.display !== 'none') {
            const pad = document.querySelector(`.drum-pad[data-drum="${DRUM_KEYS[k]}"]`);
            if (pad) {
                playDrum(DRUM_KEYS[k]);
                pad.classList.add('active');
            }
        }
    });
    document.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (DRUM_KEYS[k]) {
            const pad = document.querySelector(`.drum-pad[data-drum="${DRUM_KEYS[k]}"]`);
            if (pad) pad.classList.remove('active');
        }
    });
    
    // Theme toggle
    document.getElementById('themeBtn').addEventListener('click', () => {
        const html = document.documentElement;
        const isDark = html.dataset.theme === 'dark';
        html.dataset.theme = isDark ? 'light' : 'dark';
        document.getElementById('themeBtn').textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', html.dataset.theme);
    });

    // Restore theme
    const saved = localStorage.getItem('theme');
    if (saved) {
        document.documentElement.dataset.theme = saved;
        document.getElementById('themeBtn').textContent = saved === 'dark' ? '🌙' : '☀️';
    }
}

function wireKnob(sliderId, valId, handler) {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(valId);
    if (!slider || !display) return;
    slider.addEventListener('input', () => {
        const v = parseFloat(slider.value);
        display.textContent = handler(v);
    });
}

// ── Timer display ──
let startTime = 0;
function updateTimeDisplay() {
    if (!isPlaying) return;
    if (!startTime) startTime = Date.now();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('timeDisplay').textContent = `${mins}:${secs}`;
    requestAnimationFrame(updateTimeDisplay);
}

// Override start/stop to manage timer
const origStart = startSequencer;
const origStop = stopSequencer;

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
    buildSequencer();
    buildPiano();
    wireControls();
    drawVisualizer();
    // Pre-fill a starter pattern
    const starterKick =  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0];
    const starterSnare = [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0];
    const starterHat =   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0];
    starterKick.forEach((v, i) => PATTERNS[0].drums[0][i] = !!v);
    starterSnare.forEach((v, i) => PATTERNS[0].drums[1][i] = !!v);
    starterHat.forEach((v, i) => PATTERNS[0].drums[2][i] = !!v);
    saveHistory(); // Save initial state
    buildSequencer();
});

})();
