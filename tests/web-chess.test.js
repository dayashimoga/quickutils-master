import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { load } from 'cheerio';

const htmlContent = fs.readFileSync(path.resolve(__dirname, '../projects/web-chess/index.html'), 'utf-8');
const jsContent = fs.readFileSync(path.resolve(__dirname, '../projects/web-chess/script.js'), 'utf-8');
const cssContent = fs.readFileSync(path.resolve(__dirname, '../projects/web-chess/style.css'), 'utf-8');

describe('Web Chess App', () => {
    let $;

    beforeEach(() => {
        $ = load(htmlContent);
    });

    // ═══════════════════════════════════════════════════
    // HTML STRUCTURE TESTS
    // ═══════════════════════════════════════════════════
    describe('HTML Structure', () => {
        it('has the correct title', () => {
            expect($('title').text()).toContain('Web Chess');
        });

        it('has meta description for SEO', () => {
            const meta = $('meta[name="description"]');
            expect(meta.length).toBeGreaterThan(0);
        });

        it('has the navbar with brand and links', () => {
            expect($('.navbar').length).toBe(1);
            expect($('.brand').length).toBe(1);
            expect($('.nav-links').length).toBe(1);
        });

        it('has the hero section with gradient title', () => {
            expect($('.hero').length).toBe(1);
            expect($('.gradient-text').length).toBeGreaterThan(0);
            expect($('.hero h1').text()).toContain('Web Chess Pro');
        });

        it('has the chess board container', () => {
            expect($('#board').length).toBe(1);
            expect($('.board-wrapper').length).toBe(1);
        });

        it('has the evaluation bar', () => {
            expect($('#evalContainer').length).toBe(1);
            expect($('#evalBar').length).toBe(1);
            expect($('#evalText').length).toBe(1);
        });

        it('has player info sections', () => {
            expect($('.player-info').length).toBeGreaterThanOrEqual(2);
        });

        it('has the footer', () => {
            expect($('.footer').length).toBe(1);
            expect($('.copyright').length).toBe(1);
        });

        it('has the theme toggle button', () => {
            expect($('#themeBtn').length).toBe(1);
        });
    });

    // ═══════════════════════════════════════════════════
    // TABS & NAVIGATION
    // ═══════════════════════════════════════════════════
    describe('Tabs & Navigation', () => {
        it('has all three main tabs', () => {
            const tabs = $('[data-tab]');
            const tabValues = [];
            tabs.each((i, el) => tabValues.push($(el).attr('data-tab')));
            expect(tabValues).toContain('play');
            expect(tabValues).toContain('analyze');
            expect(tabValues).toContain('academy');
        });

        it('has tab content sections for each mode', () => {
            expect($('#tab-play').length).toBe(1);
            expect($('#tab-analyze').length).toBe(1);
            expect($('#tab-academy').length).toBe(1);
        });

        it('has Play AI tab active by default', () => {
            const activeTab = $('[data-tab="play"]');
            expect(activeTab.hasClass('active')).toBe(true);
        });
    });

    // ═══════════════════════════════════════════════════
    // DIFFICULTY TIERS
    // ═══════════════════════════════════════════════════
    describe('Difficulty Tiers', () => {
        it('has the difficulty dropdown with 5 tiers', () => {
            const options = $('#aiLevel option');
            expect(options.length).toBe(5);
        });

        it('has Elo ratings in difficulty labels', () => {
            const labels = [];
            $('#aiLevel option').each((i, el) => labels.push($(el).text()));
            expect(labels.some(l => l.includes('800 Elo'))).toBe(true);
            expect(labels.some(l => l.includes('1200 Elo'))).toBe(true);
            expect(labels.some(l => l.includes('1800 Elo'))).toBe(true);
            expect(labels.some(l => l.includes('2200 Elo'))).toBe(true);
            expect(labels.some(l => l.includes('2500+ Elo'))).toBe(true);
        });

        it('has the difficulty description element', () => {
            expect($('#difficultyDesc').length).toBe(1);
        });

        it('has correct default difficulty (Advanced 1800)', () => {
            const selected = $('#aiLevel option[selected]');
            expect(selected.attr('value')).toBe('10');
        });
    });

    // ═══════════════════════════════════════════════════
    // PGN FILE MANAGEMENT
    // ═══════════════════════════════════════════════════
    describe('PGN File Management', () => {
        it('has the PGN textarea', () => {
            expect($('#pgnInput').length).toBe(1);
            expect($('#pgnInput').attr('placeholder')).toContain('e4');
        });

        it('has the Load PGN button', () => {
            expect($('#loadPgnBtn').length).toBe(1);
        });

        it('has the file upload input (hidden)', () => {
            const input = $('#pgnFileInput');
            expect(input.length).toBe(1);
            expect(input.attr('type')).toBe('file');
            expect(input.attr('accept')).toContain('.pgn');
        });

        it('has the upload label trigger', () => {
            const label = $('label[for="pgnFileInput"]');
            expect(label.length).toBe(1);
            expect(label.text()).toContain('Upload');
        });

        it('has the download PGN button', () => {
            expect($('#downloadPgnBtn').length).toBe(1);
        });

        it('has the auto-replay button', () => {
            expect($('#autoReplayBtn').length).toBe(1);
        });

        it('has the replay speed slider', () => {
            const slider = $('#replaySpeedSlider');
            expect(slider.length).toBe(1);
            expect(slider.attr('min')).toBe('300');
            expect(slider.attr('max')).toBe('3000');
        });

        it('has the replay speed label', () => {
            expect($('#replaySpeedVal').length).toBe(1);
        });
    });

    // ═══════════════════════════════════════════════════
    // FAMOUS GAMES
    // ═══════════════════════════════════════════════════
    describe('Famous Games', () => {
        it('has the famous games dropdown', () => {
            expect($('#famousGames').length).toBe(1);
        });

        it('has all 10 famous games', () => {
            const options = $('#famousGames option');
            // First option is placeholder, then 10 games
            expect(options.length).toBe(11);
        });

        it('includes specific famous games', () => {
            const values = [];
            $('#famousGames option').each((i, el) => values.push($(el).attr('value')));
            expect(values).toContain('opera');
            expect(values).toContain('century');
            expect(values).toContain('alphazero');
        });
    });

    // ═══════════════════════════════════════════════════
    // MOVE NAVIGATION
    // ═══════════════════════════════════════════════════
    describe('Move Navigation', () => {
        it('has move navigation buttons', () => {
            expect($('#btnStart').length).toBe(1);
            expect($('#btnPrev').length).toBe(1);
            expect($('#btnNext').length).toBe(1);
            expect($('#btnEnd').length).toBe(1);
            expect($('#btnAutoPlay').length).toBe(1);
        });

        it('has the moves list container', () => {
            expect($('.moves-list').length).toBe(1);
        });
    });

    // ═══════════════════════════════════════════════════
    // UTILITY BUTTONS
    // ═══════════════════════════════════════════════════
    describe('Utility Buttons', () => {
        it('has Export PGN button', () => {
            expect($('#exportPgn').length).toBe(1);
        });

        it('has Copy FEN button', () => {
            expect($('#copyFen').length).toBe(1);
        });

        it('has Flip Board button', () => {
            expect($('#flipBoard').length).toBe(1);
        });

        it('has board theme selector', () => {
            const themes = $('#boardTheme option');
            expect(themes.length).toBeGreaterThanOrEqual(4);
        });

        it('has move timing slider', () => {
            expect($('#moveTimingSlider').length).toBe(1);
        });

        it('has reset board button', () => {
            expect($('#resetBoardBtn').length).toBe(1);
        });
    });

    // ═══════════════════════════════════════════════════
    // ACADEMY - CURRICULUM STRUCTURE
    // ═══════════════════════════════════════════════════
    describe('Academy Curriculum', () => {
        it('has the Academy tab structure', () => {
            expect($('#tab-academy').length).toBe(1);
            expect($('#academyCategories').length).toBe(1);
        });

        it('has all 5 academy sections', () => {
            expect($('#ac-list-fundamentals').length).toBe(1);
            expect($('#ac-list-openings').length).toBe(1);
            expect($('#ac-list-tactics').length).toBe(1);
            expect($('#ac-list-endgame').length).toBe(1);
            expect($('#ac-list-strategy').length).toBe(1);
        });

        it('has progress indicators for each section', () => {
            expect($('#ac-prog-fund').length).toBe(1);
            expect($('#ac-prog-ops').length).toBe(1);
            expect($('#ac-prog-tac').length).toBe(1);
            expect($('#ac-prog-end').length).toBe(1);
            expect($('#ac-prog-str').length).toBe(1);
        });

        it('has the active lesson panel', () => {
            expect($('#academyActiveLesson').length).toBe(1);
            expect($('#btnBackToAcademy').length).toBe(1);
            expect($('#al-title').length).toBe(1);
            expect($('#al-desc').length).toBe(1);
        });

        it('has XP and streak tracking', () => {
            expect($('#academyXp').length).toBe(1);
            expect($('#academyStreak').length).toBe(1);
            expect($('#academyElo').length).toBe(1);
        });

        it('has theory/practice toggle buttons', () => {
            const atabs = $('[data-atab]');
            const vals = [];
            atabs.each((i, el) => vals.push($(el).attr('data-atab')));
            expect(vals).toContain('theory');
            expect(vals).toContain('practice');
        });

        it('has the academy hint system', () => {
            expect($('#academyHintText').length).toBe(1);
            expect($('#btnAcademyHint').length).toBe(1);
        });
    });

    // ═══════════════════════════════════════════════════
    // GAME CONTROLS
    // ═══════════════════════════════════════════════════
    describe('Game Controls', () => {
        it('has player color selector', () => {
            const opts = $('#playerColor option');
            expect(opts.length).toBe(3);
            const vals = [];
            opts.each((i, el) => vals.push($(el).attr('value')));
            expect(vals).toContain('w');
            expect(vals).toContain('b');
            expect(vals).toContain('random');
        });

        it('has the new game button', () => {
            expect($('#newGameBtn').length).toBe(1);
        });

        it('has the promotion modal', () => {
            expect($('#promotionModal').length).toBe(1);
            expect($('.promo-pieces').length).toBe(1);
        });

        it('has game result display', () => {
            expect($('#gameResult').length).toBe(1);
        });
    });

    // ═══════════════════════════════════════════════════
    // JS CONTENT TESTS
    // ═══════════════════════════════════════════════════
    describe('JavaScript Content', () => {
        it('imports chess.js library', () => {
            expect(jsContent).toContain("import { Chess }");
        });

        it('contains ACADEMY_DB with all sections', () => {
            expect(jsContent).toContain('ACADEMY_DB');
            expect(jsContent).toContain("openings:");
            expect(jsContent).toContain("tactics:");
            expect(jsContent).toContain("endgame:");
            expect(jsContent).toContain("fundamentals:");
            expect(jsContent).toContain("strategy:");
        });

        it('has 20 openings in the curriculum', () => {
            const matches = jsContent.match(/id: 'op\d+'/g);
            expect(matches.length).toBe(20);
        });

        it('has 15 tactics in the curriculum', () => {
            const matches = jsContent.match(/id: 'tac\d+'/g);
            expect(matches.length).toBe(15);
        });

        it('has 15 endgames in the curriculum', () => {
            const matches = jsContent.match(/id: 'end\d+'/g);
            expect(matches.length).toBe(15);
        });

        it('has 10 fundamentals in the curriculum', () => {
            const matches = jsContent.match(/id: 'fund\d+'/g);
            expect(matches.length).toBe(10);
        });

        it('has 10 strategy lessons', () => {
            const matches = jsContent.match(/id: 'str\d+'/g);
            expect(matches.length).toBe(10);
        });

        it('contains FAMOUS_GAMES database', () => {
            expect(jsContent).toContain('FAMOUS_GAMES');
            expect(jsContent).toContain("opera:");
            expect(jsContent).toContain("century:");
            expect(jsContent).toContain("immortal:");
            expect(jsContent).toContain("deepblue:");
            expect(jsContent).toContain("carlsen:");
            expect(jsContent).toContain("evergreen:");
            expect(jsContent).toContain("alphazero:");
        });

        it('contains OPENINGS detection array', () => {
            expect(jsContent).toContain('const OPENINGS');
            expect(jsContent).toContain("Ruy López");
            expect(jsContent).toContain("Italian Game");
            expect(jsContent).toContain("Sicilian Defense");
        });

        it('contains BOARD_THEMES configuration', () => {
            expect(jsContent).toContain('BOARD_THEMES');
            expect(jsContent).toContain("classic:");
            expect(jsContent).toContain("emerald:");
            expect(jsContent).toContain("midnight:");
        });

        it('has difficulty description system', () => {
            expect(jsContent).toContain('DIFF_DESCS');
            expect(jsContent).toContain('beginners');
            expect(jsContent).toContain('Grandmaster strength');
        });

        it('has PGN file upload handler', () => {
            expect(jsContent).toContain('pgnFileInput');
            expect(jsContent).toContain('FileReader');
            expect(jsContent).toContain('readAsText');
        });

        it('has PGN file download handler', () => {
            expect(jsContent).toContain('downloadPgnBtn');
            expect(jsContent).toContain('application/x-chess-pgn');
            expect(jsContent).toContain('URL.createObjectURL');
        });

        it('has auto-replay system', () => {
            expect(jsContent).toContain('startAutoReplay');
            expect(jsContent).toContain('autoReplayBtn');
            expect(jsContent).toContain('replaySpeed');
        });

        it('has replay speed slider handler', () => {
            expect(jsContent).toContain('replaySpeedSlider');
            expect(jsContent).toContain('replaySpeedVal');
        });

        it('has theory arrow drawing', () => {
            expect(jsContent).toContain('drawTheoryArrow');
            expect(jsContent).toContain('theory-svg');
            expect(jsContent).toContain('theory-arrow-line');
        });

        it('has theory highlight system', () => {
            expect(jsContent).toContain('theory-highlight');
            expect(jsContent).toContain('clearTheoryHighlights');
        });

        it('has academy progress tracking', () => {
            expect(jsContent).toContain('saveAcademyProgress');
            expect(jsContent).toContain('chessAcademyXP');
            expect(jsContent).toContain('academyProgress');
        });

        it('has XP system', () => {
            expect(jsContent).toContain("xp += 50");
        });

        it('has streak calculation', () => {
            expect(jsContent).toContain('calculateStreak');
        });

        it('has Elo estimation', () => {
            expect(jsContent).toContain('Unranked');
            expect(jsContent).toContain('Math.min(elo, 2500)');
        });

        it('has keyboard shortcuts', () => {
            expect(jsContent).toContain('ArrowLeft');
            expect(jsContent).toContain('ArrowRight');
            expect(jsContent).toContain('Home');
            expect(jsContent).toContain('End');
        });

        it('has drag and drop support', () => {
            expect(jsContent).toContain('onPieceDragStart');
            expect(jsContent).toContain('onPieceDragEnd');
            expect(jsContent).toContain('moveDragGhost');
        });

        it('has Stockfish engine integration', () => {
            expect(jsContent).toContain('initEngine');
            expect(jsContent).toContain('requestEngineAnalysis');
            expect(jsContent).toContain('stockfish');
        });

        it('has opening detection', () => {
            expect(jsContent).toContain('detectOpening');
        });

        it('has promotion modal handler', () => {
            expect(jsContent).toContain('showPromotionPicker');
            expect(jsContent).toContain('promotionModal');
        });
    });

    // ═══════════════════════════════════════════════════
    // CSS DESIGN TESTS
    // ═══════════════════════════════════════════════════
    describe('CSS Design System', () => {
        it('uses glassmorphism design tokens', () => {
            expect(cssContent).toContain('--glass-bg');
            expect(cssContent).toContain('--glass-border');
            expect(cssContent).toContain('backdrop-filter');
        });

        it('has responsive breakpoints', () => {
            expect(cssContent).toContain('@media (max-width: 899px)');
            expect(cssContent).toContain('@media (max-width: 480px)');
        });

        it('has light theme variables', () => {
            expect(cssContent).toContain('[data-theme="light"]');
        });

        it('has theory highlight styling', () => {
            expect(cssContent).toContain('.theory-highlight');
            expect(cssContent).toContain('theory-glow');
        });

        it('has piece animation', () => {
            expect(cssContent).toContain('piece-drop');
            expect(cssContent).toContain('will-change');
        });

        it('has shake error animation', () => {
            expect(cssContent).toContain('shake-err');
        });

        it('has status dot animations', () => {
            expect(cssContent).toContain('.status-dot.ready');
            expect(cssContent).toContain('.status-dot.thinking');
            expect(cssContent).toContain('pulse-dot');
        });

        it('has board theme variables', () => {
            expect(cssContent).toContain('--board-light');
            expect(cssContent).toContain('--board-dark');
            expect(cssContent).toContain('--board-highlight');
        });

        it('has gradient primary button', () => {
            expect(cssContent).toContain('.btn-primary');
            expect(cssContent).toContain('linear-gradient');
        });

        it('has academy category styles', () => {
            expect(cssContent).toContain('.academy-category');
            expect(cssContent).toContain('.ac-item');
            expect(cssContent).toContain('.ac-item:hover');
        });

        it('has scrollbar styling', () => {
            expect(cssContent).toContain('scrollbar-width');
            expect(cssContent).toContain('::-webkit-scrollbar');
        });

        it('has print media query', () => {
            expect(cssContent).toContain('@media print');
        });
    });

    // ═══════════════════════════════════════════════════
    // ACCESSIBILITY & PERFORMANCE
    // ═══════════════════════════════════════════════════
    describe('Accessibility & Responsiveness', () => {
        it('has viewport meta tag', () => {
            const viewport = $('meta[name="viewport"]');
            expect(viewport.length).toBe(1);
            expect(viewport.attr('content')).toContain('width=device-width');
        });

        it('uses semantic HTML elements', () => {
            expect($('main').length).toBe(1);
            expect($('nav').length).toBe(1);
            expect($('footer').length).toBe(1);
        });

        it('has a single h1 heading', () => {
            expect($('h1').length).toBe(1);
        });

        it('has Inter font loaded', () => {
            const links = $('link[href*="fonts.googleapis"]');
            expect(links.length).toBeGreaterThan(0);
        });

        it('all buttons have text content', () => {
            const buttons = $('button:not([class*="piece"])');
            buttons.each((i, el) => {
                const text = $(el).text().trim();
                expect(text.length).toBeGreaterThan(0);
            });
        });
    });
});
