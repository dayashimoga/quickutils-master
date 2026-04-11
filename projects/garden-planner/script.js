/* garden-planner */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    const PLANTS=[
        {name:'🍅 Tomato',color:'#e74c3c',spacing:24,sun:'Full',water:'Regular',season:'Summer'},
        {name:'🥕 Carrot',color:'#e67e22',spacing:8,sun:'Full',water:'Light',season:'Spring'},
        {name:'🌻 Sunflower',color:'#f1c40f',spacing:30,sun:'Full',water:'Moderate',season:'Summer'},
        {name:'🥬 Lettuce',color:'#27ae60',spacing:12,sun:'Partial',water:'Regular',season:'Spring'},
        {name:'🫑 Pepper',color:'#2ecc71',spacing:18,sun:'Full',water:'Moderate',season:'Summer'},
        {name:'🌹 Rose',color:'#c0392b',spacing:36,sun:'Full',water:'Regular',season:'Spring'},
        {name:'🌿 Basil',color:'#16a085',spacing:10,sun:'Full',water:'Regular',season:'Summer'},
        {name:'🥒 Cucumber',color:'#1abc9c',spacing:36,sun:'Full',water:'Heavy',season:'Summer'},
    ];
    let selectedPlant=0, placed=[];
    const canvas=$('#gardenCanvas'),ctx=canvas.getContext('2d');
    
    PLANTS.forEach((p,i)=>{const b=document.createElement('button');b.className='btn btn-sm '+(i===0?'btn-primary':'btn-secondary');b.textContent=p.name;b.addEventListener('click',()=>{selectedPlant=i;$$('#plantPalette button').forEach((x,j)=>{x.className='btn btn-sm '+(j===i?'btn-primary':'btn-secondary');});});$('#plantPalette').appendChild(b);});

    function drawGarden(){
        ctx.fillStyle='#3d2a12'; ctx.fillRect(0,0,600,400);
        // Grid
        ctx.strokeStyle='rgba(255,255,255,0.1)'; for(let x=0;x<600;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,400);ctx.stroke();} for(let y=0;y<400;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(600,y);ctx.stroke();}
        placed.forEach(p=>{ctx.fillStyle=PLANTS[p.type].color;ctx.beginPath();ctx.arc(p.x,p.y,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText(PLANTS[p.type].name.substring(0,2),p.x,p.y+5);});
    }
    canvas.addEventListener('click',e=>{const r=canvas.getBoundingClientRect();const x=(e.clientX-r.left)*(600/r.width);const y=(e.clientY-r.top)*(400/r.height);placed.push({x,y,type:selectedPlant});drawGarden();});
    $('#clearGarden').addEventListener('click',()=>{placed=[];drawGarden();});
    
    $('#plantGuide').innerHTML=PLANTS.map(p=>'<div style="display:flex;justify-content:space-between;padding:8px;margin:2px 0;background:rgba(255,255,255,0.04);border-radius:6px;"><span>'+p.name+'</span><span class="text-muted">'+p.spacing+'in spacing • '+p.sun+' sun • '+p.season+'</span></div>').join('');
    drawGarden();

})();
