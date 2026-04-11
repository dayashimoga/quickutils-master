/* room-planner */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    const canvas=$('#roomCanvas'),ctx=canvas.getContext('2d');
    let items=[], drag=null, offset={x:0,y:0};
    
    function draw(){
        const w=800,h=500;ctx.clearRect(0,0,w,h);
        ctx.fillStyle='#1a1a2e';ctx.fillRect(0,0,w,h);
        // Grid
        ctx.strokeStyle='rgba(255,255,255,0.05)';
        for(let x=0;x<w;x+=20){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
        for(let y=0;y<h;y+=20){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
        // Walls
        ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=3;ctx.strokeRect(2,2,w-4,h-4);
        // Items
        items.forEach(it=>{
            ctx.fillStyle=it.c;ctx.fillRect(it.x,it.y,it.w,it.h);
            ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.strokeRect(it.x,it.y,it.w,it.h);
            ctx.fillStyle='#fff';ctx.font='12px Inter';ctx.textAlign='center';ctx.fillText(it.type,it.x+it.w/2,it.y+it.h/2+4);
        });
    }
    
    $$('.add-furniture').forEach(b=>b.addEventListener('click',()=>{
        items.push({x:100+Math.random()*400,y:100+Math.random()*200,w:parseInt(b.dataset.w),h:parseInt(b.dataset.h),c:b.dataset.c,type:b.dataset.type});
        draw();
    }));
    
    canvas.addEventListener('mousedown',e=>{
        const r=canvas.getBoundingClientRect();const mx=(e.clientX-r.left)*(800/r.width);const my=(e.clientY-r.top)*(500/r.height);
        for(let i=items.length-1;i>=0;i--){const it=items[i];if(mx>=it.x&&mx<=it.x+it.w&&my>=it.y&&my<=it.y+it.h){drag=it;offset={x:mx-it.x,y:my-it.y};break;}}
    });
    canvas.addEventListener('mousemove',e=>{
        if(!drag)return;const r=canvas.getBoundingClientRect();
        drag.x=(e.clientX-r.left)*(800/r.width)-offset.x;drag.y=(e.clientY-r.top)*(500/r.height)-offset.y;draw();
    });
    window.addEventListener('mouseup',()=>drag=null);
    $('#clearRoom').addEventListener('click',()=>{items=[];draw();});
    draw();

})();
