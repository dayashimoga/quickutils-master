/**
 * @jest-environment jsdom
 */

// ═══════════════════════════════════════════════════
// Web-Chess Unit Tests — Coach Engine, Analysis, Board Logic
// ═══════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '../projects/web-chess/index.html');

beforeAll(() => {
    const htmlCode = fs.readFileSync(htmlPath, 'utf8');
    document.documentElement.innerHTML = htmlCode;
    
    // Mock Audio elements
    HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());
    HTMLMediaElement.prototype.pause = jest.fn();
    
    // Mock Worker (Stockfish)
    window.Worker = class MockWorker {
        constructor() { this.onmessage = null; this.onerror = null; }
        postMessage(msg) {
            setTimeout(() => {
                if (this.onmessage) {
                    if (msg === 'uci') this.onmessage({ data: 'uciok' });
                    if (msg === 'isready') this.onmessage({ data: 'readyok' });
                }
            }, 0);
        }
        terminate() {}
    };
    
    // Mock URL.createObjectURL
    URL.createObjectURL = jest.fn(() => 'blob:mock');
    URL.revokeObjectURL = jest.fn();
    
    // Mock ResizeObserver
    window.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
    
    // Mock Image
    window.Image = class { set src(v) {} };
    
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
        top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0
    }));
    
    // Mock localStorage
    const store = {};
    Object.defineProperty(window, 'localStorage', {
        value: {
            getItem: jest.fn(k => store[k] || null),
            setItem: jest.fn((k, v) => { store[k] = v; }),
            removeItem: jest.fn(k => { delete store[k]; })
        }
    });
});

