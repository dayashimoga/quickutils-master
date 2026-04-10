(() => {
'use strict';
const $ = s => document.querySelector(s);
let grid = [];
const cols = 80;
const rows = 50;
const resolution = 10;
let isPlaying = false;
let genCount = 0;
let animationId;
const canvas = $('#lifeCanvas');
const ctx = canvas.getContext('2d');

function initGrid() {
    grid = new Array(cols).fill(null).map(() => new Array(rows).fill(0));
}

function randomize() {
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            grid[i][j] = Math.floor(Math.random() * 2);
        }
    }
    genCount = 0;
    draw();
}

function clear() {
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            grid[i][j] = 0;
        }
    }
    genCount = 0;
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for(let i=0; i<=cols; i++) { ctx.beginPath(); ctx.moveTo(i*resolution, 0); ctx.lineTo(i*resolution, canvas.height); ctx.stroke(); }
    for(let j=0; j<=rows; j++) { ctx.beginPath(); ctx.moveTo(0, j*resolution); ctx.lineTo(canvas.width, j*resolution); ctx.stroke(); }
    
    let pop = 0;
    ctx.fillStyle = '#22c55e';
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            if (grid[i][j] === 1) {
                ctx.fillRect(i * resolution + 1, j * resolution + 1, resolution - 2, resolution - 2);
                pop++;
            }
        }
    }
    $('#genCount').textContent = genCount;
    $('#popCount').textContent = pop;
}

function update() {
    const next = new Array(cols).fill(null).map(() => new Array(rows).fill(0));
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            const state = grid[i][j];
            let neighbors = countNeighbors(grid, i, j);
            if (state === 0 && neighbors === 3) next[i][j] = 1;
            else if (state === 1 && (neighbors < 2 || neighbors > 3)) next[i][j] = 0;
            else next[i][j] = state;
        }
    }
    grid = next;
    genCount++;
}

function countNeighbors(grid, x, y) {
    let sum = 0;
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            const col = (x + i + cols) % cols;
            const row = (y + j + rows) % rows;
            sum += grid[col][row];
        }
    }
    sum -= grid[x][y];
    return sum;
}

function loop() {
    if (!isPlaying) return;
    update();
    draw();
    setTimeout(() => {
        animationId = requestAnimationFrame(loop);
    }, 1000 / parseInt($('#speedSlider').value));
}

// Mouse interaction
let isPainting = false;
canvas.addEventListener('mousedown', (e) => {
    isPainting = true;
    toggleCell(e);
});
canvas.addEventListener('mousemove', (e) => {
    if (isPainting) toggleCell(e);
});
canvas.addEventListener('mouseup', () => isPainting = false);
canvas.addEventListener('mouseleave', () => isPainting = false);

function toggleCell(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / resolution);
    const y = Math.floor((e.clientY - rect.top) / resolution);
    if(x >= 0 && x < cols && y >= 0 && y < rows) {
        grid[x][y] = 1;
        draw();
    }
}

$('#playBtn').addEventListener('click', () => {
    isPlaying = !isPlaying;
    $('#playBtn').textContent = isPlaying ? '⏸ Pause' : '▶ Play';
    if (isPlaying) loop();
    else cancelAnimationFrame(animationId);
});

$('#stepBtn').addEventListener('click', () => { update(); draw(); });
$('#clearBtn').addEventListener('click', () => { isPlaying = false; $('#playBtn').textContent = '▶ Play'; clear(); });
$('#randomBtn').addEventListener('click', randomize);

// Theme
if (typeof QU !== 'undefined') QU.initTheme();
else {
    $('#themeBtn').addEventListener('click', () => { const h = document.documentElement; const d = h.dataset.theme === 'dark'; h.dataset.theme = d ? 'light' : 'dark'; $('#themeBtn').textContent = d ? '☀️' : '🌙'; localStorage.setItem('theme', h.dataset.theme); });
    if (localStorage.getItem('theme') === 'light') { document.documentElement.dataset.theme = 'light'; $('#themeBtn').textContent = '☀️'; }
}

initGrid();
randomize();

})();
