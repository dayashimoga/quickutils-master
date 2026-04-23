(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ── Chemistry Data ──
const ELEMENTS = [
  {id:'H',name:'Hydrogen',cat:'gas',color:'#3b82f6'},{id:'He',name:'Helium',cat:'gas',color:'#8b5cf6'},
  {id:'O',name:'Oxygen',cat:'gas',color:'#ef4444'},{id:'N',name:'Nitrogen',cat:'gas',color:'#06b6d4'},
  {id:'C',name:'Carbon',cat:'nonmetal',color:'#6b7280'},{id:'Na',name:'Sodium',cat:'metal',color:'#f59e0b'},
  {id:'Cl',name:'Chlorine',cat:'gas',color:'#22c55e'},{id:'Fe',name:'Iron',cat:'metal',color:'#78716c'},
  {id:'Cu',name:'Copper',cat:'metal',color:'#f97316'},{id:'Zn',name:'Zinc',cat:'metal',color:'#a1a1aa'},
  {id:'Ag',name:'Silver',cat:'metal',color:'#d4d4d8'},{id:'Au',name:'Gold',cat:'metal',color:'#eab308'},
  {id:'Ca',name:'Calcium',cat:'metal',color:'#e2e8f0'},{id:'K',name:'Potassium',cat:'metal',color:'#c084fc'},
  {id:'S',name:'Sulfur',cat:'nonmetal',color:'#facc15'},{id:'P',name:'Phosphorus',cat:'nonmetal',color:'#f43f5e'},
  {id:'Mg',name:'Magnesium',cat:'metal',color:'#a3e635'},{id:'Al',name:'Aluminum',cat:'metal',color:'#94a3b8'},
];

const COMPOUNDS = [
  {id:'H2O',name:'Water',cat:'compound',color:'#3b82f6'},{id:'HCl',name:'Hydrochloric Acid',cat:'acid',color:'#ef4444'},
  {id:'NaOH',name:'Sodium Hydroxide',cat:'base',color:'#8b5cf6'},{id:'H2SO4',name:'Sulfuric Acid',cat:'acid',color:'#dc2626'},
  {id:'NaCl',name:'Table Salt',cat:'compound',color:'#e2e8f0'},{id:'CO2',name:'Carbon Dioxide',cat:'gas',color:'#6b7280'},
  {id:'NH3',name:'Ammonia',cat:'base',color:'#06b6d4'},{id:'CaCO3',name:'Calcium Carbonate',cat:'compound',color:'#fafafa'},
  {id:'CH4',name:'Methane',cat:'gas',color:'#22c55e'},{id:'C2H5OH',name:'Ethanol',cat:'compound',color:'#f59e0b'},
];

// ── Reaction Database ──
const REACTIONS = [
  {reactants:['H','O'],equation:'2H₂ + O₂ → 2H₂O',product:'Water',type:'Combustion',desc:'Hydrogen burns in oxygen with a clean flame, producing water. This reaction powers hydrogen fuel cells.',color:'#3b82f6',ph:7,exothermic:true},
  {reactants:['Na','Cl'],equation:'2Na + Cl₂ → 2NaCl',product:'Sodium Chloride (Table Salt)',type:'Synthesis',desc:'Sodium metal reacts violently with chlorine gas, producing a bright yellow flame and forming common table salt.',color:'#e2e8f0',ph:7,exothermic:true},
  {reactants:['Na','H2O'],equation:'2Na + 2H₂O → 2NaOH + H₂↑',product:'Sodium Hydroxide + Hydrogen Gas',type:'Single Displacement',desc:'Sodium reacts explosively with water, generating hydrogen gas and a strong base. The hydrogen may ignite!',color:'#8b5cf6',ph:14,exothermic:true},
  {reactants:['Fe','O'],equation:'4Fe + 3O₂ → 2Fe₂O₃',product:'Iron Oxide (Rust)',type:'Oxidation',desc:'Iron slowly reacts with oxygen in the presence of moisture to form rust — a brown, flaky oxide.',color:'#92400e',ph:7,exothermic:false},
  {reactants:['HCl','NaOH'],equation:'HCl + NaOH → NaCl + H₂O',product:'Salt + Water',type:'Neutralization',desc:'A classic acid-base neutralization. The strong acid and strong base completely neutralize each other, producing salt and water.',color:'#e2e8f0',ph:7,exothermic:true},
  {reactants:['Ca','H2O'],equation:'Ca + 2H₂O → Ca(OH)₂ + H₂↑',product:'Calcium Hydroxide + Hydrogen',type:'Single Displacement',desc:'Calcium reacts steadily with water, less violently than sodium, producing a milky solution of lime water.',color:'#f0f0f0',ph:12,exothermic:true},
  {reactants:['Cu','HCl'],equation:'Cu + HCl → No Reaction',product:'No Reaction',type:'None',desc:'Copper is less reactive than hydrogen, so it cannot displace hydrogen from hydrochloric acid. No reaction occurs!',color:'#f97316',ph:1,exothermic:false},
  {reactants:['Zn','HCl'],equation:'Zn + 2HCl → ZnCl₂ + H₂↑',product:'Zinc Chloride + Hydrogen Gas',type:'Single Displacement',desc:'Zinc is more reactive than hydrogen and displaces it from the acid. Bubbles of hydrogen gas are produced.',color:'#a1a1aa',ph:4,exothermic:true},
  {reactants:['CaCO3','HCl'],equation:'CaCO3 + 2HCl → CaCl₂ + H₂O + CO₂↑',product:'Calcium Chloride + Water + Carbon Dioxide',type:'Double Displacement',desc:'Limestone reacts with acid producing vigorous fizzing as carbon dioxide gas escapes. Used in antacid tablets!',color:'#e2e8f0',ph:5,exothermic:false},
  {reactants:['Mg','O'],equation:'2Mg + O₂ → 2MgO',product:'Magnesium Oxide',type:'Combustion',desc:'Magnesium burns with a brilliant white flame so bright it can cause eye damage. Used in fireworks and flares.',color:'#fafafa',ph:10,exothermic:true},
  {reactants:['H2SO4','NaOH'],equation:'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O',product:'Sodium Sulfate + Water',type:'Neutralization',desc:'A strong acid-base reaction producing sodium sulfate. The reaction generates significant heat.',color:'#e2e8f0',ph:7,exothermic:true},
  {reactants:['C','O'],equation:'C + O₂ → CO₂',product:'Carbon Dioxide',type:'Combustion',desc:'Carbon burns in oxygen producing carbon dioxide gas and heat. This is the fundamental reaction of burning fossil fuels.',color:'transparent',ph:5,exothermic:true},
  {reactants:['Fe','HCl'],equation:'Fe + 2HCl → FeCl₂ + H₂↑',product:'Iron(II) Chloride + Hydrogen',type:'Single Displacement',desc:'Iron reacts slowly with hydrochloric acid, producing a pale green solution and hydrogen bubbles.',color:'#86efac',ph:3,exothermic:true},
  {reactants:['K','H2O'],equation:'2K + 2H₂O → 2KOH + H₂↑',product:'Potassium Hydroxide + Hydrogen',type:'Single Displacement',desc:'Potassium reacts violently with water, more energetically than sodium. The hydrogen produced often ignites with a lilac flame!',color:'#c084fc',ph:14,exothermic:true},
  {reactants:['Al','O'],equation:'4Al + 3O₂ → 2Al₂O₃',product:'Aluminum Oxide',type:'Combustion',desc:'Aluminum burns with an extremely hot, white flame. Thermite (aluminum + iron oxide) uses this property.',color:'#f0f0f0',ph:7,exothermic:true},
  {reactants:['NH3','HCl'],equation:'NH₃ + HCl → NH₄Cl',product:'Ammonium Chloride',type:'Synthesis',desc:'Ammonia gas reacts with hydrogen chloride gas to form a white smoke of ammonium chloride crystals.',color:'#f0f0f0',ph:5,exothermic:true},
  {reactants:['Ag','S'],equation:'2Ag + S → Ag₂S',product:'Silver Sulfide (Tarnish)',type:'Synthesis',desc:'Silver reacts with sulfur compounds in the air, forming a black layer of silver sulfide — this is why silver tarnishes.',color:'#1f2937',ph:7,exothermic:false},
  {reactants:['C2H5OH','O'],equation:'C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O',product:'Carbon Dioxide + Water',type:'Combustion',desc:'Ethanol burns with a clean blue flame. This is why alcohol is used as fuel and in spirit burners.',color:'#3b82f6',ph:7,exothermic:true},
];

// ── State ──
let beakerContents = [];
let temperature = 25;
let reactionChart = null;

// ── Chart Initialization ──
function initChart() {
    const ctx = document.getElementById('reactionChart').getContext('2d');
    reactionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['0s'],
            datasets: [
                { label: 'Temperature (°C)', data: [25], borderColor: '#f59e0b', yAxisID: 'y' },
                { label: 'pH Level', data: [7.0], borderColor: '#06b6d4', yAxisID: 'y1' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { type: 'linear', display: true, position: 'left', title: {display:true, text:'Temp (°C)', color:'#888'}, min: 0, max: 1000 },
                y1: { type: 'linear', display: true, position: 'right', title: {display:true, text:'pH', color:'#888'}, min: 0, max: 14, grid: {drawOnChartArea: false} }
            },
            plugins: { legend: { labels: { color: '#fff' } } }
        }
    });
}
function updateChart(temp, ph) {
    if (!reactionChart) return;
    const timeLabel = (reactionChart.data.labels.length * 2) + 's';
    reactionChart.data.labels.push(timeLabel);
    reactionChart.data.datasets[0].data.push(temp);
    reactionChart.data.datasets[1].data.push(ph);
    if(reactionChart.data.labels.length > 20) {
        reactionChart.data.labels.shift();
        reactionChart.data.datasets[0].data.shift();
        reactionChart.data.datasets[1].data.shift();
    }
    reactionChart.update();
}

