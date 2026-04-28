/* Market Digest Utilities — Pure Functions Module */

export function formatDelta(val) {
    if (val === null || val === undefined || isNaN(val)) return '--';
    const sign = val >= 0 ? '+' : '';
    return sign + val.toFixed(2) + '%';
}

export function formatPrice(price, currency = 'USD') {
    if (price === null || price === undefined || isNaN(price)) return '--';
    if (price >= 1) return price.toLocaleString('en-US', { style:'currency', currency, minimumFractionDigits:2 });
    return '$' + price.toPrecision(4);
}

export function formatMarketCap(val) {
    if (!val || isNaN(val)) return '--';
    if (val >= 1e12) return '$' + (val/1e12).toFixed(2) + 'T';
    if (val >= 1e9) return '$' + (val/1e9).toFixed(2) + 'B';
    if (val >= 1e6) return '$' + (val/1e6).toFixed(2) + 'M';
    return '$' + val.toLocaleString();
}

export function computeSignal(price, sma20, sma50, rsi, delta) {
    let score = 0;
    if (price > sma20) score += 1; else score -= 1;
    if (price > sma50) score += 1; else score -= 1;
    if (rsi < 30) score += 2;
    else if (rsi > 70) score -= 2;
    if (delta > 0) score += 1; else if (delta < -2) score -= 1;
    if (score >= 3) return { signal: 'Strong Buy', color: '#22c55e', icon: '🟢' };
    if (score >= 1) return { signal: 'Buy', color: '#4ade80', icon: '🟢' };
    if (score <= -3) return { signal: 'Strong Sell', color: '#ef4444', icon: '🔴' };
    if (score <= -1) return { signal: 'Sell', color: '#f97316', icon: '🟠' };
    return { signal: 'Hold', color: '#fbbf24', icon: '🟡' };
}

export function calcSMA(data, period) {
    if (!data || data.length < period) return null;
    const slice = data.slice(-period);
    return slice.reduce((s, v) => s + v, 0) / period;
}

export function calcEMA(data, period) {
    if (!data || data.length < period) return null;
    const k = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((s, v) => s + v, 0) / period;
    for (let i = period; i < data.length; i++) {
        ema = data[i] * k + ema * (1 - k);
    }
    return ema;
}

export function calcRSI(data, period = 14) {
    if (!data || data.length < period + 1) return null;
    let gains = 0, losses = 0;
    for (let i = data.length - period; i < data.length; i++) {
        const diff = data[i] - data[i - 1];
        if (diff >= 0) gains += diff; else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

export function calcBollingerBands(data, period = 20, multiplier = 2) {
    if (!data || data.length < period) return null;
    const slice = data.slice(-period);
    const sma = slice.reduce((s, v) => s + v, 0) / period;
    const variance = slice.reduce((s, v) => s + (v - sma) ** 2, 0) / period;
    const stddev = Math.sqrt(variance);
    return { upper: sma + multiplier * stddev, middle: sma, lower: sma - multiplier * stddev, stddev };
}

export function calcMACD(data, fast = 12, slow = 26, signal = 9) {
    if (!data || data.length < slow + signal) return null;
    const emaFast = calcEMA(data, fast);
    const emaSlow = calcEMA(data, slow);
    if (emaFast === null || emaSlow === null) return null;
    const macdLine = emaFast - emaSlow;
    return { macd: macdLine, histogram: macdLine /* simplified */ };
}

export function calcSharpeRatio(returns, riskFreeRate = 0.04) {
    if (!returns || returns.length < 2) return null;
    const mean = returns.reduce((s, v) => s + v, 0) / returns.length;
    const excess = mean - riskFreeRate / 252;
    const std = Math.sqrt(returns.reduce((s, v) => s + (v - mean) ** 2, 0) / (returns.length - 1));
    if (std === 0) return null;
    return (excess / std) * Math.sqrt(252); // Annualized
}

export function calcMaxDrawdown(prices) {
    if (!prices || prices.length < 2) return 0;
    let peak = prices[0], maxDd = 0;
    for (const p of prices) {
        if (p > peak) peak = p;
        const dd = (peak - p) / peak;
        if (dd > maxDd) maxDd = dd;
    }
    return maxDd;
}

export function calcCorrelation(x, y) {
    if (!x || !y || x.length !== y.length || x.length < 2) return null;
    const n = x.length;
    const mx = x.reduce((s, v) => s + v, 0) / n;
    const my = y.reduce((s, v) => s + v, 0) / n;
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) {
        num += (x[i] - mx) * (y[i] - my);
        dx += (x[i] - mx) ** 2;
        dy += (y[i] - my) ** 2;
    }
    const denom = Math.sqrt(dx * dy);
    return denom === 0 ? 0 : num / denom;
}

export function getWatchedAssets(storage) {
    try { return JSON.parse(storage || '[]'); } catch { return []; }
}

export function toggleWatch(current, symbol) {
    const list = [...current];
    const idx = list.indexOf(symbol);
    if (idx >= 0) list.splice(idx, 1); else list.push(symbol);
    return list;
}

export function calcPortfolioValue(holdings, prices) {
    return holdings.reduce((total, h) => total + (h.quantity * (prices[h.symbol] || 0)), 0);
}

export function calcDailyReturns(prices) {
    if (!prices || prices.length < 2) return [];
    return prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
}
