/* script.js for loan-calculator */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });

    const elPrincipal = $('#principal');
    const elRate = $('#rate');
    const elYears = $('#years');
    const elYearsSlider = $('#yearsSlider');
    const elExtra = $('#extra');

    const resMonthly = $('#resMonthly');
    const resInterest = $('#resInterest');
    const scheduleBody = $('#scheduleBody');
    const savingsAlert = $('#savingsAlert');
    const saveAmount = $('#saveAmount');
    const saveMonths = $('#saveMonths');

    let chartInstance = null;

    function formatCur(v) {
        return '$' + v.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }

    function calculate() {
        const P = parseFloat(elPrincipal.value) || 0;
        const R = parseFloat(elRate.value) || 0;
        const Y = parseFloat(elYears.value) || 0;
        let extra = parseFloat(elExtra.value) || 0;

        if (P <= 0 || Y <= 0) return;

        const months = Y * 12;
        const r_monthly = (R / 100) / 12;
        
        let monthlyPayment = 0;
        if(r_monthly > 0) {
            monthlyPayment = P * (r_monthly * Math.pow(1 + r_monthly, months)) / (Math.pow(1 + r_monthly, months) - 1);
        } else {
            monthlyPayment = P / months;
        }

        const baselineInterestTotal = (monthlyPayment * months) - P;

        // Amortization tracking
        let balance = P;
        let totalInterestPaid = 0;
        let totalMonthsWithExtra = 0;
        
        const scheduleHTML = [];
        let rDate = new Date();

        while (balance > 0.01 && totalMonthsWithExtra < (months + 600)) { // cap loop to prevent infinite
            totalMonthsWithExtra++;
            const interestPayment = balance * r_monthly;
            let principalPayment = (monthlyPayment - interestPayment) + extra;
            
            if (principalPayment > balance) {
                principalPayment = balance;
                extra = principalPayment - (monthlyPayment - interestPayment);
            }

            totalInterestPaid += interestPayment;
            balance -= principalPayment;
            
            if (balance < 0) balance = 0;

            const dStr = `${rDate.toLocaleString('default', {month:'short'})} ${rDate.getFullYear()}`;
            rDate.setMonth(rDate.getMonth() + 1);

            scheduleHTML.push(`
                <tr>
                    <td style="text-align:left;">${dStr}</td>
                    <td>${formatCur(principalPayment + interestPayment)}</td>
                    <td>${formatCur(principalPayment)}</td>
                    <td>${formatCur(interestPayment)}</td>
                    <td>${formatCur(totalInterestPaid)}</td>
                    <td>${formatCur(balance)}</td>
                </tr>
            `);
        }

        // Render UI
        resMonthly.textContent = formatCur(monthlyPayment + (parseFloat(elExtra.value)||0));
        resInterest.textContent = formatCur(totalInterestPaid);
        scheduleBody.innerHTML = scheduleHTML.join('');

        // Savings Calc
        if(extra > 0 && r_monthly > 0) {
            savingsAlert.style.display = 'block';
            const savedInt = baselineInterestTotal - totalInterestPaid;
            const savedM = months - totalMonthsWithExtra;
            const yrs = Math.floor(savedM / 12);
            const mos = savedM % 12;
            let timeStr = yrs > 0 ? `${yrs} years and ` : '';
            timeStr += `${mos} months`;
            saveAmount.textContent = formatCur(savedInt);
            saveMonths.textContent = timeStr;
        } else {
            savingsAlert.style.display = 'none';
        }

        renderChart(P, totalInterestPaid);
    }

    function renderChart(principal, interest) {
        const ctx = $('#loanChart').getContext('2d');
        if (chartInstance) chartInstance.destroy();
        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Principal', 'Total Interest'],
                datasets: [{
                    data: [principal, interest],
                    backgroundColor: ['#6366f1', '#f59e0b'],
                    borderColor: '#1e1e2e',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#e2e8f0' } }
                }
            }
        });
    }

    // Bindings
    elYearsSlider.addEventListener('input', (e) => { elYears.value = e.target.value; calculate(); });
    elYears.addEventListener('input', (e) => { elYearsSlider.value = e.target.value; calculate(); });
    
    [elPrincipal, elRate, elExtra].forEach(el => {
        el.addEventListener('input', calculate);
    });

    // Boot
    calculate();
})();