// ── Render Element Chips ──
function renderElements() {
  const grid = $('#elementGrid');
  grid.innerHTML = ELEMENTS.map(e =>
    `<div class="element-chip" draggable="true" data-id="${e.id}" data-cat="${e.cat}" title="${e.name}">${e.id}</div>`
  ).join('');
  const cgrid = $('#compoundGrid');
  cgrid.innerHTML = COMPOUNDS.map(e =>
    `<div class="element-chip" draggable="true" data-id="${e.id}" data-cat="${e.cat}" title="${e.name}">${e.id}</div>`
  ).join('');
  // Drag events
  $$('.element-chip').forEach(chip => {
    chip.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', chip.dataset.id); chip.classList.add('dragging'); });
    chip.addEventListener('dragend', () => chip.classList.remove('dragging'));
    chip.addEventListener('click', () => addToBeaker(chip.dataset.id));
  });
}

// ── Beaker ──
const beaker = $('#beaker');
beaker.addEventListener('dragover', e => { e.preventDefault(); beaker.style.borderColor = 'var(--accent)'; });
beaker.addEventListener('dragleave', () => { beaker.style.borderColor = ''; });
beaker.addEventListener('drop', e => {
  e.preventDefault();
  beaker.style.borderColor = '';
  const id = e.dataTransfer.getData('text/plain');
  addToBeaker(id);
});

