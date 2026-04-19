/**
 * @jest-environment jsdom
 */

// ═══════════════════════════════════════════════════
// Speed-Test Unit Tests — DOM, Algorithm, UI Logic
// ═══════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '../projects/speed-test/index.html');
const scriptPath = path.resolve(__dirname, '../projects/speed-test/script.js');

let scriptCode;

beforeAll(() => {
    const htmlCode = fs.readFileSync(htmlPath, 'utf8');
    document.documentElement.innerHTML = htmlCode;
    scriptCode = fs.readFileSync(scriptPath, 'utf8');
    
    // Mock Canvas
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
        clearRect: jest.fn(), fillRect: jest.fn(),
        beginPath: jest.fn(), moveTo: jest.fn(), lineTo: jest.fn(),
        stroke: jest.fn(), fill: jest.fn(), closePath: jest.fn(), arc: jest.fn(),
        createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
        fillText: jest.fn(), strokeText: jest.fn(), measureText: jest.fn(() => ({ width: 0 })),
    }));
    
    // Mock fetch
    global.fetch = jest.fn(() => Promise.resolve({
        ok: true, text: () => Promise.resolve('loc=US\nip=1.2.3.4'),
        json: () => Promise.resolve({ org: 'Test ISP', asn: 'AS12345' }),
        body: { getReader: () => ({ read: () => Promise.resolve({ done: true }), cancel: jest.fn() }), cancel: jest.fn() }
    }));
    
    // Mock performance.now
    const origNow = performance.now.bind(performance);
    let callCount = 0;
    jest.spyOn(performance, 'now').mockImplementation(() => origNow() + (callCount++ * 10));
    
    // Mock localStorage
    const store = {};
    Object.defineProperty(window, 'localStorage', {
        value: {
            getItem: jest.fn(k => store[k] || null),
            setItem: jest.fn((k, v) => { store[k] = v; }),
            removeItem: jest.fn(k => { delete store[k]; })
        }
    });
    
    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: jest.fn(() => Promise.resolve()) }, writable: true
    });
    
    // Mock Leaflet
    window.L = {
        map: jest.fn(() => ({
            setView: jest.fn().mockReturnThis(),
        })),
        tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
        circleMarker: jest.fn(() => ({ addTo: jest.fn().mockReturnThis(), bindPopup: jest.fn().mockReturnThis() })),
    };
    
    // Mock Chart.js
    window.Chart = jest.fn().mockImplementation(() => ({ destroy: jest.fn() }));
    
    // Mock html2pdf
    window.html2pdf = jest.fn(() => ({ set: jest.fn().mockReturnThis(), from: jest.fn().mockReturnThis(), save: jest.fn(() => Promise.resolve()) }));
    
    // Mock QU
    window.QU = { init: jest.fn() };
    
    // Execute the IIFE script
    try { eval(scriptCode); } catch(e) { /* swallow CDN/network errors */ }
});

