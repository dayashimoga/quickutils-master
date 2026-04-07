(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ══════════════════════════════════════════
// CIRCUIT DESIGNER ENGINE
// ══════════════════════════════════════════

const canvas = $('#circuitCanvas');
const ctx = canvas.getContext('2d');
const GRID = 20;
let W = canvas.width, H = canvas.height;

// State
let components = [];
let wires = [];
let selectedId = null;
let tool = 'wire'; // wire, select
let dragging = null; // {id, offX, offY}
let wireStart = null; // {x, y}
let wirePreview = null;
let nextId = 1;
let simRunning = false;

// Snap to grid
const snap = v => Math.round(v / GRID) * GRID;

// ── Component Definitions ──
const COMP_DEFS = {
    resistor:    { w: 60, h: 20, pins: [{x:0,y:10},{x:60,y:10}], label:'R', unit:'Ω', defaultVal: 1000, color:'#f59e0b' },
    capacitor:   { w: 40, h: 30, pins: [{x:0,y:15},{x:40,y:15}], label:'C', unit:'F', defaultVal: 0.000001, color:'#3b82f6' },
    inductor:    { w: 60, h: 20, pins: [{x:0,y:10},{x:60,y:10}], label:'L', unit:'H', defaultVal: 0.001, color:'#8b5cf6' },
    led:         { w: 30, h: 30, pins: [{x:0,y:15},{x:30,y:15}], label:'LED', unit:'', defaultVal: 0, color:'#ef4444' },
    diode:       { w: 40, h: 20, pins: [{x:0,y:10},{x:40,y:10}], label:'D', unit:'', defaultVal: 0.7, color:'#6366f1' },
    transistor:  { w: 40, h: 50, pins: [{x:0,y:25},{x:40,y:10},{x:40,y:40}], label:'Q', unit:'', defaultVal: 100, color:'#10b981' },
    battery:     { w: 30, h: 40, pins: [{x:15,y:0},{x:15,y:40}], label:'V', unit:'V', defaultVal: 9, color:'#f97316' },
    ground:      { w: 30, h: 20, pins: [{x:15,y:0}], label:'GND', unit:'', defaultVal: 0, color:'#6b7280' },
    switch:      { w: 50, h: 20, pins: [{x:0,y:10},{x:50,y:10}], label:'SW', unit:'', defaultVal: 1, color:'#eab308' },
    voltmeter:   { w: 30, h: 30, pins: [{x:0,y:15},{x:30,y:15}], label:'V', unit:'V', defaultVal: 0, color:'#06b6d4' },
    ammeter:     { w: 30, h: 30, pins: [{x:0,y:15},{x:30,y:15}], label:'A', unit:'A', defaultVal: 0, color:'#ec4899' },
    opamp:       { w: 50, h: 40, pins: [{x:0,y:10},{x:0,y:30},{x:50,y:20}], label:'OpA', unit:'', defaultVal: 100000, color:'#a855f7' },
};

// ── Create Component ──
function createComponent(type, x, y) {
    const def = COMP_DEFS[type];
    if (!def) return null;
    const comp = {
        id: nextId++,
        type, x: snap(x), y: snap(y),
        w: def.w, h: def.h,
        rotation: 0,
        value: def.defaultVal,
        pins: def.pins.map(p => ({...p})),
        simVoltage: 0,
        simCurrent: 0,
        state: type === 'switch' ? false : (type === 'led' ? false : null)
    };
    components.push(comp);
    selectedId = comp.id;
    updatePropsPanel();
    render();
    return comp;
}

// ── Get absolute pin positions ──
function getPinPositions(comp) {
    const def = COMP_DEFS[comp.type];
    return def.pins.map(p => {
        let px = p.x, py = p.y;
        if (comp.rotation === 90)  { px = comp.h - p.y; py = p.x; }
        if (comp.rotation === 180) { px = comp.w - p.x; py = comp.h - p.y; }
        if (comp.rotation === 270) { px = p.y; py = comp.w - p.x; }
        return { x: comp.x + px, y: comp.y + py };
    });
}

// ── Rendering ──
function render() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    wires.forEach(w => drawWire(w));
    if (wirePreview) {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'var(--accent)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(wirePreview.x1, wirePreview.y1);
        ctx.lineTo(wirePreview.x2, wirePreview.y1);
        ctx.lineTo(wirePreview.x2, wirePreview.y2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    components.forEach(c => drawComponent(c));
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += GRID) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += GRID) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
}

