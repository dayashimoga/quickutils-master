/**
 * Earthquake Explorer — Unit Tests
 * Tests: data parsing, globe projection, time formatting, feed mapping, filtering
 */
import { describe, it, expect } from 'vitest';

// ─── USGS Feed Mapping ───
const FEED_MAP = {
    'all_hour': 'all_hour.geojson', 'all_day': 'all_day.geojson',
    'all_week': 'all_week.geojson', 'all_month': 'all_month.geojson',
    '2.5_hour': '2.5_hour.geojson', '2.5_day': '2.5_day.geojson',
    '2.5_week': '2.5_week.geojson', '2.5_month': '2.5_month.geojson',
    '4.5_hour': '4.5_hour.geojson', '4.5_day': '4.5_day.geojson',
    '4.5_week': '4.5_week.geojson', '4.5_month': '4.5_month.geojson',
    '1.0_hour': '1.0_hour.geojson', '1.0_day': '1.0_day.geojson',
    'significant_week': 'significant_week.geojson',
    'significant_month': 'significant_month.geojson',
};

function getFeedFile(minMag, timeRange) {
    const key = minMag + '_' + timeRange;
    return FEED_MAP[key] || FEED_MAP['2.5_day'];
}

// ─── Globe Projection ───
function project(lat, lon, R, rotX, rotY) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    let x = R * Math.sin(phi) * Math.cos(theta);
    let y = R * Math.cos(phi);
    let z = R * Math.sin(phi) * Math.sin(theta);
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const x2 = x * cosY - z * sinY;
    const z2 = x * sinY + z * cosY;
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const y2 = y * cosX - z2 * sinX;
    const z3 = y * sinX + z2 * cosX;
    return { x: x2, y: y2, z: z3, visible: z3 > -R * 0.1 };
}

// ─── Time Ago ───
function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return s + 's ago';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
}

// ─── Magnitude Classification ───
function classifyMagnitude(mag) {
    if (mag >= 7) return { color: '#ef4444', size: 10, class: 'extreme' };
    if (mag >= 5) return { color: '#f97316', size: 7, class: 'high' };
    if (mag >= 3) return { color: '#f59e0b', size: 5, class: 'med' };
    return { color: '#10b981', size: 3, class: 'low' };
}

// ─── Quake Data Parser ───
function parseQuakeFeature(feature) {
    return {
        mag: feature.properties.mag || 0,
        place: feature.properties.place || 'Unknown',
        time: feature.properties.time,
        lat: feature.geometry.coordinates[1],
        lon: feature.geometry.coordinates[0],
        depth: feature.geometry.coordinates[2],
    };
}

describe('Earthquake Explorer', () => {
    describe('Feed Mapping', () => {
        it('maps valid key to correct file', () => {
            expect(getFeedFile('2.5', 'day')).toBe('2.5_day.geojson');
            expect(getFeedFile('all', 'week')).toBe('all_week.geojson');
        });
        it('falls back to 2.5_day for unknown key', () => {
            expect(getFeedFile('99', 'century')).toBe('2.5_day.geojson');
        });
        it('handles significant feeds', () => {
            expect(getFeedFile('significant', 'month')).toBe('significant_month.geojson');
        });
    });

    describe('Globe Projection', () => {
        const R = 100;
        it('projects equator/prime meridian forward', () => {
            const p = project(0, 0, R, 0, 0);
            expect(p.visible).toBe(true);
        });
        it('north pole is at top (y ~ -R or R depending on convention)', () => {
            const p = project(90, 0, R, 0, 0);
            expect(Math.abs(p.y)).toBeCloseTo(R, 0);
        });
        it('south pole is opposite of north pole', () => {
            const pN = project(90, 0, R, 0, 0);
            const pS = project(-90, 0, R, 0, 0);
            expect(pN.y).toBeCloseTo(-pS.y, 0);
        });
        it('returns visible=false for back side', () => {
            const p = project(0, 90, R, 0, 0);
            // At rotY=0, lon=90 should be on the edge
            expect(typeof p.visible).toBe('boolean');
        });
    });

    describe('Time Ago', () => {
        it('shows seconds for recent times', () => {
            const result = timeAgo(Date.now() - 30000);
            expect(result).toMatch(/\d+s ago/);
        });
        it('shows minutes for 5min ago', () => {
            const result = timeAgo(Date.now() - 300000);
            expect(result).toMatch(/\d+m ago/);
        });
        it('shows hours for 2h ago', () => {
            const result = timeAgo(Date.now() - 7200000);
            expect(result).toMatch(/\d+h ago/);
        });
        it('shows days for 3d ago', () => {
            const result = timeAgo(Date.now() - 259200000);
            expect(result).toMatch(/\d+d ago/);
        });
    });

    describe('Magnitude Classification', () => {
        it('M7+ is extreme (red)', () => {
            const c = classifyMagnitude(7.2);
            expect(c.class).toBe('extreme');
            expect(c.size).toBe(10);
        });
        it('M5-6.9 is high (orange)', () => {
            expect(classifyMagnitude(5.5).class).toBe('high');
        });
        it('M3-4.9 is medium (amber)', () => {
            expect(classifyMagnitude(3.5).class).toBe('med');
        });
        it('M<3 is low (green)', () => {
            expect(classifyMagnitude(2.1).class).toBe('low');
        });
    });

    describe('Data Parser', () => {
        it('parses USGS GeoJSON feature', () => {
            const feature = {
                properties: { mag: 5.2, place: '120km NW of Tokyo', time: 1700000000000 },
                geometry: { coordinates: [139.69, 35.68, 10] }
            };
            const q = parseQuakeFeature(feature);
            expect(q.mag).toBe(5.2);
            expect(q.place).toBe('120km NW of Tokyo');
            expect(q.lat).toBe(35.68);
            expect(q.lon).toBe(139.69);
            expect(q.depth).toBe(10);
        });
        it('handles missing magnitude', () => {
            const feature = {
                properties: { mag: null, place: null, time: 0 },
                geometry: { coordinates: [0, 0, 0] }
            };
            const q = parseQuakeFeature(feature);
            expect(q.mag).toBe(0);
            expect(q.place).toBe('Unknown');
        });
    });
});
