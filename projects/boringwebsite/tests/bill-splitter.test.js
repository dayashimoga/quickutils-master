/**
 * @jest-environment jsdom
 */

/**
 * Tests for src/tools/bill-splitter.js
 * Covers: calculations, edge cases, input validation, result display
 */

const fs = require('fs');
const path = require('path');

describe('Bill Splitter Tool', () => {
    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
      <form id="billForm">
        <input type="number" id="billTotal" value="">
        <input type="number" id="billPeople" value="2">
        <input type="number" id="billTip" value="10">
        <button type="submit">Calculate</button>
      </form>
      <div class="result-box" id="billResult">
        <div id="billPerPerson">—</div>
        <div id="billTipAmount">—</div>
        <div id="billGrandTotal">—</div>
      </div>
    `;

        // Mock alert
        window.alert = jest.fn();

        // Re-evaluate script to bind event listeners to new DOM
        jest.resetModules();
        require('../src/tools/bill-splitter.js');
    });

    function setInputs(total, people, tip) {
        document.getElementById('billTotal').value = total;
        document.getElementById('billPeople').value = people;
        document.getElementById('billTip').value = tip;
    }

    function submitForm() {
        const form = document.getElementById('billForm');
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }

    describe('Basic Calculations', () => {
        test('splits ₹1000 between 2 people with 0% tip', () => {
            setInputs(1000, 2, 0);
            submitForm();
            expect(document.getElementById('billPerPerson').textContent).toBe('₹500.00');
            expect(document.getElementById('billGrandTotal').textContent).toBe('₹1000.00');
        });

        test('splits ₹1000 between 4 people with 10% tip', () => {
            setInputs(1000, 4, 10);
            submitForm();
            expect(document.getElementById('billPerPerson').textContent).toBe('₹275.00');
            expect(document.getElementById('billTipAmount').textContent).toBe('₹100.00');
            expect(document.getElementById('billGrandTotal').textContent).toBe('₹1100.00');
        });

        test('splits ₹2500 between 3 people with 15% tip', () => {
            setInputs(2500, 3, 15);
            submitForm();
            const tipAmount = 2500 * 0.15;
            const grandTotal = 2500 + tipAmount;
            const perPerson = grandTotal / 3;
            expect(document.getElementById('billPerPerson').textContent).toBe('₹' + perPerson.toFixed(2));
            expect(document.getElementById('billTipAmount').textContent).toBe('₹' + tipAmount.toFixed(2));
        });

        test('handles single person', () => {
            setInputs(500, 1, 20);
            submitForm();
            expect(document.getElementById('billPerPerson').textContent).toBe('₹600.00');
        });

        test('handles large group of 10 people', () => {
            setInputs(5000, 10, 10);
            submitForm();
            expect(document.getElementById('billPerPerson').textContent).toBe('₹550.00');
        });
    });

    describe('Tip Calculations', () => {
        test('0% tip gives no additional amount', () => {
            setInputs(1000, 2, 0);
            submitForm();
            expect(document.getElementById('billTipAmount').textContent).toBe('₹0.00');
        });

        test('100% tip doubles the bill', () => {
            setInputs(500, 2, 100);
            submitForm();
            expect(document.getElementById('billGrandTotal').textContent).toBe('₹1000.00');
        });

        test('5% tip on ₹200', () => {
            setInputs(200, 1, 5);
            submitForm();
            expect(document.getElementById('billTipAmount').textContent).toBe('₹10.00');
        });
    });

    describe('Result Display', () => {
        test('result box gets visible class after calculation', () => {
            setInputs(100, 2, 0);
            submitForm();
            expect(document.getElementById('billResult').classList.contains('visible')).toBe(true);
        });

        test('results format with 2 decimal places', () => {
            setInputs(100, 3, 0);
            submitForm();
            const result = document.getElementById('billPerPerson').textContent;
            expect(result).toMatch(/₹\d+\.\d{2}$/);
        });
    });

    describe('Edge Cases', () => {
        test('handles decimal bill amount', () => {
            setInputs(99.99, 2, 0);
            submitForm();
            expect(document.getElementById('billPerPerson').textContent).toContain('₹');
        });

        test('handles no tip input (defaults to 0)', () => {
            setInputs(100, 2, '');
            submitForm();
            expect(document.getElementById('billGrandTotal').textContent).toBe('₹100.00');
        });

        test('handles missing inputs with alerts', () => {
            setInputs('', '', '');
            submitForm();
            expect(window.alert).toHaveBeenCalled();
        });

        test('handles invalid people count', () => {
            setInputs(100, 0, 10);
            submitForm();
            expect(window.alert).toHaveBeenCalled();
        });

        test('initializes without form gracefully', () => {
            document.body.innerHTML = '';
            expect(() => {
                jest.resetModules();
                require('../src/tools/bill-splitter.js');
            }).not.toThrow();
        });
    });
});