function drawWire(w) {
    ctx.strokeStyle = simRunning ? (w.current > 0 ? '#10b981' : '#4b5563') : '#60a5fa';
    ctx.lineWidth = simRunning && w.current > 0 ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(w.x1, w.y1);
    // L-shaped routing
    ctx.lineTo(w.x2, w.y1);
    ctx.lineTo(w.x2, w.y2);
    ctx.stroke();
    // Junction dots
    ctx.fillStyle = ctx.strokeStyle;
    [{ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 }].forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    });
    // Current arrow if simulating
    if (simRunning && w.current > 0) {
        const mx = (w.x1 + w.x2) / 2, my = (w.y1 + w.y2) / 2;
        ctx.fillStyle = '#10b981';
        ctx.font = '10px Inter';
        ctx.fillText(`${(w.current * 1000).toFixed(1)}mA`, mx + 4, my - 4);
    }
}

function drawComponent(c) {
    const def = COMP_DEFS[c.type];
    const isSelected = c.id === selectedId;
    ctx.save();
    ctx.translate(c.x + c.w / 2, c.y + c.h / 2);
    ctx.rotate((c.rotation * Math.PI) / 180);
    ctx.translate(-c.w / 2, -c.h / 2);

    // Body
    if (isSelected) {
        ctx.shadowColor = '#6366f1';
        ctx.shadowBlur = 12;
    }
    ctx.fillStyle = 'var(--bg-card)';
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, c.w, c.h);
    ctx.strokeRect(0, 0, c.w, c.h);
    ctx.shadowBlur = 0;

    // Type-specific drawing
    ctx.fillStyle = def.color;
    ctx.font = 'bold 10px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (c.type === 'resistor') {
        drawResistorSymbol(ctx, c.w, c.h);
    } else if (c.type === 'capacitor') {
        drawCapacitorSymbol(ctx, c.w, c.h);
    } else if (c.type === 'battery') {
        drawBatterySymbol(ctx, c.w, c.h, c.value);
    } else if (c.type === 'led') {
        drawLedSymbol(ctx, c.w, c.h, c.state);
    } else if (c.type === 'ground') {
        drawGroundSymbol(ctx, c.w, c.h);
    } else if (c.type === 'switch') {
        drawSwitchSymbol(ctx, c.w, c.h, c.state);
    } else {
        ctx.fillText(def.label, c.w / 2, c.h / 2);
    }

    // Value label
    if (def.unit && c.value) {
        ctx.fillStyle = 'var(--text-muted)';
        ctx.font = '8px Inter';
        ctx.fillText(formatValue(c.value, def.unit), c.w / 2, c.h + 10);
    }

    // Pins
    def.pins.forEach(p => {
        ctx.fillStyle = isSelected ? '#6366f1' : '#888';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Simulation voltage label
    if (simRunning && c.simVoltage !== undefined) {
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.fillText(`${c.simVoltage.toFixed(1)}V`, c.w / 2, -6);
    }

    ctx.restore();
}

function drawResistorSymbol(ctx, w, h) {
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h/2); ctx.lineTo(8, h/2);
    const zigW = (w - 16) / 6;
    for (let i = 0; i < 6; i++) {
        ctx.lineTo(8 + zigW * (i + 0.5), i % 2 === 0 ? 4 : h - 4);
    }
    ctx.lineTo(w - 8, h/2); ctx.lineTo(w, h/2);
    ctx.stroke();
}

