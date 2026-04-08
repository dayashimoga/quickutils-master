/* Mind Map - Full Implementation */
'use strict';
(function(){
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const canvas=$('#mapCanvas'),ctx=canvas.getContext('2d'),nodeLayer=$('#nodeLayer');
const COLORS=['#6366f1','#ec4899','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#14b8a6','#e11d48'];
let nodes=[],selectedId=null,dragId=null,dragOff={x:0,y:0};
let zoom=1,panX=0,panY=0,isPanning=false,panStart={x:0,y:0};
let idCounter=1;

function resize(){canvas.width=canvas.parentElement.clientWidth;canvas.height=canvas.parentElement.clientHeight;draw();}
window.addEventListener('resize',resize);

function createNode(text,x,y,parentId=null,color=null){
  const id=idCounter++;
  nodes.push({id,text,x,y,parentId,color:color||COLORS[id%COLORS.length],collapsed:false});
  renderNodes();draw();saveState();return id;
}

function getChildren(id){return nodes.filter(n=>n.parentId===id);}
function getDescendants(id){const ch=getChildren(id);let all=[...ch];ch.forEach(c=>all=all.concat(getDescendants(c.id)));return all;}

function renderNodes(){
  nodeLayer.innerHTML='';
  nodes.forEach(n=>{
    // Skip if parent is collapsed
    if(n.parentId){
      let p=nodes.find(x=>x.id===n.parentId);
      while(p){if(p.collapsed)return;p=p.parentId?nodes.find(x=>x.id===p.parentId):null;}
    }
    const div=document.createElement('div');
    div.className='mind-node'+(n.id===selectedId?' selected':'')+(n.parentId===null?' root':'');
    div.style.left=(n.x*zoom+panX)+'px';div.style.top=(n.y*zoom+panY)+'px';
    div.style.background=n.color;div.style.color='#fff';
    div.textContent=n.text;div.dataset.id=n.id;
    const children=getChildren(n.id);
    if(children.length>0){
      const exp=document.createElement('div');
      exp.className='node-expand';exp.textContent=n.collapsed?'+':'−';
      exp.addEventListener('click',e=>{e.stopPropagation();n.collapsed=!n.collapsed;renderNodes();draw();});
      div.appendChild(exp);
    }
    // Add child button
    const addBtn=document.createElement('div');
    addBtn.className='node-expand';addBtn.style.right='-8px';addBtn.style.top=children.length>0?'calc(50% + 14px)':'50%';
    if(children.length===0){addBtn.style.top='50%';}else{addBtn.style.bottom='-8px';addBtn.style.top='auto';addBtn.style.right='50%';addBtn.style.transform='translateX(50%)';}
    addBtn.textContent='+';addBtn.style.background='#10b981';
    addBtn.addEventListener('click',e=>{e.stopPropagation();
      const angle=Math.random()*Math.PI*0.5-Math.PI*0.25;
      createNode('New Idea',n.x+180*Math.cos(angle),n.y+100+Math.random()*50,n.id);
    });
    // Only show on hover via CSS already handled

    div.addEventListener('mousedown',e=>{
      if(e.target.classList.contains('node-expand'))return;
      e.stopPropagation();selectNode(n.id);
      dragId=n.id;dragOff={x:e.clientX-n.x*zoom-panX,y:e.clientY-n.y*zoom-panY};
    });
    div.addEventListener('dblclick',e=>{e.stopPropagation();editNode(n.id);});
    nodeLayer.appendChild(div);
  });
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  // Draw connections
  nodes.forEach(n=>{
    if(!n.parentId)return;
    const parent=nodes.find(x=>x.id===n.parentId);
    if(!parent)return;
    // Check if parent chain has collapsed
    let p=parent;let hidden=false;
    while(p){if(p.collapsed){hidden=true;break;}p=p.parentId?nodes.find(x=>x.id===p.parentId):null;}
    if(hidden)return;
    const x1=parent.x*zoom+panX+40,y1=parent.y*zoom+panY+16;
    const x2=n.x*zoom+panX+40,y2=n.y*zoom+panY+16;
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    const cpx=(x1+x2)/2,cpy1=y1,cpy2=y2;
    ctx.bezierCurveTo(cpx,cpy1,cpx,cpy2,x2,y2);
    ctx.strokeStyle=n.color+'80';ctx.lineWidth=2*zoom;ctx.stroke();
  });
  ctx.restore();
}

function selectNode(id){
  selectedId=id;renderNodes();
  const n=nodes.find(x=>x.id===id);
  if(n){
    $('#nodeText').value=n.text;
    renderColorPicker(n.color);
    $('#nodeEditor').style.display='block';
  }
}

function editNode(id){
  const n=nodes.find(x=>x.id===id);if(!n)return;
  const text=prompt('Edit node text:',n.text);
  if(text!==null){n.text=text;renderNodes();draw();saveState();}
}

function renderColorPicker(activeColor){
  $('#colorPicker').innerHTML=COLORS.map(c=>`<div class="color-swatch${c===activeColor?' active':''}" style="background:${c}" data-color="${c}"></div>`).join('');
  $$('.color-swatch').forEach(s=>s.addEventListener('click',()=>{
    $$('.color-swatch').forEach(x=>x.classList.remove('active'));
    s.classList.add('active');
  }));
}

$('#applyNodeBtn').addEventListener('click',()=>{
  if(selectedId===null)return;
  const n=nodes.find(x=>x.id===selectedId);if(!n)return;
  n.text=$('#nodeText').value||'Node';
  const activeSwatch=$('.color-swatch.active');
  if(activeSwatch)n.color=activeSwatch.dataset.color;
  renderNodes();draw();saveState();
});

// Canvas interactions
const container=$('#mapContainer');
container.addEventListener('mousedown',e=>{
  if(e.target===canvas){isPanning=true;panStart={x:e.clientX-panX,y:e.clientY-panY};canvas.style.cursor='grabbing';}
});

window.addEventListener('mousemove',e=>{
  if(dragId!==null){
    const n=nodes.find(x=>x.id===dragId);if(!n)return;
    n.x=(e.clientX-dragOff.x-panX)/zoom;n.y=(e.clientY-dragOff.y-panY)/zoom;
    renderNodes();draw();
  }
  if(isPanning){panX=e.clientX-panStart.x;panY=e.clientY-panStart.y;renderNodes();draw();}
});

window.addEventListener('mouseup',()=>{
  if(dragId!==null){saveState();}
  dragId=null;isPanning=false;canvas.style.cursor='default';
});

container.addEventListener('wheel',e=>{
  e.preventDefault();
  const delta=e.deltaY>0?0.9:1.1;
  zoom=Math.max(0.3,Math.min(3,zoom*delta));
  $('#zoomLevel').textContent=Math.round(zoom*100)+'%';
  renderNodes();draw();
});

container.addEventListener('dblclick',e=>{
  if(e.target===canvas){
    const x=(e.clientX-panX)/zoom,y=(e.clientY-panY)/zoom;
    createNode('New Idea',x-40,y-16);
  }
});

// Buttons
$('#addNodeBtn').addEventListener('click',()=>{
  const parentId=selectedId;
  const parent=parentId?nodes.find(n=>n.id===parentId):null;
  const x=parent?parent.x+180:canvas.width/2/zoom-40;
  const y=parent?parent.y+80:canvas.height/2/zoom-16;
  createNode('New Idea',x,y,parentId);
});

$('#deleteNodeBtn').addEventListener('click',()=>{
  if(selectedId===null)return;
  const desc=getDescendants(selectedId);
  const toRemove=new Set([selectedId,...desc.map(d=>d.id)]);
  nodes=nodes.filter(n=>!toRemove.has(n.id));
  selectedId=null;$('#nodeEditor').style.display='none';
  renderNodes();draw();saveState();
});

$('#zoomInBtn').addEventListener('click',()=>{zoom=Math.min(3,zoom*1.2);$('#zoomLevel').textContent=Math.round(zoom*100)+'%';renderNodes();draw();});
$('#zoomOutBtn').addEventListener('click',()=>{zoom=Math.max(0.3,zoom/1.2);$('#zoomLevel').textContent=Math.round(zoom*100)+'%';renderNodes();draw();});
$('#fitBtn').addEventListener('click',()=>{
  if(!nodes.length)return;
  const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const w=maxX-minX+200,h=maxY-minY+200;
  zoom=Math.min(canvas.width/w,canvas.height/h,2);
  panX=canvas.width/2-((minX+maxX)/2)*zoom;panY=canvas.height/2-((minY+maxY)/2)*zoom;
  $('#zoomLevel').textContent=Math.round(zoom*100)+'%';renderNodes();draw();
});

$('#clearBtn').addEventListener('click',()=>{
  if(!confirm('Clear all nodes?'))return;
  nodes=[];selectedId=null;$('#nodeEditor').style.display='none';renderNodes();draw();saveState();
});

// Export
$('#exportPngBtn').addEventListener('click',()=>{
  const tmpCanvas=document.createElement('canvas');tmpCanvas.width=canvas.width;tmpCanvas.height=canvas.height;
  const tmpCtx=tmpCanvas.getContext('2d');
  tmpCtx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--bg-base')||'#111';
  tmpCtx.fillRect(0,0,tmpCanvas.width,tmpCanvas.height);
  tmpCtx.drawImage(canvas,0,0);
  // Draw node text on canvas
  nodes.forEach(n=>{
    const x=n.x*zoom+panX,y=n.y*zoom+panY;
    tmpCtx.fillStyle=n.color;tmpCtx.beginPath();
    tmpCtx.roundRect(x,y,Math.max(80,n.text.length*9),32,12);tmpCtx.fill();
    tmpCtx.fillStyle='#fff';tmpCtx.font='bold 13px sans-serif';tmpCtx.textAlign='center';
    tmpCtx.fillText(n.text,x+Math.max(40,n.text.length*4.5),y+20);
  });
  const a=document.createElement('a');a.href=tmpCanvas.toDataURL('image/png');a.download='mindmap.png';a.click();
});

$('#exportJsonBtn').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify({nodes,zoom,panX,panY},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mindmap.json';a.click();
});

$('#importJsonBtn').addEventListener('click',()=>$('#importFile').click());
$('#importFile').addEventListener('change',e=>{
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    try{const d=JSON.parse(ev.target.result);nodes=d.nodes||[];
      idCounter=Math.max(...nodes.map(n=>n.id),0)+1;
      if(d.zoom)zoom=d.zoom;if(d.panX!=null)panX=d.panX;if(d.panY!=null)panY=d.panY;
      renderNodes();draw();saveState();
      if(typeof QU!=='undefined')QU.showToast('Mind map imported!','success');
    }catch{if(typeof QU!=='undefined')QU.showToast('Invalid JSON file','error');}
  };reader.readAsText(file);
});

// Keyboard
document.addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
  if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();$('#deleteNodeBtn').click();}
  if(e.key==='Tab'){e.preventDefault();$('#addNodeBtn').click();}
  if(e.key==='Escape'){selectedId=null;$('#nodeEditor').style.display='none';renderNodes();}
});

function saveState(){localStorage.setItem('qu_mindmap_v1',JSON.stringify({nodes,idCounter}));}
function loadState(){
  try{const d=JSON.parse(localStorage.getItem('qu_mindmap_v1'));
    if(d&&d.nodes){nodes=d.nodes;idCounter=d.idCounter||1;return true;}
  }catch{}return false;
}

// Init
resize();
if(!loadState()){
  const rootId=createNode('Central Idea',canvas.width/2/zoom-60,canvas.height/2/zoom-16);
  createNode('Branch 1',canvas.width/2/zoom+100,canvas.height/2/zoom-80,rootId);
  createNode('Branch 2',canvas.width/2/zoom+100,canvas.height/2/zoom+50,rootId);
  createNode('Branch 3',canvas.width/2/zoom-220,canvas.height/2/zoom-80,rootId);
}
renderNodes();draw();
if(typeof QU!=='undefined')QU.init({kofi:true,discover:true});
})();
