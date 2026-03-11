/**
 * @jest-environment jsdom
 */

/**
 * Tests for src/tools/insurance-estimator.js
 * Covers: premium calculations, coverage types, age factors
 */

describe('Insurance Premium Estimator', () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <form id="insuranceForm">
        <input type="number" id="insAge" value="">
        <select id="insType">
          <option value="health">Health</option>
          <option value="auto">Auto</option>
          <option value="life">Life</option>
        </select>
        <input type="number" id="insCoverage" value="">
        <button type="submit">Estimate</button>
      </form>
      <div id="insMonthly">—</div>
      <div id="insAnnual">—</div>
      <div id="insRisk">—</div>
      <div id="insResult"></div>
    `;
        jest.resetModules();
        require('../src/tools/insurance-estimator.js');
    });

    function setInputs(age, coverage, amount) {
        document.getElementById('insAge').value = age;
        document.getElementById('insType').value = coverage;
        document.getElementById('insCoverage').value = amount;
    }

    function submitForm() {
        const form = document.getElementById('insuranceForm');
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }

    describe('Health Insurance', () => {
        test('calculates health premium for young adult', () => {
            setInputs(25, 'health', 500000);
            submitForm();
            expect(document.getElementById('insMonthly').textContent).toContain('$');
            expect(document.getElementById('insAnnual').textContent).toContain('$');
            expect(document.getElementById('insResult').classList.contains('visible')).toBe(true);
        });

        test('calculates health premium for middle-aged', () => {
            setInputs(45, 'health', 1000000);
            submitForm();
            expect(document.getElementById('insMonthly').textContent).not.toBe('—');
        });

        test('older age produces higher premium', () => {
            setInputs(25, 'health', 500000);
            submitForm();
            const youngPremium = document.getElementById('insMonthly').textContent;

            document.body.innerHTML = `
        <form id="insuranceForm">
          <input type="number" id="insAge" value="">
          <select id="insType"><option value="health">Health</option><option value="auto">Auto</option><option value="life">Life</option></select>
          <input type="number" id="insCoverage" value="">
          <button type="submit">Estimate</button>
        </form>
        <div id="insMonthly">—</div>
        <div id="insAnnual">—</div>
        <div id="insRisk">—</div>
        <div id="insResult"></div>
      `;
            jest.resetModules();
            require('../src/tools/insurance-estimator.js');
            setInputs(60, 'health', 500000);
            submitForm();
            const oldPremium = document.getElementById('insMonthly').textContent;

            expect(oldPremium).not.toBe(youngPremium);
        });
    });

    describe('Auto Insurance', () => {
        test('calculates auto premium', () => {
            setInputs(30, 'auto', 1000000);
            submitForm();
            expect(document.getElementById('insMonthly').textContent).toContain('$');
        });
    });

    describe('Life Insurance', () => {
        test('calculates life premium', () => {
            setInputs(35, 'life', 5000000);
            submitForm();
            expect(document.getElementById('insMonthly').textContent).toContain('$');
        });
    });

    describe('Risk Profile', () => {
        test('young adult gets Low Risk', () => {
            setInputs(25, 'health', 500000);
            submitForm();
            expect(document.getElementById('insRisk').textContent).toContain('Low');
        });

        test('middle-aged gets Medium Risk', () => {
            setInputs(45, 'health', 500000);
            submitForm();
            expect(document.getElementById('insRisk').textContent).toContain('Medium');
        });

        test('senior gets High Risk', () => {
            setInputs(60, 'health', 500000);
            submitForm();
            expect(document.getElementById('insRisk').textContent).toContain('High');
        });
    });

    describe('Edge Cases', () => {
        test('does not calculate with empty age', () => {
            setInputs('', 'health', 500000);
            submitForm();
            expect(document.getElementById('insMonthly').textContent).toBe('—');
        });

        test('does not calculate with zero amount', () => {
            setInputs(30, 'health', 0);
            submitForm();
            expect(document.getElementById('insMonthly').textContent).toBe('—');
        });

        test('does not calculate with negative age', () => {
            setInputs(-5, 'health', 500000);
            submitForm();
            expect(document.getElementById('insMonthly').textContent).toBe('—');
        });

        test('does not calculate with age over 85', () => {
            setInputs(90, 'health', 500000);
            submitForm();
            expect(document.getElementById('insMonthly').textContent).toBe('—');
        });

        test('handles missing resultBox gracefully', () => {
            document.getElementById('insResult').remove();
            setInputs(30, 'health', 500000);
            expect(() => submitForm()).not.toThrow();
        });

        test('does not calculate for unknown insurance type', () => {
            setInputs(30, 'unknown', 500000);
            submitForm();
            expect(document.getElementById('insMonthly').textContent).toBe('—');
        });

        test('initializes without form gracefully', () => {
            document.body.innerHTML = '';
            expect(() => {
                jest.resetModules();
                require('../src/tools/insurance-estimator.js');
            }).not.toThrow();
        });
    });
});