// ═══════════════════════════════════════════════════
// DOM STRUCTURE TESTS
// ═══════════════════════════════════════════════════
describe('Web-Chess DOM Structure', () => {
    test('Chess board container exists', () => {
        expect(document.getElementById('board')).not.toBeNull();
    });

    test('Evaluation bar elements exist', () => {
        expect(document.getElementById('evalBar')).not.toBeNull();
        expect(document.getElementById('evalText')).not.toBeNull();
        expect(document.getElementById('evalContainer')).not.toBeNull();
    });

    test('Engine status indicator exists', () => {
        expect(document.getElementById('engineStatus')).not.toBeNull();
    });

    test('Move navigation buttons exist', () => {
        expect(document.getElementById('movesList')).not.toBeNull();
    });

    test('Arrow overlay SVG exists with markers', () => {
        const svg = document.getElementById('arrowOverlay');
        expect(svg).not.toBeNull();
        expect(document.getElementById('arrowhead-green')).not.toBeNull();
        expect(document.getElementById('arrowhead-red')).not.toBeNull();
    });

    test('Promotion modal exists', () => {
        expect(document.getElementById('promotionModal')).not.toBeNull();
    });

    test('Game result display exists', () => {
        expect(document.getElementById('gameResult')).not.toBeNull();
    });
    
    test('Clock elements exist', () => {
        expect(document.getElementById('clockWhite')).not.toBeNull();
        expect(document.getElementById('clockBlack')).not.toBeNull();
    });
    
    test('Sound effect audio elements exist', () => {
        expect(document.getElementById('snd-move')).not.toBeNull();
        expect(document.getElementById('snd-capture')).not.toBeNull();
        expect(document.getElementById('snd-check')).not.toBeNull();
        expect(document.getElementById('snd-castle')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// TAB SYSTEM TESTS
// ═══════════════════════════════════════════════════
describe('Tab Navigation System', () => {
    test('Play tab is active by default', () => {
        const playTab = document.querySelector('.tab-btn[data-tab="play"]');
        expect(playTab).not.toBeNull();
        expect(playTab.classList.contains('active')).toBe(true);
    });

    test('Analyze tab exists', () => {
        expect(document.getElementById('tab-analyze')).not.toBeNull();
    });

    test('Academy tab exists', () => {
        expect(document.getElementById('tab-academy')).not.toBeNull();
    });

    test('PGN input textarea exists', () => {
        expect(document.getElementById('pgnInput')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// GAME CONTROLS TESTS
// ═══════════════════════════════════════════════════
describe('Game Control Settings', () => {
    test('AI level selector exists with valid options', () => {
        const sel = document.getElementById('aiLevel');
        expect(sel).not.toBeNull();
        expect(sel.options.length).toBeGreaterThanOrEqual(3);
    });

    test('New game button exists', () => {
        expect(document.getElementById('newGameBtn')).not.toBeNull();
    });

    test('Board theme selector exists', () => {
        expect(document.getElementById('boardTheme')).not.toBeNull();
    });

    test('Move timing slider exists', () => {
        expect(document.getElementById('moveTimingSlider')).not.toBeNull();
    });
    
    test('Sound toggle button exists', () => {
        expect(document.getElementById('btnSoundToggle')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// ANALYSIS SYSTEM TESTS
// ═══════════════════════════════════════════════════
describe('Analysis System', () => {
    test('Analysis report containers exist', () => {
        expect(document.getElementById('ar-blunders')).not.toBeNull();
        expect(document.getElementById('ar-mistakes')).not.toBeNull();
        expect(document.getElementById('ar-inaccuracies')).not.toBeNull();
    });

    test('Analysis report list exists', () => {
        expect(document.getElementById('analysisReportList')).not.toBeNull();
    });

    test('Analyze game button exists', () => {
        expect(document.getElementById('btnAnalyzeGame')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// INTERACTIVE COACH HUD TESTS
// ═══════════════════════════════════════════════════
describe('Interactive Coach Mode', () => {
    test('Coach HUD exists in DOM', () => {
        const hud = document.getElementById('interactiveCoachHud');
        expect(hud).not.toBeNull();
    });

    test('Coach HUD is hidden by default', () => {
        const hud = document.getElementById('interactiveCoachHud');
        expect(hud.classList.contains('hidden')).toBe(true);
    });

    test('Coach text display exists', () => {
        expect(document.getElementById('coachHudText')).not.toBeNull();
    });

    test('Coach Hint button exists', () => {
        expect(document.getElementById('coachBtnHint')).not.toBeNull();
    });

    test('Coach Skip button exists', () => {
        expect(document.getElementById('coachBtnSkip')).not.toBeNull();
    });

    test('Coach Exit button exists', () => {
        expect(document.getElementById('coachBtnExit')).not.toBeNull();
    });

    test('Start Coach button exists', () => {
        expect(document.getElementById('btnStartCoach')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// ACADEMY MODULE TESTS
// ═══════════════════════════════════════════════════
describe('Academy Module', () => {
    test('Academy XP display exists', () => {
        expect(document.getElementById('academyXp')).not.toBeNull();
    });

    test('Academy streak display exists', () => {
        expect(document.getElementById('academyStreak')).not.toBeNull();
    });

    test('Academy Elo display exists', () => {
        expect(document.getElementById('academyElo')).not.toBeNull();
    });
    
    test('Academy lesson sections exist', () => {
        // Fundamentals, Openings, Tactics, Strategy, Endgame sections
        const tab = document.getElementById('tab-academy');
        expect(tab).not.toBeNull();
        expect(tab.innerHTML).toContain('curriculum');
    });
});

// ═══════════════════════════════════════════════════
// CAPTURED PIECES TESTS
// ═══════════════════════════════════════════════════
describe('Captured Pieces Display', () => {
    test('White captured pieces container exists', () => {
        expect(document.getElementById('capturedWhite')).not.toBeNull();
    });

    test('Black captured pieces container exists', () => {
        expect(document.getElementById('capturedBlack')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// FAMOUS GAMES SELECTOR
// ═══════════════════════════════════════════════════
describe('Famous Games', () => {
    test('Famous games dropdown exists', () => {
        const sel = document.getElementById('famousGames');
        expect(sel).not.toBeNull();
    });

    test('Contains at least 5 famous games', () => {
        const sel = document.getElementById('famousGames');
        // First option is placeholder
        expect(sel.options.length).toBeGreaterThanOrEqual(6);
    });

    test('Includes Opera Game', () => {
        const sel = document.getElementById('famousGames');
        const options = Array.from(sel.options).map(o => o.value);
        expect(options).toContain('opera');
    });
});

// ═══════════════════════════════════════════════════
// PGN MANAGEMENT
// ═══════════════════════════════════════════════════
describe('PGN Management', () => {
    test('Load PGN button exists', () => {
        expect(document.getElementById('loadPgnBtn')).not.toBeNull();
    });

    test('Download PGN button exists', () => {
        expect(document.getElementById('downloadPgnBtn')).not.toBeNull();
    });

    test('Auto replay button exists', () => {
        expect(document.getElementById('autoReplayBtn')).not.toBeNull();
    });

    test('PGN file upload input exists', () => {
        expect(document.getElementById('pgnFileInput')).not.toBeNull();
    });

    test('Replay speed slider exists', () => {
        expect(document.getElementById('replaySpeedSlider')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// OPENING DETECTION
// ═══════════════════════════════════════════════════
describe('Opening Badge', () => {
    test('Opening name badge exists', () => {
        expect(document.getElementById('openingName')).not.toBeNull();
    });
});
