(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const canvas = $('#physCanvas');
const ctx = canvas.getContext('2d');
let W = canvas.width, H = canvas.height;

let objects = [];
let running = false;
let lastTime = 0;
let nextId = 1;
let gravity = 9.81;
let friction = 0.3;
let bounciness = 0.6;
let timeScale = 1.0;
let showVectors = true;
let showTrails = false;
let trails = [];

// ── Object Factory ──
function createCircle(x, y, r, vx = 0, vy = 0) {
    objects.push({ id: nextId++, type: 'circle', x, y, r, vx, vy, ax: 0, ay: 0, mass: r * 0.5, color: randomColor(), fixed: false, trail: [] });
    updateCount();
}
function createBox(x, y, w, h, vx = 0, vy = 0) {
    objects.push({ id: nextId++, type: 'box', x, y, w, h, vx, vy, ax: 0, ay: 0, mass: (w*h)*0.01, color: randomColor(), fixed: false, trail: [] });
    updateCount();
}
function createPlatform(x, y, w) {
    objects.push({ id: nextId++, type: 'box', x, y, w, h: 10, vx: 0, vy: 0, ax: 0, ay: 0, mass: 999, color: '#4b5563', fixed: true, trail: [] });
    updateCount();
}
function randomColor() {
    const colors = ['#ef4444','#f97316','#facc15','#10b981','#3b82f6','#8b5cf6','#ec4899','#06b6d4'];
    return colors[Math.floor(Math.random()*colors.length)];
}
function updateCount() { $('#objCount').textContent = `Objects: ${objects.length}`; }

// ── Physics Update ──
function update(dt) {
    dt *= timeScale;
    const g = gravity * 50; // Scale for pixels
    for (const obj of objects) {
        if (obj.fixed) continue;
        // Gravity
        obj.vy += g * dt;
        // Apply velocity
        obj.x += obj.vx * dt;
        obj.y += obj.vy * dt;
        // Floor collision
        const bottom = obj.type === 'circle' ? obj.y + obj.r : obj.y + obj.h;
        if (bottom >= H) {
            if (obj.type === 'circle') obj.y = H - obj.r;
            else obj.y = H - obj.h;
            obj.vy *= -bounciness;
            obj.vx *= (1 - friction);
            if (Math.abs(obj.vy) < 1) obj.vy = 0;
        }
        // Wall collisions
        if (obj.type === 'circle') {
            if (obj.x - obj.r < 0) { obj.x = obj.r; obj.vx *= -bounciness; }
            if (obj.x + obj.r > W) { obj.x = W - obj.r; obj.vx *= -bounciness; }
            if (obj.y - obj.r < 0) { obj.y = obj.r; obj.vy *= -bounciness; }
        } else {
            if (obj.x < 0) { obj.x = 0; obj.vx *= -bounciness; }
            if (obj.x + obj.w > W) { obj.x = W - obj.w; obj.vx *= -bounciness; }
            if (obj.y < 0) { obj.y = 0; obj.vy *= -bounciness; }
        }
        // Trail
        if (showTrails) {
            obj.trail.push({ x: obj.x, y: obj.y });
            if (obj.trail.length > 100) obj.trail.shift();
        }
    }
    // Circle-circle collisions
    for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
            const a = objects[i], b = objects[j];
            if (a.type === 'circle' && b.type === 'circle') {
                const dx = b.x - a.x, dy = b.y - a.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const minDist = a.r + b.r;
                if (dist < minDist && dist > 0) {
                    const nx = dx/dist, ny = dy/dist;
                    const overlap = minDist - dist;
                    if (!a.fixed) { a.x -= nx * overlap * 0.5; a.y -= ny * overlap * 0.5; }
                    if (!b.fixed) { b.x += nx * overlap * 0.5; b.y += ny * overlap * 0.5; }
                    const dvx = a.vx - b.vx, dvy = a.vy - b.vy;
                    const dot = dvx * nx + dvy * ny;
                    if (dot > 0) {
                        const m = 2 * dot / (a.mass + b.mass);
                        if (!a.fixed) { a.vx -= m * b.mass * nx * bounciness; a.vy -= m * b.mass * ny * bounciness; }
                        if (!b.fixed) { b.vx += m * a.mass * nx * bounciness; b.vy += m * a.mass * ny * bounciness; }
                    }
                }
            }
            // Circle-Box
            if ((a.type === 'circle' && b.type === 'box') || (a.type === 'box' && b.type === 'circle')) {
                const circ = a.type === 'circle' ? a : b;
                const box = a.type === 'box' ? a : b;
                const cx = Math.max(box.x, Math.min(circ.x, box.x + box.w));
                const cy = Math.max(box.y, Math.min(circ.y, box.y + box.h));
                const dx = circ.x - cx, dy = circ.y - cy;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < circ.r && dist > 0) {
                    const nx = dx/dist, ny = dy/dist;
                    const overlap = circ.r - dist;
                    if (!circ.fixed) { circ.x += nx * overlap; circ.y += ny * overlap; }
                    const dot = circ.vx * nx + circ.vy * ny;
                    if (dot < 0 && !circ.fixed) {
                        circ.vx -= 2 * dot * nx * bounciness;
                        circ.vy -= 2 * dot * ny * bounciness;
                        circ.vx *= (1 - friction * 0.5);
                    }
                }
            }
        }
    }
}

