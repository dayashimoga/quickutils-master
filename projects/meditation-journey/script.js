/* script.js for meditation-journey */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    
    // Initialize common utilities
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    const ctx = $('#medCanvas').getContext('2d');
let t = 0;
function loop() {
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0,0,600,400);
    t += 0.02;
    let r = 50 + Math.sin(t)*30; // 20 to 80 radius
    if(Math.cos(t) > 0) $('#breathText').innerText = "Inhale...";
    else $('#breathText').innerText = "Exhale...";
    ctx.beginPath(); ctx.arc(300, 200, r, 0, Math.PI*2);
    ctx.fillStyle = `hsla(${(t*10)%360}, 100%, 70%, Math.abs(Math.sin(t)))`;
    ctx.shadowBlur = 20; ctx.shadowColor = ctx.fillStyle;
    ctx.fill(); ctx.shadowBlur = 0;
    requestAnimationFrame(loop);
} loop();
})();