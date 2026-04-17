import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { load } from 'cheerio';

const htmlContent = fs.readFileSync(path.resolve(__dirname, '../projects/web-chess/index.html'), 'utf-8');

describe('Web Chess App', () => {
    let $;

    beforeEach(() => {
        $ = load(htmlContent);
    });

    it('has the correct title', () => {
        expect($('title').text()).toContain('Web Chess');
    });

    it('has the Academy tab structure injected', () => {
        const academyTab = $('#tab-academy');
        expect(academyTab.length).toBe(1);
        expect($('#academyCategories').length).toBe(1);
        expect($('#ac-list-openings').length).toBe(1);
        expect($('#ac-list-tactics').length).toBe(1);
        expect($('#ac-list-endgame').length).toBe(1);
    });

    it('has the new Progress and Active Lesson sections', () => {
        expect($('#academyActiveLesson').length).toBeGreaterThan(0);
        expect($('#academyXp').length).toBeGreaterThan(0);
        expect($('#btnBackToAcademy').length).toBeGreaterThan(0);
    });
});
