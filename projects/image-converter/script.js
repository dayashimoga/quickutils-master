/* Image Converter - Full Implementation */
'use strict';
(function(){
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const PRESETS={passport:{w:413,h:531,label:'Passport 35×45mm'},stamp:{w:295,h:354,label:'Stamp 25×30mm'},postcard:{w:1200,h:1800,label:'Postcard 4×6"'},a4:{w:2480,h:3508,label:'A4 210×297mm'},a3:{w:3508,h:4961,label:'A3 297×420mm'},hd:{w:1920,h:1080,label:'HD 1920×1080'},'4k':{w:3840,h:2160,label:'4K'},square:{w:1080,h:1080,label:'Square'},icon:{w:512,h:512,label:'Icon'},favicon:{w:32,h:32,label:'Favicon'}};
const TILE_PRESETS={passport:{rows:4,cols:2,pw:2480,ph:3508,tw:413,th:531},stamp:{rows:5,cols:4,pw:2480,ph:3508,tw:295,th:354},postcard:{rows:1,cols:1,pw:1200,ph:1800,tw:1200,th:1800},a4grid:{rows:4,cols:2,pw:2480,ph:3508},a3grid:{rows:5,cols:3,pw:3508,ph:4961}};

let origImg=null,currentImg=null,rotation=0,flipH=false,flipV=false,images=[];
let cropMode=false,cropStart=null,cropRect=null;
let filters = { bright: 100, cont: 100, sat: 100, hue: 0, invert: false, sepia: false, gray: false };
let undoStack = null;

const dropZone=$('#dropZone'),fileInput=$('#fileInput'),editor=$('#editor');
const canvas=$('#previewCanvas'),ctx=canvas.getContext('2d', { willReadFrequently: true });
const wrapper=$('#canvasWrapper');

// Drop zone
dropZone.addEventListener('click',()=>fileInput.click());
dropZone.addEventListener('dragover',e=>{e.preventDefault();dropZone.classList.add('dragover');});
dropZone.addEventListener('dragleave',()=>dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop',e=>{e.preventDefault();dropZone.classList.remove('dragover');handleFiles(e.dataTransfer.files);});
fileInput.addEventListener('change',e=>handleFiles(e.target.files));

function handleFiles(files){
  if(!files.length)return;
  images=[];
  Array.from(files).forEach(f=>{
    const reader=new FileReader();
    reader.onload=ev=>{
      const img=new Image();
      img.onload=()=>{images.push({img,name:f.name,size:f.size});if(images.length===1)loadImage(img,f);if(images.length>1)$('#downloadAllBtn').style.display='inline-flex';};
      img.src=ev.target.result;
    };
    reader.readAsDataURL(f);
  });
}

function loadImage(img,file){
  origImg=img;currentImg=img;rotation=0;flipH=false;flipV=false;cropMode=false;
  filters = { bright: 100, cont: 100, sat: 100, hue: 0, invert: false, sepia: false, gray: false };
  if(typeof QU !== 'undefined' && QU.UndoStack) undoStack = new QU.UndoStack(20);
  
  $('#widthInput').value=img.naturalWidth;$('#heightInput').value=img.naturalHeight;
  dropZone.style.display='none';editor.style.display='flex';
  
  pushState(); // Save initial state
  render();
  updateInfo(file);
}

function updateInfo(file) {
  const kb=(file?.size||0)/1024;
  let text = `${origImg.naturalWidth}×${origImg.naturalHeight}`;
  if(currentImg !== origImg && currentImg) text += ` → ${currentImg.naturalWidth}×${currentImg.naturalHeight}`;
  if(kb > 0) text += ` • ${kb>1024?(kb/1024).toFixed(1)+'MB':Math.round(kb)+'KB'} • ${file?.name||'merged.png'}`;
  $('#imageInfo').textContent = text;
}

function render(){
  let w=parseInt($('#widthInput').value)||origImg.naturalWidth;
  let h=parseInt($('#heightInput').value)||origImg.naturalHeight;
  // Apply rotation swap
  const swap=rotation%180!==0;
  canvas.width=swap?h:w;canvas.height=swap?w:h;
  
  // Apply CSS filters directly to context if possible
  const fstr = `brightness(${filters.bright/100}) contrast(${filters.cont/100}) saturate(${filters.sat/100}) hue-rotate(${filters.hue}deg) ${filters.invert?'invert(1)':''} ${filters.sepia?'sepia(1)':''} ${filters.gray?'grayscale(1)':''}`;
  ctx.filter = fstr;

  ctx.save();
  ctx.translate(canvas.width/2,canvas.height/2);
  ctx.rotate(rotation*Math.PI/180);
  if(flipH)ctx.scale(-1,1);if(flipV)ctx.scale(1,-1);
  ctx.drawImage(currentImg,-w/2,-h/2,w,h);
  ctx.restore();
  ctx.filter = 'none'; // reset
}

// State Management
function pushState() {
    if(!undoStack) return;
    const w=parseInt($('#widthInput').value), h=parseInt($('#heightInput').value);
    undoStack.push({
        dataUrl: currentImg.src,
        w, h, rotation, flipH, flipV, filters: {...filters}
    });
}

function restoreState(state) {
    if(!state) return;
    const img = new Image();
    img.onload = () => {
        currentImg = img;
        $('#widthInput').value = state.w;
        $('#heightInput').value = state.h;
        rotation = state.rotation; flipH = state.flipH; flipV = state.flipV;
        filters = {...state.filters};
        render();
        updateInfo();
    };
    img.src = state.dataUrl;
}

$('#undoBtn')?.addEventListener('click', () => { if(undoStack && undoStack.canUndo()) restoreState(undoStack.undo()); });
$('#redoBtn')?.addEventListener('click', () => { if(undoStack && undoStack.canRedo()) restoreState(undoStack.redo()); });

// Filters UI
$('#toggleFiltersBtn')?.addEventListener('click', () => $('#filtersPanel').classList.toggle('hidden'));
['fBright', 'fCont', 'fSat', 'fHue'].forEach(id => {
    $(`#${id}`)?.addEventListener('input', () => { filters[id.replace('f','').toLowerCase()] = $(`#${id}`).value; render(); pushState(); });
});
$('#btnSepia')?.addEventListener('click', () => { filters.sepia = !filters.sepia; render(); pushState(); });
$('#btnGray')?.addEventListener('click', () => { filters.gray = !filters.gray; render(); pushState(); });
$('#btnInvert')?.addEventListener('click', () => { filters.invert = !filters.invert; render(); pushState(); });

// Watermark
let wmCanvas = document.createElement('canvas');
$('#toggleWmBtn')?.addEventListener('click', () => $('#wmPanel').classList.toggle('hidden'));
$('#applyWmBtn')?.addEventListener('click', () => {
   const text = $('#wmText').value;
   if(!text) return;
   const color = $('#wmColor').value;
   const op = parseInt($('#wmOpacity').value)/100;
   const size = parseInt($('#wmSize').value);
   
   ctx.save();
   ctx.globalAlpha = op;
   ctx.fillStyle = color;
   ctx.font = `bold ${size}px Inter, sans-serif`;
   const metrics = ctx.measureText(text);
   ctx.fillText(text, canvas.width - metrics.width - 20, canvas.height - 20);
   ctx.restore();
   
   // Base64 out to new image
   const img = new Image();
   img.onload = () => { currentImg = img; rotation = 0; flipH = false; flipV = false; render(); pushState(); };
   img.src = canvas.toDataURL();
});

// Compare Feature
let compareActive = false;
$('#compareBtn')?.addEventListener('click', () => {
    const overlay = $('#compareOverlay');
    compareActive = !compareActive;
    if(compareActive) {
        overlay.classList.remove('hidden');
        const cCanvas = $('#compareCanvas');
        cCanvas.width = canvas.width;
        cCanvas.height = canvas.height;
        const cCtx = cCanvas.getContext('2d');
        // draw original
        cCtx.drawImage(origImg, 0, 0, cCanvas.width, cCanvas.height);
        
        // initialize slider
        $('#compareSlider').style.left = '50%';
        updateCompareClip(50);
    } else {
        overlay.classList.add('hidden');
    }
});

function updateCompareClip(pct) {
    const w = canvas.width;
    $('#compareCanvas').style.clipPath = `polygon(0 0, ${pct}% 0, ${pct}% 100%, 0 100%)`;
}

// Compare slider drag
let cDrag = false;
$('#compareSlider')?.addEventListener('mousedown', () => cDrag = true);
window.addEventListener('mouseup', () => cDrag = false);
window.addEventListener('mousemove', e => {
    if(!cDrag) return;
    const rect = $('#canvasWrapper').getBoundingClientRect();
    let pct = ((e.clientX - rect.left) / rect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    $('#compareSlider').style.left = `${pct}%`;
    updateCompareClip(pct);
});

// Resize with aspect ratio lock
const widthInput=$('#widthInput'),heightInput=$('#heightInput'),lockRatio=$('#lockRatio');
let aspectRatio=1;
widthInput.addEventListener('input',()=>{
  if(lockRatio.checked&&origImg){
    aspectRatio=origImg.naturalWidth/origImg.naturalHeight;
    heightInput.value=Math.round(parseInt(widthInput.value)/aspectRatio);
  }
  render();
});
heightInput.addEventListener('input',()=>{
  if(lockRatio.checked&&origImg){
    aspectRatio=origImg.naturalWidth/origImg.naturalHeight;
    widthInput.value=Math.round(parseInt(heightInput.value)*aspectRatio);
  }
  render();
});

// Quality slider
$('#qualitySlider').addEventListener('input',e=>$('#qualityVal').textContent=e.target.value+'%');

// Rotation
$('#rotateLeftBtn').addEventListener('click',()=>{rotation=(rotation-90+360)%360;render(); pushState(); });
$('#rotateRightBtn').addEventListener('click',()=>{rotation=(rotation+90)%360;render(); pushState(); });
$('#flipHBtn').addEventListener('click',()=>{flipH=!flipH;render(); pushState(); });
$('#flipVBtn').addEventListener('click',()=>{flipV=!flipV;render(); pushState(); });

// Presets
$('#presetSelect')?.addEventListener('change',e=>{
  const p=PRESETS[e.target.value];
  if(!p) {
      if(e.target.value === 'story') { widthInput.value=1080; heightInput.value=1920; }
  } else {
      widthInput.value=p.w;heightInput.value=p.h;
  }
  lockRatio.checked=false;render(); pushState(); e.target.value='';
});

// Crop
$('#cropBtn').addEventListener('click',()=>{
  cropMode=!cropMode;
  const overlay=$('#cropOverlay');
  overlay.style.display=cropMode?'block':'none';
  if(!cropMode&&cropRect){applyCrop();}
});

const cropOverlay=$('#cropOverlay');
cropOverlay.addEventListener('mousedown',e=>{
  const rect=cropOverlay.getBoundingClientRect();
  cropStart={x:e.clientX-rect.left,y:e.clientY-rect.top};
  const box=$('#cropBox');box.style.left=cropStart.x+'px';box.style.top=cropStart.y+'px';box.style.width='0';box.style.height='0';
});
cropOverlay.addEventListener('mousemove',e=>{
  if(!cropStart)return;
  const rect=cropOverlay.getBoundingClientRect();
  const x=e.clientX-rect.left,y=e.clientY-rect.top;
  const box=$('#cropBox');
  box.style.left=Math.min(cropStart.x,x)+'px';box.style.top=Math.min(cropStart.y,y)+'px';
  box.style.width=Math.abs(x-cropStart.x)+'px';box.style.height=Math.abs(y-cropStart.y)+'px';
});
cropOverlay.addEventListener('mouseup',e=>{
  if(!cropStart)return;
  const rect=cropOverlay.getBoundingClientRect();
  const x=e.clientX-rect.left,y=e.clientY-rect.top;
  const scaleX=canvas.width/rect.width,scaleY=canvas.height/rect.height;
  cropRect={x:Math.min(cropStart.x,x)*scaleX,y:Math.min(cropStart.y,y)*scaleY,w:Math.abs(x-cropStart.x)*scaleX,h:Math.abs(y-cropStart.y)*scaleY};
  cropStart=null;
});

function applyCrop(){
  if(!cropRect||cropRect.w<5||cropRect.h<5)return;
  const tmpCanvas=document.createElement('canvas');
  tmpCanvas.width=cropRect.w;tmpCanvas.height=cropRect.h;
  const tmpCtx=tmpCanvas.getContext('2d');
  // Draw current canvas state into crop to preserve filters
  tmpCtx.drawImage(canvas,cropRect.x,cropRect.y,cropRect.w,cropRect.h,0,0,cropRect.w,cropRect.h);
  
  const img=new Image();
  img.onload=()=>{
      currentImg=img;
      widthInput.value=Math.round(cropRect.w);
      heightInput.value=Math.round(cropRect.h);
      rotation=0;flipH=false;flipV=false;
      // Filters are baked in, reset them
      filters = { bright: 100, cont: 100, sat: 100, hue: 0, invert: false, sepia: false, gray: false };
      $('#fBright').value=100; $('#fCont').value=100; $('#fSat').value=100; $('#fHue').value=0;
      
      render();
      pushState();
  };
  img.src=tmpCanvas.toDataURL();
  cropRect=null;$('#cropOverlay').style.display='none';cropMode=false;
}

// Reset
$('#resetBtn').addEventListener('click',()=>{
  if(!origImg)return;currentImg=origImg;rotation=0;flipH=false;flipV=false;
  widthInput.value=origImg.naturalWidth;heightInput.value=origImg.naturalHeight;
  lockRatio.checked=true;render();
});

// Download
$('#downloadBtn').addEventListener('click',()=>{
  const fmt=$('#formatSelect').value;
  const quality=parseInt($('#qualitySlider').value)/100;
  const dataUrl=canvas.toDataURL(`image/${fmt}`,quality);
  const a=document.createElement('a');a.download=`converted.${fmt==='jpeg'?'jpg':fmt}`;a.href=dataUrl;a.click();
});

// Batch download
$('#downloadAllBtn').addEventListener('click',()=>{
  const fmt=$('#formatSelect').value;
  const quality=parseInt($('#qualitySlider').value)/100;
  const w=parseInt(widthInput.value),h=parseInt(heightInput.value);
  images.forEach((item,i)=>{
    const tmpC=document.createElement('canvas');tmpC.width=w;tmpC.height=h;
    const tmpCtx=tmpC.getContext('2d');tmpCtx.drawImage(item.img,0,0,w,h);
    const a=document.createElement('a');a.download=`batch_${i+1}.${fmt==='jpeg'?'jpg':fmt}`;a.href=tmpC.toDataURL(`image/${fmt}`,quality);a.click();
  });
});

// Photo Tiles
$('#tilesBtn').addEventListener('click',()=>{if(!origImg){alert('Load an image first');return;}$('#tilesModal').classList.add('active');});
$('#closeTiles').addEventListener('click',()=>$('#tilesModal').classList.remove('active'));

$('#tilePresetSelect')?.addEventListener('change', e => {
     const v = e.target.value;
     if(!v) return;
     if(v === 'passport-a4') { $('#tileLayout').value='a4grid'; $('#tileImgSize').value='passport'; $('#tileRows').value=4; $('#tileCols').value=2; $('#tileSpacing').value=20; }
     if(v === 'passport-a3') { $('#tileLayout').value='a3grid'; $('#tileImgSize').value='passport'; $('#tileRows').value=6; $('#tileCols').value=3; $('#tileSpacing').value=20; }
     if(v === 'stamp-a4') { $('#tileLayout').value='a4grid'; $('#tileImgSize').value='stamp'; $('#tileRows').value=6; $('#tileCols').value=6; $('#tileSpacing').value=15; }
     if(v === 'collage-4') { $('#tileLayout').value='square'; $('#tileImgSize').value='auto'; $('#tileRows').value=2; $('#tileCols').value=2; $('#tileSpacing').value=10; }
});

$('#tileLayout').addEventListener('change',e=>{
  const p=TILE_PRESETS[e.target.value];if(!p)return;
  if(p.rows)$('#tileRows').value=p.rows;if(p.cols)$('#tileCols').value=p.cols;
});

$('#generateTiles').addEventListener('click',()=>{
  if(!origImg)return;
  const rows=parseInt($('#tileRows').value),cols=parseInt($('#tileCols').value);
  const spacing=parseInt($('#tileSpacing').value);
  const layout=$('#tileLayout').value;
  const imgSize = $('#tileImgSize').value;
  
  const preset=TILE_PRESETS[layout] || {pw:2480, ph:3508};
  if(layout === 'square') { preset.pw = 2000; preset.ph = 2000; }
  
  const pw=preset.pw,ph=preset.ph;
  
  let tw, th;
  if (imgSize === 'passport') { tw=413; th=531; }
  else if (imgSize === 'stamp') { tw=295; th=354; }
  else {
      // Auto fill
      tw = Math.floor((pw-spacing*(cols+1))/cols);
      th = Math.floor((ph-spacing*(rows+1))/rows);
  }

  const tc=$('#tilesCanvas');tc.width=pw;tc.height=ph;
  const tctx=tc.getContext('2d');tctx.fillStyle='#ffffff';tctx.fillRect(0,0,pw,ph);
  
  // Use currently edited canvas (rendered output) rather than origImg
  const srcCanvas = canvas; 
  
  // Center grid
  const gridW = cols * tw + (cols-1) * spacing;
  const gridH = rows * th + (rows-1) * spacing;
  const startX = Math.max(spacing, (pw - gridW) / 2);
  const startY = Math.max(spacing, (ph - gridH) / 2);

  // Draw cutting guides for passport/stamp
  if(imgSize !== 'auto') {
      tctx.strokeStyle='#ddd';tctx.setLineDash([5,5]);
  }
  
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const x=startX+(tw+spacing)*c,y=startY+(th+spacing)*r;
      if(imgSize !== 'auto') tctx.strokeRect(x,y,tw,th);
      
      // Fitting image
      const imgRatio=srcCanvas.width/srcCanvas.height;
      const tileRatio=tw/th;
      let sx=0,sy=0,sw=srcCanvas.width,sh=srcCanvas.height;
      if(imgRatio>tileRatio){sw=srcCanvas.height*tileRatio;sx=(srcCanvas.width-sw)/2;}
      else{sh=srcCanvas.width/tileRatio;sy=(srcCanvas.height-sh)/2;}
      
      tctx.drawImage(srcCanvas,sx,sy,sw,sh,x,y,tw,th);
    }
  }
  tctx.setLineDash([]);
  $('#downloadTiles').style.display='inline-flex';
});

$('#downloadTiles').addEventListener('click',()=>{
  const a=document.createElement('a');a.download='photo-tiles.png';
  a.href=$('#tilesCanvas').toDataURL('image/png', 0.9);
  a.click();
});

if(typeof QU!=='undefined'){
    QU.init({kofi:true,discover:true});
    if(QU.initKeyboardShortcuts) QU.registerShortcuts({'Ctrl+Z': 'Undo', 'Ctrl+Y': 'Redo'});
}
$('#tiltBtn')?.addEventListener('click', () => alert('Perspective tilt applies a basic CSS transform in this version. True distorted exports arriving in a future QU release!'));
})();
