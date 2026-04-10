(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const canvas = $('#pixelCanvas');
const ctx = canvas.getContext('2d');
const DISPLAY_SIZE = 512;
let GRID_SIZE = 16;
let PIXEL_SIZE = DISPLAY_SIZE / GRID_SIZE;

let currentTool = 'pencil'; // pencil, eraser, fill, line, rect, eyedropper
let currentColor = '#ff4757';
let showGrid = true;
let isDrawing = false;
let symmetry = 'none'; // none, x, y, both

// Store pixel data
let pixels = new Array(GRID_SIZE * GRID_SIZE).fill(null);

// ── Undo/Redo Stack ──
const undoStack = [];
const redoStack = [];
const MAX_UNDO = 50;

function saveUndoState() {
  undoStack.push([...pixels]);
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack.length = 0; // Clear redo on new action
  updateUndoRedoButtons();
}

function undo() {
  if (undoStack.length === 0) return;
  redoStack.push([...pixels]);
  pixels = undoStack.pop();
  render();
  updateUndoRedoButtons();
}

function redo() {
  if (redoStack.length === 0) return;
  undoStack.push([...pixels]);
  pixels = redoStack.pop();
  render();
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  const undoBtn = $('#undoBtn');
  const redoBtn = $('#redoBtn');
  if (undoBtn) undoBtn.disabled = undoStack.length === 0;
  if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

// ── Animation Timeline ──
let frames = [];
let currentFrame = 0;
let isAnimating = false;
let animationTimer = null;
let animFps = 6;

function addFrame() {
  frames.push([...pixels]);
  currentFrame = frames.length - 1;
  renderTimeline();
}

function loadFrame(idx) {
  if (idx < 0 || idx >= frames.length) return;
  currentFrame = idx;
  pixels = [...frames[idx]];
  render();
  renderTimeline();
}

function deleteFrame(idx) {
  if (frames.length <= 1) return;
  frames.splice(idx, 1);
  if (currentFrame >= frames.length) currentFrame = frames.length - 1;
  pixels = [...frames[currentFrame]];
  render();
  renderTimeline();
}

function renderTimeline() {
  const container = $('#timelineFrames');
  if (!container) return;
  container.innerHTML = frames.map((frame, i) => {
    const miniCanvas = document.createElement('canvas');
    miniCanvas.width = 64; miniCanvas.height = 64;
    const miniCtx = miniCanvas.getContext('2d');
    const ps = 64 / GRID_SIZE;
    frame.forEach((color, idx) => {
      if (color) {
        const x = (idx % GRID_SIZE) * ps;
        const y = Math.floor(idx / GRID_SIZE) * ps;
        miniCtx.fillStyle = color;
        miniCtx.fillRect(x, y, ps, ps);
      }
    });
    return `<div class="timeline-frame ${i === currentFrame ? 'active' : ''}" data-idx="${i}">
      <img src="${miniCanvas.toDataURL()}" width="64" height="64">
      <span class="frame-num">#${i + 1}</span>
      ${frames.length > 1 ? `<button class="frame-delete" data-idx="${i}">✕</button>` : ''}
    </div>`;
  }).join('');
  $('#frameCount').textContent = `${currentFrame + 1}/${frames.length}`;
}

function toggleAnimation() {
  isAnimating = !isAnimating;
  const btn = $('#playAnimBtn');
  if (isAnimating) {
    btn.textContent = '⏸ Pause';
    let frameIdx = 0;
    animationTimer = setInterval(() => {
      if (frames.length < 2) { toggleAnimation(); return; }
      frameIdx = (frameIdx + 1) % frames.length;
      pixels = [...frames[frameIdx]];
      currentFrame = frameIdx;
      render();
      renderTimeline();
    }, 1000 / animFps);
  } else {
    btn.textContent = '▶ Play';
    clearInterval(animationTimer);
  }
}

function initCanvas() {
  canvas.width = DISPLAY_SIZE;
  canvas.height = DISPLAY_SIZE;
  frames = [[...pixels]]; // Initial frame
  renderTimeline();
  render();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Checkerboard background for transparency
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#1a1a24' : '#22222e';
      ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    }
  }

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
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath(); ctx.moveTo(i * PIXEL_SIZE, 0); ctx.lineTo(i * PIXEL_SIZE, DISPLAY_SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * PIXEL_SIZE); ctx.lineTo(DISPLAY_SIZE, i * PIXEL_SIZE); ctx.stroke();
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
    applySymmetry(x, y, currentColor);
  } else if (currentTool === 'eraser') {
    pixels[idx] = null;
    applySymmetry(x, y, null);
  } else if (currentTool === 'fill') {
    fill(x, y, pixels[idx], currentColor);
  } else if (currentTool === 'eyedropper') {
    if (pixels[idx]) {
      currentColor = pixels[idx];
      $('#currentColor').value = currentColor;
    }
  }
  render();
}

