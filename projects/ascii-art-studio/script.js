(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ── Tabs ──
$$('.tab').forEach(t => t.addEventListener('click', () => {
    $$('.tab').forEach(tb => tb.classList.remove('active'));
    $$('.panel').forEach(p => p.classList.add('hidden'));
    t.classList.add('active');
    $(`#panel-${t.dataset.tab}`).classList.remove('hidden');
}));

// ══════════════════════════════════════
// TEXT BANNER (Figlet-style)
// ══════════════════════════════════════
const FONTS = {
    standard: {
        ' ': ['     ','     ','     ','     ','     '],
        'A': [' ███ ','█   █','█████','█   █','█   █'],
        'B': ['████ ','█   █','████ ','█   █','████ '],
        'C': [' ████','█    ','█    ','█    ',' ████'],
        'D': ['████ ','█   █','█   █','█   █','████ '],
        'E': ['█████','█    ','████ ','█    ','█████'],
        'F': ['█████','█    ','████ ','█    ','█    '],
        'G': [' ████','█    ','█ ███','█   █',' ████'],
        'H': ['█   █','█   █','█████','█   █','█   █'],
        'I': ['█████','  █  ','  █  ','  █  ','█████'],
        'J': ['█████','   █ ','   █ ','█  █ ',' ██  '],
        'K': ['█  █ ','█ █  ','██   ','█ █  ','█  █ '],
        'L': ['█    ','█    ','█    ','█    ','█████'],
        'M': ['█   █','██ ██','█ █ █','█   █','█   █'],
        'N': ['█   █','██  █','█ █ █','█  ██','█   █'],
        'O': [' ███ ','█   █','█   █','█   █',' ███ '],
        'P': ['████ ','█   █','████ ','█    ','█    '],
        'Q': [' ███ ','█   █','█ █ █','█  █ ',' ██ █'],
        'R': ['████ ','█   █','████ ','█ █  ','█  █ '],
        'S': [' ████','█    ',' ███ ','    █','████ '],
        'T': ['█████','  █  ','  █  ','  █  ','  █  '],
        'U': ['█   █','█   █','█   █','█   █',' ███ '],
        'V': ['█   █','█   █','█   █',' █ █ ','  █  '],
        'W': ['█   █','█   █','█ █ █','██ ██','█   █'],
        'X': ['█   █',' █ █ ','  █  ',' █ █ ','█   █'],
        'Y': ['█   █',' █ █ ','  █  ','  █  ','  █  '],
        'Z': ['█████','   █ ','  █  ',' █   ','█████'],
        '0': [' ███ ','█  ██','█ █ █','██  █',' ███ '],
        '1': ['  █  ',' ██  ','  █  ','  █  ','█████'],
        '2': [' ███ ','█   █','  ██ ',' █   ','█████'],
        '3': ['████ ','    █',' ███ ','    █','████ '],
        '4': ['█   █','█   █','█████','    █','    █'],
        '5': ['█████','█    ','████ ','    █','████ '],
        '6': [' ████','█    ','████ ','█   █',' ███ '],
        '7': ['█████','   █ ','  █  ',' █   ','█    '],
        '8': [' ███ ','█   █',' ███ ','█   █',' ███ '],
        '9': [' ███ ','█   █',' ████','    █','████ '],
        '!': ['  █  ','  █  ','  █  ','     ','  █  '],
    },
    block: null, shadow: null, banner: null, big: null, mini: null, bubble: null, digital: null
};

function generateBanner(text, fontName) {
    const font = FONTS.standard; // Use standard for all — others generate variations
    const upper = text.toUpperCase();
    const lines = ['','','','',''];
    for (const ch of upper) {
        const glyph = font[ch] || font[' '];
        for (let i = 0; i < 5; i++) lines[i] += (glyph[i] || '     ') + ' ';
    }
    // Apply style transforms
    if (fontName === 'shadow') return lines.map(l => l).join('\n') + '\n' + lines[4].replace(/█/g,'░').replace(/ /g,' ');
    if (fontName === 'block') return lines.map(l => l.replace(/█/g,'▓')).join('\n');
    if (fontName === 'bubble') return lines.map(l => l.replace(/█/g,'●').replace(/ /g,'○')).join('\n');
    if (fontName === 'digital') return lines.map(l => l.replace(/█/g,'1').replace(/ /g,'0')).join('\n');
    if (fontName === 'mini') return lines.filter((_,i)=>i%2===0).map(l=>l.replace(/█/g,'#')).join('\n');
    return lines.join('\n');
}

function updateBanner() {
    const text = $('#bannerInput').value || 'HELLO';
    const font = $('#fontSelect').value;
    $('#bannerOutput').textContent = generateBanner(text, font);
}

$('#bannerInput').addEventListener('input', updateBanner);
$('#fontSelect').addEventListener('change', updateBanner);
$('#bannerWidth').addEventListener('input', e => { $('#widthVal').textContent = e.target.value; updateBanner(); });

// ══════════════════════════════════════
// IMAGE TO ASCII
// ══════════════════════════════════════
const CHARSETS = {
    standard: '@#%*+=-:. ',
    blocks: '█▓▒░ ',
    simple: '#*. '
};

$('#imageUpload').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const img = new Image();
    img.onload = () => convertImageToAscii(img);
    img.src = URL.createObjectURL(file);
});

