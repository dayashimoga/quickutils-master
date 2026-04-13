/* stock-simulator */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    const stocks=[
        {sym:'AAPL',name:'Apple Inc.',price:175,owned:0,history:[175]},
        {sym:'GOOGL',name:'Alphabet',price:140,owned:0,history:[140]},
        {sym:'TSLA',name:'Tesla',price:250,owned:0,history:[250]},
        {sym:'AMZN',name:'Amazon',price:180,owned:0,history:[180]},
        {sym:'MSFT',name:'Microsoft',price:420,owned:0,history:[420]},
        {sym:'NVDA',name:'NVIDIA',price:900,owned:0,history:[900]},
    ];
    let cash=10000;
    const canvas = $('#chartCanvas');
    const cCtx = canvas ? canvas.getContext('2d') : null;

    function tick(){
        stocks.forEach(s=>{const change=(Math.random()-0.48)*s.price*0.03;s.price=Math.max(1,s.price+change);s.history.push(s.price);if(s.history.length>60)s.history.shift();});
        render();
    }

    function render(){
        let pVal=stocks.reduce((a,s)=>a+s.owned*s.price,0);
        $('#cash').textContent='$'+cash.toFixed(2);
        $('#portfolio').textContent='$'+pVal.toFixed(2);
        $('#total').textContent='$'+(cash+pVal).toFixed(2);
        $('#total').style.color=(cash+pVal)>=10000?'#22c55e':'#ef4444';
        $('#stockList').innerHTML=stocks.map((s,i)=>{
            const chg=s.history.length>1?((s.price-s.history[s.history.length-2])/s.history[s.history.length-2]*100).toFixed(2):0;
            const color=chg>=0?'#22c55e':'#ef4444';
            return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px;margin:4px 0;background:rgba(255,255,255,0.04);border-radius:8px;flex-wrap:wrap;gap:8px;"><div><strong>'+s.sym+'</strong> <span class="text-muted">'+s.name+'</span></div><div style="color:'+color+';font-weight:700;">$'+s.price.toFixed(2)+' ('+((chg>=0?'+':'')+chg)+'%)</div><div>Owned: '+s.owned+'</div><div class="d-flex gap-2"><button class="btn btn-sm btn-primary" onclick="QU_Stock.buy('+i+')">Buy</button><button class="btn btn-sm btn-secondary" onclick="QU_Stock.sell('+i+')">Sell</button></div></div>';
        }).join('');
        drawChart();
    }
    function drawChart(){
        if(!cCtx || !$('#chartCanvas')) return;
        const w=$('#chartCanvas').width=$('#chartCanvas').parentElement.clientWidth;
        const h=200;cCtx.clearRect(0,0,w,h);
        stocks.forEach((s,si)=>{
            const c=['#ef4444','#22c55e','#3b82f6','#f59e0b','#8b5cf6','#14b8a6'][si];
            cCtx.strokeStyle=c;cCtx.lineWidth=1.5;cCtx.beginPath();
            const mn=Math.min(...s.history),mx=Math.max(...s.history)||1;
            s.history.forEach((p,i)=>{const x=i/(s.history.length-1)*w;const y=h-((p-mn)/(mx-mn||1))*h*0.8-h*0.1;if(i===0)cCtx.moveTo(x,y);else cCtx.lineTo(x,y);});
            cCtx.stroke();
        });
    }
    window.QU_Stock={
        buy:i=>{const s=stocks[i];if(cash>=s.price){cash-=s.price;s.owned++;render();}},
        sell:i=>{const s=stocks[i];if(s.owned>0){cash+=s.price;s.owned--;render();}}
    };
    render(); setInterval(tick,2000);

})();
