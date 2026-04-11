/* meditation-journey */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    const canvas=$('#medCanvas'),ctx=canvas.getContext('2d');
    let t=0,running=false,animId,sessionStart;
    const stats=JSON.parse(localStorage.getItem('qu_med_stats')||'{"sessions":0,"minutes":0}');
    $('#sessionCount').textContent=stats.sessions;$('#totalMins').textContent=stats.minutes;
    
    const modes={
        '478':{in:4,hold:7,out:8,name:'4-7-8'},
        box:{in:4,hold:4,out:4,name:'Box'},
        calm:{in:5,hold:0,out:5,name:'Calm'}
    };

    function loop(){
        if(!running)return;
        const w=canvas.width=Math.min(500,canvas.parentElement.clientWidth),h=400;
        ctx.fillStyle='rgba(0,0,0,0.08)';ctx.fillRect(0,0,w,h);
        t+=0.015;
        const mode=modes[$('#breathMode').value]||modes['478'];
        const cycle=mode.in+mode.hold+mode.out;
        const phase=t%cycle;
        let r,text;
        if(phase<mode.in){r=40+(phase/mode.in)*60;text='Inhale...';}
        else if(phase<mode.in+mode.hold){r=100;text='Hold...';}
        else{r=100-((phase-mode.in-mode.hold)/mode.out)*60;text='Exhale...';}
        $('#breathText').textContent=text;
        const hue=(t*20)%360;
        ctx.beginPath();ctx.arc(w/2,h/2,r,0,Math.PI*2);
        ctx.fillStyle='hsla('+hue+',70%,60%,0.7)';ctx.shadowBlur=40;ctx.shadowColor='hsla('+hue+',70%,60%,0.5)';
        ctx.fill();ctx.shadowBlur=0;
        // Particle ring
        for(let i=0;i<20;i++){const a=(i/20)*Math.PI*2+t*0.5;const pr=r+30+Math.sin(t*2+i)*10;ctx.fillStyle='hsla('+(hue+i*18)+',80%,70%,0.4)';ctx.beginPath();ctx.arc(w/2+Math.cos(a)*pr,h/2+Math.sin(a)*pr,2,0,Math.PI*2);ctx.fill();}
        animId=requestAnimationFrame(loop);
    }
    $('#startMed').addEventListener('click',()=>{
        if(running){running=false;cancelAnimationFrame(animId);$('#startMed').textContent='▶ Start Session';
            const mins=Math.round((Date.now()-sessionStart)/60000);stats.sessions++;stats.minutes+=Math.max(1,mins);localStorage.setItem('qu_med_stats',JSON.stringify(stats));
            $('#sessionCount').textContent=stats.sessions;$('#totalMins').textContent=stats.minutes;
        }else{running=true;t=0;sessionStart=Date.now();$('#startMed').textContent='⏹ End Session';loop();}
    });

})();
