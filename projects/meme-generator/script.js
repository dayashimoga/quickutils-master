/* meme-generator */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    const canvas=$('#memeCanvas'),ctx=canvas.getContext('2d');
    let bgColor='#333',bgImage=null;
    const colors=['#ef4444','#f59e0b','#22c55e','#3b82f6','#8b5cf6','#ec4899','#000','#333','#fff'];
    colors.forEach(c=>{const d=document.createElement('div');d.style.cssText='width:36px;height:36px;border-radius:6px;cursor:pointer;background:'+c+';border:2px solid rgba(255,255,255,0.2);';d.addEventListener('click',()=>{bgColor=c;bgImage=null;renderMeme();});$('#colorPicker').appendChild(d);});
    
    $('#uploadBg').addEventListener('click',()=>$('#bgUpload').click());
    $('#bgUpload').addEventListener('change',e=>{if(e.target.files[0]){const img=new Image();img.onload=()=>{bgImage=img;renderMeme();};img.src=URL.createObjectURL(e.target.files[0]);}});
    
    function renderMeme(){
        ctx.fillStyle=bgColor; ctx.fillRect(0,0,600,600);
        if(bgImage) ctx.drawImage(bgImage,0,0,600,600);
        const fs=parseInt($('#fontSize').value);
        ctx.font='bold '+fs+'px Impact,sans-serif'; ctx.textAlign='center'; ctx.lineWidth=3;
        const top=$('#topText').value.toUpperCase();
        const bot=$('#bottomText').value.toUpperCase();
        if(top){ctx.strokeStyle='#000';ctx.fillStyle='#fff';ctx.strokeText(top,300,fs+20);ctx.fillText(top,300,fs+20);}
        if(bot){ctx.strokeStyle='#000';ctx.fillStyle='#fff';ctx.strokeText(bot,300,580);ctx.fillText(bot,300,580);}
    }
    ['#topText','#bottomText','#fontSize'].forEach(s=>$(s).addEventListener('input',renderMeme));
    $('#downloadMeme').addEventListener('click',()=>{const a=document.createElement('a');a.download='meme.png';a.href=canvas.toDataURL();a.click();});
    renderMeme();

})();