function addToBeaker(id) {
  if (beakerContents.length >= 5) return; // Max 5 items
  beakerContents.push(id);
  updateBeakerVisuals();
}

function clearBeaker() {
  beakerContents = [];
  updateBeakerVisuals();
  $('#reactionResult').style.display = 'none';
}

function updateBeakerVisuals() {
  const liquid = $('#beakerLiquid');
  const label = $('#beakerLabel');
  const contents = $('#beakerContents');
  
  if (beakerContents.length === 0) {
    liquid.style.height = '0%';
    label.textContent = 'Drop elements here';
    beaker.classList.remove('has-contents');
    contents.innerHTML = '';
    return;
  }
  
  beaker.classList.add('has-contents');
  label.textContent = '';
  liquid.style.height = Math.min(70, beakerContents.length * 18) + '%';
  
  // Color based on contents
  const allItems = [...ELEMENTS, ...COMPOUNDS];
  const colors = beakerContents.map(id => {
    const item = allItems.find(e => e.id === id);
    return item ? item.color : '#888';
  });
  liquid.style.background = colors.length === 1 ? colors[0] + '80' :
    `linear-gradient(180deg, ${colors.map((c, i) => c + '80 ' + (i * 100 / colors.length) + '%').join(', ')})`;
  
  contents.innerHTML = beakerContents.map(id => `<span class="chip">${id}</span>`).join('');
}

// ── React ──
function react() {
  if (beakerContents.length < 2) return;
  
  // Find matching reaction
  const reaction = REACTIONS.find(r => {
    const rSet = [...r.reactants].sort();
    const bSet = [...new Set(beakerContents)].sort();
    return rSet.length === bSet.length && rSet.every((v, i) => v === bSet[i]);
  });
  
  const result = $('#reactionResult');
  result.style.display = 'block';
  
  if (!reaction) {
    $('#reactionEquation').innerHTML = '❌ No known reaction';
    $('#reactionDescription').textContent = `No documented reaction between ${beakerContents.join(' + ')}. Try a different combination!`;
    $('#reactionType').textContent = '';
    $('#reactionAnimation').innerHTML = '';
    return;
  }
  
  // Show reaction
  $('#reactionEquation').innerHTML = reaction.equation.replace(/([₂₃₄₅₆₇₈₉])/g, '<sub>$1</sub>');
  $('#reactionDescription').innerHTML = `<strong>${reaction.product}</strong><br>${reaction.desc}`;
  $('#reactionType').textContent = reaction.type + (reaction.exothermic ? ' 🔥 Exothermic' : ' ❄️ Endothermic');
  
  // pH update
  updatePh(reaction.ph);
  
  // Liquid color
  $('#beakerLiquid').style.background = reaction.color + '80';
  
  // Bubbles
  if (reaction.equation.includes('↑')) {
    spawnBubbles();
  }
  
  // Animation
  const anim = $('#reactionAnimation');
  if (reaction.exothermic) {
    anim.innerHTML = Array.from({length: 8}, (_, i) =>
      `<div class="spark" style="background:${['#ef4444', '#f59e0b', '#eab308'][i % 3]};animation-delay:${i * 0.1}s"></div>`
    ).join('');
    
    // Animate temp spike on graph
    let currentTemp = temperature;
    let targetTemp = temperature + 200;
    let step = 0;
    const interval = setInterval(() => {
        currentTemp += (targetTemp - currentTemp) * 0.2;
        updateChart(currentTemp, reaction.ph);
        step++;
        if(step > 10) clearInterval(interval);
    }, 200);

  } else {
    anim.innerHTML = '<span style="font-size:2rem">🧊</span>';
    // Animate temp drop on graph
    let currentTemp = temperature;
    let targetTemp = Math.max(0, temperature - 15);
    let step = 0;
    const interval = setInterval(() => {
        currentTemp += (targetTemp - currentTemp) * 0.2;
        updateChart(currentTemp, reaction.ph);
        step++;
        if(step > 10) clearInterval(interval);
    }, 200);
  }
  
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function spawnBubbles() {
  const container = $('#bubbles');
  container.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const b = document.createElement('div');
    b.className = 'bubble';
    b.style.left = Math.random() * 80 + 10 + '%';
    b.style.animationDelay = Math.random() * 2 + 's';
    b.style.animationDuration = 1.5 + Math.random() + 's';
    b.style.width = b.style.height = (4 + Math.random() * 8) + 'px';
    container.appendChild(b);
  }
  setTimeout(() => container.innerHTML = '', 5000);
}

function updatePh(ph) {
  $('#phDisplay').textContent = ph.toFixed(1);
  $('#phIndicator').style.left = (ph / 14 * 100) + '%';
}

