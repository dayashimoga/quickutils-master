/* script.js for fire-simulator */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    
    // Initialize common utilities
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    const nw=$('#netWorth'), asc=$('#annualSave'), roi=$('#roi'), btn=$('#calcBtn');
let chart;
btn.onclick = () => {
    let p = Number(nw.value), s = Number(asc.value), r = Number(roi.value)/100;
    let data = [], labels = [];
    for(let i=0; i<=30; i++) {
        labels.push('Year '+i); data.push(p);
        p = p * (1 + r) + s;
    }
    if(chart) chart.destroy();
    chart = new Chart($('#fireChart').getContext('2d'), {
        type: 'line',
        data: { labels, datasets: [{label: 'Net Worth', data, borderColor: '#39d353', tension: 0.2}] }
    });
}; btn.click();
})();