'use strict';
(function() {
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    if(typeof QU !== 'undefined') QU.init({ kofi: true, theme: true });

    const container = $('#container');
    const svg = $('#wireLayer');

    let components = {};
    let wires = [];
    let compIdCounter = 0;
    
    let simClock = false; // The global 'Clock' state
    let simInterval = null;

    // State machine logic
    const LOGIC = {
        and: (inps) => (inps[0] && inps[1]) ? 1 : 0,
        or:  (inps) => (inps[0] || inps[1]) ? 1 : 0,
        not: (inps) => inps[0] ? 0 : 1,
        xor: (inps) => (inps[0] ^ inps[1]) ? 1 : 0,
        nand:(inps) => !(inps[0] && inps[1]) ? 1 : 0,
        nor: (inps) => !(inps[0] || inps[1]) ? 1 : 0,
    };

    function addComponent(type, x, y) {
        const id = 'c_' + compIdCounter++;
        let el = document.createElement('div');
        el.className = `comp-node comp-${type}`;
        el.id = id;
        el.style.left = x + 'px';
        el.style.top = y + 'px';

        let name = type.toUpperCase();
        let inC = 2, outC = 1;
        let isSpecial = false;

        if(type === 'not') inC = 1;
        if(type === 'switch' || type === 'clock') { inC = 0; outC = 1; isSpecial = true; }
        if(type === 'bulb') { inC = 1; outC = 0; isSpecial = true; }
        if(type === 'dff') { inC = 2; outC = 2; name = "D-FF"; } // Data, Clock -> Q, !Q
        if(type === 'seg7') { inC = 4; outC = 0; name = "7-SEG"; }

        let inHTML = '', outHTML = '';
        for(let i=0; i<inC; i++) inHTML += `<div class="port port-in" data-cid="${id}" data-pid="${i}" data-state="0"></div>`;
        for(let i=0; i<outC; i++) outHTML += `<div class="port port-out" data-cid="${id}" data-pid="${i}" data-state="0"></div>`;

        let midHTML = `<div class="comp-label">${name}</div>`;
        if(type === 'switch') midHTML = `<div class="switch-btn"></div>`;
        if(type === 'bulb') midHTML = `<div class="bulb-indicator"></div>`;

        el.innerHTML = `
            <div class="comp-controls"><button class="btn-del">✕</button></div>
            <div class="ports-in">${inHTML}</div>
            ${midHTML}
            <div class="ports-out">${outHTML}</div>
        `;

        container.appendChild(el);

        components[id] = {
            id, type, el,
            ins: Array(inC).fill(0),
            outs: Array(outC).fill(0),
            mem: 0 // for flip flops
        };

        // Events
        el.querySelector('.btn-del').onclick = () => removeComponent(id);
        
        let label = el.querySelector('.comp-label') || el.querySelector('.switch-btn') || el.querySelector('.bulb-indicator');
        label.addEventListener('mousedown', e => {
            if(type === 'switch') {
                let s = components[id].outs[0] === 1 ? 0 : 1;
                components[id].outs[0] = s;
                el.dataset.on = s;
            }
            dragNode(e, id);
        });

        el.querySelectorAll('.port').forEach(p => {
            p.onmousedown = e => { e.stopPropagation(); startWiring(p); };
            p.onmouseup = e => { e.stopPropagation(); endWiring(p); };
        });

        updateUI();
    }

    function removeComponent(id) {
        components[id].el.remove();
        delete components[id];
        wires = wires.filter(w => {
            if(w.sc === id || w.dc === id) { w.el.remove(); return false; }
            return true;
        });
    }

    // Dragging Nodes
    let activeDrag = null;
    let offset = {x:0, y:0};
    function dragNode(e, id) {
        let el = components[id].el;
        activeDrag = id;
        let rect = el.getBoundingClientRect();
        offset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        el.style.zIndex = 30;
    }
    
    // Wiring
    let wiringMode = null; // { portEl, isOut, cid, pid }
    let tempWire = null;

    function startWiring(portEl) {
        wiringMode = {
            el: portEl,
            isOut: portEl.classList.contains('port-out'),
            cid: portEl.dataset.cid,
            pid: portEl.dataset.pid
        };
        tempWire = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tempWire.setAttribute('class', 'wire');
        svg.appendChild(tempWire);
    }

    function endWiring(portEl) {
        if(!wiringMode) return;
        let isOut = portEl.classList.contains('port-out');
        if(wiringMode.isOut !== isOut && wiringMode.cid !== portEl.dataset.cid) {
            let src = wiringMode.isOut ? wiringMode : {el:portEl, cid:portEl.dataset.cid, pid:portEl.dataset.pid};
            let dst = wiringMode.isOut ? {el:portEl, cid:portEl.dataset.cid, pid:portEl.dataset.pid} : wiringMode;
            
            // Check existing at destination (1 input can only have 1 wire)
            let exist = wires.findIndex(w => w.dc === dst.cid && w.dp === dst.pid);
            if(exist !== -1) { wires[exist].el.remove(); wires.splice(exist, 1); }

            let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('class', 'wire');
            svg.appendChild(path);
            
            let wObj = { sc:src.cid, sp:src.pid, dc:dst.cid, dp:dst.pid, sel:src.el, del:dst.el, el:path, state:0 };
            wires.push(wObj);
            
            path.onclick = () => { path.remove(); wires = wires.filter(w=>w!==wObj); components[wObj.dc].ins[wObj.dp] = 0; };
        }
        if(tempWire) { tempWire.remove(); tempWire = null; }
        wiringMode = null;
        updateWires();
    }

    window.addEventListener('mousemove', e => {
        if(activeDrag) {
            let el = components[activeDrag].el;
            el.style.left = (e.clientX - offset.x) + 'px';
            el.style.top = (e.clientY - offset.y) + 'px';
            updateWires();
        }
        if(wiringMode && tempWire) {
            let r = wiringMode.el.getBoundingClientRect();
            drawPath(tempWire, r.left+6, r.top+6, e.clientX, e.clientY);
        }
    });

    window.addEventListener('mouseup', () => {
        if(activeDrag) { components[activeDrag].el.style.zIndex = 20; activeDrag = null; }
        if(tempWire) { tempWire.remove(); tempWire = null; wiringMode = null; }
    });

    function drawPath(el, x1, y1, x2, y2) {
        let dx = Math.abs(x2 - x1) * 0.5;
        el.setAttribute('d', `M${x1},${y1} C${x1+dx},${y1} ${x2-dx},${y2} ${x2},${y2}`);
    }

    function updateWires() {
        wires.forEach(w => {
            let r1 = w.sel.getBoundingClientRect();
            let r2 = w.del.getBoundingClientRect();
            drawPath(w.el, r1.left+6, r1.top+6, r2.left+6, r2.top+6);
            w.el.dataset.state = w.state;
            w.sel.dataset.state = w.state;
            w.del.dataset.state = w.state;
        });
    }

    // Simulation Loop
    function simulate() {
        // Reset Inputs
        Object.values(components).forEach(c => c.ins.fill(0));
        
        // Propagate signals along wires
        wires.forEach(w => {
            let val = components[w.sc].outs[w.sp] || 0;
            w.state = val;
            components[w.dc].ins[w.dp] = val;
        });

        // Evaluate Logic
        Object.values(components).forEach(c => {
            if(LOGIC[c.type]) {
                c.outs[0] = LOGIC[c.type](c.ins);
            }
            else if(c.type === 'clock') {
                c.outs[0] = simClock ? 1 : 0;
            }
            else if(c.type === 'bulb') {
                c.el.dataset.on = c.ins[0] ? 1 : 0;
            }
            else if(c.type === 'dff') {
                // clk is ins[1], data is ins[0]
                // positive edge trigger logic is complex without history, fallback to level trigger for simplicity in this tick model.
                if(c.ins[1] === 1) c.mem = c.ins[0];
                c.outs[0] = c.mem;
                c.outs[1] = c.mem ? 0 : 1;
            }
            else if(c.type === 'seg7') {
                // simple hex out
                let val = c.ins[0]*8 + c.ins[1]*4 + c.ins[2]*2 + c.ins[3]*1;
                c.el.querySelector('.comp-label').textContent = val.toString(16).toUpperCase();
            }
            // Update out ports DOM
            let outPorts = c.el.querySelectorAll('.port-out');
            outPorts.forEach((p, i) => p.dataset.state = c.outs[i]);
        });

        updateWires();
    }

    // Global toggle clock
    function toggleClock() {
        simClock = !simClock;
        $('#clockStatus').textContent = simClock ? "High" : "Low";
        $('#clockStatus').className = simClock ? "text-neon-green" : "text-danger";
        simulate();
    }
    
    // Master loop (evaluates combinational logic continuously, and slow clock separately if needed)
    setInterval(simulate, 50); // High frequency eval for stability
    setInterval(() => {
        // Auto clock toggle every 1s
        simClock = !simClock;
        $('#clockStatus').textContent = simClock ? "High" : "Low";
        $('#clockStatus').className = simClock ? "text-neon-green" : "text-danger";
    }, 1000);

    // Initial setup
    $('#btnClock').onclick = toggleClock;
    $('#btnClear').onclick = () => { container.innerHTML = ''; svg.innerHTML = ''; components = {}; wires = []; };
    
    $$('.btn-tool').forEach(btn => {
        if(btn.dataset.type) {
            btn.onclick = () => addComponent(btn.dataset.type, window.innerWidth/2, window.innerHeight/2);
        }
    });

})();
