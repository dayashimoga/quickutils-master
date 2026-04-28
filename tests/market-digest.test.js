import { describe, it, expect } from 'vitest';
import {
    formatDelta, formatPrice, formatMarketCap, computeSignal, calcSMA, calcEMA,
    calcRSI, calcBollingerBands, calcMACD, calcSharpeRatio, calcMaxDrawdown,
    calcCorrelation, getWatchedAssets, toggleWatch, calcPortfolioValue, calcDailyReturns
} from '../projects/market-digest/market-digest-utils.js';

// ═══════ FORMAT DELTA ═══════
describe('formatDelta()', () => {
    it('positive with + sign', () => expect(formatDelta(5.23)).toBe('+5.23%'));
    it('negative with - sign', () => expect(formatDelta(-3.14)).toBe('-3.14%'));
    it('zero with + sign', () => expect(formatDelta(0)).toBe('+0.00%'));
    it('null returns --', () => expect(formatDelta(null)).toBe('--'));
    it('NaN returns --', () => expect(formatDelta(NaN)).toBe('--'));
    it('undefined returns --', () => expect(formatDelta(undefined)).toBe('--'));
});

// ═══════ FORMAT PRICE ═══════
describe('formatPrice()', () => {
    it('formats >$1 correctly', () => { const r=formatPrice(1234.56); expect(r).toContain('1,234.56'); });
    it('formats <$1 with precision', () => { const r=formatPrice(0.004567); expect(r).toContain('0.004567'); });
    it('handles null', () => expect(formatPrice(null)).toBe('--'));
    it('handles NaN', () => expect(formatPrice(NaN)).toBe('--'));
});

// ═══════ FORMAT MARKET CAP ═══════
describe('formatMarketCap()', () => {
    it('formats trillions', () => expect(formatMarketCap(2.5e12)).toContain('T'));
    it('formats billions', () => expect(formatMarketCap(500e9)).toContain('B'));
    it('formats millions', () => expect(formatMarketCap(50e6)).toContain('M'));
    it('handles null', () => expect(formatMarketCap(null)).toBe('--'));
    it('handles NaN', () => expect(formatMarketCap(NaN)).toBe('--'));
});

