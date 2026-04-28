import { describe, it, expect } from 'vitest';
import {
    mean, stddev, median, calcMOS, calcQualityScore, gradeFromScore,
    bufferbloatGrade, generateTestId, generateInsights, formatResultsCSV,
    calcStabilityScore
} from '../projects/speed-test/speed-test-utils.js';

// ═══════ MATH HELPERS ═══════
describe('mean()', () => {
    it('calculates average of positive numbers', () => expect(mean([10,20,30])).toBe(20));
    it('returns 0 for empty array', () => expect(mean([])).toBe(0));
    it('handles single value', () => expect(mean([5])).toBe(5));
    it('handles negative values', () => expect(mean([-10,10])).toBe(0));
    it('handles decimals', () => expect(mean([1.5,2.5])).toBe(2));
    it('handles large arrays', () => { const a=Array(1000).fill(7); expect(mean(a)).toBe(7); });
});

describe('stddev()', () => {
    it('returns 0 for identical values', () => expect(stddev([10,10,10])).toBe(0));
    it('calculates correctly for [0,10]', () => expect(stddev([0,10])).toBeCloseTo(5,1));
    it('handles single value', () => expect(stddev([5])).toBe(0));
    it('handles large spread', () => expect(stddev([1,100])).toBeGreaterThan(40));
});

describe('median()', () => {
    it('returns middle of odd array', () => expect(median([1,3,5])).toBe(3));
    it('returns avg of middle pair for even', () => expect(median([1,2,3,4])).toBe(2.5));
    it('returns 0 for empty', () => expect(median([])).toBe(0));
    it('handles single value', () => expect(median([42])).toBe(42));
    it('handles unsorted input', () => expect(median([5,1,3])).toBe(3));
    it('handles negative values', () => expect(median([-5,0,5])).toBe(0));
});

// ═══════ MOS SCORE ═══════
describe('calcMOS()', () => {
    it('perfect conditions give >=4.0', () => { const m=calcMOS(5,1,0); expect(m).toBeGreaterThanOrEqual(4.0); });
    it('perfect conditions give <=4.5', () => { const m=calcMOS(5,1,0); expect(m).toBeLessThanOrEqual(4.5); });
    it('terrible conditions give 1.0', () => expect(calcMOS(500,100,50)).toBe(1.0));
    it('moderate conditions give mid range', () => { const m=calcMOS(50,10,1); expect(m).toBeGreaterThan(2); expect(m).toBeLessThan(4.5); });
    it('returns a number', () => expect(typeof calcMOS(20,5,0)).toBe('number'));
    it('zero latency high MOS', () => expect(calcMOS(0,0,0)).toBeGreaterThanOrEqual(4.3));
    it('high loss low MOS', () => expect(calcMOS(10,5,40)).toBe(1.0));
});

// ═══════ QUALITY SCORE ═══════
describe('calcQualityScore()', () => {
    it('A+ for excellent connection', () => { const s=calcQualityScore(500,100,5,2,0); expect(s).toBeGreaterThanOrEqual(90); });
    it('F for terrible connection', () => { const s=calcQualityScore(1,0.5,200,50,10); expect(s).toBeLessThanOrEqual(25); });
    it('B for average connection', () => { const s=calcQualityScore(50,15,40,10,0); expect(s).toBeGreaterThanOrEqual(60); expect(s).toBeLessThan(90); });
    it('never exceeds 100', () => expect(calcQualityScore(10000,10000,0,0,0)).toBeLessThanOrEqual(100));
    it('never goes below 0', () => expect(calcQualityScore(0,0,999,999,100)).toBeGreaterThanOrEqual(0));
    it('penalizes slow downloads', () => { const fast=calcQualityScore(200,50,10,3,0); const slow=calcQualityScore(3,50,10,3,0); expect(fast).toBeGreaterThan(slow); });
    it('penalizes high jitter', () => { const lo=calcQualityScore(100,50,20,2,0); const hi=calcQualityScore(100,50,20,40,0); expect(lo).toBeGreaterThan(hi); });
    it('penalizes packet loss', () => { const no=calcQualityScore(100,50,20,5,0); const yes=calcQualityScore(100,50,20,5,5); expect(no).toBeGreaterThan(yes); });
});

