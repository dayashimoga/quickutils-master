(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Matter.js aliases
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Composite = Matter.Composite,
      Composites = Matter.Composites,
      Constraint = Matter.Constraint,
      MouseConstraint = Matter.MouseConstraint,
      Mouse = Matter.Mouse,
      Bodies = Matter.Bodies,
      Body = Matter.Body;

const canvas = $('#physCanvas');
let W = canvas.width, H = canvas.height;

// Engine setup
const engine = Engine.create();
const world = engine.world;

const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: W,
        height: H,
        background: 'transparent',
        wireframes: false,
        showVelocity: false,
        showAngleIndicator: false
    }
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

let isPlaying = true;
let trails = [];
let showTrails = false;

// Base physics settings
let gravityScale = 1;
let currentFriction = 0.3;
let currentBounce = 0.6;
let timeScale = 1.0;

// Mouse interaction
const mouse = Mouse.create(render.canvas);
const mConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: { stiffness: 0.2, render: { visible: false } }
});
Composite.add(world, mConstraint);
render.mouse = mouse;

function randomColor() {
    const colors = ['#ef4444','#f97316','#facc15','#10b981','#3b82f6','#8b5cf6','#ec4899','#06b6d4'];
    return colors[Math.floor(Math.random()*colors.length)];
}

function updateCount() {
    const objCount = Composite.allBodies(world).length;
    $('#objCount').textContent = `Objects: ${objCount}`;
}

// ── Object Factory ──
function createCircle(x, y, r, vx=0, vy=0) {
    const body = Bodies.circle(x, y, r, {
        restitution: currentBounce,
        friction: currentFriction,
        render: { fillStyle: randomColor() }
    });
    Body.setVelocity(body, {x: vx, y: vy});
    Composite.add(world, body);
    updateCount();
}

function createBox(x, y, w, h, vx=0, vy=0) {
    const body = Bodies.rectangle(x, y, w, h, {
        restitution: currentBounce,
        friction: currentFriction,
        render: { fillStyle: randomColor() }
    });
    Body.setVelocity(body, {x: vx, y: vy});
    Composite.add(world, body);
    updateCount();
}

function createPlatform(x, y, w) {
    // centered x, y
    const body = Bodies.rectangle(x + w/2, y + 10, w, 20, {
        isStatic: true,
        render: { fillStyle: '#4b5563' }
    });
    Composite.add(world, body);
    updateCount();
}

function clearWorld() {
    Composite.clear(world);
    Engine.clear(engine);
    trails = [];
    // Re-add mouse constraint
    Composite.add(world, mConstraint);
    
    // Bounds to keep things inside
    const bounds = [
        Bodies.rectangle(W/2, -50, W, 100, { isStatic: true }),
        Bodies.rectangle(W/2, H+50, W, 100, { isStatic: true }),
        Bodies.rectangle(-50, H/2, 100, H, { isStatic: true }),
        Bodies.rectangle(W+50, H/2, 100, H, { isStatic: true })
    ];
    Composite.add(world, bounds);
    updateCount();
}

// ── UI Controls ──
$('#playBtn').addEventListener('click', () => {
    isPlaying = !isPlaying;
    $('#playBtn').textContent = isPlaying ? '⏸ Pause' : '▶ Play';
    runner.enabled = isPlaying;
});

$('#resetBtn').addEventListener('click', () => {
    clearWorld();
});

$('#addCircle').addEventListener('click', () => { createCircle(100 + Math.random()*600, 50 + Math.random()*100, 15 + Math.random()*25); });
$('#addBox').addEventListener('click', () => { createBox(100 + Math.random()*600, 50 + Math.random()*100, 30 + Math.random()*40, 30 + Math.random()*40); });
$('#addPlatform').addEventListener('click', () => { createPlatform(100 + Math.random()*400, 200 + Math.random()*300, 120 + Math.random()*100); });

$('#gravity').addEventListener('input', e => { 
    const v = parseFloat(e.target.value);
    $('#gravVal').textContent = v.toFixed(1);
    engine.gravity.y = (v / 9.81) * gravityScale;
});

$('#friction').addEventListener('input', e => { 
    currentFriction = parseFloat(e.target.value);
    $('#fricVal').textContent = currentFriction.toFixed(2);
});

