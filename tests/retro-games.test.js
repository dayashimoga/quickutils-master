import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Retro Games — New Games', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="gameSelector">
                <div class="game-card active" data-game="snake"></div>
                <div class="game-card" data-game="tetris"></div>
                <div class="game-card" data-game="2048"></div>
                <div class="game-card" data-game="breakout"></div>
                <div class="game-card" data-game="minesweeper"></div>
                <div class="game-card" data-game="flappy"></div>
                <div class="game-card" data-game="invaders"></div>
                <div class="game-card" data-game="pacman"></div>
                <div class="game-card" data-game="asteroids"></div>
                <div class="game-card" data-game="racing"></div>
            </div>
            <canvas id="gameCanvas" width="400" height="400"></canvas>
            <button id="startGameBtn">▶ Start</button>
            <button id="pauseGameBtn">⏸ Pause</button>
            <span id="gameScore">0</span><span id="gameBest">0</span><span id="gameLevel">1</span>
            <div class="dpad-grid">
                <button class="dpad-btn" data-dir="up">⬆️</button>
                <button class="dpad-btn" data-dir="down">⬇️</button>
                <button class="dpad-btn" data-dir="left">⬅️</button>
                <button class="dpad-btn" data-dir="right">➡️</button>
            </div>
        `;
        global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));
        global.cancelAnimationFrame = vi.fn(id => clearTimeout(id));
        vi.useFakeTimers();
        vi.resetModules();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should load retro-games without errors', async () => {
        await import('../projects/retro-games/script.js');
        expect(document.querySelector('#gameCanvas')).toBeTruthy();
    });

    it('should select pacman game', async () => {
        await import('../projects/retro-games/script.js');
        const pacmanCard = document.querySelector('[data-game="pacman"]');
        pacmanCard.click();
        expect(pacmanCard.classList.contains('active')).toBe(true);
    });

    it('should select asteroids game', async () => {
        await import('../projects/retro-games/script.js');
        const card = document.querySelector('[data-game="asteroids"]');
        card.click();
        expect(card.classList.contains('active')).toBe(true);
    });

    it('should select racing game', async () => {
        await import('../projects/retro-games/script.js');
        const card = document.querySelector('[data-game="racing"]');
        card.click();
        expect(card.classList.contains('active')).toBe(true);
    });

    it('should start pacman game', async () => {
        await import('../projects/retro-games/script.js');
        document.querySelector('[data-game="pacman"]').click();
        document.querySelector('#startGameBtn').click();
        expect(document.querySelector('#startGameBtn').textContent).toContain('Restart');
    });

    it('should start asteroids game', async () => {
        await import('../projects/retro-games/script.js');
        document.querySelector('[data-game="asteroids"]').click();
        document.querySelector('#startGameBtn').click();
        expect(document.querySelector('#startGameBtn').textContent).toContain('Restart');
    });

    it('should start racing game', async () => {
        await import('../projects/retro-games/script.js');
        document.querySelector('[data-game="racing"]').click();
        document.querySelector('#startGameBtn').click();
        expect(document.querySelector('#startGameBtn').textContent).toContain('Restart');
    });

    it('should handle pause/resume', async () => {
        await import('../projects/retro-games/script.js');
        document.querySelector('[data-game="pacman"]').click();
        document.querySelector('#startGameBtn').click();
        document.querySelector('#pauseGameBtn').click();
        expect(document.querySelector('#pauseGameBtn').textContent).toContain('Resume');
        document.querySelector('#pauseGameBtn').click();
        expect(document.querySelector('#pauseGameBtn').textContent).toContain('Pause');
    });

    it('should handle keyboard input for pacman', async () => {
        await import('../projects/retro-games/script.js');
        document.querySelector('[data-game="pacman"]').click();
        document.querySelector('#startGameBtn').click();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        // Should not crash
        expect(true).toBe(true);
    });

    it('should handle dpad input for racing', async () => {
        await import('../projects/retro-games/script.js');
        document.querySelector('[data-game="racing"]').click();
        document.querySelector('#startGameBtn').click();
        document.querySelector('[data-dir="left"]').click();
        document.querySelector('[data-dir="right"]').click();
        expect(true).toBe(true);
    });
});