// ── Render ──
function render() {
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0f0f14';
    ctx.fillRect(0, 0, W, H);
    // Trails
    if (showTrails) {
        for (const obj of objects) {
            if (obj.trail.length < 2) continue;
            ctx.strokeStyle = obj.color + '40';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(obj.trail[0].x, obj.trail[0].y);
            for (const p of obj.trail) ctx.lineTo(p.x, p.y);
            ctx.stroke();
        }
    }
    // Objects
    for (const obj of objects) {
        ctx.fillStyle = obj.color;
        if (obj.type === 'circle') {
            ctx.beginPath(); ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.stroke();
        } else {
            ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
            ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
        }
        // Velocity vectors
        if (showVectors && !obj.fixed && (Math.abs(obj.vx) > 1 || Math.abs(obj.vy) > 1)) {
            const cx = obj.type === 'circle' ? obj.x : obj.x + obj.w/2;
            const cy = obj.type === 'circle' ? obj.y : obj.y + obj.h/2;
            const scale = 0.1;
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + obj.vx * scale, cy + obj.vy * scale);
            ctx.stroke();
            // Arrowhead
            const angle = Math.atan2(obj.vy, obj.vx);
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.moveTo(cx + obj.vx*scale, cy + obj.vy*scale);
            ctx.lineTo(cx + obj.vx*scale - 6*Math.cos(angle-0.4), cy + obj.vy*scale - 6*Math.sin(angle-0.4));
            ctx.lineTo(cx + obj.vx*scale - 6*Math.cos(angle+0.4), cy + obj.vy*scale - 6*Math.sin(angle+0.4));
            ctx.fill();
        }
    }
}

// ── Game Loop ──
let frameCount = 0, fpsTime = 0;
function loop(ts) {
    if (!running) return;
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    update(dt);
    render();
    frameCount++;
    if (ts - fpsTime > 1000) { $('#fpsCounter').textContent = `FPS: ${frameCount}`; frameCount = 0; fpsTime = ts; }
    requestAnimationFrame(loop);
}

$('#playBtn').addEventListener('click', () => {
    running = !running;
    $('#playBtn').textContent = running ? '⏸ Pause' : '▶ Play';
    if (running) { lastTime = performance.now(); requestAnimationFrame(loop); }
});

$('#resetBtn').addEventListener('click', () => {
    objects = []; running = false; $('#playBtn').textContent = '▶ Play'; updateCount(); render();
});

// ── Controls ──
$('#addCircle').addEventListener('click', () => { createCircle(100 + Math.random()*600, 50 + Math.random()*100, 15 + Math.random()*25, (Math.random()-0.5)*200, 0); render(); });
$('#addBox').addEventListener('click', () => { createBox(100 + Math.random()*600, 50 + Math.random()*100, 30 + Math.random()*40, 30 + Math.random()*40); render(); });
$('#addPlatform').addEventListener('click', () => { createPlatform(100 + Math.random()*400, 200 + Math.random()*300, 120 + Math.random()*100); render(); });

$('#gravity').addEventListener('input', e => { gravity = parseFloat(e.target.value); $('#gravVal').textContent = gravity.toFixed(1); });
$('#friction').addEventListener('input', e => { friction = parseFloat(e.target.value); $('#fricVal').textContent = friction.toFixed(2); });
$('#bounce').addEventListener('input', e => { bounciness = parseFloat(e.target.value); $('#bounceVal').textContent = bounciness.toFixed(2); });
$('#timeScale').addEventListener('input', e => { timeScale = parseFloat(e.target.value); $('#timeVal').textContent = timeScale.toFixed(1); });
$('#showVectors').addEventListener('change', e => { showVectors = e.target.checked; render(); });
$('#showTrails').addEventListener('change', e => { showTrails = e.target.checked; if (!showTrails) objects.forEach(o => o.trail = []); render(); });

// ── Demos ──
$('#demoPendulum').addEventListener('click', () => {
    objects = [];
    createPlatform(350, 100, 100);
    for (let i = 0; i < 5; i++) createCircle(370 + i*20, 100 + (i+1)*40, 12);
    render();
});
$('#demoProjectile').addEventListener('click', () => {
    objects = [];
    createPlatform(0, H - 20, W);
    createCircle(80, H - 50, 15, 300, -400);
    render();
});
$('#demoCradle').addEventListener('click', () => {
    objects = [];
    createPlatform(0, H - 20, W);
    for (let i = 0; i < 5; i++) createCircle(320 + i*32, H - 40, 15, 0, 0);
    objects[0].vx = -250;
    render();
});
$('#demoStack').addEventListener('click', () => {
    objects = [];
    createPlatform(250, H - 20, 300);
    for (let i = 0; i < 6; i++) createBox(340, H - 60 - i*45, 40, 40);
    createCircle(200, 100, 20, 250, 0);
    render();
});

// ── Mouse interaction (drag to launch) ──
let mouseDown = false, mouseStart = null;
canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    mouseStart = { x: (e.clientX-rect.left)*(W/rect.width), y: (e.clientY-rect.top)*(H/rect.height) };
    mouseDown = true;
});
canvas.addEventListener('mouseup', e => {
    if (!mouseDown || !mouseStart) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX-rect.left)*(W/rect.width), my = (e.clientY-rect.top)*(H/rect.height);
    const vx = (mouseStart.x - mx) * 3, vy = (mouseStart.y - my) * 3;
    createCircle(mouseStart.x, mouseStart.y, 15 + Math.random()*15, vx, vy);
    mouseDown = false; mouseStart = null;
    render();
});

// Theme
$('#themeBtn').addEventListener('click', () => {
    const html = document.documentElement; const isDark = html.dataset.theme === 'dark';
    html.dataset.theme = isDark ? 'light' : 'dark';
    $('#themeBtn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', html.dataset.theme); render();
});
if (localStorage.getItem('theme') === 'light') { document.documentElement.dataset.theme = 'light'; $('#themeBtn').textContent = '☀️'; }

render();
})();
