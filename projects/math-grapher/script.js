(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const canvas = $('#graphCanvas');
const ctx = canvas.getContext('2d');
let W = canvas.width, H = canvas.height;

const COLORS = ['#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316'];
let functions = [{ expr: 'sin(x)', color: COLORS[0], visible: true }];
let xMin = -10, xMax = 10, yMin = -10, yMax = 10;
let paramA = 1, paramB = 0, paramC = 0;

// ── Safe Math Evaluator ──
function evalExpr(expr, x) {
    try {
        const a = paramA, b = paramB, c = paramC;
        const fn = new Function('x','a','b','c','Math',
            `with(Math){return ${expr.replace(/\^/g,'**').replace(/log\(/g,'log(').replace(/ln\(/g,'log(')}}`
        );
        const result = fn(x, a, b, c, Math);
        return isFinite(result) ? result : NaN;
    } catch { return NaN; }
}

// ── Coordinate Transforms ──
function toScreenX(x) { return (x - xMin) / (xMax - xMin) * W; }
function toScreenY(y) { return H - (y - yMin) / (yMax - yMin) * H; }
function toMathX(sx) { return xMin + sx / W * (xMax - xMin); }
function toMathY(sy) { return yMax - sy / H * (yMax - yMin); }

// ── Render ──
function render() {
    const isDark = document.documentElement.dataset.theme === 'dark';
    ctx.fillStyle = isDark ? '#0f0f14' : '#f5f5f7';
    ctx.fillRect(0, 0, W, H);

    // Grid
    if ($('#showGrid').checked) drawGrid(isDark);
    // Axes
    if ($('#showAxes').checked) drawAxes(isDark);
    // Functions
    functions.forEach(f => { if (f.visible) plotFunction(f.expr, f.color); });
}

function drawGrid(isDark) {
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    const stepX = niceStep((xMax - xMin) / 10);
    const stepY = niceStep((yMax - yMin) / 10);
    for (let x = Math.ceil(xMin/stepX)*stepX; x <= xMax; x += stepX) {
        const sx = toScreenX(x);
        ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke();
    }
    for (let y = Math.ceil(yMin/stepY)*stepY; y <= yMax; y += stepY) {
        const sy = toScreenY(y);
        ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke();
    }
}

function drawAxes(isDark) {
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    // X-axis
    const y0 = toScreenY(0);
    if (y0 >= 0 && y0 <= H) { ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(W, y0); ctx.stroke(); }
    // Y-axis
    const x0 = toScreenX(0);
    if (x0 >= 0 && x0 <= W) { ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0, H); ctx.stroke(); }
    // Labels
    ctx.fillStyle = isDark ? '#6b6b80' : '#8888a0';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'center';
    const stepX = niceStep((xMax - xMin) / 10);
    for (let x = Math.ceil(xMin/stepX)*stepX; x <= xMax; x += stepX) {
        if (Math.abs(x) < 0.001) continue;
        ctx.fillText(formatNum(x), toScreenX(x), y0 + 14);
    }
    ctx.textAlign = 'right';
    const stepY = niceStep((yMax - yMin) / 10);
    for (let y = Math.ceil(yMin/stepY)*stepY; y <= yMax; y += stepY) {
        if (Math.abs(y) < 0.001) continue;
        ctx.fillText(formatNum(y), x0 - 6, toScreenY(y) + 4);
    }
}

function plotFunction(expr, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    const step = (xMax - xMin) / W;
    for (let px = 0; px <= W; px++) {
        const x = toMathX(px);
        const y = evalExpr(expr, x);
        if (isNaN(y) || !isFinite(y) || Math.abs(y) > 1e6) { started = false; continue; }
        const sy = toScreenY(y);
        if (!started) { ctx.moveTo(px, sy); started = true; }
        else ctx.lineTo(px, sy);
    }
    ctx.stroke();
}

function niceStep(rough) {
    const pow = Math.pow(10, Math.floor(Math.log10(rough)));
    const norm = rough / pow;
    if (norm <= 1) return pow;
    if (norm <= 2) return 2 * pow;
    if (norm <= 5) return 5 * pow;
    return 10 * pow;
}

function formatNum(n) { return Math.abs(n) < 0.01 ? '0' : n % 1 === 0 ? n.toString() : n.toFixed(1); }

