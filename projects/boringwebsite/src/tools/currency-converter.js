// Currency Converter (offline static rates with 50+ currencies)
(function () {
    'use strict';
    const form = document.getElementById('currencyForm');
    if (!form) return;

    // Static exchange rates relative to USD (approximate, March 2026)
    var RATES = {
        USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, INR: 83.2, CAD: 1.36,
        AUD: 1.53, CHF: 0.88, CNY: 7.24, HKD: 7.82, SGD: 1.34, SEK: 10.42,
        NOK: 10.55, DKK: 6.88, NZD: 1.63, ZAR: 18.7, BRL: 4.97, MXN: 17.15,
        KRW: 1320, TRY: 30.2, RUB: 91.5, PLN: 4.05, THB: 35.6, IDR: 15650,
        MYR: 4.72, PHP: 56.1, VND: 24500, CZK: 22.8, HUF: 355, ILS: 3.67,
        AED: 3.67, SAR: 3.75, QAR: 3.64, KWD: 0.31, BHD: 0.376, OMR: 0.385,
        EGP: 30.9, NGN: 1550, KES: 153, GHS: 12.5, PKR: 278, BDT: 110,
        LKR: 310, NPR: 133, MMK: 2100, CLP: 950, COP: 3950, PEN: 3.72,
        ARS: 870, UYU: 39.2, TWD: 31.5, BGN: 1.8, RON: 4.58, HRK: 6.93,
        ISK: 137
    };

    var fromSel = document.getElementById('currFrom');
    var toSel = document.getElementById('currTo');

    // Populate dropdowns
    Object.keys(RATES).forEach(function (code) {
        var opt1 = document.createElement('option');
        opt1.value = code; opt1.textContent = code;
        fromSel.appendChild(opt1);
        var opt2 = document.createElement('option');
        opt2.value = code; opt2.textContent = code;
        toSel.appendChild(opt2);
    });
    fromSel.value = 'USD';
    toSel.value = 'INR';

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var amount = parseFloat(document.getElementById('currAmount').value);
        var from = fromSel.value;
        var to = toSel.value;

        if (!amount || amount <= 0 || !RATES[from] || !RATES[to]) return;

        // Convert via USD as base
        var inUsd = amount / RATES[from];
        var result = inUsd * RATES[to];
        var rate = RATES[to] / RATES[from];

        document.getElementById('currResult').textContent = result.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' ' + to;
        document.getElementById('currRate').textContent = '1 ' + from + ' = ' + rate.toFixed(4) + ' ' + to;

        const resultBox = document.getElementById('currencyResult');
        if (resultBox) resultBox.classList.add('visible');
    });

    // Swap button
    var swapBtn = document.getElementById('currSwap');
    if (swapBtn) {
        swapBtn.addEventListener('click', function () {
            var tmp = fromSel.value;
            fromSel.value = toSel.value;
            toSel.value = tmp;
        });
    }
})();
