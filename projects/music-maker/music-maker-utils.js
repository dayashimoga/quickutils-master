/* Music Maker Utilities — Pure Functions Module */

export const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
export const OCTAVE_RANGE = [2,3,4,5,6,7];

export function noteToFreq(note, octave) {
    const idx = NOTE_NAMES.indexOf(note);
    if (idx < 0 || octave < 0 || octave > 8) return null;
    const midiNote = idx + (octave + 1) * 12;
    return 440 * Math.pow(2, (midiNote - 69) / 12);
}

export function freqToNote(freq) {
    if (freq <= 0) return null;
    const midi = 69 + 12 * Math.log2(freq / 440);
    const rounded = Math.round(midi);
    const note = NOTE_NAMES[rounded % 12];
    const octave = Math.floor(rounded / 12) - 1;
    const cents = Math.round((midi - rounded) * 100);
    return { note, octave, cents, midi: rounded };
}

export function midiToFreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
export function freqToMidi(freq) { return freq <= 0 ? 0 : Math.round(69 + 12 * Math.log2(freq / 440)); }

export function bpmToMs(bpm, subdivision = 4) {
    if (bpm <= 0) return 0;
    return (60000 / bpm) / (subdivision / 4);
}

export function calcSwingTiming(stepIndex, bpm, swingAmount) {
    const baseMs = bpmToMs(bpm);
    if (stepIndex % 2 === 0) return stepIndex * baseMs;
    const swingOffset = baseMs * swingAmount * 0.33;
    return stepIndex * baseMs + swingOffset;
}

export const DRUM_PRESETS = {
    'Kick': { freq: 60, decay: 0.4, type: 'sine' },
    'Snare': { freq: 200, decay: 0.2, type: 'triangle', noise: true },
    'HiHat': { freq: 800, decay: 0.08, type: 'square', noise: true },
    'OpenHat': { freq: 800, decay: 0.3, type: 'square', noise: true },
    'Clap': { freq: 400, decay: 0.15, type: 'triangle', noise: true },
    'Tom Low': { freq: 100, decay: 0.3, type: 'sine' },
    'Tom Mid': { freq: 150, decay: 0.25, type: 'sine' },
    'Tom High': { freq: 200, decay: 0.2, type: 'sine' },
    'Rim': { freq: 600, decay: 0.05, type: 'square' },
    'Cowbell': { freq: 560, decay: 0.1, type: 'square' },
};

export const SYNTH_PRESETS = {
    'Sine Pad': { type:'sine', attack:0.3, decay:0.4, sustain:0.6, release:0.8 },
    'Square Lead': { type:'square', attack:0.01, decay:0.2, sustain:0.4, release:0.3 },
    'Saw Bass': { type:'sawtooth', attack:0.01, decay:0.3, sustain:0.3, release:0.2 },
    'Triangle Bell': { type:'triangle', attack:0.01, decay:0.5, sustain:0.1, release:1.0 },
    'Pluck': { type:'sawtooth', attack:0.005, decay:0.15, sustain:0.0, release:0.1 },
    'Organ': { type:'sine', attack:0.01, decay:0.1, sustain:0.8, release:0.1 },
    'Brass': { type:'sawtooth', attack:0.05, decay:0.2, sustain:0.7, release:0.3 },
    'Strings': { type:'sine', attack:0.5, decay:0.3, sustain:0.7, release:1.0 },
};

export const DRUMS = Object.keys(DRUM_PRESETS);
export const SYNTHS = Object.keys(SYNTH_PRESETS);

export function createEmptyPattern(rows, steps) {
    return Array.from({ length: rows }, () => Array(steps).fill(false));
}

export function toggleStep(pattern, row, step) {
    const copy = pattern.map(r => [...r]);
    copy[row][step] = !copy[row][step];
    return copy;
}

export function clearPattern(rows, steps) { return createEmptyPattern(rows, steps); }

export function randomizePattern(rows, steps, density = 0.25) {
    return Array.from({ length: rows }, () =>
        Array.from({ length: steps }, () => Math.random() < density)
    );
}

export function copyPattern(pattern) { return pattern.map(r => [...r]); }

export function rotatePattern(pattern, direction = 1) {
    return pattern.map(row => {
        if (direction > 0) return [...row.slice(-1), ...row.slice(0, -1)];
        return [...row.slice(1), ...row[0]];
    });
}

export function patternToMidi(pattern, bpm, drumMap) {
    const events = [];
    const stepMs = bpmToMs(bpm);
    pattern.forEach((row, rIdx) => {
        row.forEach((active, sIdx) => {
            if (active) {
                events.push({ time: sIdx * stepMs, note: (drumMap && drumMap[rIdx]) || 36 + rIdx,
                    velocity: 100, duration: stepMs * 0.8 });
            }
        });
    });
    return events.sort((a, b) => a.time - b.time);
}

export function countActiveSteps(pattern) {
    return pattern.reduce((total, row) => total + row.filter(Boolean).length, 0);
}

export function getPatternDensity(pattern) {
    const total = pattern.length * (pattern[0]?.length || 0);
    return total === 0 ? 0 : countActiveSteps(pattern) / total;
}

// Undo/Redo history management
export function createHistory(initial) {
    return { stack: [copyPattern(initial)], index: 0 };
}

export function pushHistory(history, pattern) {
    const newStack = history.stack.slice(0, history.index + 1);
    newStack.push(copyPattern(pattern));
    return { stack: newStack, index: newStack.length - 1 };
}

export function undo(history) {
    if (history.index <= 0) return { history, pattern: history.stack[0] };
    const newIndex = history.index - 1;
    return { history: { ...history, index: newIndex }, pattern: copyPattern(history.stack[newIndex]) };
}

export function redo(history) {
    if (history.index >= history.stack.length - 1) return { history, pattern: history.stack[history.index] };
    const newIndex = history.index + 1;
    return { history: { ...history, index: newIndex }, pattern: copyPattern(history.stack[newIndex]) };
}