// ── Temperature ──
$('#tempSlider').addEventListener('input', e => {
  temperature = parseInt(e.target.value);
  $('#tempDisplay').textContent = temperature + '°C';
  updateChart(temperature, parseFloat($('#phDisplay').textContent));
});

$('#heatBtn').addEventListener('click', () => {
  temperature = Math.min(1000, temperature + 50);
  $('#tempSlider').value = temperature;
  $('#tempDisplay').textContent = temperature + '°C';
  
  // Show visual flame under beaker
  const beaker = $('#beaker');
  let flame = $('#burnerFlame');
  if(!flame) {
      flame = document.createElement('div');
      flame.id = 'burnerFlame';
      flame.style.cssText = 'position:absolute; bottom:-30px; left:50%; transform:translateX(-50%); width:40px; height:40px; background:radial-gradient(circle, #f59e0b 20%, #ef4444 60%, transparent 100%); filter:blur(4px); border-radius:50% 50% 20% 20%; animation:flicker 0.2s infinite alternate; opacity:0.8; transition: opacity 0.5s; pointer-events:none; z-index:10;';
      beaker.appendChild(flame);
      // add keyframes dynamically if not exists
      if(!$('#flameStyles')) {
          const style = document.createElement('style');
          style.id = 'flameStyles';
          style.textContent = `@keyframes flicker { 0% { transform:translateX(-50%) scaleY(1); opacity:0.8; } 100% { transform:translateX(-50%) scaleY(1.3) scaleX(0.9); opacity:1; } }`;
          document.head.appendChild(style);
      }
  } else {
      flame.style.opacity = '1';
  }
  
  // Fade out flame after a bit
  clearTimeout(window.flameTimeout);
  window.flameTimeout = setTimeout(() => {
      if(flame) flame.style.opacity = '0';
  }, 2000);

  updateChart(temperature, parseFloat($('#phDisplay').textContent));

  if (beakerContents.length >= 2) react();
});

// ── Equation Balancer ──
function balanceEquation(input) {
  // Simple common balancing lookup
  const BALANCED = {
    'h2+o2=h2o': '2H₂ + O₂ → 2H₂O',
    'na+cl2=nacl': '2Na + Cl₂ → 2NaCl',
    'fe+o2=fe2o3': '4Fe + 3O₂ → 2Fe₂O₃',
    'c+o2=co2': 'C + O₂ → CO₂',
    'n2+h2=nh3': 'N₂ + 3H₂ → 2NH₃',
    'na+h2o=naoh+h2': '2Na + 2H₂O → 2NaOH + H₂',
    'mg+o2=mgo': '2Mg + O₂ → 2MgO',
    'al+o2=al2o3': '4Al + 3O₂ → 2Al₂O₃',
    'hcl+naoh=nacl+h2o': 'HCl + NaOH → NaCl + H₂O',
    'h2so4+naoh=na2so4+h2o': 'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O',
    'caco3+hcl=cacl2+h2o+co2': 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂',
    'ch4+o2=co2+h2o': 'CH₄ + 2O₂ → CO₂ + 2H₂O',
    'c2h5oh+o2=co2+h2o': 'C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O',
    'fe+hcl=fecl2+h2': 'Fe + 2HCl → FeCl₂ + H₂',
    'zn+hcl=zncl2+h2': 'Zn + 2HCl → ZnCl₂ + H₂',
    'k+h2o=koh+h2': '2K + 2H₂O → 2KOH + H₂',
    'ca+h2o=caoh2+h2': 'Ca + 2H₂O → Ca(OH)₂ + H₂',
    'nh3+hcl=nh4cl': 'NH₃ + HCl → NH₄Cl',
    'ag+s=ag2s': '2Ag + S → Ag₂S',
  };
  
  const clean = input.toLowerCase().replace(/\s+/g,'').replace(/→|->|=/g,'=').replace(/[₂₃₄₅₆₇₈₉]+/g, m => {
    const map = {'₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9'};
    return [...m].map(c => map[c] || c).join('');
  });
  
  return BALANCED[clean] || null;
}

$('#balanceBtn').addEventListener('click', () => {
  const input = $('#eqInput').value.trim();
  if (!input) return;
  const result = balanceEquation(input);
  const el = $('#balancedResult');
  if (result) {
    el.innerHTML = `<span style="color:var(--accent);font-size:0.8rem">✅ Balanced:</span>&nbsp; ${result.replace(/(\d+)([A-Z])/g, '<span class="coeff">$1</span>$2')}`;
  } else {
    el.innerHTML = `<span style="color:#ef4444">Could not auto-balance. Try a simpler equation like: H2 + O2 = H2O</span>`;
  }
});

// ── pH Scale ──
const PH_DATA = [
  {ph:0,name:'Battery Acid',color:'#dc2626'},{ph:1,name:'Stomach Acid',color:'#ef4444'},
  {ph:2,name:'Lemon Juice',color:'#f97316'},{ph:3,name:'Vinegar',color:'#f59e0b'},
  {ph:4,name:'Tomato Juice',color:'#eab308'},{ph:5,name:'Coffee',color:'#84cc16'},
  {ph:6,name:'Milk',color:'#22c55e'},{ph:7,name:'Pure Water',color:'#10b981'},
  {ph:8,name:'Sea Water',color:'#14b8a6'},{ph:9,name:'Baking Soda',color:'#06b6d4'},
  {ph:10,name:'Milk of Magnesia',color:'#0ea5e9'},{ph:11,name:'Ammonia',color:'#3b82f6'},
  {ph:12,name:'Soapy Water',color:'#6366f1'},{ph:13,name:'Bleach',color:'#8b5cf6'},
  {ph:14,name:'Drain Cleaner',color:'#a855f7'}
];

