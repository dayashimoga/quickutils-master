/* ============================================================
   Unit Converter — DailyLift Tools
   ============================================================ */
(function () {
    'use strict';

    const UNITS = {
        length: {
            meter: 1,
            kilometer: 1000,
            centimeter: 0.01,
            millimeter: 0.001,
            mile: 1609.344,
            yard: 0.9144,
            foot: 0.3048,
            inch: 0.0254
        },
        weight: {
            kilogram: 1,
            gram: 0.001,
            milligram: 0.000001,
            pound: 0.453592,
            ounce: 0.0283495,
            stone: 6.35029,
            'metric ton': 1000
        },
        temperature: {
            celsius: 'special',
            fahrenheit: 'special',
            kelvin: 'special'
        },
        volume: {
            liter: 1,
            milliliter: 0.001,
            'US gallon': 3.78541,
            'US quart': 0.946353,
            'US cup': 0.236588,
            'US fluid ounce': 0.0295735,
            'UK gallon': 4.54609,
            'cubic meter': 1000
        },
        speed: {
            'm/s': 1,
            'km/h': 0.277778,
            'mph': 0.44704,
            knot: 0.514444,
            'ft/s': 0.3048
        }
    };

    function convertTemperature(value, from, to) {
        // Convert to Celsius first
        let celsius;
        if (from === 'celsius') celsius = value;
        else if (from === 'fahrenheit') celsius = (value - 32) * 5 / 9;
        else if (from === 'kelvin') celsius = value - 273.15;

        // Convert from Celsius
        if (to === 'celsius') return celsius;
        if (to === 'fahrenheit') return celsius * 9 / 5 + 32;
        if (to === 'kelvin') return celsius + 273.15;
        return celsius;
    }

    const categorySelect = document.getElementById('unitCategory');
    const fromSelect = document.getElementById('unitFrom');
    const toSelect = document.getElementById('unitTo');
    const valueInput = document.getElementById('unitValue');
    const form = document.getElementById('unitForm');
    const swapBtn = document.getElementById('unitSwap');

    if (!categorySelect) return;

    function populateUnits() {
        const category = categorySelect.value;
        const units = Object.keys(UNITS[category]);

        fromSelect.innerHTML = units.map((u, i) =>
            `<option value="${u}" ${i === 0 ? 'selected' : ''}>${u.charAt(0).toUpperCase() + u.slice(1)}</option>`
        ).join('');

        toSelect.innerHTML = units.map((u, i) =>
            `<option value="${u}" ${i === 1 ? 'selected' : ''}>${u.charAt(0).toUpperCase() + u.slice(1)}</option>`
        ).join('');
    }

    categorySelect.addEventListener('change', populateUnits);
    populateUnits();

    swapBtn.addEventListener('click', function () {
        const tmp = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = tmp;
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const value = parseFloat(valueInput.value);
        if (isNaN(value)) return alert('Please enter a valid number.');

        const category = categorySelect.value;
        const from = fromSelect.value;
        const to = toSelect.value;
        let result;

        if (category === 'temperature') {
            result = convertTemperature(value, from, to);
        } else {
            const baseValue = value * UNITS[category][from];
            result = baseValue / UNITS[category][to];
        }

        const fromLabel = from.charAt(0).toUpperCase() + from.slice(1);
        const toLabel = to.charAt(0).toUpperCase() + to.slice(1);

        document.getElementById('unitResultValue').textContent = result.toFixed(6).replace(/\.?0+$/, '');
        document.getElementById('unitResultLabel').textContent = `${value} ${fromLabel} = ${result.toFixed(6).replace(/\.?0+$/, '')} ${toLabel}`;

        const resultBox = document.getElementById('unitResult');
        resultBox.classList.add('visible');
    });
})();
