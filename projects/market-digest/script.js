// Market Digest Application Logic

let lastRefreshTime = 0;
const REFRESH_COOLDOWN_MS = 60000; // 60 seconds
let countdownInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Update timestamp
    const updateTimeEl = document.getElementById('updateTime');
    const now = new Date();
    updateTimeEl.textContent = now.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });

    // 2. Initialize Charts & Data
    initializeDashboard();

    // 3. Setup Refresh Logic
    setupRefreshLogic();
});

function setupRefreshLogic() {
    const refreshBtn = document.getElementById('refreshBtn');
    const rateLimitMsg = document.getElementById('rateLimitMsg');
    const timeRemainingSpan = document.getElementById('timeRemaining');

    refreshBtn.addEventListener('click', async () => {
        const now = Date.now();
        if (now - lastRefreshTime < REFRESH_COOLDOWN_MS) {
            return; // Still in cooldown
        }

        // Trigger refresh
        refreshBtn.disabled = true;
        refreshBtn.style.opacity = '0.5';
        refreshBtn.textContent = '♻️ Refreshing...';
        rateLimitMsg.style.display = 'block';
        lastRefreshTime = Date.now();

        try {
            await initializeDashboard();
        } finally {
            refreshBtn.textContent = '♻️ Refresh Live Data';
            startCooldownTimer(timeRemainingSpan, refreshBtn, rateLimitMsg);
        }
    });
}

function startCooldownTimer(spanElement, btnElement, msgElement) {
    if (countdownInterval) clearInterval(countdownInterval);
    
    let secondsLeft = 60;
    spanElement.textContent = secondsLeft;

    countdownInterval = setInterval(() => {
        secondsLeft--;
        spanElement.textContent = secondsLeft;

        if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
            btnElement.disabled = false;
            btnElement.style.opacity = '1';
            msgElement.style.display = 'none';
        }
    }, 1000);
}

async function initializeDashboard() {
    try {
        const response = await fetch('./data.json');
        if (!response.ok) throw new Error('Data file not found');
        
        const dataJson = await response.json();
        
        if (dataJson.updatedAt) {
            document.getElementById('updateTime').textContent = new Date(dataJson.updatedAt).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }) + ' (Live)';
        }

        const marketData = dataJson.marketData;
        const macroData = dataJson.macroData;
        const newsData = dataJson.newsData;

        renderWatchLists(marketData, macroData);
        renderCharts(marketData, macroData);
        renderComparisonGrid(marketData, macroData);
        renderMyWatchlist(marketData, macroData);
        renderNews(newsData);
        renderSectors(marketData);
        renderTechnicalAnalysis(marketData, macroData);
        renderInvestmentSignals(marketData, macroData);
        renderPaperTrading(marketData, macroData);
        
    } catch (error) {
        console.error("Dashboard initialization failed.", error);
        document.getElementById('updateTime').textContent += " (Error loading live data)";
    }
}

function formatDelta(val) {
    if (val > 0) return `<span class="text-green-500">+${val.toFixed(2)}%</span>`;
    if (val < 0) return `<span class="text-red-500">${val.toFixed(2)}%</span>`;
    return `<span class="text-gray-400">0.00%</span>`;
}

