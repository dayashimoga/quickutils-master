(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const CATEGORIES = {
    expense: ['Housing', 'Food', 'Transport', 'Utilities', 'Insurance', 'Healthcare', 'Savings', 'Personal', 'Entertainment', 'Other'],
    income: ['Salary', 'Freelance', 'Investments', 'Business', 'Gifts', 'Other']
};

let txns = JSON.parse(localStorage.getItem('budget_txns') || '[]');

function processRecurring() {
    const today = new Date();
    let updated = false;
    txns.forEach(t => {
        if (t.recurring) {
            const orgDate = new Date(t.date);
            let d = new Date(orgDate);
            while (d.getFullYear() < today.getFullYear() || (d.getFullYear() === today.getFullYear() && d.getMonth() < today.getMonth())) {
                d.setMonth(d.getMonth() + 1);
                const checkStr = d.toISOString().split('T')[0];
                const exists = txns.some(x => x.parentId === t.id && x.date === checkStr);
                if (!exists) {
                    txns.push({ id: Date.now() + Math.random(), parentId: t.id, type: t.type, amount: t.amount, category: t.category, desc: t.desc + ' (Recurring)', date: checkStr, recurring: false });
                    updated = true;
                }
            }
        }
    });
    if (updated) localStorage.setItem('budget_txns', JSON.stringify(txns));
}
processRecurring();

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let chart = null; let trendChartObj = null; let monthlyBudget = parseFloat(localStorage.getItem("budget_goal") || 2000);

const form = $('#txnForm'), tDate = $('#txnDate'), tAmt = $('#txnAmount'), tDesc = $('#txnDesc'), tCat = $('#txnCategory');
const radios = $$('input[name="txnType"]');

function initForm() {
    $("#budgetInput").value = monthlyBudget;
    $("#budgetInput").addEventListener("change", (e) => { monthlyBudget = parseFloat(e.target.value)||0; localStorage.setItem("budget_goal", monthlyBudget); updateDashboard(); });
    tDate.valueAsDate = new Date();
    updateCategories();
    radios.forEach(r => r.addEventListener('change', updateCategories));
}

function updateCategories() {
    const type = $('input[name="txnType"]:checked').value;
    tCat.innerHTML = '<option value="" disabled selected>Select category...</option>' + 
        CATEGORIES[type].map(c => `<option value="${c}">${c}</option>`).join('');
}

function formatMoney(num) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

function updateDashboard() {
    const monthTxns = txns.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    monthTxns.sort((a, b) => new Date(b.date) - new Date(a.date));

    let inc = 0, exp = 0;
    const catTotals = {};

    const tbody = $('#txnList');
    tbody.innerHTML = monthTxns.map(t => {
        const isExp = t.type === 'expense';
        const amt = parseFloat(t.amount);
        if (isExp) { exp += amt; catTotals[t.category] = (catTotals[t.category] || 0) + amt; }
        else inc += amt;

        return `<tr>
            <td class="date-col">${new Date(t.date).toLocaleDateString()}</td>
            <td class="desc-col">${escape(t.desc)}</td>
            <td><span class="cat-badge">${t.category}</span> ${t.recurring ? '<span style="font-size:0.8rem;" title="Recurring">🔁</span>' : ''}</td>
            <td class="text-right ${isExp ? 'amt-expense' : 'amt-income'}">${isExp ? '-' : '+'}${formatMoney(amt)}</td>
            <td><button class="icon-btn" onclick="deleteTxn(${t.id})">🗑️</button></td>
        </tr>`;
    }).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No transactions this month.</td></tr>';

    $('#totalIncome').textContent = formatMoney(inc);
    $('#totalExpenses').textContent = formatMoney(exp);
    $('#totalBalance').textContent = formatMoney(inc - exp);
    
    document.documentElement.style.setProperty('--expense', (inc - exp) < 0 ? '#ef4444' : '#ef4444');

    const dt = new Date(currentYear, currentMonth);
    $('#currentMonthStr').textContent = dt.toLocaleString('default', { month: 'long', year: 'numeric' });

    renderChart(catTotals);

    if (monthlyBudget > 0) {
        const pct = (exp / monthlyBudget) * 100;
        $('#budgetStatus').textContent = `${formatMoney(exp)} / ${formatMoney(monthlyBudget)} (${pct.toFixed(1)}%)`;
        const bar = $('#budgetBar');
        bar.style.width = Math.min(100, pct) + '%';
        if (pct < 50) bar.style.background = 'var(--c-success, #10b981)';
        else if (pct < 85) bar.style.background = 'var(--c-warning, #f59e0b)';
        else bar.style.background = 'var(--c-danger, #ef4444)';
    } else {
        $('#budgetStatus').textContent = 'Set a budget goal';
        $('#budgetBar').style.width = '0%';
    }
    
    renderTrendChart();

}

function renderChart(data) {
    const ctx = $('#categoryChart');
    if (chart) chart.destroy();
    
    const labels = Object.keys(data);
    const vals = Object.values(data);
    
    if (labels.length === 0) {
        chart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['No Data'], datasets: [{ data: [1], backgroundColor: ['#aaaaaa33'], borderWidth: 0 }] },
            options: { cutout: '70%', plugins: { tooltip: { enabled: false }, legend: { display: false } } }
        });
        return;
    }

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: vals, backgroundColor: colors, borderWidth: 2, borderColor: getComputedStyle(document.body).getPropertyValue('--bg-card') }] },
        options: { cutout: '65%', responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: getComputedStyle(document.body).getPropertyValue('--text') } } } }
    });
}

