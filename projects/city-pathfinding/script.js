'use strict';
(function() {
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    if(typeof QU !== 'undefined') QU.init({ kofi: true, theme: true });

    const canvas = $('#cityCanvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    const wrapper = $('.canvas-region');

    let cw = wrapper.clientWidth;
    let ch = wrapper.clientHeight;
    
    // Grid config
    const ts = 20; // Tile size
    let cols = Math.ceil(cw / ts);
    let rows = Math.ceil(ch / ts);
    
    // MAP DATA: 0=Empty, 1=Road, 2=House, 3=Work
    let grid = new Uint8Array(cols * rows);
    // congestion weight map: holds number of cars on this tile
    let congestion = new Uint8Array(cols * rows); 
    
    let activeTool = 'road';
    let isDrawing = false;
    let isPlaying = true;
    let timeSpeed = 5;
    let globalTime = 0; // 0-2400 (pseudo time)
    
    const agents = [];

    function resize() {
        cw = wrapper.clientWidth;
        ch = wrapper.clientHeight;
        canvas.width = cw;
        canvas.height = ch;
        
        let nc = Math.ceil(cw / ts);
        let nr = Math.ceil(ch / ts);
        let nGrid = new Uint8Array(nc * nr);
        let nCong = new Uint8Array(nc * nr);
        
        // Copy old grid data if resizing
        for(let r=0; r<Math.min(rows, nr); r++) {
            for(let c=0; c<Math.min(cols, nc); c++) {
                nGrid[r*nc + c] = grid[r*cols + c];
                nCong[r*nc + c] = congestion[r*cols + c];
            }
        }
        grid = nGrid;
        congestion = nCong;
        cols = nc;
        rows = nr;
    }
    
    window.addEventListener('resize', resize);
    resize();

    // -- Tools --
    $$('.city-tool').forEach(btn => {
        btn.onclick = () => {
            $$('.city-tool').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeTool = btn.dataset.tool;
        };
    });

    $('#playBtn').onclick = () => {
        isPlaying = !isPlaying;
        $('#playBtn').textContent = isPlaying ? "Pause" : "Resume";
    };

    $('#clearBtn').onclick = () => {
        grid.fill(0);
        congestion.fill(0);
        agents.length = 0;
        updateUI();
    };

    $('#speedSlider').oninput = e => {
        timeSpeed = parseInt(e.target.value);
    };

    $('#demoBtn').onclick = () => {
        grid.fill(0);
        agents.length = 0;
        // Build a demo grid
        for(let r=1; r<rows-1; r++) {
            if(r%5===0) {
                for(let c=1; c<cols-1; c++) grid[r*cols + c] = 1; // horizontal road
            }
        }
        for(let c=1; c<cols-1; c++) {
            if(c%5===0) {
                for(let r=1; r<rows-1; r++) grid[r*cols + c] = 1; // vertical road
            }
        }
        let places = [2,3,2,3,2];
        for(let r=2; r<rows-1; r+=5) {
            for(let c=2; c<cols-1; c+=5) {
                grid[r*cols + c] = 2; // house
                grid[(r+2)*cols + (c+2)] = 3; // work
            }
        }
        generateAgents();
    };

    // Painting logic
    function setTile(x, y, v) {
        if(x<0 || x>=cols || y<0 || y>=rows) return;
        const i = y*cols + x;
        if(grid[i] !== v) {
            grid[i] = v;
            if(v === 2 || v === 3) generateAgents();
        }
    }

    function doPaint(e) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const tx = Math.floor(mx / ts);
        const ty = Math.floor(my / ts);
        
        let v = 0;
        if(activeTool === 'road') v=1;
        else if(activeTool === 'house') v=2;
        else if(activeTool === 'work') v=3;
        
        // Brush size
        setTile(tx, ty, v);
        // if road, draw continuous line? Just simple point for now
    }

    canvas.addEventListener('mousedown', e => { isDrawing = true; doPaint(e); });
    canvas.addEventListener('mousemove', e => { if(isDrawing) doPaint(e); });
    window.addEventListener('mouseup', () => { isDrawing = false; });

    // -- Agent Logic & A* --
    class Agent {
        constructor(hx, hy) {
            this.hx = hx; this.hy = hy; // house
            this.wx = -1; this.wy = -1; // work
            this.x = hx; this.y = hy; // real pos
            this.state = 'at_home'; // at_home, to_work, at_work, to_home
            this.path = [];
            this.color = `hsl(${Math.random()*360}, 80%, 60%)`;
            this.cooldown = Math.random()*100;
        }

        assignWork(wx, wy) { this.wx = wx; this.wy = wy; }
        
        findPath(sx, sy, ex, ey) {
            // Priority queue (dumb array for simplicity due to code limits, but map for open set)
            let open = [{x:sx, y:sy, g:0, h:Math.abs(ex-sx)+Math.abs(ey-sy), p:null}];
            let openMap = new Map();
            openMap.set(`${sx},${sy}`, open[0]);
            let closed = new Set();
            
            while(open.length > 0 && open.length < 2000) { // Limit search to prevent hangs
                // sort by f = g+h
                open.sort((a,b) => (a.g+a.h) - (b.g+b.h));
                let curr = open.shift();
                openMap.delete(`${curr.x},${curr.y}`);
                
                if(curr.x === ex && curr.y === ey) {
                    let p = [];
                    let c = curr;
                    while(c) {
                        p.push({x:c.x, y:c.y});
                        c = c.p;
                    }
                    return p.reverse();
                }
                
                closed.add(`${curr.x},${curr.y}`);
                
                const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
                for(let [dx,dy] of dirs) {
                    let nx = curr.x+dx, ny = curr.y+dy;
                    if(nx>=0 && nx<cols && ny>=0 && ny<rows) {
                        let idx = ny*cols + nx;
                        const t = grid[idx];
                        // Can walk on roads, or the start/end tiles
                        if(t !== 1 && !(nx===ex&&ny===ey) && !(nx===sx&&ny===sy)) continue; 
                        
                        let key = `${nx},${ny}`;
                        if(closed.has(key)) continue;
                        
                        // Congestion increases movement cost greatly
                        let cost = 1 + (congestion[idx]*2);
                        
                        let ng = curr.g + cost;
                        let nh = Math.abs(ex-nx) + Math.abs(ey-ny);
                        
                        let exist = openMap.get(key);
                        if(exist && exist.g <= ng) continue;
                        if(exist) exist.g = ng;
                        else {
                            let nn = {x:nx,y:ny,g:ng,h:nh,p:curr};
                            open.push(nn);
                            openMap.set(key, nn);
                        }
                    }
                }
            }
            return []; // No path
        }
        
        update() {
            if(this.cooldown > 0) { this.cooldown--; return; }
            if(this.wx === -1) return; // No job
            
            // Time schedule:
            // 600-900: Go to work
            // 1700-2000: Go to home
            let hour = globalTime % 2400;
            
            if(this.state === 'at_home' && hour > 600 && hour < 900) {
                this.state = 'to_work';
                this.path = this.findPath(this.hx, this.hy, this.wx, this.wy);
            }
            else if(this.state === 'at_work' && hour > 1700 && hour < 2000) {
                this.state = 'to_home';
                this.path = this.findPath(this.wx, this.wy, this.hx, this.hy);
            }
            
            // Move along path
            if((this.state === 'to_work' || this.state === 'to_home') && this.path.length > 0) {
                let next = this.path[0];
                let idx = next.y*cols + next.x;
                
                // Traffic jam! If there are too many cars on the next tile, wait.
                if (grid[idx] === 1 && congestion[idx] > 2) {
                    this.cooldown = 10;
                    // Recalculate path occasionally if stuck
                    if(Math.random() < 0.1) {
                        let tx = this.state==='to_work'?this.wx:this.hx;
                        let ty = this.state==='to_work'?this.wy:this.hy;
                        this.path = this.findPath(this.x, this.y, tx, ty);
                    }
                    return;
                }
                
                // Move!
                let oldIdx = this.y*cols + this.x;
                if(grid[oldIdx] === 1 && congestion[oldIdx]>0) congestion[oldIdx]--;
                
                this.x = next.x;
                this.y = next.y;
                if(grid[idx] === 1) congestion[idx]++;
                
                this.path.shift();
                
                // Destination reached?
                if(this.path.length === 0) {
                    if(this.state==='to_work') this.state='at_work';
                    else if(this.state==='to_home') this.state='at_home';
                    if(grid[idx]===1 && congestion[idx]>0) congestion[idx]--;
                }
            }
        }
        
        draw() {
            if(this.state === 'at_home' || this.state === 'at_work') return;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x*ts + ts/2, this.y*ts + ts/2, ts/3, 0, Math.PI*2);
            ctx.fill();
        }
    }

    function generateAgents() {
        let houses = [];
        let works = [];
        for(let r=0; r<rows; r++) {
            for(let c=0; c<cols; c++) {
                if(grid[r*cols+c] === 2) houses.push({x:c,y:r});
                if(grid[r*cols+c] === 3) works.push({x:c,y:r});
            }
        }
        
        // Simple assignment: 1 agent per house if there's work
        agents.length = 0;
        let wkIdx = 0;
        for(let h of houses) {
            if(works.length === 0) break;
            let a = new Agent(h.x, h.y);
            let w = works[wkIdx % works.length];
            a.assignWork(w.x, w.y);
            agents.push(a);
            wkIdx++;
            if(agents.length > 1000) break; // Hard limit for perf
        }
        updateUI();
    }

    function updateUI() {
        $('#agentCount').textContent = agents.length;
    }

    // -- Main Loop --
    let lastTime = 0;
    
    function draw() {
        requestAnimationFrame(draw);
        if(!isPlaying) return;
        
        globalTime += timeSpeed;
        
        ctx.fillStyle = '#0f131a';
        ctx.fillRect(0, 0, cw, ch);
        
        // Draw map
        let maxC = 0;
        let totC = 0;
        for(let r=0; r<rows; r++) {
            for(let c=0; c<cols; c++) {
                let v = grid[r*cols+c];
                let cong = congestion[r*cols+c];
                maxC = Math.max(maxC, cong);
                totC += cong;
                
                if(v === 1) { // Road
                    // Map congestion to color
                    if(cong > 0) {
                        let cf = Math.min(1.0, cong / 4.0);
                        ctx.fillStyle = `rgb(${80 + cf*150}, ${80 - cf*50}, ${80 - cf*50})`;
                    } else {
                        ctx.fillStyle = '#222730';
                    }
                    ctx.fillRect(c*ts, r*ts, ts-1, ts-1);
                } 
                else if (v === 2) { // House
                    ctx.fillStyle = '#059669'; // Emerald
                    ctx.fillRect(c*ts + 2, r*ts + 2, ts-4, ts-4);
                }
                else if (v === 3) { // Work
                    ctx.fillStyle = '#2563eb'; // Blue
                    ctx.fillRect(c*ts + 2, r*ts + 2, ts-4, ts-4);
                }
            }
        }
        
        // Draw & Update Agents
        // Update runs multiple times per frame depending on speed to keep them moving
        for(let a of agents) {
            a.update();
            a.draw();
        }
        
        // Update congestion bar
        let avgC = Math.min(100, (totC / Math.max(1, agents.length)) * 20);
        $('#congestionBar').style.width = avgC + '%';
        
        $('#fpsCount').textContent = Math.floor(1000 / (performance.now() - lastTime));
        lastTime = performance.now();
        
        // Time of day visualizer
        let hr = Math.floor((globalTime % 2400) / 100);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '24px JetBrains Mono';
        ctx.fillText(`☀️ Time: ${hr.toString().padStart(2,'0')}:00`, 20, 40);
    }

    // Start
    requestAnimationFrame(draw);

})();
