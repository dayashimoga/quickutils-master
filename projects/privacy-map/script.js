'use strict';
(function() {
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    if(typeof QU !== 'undefined') QU.init({ kofi: true, theme: true });

    const canvas = $('#globeCanvas');
    const ctx = canvas.getContext('2d');
    const wrapper = $('.globe-panel');
    
    let width = wrapper.clientWidth;
    let height = wrapper.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const projection = d3.geoOrthographic()
        .scale(Math.min(width, height) / 2.2)
        .translate([width / 2, height / 2])
        .precision(0.1);

    const path = d3.geoPath().projection(projection).context(ctx);

    let worldData = null;
    let land = null;
    let borders = null;

    let rotation = [0, -15, 0]; // lon, lat, roll
    let isDragging = false;
    let dragStart = null;
    let rotStart = null;

    let mode = 'breach'; // breach, laws, trackers
    let nodes = [];
    
    // UI Elements
    const tt = $('#tooltip');
    const feed = $('#liveFeed');

    // Fetch minimal map data
    d3.json("https://unpkg.com/world-atlas@2/countries-110m.json").then(world => {
        worldData = world;
        land = topojson.feature(world, world.objects.land);
        borders = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
        generateNodes();
        startSim();
    });

    window.addEventListener('resize', () => {
        width = wrapper.clientWidth;
        height = wrapper.clientHeight;
        canvas.width = width;
        canvas.height = height;
        projection.translate([width / 2, height / 2])
                  .scale(Math.min(width, height) / 2.2);
    });

    canvas.addEventListener('mousedown', e => {
        isDragging = true;
        dragStart = [e.clientX, e.clientY];
        rotStart = [...rotation];
    });

    window.addEventListener('mouseup', () => isDragging = false);
    
    window.addEventListener('mousemove', e => {
        if(isDragging) {
            const dx = e.clientX - dragStart[0];
            const dy = e.clientY - dragStart[1];
            rotation[0] = rotStart[0] + dx * 0.5;
            rotation[1] = Math.max(-90, Math.min(90, rotStart[1] - dy * 0.5));
        } else {
            // Hover detection
            const [x, y] = [e.clientX - wrapper.getBoundingClientRect().left, e.clientY - wrapper.getBoundingClientRect().top];
            let hit = null;
            for(let n of nodes) {
                if(n.mode !== mode && mode !== 'all') continue;
                // project coordinates
                const p = projection([n.lon, n.lat]);
                if(!p) continue;
                // check if it's on front half
                const center = projection.invert([width/2, height/2]);
                const dist = d3.geoDistance(center, [n.lon, n.lat]);
                if (dist > 1.57) continue; // > 90 deg means back of globe
                
                if (Math.hypot(p[0] - x, p[1] - y) < n.r + 5) {
                    hit = n;
                    break;
                }
            }
            
            if(hit) {
                tt.style.opacity = 1;
                tt.style.left = e.clientX + 15 + "px";
                tt.style.top = e.clientY + 15 + "px";
                tt.innerHTML = `<strong>${hit.title}</strong><br><span style="color:#aaa">${hit.desc}</span>`;
                canvas.style.cursor = 'pointer';
            } else {
                tt.style.opacity = 0;
                canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
            }
        }
    });

    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        const sc = projection.scale();
        projection.scale(Math.max(100, Math.min(1000, sc - e.deltaY * 0.5)));
    });

    function generateNodes() {
        // Random coords for breaches
        for(let i=0; i<30; i++) {
            nodes.push({
                mode: 'breach',
                lon: (Math.random()-0.5)*360,
                lat: (Math.random()-0.5)*160,
                r: Math.random()*4 + 2,
                color: '#ef4444',
                title: `Corporate Breach #${Math.floor(Math.random()*10000)}`,
                desc: `${Math.floor(Math.random()*50)+1}M records exposed`,
                ping: 0
            });
        }
        // Trackers
        for(let i=0; i<100; i++) {
            nodes.push({
                mode: 'trackers',
                lon: (Math.random()-0.5)*360,
                lat: (Math.random()-0.5)*160,
                r: 1.5,
                color: '#3b82f6',
                title: `Ad Node`,
                desc: `Tracking pixel relay`,
                ping: 0
            });
        }
        // Laws
        nodes.push({ mode: 'laws', lon: 10, lat: 50, r: 6, color: '#10b981', title: 'GDPR (EU)', desc: 'Strict Privacy Protections' });
        nodes.push({ mode: 'laws', lon: -120, lat: 37, r: 5, color: '#10b981', title: 'CCPA (California)', desc: 'Consumer Privacy Act' });
        nodes.push({ mode: 'laws', lon: 135, lat: -25, r: 5, color: '#facc15', title: 'Privacy Act (AU)', desc: 'Moderate Protections' });
    }

    function addFeedMsg(msg, lvl) {
        const d = document.createElement('div');
        d.className = `feed-item alert-${lvl}`;
        const time = new Date().toLocaleTimeString();
        d.innerHTML = `[${time}] ${msg}`;
        feed.prepend(d);
        if(feed.children.length > 20) feed.lastChild.remove();
    }

    $('#btnBreaches').onclick = e => { setMode('breach', e.target); };
    $('#btnLaws').onclick = e => { setMode('laws', e.target); };
    $('#btnTrackers').onclick = e => { setMode('trackers', e.target); };

    function setMode(m, btn) {
        mode = m;
        $$('.filter-group .btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        $('#countryInfo').style.display = 'none';
    }

    function startSim() {
        requestAnimationFrame(draw);
        setInterval(() => {
            if(mode === 'breach' && Math.random() < 0.3) {
                const regs = ["NA", "EU", "APAC", "LATAM"];
                addFeedMsg(`Unauthorized DB Access detected in ${regs[Math.floor(Math.random()*4)]} region`, 'high');
            } else if (mode === 'trackers' && Math.random() < 0.8) {
                addFeedMsg(`Syncing 10k tracking cookies...`, 'low');
            }
        }, 2000);
    }

    let time = 0;
    function draw() {
        time += 0.05;
        if(!isDragging) {
            rotation[0] += 0.1; // auto rotate
        }
        projection.rotate(rotation);

        ctx.clearRect(0, 0, width, height);

        // Ocean Base
        ctx.beginPath();
        path({type: "Sphere"});
        ctx.fillStyle = '#1e293b'; // Ocean color
        ctx.fill();

        // Land
        if(land) {
            ctx.beginPath();
            path(land);
            ctx.fillStyle = '#0f172a';
            ctx.fill();
        }

        // Borders
        if(borders) {
            ctx.beginPath();
            path(borders);
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw Nodes
        const center = projection.invert([width/2, height/2]);
        
        nodes.forEach(n => {
            if(n.mode !== mode && mode !== 'all') return;
            
            // Check if on visible side of globe
            const dist = d3.geoDistance(center, [n.lon, n.lat]);
            if (dist > 1.57) return;

            const p = projection([n.lon, n.lat]);
            if(!p) return;

            ctx.beginPath();
            ctx.arc(p[0], p[1], n.r, 0, 2*Math.PI);
            ctx.fillStyle = n.color;
            ctx.fill();
            
            // Ping effect
            if(Math.random() < 0.01) n.ping = 1;
            if(n.ping > 0) {
                n.ping -= 0.02;
                ctx.beginPath();
                ctx.arc(p[0], p[1], n.r + (1-n.ping)*15, 0, 2*Math.PI);
                ctx.strokeStyle = n.color;
                ctx.globalAlpha = Math.max(0, n.ping);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        });

        // Atmospheric glowing edge (inner shadow trick)
        ctx.beginPath();
        path({type: "Sphere"});
        const grad = ctx.createRadialGradient(width/2, height/2, projection.scale()*0.8, width/2, height/2, projection.scale());
        grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0.4)'); // blue atmospheric rim
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.stroke();

        requestAnimationFrame(draw);
    }

})();
