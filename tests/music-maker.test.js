import { describe, it, expect } from 'vitest';
import {
    NOTE_NAMES, OCTAVE_RANGE, noteToFreq, freqToNote, midiToFreq, freqToMidi,
    bpmToMs, calcSwingTiming, DRUM_PRESETS, SYNTH_PRESETS, DRUMS, SYNTHS,
    createEmptyPattern, toggleStep, clearPattern, randomizePattern, copyPattern,
    rotatePattern, patternToMidi, countActiveSteps, getPatternDensity,
    createHistory, pushHistory, undo, redo
} from '../projects/music-maker/music-maker-utils.js';

// ═══════ NOTE NAMES ═══════
describe('NOTE_NAMES', () => {
    it('has 12 notes', () => expect(NOTE_NAMES).toHaveLength(12));
    it('starts with C', () => expect(NOTE_NAMES[0]).toBe('C'));
    it('ends with B', () => expect(NOTE_NAMES[11]).toBe('B'));
    it('contains A', () => expect(NOTE_NAMES).toContain('A'));
});

// ═══════ NOTE TO FREQ ═══════
describe('noteToFreq()', () => {
    it('A4 = 440Hz', () => expect(noteToFreq('A',4)).toBeCloseTo(440,1));
    it('C4 ≈ 261.63Hz', () => expect(noteToFreq('C',4)).toBeCloseTo(261.63,0));
    it('A3 = 220Hz', () => expect(noteToFreq('A',3)).toBeCloseTo(220,1));
    it('A5 = 880Hz', () => expect(noteToFreq('A',5)).toBeCloseTo(880,1));
    it('returns null for invalid note', () => expect(noteToFreq('X',4)).toBeNull());
    it('returns null for invalid octave', () => expect(noteToFreq('A',10)).toBeNull());
    it('all notes produce positive frequencies', () => { NOTE_NAMES.forEach(n => expect(noteToFreq(n,4)).toBeGreaterThan(0)); });
    it('higher octave = higher freq', () => expect(noteToFreq('C',5)).toBeGreaterThan(noteToFreq('C',4)));
});

// ═══════ FREQ TO NOTE ═══════
describe('freqToNote()', () => {
    it('440Hz = A4', () => { const r=freqToNote(440); expect(r.note).toBe('A'); expect(r.octave).toBe(4); });
    it('returns null for 0', () => expect(freqToNote(0)).toBeNull());
    it('returns null for negative', () => expect(freqToNote(-100)).toBeNull());
    it('includes cents', () => expect(freqToNote(440).cents).toBeDefined());
    it('round-trip noteToFreq->freqToNote', () => { const f=noteToFreq('E',3); const r=freqToNote(f); expect(r.note).toBe('E'); expect(r.octave).toBe(3); });
});

// ═══════ MIDI ═══════
describe('midiToFreq/freqToMidi', () => {
    it('MIDI 69 = 440Hz', () => expect(midiToFreq(69)).toBeCloseTo(440,1));
    it('round-trip', () => expect(freqToMidi(midiToFreq(60))).toBe(60));
    it('MIDI 0 = low freq', () => expect(midiToFreq(0)).toBeGreaterThan(0));
    it('freqToMidi(0) = 0', () => expect(freqToMidi(0)).toBe(0));
});

// ═══════ BPM/TIMING ═══════
describe('bpmToMs()', () => {
    it('120 BPM = 500ms per beat', () => expect(bpmToMs(120)).toBe(500));
    it('60 BPM = 1000ms', () => expect(bpmToMs(60)).toBe(1000));
    it('0 BPM = 0', () => expect(bpmToMs(0)).toBe(0));
    it('subdivision 8 = half', () => expect(bpmToMs(120,8)).toBe(250));
    it('subdivision 2 = double', () => expect(bpmToMs(120,2)).toBe(1000));
});

describe('calcSwingTiming()', () => {
    it('even steps have no swing offset', () => expect(calcSwingTiming(0,120,0.5)).toBe(0));
    it('odd steps have swing offset', () => expect(calcSwingTiming(1,120,0.5)).toBeGreaterThan(500));
    it('zero swing = regular timing', () => expect(calcSwingTiming(1,120,0)).toBe(500));
});

// ═══════ PRESETS ═══════
describe('DRUM_PRESETS', () => {
    it('has Kick', () => expect(DRUM_PRESETS['Kick']).toBeDefined());
    it('has Snare', () => expect(DRUM_PRESETS['Snare']).toBeDefined());
    it('has HiHat', () => expect(DRUM_PRESETS['HiHat']).toBeDefined());
    it('all have freq and decay', () => { Object.values(DRUM_PRESETS).forEach(p => { expect(p.freq).toBeGreaterThan(0); expect(p.decay).toBeGreaterThan(0); }); });
    it('DRUMS array matches keys', () => expect(DRUMS).toEqual(Object.keys(DRUM_PRESETS)));
});

