/* fire-simulator */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    const ctx=$('#fireChart').getContext('2d');
    function calc(){
        const savings=parseFloat($('#savings').value)||0;
        const income=parseFloat($('#income').value)||0;
        const expenses=parseFloat($('#expenses').value)||0;
        const roi=(parseFloat($('#roi').value)||7)/100;
        const wr=(parseFloat($('#withdraw').value)||4)/100;
        const annualSave=income-expenses;
        const fireNumber=expenses/wr;
        let bal=savings,years=0;
        const data=[bal],labels=['Now'];
        while(bal<fireNumber&&years<60){years++;bal=bal*(1+roi)+annualSave;data.push(Math.round(bal));labels.push('Y'+years);}
        const w=$('#fireChart').width=$('#fireChart').parentElement.clientWidth,h=300;
        ctx.clearRect(0,0,w,h);
        const max=Math.max(...data,fireNumber);
        // FIRE line
        const fy=h-(fireNumber/max)*h*0.85-h*0.05;
        ctx.strokeStyle='rgba(239,68,68,0.5)';ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(0,fy);ctx.lineTo(w,fy);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle='#ef4444';ctx.font='11px Inter';ctx.fillText('FIRE: $'+Math.round(fireNumber).toLocaleString(),5,fy-5);
        // Growth line
        ctx.strokeStyle='#22c55e';ctx.lineWidth=2;ctx.beginPath();
        data.forEach((d,i)=>{const x=i/(data.length-1)*w;const y=h-(d/max)*h*0.85-h*0.05;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});
        ctx.stroke();
        // Fill under
        ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fillStyle='rgba(34,197,94,0.1)';ctx.fill();
        
        const color=years>=60?'#ef4444':'#22c55e';
        $('#fireResult').innerHTML='<div style="font-size:0.9rem;color:#aaa;">FIRE Number</div><div style="font-size:2.5rem;font-weight:800;color:'+color+';">$'+Math.round(fireNumber).toLocaleString()+'</div><div style="font-size:1.1rem;margin-top:8px;">'+(years>=60?'⚠️ May take 60+ years':'🎉 Reach FIRE in <strong>'+years+' years</strong>')+'</div><div class="text-muted mt-2">Saving $'+annualSave.toLocaleString()+'/year at '+((roi*100))+'% return</div>';
    }
    $('#calcBtn').addEventListener('click',calc);
    ['#savings','#income','#expenses','#roi','#withdraw'].forEach(s=>$(s).addEventListener('input',calc));
    calc();

})();