// ── Function List UI ──
function renderFuncList() {
    const list = $('#funcList');
    list.innerHTML = functions.map((f, i) => `
        <div class="func-row">
            <input type="color" class="color-dot" value="${f.color}" data-idx="${i}">
            <input type="text" value="${f.expr}" data-idx="${i}" class="func-input">
            <button class="del-btn" data-idx="${i}">✕</button>
        </div>
    `).join('');
    $$('.func-input').forEach(inp => inp.addEventListener('change', e => {
        functions[parseInt(e.target.dataset.idx)].expr = e.target.value;
        render();
    }));
    $$('.color-dot').forEach(inp => inp.addEventListener('input', e => {
        functions[parseInt(e.target.dataset.idx)].color = e.target.value;
        render();
    }));
    $$('.del-btn').forEach(btn => btn.addEventListener('click', e => {
        functions.splice(parseInt(e.target.dataset.idx), 1);
        renderFuncList(); render();
    }));
}

$('#addFuncBtn').addEventListener('click', () => {
    functions.push({ expr: 'x', color: COLORS[functions.length % COLORS.length], visible: true });
    renderFuncList(); render();
});

// ── Controls ──
['xMin','xMax','yMin','yMax'].forEach(id => {
    $(`#${id}`).addEventListener('change', e => {
        if (id === 'xMin') xMin = parseFloat(e.target.value);
        if (id === 'xMax') xMax = parseFloat(e.target.value);
        if (id === 'yMin') yMin = parseFloat(e.target.value);
        if (id === 'yMax') yMax = parseFloat(e.target.value);
        render();
    });
});

$('#showGrid').addEventListener('change', render);
$('#showAxes').addEventListener('change', render);
$('#resetView').addEventListener('click', () => {
    xMin = -10; xMax = 10; yMin = -10; yMax = 10;
    $('#xMin').value = -10; $('#xMax').value = 10; $('#yMin').value = -10; $('#yMax').value = 10;
    render();
});

$('#paramA').addEventListener('input', e => { paramA = parseFloat(e.target.value); $('#aVal').textContent = paramA.toFixed(1); render(); });
$('#paramB').addEventListener('input', e => { paramB = parseFloat(e.target.value); $('#bVal').textContent = paramB.toFixed(1); render(); });
$('#paramC').addEventListener('input', e => { paramC = parseFloat(e.target.value); $('#cVal').textContent = paramC.toFixed(1); render(); });

// Presets
$$('[data-preset]').forEach(btn => btn.addEventListener('click', () => {
    functions = [{ expr: btn.dataset.preset, color: COLORS[0], visible: true }];
    renderFuncList(); render();
}));

// ── Mouse trace ──
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);
    const x = toMathX(mx), y = toMathY(my);
    let info = `x: ${x.toFixed(2)}, y: ${y.toFixed(2)}`;
    if (functions.length > 0) {
        const fy = evalExpr(functions[0].expr, x);
        if (!isNaN(fy)) info += ` | f(x): ${fy.toFixed(4)}`;
    }
    $('#traceInfo').textContent = info;
});

// ── Zoom with scroll ──
canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    const rect = canvas.getBoundingClientRect();
    const mx = toMathX((e.clientX - rect.left) * (W / rect.width));
    const my = toMathY((e.clientY - rect.top) * (H / rect.height));
    xMin = mx + (xMin - mx) * factor; xMax = mx + (xMax - mx) * factor;
    yMin = my + (yMin - my) * factor; yMax = my + (yMax - my) * factor;
    $('#xMin').value = xMin.toFixed(1); $('#xMax').value = xMax.toFixed(1);
    $('#yMin').value = yMin.toFixed(1); $('#yMax').value = yMax.toFixed(1);
    render();
});

// Export
$('#exportBtn').addEventListener('click', () => {
    const a = document.createElement('a'); a.download = `graph-${Date.now()}.png`; a.href = canvas.toDataURL(); a.click();
});

// Theme
$('#themeBtn').addEventListener('click', () => {
    const html = document.documentElement; const isDark = html.dataset.theme === 'dark';
    html.dataset.theme = isDark ? 'light' : 'dark'; $('#themeBtn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', html.dataset.theme); render();
});
if (localStorage.getItem('theme') === 'light') { document.documentElement.dataset.theme = 'light'; $('#themeBtn').textContent = '☀️'; }

renderFuncList(); render();
})();
