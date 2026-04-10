/* script.js for room-planner */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    
    // Initialize common utilities
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    const ctx = $('#roomCanvas').getContext('2d');
let items = [];
function draw() {
    ctx.clearRect(0,0,800,400); 
    // grid
    ctx.strokeStyle='rgba(255,255,255,0.05)';
    for(let i=0;i<800;i+=20){ ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,400);ctx.stroke(); ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(800,i);ctx.stroke();}
    items.forEach(it => { ctx.fillStyle=it.c; ctx.fillRect(it.x, it.y, it.w, it.h); ctx.fillStyle='#fff'; ctx.fillText(it.name, it.x+5, it.y+20); });
}
$('#addBed').onclick = () => { items.push({x:100, y:100, w:80, h:120, c:'#1d4ed8', name:'Bed'}); draw(); };
$('#addDesk').onclick = () => { items.push({x:300, y:100, w:100, h:50, c:'#f59e0b', name:'Desk'}); draw(); };
let drag = null, offset={x:0,y:0};
$('#roomCanvas').onmousedown = e => { const r=e.target.getBoundingClientRect(); const x=e.clientX-r.left, y=e.clientY-r.top; items.forEach(it=>{if(x>=it.x&&x<=it.x+it.w&&y>=it.y&&y<=it.y+it.h){drag=it; offset={x:x-it.x, y:y-it.y};}}); };
window.onmouseup = () => drag=null;
$('#roomCanvas').onmousemove = e => { if(!drag)return; const r=e.target.getBoundingClientRect(); drag.x=e.clientX-r.left-offset.x; drag.y=e.clientY-r.top-offset.y; draw(); };
draw();
})();