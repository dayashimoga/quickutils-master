/* Coloring Books - Core Logic + Page Generators (Part 1) */
'use strict';
(function(){
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const COLORS=['#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e','#10b981','#14b8a6',
'#06b6d4','#0ea5e9','#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899',
'#f43f5e','#78716c','#92400e','#065f46','#1e3a5f','#581c87','#831843','#000000',
'#ffffff','#fecaca','#fed7aa','#fef08a','#bbf7d0','#bae6fd','#c4b5fd','#fbcfe8',
'#fde68a','#a5f3fc','#c7d2fe','#fca5a1','#d1d5db','#fbbf24','#34d399','#60a5fa',
'#a78bfa','#f472b6','#fb923c','#4ade80','#38bdf8','#818cf8','#e879f9','#facc15'];

const CATEGORIES=[
  {id:'animals',name:'🦁 Animals',count:20,audience:'kids'},
  {id:'nature',name:'🌸 Nature',count:15,audience:'all'},
  {id:'vehicles',name:'🚀 Vehicles',count:15,audience:'kids'},
  {id:'fantasy',name:'🏰 Fantasy',count:15,audience:'kids'},
  {id:'holidays',name:'🎄 Holidays',count:15,audience:'all'},
  {id:'education',name:'🔢 Education',count:10,audience:'kids'},
  {id:'patterns',name:'🎨 Patterns',count:10,audience:'adults'},
  {id:'dinosaurs',name:'🦕 Dinosaurs',count:10,audience:'kids'},
  {id:'fairytales',name:'🧜 Fairy Tales',count:10,audience:'kids'},
  {id:'food',name:'🍕 Food & Treats',count:10,audience:'all'},
  {id:'architecture',name:'🏛️ Architecture',count:10,audience:'adults'},
  {id:'zen',name:'🌊 Zen & Mindfulness',count:10,audience:'adults'}
];
const TOTAL_PAGES=CATEGORIES.reduce((s,c)=>s+c.count,0);

let currentPage=null,currentColor=COLORS[0],tool='fill',colorState={},undoStack=[],redoStack=[];
const completed=JSON.parse(localStorage.getItem('qu_coloring_done')||'[]');
let currentDifficulty = 'standard';

// SVG shape helpers
window.ColoringHelpers = window.ColoringHelpers || {};
const circle = (cx,cy,r) => `<circle cx="${cx}" cy="${cy}" r="${r}" class="colorable"/>`;
const ellipse = (cx,cy,rx,ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" class="colorable"/>`;
const rect = (x,y,w,h,rx) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${rx?'rx="'+rx+'"':''} class="colorable"/>`;
const poly = (pts) => `<polygon points="${pts}" class="colorable"/>`;
const path = (d) => `<path d="${d}" class="colorable"/>`;
const tri = (cx,cy,s) => {const h=s*0.866;return poly(`${cx},${cy-h/2} ${cx-s/2},${cy+h/2} ${cx+s/2},${cy+h/2}`);};
const star = (cx,cy,r1,r2,n) => {let pts=[];for(let i=0;i<n*2;i++){const a=Math.PI/n*i-Math.PI/2;const r=i%2===0?r1:r2;pts.push((cx+r*Math.cos(a)).toFixed(1)+','+(cy+r*Math.sin(a)).toFixed(1));}return poly(pts.join(' '));};
const heart = (cx,cy,s) => path(`M${cx},${cy+s*0.4} C${cx},${cy+s*0.8} ${cx-s*0.8},${cy+s*0.5} ${cx-s*0.8},${cy} C${cx-s*0.8},${cy-s*0.5} ${cx},${cy-s*0.3} ${cx},${cy-s*0.1} C${cx},${cy-s*0.3} ${cx+s*0.8},${cy-s*0.5} ${cx+s*0.8},${cy} C${cx+s*0.8},${cy+s*0.5} ${cx},${cy+s*0.8} ${cx},${cy+s*0.4}Z`);
const flower = (cx,cy,r,petals) => {let s='';const pr=r*0.6;for(let i=0;i<petals;i++){const a=2*Math.PI/petals*i;s+=ellipse(cx+r*0.5*Math.cos(a),cy+r*0.5*Math.sin(a),pr,pr*0.4).replace('<ellipse',`<ellipse transform="rotate(${(a*180/Math.PI)} ${cx+r*0.5*Math.cos(a)} ${cy+r*0.5*Math.sin(a)})"`)+'\n';}s+=circle(cx,cy,r*0.3);return s;};
const butterfly = (cx,cy,s) => ellipse(cx,cy,s*0.06,s*0.4)+ellipse(cx-s*0.35,cy-s*0.15,s*0.35,s*0.25)+ellipse(cx+s*0.35,cy-s*0.15,s*0.35,s*0.25)+ellipse(cx-s*0.25,cy+s*0.2,s*0.25,s*0.18)+ellipse(cx+s*0.25,cy+s*0.2,s*0.25,s*0.18)+circle(cx,cy-s*0.45,s*0.08);

window.ColoringHelpers.circle = circle;
window.ColoringHelpers.path = path;
window.ColoringHelpers.getDiff = () => currentDifficulty;

// Page generators by category
const PAGES=[];
const animalNames=['Cat','Dog','Lion','Elephant','Bear','Rabbit','Owl','Fox','Dolphin','Turtle','Horse','Giraffe','Penguin','Koala','Panda','Monkey','Tiger','Whale','Eagle','Frog'];
const natureNames=['Flower Garden','Sunflower','Rose','Tree','Mountain','Beach','Rainbow','Cloud','Sun','Moon','Mushroom','Cactus','Waterfall','Forest','Butterfly'];
const vehicleNames=['Car','Train','Airplane','Boat','Rocket','Helicopter','Bus','Bicycle','Submarine','Hot Air Balloon','Fire Truck','Tractor','Spaceship','Sailboat','Monster Truck'];
const fantasyNames=['Castle','Dragon','Unicorn','Fairy','Wizard','Princess','Knight','Mermaid','Phoenix','Treasure Chest','Magic Wand','Crystal Ball','Enchanted Forest','Crown','Shield'];
const holidayNames=['Christmas Tree','Snowman','Pumpkin','Easter Egg','Birthday Cake','Fireworks','Heart','Gift Box','Santa Hat','Candy Cane','Star','Bell','Wreath','Candle','Stocking'];
const eduNames=['Numbers 1-5','Letters ABC','Shapes','Solar System','World Map','Clock','Alphabet A-H','Counting','Colors','Rainbow ABC'];
const patternNames=['Mandala','Geometric','Mosaic','Spiral','Waves','Honeycomb','Checkerboard','Circles','Stars','Zigzag'];
const dinoNames=['T-Rex','Stegosaurus','Triceratops','Pterodactyl','Brontosaurus','Velociraptor','Ankylosaurus','Spinosaurus','Dino Egg','Dino Family'];
const fairyNames=['Rapunzel Tower','Three Bears','Little Mermaid','Red Riding Hood','Cinderella Shoe','Gingerbread House','Magic Beanstalk','Frog Prince','Sleeping Castle','Pinocchio'];
const foodNames=['Pizza','Ice Cream','Cupcake','Sushi','Fruit Bowl','Donut','Hamburger','Taco','Candy','Birthday Cake'];
const archNames=['Bridge','Lighthouse','Skyscraper','Temple','Windmill','Castle Gate','Pyramid','Church','Pagoda','Igloo'];
const zenNames=['Lotus Mandala','Ocean Waves','Yin Yang','Zen Garden','Spiral Galaxy','Sacred Geometry','Dreamcatcher','Tree of Life','Infinity Flow','Peace Mandala'];

function genAnimal(idx){
  if(window.RealisticDrawings && window.RealisticDrawings.genAnimal) return window.RealisticDrawings.genAnimal(idx);
  return "";
}

function genNature(idx){const cx=250,cy=250;
  switch(idx%15){
    case 0: return flower(150,200,60,6)+flower(300,180,50,5)+flower(200,330,55,7)+tree(370,150,80,200)+circle(100,50,40)+path(`M50,450Q150,400 250,450Q350,400 450,450L450,500L50,500Z`);
    case 1: return circle(cx,cy,100)+circle(cx,cy,70)+circle(cx,cy,40)+path(`M${cx},${cy-100}L${cx-5},${cy-150}L${cx+5},${cy-150}`)+rect(cx-5,cy+100,10,100)+ellipse(cx-40,cy+120,30,15)+ellipse(cx+40,cy+140,30,15); // sunflower
    case 2: {let s='';for(let i=0;i<12;i++){const a=2*Math.PI/12*i;s+=ellipse(cx+35*Math.cos(a),cy+35*Math.sin(a)-30,22,35).replace('<ellipse',`<ellipse transform="rotate(${a*180/Math.PI} ${cx+35*Math.cos(a)} ${cy+35*Math.sin(a)-30})"`);}return s+circle(cx,cy-30,20)+rect(cx-5,cy+30,10,120)+ellipse(cx-35,cy+80,30,15)+ellipse(cx+35,cy+100,30,15);} // rose
    case 3: return tree(180,80,140,280)+tree(80,120,100,240)+tree(300,100,120,260);
    case 4: return poly(`50,400 250,80 450,400`)+poly(`100,400 300,150 500,400`)+circle(80,80,40)+path(`M0,400Q125,350 250,400Q375,350 500,400L500,500L0,500Z`);
    case 5: return circle(400,80,50)+path(`M0,300Q100,250 200,300Q300,250 400,300Q500,250 500,300L500,500L0,500Z`)+path(`M0,350Q100,300 200,350Q300,300 400,350Q500,300 500,350L500,500L0,500Z`)+ellipse(120,380,60,20)+path(`M200,310L210,280L220,310`);
    case 6: {let s='';const colors=7;for(let i=0;i<colors;i++)s+=path(`M50,${400-i*30}Q250,${250-i*30} 450,${400-i*30}`).replace('/>',` fill="none" stroke-width="12"/>`);return s+circle(60,80,40);}
    case 7: return ellipse(150,120,80,40)+ellipse(200,100,70,45)+ellipse(250,120,80,40)+ellipse(300,130,60,35)+ellipse(350,100,90,50)+ellipse(cx,350,120,50)+ellipse(cx+100,340,80,40);
    case 8: return circle(cx,120,80)+path(`M${cx-50},${120}L${cx-80},${200}L${cx-30},${170}Z`)+path(`M${cx+50},${120}L${cx+80},${200}L${cx+30},${170}Z`)+path(`M${cx},${200}L${cx-15},${280}L${cx+15},${280}Z`)+path(`M${cx-60},${100}L${cx-100},${160}L${cx-50},${140}Z`)+path(`M${cx+60},${100}L${cx+100},${160}L${cx+50},${140}Z`);
    case 9: return circle(cx,150,60)+circle(cx-20,135,8)+circle(cx+20,135,8)+path(`M${cx-15},${165}Q${cx},${175}${cx+15},${165}`)+ellipse(cx,350,70,30);
    case 10: return ellipse(cx,280,40,60)+circle(cx,200,35)+circle(cx-20,250,15)+circle(cx+25,260,12)+circle(cx-10,290,10);
    case 11: return rect(cx-15,200,30,200)+ellipse(cx-30,200,20,8)+ellipse(cx+30,210,18,7)+star(cx,170,20,8,5)+path(`M${cx-15},400L${cx-40},420L${cx+40},420L${cx+15},400Z`);
    case 12: return path(`M200,400L200,200Q200,100 250,100Q300,100 300,200L300,400`)+path(`M150,300Q250,200 350,300`)+path(`M175,350Q250,280 325,350`)+ellipse(250,100,30,20);
    case 13: return tree(50,60,100,300)+tree(180,80,120,280)+tree(320,50,110,310)+path(`M0,380Q125,350 250,380Q375,350 500,380L500,500L0,500Z`);
    default: return butterfly(cx,cy,200);
  }
}

function genVehicle(idx){
  if(window.RealisticDrawings && window.RealisticDrawings.genVehicle) return window.RealisticDrawings.genVehicle(idx);
  return "";
}

function genFantasy(idx){const cx=250,cy=250;
  switch(idx%15){
    case 0: return rect(150,200,200,250)+rect(130,180,240,20)+poly(`${cx},50 ${cx-60},180 ${cx+60},180`)+rect(200,350,100,100)+rect(160,250,40,50,3)+rect(300,250,40,50,3)+rect(cx-5,50,10,30); // castle
    case 1: return ellipse(cx,cy,100,70)+circle(cx-30,cy-50,35)+poly(`${cx-50},${cy-30} ${cx-30},${cy-80} ${cx-10},${cy-30}`)+path(`M${cx+80},${cy}Q${cx+140},${cy-40}${cx+160},${cy}Q${cx+140},${cy+40}${cx+80},${cy}`)+ellipse(cx-60,cy+50,25,12)+ellipse(cx+30,cy+50,25,12)+circle(cx-40,cy-55,6); // dragon
    case 2: return ellipse(cx,cy+20,60,90)+circle(cx,cy-80,40)+poly(`${cx-15},${cy-120} ${cx},${cy-160} ${cx+15},${cy-120}`)+circle(cx-12,cy-85,5)+circle(cx+12,cy-85,5)+rect(cx-8,cy+100,8,50)+rect(cx,cy+100,8,50)+path(`M${cx+50},${cy-20}Q${cx+80},${cy-60}${cx+60},${cy-80}`); // unicorn
    case 3: return butterfly(cx,cy-20,160)+circle(cx,cy-100,25)+path(`M${cx},${cy+60}L${cx},${cy+150}`)+rect(cx-20,cy+150,40,15)+star(cx-40,cy+30,10,4,5)+star(cx+50,cy+50,8,3,5);
    case 4: return circle(cx,cy-80,40)+rect(cx-40,cy-40,80,140)+rect(cx-50,cy-40,20,60)+rect(cx+30,cy-40,20,60)+circle(cx-15,cy-85,5)+circle(cx+15,cy-85,5)+poly(`${cx-40},${cy-120} ${cx},${cy-160} ${cx+40},${cy-120}`)+path(`M${cx-30},${cy+100}L${cx-30},${cy+180}`)+path(`M${cx+30},${cy+100}L${cx+30},${cy+180}`)+star(cx+60,cy-40,15,6,5);
    case 5: return circle(cx,cy-90,35)+rect(cx-30,cy-55,60,100)+tri(cx,cy-60,80)+rect(cx-40,cy-55,80,15)+circle(cx-10,cy-95,4)+circle(cx+10,cy-95,4)+path(`M${cx-5},${cy-80}Q${cx},${cy-75}${cx+5},${cy-80}`)+rect(cx-10,cy+45,8,60)+rect(cx+2,cy+45,8,60); // princess
    case 6: return circle(cx,cy-80,30)+rect(cx-25,cy-50,50,80)+rect(cx-50,cy-30,20,50)+rect(cx+30,cy-30,20,50)+rect(cx-15,cy+30,10,60)+rect(cx+5,cy+30,10,60)+rect(cx-60,cy-20,15,40,3)+ellipse(cx,cy-110,35,15); // knight
    case 7: return ellipse(cx,cy+40,60,80)+circle(cx,cy-40,35)+path(`M${cx-60},${cy+100}Q${cx-40},${cy+160}${cx},${cy+180}Q${cx+40},${cy+160}${cx+60},${cy+100}`)+circle(cx-10,cy-45,5)+circle(cx+10,cy-45,5);
    case 8: return path(`M${cx},${cy-100}Q${cx+80},${cy-80}${cx+60},${cy}Q${cx+100},${cy+40}${cx+40},${cy+80}Q${cx+60},${cy+120}${cx},${cy+100}Q${cx-60},${cy+120}${cx-40},${cy+80}Q${cx-100},${cy+40}${cx-60},${cy}Q${cx-80},${cy-80}${cx},${cy-100}`)+circle(cx,cy,30);
    case 9: return rect(cx-70,cy-40,140,100,5)+rect(cx-60,cy-50,120,10)+poly(`${cx-50},${cy-50} ${cx},${cy-80} ${cx+50},${cy-50}`)+circle(cx-30,cy,12)+circle(cx+30,cy,12)+circle(cx,cy+20,15);
    case 10: return rect(cx-4,cy-100,8,200)+star(cx,cy-100,25,10,5)+circle(cx,cy+20,8)+circle(cx,cy+60,8);
    case 11: return circle(cx,cy,80)+circle(cx,cy,60)+circle(cx,cy,40)+circle(cx,cy,20)+star(cx+80,cy-80,15,6,5)+star(cx-90,cy+60,12,5,5);
    case 12: return tree(100,60,100,280)+tree(300,40,120,300)+path(`M0,380Q125,340 250,380Q375,340 500,380L500,500L0,500Z`)+star(200,100,15,6,5)+star(350,80,12,5,5)+star(150,150,10,4,5);
    case 13: return ellipse(cx,cy,70,50)+poly(`${cx-40},${cy-40} ${cx},${cy-80} ${cx+40},${cy-40}`)+circle(cx-25,cy+20,15)+circle(cx+25,cy+20,15)+circle(cx-25,cy+20,8)+circle(cx+25,cy+20,8);
    default: return ellipse(cx,cy,100,80)+poly(`${cx-100},${cy} ${cx-60},${cy-40} ${cx-60},${cy+40}`)+poly(`${cx+100},${cy} ${cx+60},${cy-40} ${cx+60},${cy+40}`)+rect(cx-15,cy-30,30,20,3)+rect(cx-40,cy+20,80,15,3);
  }
}

function genHoliday(idx){const cx=250,cy=250;
  switch(idx%15){
    case 0: return poly(`${cx},50 ${cx-120},${450} ${cx+120},${450}`)+rect(cx-20,420,40,50)+star(cx,50,25,10,5)+circle(cx-40,200,8)+circle(cx+30,250,8)+circle(cx-20,300,8)+circle(cx+50,350,8);
    case 1: return circle(cx,150,60)+circle(cx,280,80)+circle(cx,cy-160,12)+ellipse(cx-35,120,8,8)+ellipse(cx+35,120,8,8)+rect(cx-30,155,60,5)+poly(`${cx-5},100 ${cx},80 ${cx+5},100`);
    case 2: return ellipse(cx,cy+20,100,80)+path(`M${cx-30},${cy-60}Q${cx-20},${cy-100}${cx},${cy-80}Q${cx+20},${cy-100}${cx+30},${cy-60}`)+circle(cx-25,cy-10,8)+circle(cx+25,cy-10,8)+path(`M${cx-20},${cy+30}Q${cx},${cy+50}${cx+20},${cy+30}`);
    case 3: return ellipse(cx,cy,80,100)+path(`M${cx-40},${cy-60}Q${cx},${cy-100}${cx+40},${cy-60}`)+circle(cx,cy-20,15)+circle(cx-25,cy+20,10)+circle(cx+25,cy+20,10)+star(cx,cy+60,12,5,5);
    case 4: return rect(cx-80,cy-20,160,120,10)+rect(cx-60,cy-60,120,40,5)+rect(cx-40,cy-90,80,30,5)+ellipse(cx,cy-95,15,12)+circle(cx-30,cy+20,10)+circle(cx+30,cy+20,10)+circle(cx,cy+60,10)+path(`M${cx-60},${cy-18}L${cx+60},${cy-18}`);
    case 5: {let s='';for(let i=0;i<8;i++){const a=2*Math.PI/8*i;const r=80+i*15;s+=star(cx+r*Math.cos(a),cy+r*Math.sin(a),15,6,5);}return s+circle(cx,cy,30);}
    case 6: return heart(cx,cy,120);
    case 7: return rect(cx-70,cy-70,140,140,5)+path(`M${cx-70},${cy-20}L${cx+70},${cy-20}`)+path(`M${cx-20},${cy-70}L${cx-20},${cy+70}`)+ellipse(cx+30,cy-40,25,20)+circle(cx-40,cy+30,15);
    case 8: return poly(`${cx-60},${cy+50} ${cx},${cy-80} ${cx+60},${cy+50}`)+ellipse(cx,cy+50,70,15)+circle(cx,cy+60,12);
    case 9: return path(`M${cx-15},${cy-100}Q${cx-15},${cy-130}${cx},${cy-130}Q${cx+15},${cy-130}${cx+15},${cy-100}L${cx+15},${cy+100}Q${cx+15},${cy+130}${cx},${cy+130}Q${cx-15},${cy+130}${cx-15},${cy+100}Z`)+path(`M${cx-15},${cy-40}L${cx+15},${cy-60}L${cx+15},${cy-40}L${cx-15},${cy-60}Z`);
    case 10: return star(cx,cy,100,40,5);
    case 11: return ellipse(cx,cy-30,50,60)+ellipse(cx,cy+40,35,30)+circle(cx,cy-80,12)+path(`M${cx-50},${cy-30}L${cx-70},${cy-60}`)+path(`M${cx+50},${cy-30}L${cx+70},${cy-60}`);
    case 12: return circle(cx,cy,100)+circle(cx,cy,80)+circle(cx-40,cy-30,15)+circle(cx+40,cy-20,15)+circle(cx,cy+40,15)+circle(cx+20,cy-50,12)+star(cx,cy-100,20,8,5);
    case 13: return rect(cx-15,cy-60,30,120)+circle(cx,cy-70,15)+ellipse(cx-30,cy+60,20,8)+ellipse(cx+30,cy+60,20,8)+path(`M${cx-8},${cy-30}L${cx-3},${cy-15}L${cx+3},${cy-15}L${cx+8},${cy-30}`);
    default: return rect(cx-30,cy-80,60,160)+rect(cx-15,cy+80,30,40)+circle(cx-5,cy-40,5)+circle(cx+5,cy,5)+circle(cx-8,cy+40,5);
  }
}

function genEducation(idx){const cx=250,cy=250;
  switch(idx%10){
    case 0: {let s='';const nums='12345';for(let i=0;i<5;i++)s+=`<text x="${80+i*80}" y="280" font-size="80" fill="none" stroke="#333" stroke-width="2" font-family="Arial">${nums[i]}</text>`;return s;}
    case 1: {let s='';'ABC'.split('').forEach((c,i)=>{s+=`<text x="${100+i*120}" y="300" font-size="100" fill="none" stroke="#333" stroke-width="2" font-family="Arial">${c}</text>`;});return s;}
    case 2: return circle(130,150,60)+rect(280,90,120,120)+tri(cx,350,120)+star(400,350,40,16,5);
    case 3: return circle(cx,cy,40)+circle(cx,cy,20)+circle(cx-100,cy,15)+circle(cx+120,cy,12)+circle(cx-170,cy,10)+circle(cx+200,cy,8)+circle(cx,cy-130,25)+circle(cx+70,cy+90,10);
    case 4: return rect(50,100,400,300,5)+path(`M100,250L200,250L200,200L300,250L300,300L400,200`)+circle(150,300,5)+circle(350,180,5);
    case 5: return circle(cx,cy,100)+path(`M${cx},${cy}L${cx},${cy-90}`)+path(`M${cx},${cy}L${cx+60},${cy+40}`)+circle(cx,cy,5);for(let i=0;i<12;i++){const a=2*Math.PI/12*i;circle(cx+90*Math.cos(a),cy+90*Math.sin(a),4);}
    case 6: {let s='';'DEFGH'.split('').forEach((c,i)=>{s+=`<text x="${60+i*90}" y="300" font-size="80" fill="none" stroke="#333" stroke-width="2" font-family="Arial">${c}</text>`;});return s;}
    case 7: {let s='';for(let i=1;i<=9;i++)s+=circle(50+(i%5)*100,100+Math.floor((i-1)/5)*120,25)+`<text x="${50+(i%5)*100}" y="${108+Math.floor((i-1)/5)*120}" font-size="20" text-anchor="middle" fill="none" stroke="#333" stroke-width="1">${i}</text>`;return s;}
    case 8: return circle(120,150,60)+rect(260,90,120,120)+tri(180,350,100)+star(380,340,35,14,5)+ellipse(120,350,50,30);
    default: {let s='';const colors7=['R','O','Y','G','B','I','V'];for(let i=0;i<7;i++)s+=path(`M50,${380-i*30}Q250,${250-i*30} 450,${380-i*30}`)+`<text x="460" y="${384-i*30}" font-size="16" fill="none" stroke="#333" stroke-width="1">${colors7[i]}</text>`;return s;}
  }
}

function genPattern(idx){const cx=250,cy=250;
  switch(idx%10){
    case 0: {let s=circle(cx,cy,180)+circle(cx,cy,140)+circle(cx,cy,100)+circle(cx,cy,60)+circle(cx,cy,20);for(let i=0;i<12;i++){const a=2*Math.PI/12*i;s+=path(`M${cx},${cy}L${cx+180*Math.cos(a)},${cy+180*Math.sin(a)}`);}return s;}
    case 1: {let s='';for(let y=0;y<5;y++)for(let x=0;x<5;x++){const px=70+x*90,py=70+y*90;s+=rect(px,py,70,70)+poly(`${px},${py} ${px+35},${py+35} ${px+70},${py} ${px+35},${py-35}`);}return s;}
    case 2: {let s='';for(let y=0;y<6;y++)for(let x=0;x<6;x++){s+=rect(30+x*80,30+y*80,35,35,3);}return s;}
    case 3: {let s='';for(let i=0;i<8;i++)s+=circle(cx,cy,20+i*22);return s;}
    case 4: {let s='';for(let y=0;y<10;y++)s+=path(`M0,${50+y*45}Q125,${25+y*45} 250,${50+y*45}Q375,${75+y*45} 500,${50+y*45}`);return s;}
    case 5: {let s='';const r=30;for(let y=0;y<6;y++)for(let x=0;x<7;x++){const px=50+x*r*1.73+(y%2?r*0.866:0),py=50+y*r*1.5;const pts=[];for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/6;pts.push((px+r*Math.cos(a)).toFixed(1)+','+(py+r*Math.sin(a)).toFixed(1));}s+=poly(pts.join(' '));}return s;}
    case 6: {let s='';for(let y=0;y<8;y++)for(let x=0;x<8;x++){if((x+y)%2===0)s+=rect(30+x*55,30+y*55,55,55);}return s;}
    case 7: {let s='';for(let y=0;y<6;y++)for(let x=0;x<6;x++)s+=circle(70+x*80,70+y*80,30);return s;}
    case 8: {let s='';for(let i=0;i<20;i++){const r=20+i*10;s+=star(cx,cy,r,r-8,6);}return s.slice(0,s.length/2);} // limit size
    default: {let s='';for(let y=0;y<6;y++)s+=path(`M${50},${50+y*80}L${100+y*10},${90+y*80}L${150},${50+y*80}L${200+y*10},${90+y*80}L${250},${50+y*80}L${300+y*10},${90+y*80}L${350},${50+y*80}L${400+y*10},${90+y*80}L${450},${50+y*80}`);return s;}
  }
}

function genDinosaur(idx){
  if(window.RealisticDrawings && window.RealisticDrawings.genDinosaur) return window.RealisticDrawings.genDinosaur(idx);
  return "";
}

function genFairyTale(idx){const cx=250,cy=250;
  switch(idx%10){
    case 0: return rect(cx-30,100,60,300)+rect(cx-50,80,100,25)+rect(cx-15,200,30,40,3)+rect(cx-15,300,30,40,3)+poly(`${cx-50},80 ${cx},30 ${cx+50},80`)+path(`M${cx-30},350Q${cx-80},380 ${cx-80},420`)+path(`M${cx+30},350Q${cx+80},380 ${cx+80},420`); // tower
    case 1: return circle(cx-60,cy-30,50)+circle(cx+60,cy-30,50)+circle(cx,cy-60,60)+circle(cx-80,cy-40,6)+circle(cx+80,cy-40,6)+circle(cx-10,cy-70,6)+circle(cx+10,cy-70,6)+rect(cx-50,cy+50,100,80,5)+rect(cx-20,cy+90,40,40); // bears
    case 2: return ellipse(cx,cy+60,50,70)+circle(cx,cy-20,35)+path(`M${cx-50},${cy+120}Q${cx-30},${cy+160}${cx},${cy+180}Q${cx+30},${cy+160}${cx+50},${cy+120}`)+circle(cx-10,cy-25,4)+circle(cx+10,cy-25,4)+path(`M${cx-50},${cy+80}Q${cx-80},${cy+100}${cx-60},${cy+130}`); // mermaid
    case 3: return circle(cx,cy-80,30)+rect(cx-20,cy-50,40,100)+path(`M${cx-60},${cy+50}L${cx-40},${cy-10}L${cx+40},${cy-10}L${cx+60},${cy+50}`)+tri(cx,cy-90,50)+rect(cx-8,cy+50,8,40)+rect(cx,cy+50,8,40); // red riding hood
    case 4: return path(`M${cx-50},${cy+50}Q${cx-80},${cy}${cx-40},${cy-20}Q${cx},${cy-80}${cx+40},${cy-20}Q${cx+80},${cy}${cx+50},${cy+50}`)+rect(cx-30,cy+50,60,20)+star(cx,cy-30,15,6,5)+ellipse(cx,cy+70,60,15); // shoe
    case 5: return rect(cx-80,cy-40,160,140,5)+poly(`${cx-80},${cy-40} ${cx},${cy-120} ${cx+80},${cy-40}`)+rect(cx-30,cy+40,60,60)+circle(cx-40,cy,12)+circle(cx+40,cy,12)+rect(cx-60,cy+80,20,20)+rect(cx+40,cy+80,20,20); // gingerbread
    case 6: return rect(cx-8,cy+100,16,80)+path(`M${cx},${cy+100}Q${cx-30},${cy+60}${cx},${cy+20}Q${cx+30},${cy-20}${cx},${cy-60}Q${cx-20},${cy-100}${cx},${cy-120}`)+ellipse(cx,cy-120,40,25)+ellipse(cx,cy+20,30,20); // beanstalk
    case 7: return ellipse(cx,cy+20,50,40)+circle(cx,cy-30,30)+circle(cx-8,cy-35,5)+circle(cx+8,cy-35,5)+ellipse(cx,cy-15,10,5)+star(cx+50,cy-60,12,5,5)+star(cx-40,cy-50,10,4,5); // frog prince
    case 8: return rect(cx-90,cy-20,180,120,5)+poly(`${cx-90},${cy-20} ${cx},${cy-100} ${cx+90},${cy-20}`)+rect(cx-30,cy+40,60,60)+rect(cx-60,cy+10,30,30,3)+rect(cx+30,cy+10,30,30,3)+star(cx,cy-100,20,8,5); // sleeping castle
    default: return circle(cx,cy-80,30)+rect(cx-15,cy-50,30,80)+circle(cx-5,cy-85,4)+circle(cx+5,cy-85,4)+ellipse(cx,cy-60,12,6)+rect(cx-5,cy+30,10,50)+circle(cx,cy+30,8); // pinocchio
  }
}

function genFood(idx){const cx=250,cy=250;
  switch(idx%10){
    case 0: return circle(cx,cy,100)+circle(cx-30,cy-20,18)+circle(cx+20,cy+10,15)+circle(cx+40,cy-30,12)+circle(cx-10,cy+35,14)+ellipse(cx,cy,100,100); // pizza
    case 1: return poly(`${cx-40},${cy+20} ${cx},${cy-80} ${cx+40},${cy+20}`)+circle(cx,cy-80,35)+circle(cx,cy-80,20)+rect(cx-3,cy+20,6,60); // ice cream
    case 2: return path(`M${cx-50},${cy+30}Q${cx-60},${cy-30}${cx-30},${cy-50}Q${cx},${cy-70}${cx+30},${cy-50}Q${cx+60},${cy-30}${cx+50},${cy+30}Z`)+rect(cx-55,cy+30,110,40,5)+circle(cx,cy-30,15)+star(cx-25,cy-10,8,3,5)+star(cx+25,cy-10,8,3,5); // cupcake
    case 3: return rect(cx-80,cy-20,160,50,5)+rect(cx-60,cy-10,30,30,3)+rect(cx-15,cy-10,30,30,3)+rect(cx+30,cy-10,30,30,3)+circle(cx-40,cy-25,12)+circle(cx+10,cy-25,10)+circle(cx+50,cy-20,8)+rect(cx-70,cy+30,140,10,3); // sushi
    case 4: return ellipse(cx,cy,110,80)+circle(cx-40,cy-10,30)+circle(cx+30,cy+10,25)+circle(cx-10,cy+30,20)+ellipse(cx+50,cy-20,25,18)+circle(cx-50,cy+20,15); // fruit bowl
    case 5: return circle(cx,cy,80)+circle(cx,cy,50)+circle(cx,cy,20)+circle(cx-30,cy-20,8)+circle(cx+35,cy+15,8)+circle(cx+10,cy-35,8)+circle(cx-20,cy+30,8); // donut
    case 6: return ellipse(cx,cy+20,90,50)+ellipse(cx,cy-10,80,40)+ellipse(cx,cy-30,70,25)+rect(cx-70,cy+15,140,20,8)+circle(cx-20,cy+30,5)+circle(cx+20,cy+30,5)+poly(`${cx-60},${cy+50} ${cx-80},${cy+80} ${cx+80},${cy+80} ${cx+60},${cy+50}`); // burger
    case 7: return path(`M${cx-60},${cy-40}L${cx+60},${cy-40}L${cx+40},${cy+60}L${cx-40},${cy+60}Z`)+ellipse(cx,cy,50,35)+circle(cx-15,cy-5,10)+circle(cx+15,cy+5,10)+circle(cx,cy-15,8); // taco
    case 8: return ellipse(cx,cy,30,40)+path(`M${cx},${cy-40}Q${cx-20},${cy-60}${cx},${cy-70}Q${cx+20},${cy-60}${cx},${cy-40}`)+rect(cx-3,cy+40,6,30)+ellipse(cx-60,cy,25,35)+path(`M${cx-60},${cy-35}Q${cx-80},${cy-55}${cx-60},${cy-65}Q${cx-40},${cy-55}${cx-60},${cy-35}`); // candy
    default: return rect(cx-80,cy-20,160,100,8)+rect(cx-60,cy-50,120,30,5)+rect(cx-40,cy-70,80,20,5)+circle(cx-30,cy-75,8)+circle(cx,cy-75,8)+circle(cx+30,cy-75,8)+rect(cx-3,cy-70,6,30)+rect(cx-3,cy-40,6,20); // cake
  }
}

function genArchitecture(idx){const cx=250,cy=250;
  switch(idx%10){
    case 0: return path(`M50,350 Q150,200 250,350 Q350,200 450,350`)+rect(200,350,100,40)+rect(80,250,40,100)+rect(380,250,40,100)+rect(50,350,400,20); // bridge
    case 1: return rect(cx-20,100,40,280)+circle(cx,80,30)+path(`M${cx-20},380L${cx-60},400L${cx+60},400L${cx+20},380`)+rect(cx-30,300,60,15)+rect(cx-35,250,70,12)+rect(cx-25,180,50,10); // lighthouse
    case 2: return rect(cx-40,60,80,360)+rect(cx-35,70,70,30)+rect(cx-35,110,70,30)+rect(cx-35,150,70,30)+rect(cx-35,190,70,30)+rect(cx-35,230,70,30)+rect(cx-35,270,70,30)+rect(cx-35,310,70,30)+rect(cx-35,350,70,30)+rect(cx-15,380,30,40); // skyscraper
    case 3: return rect(cx-100,200,200,180)+poly(`${cx-100},200 ${cx},80 ${cx+100},200`)+rect(cx-80,220,30,30)+rect(cx+50,220,30,30)+rect(cx-30,300,60,80)+circle(cx-80,220+15,10)+circle(cx+50+15,220+15,10)+rect(cx-120,200,240,15); // temple
    case 4: return rect(cx-15,100,30,250)+poly(`${cx-80},250 ${cx-60},100 ${cx+60},100 ${cx+80},250`)+path(`M${cx-80},250 L${cx-80},120 L${cx-60},100`)+path(`M${cx+80},250 L${cx+80},120 L${cx+60},100`)+rect(cx-5,80,10,30)+circle(cx,75,8); // windmill
    case 5: return rect(100,200,300,150)+poly(`100,200 250,80 400,200`)+rect(220,280,60,70)+rect(120,230,50,40)+rect(330,230,50,40)+rect(100,200,300,10)+poly(`90,210 250,70 410,210`); // castle gate
    case 6: return poly(`${cx},60 ${cx-120},350 ${cx+120},350`)+poly(`${cx},90 ${cx-90},330 ${cx+90},330`)+path(`M${cx-120},350L${cx+120},350`)+rect(cx-25,250,50,60); // pyramid
    case 7: return rect(cx-60,150,120,230)+poly(`${cx-60},150 ${cx},60 ${cx+60},150`)+circle(cx,120,20)+rect(cx-20,300,40,80)+rect(cx-45,200,30,40,5)+rect(cx+15,200,30,40,5)+rect(cx-3,60,6,30); // church
    case 8: return rect(cx-50,250,100,100)+rect(cx-40,200,80,50)+rect(cx-30,160,60,40)+rect(cx-20,130,40,30)+rect(cx-10,110,20,20)+poly(`${cx-55},250 ${cx-65},260 ${cx-65},350 ${cx-55},350`)+poly(`${cx+55},250 ${cx+65},260 ${cx+65},350 ${cx+55},350`); // pagoda
    default: return path(`M${cx-80},${cy+60}Q${cx-80},${cy-40}${cx},${cy-60}Q${cx+80},${cy-40}${cx+80},${cy+60}Z`)+rect(cx-30,cy+20,60,40)+circle(cx-20,cy-10,8)+circle(cx+20,cy-10,8)+rect(cx-5,cy+60,10,30); // igloo
  }
}

function genZen(idx){const cx=250,cy=250;
  switch(idx%10){
    case 0: {let s='';for(let i=0;i<8;i++){const a=2*Math.PI/8*i;for(let j=0;j<3;j++)s+=ellipse(cx+(60+j*40)*Math.cos(a),cy+(60+j*40)*Math.sin(a),20,35).replace('<ellipse',`<ellipse transform="rotate(${a*180/Math.PI} ${cx+(60+j*40)*Math.cos(a)} ${cy+(60+j*40)*Math.sin(a)})"`);}s+=circle(cx,cy,30);return s;} // lotus mandala
    case 1: {let s='';for(let y=0;y<8;y++)s+=path(`M0,${100+y*40}Q125,${70+y*40} 250,${100+y*40}Q375,${130+y*40} 500,${100+y*40}`);return s;} // waves
    case 2: return circle(cx,cy,100)+path(`M${cx},${cy-100}Q${cx+100},${cy}${cx},${cy+100}Q${cx-100},${cy}${cx},${cy-100}`)+circle(cx,cy-50,15)+circle(cx,cy+50,15); // yin yang
    case 3: {let s=rect(50,50,400,400,10);for(let i=0;i<5;i++)s+=circle(100+i*80,250,30)+rect(100+i*80-2,280,4,40);s+=path('M50,350Q250,300 450,350');return s;} // zen garden
    case 4: {let s='';for(let i=0;i<12;i++)s+=circle(cx,cy,15+i*15);for(let i=0;i<6;i++){const a=Math.PI/3*i;s+=path(`M${cx},${cy}L${cx+180*Math.cos(a)},${cy+180*Math.sin(a)}`);}return s;} // spiral galaxy
    case 5: {let s='';for(let i=0;i<6;i++){const a=Math.PI/3*i;s+=poly(`${cx},${cy} ${cx+150*Math.cos(a)},${cy+150*Math.sin(a)} ${cx+150*Math.cos(a+Math.PI/3)},${cy+150*Math.sin(a+Math.PI/3)}`);s+=circle(cx+80*Math.cos(a+Math.PI/6),cy+80*Math.sin(a+Math.PI/6),20);}s+=circle(cx,cy,40);return s;} // sacred geometry
    case 6: return circle(cx,cy,120)+circle(cx,cy,80)+circle(cx,cy,40)+path(`M${cx},${cy-120}L${cx-20},${cy-160}L${cx+20},${cy-160}`)+path(`M${cx},${cy-120}L${cx-40},${cy-155}L${cx},${cy-180}L${cx+40},${cy-155}`); // dreamcatcher
    case 7: return rect(cx-8,cy,16,150)+path(`M${cx},${cy}Q${cx-80},${cy-40}${cx-100},${cy-100}Q${cx-60},${cy-80}${cx-40},${cy-120}Q${cx-20},${cy-80}${cx},${cy-60}`)+path(`M${cx},${cy}Q${cx+80},${cy-40}${cx+100},${cy-100}Q${cx+60},${cy-80}${cx+40},${cy-120}Q${cx+20},${cy-80}${cx},${cy-60}`)+circle(cx,cy-60,30); // tree of life
    case 8: {let s='';for(let i=0;i<20;i++){const t=i/20*Math.PI*4;const r=10+i*8;s+=circle(cx+r*Math.cos(t),cy+r*Math.sin(t),5+i*0.5);}return s;} // infinity flow
    default: {let s=circle(cx,cy,180)+circle(cx,cy,140)+circle(cx,cy,100)+circle(cx,cy,60)+circle(cx,cy,20);for(let i=0;i<16;i++){const a=2*Math.PI/16*i;s+=path(`M${cx},${cy}L${cx+180*Math.cos(a)},${cy+180*Math.sin(a)}`);}for(let i=0;i<8;i++){const a=2*Math.PI/8*i+Math.PI/8;s+=circle(cx+110*Math.cos(a),cy+110*Math.sin(a),15);}return s;} // peace mandala
  }
}

// Build all pages
const allNames=[...animalNames,...natureNames,...vehicleNames,...fantasyNames,...holidayNames,...eduNames,...patternNames,...dinoNames,...fairyNames,...foodNames,...archNames,...zenNames];
const generators=[genAnimal,genNature,genVehicle,genFantasy,genHoliday,genEducation,genPattern,genDinosaur,genFairyTale,genFood,genArchitecture,genZen];
let pageIdx=0;
CATEGORIES.forEach((cat,ci)=>{for(let i=0;i<cat.count;i++){
  const nameIdx=CATEGORIES.slice(0,ci).reduce((s,c)=>s+c.count,0)+i;
  PAGES.push({id:pageIdx++,name:allNames[nameIdx]||('Page '+(nameIdx+1)),cat:cat.id,gen:()=>generators[ci](i)});
}});

// Render categories with audience filter
$('#categoryTabs').innerHTML='<button class="cat-tab active" data-cat="all">All</button><button class="cat-tab" data-cat="kids">👶 Kids</button><button class="cat-tab" data-cat="adults">🧑 Adults</button>'+CATEGORIES.map(c=>`<button class="cat-tab" data-cat="${c.id}">${c.name}</button>`).join('');
$$('.cat-tab').forEach(b=>b.addEventListener('click',()=>{$$('.cat-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderPageGrid(b.dataset.cat);}));

function renderPageGrid(cat='all'){
  let pages;
  if(cat==='all') pages=PAGES;
  else if(cat==='kids') pages=PAGES.filter(p=>{const c=CATEGORIES.find(x=>x.id===p.cat);return c&&(c.audience==='kids'||c.audience==='all');});
  else if(cat==='adults') pages=PAGES.filter(p=>{const c=CATEGORIES.find(x=>x.id===p.cat);return c&&(c.audience==='adults'||c.audience==='all');});
  else pages=PAGES.filter(p=>p.cat===cat);
  const doneCount=completed.length;
  $('#progressBadge').textContent=doneCount+'/'+TOTAL_PAGES;
  const emojiMap={animals:'🐾',nature:'🌿',vehicles:'🚗',fantasy:'✨',holidays:'🎉',education:'📚',patterns:'🎨',dinosaurs:'🦕',fairytales:'🧜',food:'🍕',architecture:'🏛️',zen:'🌊'};
  $('#pageGrid').innerHTML=pages.map(p=>{
    const isDone=completed.includes(p.id);
    const isActive=currentPage&&currentPage.id===p.id;
    const emoji=emojiMap[p.cat]||'🎨';
    return `<div class="page-thumb${isActive?' active':''}${isDone?' completed':''}" data-id="${p.id}" title="${p.name}"><span>${emoji}</span><span class="thumb-num">${p.id+1}</span></div>`;
  }).join('');
  $$('.page-thumb').forEach(t=>t.addEventListener('click',()=>loadPage(parseInt(t.dataset.id))));
}

function loadPage(id){
  const page=PAGES[id];if(!page)return;
  currentPage=page;undoStack=[];redoStack=[];
  const svgContent=page.gen();
  $('#coloringSvg').innerHTML=svgContent;
  // Apply difficulty styles dynamically via stroke-width
  const svg=document.getElementById('coloringSvg');
  const strokeW = currentDifficulty === 'simple' ? 5 : currentDifficulty === 'standard' ? 3 : 1.5;
  if(svg) {
      svg.querySelectorAll('.colorable').forEach(el=>{
          el.setAttribute('stroke', '#222');
          el.setAttribute('stroke-width', strokeW);
          if(!el.hasAttribute('fill')) el.setAttribute('fill', '#ffffff');
      });
  }

  // Restore saved colors
  const saved=colorState[id];
  if(saved){
    const els=$('#coloringSvg').querySelectorAll('.colorable');
    els.forEach((el,i)=>{if(saved[i])el.setAttribute('fill',saved[i]);});
  }
  $('#pageTitle').innerHTML=`#${id+1} — ${page.name} <span style="font-size:0.8rem;opacity:0.7">(${currentDifficulty})</span>`;
  // Add click handlers
  $('#coloringSvg').querySelectorAll('path,circle,ellipse,rect,polygon').forEach(el=>{
    el.addEventListener('click',()=>{
      saveUndo();
      if(tool==='eraser')el.setAttribute('fill','#ffffff');
      else el.setAttribute('fill',currentColor);
      saveColorState();
    });
  });
  renderPageGrid(document.querySelector('.cat-tab.active').dataset.cat);
}

function saveUndo(){
  const els=$('#coloringSvg').querySelectorAll('path,circle,ellipse,rect,polygon');
  undoStack.push([...els].map(e=>e.getAttribute('fill')));
  if(undoStack.length>30)undoStack.shift();
  redoStack=[];
}

function saveColorState(){
  if(!currentPage)return;
  const els=$('#coloringSvg').querySelectorAll('.colorable');
  colorState[currentPage.id]=[...els].map(e=>e.getAttribute('fill'));
  localStorage.setItem('qu_coloring_state', JSON.stringify(colorState));
  
  const allColored=[...els].every(e=>{
      const f = e.getAttribute('fill');
      return f && f!=='#fff' && f!=='#ffffff' && f!=='white' && f!=='none';
  });
  if(allColored&&!completed.includes(currentPage.id)){
    completed.push(currentPage.id);
    localStorage.setItem('qu_coloring_done', JSON.stringify(completed));
    if(typeof QU!=='undefined')QU.showToast('🎉 Page completed!','success');
    renderPageGrid(document.querySelector('.cat-tab.active').dataset.cat);
  }
}

// Color palette
$('#palette').innerHTML=COLORS.map((c,i)=>`<div class="color-swatch${i===0?' active':''}" style="background:${c}" data-color="${c}"></div>`).join('');
$$('.color-swatch').forEach(s=>s.addEventListener('click',()=>{
  $$('.color-swatch').forEach(x=>x.classList.remove('active'));
  s.classList.add('active');currentColor=s.dataset.color;tool='fill';
  $('#fillTool').classList.add('tool-active');$('#eraserTool').classList.remove('tool-active');
}));

$('#fillTool').addEventListener('click',()=>{tool='fill';$('#fillTool').classList.add('tool-active');$('#eraserTool').classList.remove('tool-active');});
$('#eraserTool').addEventListener('click',()=>{tool='eraser';$('#eraserTool').classList.add('tool-active');$('#fillTool').classList.remove('tool-active');});

$('#undoTool').addEventListener('click',()=>{
  if(!undoStack.length||!currentPage)return;
  const els=$('#coloringSvg').querySelectorAll('.colorable');
  redoStack.push([...els].map(e=>e.getAttribute('fill')));
  const prev=undoStack.pop();
  els.forEach((el,i)=>{if(prev[i])el.setAttribute('fill',prev[i]);});
  saveColorState();
});

$('#redoTool').addEventListener('click',()=>{
  if(!redoStack.length||!currentPage)return;
  const els=$('#coloringSvg').querySelectorAll('.colorable');
  undoStack.push([...els].map(e=>e.getAttribute('fill')));
  const next=redoStack.pop();
  els.forEach((el,i)=>{if(next[i])el.setAttribute('fill',next[i]);});
  saveColorState();
});

// Difficulty Selector integration
const diffSelect = document.createElement('select');
diffSelect.className = 'btn btn-sm btn-secondary';
diffSelect.innerHTML = '<option value="simple">Simple (Kids)</option><option value="standard" selected>Standard</option><option value="complex">Complex (Adults)</option>';
diffSelect.style.marginLeft = '10px';
diffSelect.addEventListener('change', (e) => {
    currentDifficulty = e.target.value;
    if(currentPage) loadPage(currentPage.id);
});
$('.tools-row').appendChild(diffSelect);

$('#resetPageBtn').addEventListener('click',()=>{
  if(!currentPage||!confirm('Reset this page?'))return;
  delete colorState[currentPage.id];
  const idx=completed.indexOf(currentPage.id);
  if(idx>=0)completed.splice(idx,1);
  localStorage.setItem('qu_coloring_state',JSON.stringify(colorState));
  localStorage.setItem('qu_coloring_done',JSON.stringify(completed));
  loadPage(currentPage.id);
});

// PNG Export
$('#exportPdfBtn').addEventListener('click',()=>{
  if(!currentPage){if(typeof QU!=='undefined')QU.showToast('Select a page first','error');return;}
  const svgEl=$('#coloringSvg');
  const data=new XMLSerializer().serializeToString(svgEl);
  const cvs=document.createElement('canvas');cvs.width=1000;cvs.height=1000;
  const c=cvs.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,1000,1000);
  const img=new Image();
  img.onload=()=>{c.drawImage(img,0,0,1000,1000);
    const link=document.createElement('a');link.download=`coloring-${currentPage.name.replace(/\s/g,'-')}.png`;
    link.href=cvs.toDataURL('image/png');link.click();
    if(typeof QU!=='undefined')QU.showToast('Page exported as PNG!','success');
  };
  img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(data)));
});

// PDF Print Export
const printBtn=$('#printPdfBtn');
if(printBtn) printBtn.addEventListener('click',()=>{
  if(!currentPage){if(typeof QU!=='undefined')QU.showToast('Select a page first','error');return;}
  const svgEl=$('#coloringSvg');
  const data=new XMLSerializer().serializeToString(svgEl);
  const win=window.open('','_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Coloring Page - ${currentPage.name}</title><style>@page{size:A4;margin:1cm}body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fff}svg{max-width:100%;max-height:90vh}h2{text-align:center;font-family:sans-serif}</style></head><body><div><h2>${currentPage.name}</h2>${data}</div><script>setTimeout(()=>{window.print();window.close()},500)<\/script></body></html>`);
  win.document.close();
});

// Load saved state
try{colorState=JSON.parse(localStorage.getItem('qu_coloring_state'))||{};}catch{colorState={};}

renderPageGrid();
loadPage(0);
if(typeof QU!=='undefined')QU.init({kofi:true,discover:true});
})();