function renderPhScale() {
  const scale = $('#phScale');
  scale.innerHTML = PH_DATA.map(d => `<div class="ph-block" style="background:${d.color}" data-ph="${d.ph}" title="pH ${d.ph}: ${d.name}">${d.ph}</div>`).join('');
  scale.addEventListener('click', e => {
    const block = e.target.closest('.ph-block');
    if (block) {
      const d = PH_DATA[parseInt(block.dataset.ph)];
      $('#phInfo').innerHTML = `<strong>pH ${d.ph}: ${d.name}</strong> — ${d.ph < 7 ? '🔴 Acidic' : d.ph === 7 ? '🟢 Neutral' : '🔵 Basic (Alkaline)'}`;
    }
  });
}

// ── Events ──
$('#reactBtn').addEventListener('click', react);
$('#clearBeakerBtn').addEventListener('click', clearBeaker);

// Theme
if (typeof QU !== 'undefined') { QU.initTheme(); }
else {
  $('#themeBtn').addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.dataset.theme === 'dark';
    html.dataset.theme = isDark ? 'light' : 'dark';
    $('#themeBtn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', html.dataset.theme);
  });
  if (localStorage.getItem('theme') === 'light') { document.documentElement.dataset.theme = 'light'; $('#themeBtn').textContent = '☀️'; }
}

// ── 3D Molecule Viewer ──
const ATOM_COLORS = {H:'#ffffff',C:'#333333',N:'#3050F8',O:'#FF0D0D',S:'#FFFF30',P:'#FF8000',Cl:'#1FF01F',Na:'#AB5CF2',Fe:'#E06633',Ca:'#3DFF00',K:'#8F40D4',Mg:'#8AFF00',Al:'#BFA6A6',Cu:'#C88033',Zn:'#7D80B0',Ag:'#C0C0C0',Au:'#FFD123'};
const ATOM_RADII = {H:0.31,C:0.77,N:0.75,O:0.73,S:1.02,P:1.06,Cl:0.99,Na:1.54,Fe:1.24,Ca:1.97,K:2.03,Mg:1.36,Al:1.18,Cu:1.28,Zn:1.33,Ag:1.44,Au:1.44};
const ATOMIC_MASS = {H:1.008,He:4.003,C:12.011,N:14.007,O:15.999,S:32.06,P:30.974,Cl:35.45,Na:22.990,Fe:55.845,Ca:40.078,K:39.098,Mg:24.305,Al:26.982,Cu:63.546,Zn:65.38,Ag:107.868,Au:196.967,F:18.998,Br:79.904,I:126.904,Si:28.086,B:10.81,Li:6.941,Be:9.012,Mn:54.938,Co:58.933,Ni:58.693,Ti:47.867,Cr:51.996,Se:78.971,As:74.922};
const VALENCE = {H:1,C:4,N:3,O:2,S:2,P:3,Cl:1,Na:1,Fe:2,Ca:2,K:1,Mg:2,Al:3,Cu:2,Zn:2,Ag:1,Au:3};

const MOLECULE_DB = {
  H2O: {name:'Water',formula:'H₂O',mass:18.015,atoms:[{el:'O',x:0,y:0,z:0},{el:'H',x:0.76,y:0.59,z:0},{el:'H',x:-0.76,y:0.59,z:0}],bonds:[[0,1,1],[0,2,1]]},
  CH4: {name:'Methane',formula:'CH₄',mass:16.043,atoms:[{el:'C',x:0,y:0,z:0},{el:'H',x:0.63,y:0.63,z:0.63},{el:'H',x:-0.63,y:-0.63,z:0.63},{el:'H',x:-0.63,y:0.63,z:-0.63},{el:'H',x:0.63,y:-0.63,z:-0.63}],bonds:[[0,1,1],[0,2,1],[0,3,1],[0,4,1]]},
  CO2: {name:'Carbon Dioxide',formula:'CO₂',mass:44.01,atoms:[{el:'C',x:0,y:0,z:0},{el:'O',x:-1.16,y:0,z:0},{el:'O',x:1.16,y:0,z:0}],bonds:[[0,1,2],[0,2,2]]},
  NH3: {name:'Ammonia',formula:'NH₃',mass:17.031,atoms:[{el:'N',x:0,y:0,z:0},{el:'H',x:0.94,y:0.38,z:0},{el:'H',x:-0.47,y:0.38,z:0.81},{el:'H',x:-0.47,y:0.38,z:-0.81}],bonds:[[0,1,1],[0,2,1],[0,3,1]]},
  C2H5OH: {name:'Ethanol',formula:'C₂H₅OH',mass:46.069,atoms:[{el:'C',x:0,y:0,z:0},{el:'C',x:1.52,y:0,z:0},{el:'O',x:2.28,y:1.1,z:0},{el:'H',x:-0.36,y:1.02,z:0},{el:'H',x:-0.36,y:-0.51,z:0.88},{el:'H',x:-0.36,y:-0.51,z:-0.88},{el:'H',x:1.88,y:-0.51,z:0.88},{el:'H',x:1.88,y:-0.51,z:-0.88},{el:'H',x:3.14,y:0.9,z:0}],bonds:[[0,1,1],[1,2,1],[0,3,1],[0,4,1],[0,5,1],[1,6,1],[1,7,1],[2,8,1]]},
  C6H6: {name:'Benzene',formula:'C₆H₆',mass:78.114,atoms:[{el:'C',x:1.4,y:0,z:0},{el:'C',x:0.7,y:1.21,z:0},{el:'C',x:-0.7,y:1.21,z:0},{el:'C',x:-1.4,y:0,z:0},{el:'C',x:-0.7,y:-1.21,z:0},{el:'C',x:0.7,y:-1.21,z:0},{el:'H',x:2.48,y:0,z:0},{el:'H',x:1.24,y:2.15,z:0},{el:'H',x:-1.24,y:2.15,z:0},{el:'H',x:-2.48,y:0,z:0},{el:'H',x:-1.24,y:-2.15,z:0},{el:'H',x:1.24,y:-2.15,z:0}],bonds:[[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],[0,6,1],[1,7,1],[2,8,1],[3,9,1],[4,10,1],[5,11,1]]},
  NaCl: {name:'Sodium Chloride',formula:'NaCl',mass:58.44,atoms:[{el:'Na',x:0,y:0,z:0},{el:'Cl',x:2.36,y:0,z:0},{el:'Na',x:2.36,y:2.36,z:0},{el:'Cl',x:0,y:2.36,z:0}],bonds:[[0,1,1],[1,2,1],[2,3,1],[3,0,1]]},
  O2: {name:'Oxygen',formula:'O₂',mass:32.0,atoms:[{el:'O',x:-0.6,y:0,z:0},{el:'O',x:0.6,y:0,z:0}],bonds:[[0,1,2]]}
};