// ═══════ SIGNAL ═══════
describe('computeSignal()', () => {
    it('Strong Buy when all bullish', () => { const r=computeSignal(100,90,80,25,5); expect(r.signal).toBe('Strong Buy'); });
    it('Strong Sell when all bearish', () => { const r=computeSignal(50,90,100,80,-5); expect(r.signal).toBe('Strong Sell'); });
    it('Hold for neutral', () => { const r=computeSignal(95,100,90,50,0); expect(r.signal).toBe('Hold'); });
    it('includes color', () => expect(computeSignal(100,90,80,25,5).color).toMatch(/^#/));
    it('includes icon', () => expect(computeSignal(100,90,80,25,5).icon).toBeDefined());
    it('Buy for moderate bullish', () => { const r=computeSignal(100,90,80,50,1); expect(['Buy','Strong Buy']).toContain(r.signal); });
});

// ═══════ SMA ═══════
describe('calcSMA()', () => {
    it('calculates 3-period SMA', () => expect(calcSMA([10,20,30],3)).toBe(20));
    it('returns null for insufficient data', () => expect(calcSMA([10],3)).toBeNull());
    it('uses last N values', () => expect(calcSMA([100,10,20,30],3)).toBe(20));
    it('handles null data', () => expect(calcSMA(null,3)).toBeNull());
});

// ═══════ EMA ═══════
describe('calcEMA()', () => {
    it('returns number for valid data', () => { const r=calcEMA([10,20,30,40,50],3); expect(typeof r).toBe('number'); });
    it('returns null for insufficient data', () => expect(calcEMA([10],5)).toBeNull());
    it('weights recent values more', () => { const ema=calcEMA([10,10,10,10,50],3); const sma=calcSMA([10,10,10,10,50],3); expect(ema).toBeGreaterThan(sma); });
});

// ═══════ RSI ═══════
describe('calcRSI()', () => {
    it('returns 100 for all gains', () => { const data=Array.from({length:20},(_,i)=>i+1); expect(calcRSI(data)).toBe(100); });
    it('returns number between 0-100', () => { const data=[50,52,48,55,53,51,49,54,52,50,48,47,46,45,44,43]; const r=calcRSI(data); expect(r).toBeGreaterThanOrEqual(0); expect(r).toBeLessThanOrEqual(100); });
    it('returns null for insufficient data', () => expect(calcRSI([1,2,3])).toBeNull());
});

// ═══════ BOLLINGER BANDS ═══════
describe('calcBollingerBands()', () => {
    it('upper > middle > lower', () => { const data=Array.from({length:25},()=>50+Math.random()*10); const r=calcBollingerBands(data); expect(r.upper).toBeGreaterThan(r.middle); expect(r.middle).toBeGreaterThan(r.lower); });
    it('returns null for insufficient data', () => expect(calcBollingerBands([1,2,3])).toBeNull());
    it('has stddev property', () => { const data=Array.from({length:25},()=>50); const r=calcBollingerBands(data); expect(r.stddev).toBe(0); expect(r.upper).toBe(r.lower); });
});

// ═══════ MACD ═══════
describe('calcMACD()', () => {
    it('returns object with macd property', () => { const data=Array.from({length:50},(_,i)=>100+i); const r=calcMACD(data); expect(r).not.toBeNull(); expect(r.macd).toBeDefined(); });
    it('returns null for insufficient data', () => expect(calcMACD([1,2,3])).toBeNull());
});

// ═══════ SHARPE RATIO ═══════
describe('calcSharpeRatio()', () => {
    it('positive for consistent gains', () => { const returns=Array(50).fill(0.01); const r=calcSharpeRatio(returns); expect(r).toBeGreaterThan(0); });
    it('returns null for insufficient data', () => expect(calcSharpeRatio([0.01])).toBeNull());
    it('returns null for zero variance', () => expect(calcSharpeRatio(Array(50).fill(0))).toBeNull());
});

// ═══════ MAX DRAWDOWN ═══════
describe('calcMaxDrawdown()', () => {
    it('0 for monotonically rising', () => expect(calcMaxDrawdown([1,2,3,4,5])).toBe(0));
    it('correct for simple drop', () => { const dd=calcMaxDrawdown([100,80,90,70,95]); expect(dd).toBeCloseTo(0.3,2); });
    it('0 for insufficient data', () => expect(calcMaxDrawdown([100])).toBe(0));
    it('handles null', () => expect(calcMaxDrawdown(null)).toBe(0));
});

// ═══════ CORRELATION ═══════
describe('calcCorrelation()', () => {
    it('1.0 for perfectly correlated', () => expect(calcCorrelation([1,2,3],[2,4,6])).toBeCloseTo(1,5));
    it('-1.0 for inverse', () => expect(calcCorrelation([1,2,3],[6,4,2])).toBeCloseTo(-1,5));
    it('~0 for uncorrelated', () => { const r=calcCorrelation([1,2,3,4],[1,-1,1,-1]); expect(Math.abs(r)).toBeLessThan(0.5); });
    it('null for mismatched lengths', () => expect(calcCorrelation([1,2],[1])).toBeNull());
    it('null for insufficient data', () => expect(calcCorrelation([1],[2])).toBeNull());
});

// ═══════ WATCHLIST ═══════
describe('getWatchedAssets()', () => {
    it('parses valid JSON', () => expect(getWatchedAssets('["BTC","ETH"]')).toEqual(['BTC','ETH']));
    it('returns empty for invalid', () => expect(getWatchedAssets('invalid')).toEqual([]));
    it('returns empty for null', () => expect(getWatchedAssets(null)).toEqual([]));
});

describe('toggleWatch()', () => {
    it('adds new symbol', () => expect(toggleWatch(['BTC'],'ETH')).toEqual(['BTC','ETH']));
    it('removes existing symbol', () => expect(toggleWatch(['BTC','ETH'],'ETH')).toEqual(['BTC']));
    it('does not mutate original', () => { const orig=['BTC']; toggleWatch(orig,'ETH'); expect(orig).toEqual(['BTC']); });
});

// ═══════ PORTFOLIO ═══════
describe('calcPortfolioValue()', () => {
    it('calculates correctly', () => expect(calcPortfolioValue([{symbol:'BTC',quantity:2}],{BTC:50000})).toBe(100000));
    it('handles missing prices', () => expect(calcPortfolioValue([{symbol:'XYZ',quantity:5}],{})).toBe(0));
    it('empty holdings = 0', () => expect(calcPortfolioValue([],{BTC:50000})).toBe(0));
});

describe('calcDailyReturns()', () => {
    it('calculates returns', () => { const r=calcDailyReturns([100,110,105]); expect(r).toHaveLength(2); expect(r[0]).toBeCloseTo(0.1,5); });
    it('empty for single price', () => expect(calcDailyReturns([100])).toEqual([]));
    it('empty for null', () => expect(calcDailyReturns(null)).toEqual([]));
});
