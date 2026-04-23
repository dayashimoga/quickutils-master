(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

let currentChart = null;

const COLORS = {
    modern: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
    pastel: ['#93c5fd', '#86efac', '#fcd34d', '#fca5a5', '#c4b5fd', '#67e8f9'],
    neon: ['#00f3ff', '#ff003c', '#e2ff00', '#00ff0a', '#ff00e6', '#ffa200']
};
let currentColors = COLORS.modern;

function initColorPresets() {
    const cont = $('#colorPresets');
    cont.innerHTML = Object.entries(COLORS).map(([name, colors]) => `
        <div class="color-preset" style="background:linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)" data-preset="${name}" title="${name}"></div>
    `).join('');
    
    $$('.color-preset').forEach(p => {
        p.addEventListener('click', () => {
            $$('.color-preset').forEach(el => el.classList.remove('active'));
            p.classList.add('active');
            currentColors = COLORS[p.dataset.preset];
            generateChart();
        });
    });
    $('.color-preset').classList.add('active');
}

let activeType = 'bar';
$$('.chart-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        $$('.chart-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeType = btn.dataset.type;
        generateChart();
    });
});

function generateChart() {
    const ctx = $('#chartCanvas').getContext('2d');
    
    const title = $('#chartTitle').value;
    const labels = $('#chartLabels').value.split(',').map(s => s.trim());
    const data = $('#chartValues').value.split(',').map(s => parseFloat(s.trim()));
    
    if (currentChart) {
        currentChart.destroy();
    }
    
    const isDark = document.documentElement.dataset.theme === 'dark';
    const textColor = isDark ? '#e8e8f0' : '#1a1a2e';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    
    // Fallback colors if more data than colors
    let bgColors = [];
    for(let i=0; i<data.length; i++) bgColors.push(currentColors[i % currentColors.length]);

    const res = parseInt($('#exportRes')?.value || "1");

    currentChart = new Chart(ctx, {
        type: activeType,
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: data,
                backgroundColor: activeType !== 'line' && activeType !== 'radar' ? bgColors : bgColors[0] + '40',
                borderColor: activeType !== 'line' && activeType !== 'radar' ? (isDark ? '#12121e' : '#fff') : bgColors[0],
                borderWidth: activeType !== 'line' && activeType !== 'radar' ? 2 : 3,
                tension: 0.3,
                fill: activeType === 'radar' || activeType === 'line' ? true : false,
                pointBackgroundColor: bgColors[0],
                pointRadius: 4
            }]
        },
        options: {
            devicePixelRatio: window.devicePixelRatio * res,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: activeType === 'pie' || activeType === 'doughnut' || activeType === 'polarArea',
                    position: 'bottom',
                    labels: { color: textColor, font: { family: 'Inter', size: 12 } }
                },
                title: {
                    display: true,
                    text: title,
                    color: textColor,
                    font: { family: 'Inter', size: 16, weight: 'bold' }
                }
            },
            scales: (activeType === 'pie' || activeType === 'doughnut' || activeType === 'polarArea' || activeType === 'radar') ? {
                r: { ticks: { color: textColor, backdropColor: 'transparent' }, grid: { color: gridColor }, pointLabels: { color: textColor } }
            } : {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                y: { ticks: { color: textColor }, grid: { color: gridColor } }
            }
        }
    });
}

$('#generateBtn').addEventListener('click', generateChart);

$('#downloadChartBtn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `chart-${Date.now()}.png`;
    link.href = $('#chartCanvas').toDataURL('image/png', 1.0);
    link.click();
});

// Watch for inputs to update chart dynamically
['chartTitle', 'chartLabels', 'chartValues'].forEach(id => {
    $('#' + id).addEventListener('input', () => {
        clearTimeout(window.chartTimer);
        window.chartTimer = setTimeout(generateChart, 500);
    });
});

$('#exportRes')?.addEventListener('change', generateChart);

$('#importDataBtn')?.addEventListener('click', () => {
    const raw = $('#dataImportBox').value.trim();
    if(!raw) {
        if(typeof QU !== 'undefined') QU.showToast('Please enter data to import', 'error');
        return;
    }
    let parsedLabels = [];
    let parsedValues = [];
    try {
        if(raw.startsWith('[') || raw.startsWith('{')) {
            const data = JSON.parse(raw);
            if(Array.isArray(data)) {
                data.forEach(item => {
                    if(Array.isArray(item)) { parsedLabels.push(item[0]); parsedValues.push(item[1]); }
                    else if(typeof item === 'object') {
                        const keys = Object.keys(item);
                        parsedLabels.push(item[keys[0]] || 'Unlabeled');
                        parsedValues.push(item[keys[1]] || 0);
                    } else {
                        parsedLabels.push('Item');
                        parsedValues.push(parseFloat(item) || 0);
                    }
                });
            } else {
                Object.entries(data).forEach(([k,v]) => { parsedLabels.push(k); parsedValues.push(parseFloat(v) || 0); });
            }
        } else {
            const lines = raw.split('\n');
            lines.forEach((line, i) => {
                const parts = line.split(',');
                if(parts.length >= 2) {
                    const l = parts[0].trim();
                    const v = parseFloat(parts[1].trim());
                    if(!isNaN(v)) { parsedLabels.push(l); parsedValues.push(v); }
                    else if (i !== 0) { parsedLabels.push(l); parsedValues.push(0); }
                }
            });
        }
        if(parsedLabels.length > 0) {
            $('#chartLabels').value = parsedLabels.join(', ');
            $('#chartValues').value = parsedValues.join(', ');
            generateChart();
            if(typeof QU !== 'undefined') QU.showToast('Data imported successfully');
        } else {
            if(typeof QU !== 'undefined') QU.showToast('Could not parse data', 'error');
        }
    } catch(e) {
        if(typeof QU !== 'undefined') QU.showToast('Error parsing data: ' + e.message, 'error');
    }
});

// Theme
if (typeof QU !== 'undefined') QU.initTheme();
else {
    $('#themeBtn').addEventListener('click', () => { 
        const h = document.documentElement; 
        const d = h.dataset.theme === 'dark'; 
        h.dataset.theme = d ? 'light' : 'dark'; 
        $('#themeBtn').textContent = d ? '☀️' : '🌙'; 
        localStorage.setItem('theme', h.dataset.theme);
        generateChart(); // re-render chart for new theme
    });
    if (localStorage.getItem('theme') === 'light') { document.documentElement.dataset.theme = 'light'; $('#themeBtn').textContent = '☀️'; }
}

initColorPresets();
// Wait for Chart.js to load (in a real app we'd load this better)
setTimeout(generateChart, 300);

})();
