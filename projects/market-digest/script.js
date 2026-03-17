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
        renderNews(newsData);
        renderSectors(marketData);
        
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
                    <th>Asset</th>
                    <th>Price</th>
                    <th>1D</th>
                    <th>1W</th>
                    <th>1M</th>
                    <th class="hidden-mobile">3M</th>
                    <th class="hidden-mobile">6M</th>
                    <th class="hidden-mobile">1Y</th>
                    <th>Signal</th>
                </tr>
            </thead>
            <tbody>
    `;

    groups.forEach(group => {
        html += `<tr class="group-header"><td colspan="9"><strong>${group.title}</strong></td></tr>`;
        group.data.forEach(row => {
            html += `
                <tr>
                    <td>${row.name}</td>
                    <td>${row.prefix}${row.obj.current.toFixed(2)}</td>
                    <td>${formatDelta(row.obj.delta_1d)}</td>
                    <td>${formatDelta(row.obj.delta_1w)}</td>
                    <td>${formatDelta(row.obj.delta_1m)}</td>
                    <td class="hidden-mobile">${formatDelta(row.obj.delta_3m)}</td>
                    <td class="hidden-mobile">${formatDelta(row.obj.delta_6m)}</td>
                    <td class="hidden-mobile">${formatDelta(row.obj.delta_1y)}</td>
                    <td><span class="signal-badge ${row.obj.signal.toLowerCase().replace(' ', '-')}">${row.obj.signal}</span></td>
                </tr>
            `;
        });
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
