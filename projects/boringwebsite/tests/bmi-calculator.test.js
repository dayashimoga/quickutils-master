/**
 * @jest-environment jsdom
 */

/**
 * Tests for src/tools/bmi-calculator.js
 * Covers: BMI formula, categories, gauge positioning, edge cases
 */

const fs = require('fs');
const path = require('path');

describe('BMI Calculator Tool', () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <form id="bmiForm">
        <input type="number" id="bmiWeight" value="">
        <input type="number" id="bmiHeight" value="">
        <button type="submit">Calculate</button>
      </form>
      <div class="result-box" id="bmiResult">
        <div id="bmiValue">—</div>
        <div id="bmiCategory">Enter details</div>
        <div class="bmi-gauge" id="bmiGauge" style="display:none;">
          <div class="gauge-marker" id="bmiMarker"></div>
        </div>
      </div>
    `;

        window.alert = jest.fn();

        jest.resetModules();
        require('../src/tools/bmi-calculator.js');
    });

    function setInputs(weight, height) {
        document.getElementById('bmiWeight').value = weight;
        document.getElementById('bmiHeight').value = height;
    }

    function submitForm() {
        const form = document.getElementById('bmiForm');
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }

    describe('BMI Formula', () => {
        test('70kg, 175cm → BMI ≈ 22.9', () => {
            setInputs(70, 175);
            submitForm();
            const bmi = parseFloat(document.getElementById('bmiValue').textContent);
            expect(bmi).toBeCloseTo(22.9, 1);
        });

        test('50kg, 160cm → BMI ≈ 19.5', () => {
            setInputs(50, 160);
            submitForm();
            const bmi = parseFloat(document.getElementById('bmiValue').textContent);
            expect(bmi).toBeCloseTo(19.5, 1);
        });

        test('100kg, 180cm → BMI ≈ 30.9', () => {
            setInputs(100, 180);
            submitForm();
            const bmi = parseFloat(document.getElementById('bmiValue').textContent);
            expect(bmi).toBeCloseTo(30.9, 1);
        });

        test('45kg, 170cm → BMI ≈ 15.6', () => {
            setInputs(45, 170);
            submitForm();
            const bmi = parseFloat(document.getElementById('bmiValue').textContent);
            expect(bmi).toBeCloseTo(15.6, 1);
        });
    });

    describe('BMI Categories', () => {
        test('BMI < 16 → Severely Underweight', () => {
            setInputs(40, 163); // ~15.0
            submitForm();
            expect(document.getElementById('bmiCategory').textContent).toContain('Severely Underweight');
        });

        test('16 <= BMI < 18.5 → Underweight', () => {
            setInputs(50, 170); // ~17.3
            submitForm();
            expect(document.getElementById('bmiCategory').textContent).toContain('Underweight');
        });

        test('18.5 <= BMI < 25 → Normal', () => {
            setInputs(70, 178); // ~22.1
            submitForm();
            expect(document.getElementById('bmiCategory').textContent).toContain('Normal');
        });

        test('25 <= BMI < 30 → Overweight', () => {
            setInputs(85, 177); // ~ 27.1
            submitForm();
            expect(document.getElementById('bmiCategory').textContent).toContain('Overweight');
        });

        test('30 <= BMI < 35 → Obese Class I', () => {
            setInputs(100, 177); // ~31.9
            submitForm();
            expect(document.getElementById('bmiCategory').textContent).toContain('Obese Class I');
        });

        test('35 <= BMI < 40 → Obese Class II', () => {
            setInputs(115, 177); // ~36.7
            submitForm();
            expect(document.getElementById('bmiCategory').textContent).toContain('Obese Class II');
        });

        test('BMI >= 40 → Obese Class III', () => {
            setInputs(130, 177); // ~41.5
            submitForm();
            expect(document.getElementById('bmiCategory').textContent).toContain('Obese Class III');
        });
    });

    describe('Gauge Display', () => {
        test('gauge becomes visible after calculation', () => {
            setInputs(70, 175);
            submitForm();
            expect(document.getElementById('bmiGauge').style.display).toBe('block');
        });

        test('gauge marker position is within 0-100% range', () => {
            setInputs(70, 175);
            submitForm();
            const marker = document.getElementById('bmiMarker');
            const left = parseFloat(marker.style.left);
            expect(left).toBeGreaterThanOrEqual(0);
            expect(left).toBeLessThanOrEqual(100);
        });

        test('higher BMI positions marker further right', () => {
            setInputs(70, 175);
            submitForm();
            const pos1 = parseFloat(document.getElementById('bmiMarker').style.left);

            setInputs(120, 175);
            submitForm();
            const pos2 = parseFloat(document.getElementById('bmiMarker').style.left);

            expect(pos2).toBeGreaterThan(pos1);
        });

        test('gauge caps at 100% for extreme BMI', () => {
            setInputs(200, 150); // > 50
            submitForm();
            const left = parseFloat(document.getElementById('bmiMarker').style.left);
            expect(left).toBe(100);
        });
    });

    describe('Result Display', () => {
        test('result box gets visible class', () => {
            setInputs(70, 175);
            submitForm();
            expect(document.getElementById('bmiResult').classList.contains('visible')).toBe(true);
        });

        test('BMI value shows 1 decimal place', () => {
            setInputs(70, 175);
            submitForm();
            const result = document.getElementById('bmiValue').textContent;
            expect(result).toMatch(/^\d+\.\d$/);
        });
    });

    describe('Edge Cases', () => {
        test('handles missing weight with alert', () => {
            setInputs('', 175);
            submitForm();
            expect(window.alert).toHaveBeenCalled();
        });

        test('handles missing height with alert', () => {
            setInputs(70, '');
            submitForm();
            expect(window.alert).toHaveBeenCalled();
        });

        test('handles invalid height <= 0 with alert', () => {
            setInputs(70, 0);
            submitForm();
            expect(window.alert).toHaveBeenCalled();
        });

        test('initializes without form gracefully', () => {
            document.body.innerHTML = '';
            expect(() => {
                jest.resetModules();
                require('../src/tools/bmi-calculator.js');
            }).not.toThrow();
        });
    });
});
