/* Solar System Explorer - Immersive Deep Zoom */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });

    const canvas = $('#solarCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');

    // Full viewport canvas
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Camera
    let zoom = 0.01, zoomTarget = 0.01;
    let cx = 0, cy = 0;
    let isDragging = false, dragStart = {x:0,y:0}, camStart = {x:0,y:0};
    const MIN_ZOOM = 0.0005, MAX_ZOOM = 200;

    // Controls overlay
    const ctrl = document.createElement('div');
    ctrl.innerHTML = `
        <div style="position:fixed;top:70px;left:15px;background:rgba(0,0,0,0.75);padding:12px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);z-index:10;backdrop-filter:blur(10px);">
            <p style="margin:0 0 8px;color:#fff;font-weight:700;font-size:14px;">🔭 Space Explorer</p>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <button id="z1" class="btn btn-secondary btn-sm">Galaxy</button>
                <button id="z2" class="btn btn-secondary btn-sm">Constellations</button>
                <button id="z3" class="btn btn-secondary btn-sm">Solar System</button>
            </div>
            <p id="zoomInfo" style="margin:8px 0 0;font-size:11px;color:#888;">Scroll to zoom • Drag to pan</p>
        </div>`;
    document.body.appendChild(ctrl);

    $('#z1').onclick = () => { zoomTarget = 0.001; cx=0; cy=0; };
    $('#z2').onclick = () => { zoomTarget = 0.03; };
    $('#z3').onclick = () => { zoomTarget = 1.0; cx=0; cy=0; };

    canvas.addEventListener('mousedown', e => { isDragging=true; dragStart={x:e.clientX,y:e.clientY}; camStart={x:cx,y:cy}; });
    window.addEventListener('mouseup', () => isDragging=false);
    window.addEventListener('mousemove', e => { if(!isDragging)return; cx=camStart.x-(e.clientX-dragStart.x)/zoom; cy=camStart.y-(e.clientY-dragStart.y)/zoom; });
    
    // Touch support
    canvas.addEventListener('touchstart', e => { if(e.touches.length===1){isDragging=true;dragStart={x:e.touches[0].clientX,y:e.touches[0].clientY};camStart={x:cx,y:cy};}e.preventDefault(); },{passive:false});
    canvas.addEventListener('touchmove', e => { if(!isDragging||e.touches.length!==1)return; cx=camStart.x-(e.touches[0].clientX-dragStart.x)/zoom; cy=camStart.y-(e.touches[0].clientY-dragStart.y)/zoom; e.preventDefault(); },{passive:false});
    canvas.addEventListener('touchend', () => isDragging=false);
    
    canvas.addEventListener('wheel', e => { e.preventDefault(); const z=e.deltaY>0?0.85:1.18; zoomTarget=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,zoomTarget*z)); },{passive:false});

    // ═══════════════════════════════════════════
    // INFINITE STARFIELD (tiled, no boundary)
    // ═══════════════════════════════════════════
    const TILE_SIZE = 4000;
    const STARS_PER_TILE = 200;
    const starTileCache = {};
    
    function getStarTile(tx, ty) {
        const key = `${tx},${ty}`;
        if(starTileCache[key]) return starTileCache[key];
        // Seeded pseudo-random
        let seed = Math.abs(tx * 73856093 ^ ty * 19349663) % 2147483647;
        const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
        const stars = [];
        for(let i=0; i<STARS_PER_TILE; i++) {
            stars.push({
                x: tx * TILE_SIZE + rng() * TILE_SIZE,
                y: ty * TILE_SIZE + rng() * TILE_SIZE,
                s: rng() * 2 + 0.3,
                b: rng() * 0.6 + 0.4,
                h: rng() * 60 + 200
            });
        }
        starTileCache[key] = stars;
        return stars;
    }

    // ═══════════════════════════════════════════
    // REAL CONSTELLATIONS
    // ═══════════════════════════════════════════
    const CONSTELLATIONS = [
        { name: 'Orion', cx: 3000, cy: 1000, stars: [
            { name: 'Betelgeuse', x: 2700, y: 600, s: 8, color: '#ff6644', type: 'Red Supergiant', mag: 0.42, planets: 0 },
            { name: 'Rigel', x: 3300, y: 1500, s: 7, color: '#aaccff', type: 'Blue Supergiant', mag: 0.13, planets: 0 },
            { name: 'Bellatrix', x: 3200, y: 650, s: 5, color: '#bbddff', type: 'Blue Giant', mag: 1.64, planets: 0 },
            { name: 'Mintaka', x: 2850, y: 1000, s: 4, color: '#ddeeff', type: 'Multiple Star', mag: 2.23, planets: 2 },
            { name: 'Alnilam', x: 3000, y: 1000, s: 5, color: '#cce0ff', type: 'Blue Supergiant', mag: 1.69, planets: 1 },
            { name: 'Alnitak', x: 3150, y: 1000, s: 4, color: '#ddeeff', type: 'Triple Star', mag: 1.77, planets: 3 },
            { name: 'Saiph', x: 2750, y: 1450, s: 4, color: '#bbddff', type: 'Blue Supergiant', mag: 2.09, planets: 0 },
        ], lines: [[0,2],[0,4],[2,5],[3,4],[4,5],[1,5],[1,6],[6,3]] },

        { name: 'Ursa Major', cx: -5000, cy: -4000, stars: [
            { name: 'Dubhe', x: -5500, y: -4500, s: 6, color: '#ffd700', type: 'Giant', mag: 1.79, planets: 1 },
            { name: 'Merak', x: -5400, y: -3800, s: 5, color: '#fff', type: 'Main Sequence', mag: 2.37, planets: 2 },
            { name: 'Phecda', x: -4800, y: -3600, s: 5, color: '#fff', type: 'Main Sequence', mag: 2.44, planets: 0 },
            { name: 'Megrez', x: -4700, y: -4100, s: 4, color: '#fff', type: 'Main Sequence', mag: 3.31, planets: 1 },
            { name: 'Alioth', x: -4200, y: -4300, s: 5, color: '#fff', type: 'Main Sequence', mag: 1.77, planets: 0 },
            { name: 'Mizar', x: -3800, y: -4500, s: 5, color: '#fff', type: 'Binary', mag: 2.04, planets: 1 },
            { name: 'Alkaid', x: -3400, y: -4800, s: 5, color: '#cce0ff', type: 'Main Sequence', mag: 1.86, planets: 0 },
        ], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]] },

        { name: 'Cassiopeia', cx: 7000, cy: -5000, stars: [
            { name: 'Schedar', x: 6500, y: -5200, s: 6, color: '#ffa500', type: 'Giant', mag: 2.24, planets: 1 },
            { name: 'Caph', x: 6800, y: -4600, s: 5, color: '#fff', type: 'Giant', mag: 2.27, planets: 0 },
            { name: 'Gamma Cas', x: 7100, y: -5400, s: 5, color: '#aaccff', type: 'Blue Subgiant', mag: 2.47, planets: 2 },
            { name: 'Ruchbah', x: 7400, y: -4800, s: 4, color: '#fff', type: 'Eclipsing Binary', mag: 2.68, planets: 0 },
            { name: 'Segin', x: 7600, y: -5300, s: 4, color: '#cce0ff', type: 'B-type', mag: 3.37, planets: 1 },
        ], lines: [[0,1],[1,2],[2,3],[3,4]] },

        { name: 'Scorpius', cx: -8000, cy: 6000, stars: [
            { name: 'Antares', x: -8000, y: 6000, s: 9, color: '#ff4400', type: 'Red Supergiant', mag: 0.96, planets: 0 },
            { name: 'Shaula', x: -7200, y: 7200, s: 5, color: '#bbddff', type: 'Binary', mag: 1.63, planets: 2 },
            { name: 'Sargas', x: -7500, y: 7000, s: 4, color: '#fff4cc', type: 'Giant', mag: 1.87, planets: 1 },
            { name: 'Dschubba', x: -8200, y: 5400, s: 5, color: '#cce0ff', type: 'Beta Cephei', mag: 2.32, planets: 0 },
            { name: 'Acrab', x: -8400, y: 5200, s: 4, color: '#ddeeff', type: 'Multiple', mag: 2.62, planets: 3 },
            { name: 'Fang', x: -8100, y: 5700, s: 3, color: '#cce0ff', type: 'Binary', mag: 3.04, planets: 0 },
        ], lines: [[4,3],[3,5],[5,0],[0,2],[2,1]] },

        { name: 'Leo', cx: 10000, cy: 2000, stars: [
            { name: 'Regulus', x: 9500, y: 2500, s: 7, color: '#cce0ff', type: 'Blue-white', mag: 1.35, planets: 1 },
            { name: 'Denebola', x: 10800, y: 1800, s: 5, color: '#fff', type: 'Main Sequence', mag: 2.14, planets: 2 },
            { name: 'Algieba', x: 9800, y: 1600, s: 5, color: '#ffa500', type: 'Binary Giant', mag: 2.28, planets: 1 },
            { name: 'Zosma', x: 10400, y: 1600, s: 4, color: '#fff', type: 'Main Sequence', mag: 2.56, planets: 0 },
            { name: 'Ras Elased', x: 9600, y: 1400, s: 4, color: '#ffd700', type: 'Giant', mag: 3.0, planets: 0 },
        ], lines: [[0,2],[2,4],[2,3],[3,1]] },

        { name: 'Cygnus', cx: -3000, cy: -8000, stars: [
            { name: 'Deneb', x: -3000, y: -9000, s: 8, color: '#fff', type: 'Blue-white Supergiant', mag: 1.25, planets: 0 },
            { name: 'Sadr', x: -3000, y: -8000, s: 5, color: '#fff4cc', type: 'Supergiant', mag: 2.23, planets: 1 },
            { name: 'Gienah', x: -3600, y: -7600, s: 4, color: '#ffa500', type: 'Giant', mag: 2.48, planets: 0 },
            { name: 'Albireo', x: -3000, y: -7000, s: 5, color: '#ffa500', type: 'Binary', mag: 3.08, planets: 2 },
            { name: 'Fawaris', x: -2400, y: -7600, s: 4, color: '#cce0ff', type: 'Main Sequence', mag: 2.87, planets: 1 },
        ], lines: [[0,1],[1,2],[1,3],[1,4]] },

        { name: 'Lyra', cx: -1500, cy: -6000, stars: [
            { name: 'Vega', x: -1500, y: -6000, s: 9, color: '#fff', type: 'Main Sequence A0V', mag: 0.03, planets: 2 },
            { name: 'Sulafat', x: -1200, y: -5600, s: 4, color: '#cce0ff', type: 'Giant', mag: 3.24, planets: 0 },
            { name: 'Sheliak', x: -1300, y: -5500, s: 4, color: '#fff', type: 'Eclipsing Binary', mag: 3.52, planets: 1 },
            { name: 'Epsilon Lyr', x: -1600, y: -5800, s: 3, color: '#fff', type: 'Double-double', mag: 4.67, planets: 0 },
        ], lines: [[0,3],[0,1],[1,2]] },

        { name: 'Gemini', cx: 5000, cy: -2000, stars: [
            { name: 'Pollux', x: 5200, y: -2300, s: 7, color: '#ffa500', type: 'Giant K0III', mag: 1.14, planets: 1 },
            { name: 'Castor', x: 5100, y: -2600, s: 6, color: '#fff', type: 'Sextuple Star', mag: 1.58, planets: 0 },
            { name: 'Alhena', x: 4700, y: -1500, s: 5, color: '#fff', type: 'Subgiant', mag: 1.93, planets: 0 },
            { name: 'Wasat', x: 4900, y: -1900, s: 4, color: '#fff4cc', type: 'Subgiant', mag: 3.53, planets: 1 },
            { name: 'Mebsuta', x: 5300, y: -1700, s: 4, color: '#ffd700', type: 'Supergiant', mag: 3.06, planets: 0 },
        ], lines: [[1,0],[0,4],[1,3],[3,2]] },
    ];

    // Central Solar System
    const sun = { r: 50, color: '#facc15', glow: '#fef08a' };
    const planets = [
        { name:'Mercury', d:80, s:3, c:'#a8a29e', v:0.04, a:0 },
        { name:'Venus', d:130, s:6, c:'#fcd34d', v:0.015, a:1 },
        { name:'Earth', d:190, s:7, c:'#3b82f6', v:0.01, a:2, moon:true },
        { name:'Mars', d:250, s:5, c:'#ef4444', v:0.008, a:-1 },
        { name:'Jupiter', d:450, s:22, c:'#fdba74', v:0.002, a:3, bands:true },
        { name:'Saturn', d:650, s:18, c:'#fde047', v:0.001, a:5, hasRings:true },
        { name:'Uranus', d:850, s:14, c:'#67e8f9', v:0.0005, a:0 },
        { name:'Neptune', d:1050, s:13, c:'#3b82f6', v:0.0004, a:Math.PI }
    ];

    // Generate procedural exoplanet systems for constellation stars
    function genExoSystem(star) {
        if(star._exo) return star._exo;
        let seed = star.name.split('').reduce((a,c) => a + c.charCodeAt(0), 0);
        const rng = () => { seed=(seed*16807)%2147483647; return(seed-1)/2147483646; };
        const np = star.planets || Math.floor(rng() * 4) + 1;
        const exoPlanets = [];
        for(let i=0; i<np; i++) {
            exoPlanets.push({
                name: `${star.name} ${String.fromCharCode(98+i)}`,
                d: 20 + i * 18 + rng()*10,
                s: 2 + rng()*5,
                c: `hsl(${rng()*360},${40+rng()*40}%,${40+rng()*30}%)`,
                v: 0.02 + rng()*0.03,
                a: rng() * Math.PI * 2
            });
        }
        star._exo = exoPlanets;
        return exoPlanets;
    }

    // ═══════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════
    let time = 0;
    let hoveredStar = null;

    // Click handler for constellation star zoom
    canvas.addEventListener('click', e => {
        if(!hoveredStar) return;
        cx = hoveredStar.x;
        cy = hoveredStar.y;
        zoomTarget = 15;
    });

    canvas.addEventListener('mousemove', e => {
        const w = canvas.width, h = canvas.height;
        const mx = (e.clientX - w/2) / zoom + cx;
        const my = (e.clientY - h/2) / zoom + cy;
        hoveredStar = null;
        for(const c of CONSTELLATIONS) {
            for(const s of c.stars) {
                const d = Math.hypot(mx - s.x, my - s.y);
                if(d < Math.max(s.s * 2, 30/zoom)) { hoveredStar = s; canvas.style.cursor = 'pointer'; return; }
            }
        }
        canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
    });

    function draw() {
        const w = canvas.width, h = canvas.height;
        ctx.fillStyle = '#020208';
        ctx.fillRect(0, 0, w, h);
        time++;
        zoom += (zoomTarget - zoom) * 0.08;

        // HUD
        $('#zoomInfo').textContent = `Zoom: ${(zoom*1000).toFixed(1)}x | [${Math.round(cx)}, ${Math.round(cy)}]`;

        ctx.save();
        ctx.translate(w/2, h/2);
        ctx.scale(zoom, zoom);
        ctx.translate(-cx, -cy);

        const vw = w/zoom, vh = h/zoom;
        const vl = cx - vw/2, vr = cx + vw/2, vt = cy - vh/2, vb = cy + vh/2;

        // ── 1. INFINITE TILED STARFIELD ──
        const tileL = Math.floor(vl/TILE_SIZE) - 1;
        const tileR = Math.floor(vr/TILE_SIZE) + 1;
        const tileT = Math.floor(vt/TILE_SIZE) - 1;
        const tileB = Math.floor(vb/TILE_SIZE) + 1;
        const maxTiles = 100;
        let tileCount = 0;
        for(let tx = tileL; tx <= tileR && tileCount < maxTiles; tx++) {
            for(let ty = tileT; ty <= tileB && tileCount < maxTiles; ty++) {
                const stars = getStarTile(tx, ty);
                for(const s of stars) {
                    const twinkle = 0.7 + 0.3 * Math.sin(time * 0.03 + s.x * 0.01);
                    ctx.fillStyle = `hsla(${s.h},80%,80%,${s.b * twinkle})`;
                    ctx.fillRect(s.x, s.y, s.s / Math.max(1, zoom * 0.5), s.s / Math.max(1, zoom * 0.5));
                }
                tileCount++;
            }
        }

        // ── 2. NEBULA GLOW (at low zoom) ──
        if(zoom < 0.05) {
            ctx.globalCompositeOperation = 'screen';
            [[0,0,'rgba(40,10,80,0.3)'],[5000,-3000,'rgba(10,40,80,0.2)'],[-4000,4000,'rgba(80,20,20,0.2)']].forEach(([nx,ny,nc]) => {
                const g = ctx.createRadialGradient(nx,ny,0,nx,ny,8000);
                g.addColorStop(0, nc); g.addColorStop(1, 'transparent');
                ctx.fillStyle = g; ctx.fillRect(nx-8000,ny-8000,16000,16000);
            });
            ctx.globalCompositeOperation = 'source-over';
        }

        // ── 3. CONSTELLATIONS ──
        if(zoom > 0.003 && zoom < 3) {
            for(const c of CONSTELLATIONS) {
                // Check if constellation is in view
                if(c.cx < vl - 5000 || c.cx > vr + 5000 || c.cy < vt - 5000 || c.cy > vb + 5000) continue;

                // Lines
                ctx.strokeStyle = `rgba(100,150,255,${Math.min(0.5, zoom * 5)})`;
                ctx.lineWidth = 2 / zoom;
                ctx.beginPath();
                for(const [a,b] of c.lines) {
                    ctx.moveTo(c.stars[a].x, c.stars[a].y);
                    ctx.lineTo(c.stars[b].x, c.stars[b].y);
                }
                ctx.stroke();

                // Stars
                for(const s of c.stars) {
                    const isHovered = hoveredStar === s;
                    const r = (s.s + (isHovered ? 4 : 0)) / Math.max(0.3, Math.sqrt(zoom));
                    
                    // Glow
                    ctx.shadowBlur = isHovered ? 30/zoom : 15/zoom;
                    ctx.shadowColor = s.color;
                    ctx.fillStyle = s.color;
                    ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI*2); ctx.fill();
                    ctx.shadowBlur = 0;

                    // Label
                    if(zoom > 0.01) {
                        ctx.fillStyle = isHovered ? '#fff' : 'rgba(255,255,255,0.6)';
                        const fs = Math.max(10, Math.min(50, 14/zoom));
                        ctx.font = `${isHovered ? 'bold ' : ''}${fs}px Inter,sans-serif`;
                        ctx.textAlign = 'left';
                        ctx.fillText(s.name, s.x + r + 8/zoom, s.y + 5/zoom);
                        if(isHovered && zoom > 0.02) {
                            ctx.fillStyle = 'rgba(200,200,255,0.5)';
                            ctx.font = `${fs * 0.7}px Inter,sans-serif`;
                            ctx.fillText(`${s.type} • Mag ${s.mag}`, s.x + r + 8/zoom, s.y + 5/zoom + fs*1.2);
                            if(s.planets > 0) ctx.fillText(`${s.planets} exoplanet${s.planets>1?'s':''}  — Click to explore`, s.x + r + 8/zoom, s.y + 5/zoom + fs*2.2);
                        }
                    }
                }

                // Constellation name
                if(zoom > 0.005 && zoom < 0.5) {
                    ctx.fillStyle = 'rgba(255,255,255,0.25)';
                    ctx.font = `bold ${60/zoom}px Inter,sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillText(c.name, c.cx, c.cy - 2000);
                }
            }
        }

        // ── 4. EXOPLANET SYSTEMS (when zoomed into a constellation star) ──
        if(zoom > 5) {
            for(const c of CONSTELLATIONS) {
                for(const s of c.stars) {
                    if(s.planets <= 0) continue;
                    const dd = Math.hypot(cx - s.x, cy - s.y);
                    if(dd > 200) continue;

                    // Draw star as a sun
                    const sg = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, 15);
                    sg.addColorStop(0, '#fff');
                    sg.addColorStop(0.5, s.color);
                    sg.addColorStop(1, 'transparent');
                    ctx.fillStyle = sg;
                    ctx.beginPath(); ctx.arc(s.x, s.y, 15, 0, Math.PI*2); ctx.fill();

                    // Draw exoplanets
                    const exos = genExoSystem(s);
                    for(const ep of exos) {
                        ep.a -= ep.v;
                        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                        ctx.lineWidth = 0.5/zoom;
                        ctx.beginPath(); ctx.arc(s.x, s.y, ep.d, 0, Math.PI*2); ctx.stroke();
                        const px = s.x + Math.cos(ep.a) * ep.d;
                        const py = s.y + Math.sin(ep.a) * ep.d;
                        ctx.fillStyle = ep.c;
                        ctx.beginPath(); ctx.arc(px, py, ep.s, 0, Math.PI*2); ctx.fill();
                        if(zoom > 10) {
                            ctx.fillStyle = '#aaa';
                            ctx.font = `${1}px Inter`;
                            ctx.textAlign = 'left';
                            ctx.fillText(ep.name, px + ep.s + 2, py + 1);
                        }
                    }

                    // Star name and info
                    ctx.fillStyle = '#fff';
                    ctx.font = `${2}px Inter,sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillText(`${s.name} System`, s.x, s.y - 25);
                }
            }
        }

        // ── 5. SOLAR SYSTEM (our Sun at 0,0) ──
        if(zoom > 0.05) {
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.lineWidth = 1/zoom;
            for(const p of planets) { ctx.beginPath(); ctx.arc(0,0,p.d,0,Math.PI*2); ctx.stroke(); }

            // Sun
            const rg = ctx.createRadialGradient(0,0,sun.r*0.1,0,0,sun.r*2);
            rg.addColorStop(0,'#fff'); rg.addColorStop(0.5,sun.color); rg.addColorStop(1,'transparent');
            ctx.fillStyle = rg;
            ctx.beginPath(); ctx.arc(0,0,sun.r*2,0,Math.PI*2); ctx.fill();

            if(zoom > 0.3) {
                ctx.fillStyle = '#fff';
                ctx.font = `${14/zoom}px Inter`;
                ctx.textAlign = 'center';
                ctx.fillText('Sun', 0, -sun.r*2 - 10/zoom);
            }

            for(const p of planets) {
                p.a -= p.v;
                const px = Math.cos(p.a)*p.d, py = Math.sin(p.a)*p.d;
                ctx.save(); ctx.translate(px,py);
                if(p.hasRings) {
                    ctx.strokeStyle='rgba(200,200,180,0.4)'; ctx.lineWidth=3/zoom;
                    ctx.beginPath(); ctx.ellipse(0,0,p.s+15,p.s+5,Math.PI/4,0,Math.PI*2); ctx.stroke();
                }
                ctx.fillStyle = p.c;
                ctx.beginPath(); ctx.arc(0,0,p.s,0,Math.PI*2); ctx.fill();
                if(p.moon && zoom > 0.5) {
                    const ma = time * 0.05;
                    ctx.fillStyle = '#ccc';
                    ctx.beginPath(); ctx.arc(Math.cos(ma)*12, Math.sin(ma)*12, 2, 0, Math.PI*2); ctx.fill();
                }
                if(zoom > 0.5) {
                    ctx.fillStyle='#fff'; ctx.font=`${14/zoom}px Inter`; ctx.textAlign='center';
                    ctx.fillText(p.name, 0, -p.s-10/zoom);
                }
                ctx.restore();
            }
        }

        ctx.restore();

        // ── HUD Overlay ──
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(0, 0, w, 1);
        ctx.fillRect(0, h-1, w, 1);

        requestAnimationFrame(draw);
    }

    // Start zoomed out for the galaxy experience
    setTimeout(() => { zoomTarget = 0.02; }, 500);
    requestAnimationFrame(draw);
})();