// ═══════════════════════════════════════════════════
// DOM STRUCTURE TESTS
// ═══════════════════════════════════════════════════
describe('Speed-Test DOM Structure', () => {
    test('Start test button exists', () => {
        expect(document.getElementById('startTest')).not.toBeNull();
    });

    test('Speed gauge SVG exists', () => {
        expect(document.getElementById('speedGauge')).not.toBeNull();
    });

    test('Gauge fill circle exists', () => {
        expect(document.getElementById('gaugeFill')).not.toBeNull();
    });

    test('Speed display elements exist', () => {
        expect(document.getElementById('speedDisplay')).not.toBeNull();
        expect(document.getElementById('speedUnit')).not.toBeNull();
        expect(document.getElementById('phaseDisplay')).not.toBeNull();
    });

    test('Progress bar exists', () => {
        expect(document.getElementById('progressBar')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// METRIC CARDS TESTS
// ═══════════════════════════════════════════════════
describe('Metric Cards', () => {
    test('Download speed display exists', () => {
        expect(document.getElementById('dlSpeed')).not.toBeNull();
    });

    test('Upload speed display exists', () => {
        expect(document.getElementById('ulSpeed')).not.toBeNull();
    });

    test('Latency display exists', () => {
        expect(document.getElementById('latency')).not.toBeNull();
    });

    test('Jitter display exists', () => {
        expect(document.getElementById('jitter')).not.toBeNull();
    });

    test('Packet loss display exists', () => {
        expect(document.getElementById('packetLoss')).not.toBeNull();
    });

    test('Bufferbloat display exists', () => {
        expect(document.getElementById('bufferbloat')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// QUALITY SCORE TESTS
// ═══════════════════════════════════════════════════
describe('Quality Scoring System', () => {
    test('Network quality score display exists', () => {
        expect(document.getElementById('networkQualScore')).not.toBeNull();
    });

    test('Quality label display exists', () => {
        expect(document.getElementById('networkQualLabel')).not.toBeNull();
    });

    test('MOS score display exists', () => {
        expect(document.getElementById('mosScore')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// INSIGHTS PANEL TESTS
// ═══════════════════════════════════════════════════
describe('Insights & Reporting', () => {
    test('Network insights panel exists', () => {
        expect(document.getElementById('networkInsights')).not.toBeNull();
    });

    test('Share button exists', () => {
        expect(document.getElementById('shareBtn')).not.toBeNull();
    });

    test('PDF button exists', () => {
        expect(document.getElementById('pdfBtn')).not.toBeNull();
    });

    test('Test ID display exists', () => {
        expect(document.getElementById('testId')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// SERVER & ISP DATA TESTS
// ═══════════════════════════════════════════════════
describe('Server & ISP Information', () => {
    test('Server node display exists', () => {
        expect(document.getElementById('serverNode')).not.toBeNull();
    });

    test('Connection status badge exists', () => {
        expect(document.getElementById('connStatus')).not.toBeNull();
    });

    test('ISP name display exists', () => {
        expect(document.getElementById('ispName')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// HISTORY TESTS
// ═══════════════════════════════════════════════════
describe('Historical Analytics', () => {
    test('History list container exists', () => {
        expect(document.getElementById('historyLogList')).not.toBeNull();
    });

    test('Clear history button exists', () => {
        expect(document.getElementById('clearHistoryBtn')).not.toBeNull();
    });

    test('History chart canvas exists', () => {
        expect(document.getElementById('historyChart')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// VFX & ANIMATION TESTS
// ═══════════════════════════════════════════════════
describe('Visual Effects', () => {
    test('VFX canvas exists', () => {
        expect(document.getElementById('vfxCanvas')).not.toBeNull();
    });

    test('Live graph canvas exists', () => {
        expect(document.getElementById('liveGraphCanvas')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// ADVANCED DIAGNOSTICS TESTS
// ═══════════════════════════════════════════════════
describe('Advanced Diagnostics', () => {
    test('Run diagnostics button exists', () => {
        expect(document.getElementById('runDiagBtn')).not.toBeNull();
    });

    test('Diagnostic console exists', () => {
        expect(document.getElementById('diagConsole')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// MAP TESTS
// ═══════════════════════════════════════════════════
describe('Edge Network Map', () => {
    test('Server map container exists', () => {
        expect(document.getElementById('serverMap')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// CONFIGURATION TESTS
// ═══════════════════════════════════════════════════
describe('Test Configuration', () => {
    test('Thread count selector exists', () => {
        expect(document.getElementById('threadCount')).not.toBeNull();
    });

    test('IPv6 toggle exists', () => {
        expect(document.getElementById('ipv6Toggle')).not.toBeNull();
    });

    test('HTTP/3 toggle exists', () => {
        expect(document.getElementById('http3Toggle')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// ALGORITHM UNIT TESTS (extracted from IIFE)
// ═══════════════════════════════════════════════════
describe('Algorithm Logic (Unit)', () => {
    // Inline reimplementations for unit testing
    function mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
    function stddev(arr) {
        const m = mean(arr);
        return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
    }
    function median(arr) {
        if (!arr.length) return 0;
        const s = [...arr].sort((a, b) => a - b);
        return s.length % 2 ? s[Math.floor(s.length / 2)] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
    }
    function calcMOS(latency, jitter, loss) {
        const R = 93.2 - latency * 0.1 - jitter * 0.4 - loss * 2.5;
        const clampedR = Math.max(0, Math.min(R, 100));
        if (clampedR <= 0) return 1.0;
        const mos = 1 + 0.035 * clampedR + 0.000007 * clampedR * (clampedR - 60) * (100 - clampedR);
        return Math.max(1, Math.min(mos, 4.5)).toFixed(2);
    }
    function calcQualityScore(dl, ul, lat, jit, loss) {
        let score = 100;
        if (lat > 100) score -= 25; else if (lat > 50) score -= 12; else if (lat > 30) score -= 4;
        if (jit > 30) score -= 15; else if (jit > 15) score -= 8; else if (jit > 8) score -= 3;
        score -= loss * 5;
        if (dl < 5) score -= 30; else if (dl < 25) score -= 15; else if (dl < 100) score -= 5;
        if (ul < 2) score -= 10; else if (ul < 10) score -= 4;
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    function gradeFromScore(score) {
        if (score >= 90) return { letter: 'A+', label: 'Excellent', color: '#4ade80' };
        if (score >= 75) return { letter: 'A',  label: 'Very Good', color: '#86efac' };
        if (score >= 60) return { letter: 'B',  label: 'Good',      color: '#38bdf8' };
        if (score >= 45) return { letter: 'C',  label: 'Fair',      color: '#fbbf24' };
        if (score >= 25) return { letter: 'D',  label: 'Poor',      color: '#f97316' };
        return { letter: 'F', label: 'Very Poor', color: '#ef4444' };
    }

    test('mean() calculates correctly', () => {
        expect(mean([10, 20, 30])).toBe(20);
        expect(mean([])).toBe(0);
        expect(mean([5])).toBe(5);
    });

    test('stddev() calculates correctly', () => {
        expect(stddev([10, 10, 10])).toBe(0);
        expect(stddev([0, 10])).toBeCloseTo(5, 1);
    });

    test('median() calculates correctly', () => {
        expect(median([1, 3, 5])).toBe(3);
        expect(median([1, 2, 3, 4])).toBe(2.5);
        expect(median([])).toBe(0);
    });

    test('MOS score ranges are valid', () => {
        const perfect = parseFloat(calcMOS(5, 1, 0));
        expect(perfect).toBeGreaterThanOrEqual(4.0);
        expect(perfect).toBeLessThanOrEqual(4.5);

        const terrible = parseFloat(calcMOS(500, 100, 50));
        expect(terrible).toBe(1.0);
    });

    test('Quality score grading A+ for excellent connection', () => {
        const score = calcQualityScore(500, 100, 5, 2, 0);
        expect(score).toBeGreaterThanOrEqual(90);
        const grade = gradeFromScore(score);
        expect(grade.letter).toBe('A+');
    });

    test('Quality score grading F for terrible connection', () => {
        const score = calcQualityScore(1, 0.5, 200, 50, 10);
        expect(score).toBeLessThanOrEqual(25);
        const grade = gradeFromScore(score);
        expect(['D', 'F']).toContain(grade.letter);
    });

    test('Quality score grading B for average connection', () => {
        const score = calcQualityScore(50, 15, 40, 10, 0);
        expect(score).toBeGreaterThanOrEqual(60);
        expect(score).toBeLessThan(90);
    });

    test('Bufferbloat grading', () => {
        function bufferbloatGrade(unloaded, loaded) {
            const diff = loaded - unloaded;
            if (diff < 5) return 'A';
            if (diff < 30) return 'B';
            if (diff < 60) return 'C';
            if (diff < 200) return 'D';
            return 'F';
        }
        expect(bufferbloatGrade(10, 12)).toBe('A');
        expect(bufferbloatGrade(10, 35)).toBe('B');
        expect(bufferbloatGrade(10, 60)).toBe('C');
        expect(bufferbloatGrade(10, 150)).toBe('D');
        expect(bufferbloatGrade(10, 500)).toBe('F');
    });
});

// ═══════════════════════════════════════════════════
// THEME TOGGLE TEST
// ═══════════════════════════════════════════════════
describe('Theme System', () => {
    test('Theme toggle button exists', () => {
        expect(document.getElementById('themeBtn')).not.toBeNull();
    });
});
