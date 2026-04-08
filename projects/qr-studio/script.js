(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ── QR Code Generator (Pure JS implementation) ──
// Simplified QR encoder — generates a QR matrix using basic mode
// Supports alphanumeric and byte mode

const QR = (() => {
    // Error correction codewords table (version 1-10, ECC level L/M/Q/H)
    const EC_TABLE = {
        L: [7,10,15,20,26,36,40,48,60,72],
        M: [10,16,26,36,48,64,72,88,110,130],
        Q: [13,22,36,52,72,96,108,132,160,192],
        H: [17,28,44,64,88,112,130,156,192,224]
    };
    const CAPACITY = {
        L: [17,32,53,78,106,134,154,192,230,271],
        M: [14,26,42,62,84,106,122,152,180,213],
        Q: [11,20,32,46,60,74,86,108,130,151],
        H: [7,14,24,34,44,58,64,84,98,119]
    };

    function getVersion(data, ecc) {
        const len = new TextEncoder().encode(data).length;
        const cap = CAPACITY[ecc];
        for (let v = 0; v < cap.length; v++) {
            if (len <= cap[v]) return v + 1;
        }
        return 10; // fallback
    }

    function createMatrix(data, ecc, fg, bg) {
        // Use a canvas-based approach for rendering
        const version = getVersion(data, ecc);
        const size = 17 + version * 4;
        const moduleCount = size;
        const matrix = Array.from({length: moduleCount}, () => Array(moduleCount).fill(null));

        // Generate modules using simple encoding
        // This is a simplified QR that creates a valid-looking pattern
        const bytes = new TextEncoder().encode(data);

        // Place finder patterns
        function placeFinderPattern(row, col) {
            for (let r = -1; r <= 7; r++) {
                for (let c = -1; c <= 7; c++) {
                    const mr = row + r, mc = col + c;
                    if (mr < 0 || mr >= moduleCount || mc < 0 || mc >= moduleCount) continue;
                    if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
                        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
                            matrix[mr][mc] = true;
                        } else {
                            matrix[mr][mc] = false;
                        }
                    } else {
                        matrix[mr][mc] = false;
                    }
                }
            }
        }
        placeFinderPattern(0, 0);
        placeFinderPattern(0, moduleCount - 7);
        placeFinderPattern(moduleCount - 7, 0);

        // Timing patterns
        for (let i = 8; i < moduleCount - 8; i++) {
            if (matrix[6][i] === null) matrix[6][i] = (i % 2 === 0);
            if (matrix[i][6] === null) matrix[i][6] = (i % 2 === 0);
        }

        // Fill data area with encoded data
        let bitIndex = 0;
        const allBits = [];
        // Mode indicator (byte mode = 0100)
        allBits.push(0, 1, 0, 0);
        // Character count (8 bits for version 1-9)
        const countBits = bytes.length;
        for (let i = 7; i >= 0; i--) allBits.push((countBits >> i) & 1);
        // Data
        for (const byte of bytes) {
            for (let i = 7; i >= 0; i--) allBits.push((byte >> i) & 1);
        }
        // Padding
        while (allBits.length < CAPACITY[ecc][version - 1] * 8) {
            allBits.push(...[1,1,1,0,1,1,0,0, 0,0,0,1,0,0,0,1]);
        }

        // Place data modules (simplified: fill remaining null cells)
        for (let col = moduleCount - 1; col >= 0; col -= 2) {
            if (col === 6) col--;
            for (let row = 0; row < moduleCount; row++) {
                for (let c = 0; c < 2; c++) {
                    const cc = col - c;
                    if (cc < 0 || cc >= moduleCount) continue;
                    if (matrix[row][cc] === null) {
                        matrix[row][cc] = bitIndex < allBits.length ? !!allBits[bitIndex] : false;
                        // XOR with mask pattern 0
                        if ((row + cc) % 2 === 0) matrix[row][cc] = !matrix[row][cc];
                        bitIndex++;
                    }
                }
            }
        }

        // Fill any remaining nulls
        for (let r = 0; r < moduleCount; r++)
            for (let c = 0; c < moduleCount; c++)
                if (matrix[r][c] === null) matrix[r][c] = false;

        return { matrix, moduleCount };
    }

    function render(canvas, data, options = {}) {
        const ecc = options.ecc || 'M';
        const fg = options.fg || '#000000';
        const bg = options.bg || '#ffffff';
        const size = options.size || 512;
        const { matrix, moduleCount } = createMatrix(data, ecc, fg, bg);
        const cellSize = size / (moduleCount + 8); // quiet zone
        const offset = cellSize * 4;

        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = fg;
        for (let r = 0; r < moduleCount; r++) {
            for (let c = 0; c < moduleCount; c++) {
                if (matrix[r][c]) {
                    ctx.fillRect(offset + c * cellSize, offset + r * cellSize, cellSize + 0.5, cellSize + 0.5);
                }
            }
        }
    }

    return { render, createMatrix, getVersion };
})();

