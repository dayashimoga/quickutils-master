// ═══════════════════════════════════════════════════
// Universal Unit Converter — QuickUtils
// 16 categories, 100+ units, formula display
// ═══════════════════════════════════════════════════
(function() {
'use strict';

// ─── UNIT DATABASE ───
const CATEGORIES = {
    length: {
        label: '📏 Length', units: {
            mm: { name: 'Millimeters', factor: 0.001 },
            cm: { name: 'Centimeters', factor: 0.01 },
            m: { name: 'Meters', factor: 1 },
            km: { name: 'Kilometers', factor: 1000 },
            in: { name: 'Inches', factor: 0.0254 },
            ft: { name: 'Feet', factor: 0.3048 },
            yd: { name: 'Yards', factor: 0.9144 },
            mi: { name: 'Miles', factor: 1609.344 },
            nm: { name: 'Nanometers', factor: 1e-9 },
            μm: { name: 'Micrometers', factor: 1e-6 },
            ly: { name: 'Light-years', factor: 9.461e15 },
            AU: { name: 'Astronomical Units', factor: 1.496e11 },
            pc: { name: 'Parsecs', factor: 3.086e16 },
            nmi: { name: 'Nautical Miles', factor: 1852 }
        }
    },
    mass: {
        label: '⚖️ Mass', units: {
            mg: { name: 'Milligrams', factor: 1e-6 },
            g: { name: 'Grams', factor: 0.001 },
            kg: { name: 'Kilograms', factor: 1 },
            t: { name: 'Metric Tonnes', factor: 1000 },
            oz: { name: 'Ounces', factor: 0.0283495 },
            lb: { name: 'Pounds', factor: 0.453592 },
            st: { name: 'Stones', factor: 6.35029 },
            slug: { name: 'Slugs', factor: 14.5939 },
            gr: { name: 'Grains', factor: 6.47989e-5 },
            amu: { name: 'Atomic Mass Units', factor: 1.66054e-27 },
            ct: { name: 'Carats', factor: 0.0002 }
        }
    },
    temperature: {
        label: '🌡️ Temperature', units: {
            '°C': { name: 'Celsius' },
            '°F': { name: 'Fahrenheit' },
            'K': { name: 'Kelvin' },
            '°R': { name: 'Rankine' }
        }, custom: true
    },
    time: {
        label: '⏱️ Time', units: {
            ns: { name: 'Nanoseconds', factor: 1e-9 },
            μs: { name: 'Microseconds', factor: 1e-6 },
            ms: { name: 'Milliseconds', factor: 0.001 },
            s: { name: 'Seconds', factor: 1 },
            min: { name: 'Minutes', factor: 60 },
            hr: { name: 'Hours', factor: 3600 },
            day: { name: 'Days', factor: 86400 },
            wk: { name: 'Weeks', factor: 604800 },
            mo: { name: 'Months (avg)', factor: 2629746 },
            yr: { name: 'Years', factor: 31556952 },
            dec: { name: 'Decades', factor: 315569520 },
            cen: { name: 'Centuries', factor: 3155695200 }
        }
    },
    digital: {
        label: '💾 Digital Storage', units: {
            bit: { name: 'Bits', factor: 1 },
            B: { name: 'Bytes', factor: 8 },
            KB: { name: 'Kilobytes', factor: 8000 },
            MB: { name: 'Megabytes', factor: 8e6 },
            GB: { name: 'Gigabytes', factor: 8e9 },
            TB: { name: 'Terabytes', factor: 8e12 },
            PB: { name: 'Petabytes', factor: 8e15 },
            EB: { name: 'Exabytes', factor: 8e18 },
            KiB: { name: 'Kibibytes', factor: 8192 },
            MiB: { name: 'Mebibytes', factor: 8388608 },
            GiB: { name: 'Gibibytes', factor: 8589934592 }
        }
    },
    speed: {
        label: '🚀 Speed', units: {
            'mps': { name: 'Meters/second', factor: 1 },
            'kmh': { name: 'km/h', factor: 0.277778 },
            'mph': { name: 'mph', factor: 0.44704 },
            'kn': { name: 'Knots', factor: 0.514444 },
            'fps': { name: 'Feet/second', factor: 0.3048 },
            'mach': { name: 'Mach', factor: 343 },
            'c': { name: 'Speed of Light', factor: 299792458 }
        }
    },
    area: {
        label: '📐 Area', units: {
            'mm²': { name: 'sq Millimeters', factor: 1e-6 },
            'cm²': { name: 'sq Centimeters', factor: 1e-4 },
            'm²': { name: 'sq Meters', factor: 1 },
            'km²': { name: 'sq Kilometers', factor: 1e6 },
            'in²': { name: 'sq Inches', factor: 6.4516e-4 },
            'ft²': { name: 'sq Feet', factor: 0.092903 },
            'ac': { name: 'Acres', factor: 4046.86 },
            'ha': { name: 'Hectares', factor: 10000 }
        }
    },
    volume: {
        label: '🧊 Volume', units: {
            mL: { name: 'Milliliters', factor: 1e-6 },
            L: { name: 'Liters', factor: 0.001 },
            'm³': { name: 'Cubic Meters', factor: 1 },
            'gal_us': { name: 'Gallons (US)', factor: 0.00378541 },
            'gal_uk': { name: 'Gallons (UK)', factor: 0.00454609 },
            'fl_oz': { name: 'Fluid Ounces (US)', factor: 2.9574e-5 },
            'cup': { name: 'Cups (US)', factor: 2.3659e-4 },
            'tbsp': { name: 'Tablespoons', factor: 1.4787e-5 },
            'tsp': { name: 'Teaspoons', factor: 4.9289e-6 }
        }
    },
    pressure: {
        label: '🌀 Pressure', units: {
            Pa: { name: 'Pascals', factor: 1 },
            kPa: { name: 'Kilopascals', factor: 1000 },
            MPa: { name: 'Megapascals', factor: 1e6 },
            bar: { name: 'Bar', factor: 100000 },
            atm: { name: 'Atmospheres', factor: 101325 },
            psi: { name: 'PSI', factor: 6894.76 },
            mmHg: { name: 'mmHg (Torr)', factor: 133.322 },
            inHg: { name: 'Inches of Mercury', factor: 3386.39 }
        }
    },
    energy: {
        label: '⚡ Energy', units: {
            J: { name: 'Joules', factor: 1 },
            kJ: { name: 'Kilojoules', factor: 1000 },
            cal: { name: 'Calories', factor: 4.184 },
            kcal: { name: 'Kilocalories', factor: 4184 },
            Wh: { name: 'Watt-hours', factor: 3600 },
            kWh: { name: 'Kilowatt-hours', factor: 3.6e6 },
            BTU: { name: 'BTU', factor: 1055.06 },
            eV: { name: 'Electron-volts', factor: 1.602e-19 },
            erg: { name: 'Ergs', factor: 1e-7 },
            MJ: { name: 'Megajoules', factor: 1e6 }
        }
    },
    force: {
        label: '💪 Force', units: {
            N: { name: 'Newtons', factor: 1 },
            kN: { name: 'Kilonewtons', factor: 1000 },
            lbf: { name: 'Pound-force', factor: 4.44822 },
            dyn: { name: 'Dynes', factor: 1e-5 },
            kgf: { name: 'Kilogram-force', factor: 9.80665 }
        }
    },
    frequency: {
        label: '📡 Frequency', units: {
            Hz: { name: 'Hertz', factor: 1 },
            kHz: { name: 'Kilohertz', factor: 1000 },
            MHz: { name: 'Megahertz', factor: 1e6 },
            GHz: { name: 'Gigahertz', factor: 1e9 },
            THz: { name: 'Terahertz', factor: 1e12 },
            rpm: { name: 'RPM', factor: 1/60 }
        }
    },
    angle: {
        label: '📐 Angle', units: {
            deg: { name: 'Degrees', factor: 1 },
            rad: { name: 'Radians', factor: 180 / Math.PI },
            grad: { name: 'Gradians', factor: 0.9 },
            arcmin: { name: 'Arc Minutes', factor: 1/60 },
            arcsec: { name: 'Arc Seconds', factor: 1/3600 },
            turn: { name: 'Turns', factor: 360 },
            mrad: { name: 'Milliradians', factor: 0.18 / Math.PI }
        }
    },
    power: {
        label: '🔌 Power', units: {
            W: { name: 'Watts', factor: 1 },
            kW: { name: 'Kilowatts', factor: 1000 },
            MW: { name: 'Megawatts', factor: 1e6 },
            hp: { name: 'Horsepower', factor: 745.7 },
            BTUh: { name: 'BTU/hour', factor: 0.29307 },
            ftlbs: { name: 'Foot-pounds/sec', factor: 1.35582 }
        }
    },
    density: {
        label: '🧪 Density', units: {
            'kg/m³': { name: 'kg/m³', factor: 1 },
            'g/cm³': { name: 'g/cm³', factor: 1000 },
            'g/mL': { name: 'g/mL', factor: 1000 },
            'lb/ft³': { name: 'lb/ft³', factor: 16.0185 },
            'kg/L': { name: 'kg/L', factor: 1000 }
        }
    },
    numbase: {
        label: '🔢 Number Base', units: {
            bin: { name: 'Binary (Base 2)' },
            oct: { name: 'Octal (Base 8)' },
            dec: { name: 'Decimal (Base 10)' },
            hex: { name: 'Hexadecimal (Base 16)' }
        }, custom: true
    }
};

// ─── STATE ───
let currentCategory = 'length';
let conversionHistory = JSON.parse(localStorage.getItem('uc_history') || '[]');

// ─── DOM REFS ───
const categoryTabs = document.getElementById('categoryTabs');
const fromValue = document.getElementById('fromValue');
const fromUnit = document.getElementById('fromUnit');
const toUnit = document.getElementById('toUnit');
const resultValue = document.getElementById('resultValue');
const formulaDisplay = document.getElementById('formulaDisplay');
const quickRef = document.getElementById('quickRef');
const swapBtn = document.getElementById('swapUnitsBtn');
const themeBtn = document.getElementById('themeBtn');

// ─── THEME ───
const savedTheme = localStorage.getItem('uc_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
if (themeBtn) {
    themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('uc_theme', next);
        themeBtn.textContent = next === 'dark' ? '☀️' : '🌙';
    });
}

// ─── BUILD CATEGORY TABS ───
function buildCategoryTabs() {
    categoryTabs.innerHTML = '';
    for (const [key, cat] of Object.entries(CATEGORIES)) {
        const btn = document.createElement('button');
        btn.className = 'cat-tab' + (key === currentCategory ? ' active' : '');
        btn.textContent = cat.label;
        btn.dataset.cat = key;
        btn.addEventListener('click', () => switchCategory(key));
        categoryTabs.appendChild(btn);
    }
}

function switchCategory(cat) {
    currentCategory = cat;
    buildCategoryTabs();
    populateUnits();
    convert();
}

// ─── POPULATE UNIT DROPDOWNS ───
function populateUnits() {
    const cat = CATEGORIES[currentCategory];
    fromUnit.innerHTML = '';
    toUnit.innerHTML = '';
    const keys = Object.keys(cat.units);
    keys.forEach((key, idx) => {
        const opt1 = document.createElement('option');
        opt1.value = key;
        opt1.textContent = `${key} — ${cat.units[key].name}`;
        fromUnit.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = key;
        opt2.textContent = `${key} — ${cat.units[key].name}`;
        toUnit.appendChild(opt2);
    });
    // Default: first unit from, second unit to
    if (keys.length > 1) toUnit.value = keys[1];

    // For number base, set input type to text
    if (currentCategory === 'numbase') {
        fromValue.type = 'text';
        fromValue.value = '42';
        fromValue.step = '';
    } else {
        fromValue.type = 'number';
        fromValue.step = 'any';
        if (fromValue.value === '' || fromValue.value === '42') fromValue.value = '1';
    }
}

// ─── CONVERSION ENGINE ───
function convertTemperature(value, from, to) {
    // Convert to Celsius first
    let celsius;
    switch (from) {
        case '°C': celsius = value; break;
        case '°F': celsius = (value - 32) * 5/9; break;
        case 'K': celsius = value - 273.15; break;
        case '°R': celsius = (value - 491.67) * 5/9; break;
    }
    // Convert from Celsius to target
    switch (to) {
        case '°C': return celsius;
        case '°F': return celsius * 9/5 + 32;
        case 'K': return celsius + 273.15;
        case '°R': return (celsius + 273.15) * 9/5;
    }
    return celsius;
}

function convertNumberBase(value, from, to) {
    let decimal;
    try {
        switch (from) {
            case 'bin': decimal = parseInt(value, 2); break;
            case 'oct': decimal = parseInt(value, 8); break;
            case 'dec': decimal = parseInt(value, 10); break;
            case 'hex': decimal = parseInt(value, 16); break;
        }
    } catch(e) { return 'Invalid'; }
    if (isNaN(decimal)) return 'Invalid input';
    switch (to) {
        case 'bin': return decimal.toString(2);
        case 'oct': return decimal.toString(8);
        case 'dec': return decimal.toString(10);
        case 'hex': return decimal.toString(16).toUpperCase();
    }
    return decimal.toString();
}

function convert() {
    const from = fromUnit.value;
    const to = toUnit.value;
    const cat = CATEGORIES[currentCategory];
    let rawValue = fromValue.value;
    let result;
    let formula = '';

    if (currentCategory === 'temperature') {
        const val = parseFloat(rawValue);
        if (isNaN(val)) { resultValue.textContent = '—'; formulaDisplay.textContent = ''; return; }
        result = convertTemperature(val, from, to);
        formula = getTemperatureFormula(from, to);
    } else if (currentCategory === 'numbase') {
        result = convertNumberBase(rawValue.trim(), from, to);
        resultValue.textContent = result;
        formulaDisplay.textContent = `${rawValue} (${from}) → ${result} (${to})`;
        buildQuickRef();
        return;
    } else {
        const val = parseFloat(rawValue);
        if (isNaN(val)) { resultValue.textContent = '—'; formulaDisplay.textContent = ''; return; }
        const fromFactor = cat.units[from].factor;
        const toFactor = cat.units[to].factor;
        // Convert: value * fromFactor / toFactor (both relative to base unit)
        result = val * fromFactor / toFactor;
        const ratio = fromFactor / toFactor;
        formula = `1 ${from} = ${formatNumber(ratio)} ${to}`;
    }

    resultValue.textContent = formatNumber(result);
    formulaDisplay.textContent = formula;
    buildQuickRef();

    // Save to history
    addToHistory(rawValue, from, resultValue.textContent, to, currentCategory);
}

function getTemperatureFormula(from, to) {
    const formulas = {
        '°C→°F': '°F = °C × 9/5 + 32',
        '°F→°C': '°C = (°F - 32) × 5/9',
        '°C→K': 'K = °C + 273.15',
        'K→°C': '°C = K - 273.15',
        '°C→°R': '°R = (°C + 273.15) × 9/5',
        '°R→°C': '°C = (°R - 491.67) × 5/9',
        '°F→K': 'K = (°F - 32) × 5/9 + 273.15',
        'K→°F': '°F = (K - 273.15) × 9/5 + 32',
        '°F→°R': '°R = °F + 459.67',
        '°R→°F': '°F = °R - 459.67',
        'K→°R': '°R = K × 9/5',
        '°R→K': 'K = °R × 5/9'
    };
    if (from === to) return `${from} = ${to}`;
    return formulas[`${from}→${to}`] || `${from} → ${to}`;
}

function formatNumber(n) {
    if (typeof n === 'string') return n;
    if (n === 0) return '0';
    const abs = Math.abs(n);
    if (abs >= 1e15 || (abs < 1e-6 && abs > 0)) return n.toExponential(6);
    if (abs >= 1e6) return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
    if (abs < 0.001) return n.toFixed(8);
    if (Number.isInteger(n)) return n.toString();
    return parseFloat(n.toPrecision(10)).toString();
}

// ─── QUICK REFERENCE ───
function buildQuickRef() {
    const cat = CATEGORIES[currentCategory];
    const keys = Object.keys(cat.units);
    quickRef.innerHTML = '';

    if (cat.custom) {
        // For temperature/numbase, show a small reference
        const commonVals = currentCategory === 'temperature'
            ? [{ v: 0, u: '°C' }, { v: 100, u: '°C' }, { v: 32, u: '°F' }, { v: 212, u: '°F' }, { v: 273.15, u: 'K' }, { v: 373.15, u: 'K' }]
            : [{ v: '255', u: 'dec' }, { v: 'FF', u: 'hex' }, { v: '11111111', u: 'bin' }, { v: '377', u: 'oct' }];
        commonVals.forEach(item => {
            const div = document.createElement('div');
            div.className = 'ref-card';
            if (currentCategory === 'temperature') {
                const inC = convertTemperature(item.v, item.u, '°C');
                const inF = convertTemperature(item.v, item.u, '°F');
                const inK = convertTemperature(item.v, item.u, 'K');
                div.innerHTML = `<div class="ref-from">${item.v} ${item.u}</div><div class="ref-to">${formatNumber(inC)}°C = ${formatNumber(inF)}°F = ${formatNumber(inK)}K</div>`;
            } else {
                const dec = currentCategory === 'numbase' ? parseInt(item.v, item.u === 'hex' ? 16 : item.u === 'bin' ? 2 : item.u === 'oct' ? 8 : 10) : 0;
                div.innerHTML = `<div class="ref-from">${item.v} (${item.u})</div><div class="ref-to">= ${dec} decimal</div>`;
            }
            quickRef.appendChild(div);
        });
        return;
    }

    // Show first unit converted to all others
    const baseKey = fromUnit.value;
    keys.filter(k => k !== baseKey).slice(0, 8).forEach(k => {
        const ratio = cat.units[baseKey].factor / cat.units[k].factor;
        const div = document.createElement('div');
        div.className = 'ref-card';
        div.innerHTML = `<div class="ref-from">1 ${baseKey}</div><div class="ref-to">= ${formatNumber(ratio)} ${k}</div>`;
        quickRef.appendChild(div);
    });
}

// ─── CONVERSION HISTORY ───
function addToHistory(fromVal, fromU, toVal, toU, category) {
    conversionHistory.unshift({
        from: `${fromVal} ${fromU}`,
        to: `${toVal} ${toU}`,
        cat: category,
        ts: Date.now()
    });
    if (conversionHistory.length > 15) conversionHistory = conversionHistory.slice(0, 15);
    localStorage.setItem('uc_history', JSON.stringify(conversionHistory));
}

// ─── EVENTS ───
fromValue.addEventListener('input', convert);
fromUnit.addEventListener('change', convert);
toUnit.addEventListener('change', convert);
swapBtn.addEventListener('click', () => {
    const tmp = fromUnit.value;
    fromUnit.value = toUnit.value;
    toUnit.value = tmp;
    convert();
});

// ─── INIT ───
buildCategoryTabs();
populateUnits();
convert();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CATEGORIES, convertTemperature, convertNumberBase, formatNumber };
}
})();