$('#imgWidth').addEventListener('input', e => { $('#imgWidthVal').textContent = e.target.value; });
$('#charset').addEventListener('change', () => {
    const c = $('#imgCanvas'); if (c.width > 0) convertImageToAscii();
});

function convertImageToAscii(img) {
    const c = $('#imgCanvas');
    const cx = c.getContext('2d');
    const targetW = parseInt($('#imgWidth').value);
    if (img) {
        const aspect = img.height / img.width;
        const targetH = Math.round(targetW * aspect * 0.45);
        c.width = targetW; c.height = targetH;
        cx.drawImage(img, 0, 0, targetW, targetH);
    }
    const charset = CHARSETS[$('#charset').value] || CHARSETS.standard;
    const data = cx.getImageData(0, 0, c.width, c.height).data;
    let ascii = '';
    for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
            const i = (y * c.width + x) * 4;
            const brightness = (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114) / 255;
            const charIdx = Math.floor((1 - brightness) * (charset.length - 1));
            ascii += charset[charIdx];
        }
        ascii += '\n';
    }
    $('#imageOutput').textContent = ascii;
}

// ══════════════════════════════════════
// FREEHAND DRAW
// ══════════════════════════════════════
const DRAW_W = 60, DRAW_H = 25;
let drawGrid = Array.from({length: DRAW_H}, () => Array(DRAW_W).fill(' '));
let isDrawing = false;

function renderDrawGrid() {
    const container = $('#drawGrid');
    container.style.gridTemplateColumns = `repeat(${DRAW_W}, 1fr)`;
    container.innerHTML = '';
    for (let r = 0; r < DRAW_H; r++) {
        for (let c = 0; c < DRAW_W; c++) {
            const cell = document.createElement('div');
            cell.className = 'draw-cell' + (drawGrid[r][c] !== ' ' ? ' filled' : '');
            cell.textContent = drawGrid[r][c] === ' ' ? '' : drawGrid[r][c];
            cell.dataset.r = r; cell.dataset.c = c;
            cell.addEventListener('mousedown', () => { isDrawing = true; paintCell(r, c); });
            cell.addEventListener('mouseover', () => { if (isDrawing) paintCell(r, c); });
            container.appendChild(cell);
        }
    }
    updateDrawOutput();
}

function paintCell(r, c) {
    const ch = $('#drawChar').value || '█';
    drawGrid[r][c] = ch;
    const cell = $$(`.draw-cell`)[r * DRAW_W + c];
    if (cell) { cell.textContent = ch; cell.classList.add('filled'); }
    updateDrawOutput();
}

document.addEventListener('mouseup', () => { isDrawing = false; });

function updateDrawOutput() {
    $('#drawOutput').textContent = drawGrid.map(row => row.join('')).join('\n');
}

$('#clearDrawBtn').addEventListener('click', () => {
    drawGrid = Array.from({length: DRAW_H}, () => Array(DRAW_W).fill(' '));
    renderDrawGrid();
});

// ── Copy / Download ──
$('#copyBtn').addEventListener('click', () => {
    const activePanel = $$('.panel:not(.hidden)')[0];
    const output = activePanel ? activePanel.querySelector('.ascii-output') : null;
    if (output) { navigator.clipboard.writeText(output.textContent).catch(()=>{}); }
});

$('#downloadBtn').addEventListener('click', () => {
    const activePanel = $$('.panel:not(.hidden)')[0];
    const output = activePanel ? activePanel.querySelector('.ascii-output') : null;
    if (output) {
        const blob = new Blob([output.textContent], {type: 'text/plain'});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ascii-art-${Date.now()}.txt`; a.click();
    }
});

// Theme
$('#themeBtn').addEventListener('click', () => { const h=document.documentElement;const d=h.dataset.theme==='dark';h.dataset.theme=d?'light':'dark';$('#themeBtn').textContent=d?'☀️':'🌙';localStorage.setItem('theme',h.dataset.theme); });
if(localStorage.getItem('theme')==='light'){document.documentElement.dataset.theme='light';$('#themeBtn').textContent='☀️';}

updateBanner();
renderDrawGrid();
})();