function drawCapacitorSymbol(ctx, w, h) {
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w/2 - 4, h/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w/2 + 4, h/2); ctx.lineTo(w, h/2); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(w/2 - 4, 4); ctx.lineTo(w/2 - 4, h - 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w/2 + 4, 4); ctx.lineTo(w/2 + 4, h - 4); ctx.stroke();
}

function drawBatterySymbol(ctx, w, h, v) {
    ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h*0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w/2, h*0.7); ctx.lineTo(w/2, h); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(4, h*0.35); ctx.lineTo(w - 4, h*0.35); ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(8, h*0.55); ctx.lineTo(w - 8, h*0.55); ctx.stroke();
    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 10px Inter'; ctx.textAlign = 'center';
    ctx.fillText('+', w/2, h*0.2);
}

function drawLedSymbol(ctx, w, h, on) {
    if (on) {
        ctx.fillStyle = 'rgba(239,68,68,0.3)';
        ctx.beginPath(); ctx.arc(w/2, h/2, 14, 0, Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = on ? '#ef4444' : '#4b5563';
    ctx.beginPath();
    ctx.moveTo(6, 4); ctx.lineTo(6, h - 4); ctx.lineTo(w - 6, h/2); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = on ? '#ef4444' : '#6b7280'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w - 6, 4); ctx.lineTo(w - 6, h - 4); ctx.stroke();
}

function drawGroundSymbol(ctx, w, h) {
    ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h*0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, h*0.4); ctx.lineTo(w - 4, h*0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, h*0.65); ctx.lineTo(w - 8, h*0.65); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, h*0.9); ctx.lineTo(w - 12, h*0.9); ctx.stroke();
}

function drawSwitchSymbol(ctx, w, h, closed) {
    ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2;
    ctx.fillStyle = '#eab308';
    ctx.beginPath(); ctx.arc(6, h/2, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w - 6, h/2, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(9, h/2);
    if (closed) ctx.lineTo(w - 9, h/2);
    else ctx.lineTo(w - 12, 3);
    ctx.stroke();
}

function formatValue(v, unit) {
    if (unit === 'Ω') {
        if (v >= 1e6) return (v/1e6).toFixed(1) + 'MΩ';
        if (v >= 1e3) return (v/1e3).toFixed(1) + 'kΩ';
        return v + 'Ω';
    }
    if (unit === 'F') {
        if (v >= 1e-3) return (v*1e3).toFixed(1) + 'mF';
        if (v >= 1e-6) return (v*1e6).toFixed(1) + 'µF';
        if (v >= 1e-9) return (v*1e9).toFixed(1) + 'nF';
        return (v*1e12).toFixed(1) + 'pF';
    }
    if (unit === 'V') return v + 'V';
    if (unit === 'H') return (v*1e3).toFixed(1) + 'mH';
    return v + unit;
}

// ── Drag & Drop from component panel ──
let dragType = null;

$$('.comp-item').forEach(el => {
    el.addEventListener('dragstart', e => {
        dragType = el.dataset.type;
        e.dataTransfer.effectAllowed = 'copy';
    });
});

canvas.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
canvas.addEventListener('drop', e => {
    e.preventDefault();
    if (!dragType) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    createComponent(dragType, x - 20, y - 10);
    dragType = null;
    $('#statusText').textContent = `Added ${dragType || 'component'}`;
});

// ── Canvas mouse events ──
canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);

    if (tool === 'select') {
        // Find component under cursor
        const hit = findComponentAt(mx, my);
        if (hit) {
            selectedId = hit.id;
            dragging = { id: hit.id, offX: mx - hit.x, offY: my - hit.y };
            // Toggle switch on click
            if (hit.type === 'switch') {
                hit.state = !hit.state;
                if (simRunning) runSimulation();
            }
        } else {
            selectedId = null;
        }
        updatePropsPanel();
    } else if (tool === 'wire') {
        const snappedX = snap(mx), snappedY = snap(my);
        if (!wireStart) {
            wireStart = { x: snappedX, y: snappedY };
        } else {
            wires.push({ x1: wireStart.x, y1: wireStart.y, x2: snappedX, y2: snappedY, current: 0 });
            wireStart = null;
            wirePreview = null;
        }
    }
    render();
});

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);

    if (dragging) {
        const comp = components.find(c => c.id === dragging.id);
        if (comp) {
            comp.x = snap(mx - dragging.offX);
            comp.y = snap(my - dragging.offY);
            render();
        }
    }
    if (wireStart) {
        wirePreview = { x1: wireStart.x, y1: wireStart.y, x2: snap(mx), y2: snap(my) };
        render();
    }
});

