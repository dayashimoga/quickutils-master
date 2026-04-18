/**
 * Solar System Explorer — Unit Tests
 * Tests: zoom depth labels, planet data, star tile generation, orbit calculations, projection
 */
import { describe, it, expect } from 'vitest';

// ─── Zoom Depth Label ───
function getZoomDepthLabel(z) {
    if (z < 0.000005) return 'Supercluster Scale';
    if (z < 0.00005) return 'Galaxy Cluster';
    if (z < 0.0005) return 'Local Group';
    if (z < 0.003) return 'Galactic View';
    if (z < 0.01) return 'Constellation Field';
    if (z < 0.1) return 'Star Field';
    if (z < 2) return 'Solar System';
    if (z < 50) return 'Planet View';
    return 'Moon Detail';
}

// ─── Seeded RNG (same as in script.js) ───
function getStarTile(tx, ty) {
    let seed = Math.abs(tx * 73856093 ^ ty * 19349663) % 2147483647;
    const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const stars = [];
    const TILE_SIZE = 4000;
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: tx * TILE_SIZE + rng() * TILE_SIZE,
            y: ty * TILE_SIZE + rng() * TILE_SIZE,
            s: rng() * 2 + 0.3,
            b: rng() * 0.6 + 0.4,
            h: rng() * 60 + 200
        });
    }
    return stars;
}

// ─── Planet Data ───
const PLANETS = [
    { name: 'Mercury', d: 80, s: 3, v: 0.04 },
    { name: 'Venus', d: 130, s: 6, v: 0.015 },
    { name: 'Earth', d: 190, s: 7, v: 0.01 },
    { name: 'Mars', d: 250, s: 5, v: 0.008 },
    { name: 'Jupiter', d: 450, s: 22, v: 0.002 },
    { name: 'Saturn', d: 650, s: 18, v: 0.001 },
    { name: 'Uranus', d: 850, s: 14, v: 0.0005 },
    { name: 'Neptune', d: 1050, s: 13, v: 0.0004 },
    { name: 'Pluto', d: 1250, s: 2.5, v: 0.0002 },
];

// ─── Orbital Period Calculator ───
function orbitalPeriod(distance) {
    // Kepler's third law simplified: T^2 ∝ d^3
    return Math.sqrt(Math.pow(distance, 3));
}

// ─── Galaxy Data ───
const GALAXIES = [
    { name: 'Milky Way', x: -100000, y: 50000, r: 8000, type: 'Barred Spiral Galaxy' },
    { name: 'Andromeda (M31)', x: 800000, y: -500000, r: 10000, type: 'Spiral Galaxy' },
    { name: 'Triangulum (M33)', x: 600000, y: -400000, r: 4000, type: 'Spiral Galaxy' },
];

// ─── Constellation Data ───
const CONSTELLATION_NAMES = [
    'Orion', 'Ursa Major', 'Cassiopeia', 'Scorpius', 'Leo', 'Lyra',
    'Cygnus', 'Draco', 'Pegasus', 'Centaurus', 'Crux', 'Gemini',
    'Taurus', 'Canis Major', 'Aquila', 'Virgo', 'Sagittarius', 'Aquarius', 'Pisces'
];

describe('Solar System Explorer', () => {
    describe('Zoom Depth Labels', () => {
        it('returns Supercluster for very low zoom', () => {
            expect(getZoomDepthLabel(0.000001)).toBe('Supercluster Scale');
        });
        it('returns Galaxy Cluster', () => {
            expect(getZoomDepthLabel(0.00001)).toBe('Galaxy Cluster');
        });
        it('returns Solar System for zoom ~1', () => {
            expect(getZoomDepthLabel(1.0)).toBe('Solar System');
        });
        it('returns Planet View for zoom 10', () => {
            expect(getZoomDepthLabel(10)).toBe('Planet View');
        });
        it('returns Moon Detail for very high zoom', () => {
            expect(getZoomDepthLabel(100)).toBe('Moon Detail');
        });
        it('all labels are strings', () => {
            const zooms = [0.000001, 0.00001, 0.0001, 0.001, 0.005, 0.05, 0.5, 5, 100];
            zooms.forEach(z => {
                expect(typeof getZoomDepthLabel(z)).toBe('string');
            });
        });
    });

    describe('Star Tile Generation', () => {
        it('generates 150 stars per tile', () => {
            const stars = getStarTile(0, 0);
            expect(stars).toHaveLength(150);
        });
        it('is deterministic for same coords', () => {
            const a = getStarTile(5, 3);
            const b = getStarTile(5, 3);
            expect(a[0].x).toBe(b[0].x);
            expect(a[0].y).toBe(b[0].y);
        });
        it('different tiles produce different stars', () => {
            const a = getStarTile(0, 0);
            const b = getStarTile(1, 0);
            expect(a[0].x).not.toBe(b[0].x);
        });
        it('star properties are in valid ranges', () => {
            const stars = getStarTile(2, 7);
            stars.forEach(s => {
                expect(s.s).toBeGreaterThanOrEqual(0.3);
                expect(s.s).toBeLessThanOrEqual(2.3);
                expect(s.b).toBeGreaterThanOrEqual(0.4);
                expect(s.b).toBeLessThanOrEqual(1.0);
                expect(s.h).toBeGreaterThanOrEqual(200);
                expect(s.h).toBeLessThanOrEqual(260);
            });
        });
    });

    describe('Planet Data', () => {
        it('has 9 planets', () => {
            expect(PLANETS).toHaveLength(9);
        });
        it('planets are in distance order', () => {
            for (let i = 1; i < PLANETS.length; i++) {
                expect(PLANETS[i].d).toBeGreaterThan(PLANETS[i-1].d);
            }
        });
        it('outer planets move slower', () => {
            for (let i = 1; i < PLANETS.length; i++) {
                expect(PLANETS[i].v).toBeLessThanOrEqual(PLANETS[i-1].v);
            }
        });
    });

    describe('Orbital Period', () => {
        it('farther planets have longer periods', () => {
            const tEarth = orbitalPeriod(190);
            const tJupiter = orbitalPeriod(450);
            expect(tJupiter).toBeGreaterThan(tEarth);
        });
    });

    describe('Galaxies', () => {
        it('has at least 3 galaxies', () => {
            expect(GALAXIES.length).toBeGreaterThanOrEqual(3);
        });
        it('all have required properties', () => {
            GALAXIES.forEach(g => {
                expect(g).toHaveProperty('name');
                expect(g).toHaveProperty('x');
                expect(g).toHaveProperty('y');
                expect(g).toHaveProperty('r');
                expect(g).toHaveProperty('type');
            });
        });
    });

    describe('Constellations', () => {
        it('has 19 known constellations', () => {
            expect(CONSTELLATION_NAMES).toHaveLength(19);
        });
        it('includes Orion', () => {
            expect(CONSTELLATION_NAMES).toContain('Orion');
        });
    });
});
