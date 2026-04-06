(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const canvas = $('#pixelCanvas');
const ctx = canvas.getContext('2d');
const DISPLAY_SIZE = 512;
let GRID_SIZE = 16;
let PIXEL_SIZE = DISPLAY_SIZE / GRID_SIZE;

let currentTool = 'pencil'; // pencil, eraser, fill
let currentColor = '#ff4757';
let showGrid = true;
let isDrawing = false;

// Store pixel data
let pixels = new Array(GRID_SIZE * GRID_SIZE).fill(null);

function initCanvas() {
    canvas.width = DISPLAY_SIZE;
    canvas.height = DISPLAY_SIZE;
    render();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw pixels
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const color = pixels[y * GRID_SIZE + x];
            if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            }
        }
    }
    
    // Draw grid
    if (showGrid) {
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * PIXEL_SIZE, 0);
            ctx.lineTo(i * PIXEL_SIZE, DISPLAY_SIZE);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, i * PIXEL_SIZE);
            ctx.lineTo(DISPLAY_SIZE, i * PIXEL_SIZE);
            ctx.stroke();
        }
    }
}

function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (rect.width / GRID_SIZE));
    const y = Math.floor((e.clientY - rect.top) / (rect.height / GRID_SIZE));
    return { x, y };
}

function draw(x, y) {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
    const idx = y * GRID_SIZE + x;
    
    if (currentTool === 'pencil') {
        pixels[idx] = currentColor;
    } else if (currentTool === 'eraser') {
        pixels[idx] = null;
    } else if (currentTool === 'fill') {
        fill(x, y, pixels[idx], currentColor);
    }
    render();
}

function fill(startX, startY, targetColor, replacementColor) {
    if (targetColor === replacementColor) return;
    
    const stack = [{ x: startX, y: startY }];
    
    while (stack.length > 0) {
        const { x, y } = stack.pop();
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) continue;
        
        const idx = y * GRID_SIZE + x;
        if (pixels[idx] === targetColor) {
            pixels[idx] = replacementColor;
            stack.push({ x: x + 1, y });
            stack.push({ x: x - 1, y });
            stack.push({ x, y: y + 1 });
            stack.push({ x, y: y - 1 });
        }
    }
}

// Mouse events
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const { x, y } = getCoords(e);
    draw(x, y);
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    if (currentTool === 'fill') return; // Don't continuously fill on drag
    const { x, y } = getCoords(e);
    draw(x, y);
});

window.addEventListener('mouseup', () => isDrawing = false);

// Tools
$$('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        $$('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;
    });
});

// Colors
$('#currentColor').addEventListener('input', (e) => currentColor = e.target.value);

$$('.palette-swatch').forEach(swatch => {
    swatch.addEventListener('click', (e) => {
        const bg = e.target.style.backgroundColor;
        // Convert rgb to hex for color input
        const rgb = bg.match(/\d+/g);
        if(rgb) {
            const hex = '#' + rgb.map(x=>parseInt(x).toString(16).padStart(2,'0')).join('');
            $('#currentColor').value = hex;
            currentColor = hex;
        }
    });
});

// Settings
$('#gridSizeSlider').addEventListener('change', (e) => {
    const newSize = parseInt(e.target.value);
    $('#gridSizeReadout').textContent = `${newSize}x${newSize}`;
    
    // Resize map, attempting to preserve top-left
    const newPixels = new Array(newSize * newSize).fill(null);
    const minGrid = Math.min(GRID_SIZE, newSize);
    for (let y = 0; y < minGrid; y++) {
        for (let x = 0; x < minGrid; x++) {
            newPixels[y * newSize + x] = pixels[y * GRID_SIZE + x];
        }
    }
    
    GRID_SIZE = newSize;
    PIXEL_SIZE = DISPLAY_SIZE / GRID_SIZE;
    pixels = newPixels;
    render();
});

$('#showGridCheck').addEventListener('change', (e) => {
    showGrid = e.target.checked;
    $('#gridToggleText').textContent = showGrid ? 'Hide Grid' : 'Show Grid';
    render();
});

$('#clearBtn').addEventListener('click', () => {
    if(confirm('Clear canvas?')) {
        pixels.fill(null);
        render();
    }
});

$('#downloadBtn').addEventListener('click', () => {
    // Temporarily hide grid for export
    const wasGrid = showGrid;
    showGrid = false;
    render();
    
    const link = document.createElement('a');
    link.download = `pixel-art-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    
    showGrid = wasGrid;
    render();
});

// Theme
$('#themeBtn').addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.dataset.theme === 'dark';
    html.dataset.theme = isDark ? 'light' : 'dark';
    $('#themeBtn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', html.dataset.theme);
});

if (localStorage.getItem('theme') === 'light') {
    document.documentElement.dataset.theme = 'light';
    $('#themeBtn').textContent = '☀️';
}

initCanvas();
})();