function renderWatchLists(marketData, macroData) {
    // Entry/Exit unified mostly by Signals from backend
    const entryList = document.getElementById('entryWatchList');
    
    // Check signals across major indices
    let entryHtml = ``;
    if (marketData.regional.nifty.signal.includes("Buy")) {
        entryHtml += `<li>Nifty 50 showing <b>${marketData.regional.nifty.signal}</b> momentum</li>`;
    }
    if (marketData.global.nasdaq.signal.includes("Buy")) {
        entryHtml += `<li>Nasdaq showing <b>${marketData.global.nasdaq.signal}</b> momentum</li>`;
    }
    if (marketData.crypto.btc.signal.includes("Buy")) {
        entryHtml += `<li>Bitcoin showing <b>${marketData.crypto.btc.signal}</b> momentum</li>`;
    }
    if (macroData.crudeOil.current < 80) {
        entryHtml += `<li>Crude oil &lt; $80 &rarr; Positive macro cue</li>`;
    }
    if(entryHtml === '') entryHtml = '<li>Markets are sideways or bearish. Wait for clear signals.</li>';
    entryList.innerHTML = entryHtml;

    const exitList = document.getElementById('exitWatchList');
    let exitHtml = ``;
    if (marketData.regional.nifty.signal.includes("Sell")) {
        exitHtml += `<li>Nifty 50 showing <b>${marketData.regional.nifty.signal}</b> momentum</li>`;
    }
    if (marketData.regional.vix.current > 16) {
        exitHtml += `<li>India VIX elevated at <b>${marketData.regional.vix.current.toFixed(2)}</b> &rarr; High Volatility Risk</li>`;
    }
    if (marketData.crypto.btc.signal.includes("Sell")) {
        exitHtml += `<li>Bitcoin showing <b>${marketData.crypto.btc.signal}</b> momentum</li>`;
    }
    if(exitHtml === '') exitHtml = '<li>No major immediate exit warnings flagged. Maintain stop losses.</li>';
    exitList.innerHTML = exitHtml;

    // Economic
    const economicList = document.getElementById('economicContextList');
    economicList.innerHTML = `
        <li>USD/INR at ₹${macroData.usdInr.current.toFixed(2)} &rarr; ${macroData.usdInr.current > 83.5 ? "Weak Rupee pressure." : "Stable Rupee."}</li>
        <li>FII Flows (Week): ${marketData.fiiFlows.current < 0 ? 'Outflow ₹'+Math.abs(marketData.fiiFlows.current)+'Cr' : 'Inflow ₹'+marketData.fiiFlows.current+'Cr'}</li>
        <li>${macroData.inflation.expectation}</li>
    `;
}

function renderComparisonGrid(marketData, macroData) {
    const grid = document.getElementById('comparisonGrid');
    
    const groups = [
        { title: "Regional (India)", data: [
            { name: "Nifty 50", obj: marketData.regional.nifty, prefix: "" },
            { name: "Sensex", obj: marketData.regional.sensex, prefix: "" },
            { name: "India VIX", obj: marketData.regional.vix, prefix: "" }
        ]},
        { title: "Global (World)", data: [
            { name: "Nasdaq", obj: marketData.global.nasdaq, prefix: "" },
            { name: "Dow Jones", obj: marketData.global.dji, prefix: "" },
            { name: "Nikkei 225", obj: marketData.global.nikkei, prefix: "" }
        ]},
        { title: "Crypto", data: [
            { name: "Bitcoin", obj: marketData.crypto.btc, prefix: "$" },
            { name: "Ethereum", obj: marketData.crypto.eth, prefix: "$" },
            { name: "Solana", obj: marketData.crypto.sol, prefix: "$" }
        ]},
        { title: "Macro", data: [
            { name: "Crude Oil", obj: macroData.crudeOil, prefix: "$" },
            { name: "USD/INR", obj: macroData.usdInr, prefix: "₹" }
        ]}
    ];

    let html = `
        <div class="overflow-x-auto">
        <table class="w-full text-left" style="font-size: 0.9rem">
            <thead>
                <tr>
                    <th><span title="Watchlist">⭐</span></th>
                    <th>Asset</th>
                    <th>Price</th>
                    <th>1D</th>
                    <th>1W</th>
                    <th class="hidden-mobile">1M</th>
                    <th>RSI</th>
                    <th>MACD</th>
                    <th class="hidden-mobile">Pattern</th>
                    <th>Signal</th>
                </tr>
            </thead>
            <tbody>
    `;

    groups.forEach(group => {
        html += `<tr class="group-header"><td colspan="9"><strong>${group.title}</strong></td></tr>`;
        group.data.forEach(row => {
            let rsiText = '-';
            let macdText = '-';
            let patternText = '-';
            if (row.obj.rsi !== undefined) {
                rsiText = `<span class="${row.obj.rsi > 70 ? 'text-red-500' : (row.obj.rsi < 30 ? 'text-green-500' : 'text-gray-400')}">${row.obj.rsi}</span>`;
            }
            if (row.obj.macd && row.obj.macd.hist !== undefined) {
                macdText = `<span class="${row.obj.macd.hist > 0 ? 'text-green-500' : 'text-red-500'}">${row.obj.macd.hist}</span>`;
            }
            if (row.obj.pattern) {
                patternText = row.obj.pattern.pattern !== 'None' ? row.obj.pattern.pattern : '-';
                if(patternText !== '-' && patternText !== 'Consolidation') {
                    patternText = `<span title="Target: ${row.obj.pattern.target}, Stop: ${row.obj.pattern.stop_loss}" style="border-bottom: 1px dotted #888; cursor:help;">${patternText}</span>`;
                }
            }
            let isWatched = getWatchedAssets().includes(row.name);
            let starHtml = `<button onclick="toggleWatch('${row.name}')" style="background:none;border:none;cursor:pointer;color: ${isWatched ? '#f59e0b' : '#444'};">★</button>`;
            html += `
                <tr>
                    <td>${starHtml}</td>
                    <td>${row.name}</td>
                    <td>${row.prefix}${row.obj.current.toFixed(2)}</td>
                    <td>${formatDelta(row.obj.delta_1d)}</td>
                    <td>${formatDelta(row.obj.delta_1w)}</td>
                    <td class="hidden-mobile">${formatDelta(row.obj.delta_1m)}</td>
                    <td>${rsiText}</td>
                    <td>${macdText}</td>
                    <td class="hidden-mobile">${patternText}</td>
                    <td><span class="signal-badge ${row.obj.signal.toLowerCase().replace(' ', '-')}">${row.obj.signal}</span></td>
                </tr>
            `;
        });
    });

    html += `</tbody></table></div>`;
    grid.innerHTML = html;
}

