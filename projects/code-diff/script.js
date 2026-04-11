/* code-diff */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    $('#diffBtn').addEventListener('click',()=>{
        const a=$('#textA').value.split('\n'), b=$('#textB').value.split('\n');
        const maxLen=Math.max(a.length,b.length);
        let html='';
        for(let i=0;i<maxLen;i++){
            const la=a[i]||'', lb=b[i]||'';
            if(la===lb) html+='<div style="padding:2px 8px;background:rgba(255,255,255,0.02);"><span style="color:#888;margin-right:8px;">'+(i+1)+'</span>'+escHtml(la)+'</div>';
            else{
                if(la) html+='<div style="padding:2px 8px;background:rgba(239,68,68,0.15);color:#fca5a5;"><span style="color:#888;margin-right:8px;">'+(i+1)+'</span>- '+escHtml(la)+'</div>';
                if(lb) html+='<div style="padding:2px 8px;background:rgba(34,197,94,0.15);color:#86efac;"><span style="color:#888;margin-right:8px;">'+(i+1)+'</span>+ '+escHtml(lb)+'</div>';
            }
        }
        $('#diffOutput').innerHTML=html||'<p class="text-muted">No differences found</p>';
    });
    function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

})();
