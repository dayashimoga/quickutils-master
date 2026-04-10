/* script.js for beat-maker */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    
    // Initialize common utilities
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    const grid = $('#grid');
let active = Array(4).fill().map(()=>Array(16).fill(false)), isPlaying = false, pos=0, ctx, int;
for(let r=0;r<4;r++) {
    for(let c=0;c<16;c++){
        let b = document.createElement('div');
        b.style.background = '#222'; b.style.border = '1px solid #444'; b.style.cursor='pointer';
        b.onclick = () => { active[r][c]=!active[r][c]; b.style.background=active[r][c]?'#39d353':'#222'; };
        grid.appendChild(b);
    }
}
$('#playBtn').onclick = () => {
    if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if(isPlaying) { clearInterval(int); isPlaying=false; $('#playBtn').innerText='Play'; return; }
    isPlaying = true; $('#playBtn').innerText='Stop';
    int = setInterval(() => {
        Array.from(grid.children).forEach(e=>e.style.borderColor='#444');
        for(let r=0;r<4;r++) { grid.children[r*16+pos].style.borderColor='#fff';
            if(active[r][pos]) { let o=ctx.createOscillator(); o.frequency.value=[200,300,400,500][r]; o.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+0.1); }
        }
        pos = (pos+1)%16;
    }, 200);
};
})();