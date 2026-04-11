/* screen-recorder */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    let stream=null, recorder=null, chunks=[];
    $('#recScreen').addEventListener('click', async()=>{
        try{ stream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:true}); $('#preview').srcObject=stream; $('#startBtn').disabled=false; $('#status').textContent='Source ready — click Record'; }catch(e){ $('#status').textContent='Permission denied'; }
    });
    $('#recCamera').addEventListener('click', async()=>{
        try{ stream=await navigator.mediaDevices.getUserMedia({video:true,audio:true}); $('#preview').srcObject=stream; $('#startBtn').disabled=false; $('#status').textContent='Camera ready — click Record'; }catch(e){ $('#status').textContent='Camera access denied'; }
    });
    $('#startBtn').addEventListener('click', ()=>{
        if(!stream) return;
        chunks=[]; recorder=new MediaRecorder(stream,{mimeType:'video/webm'});
        recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
        recorder.onstop=()=>{const blob=new Blob(chunks,{type:'video/webm'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='recording_'+Date.now()+'.webm'; $('#downloads').innerHTML='<a href="'+url+'" download="recording.webm" class="btn btn-primary">⬇️ Download Recording</a>'; $('#status').textContent='Recording saved!';};
        recorder.start(); $('#startBtn').disabled=true; $('#stopBtn').disabled=false; $('#status').textContent='🔴 Recording...'; $('#status').style.color='#ef4444';
    });
    $('#stopBtn').addEventListener('click', ()=>{ if(recorder&&recorder.state!=='inactive'){recorder.stop(); $('#stopBtn').disabled=true; $('#status').style.color='';} });

})();
