/**
 * Procedural Planet — Unit Tests
 * Tests: preset values, seed encoding, stat calculations, habitability algorithm
 */
import { describe, it, expect, beforeEach } from 'vitest';

// ─── Preset Database ───
const PRESETS = {
    earth:    { w: 0.55, t: 0.5,  a: 0.35 },
    mars:     { w: 0.0,  t: 0.7,  a: 0.1  },
    ice:      { w: 0.8,  t: 0.0,  a: 0.4  },
    desert:   { w: 0.1,  t: 0.9,  a: 0.2  },
    volcanic: { w: 0.05, t: 1.0,  a: 0.6  },
    ocean:    { w: 0.9,  t: 0.5,  a: 0.5  },
    gasGiant: { w: 0.0,  t: 0.4,  a: 0.95 },
    frozen:   { w: 0.6,  t: 0.1,  a: 0.2  },
};

// ─── Seed Encode/Decode ───
function encodeSeed(s, w, t, a) {
    return btoa(`${Math.round(s * 1000)}:${Math.round(w * 100)}:${Math.round(t * 100)}:${Math.round(a * 100)}`);
}

function decodeSeed(str) {
    try {
        const raw = atob(str);
        const [s, w, t, a] = raw.split(':').map(Number);
        if ([s, w, t, a].some(isNaN)) return null;
        return { seed: s / 1000, w: w / 100, t: t / 100, a: a / 100 };
    } catch { return null; }
}

// ─── Biome Distribution Calculator ───
function calcBiomes(w, t) {
    const water = w * 100;
    const pLand = 100 - water;
    const ice = (1.0 - t) * 0.4 * pLand;
    const desert = t * 0.5 * pLand;
    let forest = pLand - ice - desert;
    if (forest < 0) forest = 0;
    return { water, ice, desert, forest };
}

// ─── Habitability Algorithm ───
function calcHabitability(w, t, a) {
    const wScore = 1 - Math.abs(w - 0.55) * 2;
    const tScore = 1 - Math.abs(t - 0.5) * 2;
    const aScore = 1 - Math.abs(a - 0.35) * 2;
    return Math.max(0, Math.min(100, Math.round(wScore * 40 + tScore * 35 + aScore * 25)));
}

// ─── Stats Calculator ───
function calcStats(w, t, a) {
    return {
        area: Math.round(300 + w * 400),
        ocean: Math.round(w * 100),
        tempC: Math.round(-50 + t * 130),
        atmo: parseFloat(a).toFixed(2),
        biomes: (w > 0.1 ? 1 : 0) + (t > 0.3 ? 1 : 0) + (t < 0.3 ? 1 : 0) + (w < 0.9 ? 1 : 0) + (a > 0.2 ? 1 : 0),
    };
}

describe('Procedural Planet', () => {
    describe('Presets', () => {
        it('should have 8 unique presets', () => {
            expect(Object.keys(PRESETS)).toHaveLength(8);
        });
        it('all presets have valid ranges (0-1)', () => {
            for (const [name, p] of Object.entries(PRESETS)) {
                expect(p.w).toBeGreaterThanOrEqual(0);
                expect(p.w).toBeLessThanOrEqual(1);
                expect(p.t).toBeGreaterThanOrEqual(0);
                expect(p.t).toBeLessThanOrEqual(1);
                expect(p.a).toBeGreaterThanOrEqual(0);
                expect(p.a).toBeLessThanOrEqual(1);
            }
        });
        it('Earth preset is habitable (>50)', () => {
            const { w, t, a } = PRESETS.earth;
            expect(calcHabitability(w, t, a)).toBeGreaterThan(50);
        });
        it('Mars preset has low habitability', () => {
            const { w, t, a } = PRESETS.mars;
            expect(calcHabitability(w, t, a)).toBeLessThan(40);
        });
    });

    describe('Seed Encoding', () => {
        it('encodes and decodes round-trip', () => {
            const seed = 42.5;
            const encoded = encodeSeed(seed, 0.55, 0.5, 0.35);
            const decoded = decodeSeed(encoded);
            expect(decoded).not.toBeNull();
            expect(decoded.w).toBeCloseTo(0.55, 1);
            expect(decoded.t).toBeCloseTo(0.5, 1);
            expect(decoded.a).toBeCloseTo(0.35, 1);
        });
        it('returns null for invalid base64', () => {
            expect(decodeSeed('not valid base64!!!')).toBeNull();
        });
        it('handles edge case all zeros', () => {
            const encoded = encodeSeed(0, 0, 0, 0);
            const decoded = decodeSeed(encoded);
            expect(decoded).not.toBeNull();
            expect(decoded.w).toBe(0);
        });
    });

    describe('Biome Distribution', () => {
        it('biomes sum to 100%', () => {
            const b = calcBiomes(0.5, 0.5);
            const total = b.water + b.ice + b.desert + b.forest;
            expect(total).toBeCloseTo(100, 0);
        });
        it('water=1.0 means 100% ocean', () => {
            const b = calcBiomes(1.0, 0.5);
            expect(b.water).toBe(100);
            expect(b.forest).toBe(0);
        });
        it('water=0.0 means no ocean', () => {
            const b = calcBiomes(0.0, 0.5);
            expect(b.water).toBe(0);
        });
        it('temp=0.0 means maximum ice', () => {
            const b = calcBiomes(0.0, 0.0);
            expect(b.ice).toBe(40); // 0.4 * 100
        });
    });

    describe('Habitability Score', () => {
        it('perfect Earth-like is highly habitable', () => {
            const score = calcHabitability(0.55, 0.5, 0.35);
            expect(score).toBeGreaterThanOrEqual(90);
        });
        it('extreme desert is low habitability', () => {
            const score = calcHabitability(0.0, 1.0, 0.0);
            expect(score).toBeLessThan(20);
        });
        it('score is always 0-100', () => {
            for (let i = 0; i < 20; i++) {
                const w = Math.random(), t = Math.random(), a = Math.random();
                const s = calcHabitability(w, t, a);
                expect(s).toBeGreaterThanOrEqual(0);
                expect(s).toBeLessThanOrEqual(100);
            }
        });
    });

    describe('Stats Calculator', () => {
        it('calculates area from water level', () => {
            const s = calcStats(0.5, 0.5, 0.3);
            expect(s.area).toBe(500);
        });
        it('temperature maps correctly', () => {
            expect(calcStats(0, 0, 0).tempC).toBe(-50);
            expect(calcStats(0, 1, 0).tempC).toBe(80);
        });
        it('biome count is reasonable', () => {
            const s = calcStats(0.5, 0.5, 0.5);
            expect(s.biomes).toBeGreaterThanOrEqual(1);
            expect(s.biomes).toBeLessThanOrEqual(5);
        });
    });
});
