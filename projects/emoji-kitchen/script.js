(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const EMOJIS = ['😀','😂','🤣','😊','😍','🥰','😘','😎','🤩','🥳','😏','😒','😞','😢','😭','😤','🤬','😱','🤗','🤔','🤫','🤐','😴','🤮','🤧','😇','🥺','🤠','🤡','👻','💀','👽','🤖','🎃','😺','😸','❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','💕','💖','💝','💗','🔥','⭐','🌟','✨','💫','🌈','☀️','🌙','🌸','🌺','🌻','🌹','🍀','🍂','🌊','❄️','🐱','🐶','🐻','🐼','🐨','🦊','🦁','🐸','🐵','🦄','🐝','🦋','🐙','🐬','🐧','🐔','🍕','🍔','🍟','🍩','🍰','🎂','🍪','🍫','🍭','🍬','🧁','🍓','🍑','🍋','🥑','🎸','🎹','🎵','🎶','🎤','🏀','⚽','🎮','🎲','🎯','🏆','🎪','🎭','🎨','📸','💻','📱','🔑','💎','👑','🎩','🎒','👟','👓','💍'];

let emoji1 = null, emoji2 = null;
const canvas = $('#mashupCanvas');
const ctx = canvas.getContext('2d');
let history = [];

function renderGrid(container, searchId, selId, side) {
    const grid = $(container);
    const search = $(searchId);
    function render(filter = '') {
        const filtered = filter ? EMOJIS.filter(e => e.includes(filter)) : EMOJIS;
        grid.innerHTML = filtered.map(e =>
            `<div class="emoji-cell" data-emoji="${e}" data-side="${side}">${e}</div>`
        ).join('');
        grid.querySelectorAll('.emoji-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                grid.querySelectorAll('.emoji-cell').forEach(c => c.classList.remove('selected'));
                cell.classList.add('selected');
                if (side === 1) { emoji1 = cell.dataset.emoji; $(selId).textContent = emoji1; }
                else { emoji2 = cell.dataset.emoji; $(selId).textContent = emoji2; }
                generateMashup();
            });
        });
    }
    render();
    $(searchId).addEventListener('input', e => render(e.target.value));
}

function generateMashup() {
    if (!emoji1 || !emoji2) return;
    ctx.clearRect(0, 0, 200, 200);
    // Background gradient
    const grad = ctx.createRadialGradient(100, 100, 20, 100, 100, 100);
    grad.addColorStop(0, 'rgba(99,102,241,0.15)');
    grad.addColorStop(1, 'rgba(139,92,246,0.05)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 200, 200);
    // Draw emoji 1 (left half, slightly larger, offset)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 120, 200);
    ctx.clip();
    ctx.font = '100px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.9;
    ctx.fillText(emoji1, 80, 100);
    ctx.restore();
    // Draw emoji 2 (right half, flipped or overlaid)
    ctx.save();
    ctx.beginPath();
    ctx.rect(80, 0, 120, 200);
    ctx.clip();
    ctx.globalAlpha = 0.85;
    ctx.font = '90px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji2, 130, 110);
    ctx.restore();
    // Sparkle overlay
    ctx.globalAlpha = 1;
    ctx.font = '20px serif';
    const sparkles = ['✨','⭐','💫'];
    for (let i = 0; i < 3; i++) {
        ctx.fillText(sparkles[i], 20 + Math.random() * 160, 20 + Math.random() * 160);
    }
    $('#mashupLabel').textContent = `${emoji1} + ${emoji2}`;
    // Add to history
    const imageData = canvas.toDataURL();
    history.unshift({ emoji1, emoji2, image: imageData });
    if (history.length > 12) history.pop();
    renderHistory();
}

function renderHistory() {
    const container = $('#history');
    container.innerHTML = history.map((h, i) => `<div class="history-item" data-idx="${i}" title="${h.emoji1} + ${h.emoji2}"><img src="${h.image}" width="60" height="60" style="border-radius:6px"></div>`).join('');
    $$('.history-item').forEach(el => el.addEventListener('click', () => {
        const h = history[parseInt(el.dataset.idx)];
        const img = new Image();
        img.onload = () => { ctx.clearRect(0,0,200,200); ctx.drawImage(img,0,0); };
        img.src = h.image;
        $('#mashupLabel').textContent = `${h.emoji1} + ${h.emoji2}`;
    }));
}

$('#randomBtn').addEventListener('click', () => {
    emoji1 = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    emoji2 = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    $('#sel1').textContent = emoji1;
    $('#sel2').textContent = emoji2;
    generateMashup();
});

$('#downloadBtn').addEventListener('click', () => {
    if (!emoji1 || !emoji2) return;
    const a = document.createElement('a');
    a.download = `emoji-mashup-${Date.now()}.png`;
    a.href = canvas.toDataURL();
    a.click();
});

// Theme
$('#themeBtn').addEventListener('click', () => { const h=document.documentElement;const d=h.dataset.theme==='dark';h.dataset.theme=d?'light':'dark';$('#themeBtn').textContent=d?'☀️':'🌙';localStorage.setItem('theme',h.dataset.theme); });
if(localStorage.getItem('theme')==='light'){document.documentElement.dataset.theme='light';$('#themeBtn').textContent='☀️';}

renderGrid('#grid1', '#search1', '#sel1', 1);
renderGrid('#grid2', '#search2', '#sel2', 2);
// Draw initial empty state
ctx.fillStyle = 'rgba(99,102,241,0.1)';
ctx.fillRect(0,0,200,200);
ctx.font = '48px serif'; ctx.textAlign = 'center'; ctx.fillText('🤷', 100, 110);
})();
