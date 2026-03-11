// Insurance Premium Estimator
(function () {
    'use strict';
    const form = document.getElementById('insuranceForm');
    if (!form) return;

    // Base premium rates per $100K coverage (simplified real-world estimates)
    const BASE_RATES = {
        health: { base: 450, ageFactor: 1.035 },   // ~$450/yr per 100K, +3.5%/yr of age
        auto: { base: 120, ageFactor: 1.02 },     // ~$120/yr per 100K, +2%/yr of age
        life: { base: 80, ageFactor: 1.045 }      // ~$80/yr per 100K, +4.5%/yr of age
    };

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const age = parseInt(document.getElementById('insAge').value, 10);
        const type = document.getElementById('insType').value;
        const coverage = parseFloat(document.getElementById('insCoverage').value);

        if (!age || !coverage || age < 18 || age > 85 || coverage <= 0) return;

        const rate = BASE_RATES[type];
        if (!rate) return;

        const ageMult = Math.pow(rate.ageFactor, age - 25); // normalized to age 25
        const annualPremium = (coverage / 100000) * rate.base * ageMult;
        const monthlyPremium = annualPremium / 12;

        document.getElementById('insMonthly').textContent = '$' + monthlyPremium.toLocaleString('en-US', { maximumFractionDigits: 0 });
        document.getElementById('insAnnual').textContent = '$' + annualPremium.toLocaleString('en-US', { maximumFractionDigits: 0 });

        // Risk category
        var risk = 'Low';
        if (age > 55) risk = 'High';
        else if (age > 40) risk = 'Medium';
        document.getElementById('insRisk').textContent = risk + ' Risk Profile';

        const resultBox = document.getElementById('insResult');
        if (resultBox) resultBox.classList.add('visible');
    });
})();
