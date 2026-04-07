(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

let currentPalette = [];
let exportTab = 'css';

// ── Color Utilities ──
function hexToHsl(hex) {
    let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h, s, l = (max+min)/2;
    if (max === min) { h = s = 0; }
    else {
        const d = max - min;
        s = l > 0.5 ? d/(2-max-min) : d/(max+min);
        if (max === r) h = ((g-b)/d+(g<b?6:0))/6;
        else if (max === g) h = ((b-r)/d+2)/6;
        else h = ((r-g)/d+4)/6;
    }
    return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
}

function hslToHex(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
        const hue2rgb = (p, q, t) => { if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p; };
        const q = l < 0.5 ? l*(1+s) : l+s-l*s;
        const p = 2*l-q;
        r = hue2rgb(p, q, h+1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h-1/3);
    }
    return '#' + [r,g,b].map(x => Math.round(x*255).toString(16).padStart(2,'0')).join('');
}

function hexToRgb(hex) {
    return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}

function relativeLuminance(hex) {
    const [r,g,b] = hexToRgb(hex).map(c => { c /= 255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); });
    return 0.2126*r + 0.7152*g + 0.0722*b;
}

function contrastRatio(hex1, hex2) {
    const l1 = relativeLuminance(hex1), l2 = relativeLuminance(hex2);
    const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

// ── Harmony Generation ──
function generatePalette(baseHex, harmony) {
    const [h, s, l] = hexToHsl(baseHex);
    let colors = [baseHex];
    switch (harmony) {
        case 'complementary':
            colors.push(hslToHex((h+180)%360, s, l));
            colors.push(hslToHex(h, s, Math.min(l+20, 95)));
            colors.push(hslToHex((h+180)%360, s, Math.max(l-20, 5)));
            colors.push(hslToHex(h, Math.max(s-30, 10), l));
            break;
        case 'triadic':
            colors.push(hslToHex((h+120)%360, s, l));
            colors.push(hslToHex((h+240)%360, s, l));
            colors.push(hslToHex(h, s, Math.min(l+25, 95)));
            colors.push(hslToHex(h, s, Math.max(l-25, 5)));
            break;
        case 'analogous':
            colors.push(hslToHex((h+30)%360, s, l));
            colors.push(hslToHex((h+60)%360, s, l));
            colors.push(hslToHex((h-30+360)%360, s, l));
            colors.push(hslToHex((h-60+360)%360, s, l));
            break;
        case 'split':
            colors.push(hslToHex((h+150)%360, s, l));
            colors.push(hslToHex((h+210)%360, s, l));
            colors.push(hslToHex(h, s, Math.min(l+30, 95)));
            colors.push(hslToHex(h, s, Math.max(l-30, 5)));
            break;
        case 'tetradic':
            colors.push(hslToHex((h+90)%360, s, l));
            colors.push(hslToHex((h+180)%360, s, l));
            colors.push(hslToHex((h+270)%360, s, l));
            colors.push(hslToHex(h, Math.max(s-20,10), l));
            break;
        case 'monochromatic':
            for (let i = 1; i <= 4; i++) colors.push(hslToHex(h, s, Math.max(5, Math.min(95, l - 30 + i*15))));
            break;
    }
    return colors;
}

function renderPalette(colors, container) {
    container.innerHTML = colors.map(c =>
        `<div class="palette-swatch" style="background:${c}" data-color="${c}" title="${c}"><span>${c.toUpperCase()}</span></div>`
    ).join('');
    container.querySelectorAll('.palette-swatch').forEach(sw => {
        sw.addEventListener('click', () => {
            navigator.clipboard.writeText(sw.dataset.color).catch(()=>{});
        });
    });
}

$('#generateBtn').addEventListener('click', () => {
    currentPalette = generatePalette($('#baseColor').value, $('#harmonyType').value);
    renderPalette(currentPalette, $('#paletteDisplay'));
    updateExport();
    updateBlindness();
});

$('#randomBtn').addEventListener('click', () => {
    const randHex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
    $('#baseColor').value = randHex;
    $('#generateBtn').click();
});

// ── Contrast Checker ──
function updateContrast() {
    const fg = $('#fgColor').value, bg = $('#bgColor').value;
    const ratio = contrastRatio(fg, bg);
    $('#contrastPreview').style.color = fg;
    $('#contrastPreview').style.background = bg;
    const aaLarge = ratio >= 3; const aa = ratio >= 4.5; const aaa = ratio >= 7;
    $('#contrastResult').innerHTML = `
        <div>Ratio: <strong>${ratio.toFixed(2)}:1</strong></div>
        <div>AA Large Text: <span class="contrast-badge ${aaLarge?'pass':'fail'}">${aaLarge?'PASS':'FAIL'}</span></div>
        <div>AA Normal Text: <span class="contrast-badge ${aa?'pass':'fail'}">${aa?'PASS':'FAIL'}</span></div>
        <div>AAA Normal Text: <span class="contrast-badge ${aaa?'pass':'fail'}">${aaa?'PASS':'FAIL'}</span></div>
    `;
}
$('#fgColor').addEventListener('input', updateContrast);
$('#bgColor').addEventListener('input', updateContrast);

// ── Color Blindness ──
function simulateBlindness(hex, type) {
    const [r,g,b] = hexToRgb(hex);
    let nr=r, ng=g, nb=b;
    if (type === 'deuteranopia') { nr=r*0.625+g*0.375; ng=r*0.7+g*0.3; nb=b; }
    else if (type === 'protanopia') { nr=r*0.567+g*0.433; ng=r*0.558+g*0.442; nb=r*0.242+b*0.758; }
    else if (type === 'tritanopia') { nr=r*0.95+g*0.05; ng=g*0.433+b*0.567; nb=g*0.475+b*0.525; }
    else if (type === 'achromatopsia') { const gray=r*0.299+g*0.587+b*0.114; nr=ng=nb=gray; }
    return '#'+[nr,ng,nb].map(x => Math.round(Math.min(255,Math.max(0,x))).toString(16).padStart(2,'0')).join('');
}

function updateBlindness() {
    if (currentPalette.length === 0) return;
    const types = ['deuteranopia','protanopia','tritanopia','achromatopsia'];
    const labels = ['Deuteranopia (Red-Green)','Protanopia (Red)','Tritanopia (Blue-Yellow)','Achromatopsia (Mono)'];
    $('#blindnessDisplay').innerHTML = types.map((t,i) => `
        <div class="blindness-card">
            <h4>${labels[i]}</h4>
            <div class="blindness-colors">${currentPalette.map(c => `<div style="flex:1;background:${simulateBlindness(c,t)}"></div>`).join('')}</div>
        </div>
    `).join('');
}

// ── Export ──
function updateExport() {
    if (currentPalette.length === 0) return;
    let output = '';
    if (exportTab === 'css') {
        output = ':root {\n' + currentPalette.map((c,i) => `  --color-${i+1}: ${c};`).join('\n') + '\n}';
    } else if (exportTab === 'tailwind') {
        output = `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n${currentPalette.map((c,i) => `        'brand-${i+1}': '${c}',`).join('\n')}\n      }\n    }\n  }\n}`;
    } else if (exportTab === 'scss') {
        output = currentPalette.map((c,i) => `$color-${i+1}: ${c};`).join('\n');
    }
    $('#exportOutput').value = output;
}

$$('.export-tabs .btn').forEach(btn => {
    btn.addEventListener('click', () => {
        $$('.export-tabs .btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        exportTab = btn.dataset.tab;
        updateExport();
    });
});

$('#copyExportBtn').addEventListener('click', () => {
    $('#exportOutput').select();
    document.execCommand('copy');
});

// ── Image Extraction ──
$('#imageInput').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const img = new Image();
    img.onload = () => {
        const c = $('#imgCanvas'); c.style.display = 'block';
        const cx = c.getContext('2d');
        cx.drawImage(img, 0, 0, 300, 200);
        const data = cx.getImageData(0, 0, 300, 200).data;
        const colors = {}; 
        for (let i = 0; i < data.length; i += 16) {
            const r = Math.round(data[i]/32)*32, g = Math.round(data[i+1]/32)*32, b = Math.round(data[i+2]/32)*32;
            const hex = '#'+[r,g,b].map(x=>Math.min(255,x).toString(16).padStart(2,'0')).join('');
            colors[hex] = (colors[hex]||0) + 1;
        }
        const sorted = Object.entries(colors).sort((a,b) => b[1]-a[1]).slice(0, 5).map(e => e[0]);
        currentPalette = sorted;
        renderPalette(sorted, $('#extractedPalette'));
        updateExport(); updateBlindness();
    };
    img.src = URL.createObjectURL(file);
});

