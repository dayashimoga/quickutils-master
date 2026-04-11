/* music-visualizer */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    const canvas=$('#vizCanvas'),ctx=canvas.getContext('2d');
    let audioCtx,analyser,source,dataArray,mode='bars';
    function initAudio(stream){
        audioCtx=new(window.AudioContext||window.webkitAudioContext)();
        analyser=audioCtx.createAnalyser();analyser.fftSize=512;
        if(stream instanceof MediaStream){source=audioCtx.createMediaStreamSource(stream);}
        else{source=audioCtx.createMediaElementSource(stream);source.connect(audioCtx.destination);}
        source.connect(analyser);
        dataArray=new Uint8Array(analyser.frequencyBinCount);
        draw();
    }
    $('#micBtn').addEventListener('click',async()=>{try{const s=await navigator.mediaDevices.getUserMedia({audio:true});initAudio(s);}catch(e){alert('Mic access denied');}});
    $('#fileBtn').addEventListener('click',()=>$('#audioFile').click());
    $('#audioFile').addEventListener('change',e=>{if(e.target.files[0]){const url=URL.createObjectURL(e.target.files[0]);$('#audioPlayer').src=url;$('#audioPlayer').style.display='block';$('#audioPlayer').play();if(!audioCtx)initAudio($('#audioPlayer'));}});
    $('#vizMode').addEventListener('change',e=>mode=e.target.value);
    function draw(){
        if(!analyser)return requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        const w=canvas.width=canvas.parentElement.clientWidth,h=400;ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(0,0,w,h);
        const len=dataArray.length;
        if(mode==='bars'){const bw=w/len*2.5;for(let i=0;i<len;i++){const v=dataArray[i]/255;ctx.fillStyle='hsl('+(i/len*360)+',80%,60%)';ctx.fillRect(i*bw,h-v*h,bw-1,v*h);}}
        else if(mode==='wave'){analyser.getByteTimeDomainData(dataArray);ctx.strokeStyle='#6366f1';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<len;i++){const v=dataArray[i]/128;const y=v*h/2;if(i===0)ctx.moveTo(0,y);else ctx.lineTo(i/len*w,y);}ctx.stroke();}
        else if(mode==='circle'){const cx=w/2,cy=h/2;for(let i=0;i<len;i++){const v=dataArray[i]/255;const a=(i/len)*Math.PI*2;const r=80+v*120;ctx.fillStyle='hsla('+(i/len*360)+',80%,60%,0.8)';ctx.beginPath();ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,2+v*4,0,Math.PI*2);ctx.fill();}}
        requestAnimationFrame(draw);
    }
    draw();

})();