let molScene, molCamera, molRenderer, molControls, molGroup;
let labelSprites = [];

function initMoleculeViewer() {
  const container = $('#moleculeViewer3D');
  if (!container || typeof THREE === 'undefined') return;
  molScene = new THREE.Scene();
  molCamera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
  molCamera.position.set(0, 0, 8);
  molRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  molRenderer.setSize(container.clientWidth, container.clientHeight);
  molRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(molRenderer.domElement);
  molControls = new THREE.OrbitControls(molCamera, molRenderer.domElement);
  molControls.enableDamping = true;
  molControls.dampingFactor = 0.08;
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  molScene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 5, 5);
  molScene.add(dirLight);
  const dirLight2 = new THREE.DirectionalLight(0x8888ff, 0.3);
  dirLight2.position.set(-3, -3, -3);
  molScene.add(dirLight2);
  molGroup = new THREE.Group();
  molScene.add(molGroup);
  function animate() { requestAnimationFrame(animate); if ($('#autoRotate') && $('#autoRotate').checked) molGroup.rotation.y += 0.005; molControls.update(); molRenderer.render(molScene, molCamera); }
  animate();
  window.addEventListener('resize', () => { if (!molRenderer || !container.clientWidth) return; molCamera.aspect = container.clientWidth / container.clientHeight; molCamera.updateProjectionMatrix(); molRenderer.setSize(container.clientWidth, container.clientHeight); });
  loadMolecule($('#moleculeSelect').value);
}

function makeTextSprite(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 36px Inter, sans-serif';
  ctx.fillStyle = color || '#ffffff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 32);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.2, 0.6, 1);
  return sprite;
}

