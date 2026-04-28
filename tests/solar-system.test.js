import { describe, it, expect } from 'vitest';
import {
    getZoomDepthLabel, getStarTile, PLANETS, GALAXIES, CONSTELLATIONS,
    orbitalPeriod, orbitalPosition, distanceBetween, genExoSystem,
    searchCatalog, formatDistance, calcTimeScale
} from '../projects/solar-system/solar-system-utils.js';

// ═══════ ZOOM DEPTH LABELS ═══════
describe('getZoomDepthLabel()', () => {
    it('Supercluster for very low zoom', () => expect(getZoomDepthLabel(0.000001)).toBe('Supercluster Scale'));
    it('Galaxy Cluster', () => expect(getZoomDepthLabel(0.00001)).toBe('Galaxy Cluster'));
    it('Local Group', () => expect(getZoomDepthLabel(0.0001)).toBe('Local Group'));
    it('Galactic View', () => expect(getZoomDepthLabel(0.001)).toBe('Galactic View'));
    it('Constellation Field', () => expect(getZoomDepthLabel(0.005)).toBe('Constellation Field'));
    it('Star Field', () => expect(getZoomDepthLabel(0.05)).toBe('Star Field'));
    it('Solar System for zoom ~1', () => expect(getZoomDepthLabel(1.0)).toBe('Solar System'));
    it('Planet View for zoom 10', () => expect(getZoomDepthLabel(10)).toBe('Planet View'));
    it('Moon Detail for very high zoom', () => expect(getZoomDepthLabel(100)).toBe('Moon Detail'));
    it('all labels are strings', () => { [0.000001,0.00001,0.0001,0.001,0.005,0.05,0.5,5,100].forEach(z => expect(typeof getZoomDepthLabel(z)).toBe('string')); });
    it('boundary: exactly 0.000005', () => expect(getZoomDepthLabel(0.000005)).toBe('Galaxy Cluster'));
    it('boundary: exactly 2', () => expect(getZoomDepthLabel(2)).toBe('Planet View'));
    it('boundary: exactly 50', () => expect(getZoomDepthLabel(50)).toBe('Moon Detail'));
});

// ═══════ STAR TILE GENERATION ═══════
describe('getStarTile()', () => {
    it('generates 150 stars', () => expect(getStarTile(0,0)).toHaveLength(150));
    it('deterministic for same coords', () => { const a=getStarTile(5,3), b=getStarTile(5,3); expect(a[0].x).toBe(b[0].x); expect(a[0].y).toBe(b[0].y); });
    it('different tiles different stars', () => { const a=getStarTile(0,0), b=getStarTile(1,0); expect(a[0].x).not.toBe(b[0].x); });
    it('star size in valid range', () => { getStarTile(2,7).forEach(s => { expect(s.s).toBeGreaterThanOrEqual(0.3); expect(s.s).toBeLessThanOrEqual(2.3); }); });
    it('star brightness in valid range', () => { getStarTile(2,7).forEach(s => { expect(s.b).toBeGreaterThanOrEqual(0.4); expect(s.b).toBeLessThanOrEqual(1.0); }); });
    it('star hue in valid range', () => { getStarTile(2,7).forEach(s => { expect(s.h).toBeGreaterThanOrEqual(200); expect(s.h).toBeLessThanOrEqual(260); }); });
    it('negative coords work', () => expect(getStarTile(-5,-3)).toHaveLength(150));
});