canvas.addEventListener('mouseup', () => { dragging = null; });

function findComponentAt(x, y) {
    for (let i = components.length - 1; i >= 0; i--) {
        const c = components[i];
        if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) return c;
    }
    return null;
}

// ── Tools ──
$('#wireBtn').addEventListener('click', () => { tool = 'wire'; updateToolUI(); });
$('#selectBtn').addEventListener('click', () => { tool = 'select'; updateToolUI(); });

function updateToolUI() {
    $$('.canvas-controls .btn').forEach(b => b.classList.remove('active'));
    $(tool === 'wire' ? '#wireBtn' : '#selectBtn').classList.add('active');
    canvas.style.cursor = tool === 'wire' ? 'crosshair' : 'default';
}

$('#deleteBtn').addEventListener('click', () => {
    if (selectedId) {
        components = components.filter(c => c.id !== selectedId);
        selectedId = null;
        updatePropsPanel();
        render();
    }
});

$('#rotateBtn').addEventListener('click', () => {
    const comp = components.find(c => c.id === selectedId);
    if (comp) {
        comp.rotation = (comp.rotation + 90) % 360;
        render();
    }
});

$('#clearBtn').addEventListener('click', () => {
    if (confirm('Clear entire circuit?')) {
        components = []; wires = []; selectedId = null; simRunning = false;
        updatePropsPanel(); render();
        $('#statusText').textContent = 'Canvas cleared';
    }
});

// ── Properties Panel ──
function updatePropsPanel() {
    const panel = $('#propsContent');
    const comp = components.find(c => c.id === selectedId);
    if (!comp) {
        panel.innerHTML = '<p class="text-muted">Select a component to edit</p>';
        return;
    }
    const def = COMP_DEFS[comp.type];
    panel.innerHTML = `
        <div style="margin-bottom:0.5rem"><strong style="color:${def.color}">${def.label}</strong> — ${comp.type}</div>
        ${def.unit ? `<label>Value (${def.unit})<input type="number" id="propValue" value="${comp.value}" step="any"></label>` : ''}
        <label>X<input type="number" id="propX" value="${comp.x}" step="20"></label>
        <label>Y<input type="number" id="propY" value="${comp.y}" step="20"></label>
        <label>Rotation<select id="propRot"><option value="0" ${comp.rotation===0?'selected':''}>0°</option><option value="90" ${comp.rotation===90?'selected':''}>90°</option><option value="180" ${comp.rotation===180?'selected':''}>180°</option><option value="270" ${comp.rotation===270?'selected':''}>270°</option></select></label>
    `;
    if ($('#propValue')) {
        $('#propValue').addEventListener('change', e => { comp.value = parseFloat(e.target.value) || 0; render(); });
    }
    $('#propX').addEventListener('change', e => { comp.x = parseInt(e.target.value); render(); });
    $('#propY').addEventListener('change', e => { comp.y = parseInt(e.target.value); render(); });
    $('#propRot').addEventListener('change', e => { comp.rotation = parseInt(e.target.value); render(); });
}

