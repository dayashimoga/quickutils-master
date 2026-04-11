/* keyboard-tester */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    const pressed={}, times=[];
    let lastPress=0, count=0;
    const KEYS='1234567890QWERTYUIOPASDFGHJKLZXCVBNM'.split('');
    KEYS.forEach(k=>{
        const d=document.createElement('div');
        d.id='hk_'+k; d.textContent=k;
        d.style.cssText='width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;font-weight:700;font-size:0.85rem;transition:all 0.2s;';
        $('#heatmap').appendChild(d);
    });
    document.addEventListener('keydown', e=>{
        e.preventDefault();
        const now=performance.now();
        const key=e.key.toUpperCase();
        count++;
        if(lastPress>0) times.push(now-lastPress);
        lastPress=now;
        $('#lastKey').textContent=e.key===' '?'Space':e.key;
        $('#keyCount').textContent=count;
        if(times.length>0) $('#avgTime').textContent=Math.round(times.reduce((a,b)=>a+b,0)/times.length);
        const hk=$('#hk_'+key);
        if(hk){ pressed[key]=(pressed[key]||0)+1; const intensity=Math.min(pressed[key]*30,255); hk.style.background='rgba(99,102,241,'+Math.min(1,pressed[key]*0.15)+')'; hk.style.borderColor='#6366f1'; hk.style.transform='scale(1.15)'; setTimeout(()=>hk.style.transform='',150); }
        $('#keyLog').innerHTML = '<div>'+e.key+' (code: '+e.code+') — '+Math.round(now)+'ms</div>' + $('#keyLog').innerHTML;
    });

})();
