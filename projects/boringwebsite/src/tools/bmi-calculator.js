/* ============================================================
   BMI Calculator — DailyLift Tools
   ============================================================ */
(function () {
    'use strict';

    const form = document.getElementById('bmiForm');
    if (!form) return;

    const categories = [
        { max: 16, label: 'Severely Underweight', color: '#5eb3f0' },
        { max: 18.5, label: 'Underweight', color: '#66ccff' },
        { max: 25, label: 'Normal Weight', color: '#4ade80' },
        { max: 30, label: 'Overweight', color: '#fbbf24' },
        { max: 35, label: 'Obese Class I', color: '#f87171' },
        { max: 40, label: 'Obese Class II', color: '#ef4444' },
        { max: Infinity, label: 'Obese Class III', color: '#dc2626' }
    ];

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const weight = parseFloat(document.getElementById('bmiWeight').value);
        const heightCm = parseFloat(document.getElementById('bmiHeight').value);

        if (!weight || weight <= 0) return alert('Please enter a valid weight.');
        if (!heightCm || heightCm <= 0) return alert('Please enter a valid height.');

        const heightM = heightCm / 100;
        const bmi = weight / (heightM * heightM);

        // Find category
        const cat = categories.find(c => bmi < c.max) || categories[categories.length - 1];

        document.getElementById('bmiValue').textContent = bmi.toFixed(1);
        document.getElementById('bmiCategory').textContent = cat.label;
        document.getElementById('bmiCategory').style.color = cat.color;

        // Position gauge marker (BMI range 10–50)
        const gauge = document.getElementById('bmiGauge');
        const marker = document.getElementById('bmiMarker');
        gauge.style.display = 'block';

        const percent = Math.min(Math.max((bmi - 10) / 40 * 100, 0), 100);
        marker.style.left = percent + '%';

        const resultBox = document.getElementById('bmiResult');
        resultBox.classList.add('visible');
    });
})();