// ── Simulation ──
$('#simBtn').addEventListener('click', () => {
    simRunning = !simRunning;
    $('#simBtn').textContent = simRunning ? '⏹ Stop' : '▶ Simulate';
    if (simRunning) runSimulation();
    else {
        components.forEach(c => { c.simVoltage = 0; c.simCurrent = 0; if(c.type==='led') c.state = false; });
        wires.forEach(w => { w.current = 0; });
    }
    render();
});

function runSimulation() {
    // Simple DC analysis: find batteries, calculate series/parallel resistance, assign voltages/currents
    const batteries = components.filter(c => c.type === 'battery');
    const resistors = components.filter(c => c.type === 'resistor');
    const leds = components.filter(c => c.type === 'led');

    const simResults = $('#simResults');

    if (batteries.length === 0) {
        simResults.innerHTML = '<p class="text-danger">No voltage source found</p>';
        return;
    }

    // Simplified: total voltage from batteries, total resistance from resistors
    const totalV = batteries.reduce((sum, b) => sum + b.value, 0);
    const totalR = resistors.reduce((sum, r) => sum + r.value, 0) || 1;
    const totalI = totalV / totalR;

    // Assign voltages and currents
    batteries.forEach(b => { b.simVoltage = b.value; });
    resistors.forEach(r => { r.simVoltage = totalI * r.value; r.simCurrent = totalI; });
    leds.forEach(l => {
        l.simCurrent = totalI;
        l.state = totalI > 0.001; // LED turns on above 1mA
        l.simVoltage = l.state ? 2.0 : 0;
    });
    wires.forEach(w => { w.current = totalI; });

    // Display results
    const power = totalV * totalI;
    simResults.innerHTML = `
        <div class="sim-result"><span>Total Voltage</span><strong class="text-success">${totalV.toFixed(1)} V</strong></div>
        <div class="sim-result"><span>Total Resistance</span><strong>${formatValue(totalR, 'Ω')}</strong></div>
        <div class="sim-result"><span>Total Current</span><strong class="text-success">${(totalI*1000).toFixed(2)} mA</strong></div>
        <div class="sim-result"><span>Power</span><strong>${(power*1000).toFixed(2)} mW</strong></div>
        <div class="sim-result"><span>LEDs</span><strong>${leds.filter(l=>l.state).length}/${leds.length} ON</strong></div>
    `;

    render();
    $('#statusText').textContent = `Simulation running — ${totalV}V, ${(totalI*1000).toFixed(1)}mA`;
}

// ── Ohm's Law Calculator ──
$('#ohmCalcBtn').addEventListener('click', () => {
    const v = parseFloat($('#ohmV').value);
    const i = parseFloat($('#ohmI').value);
    const r = parseFloat($('#ohmR').value);
    const res = $('#ohmResult');
    const known = [!isNaN(v), !isNaN(i), !isNaN(r)].filter(Boolean).length;
    if (known < 2) { res.textContent = 'Enter any 2 values'; return; }
    if (!isNaN(v) && !isNaN(i)) { const calc = v / i; $('#ohmR').value = calc.toFixed(2); res.innerHTML = `R = V/I = <strong>${formatValue(calc,'Ω')}</strong>`; }
    else if (!isNaN(v) && !isNaN(r)) { const calc = v / r; $('#ohmI').value = calc.toFixed(4); res.innerHTML = `I = V/R = <strong>${(calc*1000).toFixed(2)} mA</strong>`; }
    else if (!isNaN(i) && !isNaN(r)) { const calc = i * r; $('#ohmV').value = calc.toFixed(2); res.innerHTML = `V = I×R = <strong>${calc.toFixed(2)} V</strong>`; }
});

// ── Templates ──
$$('#templateList .btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tpl = btn.dataset.tpl;
        components = []; wires = []; selectedId = null;
        loadTemplate(tpl);
        render();
    });
});