function getWatchedAssets() {
    return JSON.parse(localStorage.getItem('md_watchlist') || '[]');
}

function toggleWatch(assetName) {
    let w = getWatchedAssets();
    if (w.includes(assetName)) {
        w = w.filter(x => x !== assetName);
    } else {
        w.push(assetName);
    }
    localStorage.setItem('md_watchlist', JSON.stringify(w));
    // Quick re-render logic via full page reload for simplicity, or re-init dashboard
    initializeDashboard();
}

function renderMyWatchlist(marketData, macroData) {
    const w = getWatchedAssets();
    const section = document.getElementById('watchlist-section');
    const grid = document.getElementById('watchlistGrid');
    
    if (w.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    
    // Flat dataset
    const allData = [
        ...Object.values(marketData.regional).map(x => ({...x, parent:'regional'})),
        ...Object.values(marketData.global).map(x => ({...x, parent:'global'})),
        ...Object.values(marketData.crypto).map(x => ({...x, parent:'crypto', prefix: '$'})),
        {...macroData.crudeOil, name: 'Crude Oil', prefix: '$'},
        {...macroData.usdInr, name: 'USD/INR', prefix: '₹'}
    ];
    // Map objects by matching names (Nifty 50, Bitcoin, etc - matching titles in renderComparisonGrid)
    // Actually, getting exact names is mapped inside renderComparisonGrid, let's replicate mapping
    const mapping = [
        { name: "Nifty 50", obj: marketData.regional.nifty, prefix: "" },
        { name: "Sensex", obj: marketData.regional.sensex, prefix: "" },
        { name: "India VIX", obj: marketData.regional.vix, prefix: "" },
        { name: "Nasdaq", obj: marketData.global.nasdaq, prefix: "" },
        { name: "Dow Jones", obj: marketData.global.dji, prefix: "" },
        { name: "Nikkei 225", obj: marketData.global.nikkei, prefix: "" },
        { name: "Bitcoin", obj: marketData.crypto.btc, prefix: "$" },
        { name: "Ethereum", obj: marketData.crypto.eth, prefix: "$" },
        { name: "Solana", obj: marketData.crypto.sol, prefix: "$" },
        { name: "Crude Oil", obj: macroData.crudeOil, prefix: "$" },
        { name: "USD/INR", obj: macroData.usdInr, prefix: "₹" }
    ];
    
    let html = `
        <div class="overflow-x-auto">
        <table class="w-full text-left" style="font-size: 0.9rem">
            <thead>
                <tr>
                    <th><span title="Watchlist">⭐</span></th>
                    <th>Asset</th>
                    <th>Price</th>
                    <th>1D</th>
                    <th>1W</th>
                    <th class="hidden-mobile">1M</th>
                    <th>Signal</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    w.forEach(assetName => {
        const row = mapping.find(m => m.name === assetName);
        if(!row) return;
        html += `
            <tr>
                <td><button onclick="toggleWatch('${row.name}')" style="background:none;border:none;cursor:pointer;color: #f59e0b;">★</button></td>
                <td>${row.name}</td>
                <td>${row.prefix}${row.obj.current.toFixed(2)}</td>
                <td>${formatDelta(row.obj.delta_1d)}</td>
                <td>${formatDelta(row.obj.delta_1w)}</td>
                <td class="hidden-mobile">${formatDelta(row.obj.delta_1m)}</td>
                <td><span class="signal-badge ${row.obj.signal.toLowerCase().replace(' ', '-')}">${row.obj.signal}</span></td>
            </tr>
        `;
    });
    
    html += `</tbody></table></div>`;
    grid.innerHTML = html;
}

function renderNews(newsData) {
    const newsContainer = document.getElementById('newsContainer');
    newsContainer.innerHTML = '';
    
    newsData.forEach(news => {
        const item = document.createElement('div');
        item.className = 'news-item';
        // highlight world vs regional based on source loosely
        const badgeClass = news.source.includes("World") ? "badge-global" : "badge-regional";
        item.innerHTML = `
            <span class="news-source ${badgeClass}">${news.source}</span>
            <p>&ldquo;<a href="${news.link}" target="_blank" class="hover:text-amber-400">${news.title}</a>&rdquo;</p>
            <span class="news-time">${news.time}</span>
        `;
        newsContainer.appendChild(item);
    });
}

function renderSectors(marketData) {
     const sectorList = document.getElementById('sectorInsightsList');
     sectorList.innerHTML = '';
     Object.entries(marketData.sectors).forEach(([sector, data]) => {
         sectorList.innerHTML += `<li>${sector}: ${data.change > 0 ? '+' : ''}${data.change}% &rarr; ${data.bias}</li>`;
     });
}

function renderCharts(marketData, macroData) {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";
    const gridColor = 'rgba(255, 255, 255, 0.05)';

    const labels30d = Array.from({length: 30}, (_, i) => `Day ${i + 1}`);

    // 1. Regional + Global Dual Chart 
    new Chart(document.getElementById('niftyVixChart'), {
        type: 'line',
        data: {
            labels: labels30d,
            datasets: [
                {
                    label: 'Nifty 50',
                    data: marketData.regional.nifty.history_30d,
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y',
                    pointRadius: 0
                },
                {
                    label: 'Nasdaq',
                    data: marketData.global.nasdaq.history_30d,
                    borderColor: '#10b981',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y1',
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: { grid: { display: false }, ticks: { display: false } },
                y: { type: 'linear', display: true, position: 'left', grid: { color: gridColor } },
                y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } },
            }
        }
    });

    // 2. Crypto Chart
    new Chart(document.getElementById('flowsChart'), {
        type: 'line',
        data: {
            labels: labels30d,
            datasets: [
                {
                    label: 'Bitcoin ($)',
                    data: marketData.crypto.btc.history_30d,
                    borderColor: '#f59e0b',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y',
                    pointRadius: 0
                },
                {
                    label: 'Ethereum ($)',
                    data: marketData.crypto.eth.history_30d,
                    borderColor: '#8b5cf6',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y1',
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false }, ticks: { display: false } },
                y: { type: 'linear', display: true, position: 'left', grid: { color: gridColor } },
                y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } }
            }
        }
    });
}

// ─── Technical Analysis ───
function renderTechnicalAnalysis(marketData, macroData) {
    // RSI Gauge for Nifty
    const rsiVal = marketData.regional.nifty.rsi || 50;
    renderRSIGauge(rsiVal);
    
    // MACD Histogram
    const macdData = marketData.regional.nifty.macd;
    renderMACDChart(macdData, marketData.regional.nifty.history_30d);
    
    // Support / Resistance
    renderSupportResistance(marketData.regional.nifty);
}

function renderRSIGauge(rsi) {
    const canvas = document.getElementById('rsiGauge');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H - 10;
    const radius = Math.min(W, H) - 20;
    
    ctx.clearRect(0, 0, W, H);
    
    // Background arc
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;
    
    // Zones: oversold (0-30 green), neutral (30-70 gray), overbought (70-100 red)
    const zones = [
        { start: 0, end: 0.3, color: '#22c55e' },
        { start: 0.3, end: 0.7, color: '#64748b' },
        { start: 0.7, end: 1.0, color: '#ef4444' }
    ];
    
    zones.forEach(z => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.7, startAngle + z.start * Math.PI, startAngle + z.end * Math.PI);
        ctx.lineWidth = 14;
        ctx.strokeStyle = z.color + '40';
        ctx.stroke();
    });
    
    // Value needle
    const needleAngle = startAngle + (rsi / 100) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(needleAngle) * radius * 0.6, cy + Math.sin(needleAngle) * radius * 0.6);
    ctx.lineWidth = 3;
    ctx.strokeStyle = rsi > 70 ? '#ef4444' : rsi < 30 ? '#22c55e' : '#f59e0b';
    ctx.stroke();
    
    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    
    // Labels
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText('0', cx - radius * 0.7, cy + 14);
    ctx.textAlign = 'right';
    ctx.fillText('100', cx + radius * 0.7, cy + 14);
    ctx.textAlign = 'center';
    ctx.fillText('50', cx, cy - radius * 0.55);
    
    const rsiEl = document.getElementById('rsiValue');
    if (rsiEl) {
        const zone = rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral';
        const color = rsi > 70 ? '#ef4444' : rsi < 30 ? '#22c55e' : '#f59e0b';
        rsiEl.innerHTML = `<span style="color:${color};font-weight:700;font-size:1.2rem">${rsi}</span> <span class="text-muted" style="font-size:0.8rem">${zone}</span>`;
    }
}

function renderMACDChart(macdData, history) {
    const canvas = document.getElementById('macdChart');
    if (!canvas || !macdData) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    
    // Generate synthetic MACD histogram from history
    const hist = [];
    if (history && history.length >= 26) {
        for (let i = 12; i < history.length; i++) {
            const ema12 = history.slice(i - 12, i).reduce((a, b) => a + b) / 12;
            const ema26 = history.slice(Math.max(0, i - 26), i).reduce((a, b) => a + b) / Math.min(i, 26);
            hist.push(ema12 - ema26);
        }
    } else {
        // Fallback: use macd hist value to generate
        for (let i = 0; i < 18; i++) {
            hist.push((macdData.hist || 0) * (Math.sin(i * 0.4) + Math.random() * 0.5 - 0.25));
        }
    }
    
    const maxAbs = Math.max(...hist.map(Math.abs), 1);
    const barW = Math.max(2, (W - 20) / hist.length - 1);
    const midY = H / 2;
    
    // Zero line
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.moveTo(10, midY); ctx.lineTo(W - 10, midY); ctx.stroke();
    
    hist.forEach((v, i) => {
        const x = 10 + i * (barW + 1);
        const barH = (v / maxAbs) * (midY - 10);
        ctx.fillStyle = v >= 0 ? '#22c55e' : '#ef4444';
        ctx.fillRect(x, midY - (v >= 0 ? barH : 0), barW, Math.abs(barH));
    });
    
    const signalEl = document.getElementById('macdSignal');
    if (signalEl && macdData) {
        const trend = macdData.hist > 0 ? 'Bullish' : 'Bearish';
        const color = macdData.hist > 0 ? '#22c55e' : '#ef4444';
        signalEl.innerHTML = `<span style="color:${color};font-weight:700">${trend}</span> <span class="text-muted" style="font-size:0.8rem">Hist: ${macdData.hist}</span>`;
    }
}

function renderSupportResistance(assetData) {
    const el = document.getElementById('supportResistance');
    if (!el || !assetData.history_30d) return;
    
    const prices = assetData.history_30d;
    const support = Math.min(...prices);
    const resistance = Math.max(...prices);
    const current = assetData.current;
    const pctToSupport = ((current - support) / current * 100).toFixed(1);
    const pctToResist = ((resistance - current) / current * 100).toFixed(1);
    
    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;gap:1rem;flex-wrap:wrap;">
            <div><span class="text-muted">Support (30d):</span> <strong style="color:#22c55e">${support.toFixed(0)}</strong> <span class="text-muted">(${pctToSupport}% below)</span></div>
            <div><span class="text-muted">Current:</span> <strong>${current.toFixed(0)}</strong></div>
            <div><span class="text-muted">Resistance (30d):</span> <strong style="color:#ef4444">${resistance.toFixed(0)}</strong> <span class="text-muted">(${pctToResist}% above)</span></div>
        </div>
    `;
}

// ─── Investment Signals Aggregator ───
function renderInvestmentSignals(marketData, macroData) {
    const container = document.getElementById('signalCards');
    if (!container) return;
    
    const assets = [
        { name: 'Nifty 50', obj: marketData.regional.nifty, prefix: '' },
        { name: 'Nasdaq', obj: marketData.global.nasdaq, prefix: '' },
        { name: 'Bitcoin', obj: marketData.crypto.btc, prefix: '$' },
        { name: 'Ethereum', obj: marketData.crypto.eth, prefix: '$' }
    ];
    
    container.innerHTML = assets.map(asset => {
        const { signal, confidence, reasoning } = computeSignal(asset.obj, macroData);
        const colorMap = { 'Strong Buy': '#22c55e', 'Buy': '#86efac', 'Hold': '#f59e0b', 'Sell': '#fca5a5', 'Strong Sell': '#ef4444' };
        const color = colorMap[signal] || '#64748b';
        
        return `
            <div class="signal-card" style="border-left:3px solid ${color};">
                <div class="signal-header">
                    <strong>${asset.name}</strong>
                    <span class="signal-badge" style="background:${color}20;color:${color};border:1px solid ${color}40;">${signal}</span>
                </div>
                <div class="signal-confidence">
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width:${confidence}%;background:${color};"></div>
                    </div>
                    <span class="text-muted" style="font-size:0.75rem">${confidence}% confidence</span>
                </div>
                <div class="signal-reasoning text-muted" style="font-size:0.8rem;margin-top:0.3rem;">${reasoning}</div>
            </div>
        `;
    }).join('');
}

function computeSignal(assetObj, macroData) {
    let score = 0;
    const reasons = [];
    
    // RSI (25%)
    if (assetObj.rsi !== undefined) {
        if (assetObj.rsi < 30) { score += 25; reasons.push('RSI oversold'); }
        else if (assetObj.rsi < 45) { score += 15; reasons.push('RSI low-neutral'); }
        else if (assetObj.rsi > 70) { score -= 25; reasons.push('RSI overbought'); }
        else if (assetObj.rsi > 55) { score -= 10; reasons.push('RSI high-neutral'); }
        else { score += 5; }
    }
    
    // MACD (25%)
    if (assetObj.macd && assetObj.macd.hist !== undefined) {
        if (assetObj.macd.hist > 0) { score += 20; reasons.push('MACD bullish'); }
        else { score -= 20; reasons.push('MACD bearish'); }
    }
    
    // Pattern (20%)
    if (assetObj.pattern && assetObj.pattern.pattern !== 'None' && assetObj.pattern.pattern !== 'Consolidation') {
        if (assetObj.signal.includes('Buy')) { score += 15; }
        else { score -= 15; }
        reasons.push(`Pattern: ${assetObj.pattern.pattern}`);
    }
    
    // Momentum - delta (15%)
    if (assetObj.delta_1w > 2) { score += 12; reasons.push('Strong weekly momentum'); }
    else if (assetObj.delta_1w < -2) { score -= 12; reasons.push('Weak weekly momentum'); }
    
    // Signal text (15%)
    if (assetObj.signal.includes('Strong Buy')) { score += 15; }
    else if (assetObj.signal.includes('Buy')) { score += 10; }
    else if (assetObj.signal.includes('Strong Sell')) { score -= 15; }
    else if (assetObj.signal.includes('Sell')) { score -= 10; }
    
    const confidence = Math.min(95, Math.max(15, 50 + score));
    let signal;
    if (score >= 40) signal = 'Strong Buy';
    else if (score >= 15) signal = 'Buy';
    else if (score <= -40) signal = 'Strong Sell';
    else if (score <= -15) signal = 'Sell';
    else signal = 'Hold';
    
    return { signal, confidence, reasoning: reasons.join(' • ') || 'Insufficient data' };
}

// ─── Paper Trading (merged from stock-simulator) ───
const PT_STORAGE_KEY = 'md_paper_trading';
const PT_INITIAL_CASH = 10000;

function getPTState() {
    const saved = localStorage.getItem(PT_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return { cash: PT_INITIAL_CASH, positions: {}, history: [], portfolioHistory: [PT_INITIAL_CASH] };
}

function savePTState(state) {
    localStorage.setItem(PT_STORAGE_KEY, JSON.stringify(state));
}

function renderPaperTrading(marketData, macroData) {
    const state = getPTState();
    const mapping = [
        { name: 'Nifty 50', obj: marketData.regional.nifty, prefix: '' },
        { name: 'Sensex', obj: marketData.regional.sensex, prefix: '' },
        { name: 'Nasdaq', obj: marketData.global.nasdaq, prefix: '' },
        { name: 'Bitcoin', obj: marketData.crypto.btc, prefix: '$' },
        { name: 'Ethereum', obj: marketData.crypto.eth, prefix: '$' },
        { name: 'Solana', obj: marketData.crypto.sol, prefix: '$' }
    ];
    
    // Calculate holdings
    let holdingsValue = 0;
    Object.entries(state.positions).forEach(([name, pos]) => {
        const asset = mapping.find(m => m.name === name);
        if (asset) holdingsValue += pos.qty * asset.obj.current;
    });
    
    const total = state.cash + holdingsValue;
    const pnl = total - PT_INITIAL_CASH;
    const pnlPct = (pnl / PT_INITIAL_CASH * 100).toFixed(2);
    
    document.getElementById('ptCash').textContent = '$' + state.cash.toFixed(2);
    document.getElementById('ptHoldings').textContent = '$' + holdingsValue.toFixed(2);
    document.getElementById('ptTotal').textContent = '$' + total.toFixed(2);
    document.getElementById('ptTotal').style.color = total >= PT_INITIAL_CASH ? '#22c55e' : '#ef4444';
    document.getElementById('ptPnl').innerHTML = `<span style="color:${pnl >= 0 ? '#22c55e' : '#ef4444'}">$${pnl.toFixed(2)} (${pnl >= 0 ? '+' : ''}${pnlPct}%)</span>`;
    
    // Track portfolio history
    if (state.portfolioHistory[state.portfolioHistory.length - 1] !== total) {
        state.portfolioHistory.push(total);
        if (state.portfolioHistory.length > 30) state.portfolioHistory.shift();
        savePTState(state);
    }
    
    // Positions table
    const posEl = document.getElementById('ptPositions');
    if (posEl) {
        let posHtml = '<table style="width:100%;font-size:0.85rem;"><thead><tr><th style="text-align:left;">Asset</th><th>Qty</th><th>Avg Cost</th><th>Current</th><th>P&L</th><th></th></tr></thead><tbody>';
        
        mapping.forEach(m => {
            const pos = state.positions[m.name];
            const isWatched = getWatchedAssets().includes(m.name);
            if (pos && pos.qty > 0) {
                const curVal = pos.qty * m.obj.current;
                const costVal = pos.qty * pos.avgCost;
                const posPnl = curVal - costVal;
                posHtml += `<tr>
                    <td><strong>${m.name}</strong></td>
                    <td style="text-align:center;">${pos.qty}</td>
                    <td style="text-align:center;">${m.prefix}${pos.avgCost.toFixed(2)}</td>
                    <td style="text-align:center;">${m.prefix}${m.obj.current.toFixed(2)}</td>
                    <td style="text-align:center;color:${posPnl >= 0 ? '#22c55e' : '#ef4444'};">${posPnl >= 0 ? '+' : ''}$${posPnl.toFixed(2)}</td>
                    <td><button class="btn-sm-sell" onclick="paperTradeSell('${m.name}')">Sell</button></td>
                </tr>`;
            }
            // Show buy button for all assets
            posHtml += `<tr style="opacity:${pos && pos.qty > 0 ? '0.5' : '1'};"><td colspan="5" style="padding:2px 0;"><small class="text-muted">${m.name} @ ${m.prefix}${m.obj.current.toFixed(2)}</small></td><td><button class="btn-sm-buy" onclick="paperTradeBuy('${m.name}', ${m.obj.current})">Buy 1</button></td></tr>`;
        });
        
        posHtml += '</tbody></table>';
        posEl.innerHTML = posHtml;
    }
    
    // Trade history
    const histEl = document.getElementById('tradeHistory');
    if (histEl) {
        if (state.history.length === 0) {
            histEl.innerHTML = '<div class="text-muted" style="text-align:center;">No trades yet</div>';
        } else {
            histEl.innerHTML = state.history.slice(-20).reverse().map(t => 
                `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.8rem;">
                    <span style="color:${t.type === 'BUY' ? '#22c55e' : '#ef4444'}">${t.type}</span>
                    <span>${t.asset}</span>
                    <span class="text-muted">@ $${t.price.toFixed(2)}</span>
                    <span class="text-muted">${t.time}</span>
                </div>`
            ).join('');
        }
    }
    
    // Portfolio chart
    renderPortfolioChart(state.portfolioHistory);
}

let portfolioChartInstance = null;
function renderPortfolioChart(historyData) {
    const canvas = document.getElementById('portfolioChart');
    if (!canvas || typeof Chart === 'undefined') return;
    if (portfolioChartInstance) portfolioChartInstance.destroy();
    
    portfolioChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: historyData.map((_, i) => ''),
            datasets: [{
                label: 'Portfolio Value',
                data: historyData,
                borderColor: historyData[historyData.length - 1] >= PT_INITIAL_CASH ? '#22c55e' : '#ef4444',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                fill: true,
                backgroundColor: (historyData[historyData.length - 1] >= PT_INITIAL_CASH ? 'rgba(34,197,94,' : 'rgba(239,68,68,') + '0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { display: true, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { callback: v => '$' + v.toLocaleString(), font: { size: 10 } } }
            }
        }
    });
}

