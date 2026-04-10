(() => {
'use strict';
const $ = s => document.querySelector(s);

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS = '0OIl1';
const WORDS = ['correct','horse','battery','staple','rainbow','thunder','diamond','crystal','phantom','wizard','dragon','castle','rocket','falcon','shadow','nebula','quantum','galaxy','zenith','cipher','arctic','blaze','cosmic','delta','echo','frost','golden','harbor','iris','jungle','karma','lunar','mystic','nova','omega','prism','quest','rover','solar','titan','ultra','viper','wander','xerox','yield','zephyr','anchor','beacon','candle','drift','ember','flame','gleam','haven','ivory','jade','knight','lemon','marble','nectar','oracle','pearl','quartz','ripple','silver','torch','velvet','whisper','alpine','breeze','coral','dusk','emerald','fable','grove','haze','indigo','jasper','kelp','lotus','meadow','nimble','opal','petal','quill','raven','sage','tulip','umber','vine','willow','xylem','yarn','zinc'];

// ── Generator ──
function generatePassword() {
    const len = parseInt($('#passLength').value);
    let charset = '';
    if ($('#optUpper').checked) charset += UPPER;
    if ($('#optLower').checked) charset += LOWER;
    if ($('#optDigits').checked) charset += DIGITS;
    if ($('#optSymbols').checked) charset += SYMBOLS;
    if ($('#optNoAmbig').checked) {
        charset = charset.split('').filter(c => !AMBIGUOUS.includes(c)).join('');
    }
    if (!charset) charset = LOWER;
    let pass = '';
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    for (let i = 0; i < len; i++) pass += charset[arr[i] % charset.length];
    return pass;
}

function generatePassphrase() {
    const count = parseInt($('#wordCountRange').value);
    const sep = $('#separator').value;
    const arr = new Uint32Array(count);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(v => WORDS[v % WORDS.length]).join(sep);
}

$('#generateBtn').addEventListener('click', () => {
    const pass = generatePassword();
    $('#passDisplay').textContent = pass;
    analyzePassword(pass);
});

$('#genPassphrase').addEventListener('click', () => {
    const phrase = generatePassphrase();
    $('#passphraseDisplay').textContent = phrase;
    analyzePassword(phrase);
});

$('#passLength').addEventListener('input', e => { $('#lenVal').textContent = e.target.value; });
$('#wordCountRange').addEventListener('input', e => { $('#wordCount').textContent = e.target.value; });

$('#copyPassBtn').addEventListener('click', () => { navigator.clipboard.writeText($('#passDisplay').textContent).catch(()=>{}); });
$('#copyPhraseBtn').addEventListener('click', () => { navigator.clipboard.writeText($('#passphraseDisplay').textContent).catch(()=>{}); });

// ── Analyzer ──
$('#analyzeInput').addEventListener('input', e => analyzePassword(e.target.value));

function analyzePassword(pass) {
    if (!pass || pass === 'Click Generate') {
        $('#strengthFill').style.width = '0';
        $('#strengthLabel').textContent = 'Enter a password';
        return;
    }
    const len = pass.length;
    let poolSize = 0;
    let hasUpper = /[A-Z]/.test(pass);
    let hasLower = /[a-z]/.test(pass);
    let hasDigit = /[0-9]/.test(pass);
    let hasSymbol = /[^A-Za-z0-9]/.test(pass);
    if (hasUpper) poolSize += 26;
    if (hasLower) poolSize += 26;
    if (hasDigit) poolSize += 10;
    if (hasSymbol) poolSize += 32;
    if (poolSize === 0) poolSize = 26;

    const entropy = Math.log2(Math.pow(poolSize, len));
    const uniqueChars = new Set(pass).size;

    // Strength rating
    let strength, color, pct;
    if (entropy < 28) { strength = 'Very Weak 💀'; color = '#ef4444'; pct = 15; }
    else if (entropy < 36) { strength = 'Weak ⚠️'; color = '#f97316'; pct = 30; }
    else if (entropy < 60) { strength = 'Fair 🟡'; color = '#f59e0b'; pct = 50; }
    else if (entropy < 80) { strength = 'Strong 💪'; color = '#10b981'; pct = 75; }
    else { strength = 'Very Strong 🏰'; color = '#059669'; pct = 100; }

    $('#strengthFill').style.width = pct + '%';
    $('#strengthFill').style.background = color;
    $('#strengthLabel').style.color = color;
    $('#strengthLabel').textContent = strength;

    $('#analysisResults').innerHTML = `
        <div class="analysis-row"><span>Length</span><span class="analysis-val">${len}</span></div>
        <div class="analysis-row"><span>Unique Characters</span><span class="analysis-val">${uniqueChars}</span></div>
        <div class="analysis-row"><span>Character Pool</span><span class="analysis-val">${poolSize}</span></div>
        <div class="analysis-row"><span>Entropy</span><span class="analysis-val">${entropy.toFixed(1)} bits</span></div>
        <div class="analysis-row"><span>Uppercase</span><span class="analysis-val">${hasUpper ? '✅' : '❌'}</span></div>
        <div class="analysis-row"><span>Lowercase</span><span class="analysis-val">${hasLower ? '✅' : '❌'}</span></div>
        <div class="analysis-row"><span>Numbers</span><span class="analysis-val">${hasDigit ? '✅' : '❌'}</span></div>
        <div class="analysis-row"><span>Symbols</span><span class="analysis-val">${hasSymbol ? '✅' : '❌'}</span></div>
    `;

    // Crack time estimates
    const combos = Math.pow(poolSize, len);
    const scenarios = [
        { name: 'Online (1K/s)', speed: 1e3 },
        { name: 'Offline Fast (10B/s)', speed: 1e10 },
        { name: 'Supercomputer (1T/s)', speed: 1e12 },
        { name: 'Quantum (hypothetical)', speed: 1e15 },
    ];
    $('#crackTimes').innerHTML = scenarios.map(s => {
        const seconds = combos / (s.speed * 2); // average
        return `<div class="crack-row"><span class="scenario">${s.name}</span><span class="time">${formatTime(seconds)}</span></div>`;
    }).join('');

    // Character distribution
    const categories = { Upper: 0, Lower: 0, Digit: 0, Symbol: 0 };
    for (const c of pass) {
        if (/[A-Z]/.test(c)) categories.Upper++;
        else if (/[a-z]/.test(c)) categories.Lower++;
        else if (/[0-9]/.test(c)) categories.Digit++;
        else categories.Symbol++;
    }
    const maxCat = Math.max(1, ...Object.values(categories));
    const catColors = { Upper: '#3b82f6', Lower: '#10b981', Digit: '#f59e0b', Symbol: '#ef4444' };
    $('#charDistribution').innerHTML = Object.entries(categories).map(([k, v]) =>
        `<div class="dist-bar" style="height:${(v/maxCat)*100}%;background:${catColors[k]}"><span>${k}: ${v}</span></div>`
    ).join('');
}

function formatTime(seconds) {
    if (!isFinite(seconds) || seconds > 1e30) return '∞ (heat death of universe)';
    if (seconds < 0.001) return 'Instantly';
    if (seconds < 1) return '< 1 second';
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds/60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds/3600)} hours`;
    if (seconds < 86400*365) return `${Math.round(seconds/86400)} days`;
    if (seconds < 86400*365*1000) return `${Math.round(seconds/(86400*365))} years`;
    if (seconds < 86400*365*1e6) return `${(seconds/(86400*365*1000)).toFixed(0)} thousand years`;
    if (seconds < 86400*365*1e9) return `${(seconds/(86400*365*1e6)).toFixed(0)} million years`;
    if (seconds < 86400*365*1e12) return `${(seconds/(86400*365*1e9)).toFixed(0)} billion years`;
    return `${(seconds/(86400*365*1e12)).toFixed(0)} trillion years`;
}

// ── Bulk Generator ──
$('#bulkGenBtn').addEventListener('click', () => {
    const count = parseInt($('#bulkCount').value) || 10;
    const passwords = [];
    for (let i = 0; i < Math.min(count, 100); i++) passwords.push(generatePassword());
    $('#bulkOutput').textContent = passwords.join('\n');
});

$('#bulkCopyBtn').addEventListener('click', () => { navigator.clipboard.writeText($('#bulkOutput').textContent).catch(()=>{}); });

// Theme
$('#themeBtn').addEventListener('click', () => { const h=document.documentElement;const d=h.dataset.theme==='dark';h.dataset.theme=d?'light':'dark';$('#themeBtn').textContent=d?'☀️':'🌙';localStorage.setItem('theme',h.dataset.theme); });
if(localStorage.getItem('theme')==='light'){document.documentElement.dataset.theme='light';$('#themeBtn').textContent='☀️';}

// Init
$('#generateBtn').click();
$('#genPassphrase').click();
})();