function escape(s) { return s.replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

form.addEventListener('submit', e => {
    e.preventDefault();
    const type = $('input[name="txnType"]:checked').value;
    txns.push({ id: Date.now(), type, amount: tAmt.value, category: tCat.value, desc: tDesc.value, date: tDate.value, recurring: $("#txnRecurring").checked });
    localStorage.setItem('budget_txns', JSON.stringify(txns));
    tAmt.value = ''; tDesc.value = '';
    updateDashboard();
});

window.deleteTxn = (id) => {
    txns = txns.filter(t => t.id !== id);
    localStorage.setItem('budget_txns', JSON.stringify(txns));
    updateDashboard();
};

$('#prevMonth').addEventListener('click', () => { currentMonth--; if(currentMonth < 0) { currentMonth=11; currentYear--; } updateDashboard(); });
$('#nextMonth').addEventListener('click', () => { currentMonth++; if(currentMonth > 11) { currentMonth=0; currentYear++; } updateDashboard(); });

$('#exportBtn').addEventListener('click', () => {
    const monthTxns = txns.filter(t => new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear);
    if (!monthTxns.length) return alert('No data to export for this month.');
    let csv = 'Date,Type,Category,Description,Amount\n';
    monthTxns.forEach(t => csv += `${t.date},${t.type},${t.category},"${t.desc.replace(/"/g, '""')}",${t.amount}\n`);
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `budget_export_${currentYear}_${currentMonth+1}.csv`;
    a.click();
});

$('#themeBtn').addEventListener('click', () => {
    const d = document.documentElement;
    const isDark = d.dataset.theme === 'dark';
    d.dataset.theme = isDark ? 'light' : 'dark';
    $('#themeBtn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', d.dataset.theme);
    if (chart && Object.keys(chart.data.labels).length && chart.data.labels[0] !== 'No Data') {
        chart.options.plugins.legend.labels.color = getComputedStyle(document.body).getPropertyValue('--text');
        chart.data.datasets[0].borderColor = getComputedStyle(document.body).getPropertyValue('--bg-card');
        chart.update();
    }
});

if (localStorage.getItem('theme') === 'light') { document.documentElement.dataset.theme = 'light'; $('#themeBtn').textContent = '☀️'; }
initForm();
updateDashboard();
})();

function renderTrendChart() {
    const ctx = $('#trendChart');
    if (trendChartObj) trendChartObj.destroy();
    
    // Calculate last 6 months
    const labels = [];
    const incData = [];
    const expData = [];
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        labels.push(d.toLocaleString('default', { month: 'short' }));
        
        let mInc = 0, mExp = 0;
        txns.forEach(t => {
            const td = new Date(t.date);
            if (td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear()) {
                if (t.type === 'expense') mExp += parseFloat(t.amount);
                else mInc += parseFloat(t.amount);
            }
        });
        incData.push(mInc);
        expData.push(mExp);
    }
    
    trendChartObj = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Income', data: incData, backgroundColor: '#10b981' },
                { label: 'Expense', data: expData, backgroundColor: '#ef4444' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: getComputedStyle(document.body).getPropertyValue('--border') } },
                x: { grid: { display: false } }
            },
            plugins: {
                legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text') } }
            }
        }
    });
}