// Global functions for paper trading buttons
window.paperTradeBuy = function(assetName, price) {
    const state = getPTState();
    if (!price) return;
    if (state.cash < price) { alert('Insufficient cash'); return; }
    
    state.cash -= price;
    if (!state.positions[assetName]) state.positions[assetName] = { qty: 0, avgCost: 0 };
    const pos = state.positions[assetName];
    pos.avgCost = (pos.avgCost * pos.qty + price) / (pos.qty + 1);
    pos.qty += 1;
    state.history.push({ type: 'BUY', asset: assetName, price, time: new Date().toLocaleString() });
    savePTState(state);
    initializeDashboard();
};

window.paperTradeSell = function(assetName) {
    const state = getPTState();
    const pos = state.positions[assetName];
    if (!pos || pos.qty <= 0) return;
    
    // We need current price - re-fetch from last known data
    const priceText = document.querySelector(`#ptPositions td:nth-child(4)`)?.textContent;
    // Better: fetch from stored mapping - just use avgCost as fallback
    // Actually, the sell button is generated with the current price context
    // Let's read from the comparison grid instead
    let price = pos.avgCost;
    document.querySelectorAll('#comparisonGrid tr').forEach(row => {
        const nameCell = row.querySelector('td:nth-child(2)');
        const priceCell = row.querySelector('td:nth-child(3)');
        if (nameCell && nameCell.textContent.trim() === assetName && priceCell) {
            price = parseFloat(priceCell.textContent.replace(/[^0-9.-]/g, '')) || pos.avgCost;
        }
    });
    
    state.cash += price;
    pos.qty -= 1;
    state.history.push({ type: 'SELL', asset: assetName, price, time: new Date().toLocaleString() });
    if (pos.qty <= 0) delete state.positions[assetName];
    savePTState(state);
    initializeDashboard();
};

window.resetPaperTrading = function() {
    localStorage.removeItem(PT_STORAGE_KEY);
    initializeDashboard();
};

