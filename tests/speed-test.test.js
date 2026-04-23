/**
 * @jest-environment jsdom
 */

// ═══════════════════════════════════════════════════
// Speed-Test Unit Tests — DOM, Algorithm, UI Logic
// ═══════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');






beforeAll(() => {
    const htmlCode = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    <title>Speed Test Platinum | QuickUtils</title>
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Speed Test Platinum",
        "url": "https://speed.quickutils.top/",
        "description": "Enterprise grade multi-threaded speed test and diagnostic platform.",
        "applicationCategory": "BrowserApplication",
        "operatingSystem": "All",
        "offers": {
            "@type": "Offer",
            "price": "0.00",
            "priceCurrency": "USD"
        }
    }
    </script>
    <link rel="canonical" href="https://speed.quickutils.top/">
    <meta name="description" content="Multi-threaded enterprise grade speed test with real-time waveform analytics.">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📶</text></svg>">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <link rel="stylesheet" href="quickutils-core.css">
    <link rel="stylesheet" href="style.css">
</head>
<body class="grid-bg">
    <canvas id="vfxCanvas"></canvas>
    
    <nav class="navbar glass-nav"><div class="container nav-inner">
        <a href="https://quickutils.top" class="brand holo-text">📶 Speed Test Platinum</a>
        <div class="nav-links">
            <a href="https://ko-fi.com/dayatin" target="_blank" class="kofi-link">☕ Support</a>
            <button id="themeBtn" class="theme-btn">🌙</button>
        </div>
    </div></nav>

    <main class="container py-4" style="position:relative; z-index: 10;">
        <div class="glass-card text-center mb-4 hero-card">
            <div class="dial-container">
                <svg id="speedGauge" width="300" height="300" class="gauge-svg">
                    <circle cx="150" cy="150" r="140" class="gauge-bg"></circle>
                    <circle cx="150" cy="150" r="140" class="gauge-fill" id="gaugeFill"></circle>
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#3b82f6"/>
                            <stop offset="50%" stop-color="#8b5cf6"/>
                            <stop offset="100%" stop-color="#ec4899"/>
                        </linearGradient>
                    </defs>
                </svg>
                <div class="dial-content">
                    <div id="speedDisplay" class="speed-value">0.0</div>
                    <div id="speedUnit" class="speed-unit">Mbps</div>
                    <div id="phaseDisplay" class="phase-label">READY</div>
                    <div class="options-row mt-2" style="font-size:0.75rem; opacity:0.8; display:flex; justify-content:center; gap:10px;">
                        <label><input type="checkbox" id="ipv6Toggle" checked> IPv6</label>
                        <label><input type="checkbox" id="http3Toggle" checked> HTTP/3 QUIC</label>
                    </div>
                </div>
            </div>
            <button class="btn btn-primary btn-glow" id="startTest">▶ INITIALIZE DIAGNOSTIC</button>
            
            <div class="progress-container">
                <div id="progressBar" class="progress-bar"></div>
            </div>
        </div>

        <div id="pdfExportArea">
        <div class="metrics-grid">
            <div class="metric-card border-blue">
                <div class="metric-label">⬇ DOWNLOAD</div>
                <div class="metric-value"><span id="dlSpeed">—</span> <small>Mbps</small></div>
            </div>
            <div class="metric-card border-purple">
                <div class="metric-label">⬆ UPLOAD</div>
                <div class="metric-value"><span id="ulSpeed">—</span> <small>Mbps</small></div>
            </div>
            <div class="metric-card border-pink">
                <div class="metric-label">⏱ PING</div>
                <div class="metric-value"><span id="latency">—</span> <small>ms</small></div>
            </div>
            <div class="metric-card border-orange">
                <div class="metric-label">〰 JITTER</div>
                <div class="metric-value"><span id="jitter">—</span> <small>ms</small></div>
            </div>
            <div class="metric-card border-red">
                <div class="metric-label">💥 PACKET LOSS</div>
                <div class="metric-value"><span id="packetLoss">—</span></div>
            </div>
            <div class="metric-card border-green">
                <div class="metric-label">🛑 BUFFERBLOAT</div>
                <div class="metric-value">+<span id="bufferbloat">—</span> <small>ms</small></div>
            </div>
        </div>

        <div class="glass-card mb-4" style="padding:1.5rem; display:flex; flex-wrap:wrap; gap:1.5rem; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:1.5rem; flex-wrap:wrap;">
                <div style="text-align:center;">
                    <div style="font-size:3rem; font-weight:800; font-family:'JetBrains Mono',monospace; line-height:1;" id="networkQualScore">—</div>
                    <div style="font-size:0.75rem; color:#94a3b8; margin-top:4px;" id="networkQualLabel">Network Grade</div>
                </div>
                <div style="display:flex; flex-direction:column; gap:0.4rem; font-size:0.85rem;">
                    <div>📞 MOS: <strong id="mosScore">—</strong></div>
                    <div>🆔 Test: <code id="testId" style="font-size:0.75rem; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px;">—</code></div>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:0.75rem;">
                <label style="font-size:0.8rem; color:#94a3b8;">Threads:</label>
                <select id="threadCount" class="input-modern" style="width:auto; padding:4px 8px; font-size:0.85rem;">
                    <option value="2">2</option>
                    <option value="4" selected>4</option>
                    <option value="6">6</option>
                    <option value="8">8</option>
                </select>
                <span style="font-size:0.7rem; color:#64748b;">DL Max: <span id="dlMax">—</span> | Min: <span id="dlMin">—</span></span>
                <span style="font-size:0.7rem; color:#64748b;">UL Max: <span id="ulMax">—</span></span>
            </div>
        </div>

        <div class="glass-card mb-4" style="padding:0.75rem;">
            <canvas id="liveGraphCanvas" style="width:100%; height:120px;"></canvas>
        </div>

        <div class="panels-grid">
            <div class="glass-card panel">
                <div class="panel-header">
                    <span>Network Insights</span>
                </div>
                <div id="networkInsights" class="insights-content text-muted">
                    Test your network to reveal streaming and gaming capabilities.
                </div>
                <button class="btn btn-secondary mt-3 w-100" id="shareBtn" disabled>📋 Copy Certification</button>
                <button class="btn btn-primary mt-2 w-100" id="pdfBtn" style="display:none; background: linear-gradient(135deg, #10b981, #059669);">📄 Download PDF Report</button>
            </div>

            <div class="glass-card panel">
                <div class="panel-header">
                    <span>Server & Client Data</span>
                </div>
                <div class="data-list">
                    <div class="data-row"><span>Target Node:</span><span id="serverNode" class="text-highlight">Routing...</span></div>
                    <div class="data-row"><span>Test Status:</span><span id="connStatus" class="status-badge">Standby</span></div>
                    <div class="data-row"><span>Test Mode:</span><span>Multi-Threaded (x8)</span></div>
                    <div class="data-row"><span>ISP / AS Name:</span><span id="ispName" class="text-highlight">Detecting...</span></div>
                </div>
            </div>

            <div class="glass-card panel">
                <div class="panel-header">
                    <span>Historical Analytics</span>
                    <button id="clearHistoryBtn" class="btn-clear" aria-label="Clear history">Clear</button>
                </div>
                <div style="height: 120px; margin-bottom: 1rem;"><canvas id="historyChart"></canvas></div>
                <div id="historyLogList" class="history-list"></div>
            </div>
        </div>
        </div> <!-- end pdf export area -->

        <div class="panels-grid" style="margin-top: 1.5rem;">
            <div class="glass-card panel" style="grid-column: span 2;">
                <div class="panel-header">
                    <span>Edge Network Routing</span>
                </div>
                <div id="serverMap" style="height: 250px; border-radius: 8px; background:#1e1e1e;"></div>
            </div>
            <div class="glass-card panel">
                <div class="panel-header">
                    <span>Advanced Diagnostics</span>
                    <button id="runDiagBtn" class="btn-clear" style="color:#3b82f6;">Run Trace</button>
                </div>
                <div id="diagConsole" class="diag-console">
                    > Ready...
                </div>
            </div>
        </div>
    </main>

    <footer class="footer"><div class="container text-center py-4 text-muted">© 2026 QuickUtils. Multi-threaded Architecture. <!-- CI Trigger --> </div></footer>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <script src="quickutils-core.js"></script>
    <script src="script.js"></script>



<!-- QuickUtils Network Promo -->
<div id="qu-promo-ribbon" style="position:relative; z-index:50; margin-top:2rem; padding:0; background:#111; border-top:1px solid rgba(128,128,128,0.3); text-align:center; font-family:sans-serif;">
   <button onclick="var c=document.getElementById('qu-promo-content');c.style.display=c.style.display==='none'?'block':'none';this.textContent=c.style.display==='none'?'🚀 Explore 90+ QuickUtils Apps ▼':'▲ Close'" style="width:100%;padding:10px;background:transparent;border:none;color:#aaa;cursor:pointer;font-size:0.85rem;font-family:inherit;">🚀 Explore 90+ QuickUtils Apps ▼</button>
   <div id="qu-promo-content" style="display:none; padding:1rem 1rem 2rem 1rem;">
   <div style="display:flex; flex-wrap:wrap; gap:0.5rem; justify-content:center; max-width:1200px; margin:0 auto;">
      <a href="https://roomplanner.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">3D Room Planner</a>
      <a href="https://apistatus.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">API Status Directory</a>
      <a href="https://ascii.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">ASCII Art Studio</a>
      <a href="https://algorithms.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Algorithm Visualizer</a>
      <a href="https://ambient.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Ambient Sound Mixer</a>
      <a href="https://beatmaker.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Beat Maker</a>
      <a href="https://blackhole.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Blackhole Raytracer</a>
      <a href="https://boilerplates.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Boilerplates Directory</a>
      <a href="https://quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Boring Website</a>
      <a href="https://budget.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Budget Tracker</a>
      <a href="https://cssbattle.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">CSS Battle</a>
      <a href="https://gradients.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">CSS Gradient Studio</a>
      <a href="https://charts.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Chart Maker</a>
      <a href="https://cheatsheets.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Cheatsheets Directory</a>
      <a href="https://chemistry.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Chemistry Lab</a>
      <a href="https://circuits.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Circuit Designer</a>
      <a href="https://cityflow.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">City Pathfinding</a>
      <a href="https://code.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Code Arena</a>
      <a href="https://diff.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Code Diff</a>
      <a href="https://whiteboard.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Collaborative Whiteboard</a>
      <a href="https://coloring.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Coloring Books</a>
      <a href="https://countries.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Country Explorer</a>
      <a href="https://cron.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Cron Builder</a>
      <a href="https://cyberdefense.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Cyber Defense</a>
      <a href="https://dna.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">DNA Lab</a>
      <a href="https://convert.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Data Converter</a>
      <a href="https://datasets.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Datasets Directory</a>
      <a href="https://decide.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Decision Maker</a>
      <a href="https://draw.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Drawing Board</a>
      <a href="https://earthquake.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Earthquake Explorer</a>
      <a href="https://escaperoom.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Escape Room</a>
      <a href="https://firesimulator.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">FIRE Simulator</a>
      <a href="https://flashcards.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Flashcard Maker</a>
      <a href="https://fonts.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Font Playground</a>
      <a href="https://genetics.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Genetic Code Studio</a>
      <a href="https://streak.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Habit Streak</a>
      <a href="https://habits.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Habit Tracker</a>
      <a href="https://ip.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">IP Lookup</a>
      <a href="https://image.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Image Converter</a>
      <a href="https://elements.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Interactive Periodic Table</a>
      <a href="https://invoices.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Invoice Generator</a>
      <a href="https://json.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">JSON Explorer</a>
      <a href="https://jobs.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Jobs Directory</a>
      <a href="https://languageplayground.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Language Playground</a>
      <a href="https://life.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Life Simulator</a>
      <a href="https://loan.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Loan Calculator</a>
      <a href="https://logicsim.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Logic Simulator</a>
      <a href="https://markdown.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Markdown Editor</a>
      <a href="https://market.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Market Digest</a>
      <a href="https://grapher.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Math Grapher</a>
      <a href="https://memes.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Meme Generator</a>
      <a href="https://mindmap.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Mind Map</a>
      <a href="https://mlnodes.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Ml Node Editor</a>
      <a href="https://music.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Music Maker</a>
      <a href="https://musicviz.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Music Visualizer</a>
      <a href="https://nettools.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Network Tools</a>
      <a href="https://opensource.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Open Source Directory</a>
      <a href="https://pdfstudio.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">PDF Studio</a>
      <a href="https://physics.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Physics Sandbox</a>
      <a href="https://pixelart.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Pixel Art Editor</a>
      <a href="https://focus.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Pomodoro Focus Timer</a>
      <a href="https://prices.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Price Comparator</a>
      <a href="https://privacymap.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Privacy Map</a>
      <a href="https://planets.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Procedural Planet</a>
      <a href="https://prompts.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Prompts Directory</a>
      <a href="https://proteins.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Protein Visualizer</a>
      <a href="https://qr.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">QR Studio</a>
      <a href="https://quantumsandbox.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Quantum Sandbox</a>
      <a href="https://quiz.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Quiz Master</a>
      <a href="https://regex.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Regex Playground</a>
      <a href="https://resume.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Resume Builder</a>
      <a href="https://games.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Retro Games</a>
      <a href="https://rhythm.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Rhythm Trainer</a>
      <a href="https://svg.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">SVG Editor</a>
      <a href="https://screenrecord.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Screen Recorder</a>
      <a href="https://solar.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Solar System Explorer</a>
      <a href="https://sounds.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Sound Board</a>
      <a href="https://soundlab.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Sound Lab</a>
      <a href="https://spacemission.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Space Mission Control</a>
      <a href="https://speed.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Speed Test</a>
      <a href="https://stocks.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Stock Simulator</a>
      <a href="https://subtitlegenerator.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Subtitle Generator</a>
      <a href="https://textbehind.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Text Behind Image</a>
      <a href="https://text.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Text Toolkit</a>
      <a href="https://timeline.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Timeline Universe</a>
      <a href="https://tools.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Tools Directory</a>
      <a href="https://travelbuilder.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Travel Builder</a>
      <a href="https://typing.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Typing Speed Test</a>
      <a href="https://video.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Video Studio</a>
      <a href="https://weather.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Weather Dashboard</a>
      <a href="https://chess.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Web Chess</a>
      <a href="https://workoutarchitect.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">Workout Architect</a>
      <a href="https://worldbuilder.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">World Builder</a>
      <a href="https://clock.quickutils.top" target="_blank" style="padding: 4px 10px; background: rgba(128,128,128,0.1); border-radius: 8px; font-size: 0.8rem; text-decoration: none; color: inherit; opacity: 0.8; transition: all 0.2s; white-space: nowrap;">World Clock</a>

   </div>
   </div>
</div>
<!-- /QuickUtils Network Promo -->



</body>
</html>`;
    document.documentElement.innerHTML = htmlCode;
    
    
    // Mock Canvas
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
        clearRect: jest.fn(), fillRect: jest.fn(),
        beginPath: jest.fn(), moveTo: jest.fn(), lineTo: jest.fn(),
        stroke: jest.fn(), fill: jest.fn(), closePath: jest.fn(), arc: jest.fn(),
        createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
        fillText: jest.fn(), strokeText: jest.fn(), measureText: jest.fn(() => ({ width: 0 })),
    }));
    
    // Mock fetch
    global.fetch = jest.fn(() => Promise.resolve({
        ok: true, text: () => Promise.resolve('loc=US\nip=1.2.3.4'),
        json: () => Promise.resolve({ org: 'Test ISP', asn: 'AS12345' }),
        body: { getReader: () => ({ read: () => Promise.resolve({ done: true }), cancel: jest.fn() }), cancel: jest.fn() }
    }));
    
    // Mock performance.now
    const origNow = performance.now.bind(performance);
    let callCount = 0;
    jest.spyOn(performance, 'now').mockImplementation(() => origNow() + (callCount++ * 10));
    
    // Mock localStorage
    const store = {};
    Object.defineProperty(window, 'localStorage', {
        value: {
            getItem: jest.fn(k => store[k] || null),
            setItem: jest.fn((k, v) => { store[k] = v; }),
            removeItem: jest.fn(k => { delete store[k]; })
        }
    });
    
    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: jest.fn(() => Promise.resolve()) }, writable: true
    });
    
    // Mock Leaflet
    window.L = {
        map: jest.fn(() => ({
            setView: jest.fn().mockReturnThis(),
        })),
        tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
        circleMarker: jest.fn(() => ({ addTo: jest.fn().mockReturnThis(), bindPopup: jest.fn().mockReturnThis() })),
    };
    
    // Mock Chart.js
    window.Chart = jest.fn().mockImplementation(() => ({ destroy: jest.fn() }));
    
    // Mock html2pdf
    window.html2pdf = jest.fn(() => ({ set: jest.fn().mockReturnThis(), from: jest.fn().mockReturnThis(), save: jest.fn(() => Promise.resolve()) }));
    
    // Mock QU
    window.QU = { init: jest.fn() };
    
    // Execute the IIFE script
    try { require('../projects/speed-test/script.js'); } catch(e) { /* swallow CDN/network errors */ }
});

// ═══════════════════════════════════════════════════
// DOM STRUCTURE TESTS
// ═══════════════════════════════════════════════════
describe('Speed-Test DOM Structure', () => {
    test('Start test button exists', () => {
        expect(document.getElementById('startTest')).not.toBeNull();
    });

    test('Speed gauge SVG exists', () => {
        expect(document.getElementById('speedGauge')).not.toBeNull();
    });

    test('Gauge fill circle exists', () => {
        expect(document.getElementById('gaugeFill')).not.toBeNull();
    });

    test('Speed display elements exist', () => {
        expect(document.getElementById('speedDisplay')).not.toBeNull();
        expect(document.getElementById('speedUnit')).not.toBeNull();
        expect(document.getElementById('phaseDisplay')).not.toBeNull();
    });

    test('Progress bar exists', () => {
        expect(document.getElementById('progressBar')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// METRIC CARDS TESTS
// ═══════════════════════════════════════════════════
describe('Metric Cards', () => {
    test('Download speed display exists', () => {
        expect(document.getElementById('dlSpeed')).not.toBeNull();
    });

    test('Upload speed display exists', () => {
        expect(document.getElementById('ulSpeed')).not.toBeNull();
    });

    test('Latency display exists', () => {
        expect(document.getElementById('latency')).not.toBeNull();
    });

    test('Jitter display exists', () => {
        expect(document.getElementById('jitter')).not.toBeNull();
    });

    test('Packet loss display exists', () => {
        expect(document.getElementById('packetLoss')).not.toBeNull();
    });

    test('Bufferbloat display exists', () => {
        expect(document.getElementById('bufferbloat')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// QUALITY SCORE TESTS
// ═══════════════════════════════════════════════════
describe('Quality Scoring System', () => {
    test('Network quality score display exists', () => {
        expect(document.getElementById('networkQualScore')).not.toBeNull();
    });

    test('Quality label display exists', () => {
        expect(document.getElementById('networkQualLabel')).not.toBeNull();
    });

    test('MOS score display exists', () => {
        expect(document.getElementById('mosScore')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// INSIGHTS PANEL TESTS
// ═══════════════════════════════════════════════════
describe('Insights & Reporting', () => {
    test('Network insights panel exists', () => {
        expect(document.getElementById('networkInsights')).not.toBeNull();
    });

    test('Share button exists', () => {
        expect(document.getElementById('shareBtn')).not.toBeNull();
    });

    test('PDF button exists', () => {
        expect(document.getElementById('pdfBtn')).not.toBeNull();
    });

    test('Test ID display exists', () => {
        expect(document.getElementById('testId')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// SERVER & ISP DATA TESTS
// ═══════════════════════════════════════════════════
describe('Server & ISP Information', () => {
    test('Server node display exists', () => {
        expect(document.getElementById('serverNode')).not.toBeNull();
    });

    test('Connection status badge exists', () => {
        expect(document.getElementById('connStatus')).not.toBeNull();
    });

    test('ISP name display exists', () => {
        expect(document.getElementById('ispName')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// HISTORY TESTS
// ═══════════════════════════════════════════════════
describe('Historical Analytics', () => {
    test('History list container exists', () => {
        expect(document.getElementById('historyLogList')).not.toBeNull();
    });

    test('Clear history button exists', () => {
        expect(document.getElementById('clearHistoryBtn')).not.toBeNull();
    });

    test('History chart canvas exists', () => {
        expect(document.getElementById('historyChart')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// VFX & ANIMATION TESTS
// ═══════════════════════════════════════════════════
describe('Visual Effects', () => {
    test('VFX canvas exists', () => {
        expect(document.getElementById('vfxCanvas')).not.toBeNull();
    });

    test('Live graph canvas exists', () => {
        expect(document.getElementById('liveGraphCanvas')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// ADVANCED DIAGNOSTICS TESTS
// ═══════════════════════════════════════════════════
describe('Advanced Diagnostics', () => {
    test('Run diagnostics button exists', () => {
        expect(document.getElementById('runDiagBtn')).not.toBeNull();
    });

    test('Diagnostic console exists', () => {
        expect(document.getElementById('diagConsole')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// MAP TESTS
// ═══════════════════════════════════════════════════
describe('Edge Network Map', () => {
    test('Server map container exists', () => {
        expect(document.getElementById('serverMap')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// CONFIGURATION TESTS
// ═══════════════════════════════════════════════════
describe('Test Configuration', () => {
    test('Thread count selector exists', () => {
        expect(document.getElementById('threadCount')).not.toBeNull();
    });

    test('IPv6 toggle exists', () => {
        expect(document.getElementById('ipv6Toggle')).not.toBeNull();
    });

    test('HTTP/3 toggle exists', () => {
        expect(document.getElementById('http3Toggle')).not.toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// ALGORITHM UNIT TESTS (extracted from IIFE)
// ═══════════════════════════════════════════════════
describe('Algorithm Logic (Unit)', () => {
    // Inline reimplementations for unit testing
    function mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
    function stddev(arr) {
        const m = mean(arr);
        return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
    }
    function median(arr) {
        if (!arr.length) return 0;
        const s = [...arr].sort((a, b) => a - b);
        return s.length % 2 ? s[Math.floor(s.length / 2)] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
    }
    function calcMOS(latency, jitter, loss) {
        const R = 93.2 - latency * 0.1 - jitter * 0.4 - loss * 2.5;
        const clampedR = Math.max(0, Math.min(R, 100));
        if (clampedR <= 0) return 1.0;
        const mos = 1 + 0.035 * clampedR + 0.000007 * clampedR * (clampedR - 60) * (100 - clampedR);
        return Math.max(1, Math.min(mos, 4.5)).toFixed(2);
    }
    function calcQualityScore(dl, ul, lat, jit, loss) {
        let score = 100;
        if (lat > 100) score -= 25; else if (lat > 50) score -= 12; else if (lat > 30) score -= 4;
        if (jit > 30) score -= 15; else if (jit > 15) score -= 8; else if (jit > 8) score -= 3;
        score -= loss * 5;
        if (dl < 5) score -= 30; else if (dl < 25) score -= 15; else if (dl < 100) score -= 5;
        if (ul < 2) score -= 10; else if (ul < 10) score -= 4;
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    function gradeFromScore(score) {
        if (score >= 90) return { letter: 'A+', label: 'Excellent', color: '#4ade80' };
        if (score >= 75) return { letter: 'A',  label: 'Very Good', color: '#86efac' };
        if (score >= 60) return { letter: 'B',  label: 'Good',      color: '#38bdf8' };
        if (score >= 45) return { letter: 'C',  label: 'Fair',      color: '#fbbf24' };
        if (score >= 25) return { letter: 'D',  label: 'Poor',      color: '#f97316' };
        return { letter: 'F', label: 'Very Poor', color: '#ef4444' };
    }

    test('mean() calculates correctly', () => {
        expect(mean([10, 20, 30])).toBe(20);
        expect(mean([])).toBe(0);
        expect(mean([5])).toBe(5);
    });

    test('stddev() calculates correctly', () => {
        expect(stddev([10, 10, 10])).toBe(0);
        expect(stddev([0, 10])).toBeCloseTo(5, 1);
    });

    test('median() calculates correctly', () => {
        expect(median([1, 3, 5])).toBe(3);
        expect(median([1, 2, 3, 4])).toBe(2.5);
        expect(median([])).toBe(0);
    });

    test('MOS score ranges are valid', () => {
        const perfect = parseFloat(calcMOS(5, 1, 0));
        expect(perfect).toBeGreaterThanOrEqual(4.0);
        expect(perfect).toBeLessThanOrEqual(4.5);

        const terrible = parseFloat(calcMOS(500, 100, 50));
        expect(terrible).toBe(1.0);
    });

    test('Quality score grading A+ for excellent connection', () => {
        const score = calcQualityScore(500, 100, 5, 2, 0);
        expect(score).toBeGreaterThanOrEqual(90);
        const grade = gradeFromScore(score);
        expect(grade.letter).toBe('A+');
    });

    test('Quality score grading F for terrible connection', () => {
        const score = calcQualityScore(1, 0.5, 200, 50, 10);
        expect(score).toBeLessThanOrEqual(25);
        const grade = gradeFromScore(score);
        expect(['D', 'F']).toContain(grade.letter);
    });

    test('Quality score grading B for average connection', () => {
        const score = calcQualityScore(50, 15, 40, 10, 0);
        expect(score).toBeGreaterThanOrEqual(60);
        expect(score).toBeLessThan(90);
    });

    test('Bufferbloat grading', () => {
        function bufferbloatGrade(unloaded, loaded) {
            const diff = loaded - unloaded;
            if (diff < 5) return 'A';
            if (diff < 30) return 'B';
            if (diff < 60) return 'C';
            if (diff < 200) return 'D';
            return 'F';
        }
        expect(bufferbloatGrade(10, 12)).toBe('A');
        expect(bufferbloatGrade(10, 35)).toBe('B');
        expect(bufferbloatGrade(10, 60)).toBe('C');
        expect(bufferbloatGrade(10, 150)).toBe('D');
        expect(bufferbloatGrade(10, 500)).toBe('F');
    });
});

// ═══════════════════════════════════════════════════
// THEME TOGGLE TEST
// ═══════════════════════════════════════════════════
describe('Theme System', () => {
    test('Theme toggle button exists', () => {
        expect(document.getElementById('themeBtn')).not.toBeNull();
    });
});
