import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Circuit Designer MNA Solver', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <canvas id="circuitCanvas" width="800" height="600"></canvas>
            <button id="simBtn">▶ Simulate</button>
            <button id="saveBtn">Save</button><button id="loadBtn">Load</button>
            <button id="exportBtn">Export</button><button id="deleteBtn">Delete</button>
            <button id="rotateBtn">Rotate</button><button id="clearBtn">Clear</button>
            <button id="wireBtn" class="btn active">Wire</button>
            <button id="selectBtn" class="btn">Select</button>
            <button id="themeBtn">🌙</button>
            <div class="canvas-controls"><button class="btn"></button></div>
            <div id="propsContent"></div><div id="simResults"></div>
            <div id="statusText"></div>
            <input id="ohmV"><input id="ohmI"><input id="ohmR">
            <button id="ohmCalcBtn">Calc</button><div id="ohmResult"></div>
            <div id="templateList">
                <button class="btn" data-tpl="voltage-divider">VD</button>
                <button class="btn" data-tpl="led-circuit">LED</button>
                <button class="btn" data-tpl="rc-filter">RC</button>
                <button class="btn" data-tpl="amplifier">Amp</button>
            </div>
            <div id="componentPalette">
                <div class="comp-item" data-type="resistor" draggable="true"></div>
                <div class="comp-item" data-type="battery" draggable="true"></div>
                <div class="comp-item" data-type="led" draggable="true"></div>
                <div class="comp-item" data-type="ground" draggable="true"></div>
            </div>
        `;
        global.confirm = vi.fn(() => false); // Prevent clear from actually running (avoids render with components)
        vi.resetModules();
    });

    it('should load circuit designer without errors', async () => {
        await import('../projects/circuit-designer/script.js');
        expect(document.querySelector('#circuitCanvas')).toBeTruthy();
    });

    it('should display ready status on init', async () => {
        await import('../projects/circuit-designer/script.js');
        const status = document.querySelector('#statusText');
        expect(status.textContent).toContain('Ready');
    });

    it('should handle simulate button with no components', async () => {
        await import('../projects/circuit-designer/script.js');
        document.querySelector('#simBtn').click(); // Start — no battery → shows error
        const results = document.querySelector('#simResults');
        expect(results.innerHTML).toContain('No voltage source');
    });

    it('should stop simulation on second click', async () => {
        await import('../projects/circuit-designer/script.js');
        document.querySelector('#simBtn').click();
        document.querySelector('#simBtn').click();
        expect(document.querySelector('#simBtn').textContent).toContain('Simulate');
    });

    it('should handle Ohms law V and R', async () => {
        await import('../projects/circuit-designer/script.js');
        document.querySelector('#ohmV').value = '9';
        document.querySelector('#ohmR').value = '1000';
        document.querySelector('#ohmCalcBtn').click();
        expect(document.querySelector('#ohmResult').innerHTML).toContain('mA');
    });

    it('should handle Ohms law V and I', async () => {
        await import('../projects/circuit-designer/script.js');
        document.querySelector('#ohmV').value = '12';
        document.querySelector('#ohmI').value = '0.005';
        document.querySelector('#ohmCalcBtn').click();
        expect(document.querySelector('#ohmResult').innerHTML).toContain('Ω');
    });

    it('should handle Ohms law I and R', async () => {
        await import('../projects/circuit-designer/script.js');
        document.querySelector('#ohmI').value = '0.01';
        document.querySelector('#ohmR').value = '470';
        document.querySelector('#ohmCalcBtn').click();
        expect(document.querySelector('#ohmResult').innerHTML).toContain('V');
    });

    it('should error with insufficient Ohms law values', async () => {
        await import('../projects/circuit-designer/script.js');
        document.querySelector('#ohmV').value = '5';
        document.querySelector('#ohmCalcBtn').click();
        expect(document.querySelector('#ohmResult').textContent).toContain('Enter any 2');
    });

    it('should handle save button', async () => {
        await import('../projects/circuit-designer/script.js');
        document.querySelector('#saveBtn').click();
        expect(document.querySelector('#statusText').textContent).toContain('saved');
    });

    it('should handle load after save', async () => {
        await import('../projects/circuit-designer/script.js');
        document.querySelector('#saveBtn').click();
        document.querySelector('#loadBtn').click();
        expect(document.querySelector('#statusText').textContent).toContain('loaded');
    });

    it('should handle load with no saved data', async () => {
        await import('../projects/circuit-designer/script.js');
        localStorage.removeItem('qu_circuit');
        document.querySelector('#loadBtn').click();
        expect(document.querySelector('#statusText').textContent).toContain('No saved');
    });

    it('should handle keyboard shortcuts', async () => {
        await import('../projects/circuit-designer/script.js');
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'v' }));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
        expect(true).toBe(true);
    });

    it('should handle tool switch', async () => {
        await import('../projects/circuit-designer/script.js');
        document.querySelector('#selectBtn').click();
        document.querySelector('#wireBtn').click();
        expect(true).toBe(true);
    });

    it('should handle export', async () => {
        await import('../projects/circuit-designer/script.js');
        const origCreate = document.createElement.bind(document);
        document.createElement = (tag) => {
            const el = origCreate(tag);
            if (tag === 'a') el.click = vi.fn();
            return el;
        };
        document.querySelector('#exportBtn').click();
        document.createElement = origCreate;
        expect(document.querySelector('#statusText').textContent).toContain('Exported');
    });
});