function loadMolecule(key) {
  if (!molGroup) return;
  while (molGroup.children.length) molGroup.remove(molGroup.children[0]);
  labelSprites = [];
  const mol = MOLECULE_DB[key];
  if (!mol) return;
  const showBonds = $('#showBonds') ? $('#showBonds').checked : true;
  const showLabels = $('#showLabels') ? $('#showLabels').checked : true;
  // Atoms
  mol.atoms.forEach((a, i) => {
    const r = (ATOM_RADII[a.el] || 0.7) * 0.4;
    const geo = new THREE.SphereGeometry(r, 24, 24);
    const mat = new THREE.MeshPhongMaterial({ color: ATOM_COLORS[a.el] || '#888888', shininess: 80, specular: 0x444444 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(a.x, a.y, a.z);
    molGroup.add(mesh);
    if (showLabels) {
      const sprite = makeTextSprite(a.el, ATOM_COLORS[a.el] || '#fff');
      sprite.position.set(a.x, a.y + r + 0.35, a.z);
      molGroup.add(sprite);
      labelSprites.push(sprite);
    }
  });
  // Bonds
  if (showBonds) {
    mol.bonds.forEach(([i, j, order]) => {
      const a1 = mol.atoms[i], a2 = mol.atoms[j];
      const p1 = new THREE.Vector3(a1.x, a1.y, a1.z);
      const p2 = new THREE.Vector3(a2.x, a2.y, a2.z);
      const dir = new THREE.Vector3().subVectors(p2, p1);
      const len = dir.length();
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      for (let k = 0; k < order; k++) {
        const offset = (k - (order - 1) / 2) * 0.1;
        const bondGeo = new THREE.CylinderGeometry(0.06, 0.06, len, 8);
        const bondMat = new THREE.MeshPhongMaterial({ color: 0x999999, shininess: 30 });
        const bond = new THREE.Mesh(bondGeo, bondMat);
        bond.position.copy(mid);
        const perp = new THREE.Vector3(0, 0, 1).cross(dir.clone().normalize()).normalize().multiplyScalar(offset);
        bond.position.add(perp);
        bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        molGroup.add(bond);
      }
    });
  }
  // Info
  const info = $('#moleculeInfo');
  if (info) info.innerHTML = `<strong>${mol.name}</strong> (${mol.formula}) — Molar Mass: ${mol.mass.toFixed(3)} g/mol — ${mol.atoms.length} atoms, ${mol.bonds.length} bonds`;
}

if ($('#moleculeSelect')) {
  $('#moleculeSelect').addEventListener('change', e => loadMolecule(e.target.value));
  if ($('#showLabels')) $('#showLabels').addEventListener('change', () => loadMolecule($('#moleculeSelect').value));
  if ($('#showBonds')) $('#showBonds').addEventListener('change', () => loadMolecule($('#moleculeSelect').value));
}

// ── Compound Builder ──
let builderAtoms = [];
let builderBonds = [];
let selectedBondType = 1;
let selectedAtomForBond = null;
let dragAtomIdx = -1;

function initCompoundBuilder() {
  const canvas = $('#builderCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const chipContainer = $('#atomChips');
  if (chipContainer) {
    const builderElements = ['H','C','N','O','S','P','Cl','Na','Fe','Ca','K'];
    chipContainer.innerHTML = builderElements.map(el =>
      `<div class="element-chip builder-atom" data-el="${el}" style="cursor:pointer;" title="Click then click canvas to place">${el}</div>`
    ).join('');
    let selectedEl = null;
    chipContainer.addEventListener('click', e => {
      const chip = e.target.closest('.builder-atom');
      if (!chip) return;
      $$('.builder-atom').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedEl = chip.dataset.el;
    });
    canvas.addEventListener('click', e => {
      if (selectedEl) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        // Check if clicking near existing atom for bonding
        const nearIdx = builderAtoms.findIndex(a => Math.hypot(a.x - x, a.y - y) < 25);
        if (nearIdx >= 0) {
          if (selectedAtomForBond !== null && selectedAtomForBond !== nearIdx) {
            builderBonds.push({ from: selectedAtomForBond, to: nearIdx, order: selectedBondType });
            selectedAtomForBond = null;
          } else {
            selectedAtomForBond = nearIdx;
          }
        } else {
          builderAtoms.push({ el: selectedEl, x, y });
          if (selectedAtomForBond !== null) {
            builderBonds.push({ from: selectedAtomForBond, to: builderAtoms.length - 1, order: selectedBondType });
            selectedAtomForBond = null;
          }
        }
        renderBuilder(ctx, canvas);
      } else {
        // Bond mode: click existing atoms to connect
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const nearIdx = builderAtoms.findIndex(a => Math.hypot(a.x - x, a.y - y) < 25);
        if (nearIdx >= 0) {
          if (selectedAtomForBond !== null && selectedAtomForBond !== nearIdx) {
            builderBonds.push({ from: selectedAtomForBond, to: nearIdx, order: selectedBondType });
            selectedAtomForBond = null;
          } else {
            selectedAtomForBond = nearIdx;
          }
          renderBuilder(ctx, canvas);
        }
      }
    });
  }
  // Bond type buttons
  $$('.bond-selector button').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.bond-selector button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedBondType = btn.dataset.bond === 'double' ? 2 : btn.dataset.bond === 'triple' ? 3 : 1;
    });
  });
  if ($('#clearBuilder')) $('#clearBuilder').addEventListener('click', () => { builderAtoms = []; builderBonds = []; selectedAtomForBond = null; renderBuilder(ctx, canvas); $('#builderStatus').innerHTML = ''; });
  if ($('#validateCompound')) $('#validateCompound').addEventListener('click', () => validateBuilderCompound());
  if ($('#view3DCompound')) $('#view3DCompound').addEventListener('click', () => viewBuilderIn3D());
  renderBuilder(ctx, canvas);
}