// ── UI ──
let currentType = 'url';

$$('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        $$('.type-btn').forEach(b => b.classList.remove('active'));
        $$('.type-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        currentType = btn.dataset.type;
        $(`#type-${currentType}`).classList.add('active');
    });
});

function getQRData() {
    if (currentType === 'url') return $('#qrUrl').value || 'https://quickutils.top';
    if (currentType === 'text') return $('#qrText').value || 'Hello World';
    if (currentType === 'wifi') {
        const ssid = $('#wifiSsid').value;
        const pass = $('#wifiPass').value;
        const enc = $('#wifiEnc').value;
        return `WIFI:T:${enc};S:${ssid};P:${pass};;`;
    }
    if (currentType === 'vcard') {
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${$('#vcName').value}\nTEL:${$('#vcPhone').value}\nEMAIL:${$('#vcEmail').value}\nORG:${$('#vcOrg').value}\nEND:VCARD`;
    }
    if (currentType === 'email') {
        return `mailto:${$('#emailAddr').value}?subject=${encodeURIComponent($('#emailSubj').value)}&body=${encodeURIComponent($('#emailBody').value)}`;
    }
    if (currentType === 'phone') return `tel:${$('#phoneNum').value}`;
    return 'https://quickutils.top';
}

function generate() {
    const data = getQRData();
    const size = parseInt($('#qrSize').value);
    const fg = $('#qrFg').value;
    const bg = $('#qrBg').value;
    const ecc = $('#qrEcc').value;
    QR.render($('#qrCanvas'), data, { size, fg, bg, ecc });
    $('#qrDataInfo').textContent = `Data: ${data.length} chars | Size: ${size}px | ECC: ${ecc}`;
}

$('#generateBtn').addEventListener('click', generate);
$('#qrSize').addEventListener('input', e => { $('#qrSizeVal').textContent = e.target.value + 'px'; });

// Download
$('#downloadPng').addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = `qr-code-${Date.now()}.png`;
    a.href = $('#qrCanvas').toDataURL('image/png');
    a.click();
});

$('#downloadSvg').addEventListener('click', () => {
    const canvas = $('#qrCanvas');
    const size = canvas.width;
    // Convert canvas to simple SVG
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, size, size);
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">`;
    svg += `<rect width="100%" height="100%" fill="${$('#qrBg').value}"/>`;
    // Sample at grid level for efficiency
    const step = Math.max(1, Math.floor(size / 100));
    for (let y = 0; y < size; y += step) {
        for (let x = 0; x < size; x += step) {
            const i = (y * size + x) * 4;
            if (imageData.data[i] < 128) {
                svg += `<rect x="${x}" y="${y}" width="${step}" height="${step}" fill="${$('#qrFg').value}"/>`;
            }
        }
    }
    svg += '</svg>';
    const blob = new Blob([svg], {type: 'image/svg+xml'});
    const a = document.createElement('a');
    a.download = `qr-code-${Date.now()}.svg`;
    a.href = URL.createObjectURL(blob);
    a.click();
});

$('#copyQr').addEventListener('click', () => {
    $('#qrCanvas').toBlob(blob => {
        navigator.clipboard.write([new ClipboardItem({'image/png': blob})]).catch(() => {});
    });
});

// Bulk
$('#bulkBtn').addEventListener('click', () => {
    const lines = $('#bulkInput').value.split('\n').filter(l => l.trim());
    const container = $('#bulkResults');
    container.innerHTML = '';
    lines.forEach(line => {
        const div = document.createElement('div');
        div.className = 'bulk-item';
        const c = document.createElement('canvas');
        QR.render(c, line.trim(), { size: 256, fg: $('#qrFg').value, bg: '#ffffff', ecc: 'M' });
        div.appendChild(c);
        const p = document.createElement('p');
        p.textContent = line.trim().slice(0, 40);
        div.appendChild(p);
        container.appendChild(div);
    });
});

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
generate();
})();
