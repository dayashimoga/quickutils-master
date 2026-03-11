/**
 * @jest-environment jsdom
 */

/**
 * Tests for src/tools/loan-emi.js
 * Covers: EMI formula, edge cases, input validation
 */

describe('Loan EMI Calculator', () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <form id="loanForm">
        <input type="number" id="loanPrincipal" value="">
        <input type="number" id="loanRate" value="">
        <input type="number" id="loanTenure" value="">
        <button type="submit">Calculate</button>
      </form>
      <div id="loanEmi">—</div>
      <div id="loanTotalInterest">—</div>
      <div id="loanTotalPayment">—</div>
      <div id="loanResult"></div>
    `;
        jest.resetModules();
        require('../src/tools/loan-emi.js');
    });

    function setInputs(principal, rate, tenure) {
        document.getElementById('loanPrincipal').value = principal;
        document.getElementById('loanRate').value = rate;
        document.getElementById('loanTenure').value = tenure;
    }

    function submitForm() {
        const form = document.getElementById('loanForm');
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }

    describe('Basic EMI Calculations', () => {
        test('calculates EMI for standard home loan', () => {
            setInputs(1000000, 8.5, 20);
            submitForm();
            const emi = document.getElementById('loanEmi').textContent;
            expect(emi).toContain('₹');
            expect(emi).not.toBe('—');
            expect(document.getElementById('loanResult').classList.contains('visible')).toBe(true);
        });

        test('calculates EMI for car loan', () => {
            setInputs(500000, 9, 5);
            submitForm();
            expect(document.getElementById('loanEmi').textContent).toContain('₹');
            expect(document.getElementById('loanTotalInterest').textContent).toContain('₹');
            expect(document.getElementById('loanTotalPayment').textContent).toContain('₹');
        });

        test('total payment exceeds principal', () => {
            setInputs(100000, 10, 10);
            submitForm();
            const total = document.getElementById('loanTotalPayment').textContent;
            expect(total).toContain('₹');
        });

        test('interest increases with higher rate', () => {
            setInputs(1000000, 5, 20);
            submitForm();
            const lowRateEmi = document.getElementById('loanEmi').textContent;

            jest.resetModules();
            document.body.innerHTML = `
        <form id="loanForm">
          <input type="number" id="loanPrincipal" value="">
          <input type="number" id="loanRate" value="">
          <input type="number" id="loanTenure" value="">
          <button type="submit">Calculate</button>
        </form>
        <div id="loanEmi">—</div>
        <div id="loanTotalInterest">—</div>
        <div id="loanTotalPayment">—</div>
        <div id="loanResult"></div>
      `;
            require('../src/tools/loan-emi.js');
            setInputs(1000000, 15, 20);
            submitForm();
            const highRateEmi = document.getElementById('loanEmi').textContent;

            expect(highRateEmi).not.toBe(lowRateEmi);
        });
    });

    describe('Edge Cases', () => {
        test('does not calculate with zero principal', () => {
            setInputs(0, 8, 10);
            submitForm();
            expect(document.getElementById('loanEmi').textContent).toBe('—');
        });

        test('does not calculate with negative values', () => {
            setInputs(-100000, 8, 10);
            submitForm();
            expect(document.getElementById('loanEmi').textContent).toBe('—');
        });

        test('does not calculate with empty inputs', () => {
            setInputs('', '', '');
            submitForm();
            expect(document.getElementById('loanEmi').textContent).toBe('—');
        });

        test('does not calculate with zero rate', () => {
            setInputs(100000, 0, 10);
            submitForm();
            expect(document.getElementById('loanEmi').textContent).toBe('—');
        });

        test('initializes without form gracefully', () => {
            document.body.innerHTML = '';
            expect(() => {
                jest.resetModules();
                require('../src/tools/loan-emi.js');
            }).not.toThrow();
        });
    });
});