// ═══════ GRADE ═══════
describe('gradeFromScore()', () => {
    it('A+ for 90+', () => expect(gradeFromScore(95).letter).toBe('A+'));
    it('A for 75-89', () => expect(gradeFromScore(80).letter).toBe('A'));
    it('B for 60-74', () => expect(gradeFromScore(65).letter).toBe('B'));
    it('C for 45-59', () => expect(gradeFromScore(50).letter).toBe('C'));
    it('D for 25-44', () => expect(gradeFromScore(30).letter).toBe('D'));
    it('F for <25', () => expect(gradeFromScore(10).letter).toBe('F'));
    it('includes label and color', () => { const g=gradeFromScore(90); expect(g.label).toBeDefined(); expect(g.color).toMatch(/^#/); });
    it('boundary 90 is A+', () => expect(gradeFromScore(90).letter).toBe('A+'));
    it('boundary 75 is A', () => expect(gradeFromScore(75).letter).toBe('A'));
    it('boundary 0 is F', () => expect(gradeFromScore(0).letter).toBe('F'));
});

// ═══════ BUFFERBLOAT ═══════
describe('bufferbloatGrade()', () => {
    it('A for <5ms diff', () => expect(bufferbloatGrade(10,12).grade).toBe('A'));
    it('B for <30ms diff', () => expect(bufferbloatGrade(10,35).grade).toBe('B'));
    it('C for <60ms diff', () => expect(bufferbloatGrade(10,60).grade).toBe('C'));
    it('D for <200ms diff', () => expect(bufferbloatGrade(10,150).grade).toBe('D'));
    it('F for >=200ms diff', () => expect(bufferbloatGrade(10,500).grade).toBe('F'));
    it('includes label', () => expect(bufferbloatGrade(10,12).label).toContain('Bufferbloat'));
    it('includes color', () => expect(bufferbloatGrade(10,12).color).toMatch(/^#/));
});

// ═══════ TEST ID ═══════
describe('generateTestId()', () => {
    it('starts with QU-', () => expect(generateTestId()).toMatch(/^QU-/));
    it('generates unique IDs', () => { const a=generateTestId(), b=generateTestId(); expect(a).not.toBe(b); });
    it('is a string', () => expect(typeof generateTestId()).toBe('string'));
});

// ═══════ INSIGHTS ═══════
describe('generateInsights()', () => {
    it('returns array of strings', () => { const tips=generateInsights(100,50,10,3,0,4.3,{grade:'A'}); expect(Array.isArray(tips)).toBe(true); tips.forEach(t=>expect(typeof t).toBe('string')); });
    it('includes download commentary', () => { const tips=generateInsights(500,50,10,3,0,4.3,{grade:'A'}); expect(tips.some(t=>t.includes('download')||t.includes('Download')||t.includes('streaming'))).toBe(true); });
    it('flags slow upload', () => { const tips=generateInsights(100,1,50,10,0,3.0,{grade:'C'}); expect(tips.some(t=>t.includes('pload'))).toBe(true); });
    it('flags packet loss', () => { const tips=generateInsights(100,50,10,3,10,3.0,{grade:'C'}); expect(tips.some(t=>t.toLowerCase().includes('packet loss'))).toBe(true); });
    it('flags bufferbloat', () => { const tips=generateInsights(100,50,10,3,0,4.0,{grade:'F'}); expect(tips.some(t=>t.includes('Bufferbloat')||t.includes('ufferbloat'))).toBe(true); });
});

// ═══════ CSV EXPORT ═══════
describe('formatResultsCSV()', () => {
    it('includes headers', () => { const csv=formatResultsCSV([]); expect(csv).toContain('Date'); expect(csv).toContain('Download'); });
    it('formats results correctly', () => {
        const csv=formatResultsCSV([{date:'2026-01-01',dl:100,ul:50,lat:10,jit:3,loss:0,mos:4.3,letter:'A+'}]);
        expect(csv.split('\n').length).toBe(2);
        expect(csv).toContain('100');
    });
    it('handles empty results', () => { const csv=formatResultsCSV([]); expect(csv.split('\n').length).toBe(1); });
});

// ═══════ STABILITY SCORE ═══════
describe('calcStabilityScore()', () => {
    it('returns perfect for identical samples', () => { expect(calcStabilityScore([50,50,50]).score).toBe(100); });
    it('returns low for wild variance', () => { expect(calcStabilityScore([1,100,2,99,3]).score).toBeLessThanOrEqual(40); });
    it('handles insufficient data', () => { expect(calcStabilityScore([1,2]).label).toBe('Insufficient Data'); });
    it('handles null input', () => { expect(calcStabilityScore(null).score).toBe(0); });
    it('moderate variance gets mid score', () => { expect(calcStabilityScore([40,50,60,45,55]).score).toBeGreaterThanOrEqual(60); });
});
