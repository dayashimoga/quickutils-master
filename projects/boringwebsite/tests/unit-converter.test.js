/**
 * @jest-environment jsdom
 */

/**
 * Tests for src/tools/unit-converter.js
 * Covers: conversion accuracy, temperature special cases, swap, categories
 */

const fs = require('fs');
const path = require('path');

describe('Unit Converter Tool', () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <form id="unitForm">
        <select id="unitCategory">
          <option value="length">Length</option>
          <option value="weight">Weight</option>
          <option value="temperature">Temperature</option>
          <option value="volume">Volume</option>
          <option value="speed">Speed</option>
        </select>
        <select id="unitFrom"></select>
        <select id="unitTo"></select>
        <input type="number" id="unitValue" value="">
        <button type="submit">Convert</button>
        <button type="button" id="unitSwap">⇄ Swap</button>
      </form>
      <div class="result-box" id="unitResult">
        <div id="unitResultValue">—</div>
        <div id="unitResultLabel">Result</div>
      </div>
    `;

        window.alert = jest.fn();

        // Re-evaluate script to bind event listeners
        jest.resetModules();
        require('../src/tools/unit-converter.js');
    });

    function setCategory(cat) {
        const sel = document.getElementById('unitCategory');
        sel.value = cat;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function submitForm() {
        const form = document.getElementById('unitForm');
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }

    describe('Length Conversions', () => {
        test('1 kilometer = 1000 meters', () => {
            setCategory('length');
            document.getElementById('unitFrom').value = 'kilometer';
            document.getElementById('unitTo').value = 'meter';
            document.getElementById('unitValue').value = '1';
            submitForm();
            const result = parseFloat(document.getElementById('unitResultValue').textContent);
            expect(result).toBeCloseTo(1000, 0);
        });

        test('1 mile ≈ 1.609 kilometers', () => {
            setCategory('length');
            document.getElementById('unitFrom').value = 'mile';
            document.getElementById('unitTo').value = 'kilometer';
            document.getElementById('unitValue').value = '1';
            submitForm();
            const result = parseFloat(document.getElementById('unitResultValue').textContent);
            expect(result).toBeCloseTo(1.609, 2);
        });

        test('1 foot = 12 inches', () => {
            setCategory('length');
            document.getElementById('unitFrom').value = 'foot';
            document.getElementById('unitTo').value = 'inch';
            document.getElementById('unitValue').value = '1';
            submitForm();
            const result = parseFloat(document.getElementById('unitResultValue').textContent);
            expect(result).toBeCloseTo(12, 0);
        });

        test('100 centimeters = 1 meter', () => {
            setCategory('length');
            document.getElementById('unitFrom').value = 'centimeter';
            document.getElementById('unitTo').value = 'meter';
            document.getElementById('unitValue').value = '100';
            submitForm();
            const result = parseFloat(document.getElementById('unitResultValue').textContent);
            expect(result).toBeCloseTo(1, 1);
        });
    });

    describe('Weight Conversions', () => {
        test('1 kilogram ≈ 2.205 pounds', () => {
            setCategory('weight');
            document.getElementById('unitFrom').value = 'kilogram';
            document.getElementById('unitTo').value = 'pound';
            document.getElementById('unitValue').value = '1';
            submitForm();
            const result = parseFloat(document.getElementById('unitResultValue').textContent);
            expect(result).toBeCloseTo(2.205, 2);
        });

        test('1000 grams = 1 kilogram', () => {
            setCategory('weight');
            document.getElementById('unitFrom').value = 'gram';
            document.getElementById('unitTo').value = 'kilogram';
            document.getElementById('unitValue').value = '1000';
            submitForm();
            const result = parseFloat(document.getElementById('unitResultValue').textContent);
            expect(result).toBeCloseTo(1, 1);
        });
    });

    describe('Temperature Conversions', () => {
        test('0°C = 32°F', () => {
            setCategory('temperature');
            document.getElementById('unitFrom').value = 'celsius';
            document.getElementById('unitTo').value = 'fahrenheit';
            document.getElementById('unitValue').value = '0';
            submitForm();
            const result = parseFloat(document.getElementById('unitResultValue').textContent);
            expect(result).toBeCloseTo(32, 0);
        });

        test('100°C = 212°F', () => {
            setCategory('temperature');
            document.getElementById('unitFrom').value = 'celsius';
            document.getElementById('unitTo').value = 'fahrenheit';
            document.getElementById('unitValue').value = '100';
            submitForm();
            const result = parseFloat(document.getElementById('unitResultValue').textContent);
            expect(result).toBeCloseTo(212, 0);
        });

        test('32°F = 0°C', () => {
            setCategory('temperature');
            document.getElementById('unitFrom').value = 'fahrenheit';
            document.getElementById('unitTo').value = 'celsius';
            document.getElementById('unitValue').value = '32';
            submitForm();
            const result = parseFloat(document.getElementById('unitResultValue').textContent);
            expect(result).toBeCloseTo(0, 0);
        });

        test('0°C = 273.15K', () => {
            setCategory('temperature');
            document.getElementById('unitFrom').value = 'celsius';
            document.getElementById('unitTo').value = 'kelvin';
            document.getElementById('unitValue').value = '0';
            submitForm();
            const result = parseFloat(document.getElementById('unitResultValue').textContent);
            expect(result).toBeCloseTo(273.15, 1);
        });

        test('273.15K = 0°C', () => {
            setCategory('temperature');
            document.getElementById('unitFrom').value = 'kelvin';
            document.getElementById('unitTo').value = 'celsius';
            document.getElementById('unitValue').value = '273.15';
            submitForm();
            const result = parseFloat(document.getElementById('unitResultValue').textContent);
            expect(result).toBeCloseTo(0, 1);
        });

        test('0K = -459.67°F', () => {
            setCategory('temperature');
            document.getElementById('unitFrom').value = 'kelvin';
            document.getElementById('unitTo').value = 'fahrenheit';
            document.getElementById('unitValue').value = '0';
            submitForm();
            const result = parseFloat(document.getElementById('unitResultValue').textContent);
            expect(result).toBeCloseTo(-459.67, 2);
        });

        test('-40°F = -40°C', () => {
            setCategory('temperature');
            document.getElementById('unitFrom').value = 'fahrenheit';
            document.getElementById('unitTo').value = 'celsius';
            document.getElementById('unitValue').value = '-40';
            submitForm();
            const result = parseFloat(document.getElementById('unitResultValue').textContent);
            expect(result).toBeCloseTo(-40, 0);
        });
    });

    describe('Volume Conversions', () => {
        test('1 liter ≈ 0.264 US gallons', () => {
            setCategory('volume');
            document.getElementById('unitFrom').value = 'liter';
            document.getElementById('unitTo').value = 'US gallon';
            document.getElementById('unitValue').value = '1';
            submitForm();
            const result = parseFloat(document.getElementById('unitResultValue').textContent);
            expect(result).toBeCloseTo(0.264, 2);
        });
    });

    describe('Speed Conversions', () => {
        test('1 m/s = 3.6 km/h', () => {
            setCategory('speed');
            document.getElementById('unitFrom').value = 'm/s';
            document.getElementById('unitTo').value = 'km/h';
            document.getElementById('unitValue').value = '1';
            submitForm();
            const result = parseFloat(document.getElementById('unitResultValue').textContent);
            expect(result).toBeCloseTo(3.6, 1);
        });
    });

    describe('Swap Functionality', () => {
        test('swap button exchanges from and to units', () => {
            setCategory('length');
            document.getElementById('unitFrom').value = 'meter';
            document.getElementById('unitTo').value = 'kilometer';

            document.getElementById('unitSwap').dispatchEvent(new Event('click', { bubbles: true }));

            expect(document.getElementById('unitFrom').value).toBe('kilometer');
            expect(document.getElementById('unitTo').value).toBe('meter');
        });
    });

    describe('Edge Cases', () => {
        test('handles missing value with alert', () => {
            setCategory('length');
            document.getElementById('unitFrom').value = 'meter';
            document.getElementById('unitTo').value = 'kilometer';
            document.getElementById('unitValue').value = '';
            submitForm();
            expect(window.alert).toHaveBeenCalled();
        });

        test('initializes without form gracefully', () => {
            document.body.innerHTML = '';
            expect(() => {
                jest.resetModules();
                require('../src/tools/unit-converter.js');
            }).not.toThrow();
        });
    });
});
