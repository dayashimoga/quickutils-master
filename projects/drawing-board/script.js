'use strict';
(function(){
const $=s=>document.querySelector(s);
const canvas=$('#drawCanvas'), ctx=canvas.getContext('2d');
const wrapper=$('.canvas-wrapper');

let isDrawing = false;
let color = '#6366f1';
let size = 5;
let opacity = 1.0;
let brushType = 'round';
let lastX = 0, lastY = 0;

function resizeCanvas() {
    // Save current content
    const data = ctx.getImageData(0,0,canvas.width,canvas.height);
    // Set size to a fixed standard or window, here we use fixed A4-ish ratio for predictable drawing
    canvas.width = 1200;
    canvas.height = 800;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // fill white bg initially
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0, canvas.width, canvas.height);
    // restore
    if(data) ctx.putImageData(data,0,0);
}
resizeCanvas();

const presets = ['#ef4444','#f97316','#f59e0b','#84cc16','#10b981','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#d946ef','#f43f5e','#000000','#64748b','#ffffff'];
$('#colorPresets').innerHTML = presets.map(c=>`<button class="color-btn" style="background:${c} ${c==='#ffffff'?' ;border:1px solid #ddd':''}" data-c="${c}"></button>`).join('');
document.querySelectorAll('.color-btn').forEach(b=>b.addEventListener('click', e=>{
    color = e.target.dataset.c;
    $('#colorPicker').value = color;
    if(brushType==='eraser') { brushType='round'; $('#brushType').value='round'; }
}));

$('#colorPicker').addEventListener('input', e=>{ color=e.target.value; if(brushType==='eraser') brushType='round'; });
$('#sizeSlider').addEventListener('input', e=>{ size=parseInt(e.target.value); $('#sizeVal').textContent=size; });
$('#opSlider').addEventListener('input', e=>{ opacity=parseInt(e.target.value)/100; $('#opVal').textContent=e.target.value; });
$('#brushType').addEventListener('change', e=>{ brushType = e.target.value; });

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: ((e.clientX || e.touches[0].clientX) - rect.left) * scaleX,
        y: ((e.clientY || e.touches[0].clientY) - rect.top) * scaleY
    };
}

function startDraw(e) {
    isDrawing = true;
    const pos = getMousePos(e);
    lastX = pos.x; lastY = pos.y;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(lastX, lastY); // dot for single click
    applyDrawSettings();
    ctx.stroke();
    e.preventDefault();
}

function applyDrawSettings() {
    ctx.globalAlpha = brushType === 'eraser' ? 1.0 : opacity;
    ctx.strokeStyle = brushType === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = size;
    ctx.lineJoin = 'round';
    ctx.lineCap = brushType === 'square' ? 'square' : 'round';
}

function draw(e) {
    if(!isDrawing) return;
    const pos = getMousePos(e);
    ctx.beginPath();
    applyDrawSettings();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastX = pos.x; lastY = pos.y;
    e.preventDefault();
}

function stopDraw() { isDrawing = false; }

canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', draw);
window.addEventListener('mouseup', stopDraw);
canvas.addEventListener('touchstart', startDraw, {passive:false});
canvas.addEventListener('touchmove', draw, {passive:false});
window.addEventListener('touchend', stopDraw);

$('#clearBtn').addEventListener('click', ()=>{
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0, canvas.width, canvas.height);
});

$('#saveBtn').addEventListener('click', ()=>{
    const a = document.createElement('a');
    a.download = `drawing_${Date.now()}.png`;
    a.href = canvas.toDataURL();
    a.click();
});

if(typeof QU!=='undefined')QU.init({kofi:true,discover:true});
})();
