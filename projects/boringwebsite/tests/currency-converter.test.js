/**
 * @jest-environment jsdom
 */

/**
 * Tests for src/tools/currency-converter.js
 * Covers: conversion calculations, cross-rates, swap, edge cases
 */

describe('Currency Converter', () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <form id="currencyForm">
        <input type="number" id="currAmount" value="">
        <select id="currFrom"></select>
        <select id="currTo"></select>
        <button type="submit">Convert</button>
        <button type="button" id="currSwap">⇄</button>
      </form>
      <div id="currResult">—</div>
      <div id="currRate">—</div>
      <div id="currencyResult"></div>
    `;
        jest.resetModules();
        require('../src/tools/currency-converter.js');
    });

    function setInputs(amount, from, to) {
        document.getElementById('currAmount').value = amount;
        document.getElementById('currFrom').value = from;
        document.getElementById('currTo').value = to;
    }

    function submitForm() {
        const form = document.getElementById('currencyForm');
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }

    describe('Basic Conversions', () => {
        test('converts USD to EUR', () => {
            setInputs(100, 'USD', 'EUR');
            submitForm();
            const result = document.getElementById('currResult').textContent;
            expect(result).not.toBe('—');
            expect(result).toContain('EUR');
            expect(document.getElementById('currencyResult').classList.contains('visible')).toBe(true);
        });

        test('converts USD to INR', () => {
            setInputs(100, 'USD', 'INR');
            submitForm();
            expect(document.getElementById('currResult').textContent).not.toBe('—');
        });

        test('converts GBP to JPY', () => {
            setInputs(500, 'GBP', 'JPY');
            submitForm();
            expect(document.getElementById('currResult').textContent).not.toBe('—');
        });

        test('same currency returns same amount', () => {
            setInputs(100, 'USD', 'USD');
            submitForm();
            const result = document.getElementById('currResult').textContent;
            expect(result).toContain('100');
        });

        test('shows exchange rate', () => {
            setInputs(100, 'USD', 'EUR');
            submitForm();
            const rate = document.getElementById('currRate').textContent;
            expect(rate).not.toBe('—');
            expect(rate).toContain('1 USD');
        });

        test('converts INR to USD', () => {
            setInputs(8320, 'INR', 'USD');
            submitForm();
            const result = document.getElementById('currResult').textContent;
            expect(result).toContain('USD');
            expect(result).not.toBe('—');
        });
    });

    describe('Dropdown Population', () => {
        test('populates from dropdown with currencies', () => {
            const fromSel = document.getElementById('currFrom');
            expect(fromSel.options.length).toBeGreaterThan(10);
        });

        test('populates to dropdown with currencies', () => {
            const toSel = document.getElementById('currTo');
            expect(toSel.options.length).toBeGreaterThan(10);
        });

        test('defaults to USD and INR', () => {
            expect(document.getElementById('currFrom').value).toBe('USD');
            expect(document.getElementById('currTo').value).toBe('INR');
        });
    });

    describe('Swap Feature', () => {
        test('swap button switches currencies', () => {
            // Defaults are USD -> INR
            const swapBtn = document.getElementById('currSwap');
            swapBtn.click();
            expect(document.getElementById('currFrom').value).toBe('INR');
            expect(document.getElementById('currTo').value).toBe('USD');
        });
    });

    describe('Edge Cases', () => {
        test('does not convert with empty amount', () => {
            setInputs('', 'USD', 'EUR');
            submitForm();
            expect(document.getElementById('currResult').textContent).toBe('—');
        });

        test('does not convert with zero amount', () => {
            setInputs(0, 'USD', 'EUR');
            submitForm();
            expect(document.getElementById('currResult').textContent).toBe('—');
        });

        test('does not convert with negative amount', () => {
            setInputs(-100, 'USD', 'EUR');
            submitForm();
            expect(document.getElementById('currResult').textContent).toBe('—');
        });

        test('handles missing resultBox gracefully', () => {
            document.getElementById('currencyResult').remove();
            setInputs(100, 'USD', 'EUR');
            expect(() => submitForm()).not.toThrow();
        });

        test('initializes without form gracefully', () => {
            document.body.innerHTML = '';
            expect(() => {
                jest.resetModules();
                require('../src/tools/currency-converter.js');
            }).not.toThrow();
        });
    });
});
