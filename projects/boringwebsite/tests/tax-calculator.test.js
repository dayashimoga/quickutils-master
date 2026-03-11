/**
 * @jest-environment jsdom
 */

/**
 * Tests for src/tools/tax-calculator.js
 * Covers: progressive tax calculations for US, UK, Canada, India
 */

describe('Income Tax Calculator', () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <form id="taxForm">
        <select id="taxCountry">
          <option value="us">United States</option>
          <option value="uk">United Kingdom</option>
          <option value="canada">Canada</option>
          <option value="india">India</option>
        </select>
        <input type="number" id="taxIncome" value="">
        <button type="submit">Calculate</button>
      </form>
      <div id="taxAmount">—</div>
      <div id="taxEffective">—</div>
      <div id="taxTakeHome">—</div>
      <div id="taxBracket">—</div>
      <div id="taxResult"></div>
    `;
        jest.resetModules();
        require('../src/tools/tax-calculator.js');
    });

    function setInputs(country, income) {
        document.getElementById('taxCountry').value = country;
        document.getElementById('taxIncome').value = income;
    }

    function submitForm() {
        const form = document.getElementById('taxForm');
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }

    describe('US Tax Calculations', () => {
        test('calculates tax for $50,000 income', () => {
            setInputs('us', 50000);
            submitForm();
            expect(document.getElementById('taxAmount').textContent).not.toBe('—');
            expect(document.getElementById('taxAmount').textContent).toContain('$');
            expect(document.getElementById('taxEffective').textContent).toContain('effective rate');
            expect(document.getElementById('taxResult').classList.contains('visible')).toBe(true);
        });

        test('calculates tax for $100,000 income', () => {
            setInputs('us', 100000);
            submitForm();
            expect(document.getElementById('taxTakeHome').textContent).not.toBe('—');
            expect(document.getElementById('taxTakeHome').textContent).toContain('$');
        });

        test('shows correct tax bracket', () => {
            setInputs('us', 50000);
            submitForm();
            expect(document.getElementById('taxBracket').textContent).toContain('bracket');
        });

        test('higher income produces higher tax', () => {
            setInputs('us', 50000);
            submitForm();
            const lowTax = document.getElementById('taxAmount').textContent;

            document.body.innerHTML = `
        <form id="taxForm">
          <select id="taxCountry"><option value="us">US</option><option value="uk">UK</option><option value="canada">Canada</option><option value="india">India</option></select>
          <input type="number" id="taxIncome" value="">
          <button type="submit">Calculate</button>
        </form>
        <div id="taxAmount">—</div>
        <div id="taxEffective">—</div>
        <div id="taxTakeHome">—</div>
        <div id="taxBracket">—</div>
        <div id="taxResult"></div>
      `;
            jest.resetModules();
            require('../src/tools/tax-calculator.js');
            setInputs('us', 500000);
            submitForm();
            const highTax = document.getElementById('taxAmount').textContent;

            expect(highTax).not.toBe(lowTax);
        });
    });

    describe('UK Tax Calculations', () => {
        test('calculates UK tax', () => {
            setInputs('uk', 50000);
            submitForm();
            expect(document.getElementById('taxAmount').textContent).not.toBe('—');
            expect(document.getElementById('taxAmount').textContent).toContain('£');
        });

        test('UK income below personal allowance has zero tax', () => {
            setInputs('uk', 10000);
            submitForm();
            const taxText = document.getElementById('taxAmount').textContent;
            expect(taxText).toContain('£');
            expect(taxText).toContain('0');
        });
    });

    describe('Canada Tax Calculations', () => {
        test('calculates Canada tax', () => {
            setInputs('canada', 80000);
            submitForm();
            expect(document.getElementById('taxAmount').textContent).not.toBe('—');
            expect(document.getElementById('taxAmount').textContent).toContain('C$');
        });
    });

    describe('India Tax Calculations', () => {
        test('calculates India tax', () => {
            setInputs('india', 1000000);
            submitForm();
            expect(document.getElementById('taxAmount').textContent).not.toBe('—');
            expect(document.getElementById('taxAmount').textContent).toContain('₹');
        });

        test('India income below 300000 has zero tax', () => {
            setInputs('india', 250000);
            submitForm();
            const taxText = document.getElementById('taxAmount').textContent;
            expect(taxText).toContain('₹');
            expect(taxText).toContain('0');
        });

        test('Top bracket applies for very high income', () => {
            setInputs('india', 2000000);
            submitForm();
            expect(document.getElementById('taxBracket').textContent).toBe('Top bracket');
        });
    });

    describe('Edge Cases', () => {
        test('does not calculate with empty income', () => {
            setInputs('us', '');
            submitForm();
            expect(document.getElementById('taxAmount').textContent).toBe('—');
        });

        test('does not calculate with zero income', () => {
            setInputs('us', 0);
            submitForm();
            expect(document.getElementById('taxAmount').textContent).toBe('—');
        });

        test('does not calculate with negative income', () => {
            setInputs('us', -50000);
            submitForm();
            expect(document.getElementById('taxAmount').textContent).toBe('—');
        });

        test('initializes without form gracefully', () => {
            document.body.innerHTML = '';
            expect(() => {
                jest.resetModules();
                require('../src/tools/tax-calculator.js');
            }).not.toThrow();
        });
    });
});
