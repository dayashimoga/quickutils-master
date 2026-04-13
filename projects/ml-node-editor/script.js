'use strict';
(function() {
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    if(typeof QU !== 'undefined') QU.init({ kofi: true, theme: true });

    const canvas = $('#nodeCanvas');
    const svg = $('#wiresSvg');

    let nodes = [];
    let wires = [];
    let nodeCounter = 0;

    // Dragging state
    let draggedNode = null;
    let dragOffset = {x:0, y:0};
    
    // Wiring state
    let wiringPort = null; // {nodeId, portId, isOut, el}
    let tempWire = null; // svg path element

    function createNode(type, x, y) {
        nodeCounter++;
        const id = 'node_' + nodeCounter;
        
        const el = document.createElement('div');
        el.className = 'ml-node';
        el.dataset.type = type;
        el.id = id;
        el.style.left = x + 'px';
        el.style.top = y + 'px';

        let name = "Node";
        let inPorts = 1, outPorts = 1;
        
        switch(type) {
            case 'input': name = "Input Vector"; inPorts = 0; outPorts = 1; break;
            case 'dense': name = "Dense Layer"; inPorts = 1; outPorts = 1; break;
            case 'relu': name = "ReLU Act."; inPorts = 1; outPorts = 1; break;
            case 'output': name = "Output"; inPorts = 1; outPorts = 0; break;
        }

        let inHTML = '', outHTML = '';
        for(let i=0; i<inPorts; i++) {
            inHTML += `<div class="port"><div class="port-dot in-port" data-nid="${id}" data-pid="in_${i}"></div><span>In</span></div>`;
        }
        for(let i=0; i<outPorts; i++) {
            outHTML += `<div class="port"><<span>Out</span><div class="port-dot out-port" data-nid="${id}" data-pid="out_${i}"></div></div>`;
        }

        el.innerHTML = `
            <div class="node-header">
                <span>${name}</span>
                <span style="color:#aaa; cursor:pointer;" onclick="this.parentElement.parentElement.remove(); window.removeNode('${id}')">✕</span>
            </div>
            <div class="node-body">
                <div class="port-col port-in">${inHTML}</div>
                <div class="port-col port-out">${outHTML}</div>
            </div>
        `;

        canvas.appendChild(el);
        nodes.push({ id, type, inputs: [], outputs: [] });

        // Drag events
        const header = el.querySelector('.node-header');
        header.addEventListener('mousedown', e => {
            if(e.target.tagName === 'SPAN' && e.target.textContent === '✕') return;
            draggedNode = el;
            const rect = el.getBoundingClientRect();
            dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            el.style.zIndex = 25;
        });

        // Port events
        el.querySelectorAll('.port-dot').forEach(p => {
            p.addEventListener('mousedown', e => {
                e.stopPropagation();
                wiringPort = {
                    nodeId: p.dataset.nid,
                    portId: p.dataset.pid,
                    isOut: p.classList.contains('out-port'),
                    el: p
                };
                tempWire = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                tempWire.setAttribute('class', 'wire-path');
                svg.appendChild(tempWire);
            });
            p.addEventListener('mouseup', e => {
                e.stopPropagation();
                if(wiringPort && wiringPort.nodeId !== p.dataset.nid) {
                    if(wiringPort.isOut !== p.classList.contains('out-port')) {
                        // valid connection
                        let src = wiringPort.isOut ? wiringPort : {nodeId: p.dataset.nid, portId: p.dataset.pid, el: p};
                        let dst = wiringPort.isOut ? {nodeId: p.dataset.nid, portId: p.dataset.pid, el: p} : wiringPort;
                        
                        addWire(src.nodeId, src.portId, dst.nodeId, dst.portId, src.el, dst.el);
                    }
                }
                clearTempWire();
            });
        });
    }

    // Global expose for delete
    window.removeNode = function(id) {
        nodes = nodes.filter(n => n.id !== id);
        // remove connected wires
        wires = wires.filter(w => {
            if(w.srcNode === id || w.dstNode === id) {
                w.el.remove(); return false;
            }
            return true;
        });
    };

    function addWire(srcNode, srcPort, dstNode, dstPort, srcEl, dstEl) {
        // Prevent dupes
        if(wires.find(w => w.srcNode === srcNode && w.dstNode === dstNode)) return;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'wire-path');
        svg.appendChild(path);

        const wireObj = { srcNode, srcPort, dstNode, dstPort, srcEl, dstEl, el: path };
        wires.push(wireObj);
        
        path.onclick = () => {
            path.remove();
            wires = wires.filter(w => w !== wireObj);
        };
        
        updateWires();
    }

    function clearTempWire() {
        if(tempWire) { tempWire.remove(); tempWire = null; }
        wiringPort = null;
    }

    window.addEventListener('mousemove', e => {
        if(draggedNode) {
            let x = e.clientX - dragOffset.x;
            let y = e.clientY - dragOffset.y;
            draggedNode.style.left = x + 'px';
            draggedNode.style.top = y + 'px';
            updateWires();
        }
        if(wiringPort && tempWire) {
            const rect = wiringPort.el.getBoundingClientRect();
            const sx = rect.left + rect.width/2;
            const sy = rect.top + rect.height/2;
            drawSpline(tempWire, sx, sy, e.clientX, e.clientY);
        }
    });

    window.addEventListener('mouseup', () => {
        if(draggedNode) { draggedNode.style.zIndex = 20; draggedNode = null; }
        clearTempWire();
    });

    function drawSpline(pathEl, x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1) * 0.5;
        const cp1x = x1 + dx;
        const cp2x = x2 - dx;
        pathEl.setAttribute('d', `M${x1},${y1} C${cp1x},${y1} ${cp2x},${y2} ${x2},${y2}`);
    }

    function updateWires() {
        wires.forEach(w => {
            const r1 = w.srcEl.getBoundingClientRect();
            const r2 = w.dstEl.getBoundingClientRect();
            drawSpline(w.el, r1.left + r1.width/2, r1.top + r1.height/2, r2.left + r2.width/2, r2.top + r2.height/2);
        });
    }

    $$('.add-node').forEach(btn => {
        btn.onclick = () => {
            // Drop in center roughly
            createNode(btn.dataset.type, window.innerWidth/2 - 80, window.innerHeight/2 - 50);
        };
    });

    $('#btnClear').onclick = () => {
        document.querySelectorAll('.ml-node').forEach(n => n.remove());
        svg.innerHTML = '';
        nodes = [];
        wires = [];
        nodeCounter = 0;
    };

    // Forward propagation animation
    $('#btnTrain').onclick = () => {
        if(wires.length === 0) return alert("Wire some nodes first!");
        
        // Find inputs
        const inputNodes = nodes.filter(n => n.type === 'input');
        if(inputNodes.length === 0) return alert("Needs an Input node.");

        function animatePulse(wire) {
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('r', '5');
            dot.setAttribute('class', 'pulse-dot');
            svg.appendChild(dot);

            const pathLen = wire.el.getTotalLength();
            let start = null;
            const duration = 1000;

            function step(timestamp) {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                const percent = Math.min(progress / duration, 1);
                
                const pt = wire.el.getPointAtLength(percent * pathLen);
                dot.setAttribute('cx', pt.x);
                dot.setAttribute('cy', pt.y);
                
                // Fade in/out
                if(percent < 0.2) dot.style.opacity = percent * 5;
                else if(percent > 0.8) dot.style.opacity = (1-percent) * 5;
                else dot.style.opacity = 1;

                if (progress < duration) {
                    requestAnimationFrame(step);
                } else {
                    dot.remove();
                    // trigger next wires
                    const nextWires = wires.filter(w => w.srcNode === wire.dstNode);
                    nextWires.forEach(nw => setTimeout(() => animatePulse(nw), 100)); // slight delay
                    
                    // visual bounce on target node
                    const nEl = document.getElementById(wire.dstNode);
                    if(nEl) {
                        nEl.style.transform = 'scale(1.05)';
                        setTimeout(() => nEl.style.transform = 'none', 150);
                    }
                }
            }
            requestAnimationFrame(step);
        }

        // Start from wires connected to inputs
        const initialWires = wires.filter(w => inputNodes.find(inp => inp.id === w.srcNode));
        initialWires.forEach(w => animatePulse(w));
    };

    // Init basic demo setup
    createNode('input', 300, 300);
    createNode('dense', 550, 200);
    createNode('dense', 550, 400);
    createNode('output', 800, 300);

})();
