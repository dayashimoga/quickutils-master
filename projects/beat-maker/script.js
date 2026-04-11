/* beat-maker */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    const grid=$('#grid');
    const ROWS=['Kick','Snare','HiHat','Clap'];
    let active=Array(4).fill().map(()=>Array(16).fill(false)),isPlaying=false,pos=0,audioCtx,interval;
    const rowColors=['#ef4444','#3b82f6','#22c55e','#f59e0b'];
    
    // Build grid
    ROWS.forEach((name,r)=>{
        const label=document.createElement('div');label.textContent=name;label.style.cssText='display:flex;align-items:center;font-weight:700;font-size:0.8rem;color:#aaa;';
        grid.appendChild(label);
        for(let c=0;c<16;c++){
            const b=document.createElement('div');
            b.style.cssText='height:40px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:4px;cursor:pointer;transition:all 0.15s;';
            b.dataset.r=r;b.dataset.c=c;
            b.addEventListener('click',()=>{active[r][c]=!active[r][c];b.style.background=active[r][c]?rowColors[r]:'rgba(255,255,255,0.06)';});
            grid.appendChild(b);
        }
    });

    function playNote(freq,type='sine',dur=0.1){
        if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();
        const o=audioCtx.createOscillator(),g=audioCtx.createGain();
        o.type=type;o.frequency.value=freq;g.gain.value=0.3;
        o.connect(g);g.connect(audioCtx.destination);
        o.start();g.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+dur);
        o.stop(audioCtx.currentTime+dur);
    }
    const sounds=[(f)=>playNote(60,'sine',0.15),(f)=>playNote(200,'triangle',0.1),(f)=>playNote(800,'square',0.05),(f)=>playNote(400,'sawtooth',0.08)];

    $('#bpmSlider').addEventListener('input',e=>{$('#bpmVal').textContent=e.target.value+' BPM';if(isPlaying){clearInterval(interval);interval=setInterval(step,60000/parseInt(e.target.value)/4);}});
    
    function step(){
        const cells=grid.querySelectorAll('div[data-c]');
        cells.forEach(c=>{if(c.style.borderColor==='#fff')c.style.borderColor='rgba(255,255,255,0.1)';});
        for(let r=0;r<4;r++){
            const cell=grid.querySelector('[data-r="'+r+'"][data-c="'+pos+'"]');
            if(cell)cell.style.borderColor='#fff';
            if(active[r][pos])sounds[r]();
        }
        pos=(pos+1)%16;
    }

    $('#playBtn').addEventListener('click',()=>{
        if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();
        if(isPlaying){clearInterval(interval);isPlaying=false;$('#playBtn').textContent='▶ Play';pos=0;return;}
        isPlaying=true;$('#playBtn').textContent='⏹ Stop';
        interval=setInterval(step,60000/parseInt($('#bpmSlider').value)/4);
    });

})();
