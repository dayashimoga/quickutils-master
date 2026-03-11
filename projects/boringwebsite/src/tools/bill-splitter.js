/* ============================================================
   Bill Splitter — DailyLift Tools
   ============================================================ */
(function () {
    'use strict';

    const form = document.getElementById('billForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const total = parseFloat(document.getElementById('billTotal').value);
        const people = parseInt(document.getElementById('billPeople').value, 10);
        const tipPercent = parseFloat(document.getElementById('billTip').value) || 0;

        if (!total || total <= 0) return alert('Please enter a valid bill amount.');
        if (!people || people < 1) return alert('Please enter at least 1 person.');

        const tipAmount = total * (tipPercent / 100);
        const grandTotal = total + tipAmount;
        const perPerson = grandTotal / people;

        document.getElementById('billPerPerson').textContent = '₹' + perPerson.toFixed(2);
        document.getElementById('billTipAmount').textContent = '₹' + tipAmount.toFixed(2);
        document.getElementById('billGrandTotal').textContent = '₹' + grandTotal.toFixed(2);

        const resultBox = document.getElementById('billResult');
        resultBox.classList.add('visible');
    });
})();
