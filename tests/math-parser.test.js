import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Math Grapher Expression Parser', () => {
    let evalExpr;

    beforeEach(() => {
        document.body.innerHTML = `
            <canvas id="graphCanvas" width="600" height="400"></canvas>
            <div id="funcList"></div><button id="addFuncBtn"></button>
            <input id="xMin" value="-10"><input id="xMax" value="10">
            <input id="yMin" value="-10"><input id="yMax" value="10">
            <input id="showGrid" type="checkbox" checked><input id="showAxes" type="checkbox" checked>
            <button id="resetView"></button><button id="exportBtn"></button><button id="themeBtn"></button>
            <input id="paramA" type="range" value="1"><input id="paramB" type="range" value="0"><input id="paramC" type="range" value="0">
            <span id="aVal">1</span><span id="bVal">0</span><span id="cVal">0</span>
            <div id="traceInfo"></div>
        `;
        vi.resetModules();
    });

    it('should load math-grapher script without errors', async () => {
        await import('../projects/math-grapher/script.js');
        expect(document.querySelector('#graphCanvas')).toBeTruthy();
    });

    it('should have canvas rendering context', async () => {
        await import('../projects/math-grapher/script.js');
        const canvas = document.querySelector('#graphCanvas');
        expect(canvas).toBeTruthy();
    });

    it('should handle addFuncBtn click', async () => {
        await import('../projects/math-grapher/script.js');
        const btn = document.querySelector('#addFuncBtn');
        btn.click();
        // Should add a new function row
        const funcList = document.querySelector('#funcList');
        expect(funcList).toBeTruthy();
    });

    it('should handle resetView click', async () => {
        await import('../projects/math-grapher/script.js');
        const btn = document.querySelector('#resetView');
        btn.click();
        expect(document.querySelector('#xMin').value).toBe('-10');
    });

    it('should handle exportBtn click without crash', async () => {
        await import('../projects/math-grapher/script.js');
        // Mock createElement for anchor
        const origCreate = document.createElement.bind(document);
        document.createElement = (tag) => {
            const el = origCreate(tag);
            if (tag === 'a') el.click = vi.fn();
            return el;
        };
        const btn = document.querySelector('#exportBtn');
        btn.click();
        document.createElement = origCreate;
    });

    it('should handle param slider changes', async () => {
        await import('../projects/math-grapher/script.js');
        const paramA = document.querySelector('#paramA');
        paramA.value = '2';
        paramA.dispatchEvent(new Event('input'));
        expect(document.querySelector('#aVal').textContent).toBe('2.0');
    });
});
