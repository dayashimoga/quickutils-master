// Tax Calculator (US, UK, Canada, India)
(function () {
    'use strict';
    var form = document.getElementById('taxForm');
    if (!form) return;

    // 2026 approximate tax brackets
    var BRACKETS = {
        us: [
            { limit: 11600, rate: 0.10 },
            { limit: 47150, rate: 0.12 },
            { limit: 100525, rate: 0.22 },
            { limit: 191950, rate: 0.24 },
            { limit: 243725, rate: 0.32 },
            { limit: 609350, rate: 0.35 },
            { limit: Infinity, rate: 0.37 }
        ],
        uk: [
            { limit: 12570, rate: 0.0 },
            { limit: 50270, rate: 0.20 },
            { limit: 125140, rate: 0.40 },
            { limit: Infinity, rate: 0.45 }
        ],
        canada: [
            { limit: 55867, rate: 0.15 },
            { limit: 111733, rate: 0.205 },
            { limit: 154906, rate: 0.26 },
            { limit: 220000, rate: 0.29 },
            { limit: Infinity, rate: 0.33 }
        ],
        india: [
            { limit: 300000, rate: 0.0 },
            { limit: 700000, rate: 0.05 },
            { limit: 1000000, rate: 0.10 },
            { limit: 1200000, rate: 0.15 },
            { limit: 1500000, rate: 0.20 },
            { limit: Infinity, rate: 0.30 }
        ]
    };

    var CURRENCY_SYMBOLS = { us: '$', uk: '£', canada: 'C$', india: '₹' };

    function calculateTax(income, country) {
        var brackets = BRACKETS[country];
        if (!brackets) return { tax: 0, effectiveRate: 0 };

        var tax = 0;
        var prev = 0;
        for (var i = 0; i < brackets.length; i++) {
            var b = brackets[i];
            if (income <= prev) break;
            var taxable = Math.min(income, b.limit) - prev;
            if (taxable > 0) tax += taxable * b.rate;
            prev = b.limit;
        }

        return {
            tax: tax,
            effectiveRate: income > 0 ? (tax / income * 100) : 0
        };
    }

    function getBracketLabel(income, country) {
        var brackets = BRACKETS[country];
        var prev = 0;
        for (var i = 0; i < brackets.length - 1; i++) {
            if (income <= brackets[i].limit) {
                return (brackets[i].rate * 100).toFixed(0) + '% bracket';
            }
            prev = brackets[i].limit;
        }
        return 'Top bracket';
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var income = parseFloat(document.getElementById('taxIncome').value);
        var country = document.getElementById('taxCountry').value;

        if (!income || income <= 0) return;

        var result = calculateTax(income, country);
        var sym = CURRENCY_SYMBOLS[country] || '$';
        var takeHome = income - result.tax;

        document.getElementById('taxAmount').textContent = sym + result.tax.toLocaleString('en-US', { maximumFractionDigits: 0 });
        document.getElementById('taxEffective').textContent = result.effectiveRate.toFixed(1) + '% effective rate';
        document.getElementById('taxTakeHome').textContent = sym + takeHome.toLocaleString('en-US', { maximumFractionDigits: 0 });
        document.getElementById('taxBracket').textContent = getBracketLabel(income, country);

        const resultBox = document.getElementById('taxResult');
        if (resultBox) resultBox.classList.add('visible');
    });
})();