describe('SYNTH_PRESETS', () => {
    it('has Sine Pad', () => expect(SYNTH_PRESETS['Sine Pad']).toBeDefined());
    it('all have ADSR', () => { Object.values(SYNTH_PRESETS).forEach(p => { expect(p.attack).toBeDefined(); expect(p.decay).toBeDefined(); expect(p.sustain).toBeDefined(); expect(p.release).toBeDefined(); }); });
    it('SYNTHS array matches keys', () => expect(SYNTHS).toEqual(Object.keys(SYNTH_PRESETS)));
    it('all have valid oscillator type', () => { const types=['sine','square','sawtooth','triangle']; Object.values(SYNTH_PRESETS).forEach(p=>expect(types).toContain(p.type)); });
});

// ═══════ PATTERN MANIPULATION ═══════
describe('createEmptyPattern()', () => {
    it('creates correct dimensions', () => { const p=createEmptyPattern(4,16); expect(p).toHaveLength(4); expect(p[0]).toHaveLength(16); });
    it('all values are false', () => { createEmptyPattern(3,8).forEach(r=>r.forEach(v=>expect(v).toBe(false))); });
});

describe('toggleStep()', () => {
    it('toggles off to on', () => { const p=createEmptyPattern(2,4); const r=toggleStep(p,0,0); expect(r[0][0]).toBe(true); });
    it('toggles on to off', () => { const p=createEmptyPattern(2,4); const r1=toggleStep(p,0,0); const r2=toggleStep(r1,0,0); expect(r2[0][0]).toBe(false); });
    it('does not mutate original', () => { const p=createEmptyPattern(2,4); toggleStep(p,0,0); expect(p[0][0]).toBe(false); });
});

describe('clearPattern()', () => {
    it('all false', () => { clearPattern(4,16).forEach(r=>r.forEach(v=>expect(v).toBe(false))); });
});

describe('randomizePattern()', () => {
    it('correct dimensions', () => { const p=randomizePattern(4,16,0.5); expect(p).toHaveLength(4); expect(p[0]).toHaveLength(16); });
    it('has some active steps', () => { const p=randomizePattern(4,16,0.9); expect(countActiveSteps(p)).toBeGreaterThan(0); });
    it('density 0 = empty', () => { const p=randomizePattern(4,16,0); expect(countActiveSteps(p)).toBe(0); });
});

describe('copyPattern()', () => {
    it('creates independent copy', () => { const p=createEmptyPattern(2,4); const c=copyPattern(p); c[0][0]=true; expect(p[0][0]).toBe(false); });
});

describe('rotatePattern()', () => {
    it('shifts steps right', () => { const p=[[true,false,false,false]]; const r=rotatePattern(p,1); expect(r[0]).toEqual([false,true,false,false]); });
});

// ═══════ PATTERN ANALYSIS ═══════
describe('countActiveSteps()', () => {
    it('0 for empty', () => expect(countActiveSteps(createEmptyPattern(4,16))).toBe(0));
    it('correct count', () => { const p=createEmptyPattern(2,4); const r=toggleStep(toggleStep(p,0,0),1,2); expect(countActiveSteps(r)).toBe(2); });
});

describe('getPatternDensity()', () => {
    it('0 for empty', () => expect(getPatternDensity(createEmptyPattern(4,16))).toBe(0));
    it('between 0 and 1', () => { const p=randomizePattern(4,16,0.5); const d=getPatternDensity(p); expect(d).toBeGreaterThanOrEqual(0); expect(d).toBeLessThanOrEqual(1); });
});

describe('patternToMidi()', () => {
    it('empty pattern = no events', () => expect(patternToMidi(createEmptyPattern(2,4),120)).toHaveLength(0));
    it('active steps produce events', () => { const p=toggleStep(createEmptyPattern(2,4),0,0); expect(patternToMidi(p,120).length).toBe(1); });
    it('events sorted by time', () => { const p=toggleStep(toggleStep(createEmptyPattern(2,4),0,2),0,0); const events=patternToMidi(p,120); expect(events[0].time).toBeLessThanOrEqual(events[1].time); });
});

// ═══════ UNDO/REDO ═══════
describe('undo/redo', () => {
    it('undo returns previous state', () => {
        const p0=createEmptyPattern(2,4);
        let h=createHistory(p0);
        const p1=toggleStep(p0,0,0);
        h=pushHistory(h,p1);
        const result=undo(h);
        expect(result.pattern[0][0]).toBe(false);
    });
    it('redo restores undone state', () => {
        const p0=createEmptyPattern(2,4);
        let h=createHistory(p0);
        const p1=toggleStep(p0,0,0);
        h=pushHistory(h,p1);
        const undone=undo(h);
        const redone=redo(undone.history);
        expect(redone.pattern[0][0]).toBe(true);
    });
    it('undo at start stays at start', () => {
        const h=createHistory(createEmptyPattern(2,4));
        const r=undo(h);
        expect(r.history.index).toBe(0);
    });
    it('redo at end stays at end', () => {
        const h=createHistory(createEmptyPattern(2,4));
        const r=redo(h);
        expect(r.history.index).toBe(0);
    });
});
