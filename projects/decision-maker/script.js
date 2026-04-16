/* decision-maker */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    let options = ['Pizza','Sushi','Tacos','Burgers','Salad'];
    let spinning = false, angle = 0, heads = 0, tails = 0;
    const colors = ['#ef4444','#f59e0b','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316'];
    const wCtx = $('#wheelCanvas').getContext('2d');

    function drawWheel(highlight) {
        const cx=175,cy=175,r=160;
        wCtx.clearRect(0,0,350,350);
        if(options.length===0) return;
        const slice = (Math.PI*2)/options.length;
        options.forEach((o,i) => {
            wCtx.beginPath(); wCtx.moveTo(cx,cy);
            wCtx.arc(cx,cy,r,angle+i*slice,angle+(i+1)*slice);
            wCtx.fillStyle = colors[i%colors.length]; wCtx.fill();
            if (wCtx.save) {
                wCtx.save(); wCtx.translate(cx,cy); wCtx.rotate(angle+(i+0.5)*slice);
                wCtx.fillStyle='#fff'; wCtx.font='bold 13px Inter'; wCtx.textAlign='right';
                wCtx.fillText(o.substring(0,12),r-15,5); wCtx.restore();
            }
        });
        // Arrow
        wCtx.fillStyle='#fff'; wCtx.beginPath(); wCtx.moveTo(cx+r+5,cy); wCtx.lineTo(cx+r+20,cy-10); wCtx.lineTo(cx+r+20,cy+10); wCtx.fill();
    }

    function renderOpts() {
        $('#optList').innerHTML = options.map((o,i) => '<div style="display:flex;justify-content:space-between;padding:4px 8px;margin:2px 0;background:rgba(255,255,255,0.05);border-radius:4px;"><span>'+o+'</span><button onclick="QU_DM.rm('+i+')" style="background:none;border:none;color:#ef4444;cursor:pointer;">✕</button></div>').join('');
        drawWheel();
    }
    window.QU_DM = { rm: i => { options.splice(i,1); renderOpts(); } };

    $('#addOpt').addEventListener('click', () => { const v=$('#optionInput').value.trim(); if(v){options.push(v);$('#optionInput').value='';renderOpts();} });
    $('#optionInput').addEventListener('keypress', e => { if(e.key==='Enter') $('#addOpt').click(); });

    $('#spinBtn').addEventListener('click', () => {
        if(spinning||options.length<2) return;
        spinning = true;
        let vel = 0.3 + Math.random()*0.2, decay = 0.985;
        function spin() {
            angle += vel; vel *= decay; drawWheel();
            if(vel > 0.002) requestAnimationFrame(spin);
            else { spinning=false; const slice=(Math.PI*2)/options.length; const idx=Math.floor(((2*Math.PI-(angle%(Math.PI*2)))%(Math.PI*2))/slice)%options.length; alert('🎉 '+options[idx]+'!'); }
        }
        spin();
    });

    $('#flipBtn').addEventListener('click', () => {
        const r = Math.random() > 0.5;
        $('#coinResult').style.transition='transform 0.5s'; $('#coinResult').style.transform='rotateY(360deg)';
        setTimeout(()=>{ $('#coinResult').textContent = r ? '🪙' : '⭐'; $('#coinResult').style.transform=''; if(r)heads++;else tails++; $('#headsCount').textContent=heads; $('#tailsCount').textContent=tails; },500);
    });
    renderOpts();

})();