function applySymmetry(x, y, color) {
  if (symmetry === 'x' || symmetry === 'both') {
    const mirrorX = GRID_SIZE - 1 - x;
    pixels[y * GRID_SIZE + mirrorX] = color;
  }
  if (symmetry === 'y' || symmetry === 'both') {
    const mirrorY = GRID_SIZE - 1 - y;
    pixels[mirrorY * GRID_SIZE + x] = color;
  }
  if (symmetry === 'both') {
    const mirrorX = GRID_SIZE - 1 - x;
    const mirrorY = GRID_SIZE - 1 - y;
    pixels[mirrorY * GRID_SIZE + mirrorX] = color;
  }
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
      stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
    }
  }
}

// Mouse events
let lastPos = null;

canvas.addEventListener('mousedown', (e) => {
  saveUndoState();
  isDrawing = true;
  const { x, y } = getCoords(e);
  lastPos = { x, y };
  draw(x, y);
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;
  if (currentTool === 'fill' || currentTool === 'eyedropper') return;
  const { x, y } = getCoords(e);
  if (lastPos && (lastPos.x !== x || lastPos.y !== y)) {
    drawLine(lastPos.x, lastPos.y, x, y);
  }
  lastPos = { x, y };
});

window.addEventListener('mouseup', () => { isDrawing = false; lastPos = null; });
canvas.addEventListener('mouseleave', () => { isDrawing = false; lastPos = null; });

function drawLine(x0, y0, x1, y1) {
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  while (true) {
    draw(x0, y0);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
}

// ── ASCII Art Export ──
const ASCII_RAMPS = {
  standard: ' .:-=+*#%@',
  detailed: ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  blocks: ' ░▒▓█',
  simple: ' .:oO@#'
};

function generateAsciiArt(rampKey = 'standard') {
  const ramp = ASCII_RAMPS[rampKey];
  let ascii = '';
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const color = pixels[y * GRID_SIZE + x];
      if (!color) { ascii += '  '; continue; }
      // Convert hex to grayscale brightness
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      const idx = Math.floor(brightness * (ramp.length - 1));
      const ch = ramp[idx];
      ascii += ch + ch; // Double for aspect ratio
    }
    ascii += '\n';
  }
  return ascii;
}

function showAsciiModal() {
  let modal = $('#asciiModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'asciiModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `<div class="glass-card modal-content" style="max-width:600px">
      <div class="modal-header"><h2>🔤 ASCII Art Export</h2><button class="icon-btn" id="closeAsciiModal">❌</button></div>
      <div style="margin-bottom:1rem"><label style="font-size:0.8rem;color:var(--text-muted)">Character Ramp</label>
        <select id="asciiRamp" style="width:100%;padding:0.5rem;background:var(--bg-input,#1a1a24);color:var(--text);border:1px solid var(--border);border-radius:8px;margin-top:0.3rem">
          <option value="standard">Standard (.:-=+*#%@)</option>
          <option value="blocks">Block (░▒▓█)</option>
          <option value="simple">Simple (.:oO@#)</option>
          <option value="detailed">Detailed (70 chars)</option>
        </select>
      </div>
      <pre id="asciiOutput" style="font-family:monospace;font-size:8px;line-height:1;background:var(--bg-surface,#12121e);padding:1rem;border-radius:8px;overflow:auto;max-height:300px;white-space:pre;border:1px solid var(--border)"></pre>
      <button class="btn btn-primary w-full mt-3" id="copyAsciiBtn">📋 Copy ASCII Art</button>
    </div>`;
    document.body.appendChild(modal);
    $('#closeAsciiModal').addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });
    $('#asciiRamp').addEventListener('change', e => { $('#asciiOutput').textContent = generateAsciiArt(e.target.value); });
    $('#copyAsciiBtn').addEventListener('click', () => {
      navigator.clipboard.writeText($('#asciiOutput').textContent);
      $('#copyAsciiBtn').textContent = '✅ Copied!';
      setTimeout(() => { $('#copyAsciiBtn').textContent = '📋 Copy ASCII Art'; }, 2000);
    });
  }
  $('#asciiOutput').textContent = generateAsciiArt('standard');
  $('#asciiRamp').value = 'standard';
  modal.classList.add('active');
}

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
  saveUndoState();
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

