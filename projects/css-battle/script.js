(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const CHALLENGES = [
    {
        id: 1,
        target: '<style>\n  div {\n    width: 100px;\n    height: 100px;\n    background: #ec4899;\n    margin: 50px auto;\n  }\n</style>\n<div></div>',
        desc: "Create a simple pink square centered on the screen.",
        best: 120
    },
    {
        id: 2,
        target: '<style>\n  div {\n    width: 100px;\n    height: 100px;\n    background: #10b981;\n    border-radius: 50%;\n    margin: 50px auto;\n  }\n</style>\n<div></div>',
        desc: "Create a green circle.",
        best: 130
    },
    {
        id: 3,
        target: '<style>\n  body { margin: 0; background: #1a1a2e; display: flex; justify-content: center; align-items: center; height: 100vh; }\n  .box {\n    width: 80px;\n    height: 80px;\n    background: #f59e0b;\n    box-shadow: 100px 0 #f59e0b, -100px 0 #f59e0b;\n  }\n</style>\n<div class="box"></div>',
        desc: "Three orange boxes in a row on a dark background.",
        best: 180
    }
];

let currentChallenge = 0;

function initNav() {
    $('#challengeNav').innerHTML = CHALLENGES.map((c, i) => 
        `<div class="challenge-dot ${i===0?'active':''}" data-index="${i}">${i+1}</div>`
    ).join('');
    
    $$('.challenge-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            $$('.challenge-dot').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            loadChallenge(parseInt(dot.dataset.index));
        });
    });
}

function loadChallenge(index) {
    currentChallenge = index;
    const c = CHALLENGES[index];
    
    // Inject target HTML securely
    const targetIframe = document.createElement('iframe');
    targetIframe.style.width = '100%';
    targetIframe.style.height = '100%';
    targetIframe.style.border = 'none';
    $('#targetFrame').innerHTML = '<span class="frame-label target">Target</span>';
    $('#targetFrame').appendChild(targetIframe);
    
    targetIframe.contentWindow.document.open();
    targetIframe.contentWindow.document.write(`
        <!DOCTYPE html><html><head><style>body{margin:0;overflow:hidden;background:#fff;display:flex;justify-content:center;align-items:center;height:100vh}</style></head><body>
        ${c.target}
        </body></html>
    `);
    targetIframe.contentWindow.document.close();
    
    $('#cssEditor').value = "<!-- Write your code here -->\n<style>\n  div {\n    \n  }\n</style>\n<div></div>";
    updateOutput();
}

function updateOutput() {
    const code = $('#cssEditor').value;
    const charCount = code.length;
    $('#charCount').textContent = `${charCount} chars`;
    
    const iframe = $('#outputIframe');
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(`
        <!DOCTYPE html><html><head><style>body{margin:0;overflow:hidden;background:#fff;display:flex;justify-content:center;align-items:center;height:100vh}</style></head><body>
        ${code}
        </body></html>
    `);
    iframe.contentWindow.document.close();
}

$('#cssEditor').addEventListener('input', updateOutput);
// Basic tab support
$('#cssEditor').addEventListener('keydown', function(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = this.selectionStart;
    const end = this.selectionEnd;
    this.value = this.value.substring(0, start) + "  " + this.value.substring(end);
    this.selectionStart = this.selectionEnd = start + 2;
  }
});

$('#resetCssBtn').addEventListener('click', () => loadChallenge(currentChallenge));

$('#submitBtn').addEventListener('click', () => {
    // In a real application, you'd use html2canvas or similar to compare pixel diffs.
    // Here we'll do a simple mock evaluation based on character count vs best.
    const charCount = $('#cssEditor').value.length;
    const c = CHALLENGES[currentChallenge];
    
    // Mock simulation
    $('#submitBtn').textContent = 'Evaluating...';
    setTimeout(() => {
        let score = Math.min(100, Math.floor((c.best / charCount) * 100));
        let badgeClass = 'bronze';
        if (score >= 95) badgeClass = 'gold';
        else if (score >= 80) badgeClass = 'silver';
        
        const badge = $('#scoreBadge');
        badge.className = `score-badge ${badgeClass}`;
        badge.textContent = `Score: ${score}%`;
        
        $$('.challenge-dot')[currentChallenge].classList.add('solved');
        
        $('#submitBtn').textContent = '🚀 Submit';
    }, 1000);
});

// Theme
if (typeof QU !== 'undefined') QU.initTheme();
else {
    $('#themeBtn').addEventListener('click', () => { const h = document.documentElement; const d = h.dataset.theme === 'dark'; h.dataset.theme = d ? 'light' : 'dark'; $('#themeBtn').textContent = d ? '☀️' : '🌙'; localStorage.setItem('theme', h.dataset.theme); });
    if (localStorage.getItem('theme') === 'light') { document.documentElement.dataset.theme = 'light'; $('#themeBtn').textContent = '☀️'; }
}

initNav();
loadChallenge(0);

})();