function loadTemplate(name) {
    if (name === 'voltage-divider') {
        createComponent('battery', 60, 100);
        createComponent('resistor', 200, 100);
        createComponent('resistor', 200, 220);
        createComponent('ground', 60, 300);
        wires.push({ x1: 80, y1: 100, x2: 200, y2: 100, current: 0 });
        wires.push({ x1: 260, y1: 110, x2: 260, y2: 220, current: 0 });
        wires.push({ x1: 260, y1: 240, x2: 80, y2: 240, current: 0 });
        wires.push({ x1: 80, y1: 140, x2: 80, y2: 300, current: 0 });
    } else if (name === 'led-circuit') {
        createComponent('battery', 60, 120);
        createComponent('resistor', 200, 120);
        createComponent('led', 360, 120);
        createComponent('ground', 60, 280);
        wires.push({ x1: 80, y1: 120, x2: 200, y2: 120, current: 0 });
        wires.push({ x1: 260, y1: 130, x2: 360, y2: 130, current: 0 });
        wires.push({ x1: 390, y1: 135, x2: 390, y2: 280, current: 0 });
        wires.push({ x1: 390, y1: 280, x2: 80, y2: 280, current: 0 });
        wires.push({ x1: 80, y1: 160, x2: 80, y2: 280, current: 0 });
    } else if (name === 'rc-filter') {
        createComponent('battery', 60, 120);
        createComponent('resistor', 200, 120);
        createComponent('capacitor', 360, 180);
        createComponent('ground', 60, 300);
        wires.push({ x1: 80, y1: 120, x2: 200, y2: 120, current: 0 });
        wires.push({ x1: 260, y1: 130, x2: 360, y2: 130, current: 0 });
        wires.push({ x1: 360, y1: 210, x2: 80, y2: 300, current: 0 });
        wires.push({ x1: 80, y1: 160, x2: 80, y2: 300, current: 0 });
    } else if (name === 'amplifier') {
        createComponent('battery', 60, 60);
        createComponent('resistor', 200, 60);
        createComponent('transistor', 300, 140);
        createComponent('resistor', 300, 260);
        createComponent('ground', 60, 360);
    }
    $('#statusText').textContent = `Loaded template: ${name}`;
}

// ── Save/Load ──
$('#saveBtn').addEventListener('click', () => {
    const data = JSON.stringify({ components, wires, nextId });
    localStorage.setItem('qu_circuit', data);
    $('#statusText').textContent = 'Circuit saved!';
});

$('#loadBtn').addEventListener('click', () => {
    const raw = localStorage.getItem('qu_circuit');
    if (!raw) { $('#statusText').textContent = 'No saved circuit found'; return; }
    try {
        const data = JSON.parse(raw);
        components = data.components || [];
        wires = data.wires || [];
        nextId = data.nextId || components.length + 1;
        selectedId = null;
        render();
        $('#statusText').textContent = 'Circuit loaded!';
    } catch { $('#statusText').textContent = 'Error loading circuit'; }
});

// ── Export ──
$('#exportBtn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `circuit-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    $('#statusText').textContent = 'Exported as PNG';
});

// ── Keyboard shortcuts ──
document.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { $('#deleteBtn').click(); }
    if (e.key === 'r') { $('#rotateBtn').click(); }
    if (e.key === 'w') { tool = 'wire'; updateToolUI(); }
    if (e.key === 'v') { tool = 'select'; updateToolUI(); }
    if (e.key === 's' && e.ctrlKey) { e.preventDefault(); $('#saveBtn').click(); }
});

// ── Theme ──
$('#themeBtn').addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.dataset.theme === 'dark';
    html.dataset.theme = isDark ? 'light' : 'dark';
    $('#themeBtn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', html.dataset.theme);
    render();
});
if (localStorage.getItem('theme') === 'light') {
    document.documentElement.dataset.theme = 'light';
    $('#themeBtn').textContent = '☀️';
}

// ── Init ──
render();
$('#statusText').textContent = 'Ready — drag components onto canvas, then wire them up';

})();