$('#bounce').addEventListener('input', e => { 
    currentBounce = parseFloat(e.target.value);
    $('#bounceVal').textContent = currentBounce.toFixed(2);
});

$('#timeScale').addEventListener('input', e => { 
    timeScale = parseFloat(e.target.value);
    $('#timeVal').textContent = timeScale.toFixed(1);
    engine.timing.timeScale = timeScale;
});

$('#showTrails').addEventListener('change', e => { showTrails = e.target.checked; trails = []; });

$('#envSelect').addEventListener('change', e => {
    const val = e.target.value;
    engine.gravity.y = 1; 
    gravityScale = 1;
    world.gravity.scale = 0.001;
    
    // Reset drag
    Composite.allBodies(world).forEach(b => {
        b.frictionAir = 0.01;
    });

    if (val === 'earth') {
        engine.gravity.y = 1;
        $('#gravity').value = 9.81;
    } else if (val === 'moon') {
        engine.gravity.y = 0.165; // 1.62 / 9.81
        $('#gravity').value = 1.62;
    } else if (val === 'zero-g') {
        engine.gravity.y = 0;
        $('#gravity').value = 0;
    } else if (val === 'underwater') {
        engine.gravity.y = 0.5;
        $('#gravity').value = 4.9;
        // High drag
        Composite.allBodies(world).forEach(b => {
            b.frictionAir = 0.05;
        });
    }
    $('#gravVal').textContent = $('#gravity').value;
});

// ── Demos ──
$('#demoPendulum').addEventListener('click', () => {
    clearWorld();
    createPlatform(300, 50, 200);
    const pendulum = Bodies.circle(400, 250, 25, { restitution: 0.9, render:{fillStyle:'#facc15'} });
    const constraint = Constraint.create({
        pointA: { x: 400, y: 70 },
        bodyB: pendulum,
        stiffness: 0.9,
        render: { strokeStyle: '#fff' }
    });
    Body.translate(pendulum, {x: 150, y: -100});
    Composite.add(world, [pendulum, constraint]);
    updateCount();
});

$('#demoProjectile').addEventListener('click', () => {
    clearWorld();
    createPlatform(0, H - 20, W);
    createCircle(50, H - 50, 20, 20, -25);
});

$('#demoCradle').addEventListener('click', () => {
    clearWorld();
    const cradle = Composites.newtonsCradle(250, 100, 5, 20, 160);
    Body.translate(cradle.bodies[0], { x: -140, y: -100 });
    Composite.add(world, cradle);
    updateCount();
});

$('#demoStack').addEventListener('click', () => {
    clearWorld();
    createPlatform(150, H - 20, 500);
    const stack = Composites.stack(200, H - 400, 6, 6, 0, 0, function(x, y) {
        return Bodies.rectangle(x, y, 40, 40, { render: {fillStyle: randomColor()} });
    });
    Composite.add(world, stack);
    createCircle(50, H - 150, 30, 25, -5);
    updateCount();
});

// Trails render event
Matter.Events.on(render, 'afterRender', function() {
    const ctx = render.context;
    if (showTrails) {
        ctx.beginPath();
        const bodies = Composite.allBodies(world).filter(b => !b.isStatic);
        bodies.forEach((b, i) => {
            if(!trails[i]) trails[i] = [];
            trails[i].push({x: b.position.x, y: b.position.y});
            if(trails[i].length > 50) trails[i].shift();
            
            ctx.moveTo(trails[i][0].x, trails[i][0].y);
            for(let j=1; j<trails[i].length; j++) {
                ctx.lineTo(trails[i][j].x, trails[i][j].y);
            }
        });
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.stroke();
    }
    
    // FPS
    if(frameCount % 30 === 0) {
        $('#fpsCounter').textContent = `FPS: ${Math.round(runner.fps)}`;
    }
    frameCount++;
});

let frameCount = 0;

// Theme
$('#themeBtn').addEventListener('click', () => {
    const html = document.documentElement; const isDark = html.dataset.theme === 'dark';
    html.dataset.theme = isDark ? 'light' : 'dark';
    $('#themeBtn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', html.dataset.theme);
});
if (localStorage.getItem('theme') === 'light') { document.documentElement.dataset.theme = 'light'; $('#themeBtn').textContent = '☀️'; }

clearWorld();
})();
