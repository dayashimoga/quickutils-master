/* travel-builder */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    let activities=JSON.parse(localStorage.getItem('qu_travel_acts')||'[]');
    let expenses=JSON.parse(localStorage.getItem('qu_travel_exp')||'[]');
    let packing=JSON.parse(localStorage.getItem('qu_travel_pack')||'["Passport","Phone charger","Clothes","Toiletries","Medications"]');
    function save(){localStorage.setItem('qu_travel_acts',JSON.stringify(activities));localStorage.setItem('qu_travel_exp',JSON.stringify(expenses));localStorage.setItem('qu_travel_pack',JSON.stringify(packing));}
    function renderAll(){
        $('#itinerary').innerHTML=activities.map((a,i)=>'<div style="display:flex;justify-content:space-between;padding:8px;margin:2px 0;background:rgba(255,255,255,0.04);border-radius:6px;border-left:3px solid #6366f1;"><span>Day '+(i+1)+': '+a+'</span><button onclick="QU_T.rmA('+i+')" style="background:none;border:none;color:#ef4444;cursor:pointer;">✕</button></div>').join('')||'<p class="text-muted">No activities yet</p>';
        let total=0; $('#expenses').innerHTML=expenses.map((e,i)=>{total+=e.amt;return '<div style="display:flex;justify-content:space-between;padding:8px;margin:2px 0;background:rgba(255,255,255,0.04);border-radius:6px;"><span>'+e.name+'</span><span>$'+e.amt.toFixed(2)+' <button onclick="QU_T.rmE('+i+')" style="background:none;border:none;color:#ef4444;cursor:pointer;">✕</button></span></div>';}).join('');
        $('#totalBudget').textContent=total.toFixed(2);
        $('#packList').innerHTML=packing.map((p,i)=>'<label style="display:block;padding:6px;cursor:pointer;"><input type="checkbox" style="margin-right:8px;">'+p+' <button onclick="QU_T.rmP('+i+')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:0.8rem;">✕</button></label>').join('');
    }
    window.QU_T={rmA:i=>{activities.splice(i,1);save();renderAll();},rmE:i=>{expenses.splice(i,1);save();renderAll();},rmP:i=>{packing.splice(i,1);save();renderAll();}};
    $('#addAct').addEventListener('click',()=>{const v=$('#actInput').value.trim();if(v){activities.push(v);$('#actInput').value='';save();renderAll();}});
    $('#addExp').addEventListener('click',()=>{const n=$('#expName').value.trim(),a=parseFloat($('#expAmt').value);if(n&&a){expenses.push({name:n,amt:a});$('#expName').value='';$('#expAmt').value='';save();renderAll();}});
    $('#addPack').addEventListener('click',()=>{const v=$('#packItem').value.trim();if(v){packing.push(v);$('#packItem').value='';save();renderAll();}});
    renderAll();

})();
