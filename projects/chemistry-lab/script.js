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
  } else {
    anim.innerHTML = '<span style="font-size:2rem">🧊</span>';
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
});

$('#heatBtn').addEventListener('click', () => {
  temperature = Math.min(1000, temperature + 50);
  $('#tempSlider').value = temperature;
  $('#tempDisplay').textContent = temperature + '°C';
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

// Init
renderElements();
renderPhScale();
updatePh(7);
})();