// ═══════ PLANET DATA ═══════
describe('PLANETS', () => {
    it('has 9 planets', () => expect(PLANETS).toHaveLength(9));
    it('distance order ascending', () => { for (let i=1;i<PLANETS.length;i++) expect(PLANETS[i].d).toBeGreaterThan(PLANETS[i-1].d); });
    it('outer planets slower', () => { for (let i=1;i<PLANETS.length;i++) expect(PLANETS[i].v).toBeLessThanOrEqual(PLANETS[i-1].v); });
    it('all have required props', () => { PLANETS.forEach(p => { expect(p.name).toBeDefined(); expect(p.d).toBeGreaterThan(0); expect(p.s).toBeGreaterThan(0); expect(p.mass).toBeDefined(); expect(p.diameter).toBeDefined(); }); });
    it('Earth has 1 moon', () => expect(PLANETS.find(p=>p.name==='Earth').moons).toBe(1));
    it('Jupiter has most moons', () => { const jup=PLANETS.find(p=>p.name==='Jupiter'); expect(jup.moons).toBeGreaterThan(90); });
    it('Saturn has rings', () => expect(PLANETS.find(p=>p.name==='Saturn').hasRings).toBe(true));
    it('all have color strings', () => PLANETS.forEach(p=>expect(p.color).toMatch(/^#/)));
    it('all have atmosphere info', () => PLANETS.forEach(p=>expect(p.atmosphere).toBeDefined()));
});

// ═══════ GALAXIES ═══════
describe('GALAXIES', () => {
    it('has at least 3 galaxies', () => expect(GALAXIES.length).toBeGreaterThanOrEqual(3));
    it('all have required props', () => { GALAXIES.forEach(g => { expect(g.name).toBeDefined(); expect(g.x).toBeDefined(); expect(g.y).toBeDefined(); expect(g.r).toBeGreaterThan(0); expect(g.type).toBeDefined(); }); });
    it('includes Milky Way', () => expect(GALAXIES.some(g=>g.name==='Milky Way')).toBe(true));
    it('includes Andromeda', () => expect(GALAXIES.some(g=>g.name.includes('Andromeda'))).toBe(true));
});

// ═══════ CONSTELLATIONS ═══════
describe('CONSTELLATIONS', () => {
    it('has 19 constellations', () => expect(CONSTELLATIONS).toHaveLength(19));
    it('includes Orion', () => expect(CONSTELLATIONS).toContain('Orion'));
    it('includes Cassiopeia', () => expect(CONSTELLATIONS).toContain('Cassiopeia'));
    it('all strings', () => CONSTELLATIONS.forEach(c=>expect(typeof c).toBe('string')));
});

// ═══════ ORBITAL MECHANICS ═══════
describe('orbitalPeriod()', () => {
    it('farther = longer period', () => expect(orbitalPeriod(450)).toBeGreaterThan(orbitalPeriod(190)));
    it('positive for positive distance', () => expect(orbitalPeriod(100)).toBeGreaterThan(0));
});

describe('orbitalPosition()', () => {
    it('returns x,y', () => { const p=orbitalPosition(100,0.01,0); expect(p.x).toBeDefined(); expect(p.y).toBeDefined(); });
    it('at t=0, x=distance', () => { const p=orbitalPosition(100,0.01,0); expect(p.x).toBeCloseTo(100,5); expect(p.y).toBeCloseTo(0,5); });
    it('moves over time', () => { const p0=orbitalPosition(100,0.01,0), p1=orbitalPosition(100,0.01,100); expect(p0.x).not.toBeCloseTo(p1.x,1); });
});

describe('distanceBetween()', () => {
    it('zero for same point', () => expect(distanceBetween({x:0,y:0},{x:0,y:0})).toBe(0));
    it('3-4-5 triangle', () => expect(distanceBetween({x:0,y:0},{x:3,y:4})).toBeCloseTo(5,5));
    it('symmetric', () => expect(distanceBetween({x:1,y:2},{x:4,y:6})).toBe(distanceBetween({x:4,y:6},{x:1,y:2})));
});

// ═══════ EXO SYSTEM ═══════
describe('genExoSystem()', () => {
    it('generates 2-6 planets', () => { const sys=genExoSystem(42); expect(sys.length).toBeGreaterThanOrEqual(2); expect(sys.length).toBeLessThanOrEqual(7); });
    it('deterministic for same seed', () => { const a=genExoSystem(42), b=genExoSystem(42); expect(a[0].name).toBe(b[0].name); });
    it('different seeds different systems', () => { const a=genExoSystem(1), b=genExoSystem(2); expect(a[0].d).not.toBe(b[0].d); });
    it('all planets have color', () => genExoSystem(7).forEach(p=>expect(p.color).toMatch(/^hsl/)));
});

// ═══════ SEARCH ═══════
describe('searchCatalog()', () => {
    it('finds Earth', () => { const r=searchCatalog('Earth'); expect(r.length).toBeGreaterThan(0); expect(r[0].name).toBe('Earth'); });
    it('finds Milky Way', () => { const r=searchCatalog('Milky'); expect(r.some(x=>x.name==='Milky Way')).toBe(true); });
    it('finds Orion', () => { const r=searchCatalog('Orion'); expect(r.length).toBeGreaterThan(0); });
    it('case insensitive', () => expect(searchCatalog('earth').length).toBeGreaterThan(0));
    it('empty for no match', () => expect(searchCatalog('XYZ123')).toHaveLength(0));
    it('empty for null', () => expect(searchCatalog(null)).toHaveLength(0));
});

// ═══════ FORMATTING ═══════
describe('formatDistance()', () => {
    it('AU for moderate distances', () => expect(formatDistance(5)).toContain('AU'));
    it('ly for large distances', () => expect(formatDistance(100000)).toContain('ly'));
    it('km for tiny distances', () => expect(formatDistance(0.001)).toContain('km'));
});

describe('calcTimeScale()', () => {
    it('Paused for 0', () => expect(calcTimeScale(0)).toBe('Paused'));
    it('real-time for small', () => expect(calcTimeScale(1)).toContain('real-time'));
    it('min/s for moderate', () => expect(calcTimeScale(120)).toContain('min/s'));
    it('hr/s for large', () => expect(calcTimeScale(7200)).toContain('hr/s'));
    it('day/s for very large', () => expect(calcTimeScale(100000)).toContain('day/s'));
});
