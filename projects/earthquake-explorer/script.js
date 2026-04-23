(() => {
    'use strict';

    // ═══════════════════════════════════════════════════
    // THEME TOGGLE
    // ═══════════════════════════════════════════════════
    const themeBtn = document.getElementById('themeBtn');
    themeBtn.addEventListener('click', () => {
        const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = t;
        themeBtn.textContent = t === 'dark' ? '🌙' : '☀️';
        localStorage.setItem('theme', t);
    });
    const saved = localStorage.getItem('theme');
    if (saved) { document.documentElement.dataset.theme = saved; themeBtn.textContent = saved === 'dark' ? '🌙' : '☀️'; }

    // ═══════════════════════════════════════════════════
    // GLOBE RENDERER — 3D earth with earthquake dots
    // ═══════════════════════════════════════════════════
    const canvas = document.getElementById('globe');
    const ctx = canvas.getContext('2d');
    let W, H, R;

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        W = canvas.width = rect.width * dpr;
        H = canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        R = Math.min(rect.width, rect.height) * 0.38;
    }
    resize();
    window.addEventListener('resize', resize);

    let rotX = 0.4, rotY = 0;
    let autoRotate = true;
    let earthquakes = [];
    let isDragging = false, dragStart = { x: 0, y: 0 }, rotStart = { x: 0, y: 0 };

    // Drag to rotate
    canvas.addEventListener('mousedown', e => { isDragging = true; autoRotate = false; dragStart = { x: e.offsetX, y: e.offsetY }; rotStart = { x: rotX, y: rotY }; });
    canvas.addEventListener('mousemove', e => { if (!isDragging) return; rotY = rotStart.y + (e.offsetX - dragStart.x) * 0.005; rotX = Math.max(-1.5, Math.min(1.5, rotStart.x - (e.offsetY - dragStart.y) * 0.005)); });
    canvas.addEventListener('mouseup', () => isDragging = false);
    canvas.addEventListener('mouseleave', () => isDragging = false);
    canvas.addEventListener('touchstart', e => { if (e.touches.length === 1) { isDragging = true; autoRotate = false; dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }; rotStart = { x: rotX, y: rotY }; e.preventDefault(); }}, { passive: false });
    canvas.addEventListener('touchmove', e => { if (!isDragging || e.touches.length !== 1) return; rotY = rotStart.y + (e.touches[0].clientX - dragStart.x) * 0.005; rotX = Math.max(-1.5, Math.min(1.5, rotStart.x - (e.touches[0].clientY - dragStart.y) * 0.005)); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchend', () => isDragging = false);

    // Project lat/lon to 3D sphere → 2D screen
    function project(lat, lon) {
        const phi = (90 - lat) * Math.PI / 180;
        const theta = (lon + 180) * Math.PI / 180;
        let x = R * Math.sin(phi) * Math.cos(theta);
        let y = R * Math.cos(phi);
        let z = R * Math.sin(phi) * Math.sin(theta);
        // Rotate Y axis
        const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
        const x2 = x * cosY - z * sinY;
        const z2 = x * sinY + z * cosY;
        // Rotate X axis
        const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
        const y2 = y * cosX - z2 * sinX;
        const z3 = y * sinX + z2 * cosX;
        const rect = canvas.getBoundingClientRect();
        return { x: rect.width / 2 + x2, y: rect.height / 2 + y2, z: z3, visible: z3 > -R * 0.1 };
    }

    // Coastline data (simplified — major landmass outlines)
    const COASTLINES = [
        // Africa outline
        [[35,10],[37,-10],[30,-30],[18,-35],[10,-20],[5,0],[0,10],[-5,12],[-15,10],[-10,0],[-5,-10],[5,-15],[15,-15],[25,-10],[35,10]],
        // Europe
        [[40,-10],[45,0],[50,5],[55,10],[60,10],[65,20],[70,30],[60,30],[55,20],[50,15],[45,10],[40,5],[38,0],[36,-5],[40,-10]],
        // Asia (simplified)
        [[45,30],[50,40],[55,50],[60,60],[55,70],[50,80],[60,90],[65,100],[55,110],[45,120],[40,130],[35,140],[30,130],[25,120],[20,110],[15,100],[10,100],[5,100],[0,105],[15,80],[20,70],[25,60],[30,50],[35,40],[45,30]],
        // N America
        [[70,-160],[65,-140],[60,-130],[50,-125],[40,-120],[30,-115],[25,-110],[20,-100],[15,-90],[20,-85],[25,-80],[30,-80],[35,-75],[40,-70],[45,-65],[50,-60],[55,-55],[60,-60],[65,-70],[70,-80],[72,-100],[73,-130],[70,-160]],
        // S America
        [[10,-70],[5,-75],[0,-80],[-5,-80],[-10,-75],[-15,-75],[-20,-70],[-25,-65],[-30,-60],[-35,-58],[-40,-65],[-45,-70],[-50,-75],[-55,-68],[-50,-60],[-40,-50],[-30,-50],[-20,-40],[-10,-35],[0,-50],[5,-60],[10,-70]],
        // Australia
        [[-15,130],[-15,140],[-20,145],[-25,150],[-30,150],[-35,140],[-35,135],[-30,130],[-25,115],[-20,115],[-15,120],[-15,130]],
    ];

    // Tectonic plate boundaries (simplified)
    const PLATES = [
        [[65,-20],[60,-30],[50,-30],[35,-35],[20,-20],[15,40],[0,30],[-35,15],[-60,0],[-60,-30],[-55,-70]],
        [[-35,15],[-15,45],[0,55],[15,65],[35,70],[50,90],[55,110],[50,130],[40,140],[30,130],[42,144]],
        [[60,130],[55,160],[50,180],[45,-170],[40,-120],[35,-120]],
        [[-20,-110],[-30,-110],[-40,-80],[-50,-75],[-55,-68],[-60,0]],
        [[65,-20],[65,20],[70,30],[70,130],[60,130]],
    ];

    function drawGlobe(time) {
        const rect = canvas.getBoundingClientRect();
        const cw = rect.width, ch = rect.height;
        ctx.clearRect(0, 0, cw, ch);

        if (autoRotate) rotY += 0.003;

        // Atmosphere glow
        const atmoGrad = ctx.createRadialGradient(cw / 2, ch / 2, R * 0.9, cw / 2, ch / 2, R * 1.4);
        atmoGrad.addColorStop(0, 'rgba(16,185,129,0.05)');
        atmoGrad.addColorStop(0.5, 'rgba(59,130,246,0.03)');
        atmoGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = atmoGrad;
        ctx.beginPath(); ctx.arc(cw / 2, ch / 2, R * 1.4, 0, Math.PI * 2); ctx.fill();

        // Ocean sphere
        const oceanGrad = ctx.createRadialGradient(cw / 2 - R * 0.3, ch / 2 - R * 0.3, 0, cw / 2, ch / 2, R);
        oceanGrad.addColorStop(0, '#0c2d48');
        oceanGrad.addColorStop(1, '#051324');
        ctx.fillStyle = oceanGrad;
        ctx.beginPath(); ctx.arc(cw / 2, ch / 2, R, 0, Math.PI * 2); ctx.fill();

        // Grid lines (latitude/longitude)
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5;
        for (let lat = -60; lat <= 60; lat += 30) {
            ctx.beginPath();
            for (let lon = -180; lon <= 180; lon += 3) {
                const p = project(lat, lon);
                if (!p.visible) continue;
                if (lon === -180 || !project(lat, lon - 3).visible) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
        }
        for (let lon = -180; lon <= 150; lon += 30) {
            ctx.beginPath();
            for (let lat = -80; lat <= 80; lat += 3) {
                const p = project(lat, lon);
                if (!p.visible) continue;
                if (lat === -80 || !project(lat - 3, lon).visible) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
        }

        // Coastlines
        ctx.strokeStyle = 'rgba(16,185,129,0.35)';
        ctx.lineWidth = 1.2;
        COASTLINES.forEach(coast => {
            ctx.beginPath();
            let started = false;
            coast.forEach(([lat, lon]) => {
                const p = project(lat, lon);
                if (!p.visible) { started = false; return; }
                if (!started) { ctx.moveTo(p.x, p.y); started = true; }
                else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
        });

        // Landmass fill (simplified closed polygons)
        ctx.fillStyle = 'rgba(16,185,129,0.06)';
        COASTLINES.forEach(coast => {
            ctx.beginPath();
            let allVisible = true;
            coast.forEach(([lat, lon], i) => {
                const p = project(lat, lon);
                if (!p.visible) allVisible = false;
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            if (allVisible) { ctx.closePath(); ctx.fill(); }
        });

        const showPlates = document.getElementById('showPlates');
        if (!showPlates || showPlates.checked) {
            // Tectonic plate boundaries
            ctx.strokeStyle = 'rgba(239,68,68,0.15)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            PLATES.forEach(plate => {
                ctx.beginPath();
                let started = false;
                plate.forEach(([lat, lon]) => {
                    const p = project(lat, lon);
                    if (!p.visible) { started = false; return; }
                    if (!started) { ctx.moveTo(p.x, p.y); started = true; }
                    else ctx.lineTo(p.x, p.y);
                });
                ctx.stroke();
            });
            ctx.setLineDash([]);
        }

        // Playback filtering
        const timeSliderVal = parseInt(document.getElementById('timeSlider')?.value || 1000);
        let currTimeLimit = Date.now();
        if(earthquakes.length > 0 && timeSliderVal < 1000) {
            const minTime = Math.min(...earthquakes.map(e => e.time));
            const maxTime = Math.max(...earthquakes.map(e => e.time));
            currTimeLimit = minTime + (maxTime - minTime) * (timeSliderVal / 1000);
        }

        const showHeatmap = document.getElementById('showHeatmap')?.checked;

        // Earthquake dots / heatmap
        const now = Date.now();
        earthquakes.forEach(eq => {
            if (eq.time > currTimeLimit) return; // future in timeline
            const p = project(eq.lat, eq.lon);
            if (!p.visible) return;

            const mag = eq.mag;
            let color, size;
            if (mag >= 7) { color = '#ef4444'; size = 10; }
            else if (mag >= 5) { color = '#f97316'; size = 7; }
            else if (mag >= 3) { color = '#f59e0b'; size = 5; }
            else { color = '#10b981'; size = 3; }

            // Pulse animation for recent quakes (< 2 hours from timeline current)
            const age = currTimeLimit - eq.time;
            const isRecent = age < 7200000 && age >= 0;
            const pulse = isRecent ? 1 + 0.3 * Math.sin(time / 300 + eq.time) : 1;

            if (showHeatmap) {
                // Additive Gaussian-like blur
                ctx.globalCompositeOperation = 'lighter';
                const rad = size * 5 * pulse;
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
                grad.addColorStop(0, color + '80');
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI * 2); ctx.fill();
                ctx.globalCompositeOperation = 'source-over';
            } else {
                // Glow
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2.5 * pulse);
                grad.addColorStop(0, color);
                grad.addColorStop(0.4, color + '80');
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(p.x, p.y, size * 2.5 * pulse, 0, Math.PI * 2); ctx.fill();

                // Core dot
                ctx.fillStyle = color;
                ctx.beginPath(); ctx.arc(p.x, p.y, size * pulse, 0, Math.PI * 2); ctx.fill();

                // Ripple for big quakes
                if (mag >= 5 && isRecent) {
                    const ripple = (time / 500 + eq.time / 1000) % 1;
                    ctx.strokeStyle = color + Math.round((1 - ripple) * 100).toString(16).padStart(2, '0');
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.arc(p.x, p.y, size * 2 + ripple * 20, 0, Math.PI * 2); ctx.stroke();
                }
            }
        });

        // Highlight — edge glow
        const edgeGrad = ctx.createRadialGradient(cw / 2, ch / 2, R * 0.95, cw / 2, ch / 2, R * 1.02);
        edgeGrad.addColorStop(0, 'transparent');
        edgeGrad.addColorStop(1, 'rgba(16,185,129,0.1)');
        ctx.fillStyle = edgeGrad;
        ctx.beginPath(); ctx.arc(cw / 2, ch / 2, R * 1.02, 0, Math.PI * 2); ctx.fill();

        requestAnimationFrame(drawGlobe);
    }

    requestAnimationFrame(drawGlobe);

    // ═══════════════════════════════════════════════════
    // USGS DATA FETCHING
    // ═══════════════════════════════════════════════════
    const USGS_BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/';
    const FEED_MAP = {
        'all_hour': 'all_hour.geojson',
        'all_day': 'all_day.geojson',
        'all_week': 'all_week.geojson',
        'all_month': 'all_month.geojson',
        '2.5_hour': '2.5_hour.geojson',
        '2.5_day': '2.5_day.geojson',
        '2.5_week': '2.5_week.geojson',
        '2.5_month': '2.5_month.geojson',
        '4.5_hour': '4.5_hour.geojson',
        '4.5_day': '4.5_day.geojson',
        '4.5_week': '4.5_week.geojson',
        '4.5_month': '4.5_month.geojson',
        '1.0_hour': '1.0_hour.geojson',
        '1.0_day': '1.0_day.geojson',
        '1.0_week': '1.0_week.geojson',
        '1.0_month': '1.0_month.geojson',
        'significant_hour': 'significant_hour.geojson',
        'significant_day': 'significant_day.geojson',
        'significant_week': 'significant_week.geojson',
        'significant_month': 'significant_month.geojson',
    };

    async function fetchQuakes() {
        const timeRange = document.getElementById('timeRange').value;
        const minMag = document.getElementById('minMag').value;
        const feedKey = minMag + '_' + timeRange;
        const feedFile = FEED_MAP[feedKey] || FEED_MAP['2.5_day'];
        const url = USGS_BASE + feedFile;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('USGS API error');
            const data = await res.json();

            earthquakes = data.features.map(f => ({
                mag: f.properties.mag || 0,
                place: f.properties.place || 'Unknown',
                time: f.properties.time,
                url: f.properties.url,
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
                depth: f.geometry.coordinates[2],
            })).sort((a, b) => b.time - a.time);

            updateStats();
            renderList();
            updateTimelineText();
        } catch (e) {
            console.error('Fetch error:', e);
            const ql = document.getElementById('quakeList');
            if (ql) ql.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem;">Failed to load earthquake data. Check your connection and try again.</p>';
        }
    }

    // Timeline logic
    const timeSlider = document.getElementById('timeSlider');
    const timeDisplay = document.getElementById('timeDisplay');
    const btnPlay = document.getElementById('btnPlay');
    let isPlaying = false;
    let playInterval = null;

    function updateTimelineText() {
        if (!earthquakes.length) return;
        const val = parseInt(timeSlider.value);
        if (val === 1000) {
            timeDisplay.textContent = 'Live / Now';
            timeDisplay.style.color = 'var(--text-muted)';
        } else {
            const minTime = Math.min(...earthquakes.map(e => e.time));
            const maxTime = Math.max(...earthquakes.map(e => e.time));
            const ct = minTime + (maxTime - minTime) * (val / 1000);
            const d = new Date(ct);
            timeDisplay.textContent = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            timeDisplay.style.color = 'var(--neon-blue)';
        }
    }

    if(timeSlider) {
        timeSlider.addEventListener('input', () => {
            if(isPlaying) togglePlay();
            updateTimelineText();
        });
    }

    function togglePlay() {
        isPlaying = !isPlaying;
        if(isPlaying) {
            btnPlay.textContent = '⏸ Pause';
            if (parseInt(timeSlider.value) === 1000) timeSlider.value = 0; // restart
            playInterval = setInterval(() => {
                let v = parseInt(timeSlider.value);
                v += 2;
                if (v >= 1000) { v = 1000; togglePlay(); }
                timeSlider.value = v;
                updateTimelineText();
            }, 50);
        } else {
            btnPlay.textContent = '▶ Play';
            clearInterval(playInterval);
        }
    }

    if(btnPlay) btnPlay.addEventListener('click', togglePlay);

    function updateStats() {
        document.getElementById('quakeCount').textContent = earthquakes.length;
        const maxMag = earthquakes.length ? Math.max(...earthquakes.map(e => e.mag)).toFixed(1) : '0.0';
        document.getElementById('maxMag').textContent = maxMag;
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function timeAgo(ts) {
        const s = Math.floor((Date.now() - ts) / 1000);
        if (s < 60) return s + 's ago';
        if (s < 3600) return Math.floor(s / 60) + 'm ago';
        if (s < 86400) return Math.floor(s / 3600) + 'h ago';
        return Math.floor(s / 86400) + 'd ago';
    }

    function renderList() {
        const container = document.getElementById('quakeList');
        container.innerHTML = earthquakes.slice(0, 50).map(eq => {
            const magClass = eq.mag >= 7 ? 'mag-extreme' : eq.mag >= 5 ? 'mag-high' : eq.mag >= 3 ? 'mag-med' : 'mag-low';
            return `<div class="quake-item" data-lat="${eq.lat}" data-lon="${eq.lon}">
                <div class="quake-mag ${magClass}">${eq.mag.toFixed(1)}</div>
                <div class="quake-info">
                    <div class="quake-place">${eq.place}</div>
                    <div class="quake-time">${timeAgo(eq.time)} • ${new Date(eq.time).toLocaleDateString()}</div>
                </div>
                <div class="quake-depth">${eq.depth.toFixed(0)} km</div>
            </div>`;
        }).join('');

        // Click to rotate globe to quake
        container.querySelectorAll('.quake-item').forEach(item => {
            item.addEventListener('click', () => {
                const lat = parseFloat(item.dataset.lat);
                const lon = parseFloat(item.dataset.lon);
                autoRotate = false;
                rotX = lat * Math.PI / 180;
                rotY = -lon * Math.PI / 180 - Math.PI;
            });
        });
    }

    // Tooltip on hover
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const tooltip = document.getElementById('tooltip');
        let found = null;

        for (const eq of earthquakes) {
            const p = project(eq.lat, eq.lon);
            if (!p.visible) continue;
            const d = Math.hypot(mx - p.x, my - p.y);
            if (d < 15) { found = eq; break; }
        }

        if (found) {
            tooltip.style.display = 'block';
            tooltip.style.left = (mx + 15) + 'px';
            tooltip.style.top = (my - 10) + 'px';
            tooltip.innerHTML = `<strong>M${found.mag.toFixed(1)}</strong> — ${found.place}<br><span style="color:var(--text-muted)">${timeAgo(found.time)} • Depth: ${found.depth.toFixed(0)} km</span>`;
        } else {
            tooltip.style.display = 'none';
        }
    });

    // Controls
    document.getElementById('timeRange').addEventListener('change', fetchQuakes);
    document.getElementById('minMag').addEventListener('change', fetchQuakes);
    document.getElementById('refreshBtn').addEventListener('click', fetchQuakes);

    // Initial load
    fetchQuakes();

    // Auto-refresh every 5 minutes
    setInterval(fetchQuakes, 300000);
})();
