(() => {
'use strict';
const $ = s => document.querySelector(s);

const DATA = {
    length: {
        base: 'm',
        units: { m: 1, km: 0.001, cm: 100, mm: 1000, mi: 0.000621371, yd: 1.09361, ft: 3.28084, in: 39.3701 }
    },
    weight: {
        base: 'kg',
        units: { kg: 1, g: 1000, mg: 1000000, t: 0.001, lb: 2.20462, oz: 35.274 }
    },
    temperature: {
        base: 'c',
        special: true, // Needs custom formula
        units: { c: 'Celsius', f: 'Fahrenheit', k: 'Kelvin' }
    },
    data: {
        base: 'b',
        units: { b: 1, kb: 0.001, mb: 1e-6, gb: 1e-9, tb: 1e-12, B: 0.125, KB: 0.000125, MB: 1.25e-7, GB: 1.25e-10 }
    },
    time: {
        base: 's',
        units: { s: 1, ms: 1000, min: 1/60, hr: 1/3600, day: 1/86400, yr: 1/31536000 }
    }
};

const LABELS = {
    m: 'Meters', km: 'Kilometers', cm: 'Centimeters', mm: 'Millimeters', mi: 'Miles', yd: 'Yards', ft: 'Feet', in: 'Inches',
    kg: 'Kilograms', g: 'Grams', mg: 'Milligrams', t: 'Metric Tons', lb: 'Pounds', oz: 'Ounces',
    b: 'Bits', kb: 'Kilobits', mb: 'Megabits', gb: 'Gigabits', tb: 'Terabits', B: 'Bytes', KB: 'Kilobytes', MB: 'Megabytes', GB: 'Gigabytes',
    s: 'Seconds', ms: 'Milliseconds', min: 'Minutes', hr: 'Hours', day: 'Days', yr: 'Years'
};

let currentCat = 'length';

// Init Categories
$('#categoryTabs').innerHTML = Object.keys(DATA).map(c => 
    `<div class="cat-tab ${c==='length'?'active':''}" data-cat="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</div>`
).join('');

document.querySelectorAll('.cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCat = tab.dataset.cat;
        populateSelects();
    });
});

function populateSelects() {
    const cat = DATA[currentCat];
    const keys = Object.keys(cat.units);
    
    const options = keys.map(k => `<option value="${k}">${cat.special ? cat.units[k] : LABELS[k]}</option>`).join('');
    
    $('#fromUnit').innerHTML = options;
    $('#toUnit').innerHTML = options;
    
    // Set different defaults
    if (keys.length > 1) {
        $('#toUnit').value = keys[1];
    }
    
    convert();
}

function convertTemp(val, from, to) {
    if (from === to) return val;
    let inC;
    if (from === 'c') inC = val;
    else if (from === 'f') inC = (val - 32) * 5/9;
    else if (from === 'k') inC = val - 273.15;
    
    if (to === 'c') return inC;
    if (to === 'f') return (inC * 9/5) + 32;
    if (to === 'k') return inC + 273.15;
}

function convert() {
    const val = parseFloat($('#fromValue').value);
    if (isNaN(val)) {
        $('#resultValue').textContent = '-';
        return;
    }
    
    const from = $('#fromUnit').value;
    const to = $('#toUnit').value;
    const cat = DATA[currentCat];
    
    let result;
    if (cat.special) {
        result = convertTemp(val, from, to);
    } else {
        // Convert to base, then to target
        const inBase = val / cat.units[from];
        result = inBase * cat.units[to];
    }
    
    // Format appropriately: avoid scientific notation for smallish numbers if possible, 
    // round nicely.
    let formatted;
    if (result === 0) formatted = '0';
    else if (Math.abs(result) < 0.000001 || Math.abs(result) > 1000000) formatted = result.toExponential(4);
    else {
        // Remove trailing zeros
        formatted = parseFloat(result.toPrecision(7)).toString(); 
    }
    
    $('#resultValue').textContent = formatted;
    
    // Generate formula display
    if (from !== to) {
        if (cat.special) {
            $('#formulaDisplay').textContent = "Uses specific temperature formula";
        } else {
            const factor = cat.units[to] / cat.units[from];
            $('#formulaDisplay').textContent = `Multiply by ${parseFloat(factor.toPrecision(6)).toString()}`;
        }
    } else {
        $('#formulaDisplay').textContent = "";
    }
    
    updateQuickRef();
}

function updateQuickRef() {
    const cat = DATA[currentCat];
    const from = $('#fromUnit').value;
    
    if (cat.special) {
        $('#quickRef').innerHTML = "<div class='text-muted'>Standard formulas: C = (F-32)*5/9, F = C*9/5+32, K = C+273.15</div>";
        return;
    }
    
    const html = Object.keys(cat.units).slice(0, 6).map(to => {
        if (to === from) return '';
        const factor = cat.units[to] / cat.units[from];
        return `<div class="ref-card">1 <span class="ref-from">${from}</span> = <span class="ref-to">${parseFloat(factor.toPrecision(5)).toString()}</span> ${to}</div>`;
    }).join('');
    
    $('#quickRef').innerHTML = html;
}

$('#fromValue').addEventListener('input', convert);
$('#fromUnit').addEventListener('change', convert);
$('#toUnit').addEventListener('change', convert);

$('#swapUnitsBtn').addEventListener('click', () => {
    const f = $('#fromUnit').value;
    $('#fromUnit').value = $('#toUnit').value;
    $('#toUnit').value = f;
    convert();
});

// Theme
if (typeof QU !== 'undefined') QU.initTheme();
else {
    $('#themeBtn').addEventListener('click', () => { const h = document.documentElement; const d = h.dataset.theme === 'dark'; h.dataset.theme = d ? 'light' : 'dark'; $('#themeBtn').textContent = d ? '☀️' : '🌙'; localStorage.setItem('theme', h.dataset.theme); });
    if (localStorage.getItem('theme') === 'light') { document.documentElement.dataset.theme = 'light'; $('#themeBtn').textContent = '☀️'; }
}

populateSelects();

})();