function renderBuilder(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  for (let x = 0; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
  for (let y = 0; y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
  // Draw bonds
  builderBonds.forEach(b => {
    const a1 = builderAtoms[b.from], a2 = builderAtoms[b.to];
    if (!a1 || !a2) return;
    const dx = a2.x - a1.x, dy = a2.y - a1.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    ctx.strokeStyle = 'rgba(200,200,200,0.7)';
    ctx.lineWidth = 2;
    for (let k = 0; k < b.order; k++) {
      const off = (k - (b.order - 1) / 2) * 5;
      ctx.beginPath();
      ctx.moveTo(a1.x + nx * off, a1.y + ny * off);
      ctx.lineTo(a2.x + nx * off, a2.y + ny * off);
      ctx.stroke();
    }
  });
  // Draw atoms
  builderAtoms.forEach((a, i) => {
    const r = 18;
    ctx.beginPath();
    ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(a.x - 4, a.y - 4, 2, a.x, a.y, r);
    gradient.addColorStop(0, ATOM_COLORS[a.el] || '#888');
    gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = i === selectedAtomForBond ? '#00ff88' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = i === selectedAtomForBond ? 3 : 1;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(a.el, a.x, a.y);
  });
  // Hint
  if (builderAtoms.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '16px Inter, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Select an atom from the palette, then click here to place it', canvas.width / 2, canvas.height / 2);
  }
}

function validateBuilderCompound() {
  const status = $('#builderStatus');
  if (builderAtoms.length < 2) { status.innerHTML = '<span style="color:#f59e0b">⚠️ Add at least 2 atoms to validate.</span>'; return; }
  let valid = true;
  const issues = [];
  builderAtoms.forEach((a, i) => {
    const bondCount = builderBonds.filter(b => b.from === i || b.to === i).reduce((sum, b) => sum + b.order, 0);
    const expected = VALENCE[a.el] || 0;
    if (bondCount !== expected) {
      valid = false;
      issues.push(`${a.el} (atom ${i + 1}): has ${bondCount} bonds, expected ${expected}`);
    }
  });
  if (valid) {
    const formula = builderAtoms.reduce((acc, a) => { acc[a.el] = (acc[a.el] || 0) + 1; return acc; }, {});
    const formulaStr = Object.entries(formula).map(([el, n]) => el + (n > 1 ? n : '')).join('');
    status.innerHTML = `<span style="color:#22c55e">✅ Valid compound: <strong>${formulaStr}</strong></span>`;
  } else {
    status.innerHTML = `<span style="color:#ef4444">❌ Invalid: ${issues.join('; ')}</span>`;
  }
}

function viewBuilderIn3D() {
  if (!molGroup || builderAtoms.length < 1) return;
  while (molGroup.children.length) molGroup.remove(molGroup.children[0]);
  labelSprites = [];
  const cx = builderAtoms.reduce((s, a) => s + a.x, 0) / builderAtoms.length;
  const cy = builderAtoms.reduce((s, a) => s + a.y, 0) / builderAtoms.length;
  const scale = 0.02;
  builderAtoms.forEach(a => {
    const r = (ATOM_RADII[a.el] || 0.7) * 0.4;
    const geo = new THREE.SphereGeometry(r, 24, 24);
    const mat = new THREE.MeshPhongMaterial({ color: ATOM_COLORS[a.el] || '#888', shininess: 80 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((a.x - cx) * scale, -(a.y - cy) * scale, 0);
    molGroup.add(mesh);
    const sprite = makeTextSprite(a.el, ATOM_COLORS[a.el] || '#fff');
    sprite.position.set((a.x - cx) * scale, -(a.y - cy) * scale + r + 0.35, 0);
    molGroup.add(sprite);
  });
  builderBonds.forEach(b => {
    const a1 = builderAtoms[b.from], a2 = builderAtoms[b.to];
    if (!a1 || !a2) return;
    const p1 = new THREE.Vector3((a1.x - cx) * scale, -(a1.y - cy) * scale, 0);
    const p2 = new THREE.Vector3((a2.x - cx) * scale, -(a2.y - cy) * scale, 0);
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    for (let k = 0; k < b.order; k++) {
      const bondGeo = new THREE.CylinderGeometry(0.05, 0.05, len, 8);
      const bondMat = new THREE.MeshPhongMaterial({ color: 0x999999 });
      const bond = new THREE.Mesh(bondGeo, bondMat);
      bond.position.copy(mid);
      bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      molGroup.add(bond);
    }
  });
  const info = $('#moleculeInfo');
  if (info) info.innerHTML = '<strong>Custom Compound</strong> — Built in Compound Builder';
  document.getElementById('molecules').scrollIntoView({ behavior: 'smooth' });
}

// ── Molar Mass Calculator ──
function calcMolarMass(formula) {
  const regex = /([A-Z][a-z]?)(\d*)/g;
  let match;
  let total = 0;
  const breakdown = [];
  while ((match = regex.exec(formula)) !== null) {
    if (!match[1]) continue;
    const el = match[1];
    const count = parseInt(match[2]) || 1;
    const mass = ATOMIC_MASS[el];
    if (!mass) return { total: NaN, breakdown: [], error: `Unknown element: ${el}` };
    total += mass * count;
    breakdown.push({ el, count, mass, subtotal: mass * count });
  }
  return { total, breakdown, error: null };
}

if ($('#calcMassBtn')) {
  $('#calcMassBtn').addEventListener('click', () => {
    const formula = $('#formulaInput').value.trim();
    if (!formula) return;
    const result = calcMolarMass(formula);
    const el = $('#massResult');
    if (result.error) {
      el.innerHTML = `<span style="color:#ef4444">${result.error}</span>`;
    } else {
      const breakdownHtml = result.breakdown.map(b => `${b.el}×${b.count} = ${b.subtotal.toFixed(3)}`).join(' + ');
      el.innerHTML = `<span style="color:var(--accent)">⚖️ Molar Mass:</span> <strong>${result.total.toFixed(3)} g/mol</strong><br><span class="text-muted" style="font-size:0.8rem">${breakdownHtml}</span>`;
    }
  });
}

// Nav links update for new sections
const navLinks = $$('.nav-links a');
navLinks.forEach(link => {
  if (link.getAttribute('href') === '#learn') {
    // Insert new nav items before Learn
    const molLink = document.createElement('a');
    molLink.href = '#molecules'; molLink.textContent = '3D Viewer';
    const buildLink = document.createElement('a');
    buildLink.href = '#builder'; buildLink.textContent = 'Builder';
    link.parentNode.insertBefore(molLink, link);
    link.parentNode.insertBefore(buildLink, link);
  }
});

// Init
renderElements();
renderPhScale();
updatePh(7);
if (document.getElementById('reactionChart')) initChart();
if (document.getElementById('moleculeViewer3D')) initMoleculeViewer();
initCompoundBuilder();
})();