// ── Save/Load ──
$('#savePaletteBtn').addEventListener('click', () => {
    if (currentPalette.length === 0) return;
    const saved = JSON.parse(localStorage.getItem('qu_palettes') || '[]');
    saved.unshift(currentPalette);
    if (saved.length > 20) saved.pop();
    localStorage.setItem('qu_palettes', JSON.stringify(saved));
    renderSaved();
});

function renderSaved() {
    const saved = JSON.parse(localStorage.getItem('qu_palettes') || '[]');
    $('#savedPalettes').innerHTML = saved.map((p, i) =>
        `<div class="saved-palette" data-idx="${i}">${p.map(c => `<div style="flex:1;background:${c}"></div>`).join('')}</div>`
    ).join('') || '<p class="text-muted" style="font-size:0.8rem">No saved palettes</p>';
    $$('.saved-palette').forEach(el => {
        el.addEventListener('click', () => {
            const idx = parseInt(el.dataset.idx);
            currentPalette = saved[idx];
            renderPalette(currentPalette, $('#paletteDisplay'));
            updateExport(); updateBlindness();
        });
    });
}

// Theme
$('#themeBtn').addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.dataset.theme === 'dark';
    html.dataset.theme = isDark ? 'light' : 'dark';
    $('#themeBtn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', html.dataset.theme);
});
if (localStorage.getItem('theme') === 'light') { document.documentElement.dataset.theme = 'light'; $('#themeBtn').textContent = '☀️'; }

// Init
$('#generateBtn').click();
updateContrast();
renderSaved();
})();