// Symmetry
const symBtn = $('#symmetryBtn');
if (symBtn) {
  symBtn.addEventListener('click', () => {
    const modes = ['none', 'x', 'y', 'both'];
    const labels = ['Off', 'Mirror ↔', 'Mirror ↕', 'Mirror ✛'];
    const idx = (modes.indexOf(symmetry) + 1) % modes.length;
    symmetry = modes[idx];
    symBtn.textContent = '🪞 ' + labels[idx];
  });
}

$('#clearBtn').addEventListener('click', () => {
  if(confirm('Clear canvas?')) { saveUndoState(); pixels.fill(null); render(); }
});

// Undo/Redo buttons
const undoBtn = $('#undoBtn');
const redoBtn = $('#redoBtn');
if (undoBtn) undoBtn.addEventListener('click', undo);
if (redoBtn) redoBtn.addEventListener('click', redo);

// ASCII export
const asciiBtn = $('#asciiBtn');
if (asciiBtn) asciiBtn.addEventListener('click', showAsciiModal);

// Add Frame button
const addFrameBtn = $('#addFrameBtn');
if (addFrameBtn) addFrameBtn.addEventListener('click', () => { frames[currentFrame] = [...pixels]; addFrame(); });

// Play animation
const playAnimBtn = $('#playAnimBtn');
if (playAnimBtn) playAnimBtn.addEventListener('click', toggleAnimation);

// Timeline clicks
document.addEventListener('click', e => {
  if (e.target.closest('.frame-delete')) {
    e.stopPropagation();
    deleteFrame(parseInt(e.target.closest('.frame-delete').dataset.idx));
  } else if (e.target.closest('.timeline-frame')) {
    loadFrame(parseInt(e.target.closest('.timeline-frame').dataset.idx));
  }
});

$('#downloadBtn').addEventListener('click', () => {
  const wasGrid = showGrid;
  showGrid = false; render();
  const link = document.createElement('a');
  link.download = `pixel-art-${Date.now()}.png`;
  link.href = canvas.toDataURL();
  link.click();
  showGrid = wasGrid; render();
});

// Export animated GIF placeholder — would need gif.js library
// For now, export as spritesheet
const exportSpriteBtn = $('#exportSpriteBtn');
if (exportSpriteBtn) {
  exportSpriteBtn.addEventListener('click', () => {
    if (frames.length < 2) { alert('Add at least 2 frames to export a spritesheet.'); return; }
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = DISPLAY_SIZE * frames.length;
    spriteCanvas.height = DISPLAY_SIZE;
    const spriteCtx = spriteCanvas.getContext('2d');
    frames.forEach((frame, fi) => {
      frame.forEach((color, idx) => {
        if (color) {
          const x = (idx % GRID_SIZE) * PIXEL_SIZE + fi * DISPLAY_SIZE;
          const y = Math.floor(idx / GRID_SIZE) * PIXEL_SIZE;
          spriteCtx.fillStyle = color;
          spriteCtx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
        }
      });
    });
    const link = document.createElement('a');
    link.download = `spritesheet-${Date.now()}.png`;
    link.href = spriteCanvas.toDataURL();
    link.click();
  });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
  else if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
  else if (e.key === 'b') { currentTool = 'pencil'; $$('.tool-btn').forEach(b => b.classList.toggle('active', b.dataset.tool === 'pencil')); }
  else if (e.key === 'e') { currentTool = 'eraser'; $$('.tool-btn').forEach(b => b.classList.toggle('active', b.dataset.tool === 'eraser')); }
  else if (e.key === 'f') { currentTool = 'fill'; $$('.tool-btn').forEach(b => b.classList.toggle('active', b.dataset.tool === 'fill')); }
  else if (e.key === 'g') { showGrid = !showGrid; render(); }
});

// Theme
if (typeof QU !== 'undefined') { QU.initTheme(); }
else {
  $('#themeBtn').addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.dataset.theme === 'dark';
    html.dataset.theme = isDark ? 'light' : 'dark';
    $('#themeBtn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', html.dataset.theme);
  });
  if (localStorage.getItem('theme') === 'light') { document.documentElement.dataset.theme = 'light'; $('#themeBtn').textContent = '☀️'; }
}

initCanvas();
updateUndoRedoButtons();
})();
