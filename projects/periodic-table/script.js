(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Full detailed dataset of all 118 elements
const elements = typeof elements_data !== 'undefined' ? elements_data : [];

// Fix lanthanide/actinide grid positions for separate rows
elements.forEach(el => {
    if (el.c === 'lanthanide') {
        el.period = 8;
        el.group = 3 + (el.n - 57);
    } else if (el.c === 'actinide') {
        el.period = 9;
        el.group = 3 + (el.n - 89);
    }
});


const CATEGORIES = {
    alkali_metal: { name: 'Alkali Metal', color: 'var(--c-alkali)' },
    alkaline_earth_metal: { name: 'Alkaline Earth Metal', color: 'var(--c-alkaline)' },
    transition_metal: { name: 'Transition Metal', color: 'var(--c-transition)' },
    post_transition_metal: { name: 'Post-Transition Metal', color: 'var(--c-post-transition)' },
    metalloid: { name: 'Metalloid', color: 'var(--c-metalloid)' },
    reactive_nonmetal: { name: 'Reactive Nonmetal', color: 'var(--c-nonmetal)' },
    noble_gas: { name: 'Noble Gas', color: 'var(--c-noble)' },
    halogen: { name: 'Halogen', color: 'var(--c-halogen)' },
    lanthanide: { name: 'Lanthanide', color: 'var(--c-lanthanide)' },
    actinide: { name: 'Actinide', color: 'var(--c-actinide)' },
    unknown: { name: 'Unknown', color: 'var(--c-unknown)' },
};

function renderGrid() {
    const grid = $('#periodicTable');
    let html = '';
    
    // We render a 18x10 grid. Rows 1-7 are standard. Row 8 is space, Row 9 is Lanthanide, Row 10 is Actinide.
    for (let r = 1; r <= 10; r++) {
        for (let c = 1; c <= 18; c++) {
            let el = null;
            if (r <= 7) el = elements.find(x => x.period === r && x.group === c);
            else if (r === 9 && c >= 3 && c <= 17) el = elements.find(x => x.period === 8 && x.group === c);
            else if (r === 10 && c >= 3 && c <= 17) el = elements.find(x => x.period === 9 && x.group === c);
            
            if (el) {
                html += `
                <div class="element-cell ${el.c}" data-id="${el.n}" style="grid-column:${c};grid-row:${r}" tabindex="0">
                    <span class="e-num">${el.n}</span>
                    <span class="e-symbol">${el.s}</span>
                    <span class="e-name">${el.name}</span>
                </div>`;
            }
        }
    }
    grid.innerHTML = html;

    grid.innerHTML = html;

    // Attach events
    $$('.element-cell').forEach(cell => {
        cell.addEventListener('click', () => {
            const id = parseInt(cell.dataset.id);
            if(window.isAlchemyLabOpen) {
                addToAlchemy(id);
            } else {
                showDetails(id);
            }
        });
    });
}

function renderLegend() {
    const parent = $('#legendFilter');
    let html = '';
    for (const k in CATEGORIES) {
        html += `
        <div class="legend-item" data-cat="${k}">
            <div class="legend-color" style="background:${CATEGORIES[k].color}"></div>
            <span>${CATEGORIES[k].name}</span>
        </div>`;
    }
    parent.innerHTML = html;

    $$('.legend-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            const cat = item.dataset.cat;
            $$('.element-cell').forEach(c => {
                c.classList.toggle('filtered', !c.classList.contains(cat));
            });
        });
        item.addEventListener('mouseleave', () => {
            $$('.element-cell').forEach(c => c.classList.remove('filtered'));
        });
    });
}

const panel = $('#elementPanel');
const content = $('#panelContent');

function showDetails(id) {
    const el = elements.find(x => x.n === id);
    if (!el) return;

    const catName = CATEGORIES[el.c] ? CATEGORIES[el.c].name : 'Unknown';
    const color = CATEGORIES[el.c] ? CATEGORIES[el.c].color : 'var(--border)';

    let html = `
    <div class="detail-header">
        <div class="detail-block" style="border-color:${color}">
            <span class="detail-num" style="color:var(--text-muted)">${el.n}</span>
            <span class="detail-sym" style="color:${color}">${el.s}</span>
        </div>
        <div class="detail-info">
            <h2>${el.name}</h2>
            <span class="cat-badge" style="border-color:${color};color:${color}">${catName}</span>
        </div>
    </div>
    <div class="data-grid">
        <div class="data-item"><div class="data-lbl">Atomic Mass</div><div class="data-val">${el.mass} u</div></div>
        <div class="data-item"><div class="data-lbl">Electron Config</div><div class="data-val">${el.ec}</div></div>
        <div class="data-item"><div class="data-lbl">Group</div><div class="data-val">${el.group || 'N/A'}</div></div>
        <div class="data-item"><div class="data-lbl">Period</div><div class="data-val">${el.period > 7 ? el.period-2 : el.period}</div></div>
        <div class="desc-box">
            ${escapeHtml(el.desc)}
        </div>
    </div>
    `;
    const infoView = document.getElementById('infoView');
    if(infoView) infoView.innerHTML = html;
    
    // Auto-switch to 3D tab if requested by user feedback
    document.getElementById('tab3D')?.click();
    panel.classList.add('open');
    
    document.getElementById('closePanelBtn')?.addEventListener('click', () => {
        panel.classList.remove('open');
    });

    if (window.current3DModel) {
        cancelAnimationFrame(window.current3DModel.req);
        if(window.current3DModel.renderer) window.current3DModel.renderer.dispose();
    }
    draw3DAtomicModel(el);
}

// Draw interactive 3D Atomic Model using Three.js
function draw3DAtomicModel(el) {
    const container = document.getElementById('threeContainer');
    if(!container) return;
    container.innerHTML = ''; // clear old
    
    const w = container.clientWidth;
    const h = container.clientHeight;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 1000);
    camera.position.z = 80;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    const group = new THREE.Group();
    scene.add(group);
    
    // Ambient light
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(20, 20, 20);
    scene.add(pointLight);

    // Nucleus
    const nucleusGeo = new THREE.SphereGeometry(3 + Math.min(el.n * 0.05, 5), 32, 32);
    const catColor = CATEGORIES[el.c] ? CATEGORIES[el.c].color : '#6366f1';
    const nucleusMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(catColor),
        emissive: new THREE.Color(catColor),
        emissiveIntensity: 0.3,
        roughness: 0.2,
        metalness: 0.8,
        clearcoat: 1.0,
    });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    group.add(nucleus);
    
    // Calculate electrons per shell
    let z = el.n;
    const maxCapacity = [2, 8, 18, 32, 32, 18, 8];
    const shells = [];
    for(let cap of maxCapacity) {
        if(z <= 0) break;
        let e = Math.min(z, cap);
        if(z > cap && e === cap && cap >= 18 && z - cap < 8) {
            e = cap - Math.min(z-cap+8, 10);
        }
        shells.push(e);
        z -= e;
    }
    
    const shellObjects = [];
    const electronObjects = [];
    
    const electronGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const electronMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });

    shells.forEach((electrons, sIdx) => {
        const r = 12 + sIdx * 8;
        
        // Orbital ring
        const ringGeo = new THREE.TorusGeometry(r, 0.1, 8, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        
        // Random tilt for 3D feel
        ring.rotation.x = (Math.random() - 0.5) * Math.PI;
        ring.rotation.y = (Math.random() - 0.5) * Math.PI;
        group.add(ring);
        shellObjects.push({ ring, r, speed: 0.01 + Math.random() * 0.02 * (sIdx%2===0?1:-1) });
        
        // Electrons on this shell
        for(let e=0; e<electrons; e++) {
            const mesh = new THREE.Mesh(electronGeo, electronMat);
            const angle = (Math.PI*2 / electrons) * e;
            // position relative to ring
            ring.add(mesh);
            electronObjects.push({ mesh, angle, shellIdx: sIdx });
        }
    });

    let reqId;
    function animate() {
        if(!container.isConnected) return;
        reqId = requestAnimationFrame(animate);
        
        controls.update();
        
        // Rotate nucleus slowly
        nucleus.rotation.y += 0.005;
        nucleus.rotation.x += 0.002;
        
        // Rotate shells
        shellObjects.forEach((shell) => {
            shell.ring.rotation.z += shell.speed;
        });
        
        // Position electrons correctly on the ring
        electronObjects.forEach(e => {
            const r = shellObjects[e.shellIdx].r;
            e.mesh.position.set(Math.cos(e.angle) * r, Math.sin(e.angle) * r, 0);
        });

        renderer.render(scene, camera);
    }
    animate();
    
    window.current3DModel = { req: reqId, renderer };
}


$('#closePanelBtn').addEventListener('click', () => panel.classList.remove('open'));

$('#searchInput').addEventListener('input', applyFilters);

// Temperature controls are now natively handled in HTML and listeners below
let sensitivityMode = false;
let currentTemp = 298;

$('#tempInput').addEventListener('input', (e) => {
    currentTemp = parseInt(e.target.value);
    $('#tempVal').textContent = currentTemp + ' K';
    applyFilters();
    // Update phase legend counts (function defined later, available at call time)
    if (typeof updatePhaseLegend === 'function') updatePhaseLegend(currentTemp);
});

$('#sensitivityBtn').addEventListener('click', () => {
    sensitivityMode = !sensitivityMode;
    $('#sensitivityBtn').classList.toggle('btn-primary', sensitivityMode);
    $('#sensitivityBtn').classList.toggle('btn-secondary', !sensitivityMode);
    applyFilters();
});

function getPhase(n, temp) {
    // Use real phase data (PHASE_DATA defined later in same scope, initialized by call time)
    if (typeof PHASE_DATA !== 'undefined' && PHASE_DATA[n]) {
        const pd = PHASE_DATA[n];
        if (temp >= pd.b) return 'gas';
        if (temp >= pd.m) return 'liquid';
        return 'solid';
    }
    // Fallback for safety
    return 'solid';
}

function applyFilters() {
    const term = $('#searchInput').value.toLowerCase();
    
    $$('.element-cell').forEach(cell => {
        const id = parseInt(cell.dataset.id);
        const el = elements.find(x => x.n === id);
        
        // Search Matching
        let match = true;
        if (term) {
            match = el.name.toLowerCase().includes(term) || el.s.toLowerCase().includes(term) || el.n.toString() === term;
        }

        // Sensitivity Matching
        let isSensitive = false;
        if (sensitivityMode) {
            // Highly reactive (alkali) or Radioactive (n > 82 or 43, 61)
            isSensitive = (id > 82 || id === 43 || id === 61 || el.group === 1 || el.group === 17);
            if (!isSensitive) match = false;
        }
        
        // Temperature phase
        const phase = getPhase(id, currentTemp);
        
        if (!match) {
            cell.style.opacity = sensitivityMode ? '0.2' : '0.1';
            cell.style.transform = 'scale(0.9)';
            cell.style.filter = 'grayscale(100%)';
            cell.style.boxShadow = 'none';
            cell.style.borderColor = '';
        } else {
            // Apply Physical State Visuals
            cell.classList.remove('phase-solid', 'phase-liquid', 'phase-gas');
            cell.classList.add('phase-' + phase);
            cell.dataset.phase = phase;
            
            if (phase === 'liquid') {
                cell.style.opacity = '0.85';
                cell.style.boxShadow = '0 0 12px rgba(0, 150, 255, 0.6)';
                cell.style.transform = 'scale(0.97)';
                cell.style.borderColor = 'rgba(0, 150, 255, 0.5)';
            } else if (phase === 'gas') {
                cell.style.opacity = '0.35';
                cell.style.boxShadow = 'none';
                cell.style.transform = 'scale(0.93)';
                cell.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            } else {
                cell.style.opacity = '1';
                cell.style.boxShadow = '';
                cell.style.transform = 'scale(1)';
                cell.style.borderColor = '';
            }
            
            if (sensitivityMode) {
                cell.style.filter = 'drop-shadow(0 0 10px var(--c-alkali))';
            } else {
                cell.style.filter = 'none';
            }
        }
    });
}


$('#themeBtn').addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.dataset.theme === 'dark';
    html.dataset.theme = isDark ? 'light' : 'dark';
    $('#themeBtn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', html.dataset.theme);
});

if (localStorage.getItem('theme') === 'light') {
    document.documentElement.dataset.theme = 'light';
    $('#themeBtn').textContent = '☀️';
}

function escapeHtml(s) { return s.replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

renderGrid();
renderLegend();

// ── Quiz Mode ──
let quizMode = false;
let currentQuizElement = null;

$('#quizModeBtn').addEventListener('click', () => {
    quizMode = !quizMode;
    if (quizMode) {
        $('#quizModeBtn').classList.replace('btn-secondary', 'btn-primary');
        $('#quizModeBtn').textContent = '🛑 End Quiz';
        startQuiz();
    } else {
        $('#quizModeBtn').classList.replace('btn-primary', 'btn-secondary');
        $('#quizModeBtn').textContent = '🎓 Quiz Mode';
        endQuiz();
    }
});

function startQuiz() {
    $$('.element-cell').forEach(c => {
        c.classList.add('quiz-hidden');
        c.querySelector('.e-symbol').style.visibility = 'hidden';
        c.querySelector('.e-name').style.visibility = 'hidden';
        c.querySelector('.e-num').style.visibility = 'hidden';
    });
    pickQuizElement();
}

function endQuiz() {
    $$('.element-cell').forEach(c => {
        c.classList.remove('quiz-hidden');
        c.querySelector('.e-symbol').style.visibility = 'visible';
        c.querySelector('.e-name').style.visibility = 'visible';
        c.querySelector('.e-num').style.visibility = 'visible';
        c.style.background = '';
    });
    const quizPanel = $('#quizPanel');
    if(quizPanel) quizPanel.remove();
}

function pickQuizElement() {
    currentQuizElement = elements[Math.floor(Math.random() * elements.length)];
    let quizPanel = $('#quizPanel');
    if (!quizPanel) {
        quizPanel = document.createElement('div');
        quizPanel.id = 'quizPanel';
        quizPanel.className = 'glass-card';
        quizPanel.style.position = 'fixed';
        quizPanel.style.bottom = '20px';
        quizPanel.style.left = '50%';
        quizPanel.style.transform = 'translateX(-50%)';
        quizPanel.style.zIndex = '1000';
        quizPanel.style.padding = '1rem 2rem';
        quizPanel.style.textAlign = 'center';
        document.body.appendChild(quizPanel);
    }
    quizPanel.innerHTML = `<h3>Find the Element:</h3><h2 style="font-size:2rem;color:var(--accent);margin-top:0.5rem">${currentQuizElement.name}</h2><p class="text-muted" style="font-size:0.8rem">Click on the correct position in the table</p>`;
}

// Intercept click on element cell
const originalRenderGrid = renderGrid;
// Actually we already have attach events in renderGrid, we can just intercept showDetails
const originalShowDetails = showDetails;

showDetails = function(id) {
    if (quizMode) {
        const el = elements.find(x => x.n === id);
        const cell = document.querySelector(`.element-cell[data-id="${id}"]`);
        if (id === currentQuizElement.n) {
            cell.style.background = 'var(--c-alkaline)'; // Greenish success
            setTimeout(() => {
                cell.querySelector('.e-symbol').style.visibility = 'visible';
                cell.querySelector('.e-num').style.visibility = 'visible';
                pickQuizElement();
            }, 600);
        } else {
            cell.style.background = 'var(--c-actinide)'; // Reddish error
            setTimeout(() => {
                cell.style.background = '';
            }, 500);
        }
    } else {
        originalShowDetails(id);
    }
};

    // ═══════════════════════════════════════════════════
    // ENHANCED TEMPERATURE LOGIC (Fixed: targets .element-cell)
    // ═══════════════════════════════════════════════════
    
    // Real melting/boiling points in Kelvin for all 118 elements
    const PHASE_DATA = {
        1:{m:14,b:20},2:{m:1,b:4},3:{m:454,b:1603},4:{m:1560,b:2742},5:{m:2349,b:4200},
        6:{m:3823,b:4098},7:{m:63,b:77},8:{m:54,b:90},9:{m:53,b:85},10:{m:25,b:27},
        11:{m:371,b:1156},12:{m:923,b:1363},13:{m:933,b:2792},14:{m:1687,b:3538},
        15:{m:317,b:554},16:{m:388,b:718},17:{m:172,b:239},18:{m:84,b:87},
        19:{m:337,b:1032},20:{m:1115,b:1757},21:{m:1814,b:3109},22:{m:1941,b:3560},
        23:{m:2183,b:3680},24:{m:2180,b:2944},25:{m:1519,b:2334},26:{m:1811,b:3134},
        27:{m:1768,b:3200},28:{m:1728,b:3186},29:{m:1358,b:2835},30:{m:693,b:1180},
        31:{m:303,b:2477},32:{m:1211,b:3106},33:{m:1090,b:887},34:{m:494,b:958},
        35:{m:266,b:332},36:{m:116,b:120},37:{m:312,b:961},38:{m:1050,b:1655},
        39:{m:1799,b:3609},40:{m:2128,b:4682},41:{m:2750,b:5017},42:{m:2896,b:4912},
        43:{m:2430,b:4538},44:{m:2607,b:4423},45:{m:2237,b:3968},46:{m:1828,b:3236},
        47:{m:1235,b:2435},48:{m:594,b:1040},49:{m:430,b:2345},50:{m:505,b:2875},
        51:{m:904,b:1860},52:{m:723,b:1261},53:{m:387,b:457},54:{m:161,b:165},
        55:{m:302,b:944},56:{m:1000,b:2170},57:{m:1193,b:3737},58:{m:1068,b:3716},
        59:{m:1208,b:3793},60:{m:1297,b:3347},61:{m:1315,b:3273},62:{m:1345,b:2067},
        63:{m:1099,b:1802},64:{m:1585,b:3546},65:{m:1629,b:3503},66:{m:1680,b:2840},
        67:{m:1734,b:2993},68:{m:1802,b:3141},69:{m:1818,b:2223},70:{m:1097,b:1469},
        71:{m:1925,b:3675},72:{m:2506,b:4876},73:{m:3290,b:5731},74:{m:3695,b:5828},
        75:{m:3459,b:5869},76:{m:3306,b:5285},77:{m:2719,b:4701},78:{m:2041,b:4098},
        79:{m:1337,b:3129},80:{m:234,b:630},81:{m:577,b:1746},82:{m:601,b:2022},
        83:{m:544,b:1837},84:{m:527,b:1235},85:{m:575,b:610},86:{m:202,b:211},
        87:{m:300,b:950},88:{m:973,b:2010},89:{m:1323,b:3471},90:{m:2115,b:5061},
        91:{m:1841,b:4300},92:{m:1405,b:4404},93:{m:917,b:4175},94:{m:913,b:3501},
        95:{m:1449,b:2880},96:{m:1613,b:3383},97:{m:1259,b:2900},98:{m:1173,b:1743},
        99:{m:1133,b:1269},100:{m:1800,b:1800},101:{m:1100,b:1100},102:{m:1100,b:1100},
        103:{m:1900,b:1900},104:{m:2400,b:5800},105:{m:2400,b:5800},106:{m:2400,b:5800},
        107:{m:2400,b:5800},108:{m:2400,b:5800},109:{m:2400,b:5800},110:{m:2400,b:5800},
        111:{m:2400,b:5800},112:{m:340,b:357},113:{m:700,b:1400},114:{m:340,b:420},
        115:{m:700,b:1400},116:{m:709,b:883},117:{m:623,b:883},118:{m:325,b:450}
    };

    function getStateAtTemp(el, currentTemp) {
        if (!el) return 'solid';
        const temp = parseFloat(currentTemp);
        const pd = PHASE_DATA[el.n];
        if (pd) {
            if (temp >= pd.b) return 'gas';
            if (temp >= pd.m) return 'liquid';
            return 'solid';
        }
        // Fallback based on category
        let melt = 1000, boil = 3000;
        if (el.c === 'noble_gas') { melt = 10; boil = 100; }
        else if (el.c === 'nonmetal' || el.c === 'halogen') { melt = 200; boil = 350; }
        else if (el.c === 'alkali_metal') { melt = 350; boil = 1000; }
        else if (el.c === 'alkaline_earth') { melt = 900; boil = 1800; }
        if (temp >= boil) return 'gas';
        if (temp >= melt) return 'liquid';
        return 'solid';
    }

    // Temperature slider is handled by the unified tempInput listener above
    // which calls applyFilters() + updatePhaseLegend() with real PHASE_DATA

    function updatePhaseLegend(temp) {
        let solid = 0, liquid = 0, gas = 0;
        elements.forEach(el => {
            const state = getStateAtTemp(el, temp);
            if (state === 'solid') solid++;
            else if (state === 'liquid') liquid++;
            else gas++;
        });
        const legend = document.getElementById('phaseLegend');
        if (legend) {
            legend.innerHTML = `
                <span style="color:#60a5fa;">● Solid: ${solid}</span>
                <span style="color:#06b6d4;">● Liquid: ${liquid}</span>
                <span style="color:rgba(255,255,255,0.4);">● Gas: ${gas}</span>
            `;
        }
    }

    // ═══════════════════════════════════════════════════
    // ELEMENT COMBINING LAB
    // ═══════════════════════════════════════════════════
    const REACTIONS_DB = [
        // Elemental molecules
        { reactants: [1,1], product: 'H₂', name: 'Hydrogen Gas', ratio: 'H + H', conditions: 'Standard', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [8,8], product: 'O₂', name: 'Oxygen Gas', ratio: 'O + O', conditions: 'Standard', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [7,7], product: 'N₂', name: 'Nitrogen Gas', ratio: 'N + N', conditions: 'Standard', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [17,17], product: 'Cl₂', name: 'Chlorine Gas', ratio: 'Cl + Cl', conditions: 'Standard', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [6,6,6], product: 'C₃', name: 'Carbon cluster', ratio: '3C', conditions: 'Vacuum', type: 'Synthesis', bond: 'Covalent' },
        
        // Compounds
        { reactants: [1,1,8], product: 'H₂O', name: 'Water', ratio: '2H + O', conditions: 'Spark/flame', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [1,17], product: 'HCl', name: 'Hydrochloric acid', ratio: 'H + Cl', conditions: 'UV light or heat', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [11,17], product: 'NaCl', name: 'Table salt', ratio: 'Na + Cl', conditions: 'Room temperature', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [6,8,8], product: 'CO₂', name: 'Carbon dioxide', ratio: 'C + 2O', conditions: 'Combustion (heat)', type: 'Combustion', bond: 'Covalent' },
        { reactants: [26,26,8,8,8], product: 'Fe₂O₃', name: 'Iron(III) oxide (Rust)', ratio: '2Fe + 3O', conditions: 'Moisture + O₂', type: 'Oxidation', bond: 'Ionic' },
        { reactants: [12,8], product: 'MgO', name: 'Magnesium oxide', ratio: 'Mg + O', conditions: 'Burning (bright flame)', type: 'Combustion', bond: 'Ionic' },
        { reactants: [13,13,8,8,8], product: 'Al₂O₃', name: 'Aluminum oxide', ratio: '2Al + 3O', conditions: 'High temperature', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [7,1,1,1], product: 'NH₃', name: 'Ammonia', ratio: 'N + 3H', conditions: 'Haber process (450°C, catalyst)', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [16,8,8], product: 'SO₂', name: 'Sulfur dioxide', ratio: 'S + 2O', conditions: 'Combustion', type: 'Combustion', bond: 'Covalent' },
        { reactants: [20,6,8,8,8], product: 'CaCO₃', name: 'Calcium carbonate (Limestone)', ratio: 'Ca + C + 3O', conditions: 'Natural formation', type: 'Synthesis', bond: 'Ionic/Covalent' },
        { reactants: [19,35], product: 'KBr', name: 'Potassium bromide', ratio: 'K + Br', conditions: 'Room temperature', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [14,8,8], product: 'SiO₂', name: 'Silicon dioxide (Quartz)', ratio: 'Si + 2O', conditions: 'High temperature', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [29,16], product: 'CuS', name: 'Copper sulfide', ratio: 'Cu + S', conditions: 'Heat', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [30,8], product: 'ZnO', name: 'Zinc oxide', ratio: 'Zn + O', conditions: 'Burning', type: 'Combustion', bond: 'Ionic' },
        { reactants: [15,15,8,8,8,8,8], product: 'P₂O₅', name: 'Phosphorus pentoxide', ratio: '2P + 5O', conditions: 'Burning in air', type: 'Combustion', bond: 'Covalent' },
        { reactants: [11,11,8], product: 'Na₂O', name: 'Sodium oxide', ratio: '2Na + O', conditions: 'Heating', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [3,3,3,7], product: 'Li₃N', name: 'Lithium nitride', ratio: '3Li + N', conditions: 'Room temperature', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [20,17,17], product: 'CaCl₂', name: 'Calcium chloride', ratio: 'Ca + 2Cl', conditions: 'Direct combination', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [1,1,16], product: 'H₂S', name: 'Hydrogen sulfide', ratio: '2H + S', conditions: 'Heat', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [6,1,1,1,1], product: 'CH₄', name: 'Methane', ratio: 'C + 4H', conditions: 'High pressure/temp', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [47,47,16], product: 'Ag₂S', name: 'Silver sulfide (Tarnish)', ratio: '2Ag + S', conditions: 'Air exposure', type: 'Oxidation', bond: 'Ionic' },
        { reactants: [22,17,17,17,17], product: 'TiCl₄', name: 'Titanium tetrachloride', ratio: 'Ti + 4Cl', conditions: 'High temperature', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [50,8,8], product: 'SnO₂', name: 'Tin dioxide', ratio: 'Sn + 2O', conditions: 'Heating in air', type: 'Combustion', bond: 'Ionic' },
        { reactants: [82,16], product: 'PbS', name: 'Lead sulfide (Galena)', ratio: 'Pb + S', conditions: 'Heat', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [19,19,8], product: 'K₂O', name: 'Potassium oxide', ratio: '2K + O', conditions: 'Burning', type: 'Combustion', bond: 'Ionic' },
        { reactants: [56,8], product: 'BaO', name: 'Barium oxide', ratio: 'Ba + O', conditions: 'Heating', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [25,8,8], product: 'MnO₂', name: 'Manganese dioxide', ratio: 'Mn + 2O', conditions: 'Natural oxidation', type: 'Oxidation', bond: 'Ionic' },
        { reactants: [24,24,8,8,8], product: 'Cr₂O₃', name: 'Chromium(III) oxide', ratio: '2Cr + 3O', conditions: 'High temperature', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [74,6], product: 'WC', name: 'Tungsten carbide', ratio: 'W + C', conditions: '1400-1600°C', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [28,8], product: 'NiO', name: 'Nickel oxide', ratio: 'Ni + O', conditions: 'Heating in air', type: 'Synthesis', bond: 'Ionic' }
    ];
    
    // Support exact stoichiometric matching
    window.findReactions = function(elNums) {
        // Sort input for easy comparison
        const sortedInput = [...elNums].sort((a,b)=>a-b);
        return REACTIONS_DB.filter(r => {
            const sortedReactants = [...r.reactants].sort((a,b)=>a-b);
            if(sortedInput.length !== sortedReactants.length) return false;
            return sortedInput.every((val, index) => val === sortedReactants[index]);
        });
    };

    window.openCombineLab = function() {
        let panel = document.getElementById('combineLab');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'combineLab';
            panel.className = 'glass-card';
            panel.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:1000; padding:1.5rem; max-width:700px; width:90%; max-height:80vh; overflow-y:auto; background:rgba(10,15,30,0.95); border:1px solid var(--accent); border-radius:16px; box-shadow:0 20px 40px rgba(0,0,0,0.5);';
            document.body.appendChild(panel);
        }
        
        const optionsHtml = elements.map(e => `<option value="${e.n}">${e.n}. ${e.name} (${e.s})</option>`).join('');
        
        panel.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                <h3 style="margin:0; color:var(--accent);">⚗️ Advanced Chemistry Combinator</h3>
                <button onclick="document.getElementById('combineLab').remove()" style="background:none; border:none; color:#fff; font-size:1.5rem; cursor:pointer; line-height:1;">&times;</button>
            </div>
            
            <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1rem;">Select up to 3 elements to simulate a chemical synthesis or reaction.</p>
            
            <div id="combineInputs" style="display:flex; gap:0.5rem; margin-bottom:1rem; flex-wrap:wrap; align-items:center;">
                <select class="combineEl" style="flex:1; min-width:120px; padding:0.6rem; background:rgba(0,0,0,0.4); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:8px; outline:none;">
                    ${optionsHtml}
                </select>
                <span style="color:var(--accent); font-size:1.5rem; font-weight:bold;">+</span>
                <select class="combineEl" style="flex:1; min-width:120px; padding:0.6rem; background:rgba(0,0,0,0.4); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:8px; outline:none;">
                    <option value="0">-- None --</option>
                    ${elements.map(e => `<option value="${e.n}" ${e.n===8?'selected':''}>${e.n}. ${e.name} (${e.s})</option>`).join('')}
                </select>
                <span style="color:var(--accent); font-size:1.5rem; font-weight:bold;">+</span>
                <select class="combineEl" style="flex:1; min-width:120px; padding:0.6rem; background:rgba(0,0,0,0.4); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:8px; outline:none;">
                    <option value="0" selected>-- None --</option>
                    ${optionsHtml}
                </select>
            </div>
            <div style="text-align:center; margin-bottom:1.5rem;">
                <button onclick="performCombine()" class="btn btn-primary" style="padding:0.6rem 2rem; font-size:1rem; border-radius:20px; background:linear-gradient(135deg, var(--c-alkali), var(--c-post-transition)); border:none; color:#fff; cursor:pointer; font-weight:600; box-shadow:0 4px 15px rgba(255,255,255,0.1);">🧪 Synthesize</button>
            </div>
            <div id="combineResults" style="min-height:100px;"></div>
        `;
    };
    
    window.performCombine = function() {
        const inputs = Array.from(document.querySelectorAll('.combineEl'))
            .map(select => parseInt(select.value))
            .filter(val => val > 0);
            
        // Unique sort
        const elNums = [...new Set(inputs)].sort((a,b)=>a-b);
        const container = document.getElementById('combineResults');
        
        if (elNums.length === 0) {
             container.innerHTML = '<div style="text-align:center; color:var(--text-muted);">Please select at least one element.</div>';
             return;
        }

        const elNames = elNums.map(num => {
            const e = elements.find(x => x.n === num);
            return e ? e.name : num;
        });
        
        const results = findReactions(elNums);
        
        if (results.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:2rem; background:rgba(0,0,0,0.3); border-radius:12px; border:1px dashed var(--border);">
                <div style="font-size:3rem; margin-bottom:1rem; filter:grayscale(100%);">💨</div>
                <h4 style="color:var(--text-muted); font-size:1.1rem; margin-bottom:0.5rem;">Reaction Failed</h4>
                <p style="color:var(--text-muted); font-size:0.85rem; max-width:80%; margin:0 auto;">
                No known common stable compound directly forms from combining just <strong>${elNames.join(', ')}</strong> under normal conditions.
                <br><br><span style="opacity:0.7;">Hint: Try common combinations like Hydrogen + Oxygen, Sodium + Chlorine, or Carbon + Oxygen.</span></p>
            </div>`;
            return;
        }
        
        container.innerHTML = results.map(r => `
            <div style="background:linear-gradient(to right, rgba(99,102,241,0.1), rgba(0,0,0,0)); border-left:4px solid var(--accent); border-radius:8px; padding:1.25rem; margin-bottom:1rem; position:relative; overflow:hidden;">
                <div style="position:absolute; right:-20px; top:-20px; font-size:8rem; opacity:0.05; pointer-events:none;">🔬</div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; position:relative; z-index:2;">
                    <div>
                        <h4 style="margin:0 0 0.25rem 0; color:#4ade80; font-size:1.3rem;">${r.product}</h4>
                        <span style="color:var(--text); font-weight:500; font-size:0.95rem;">${r.name}</span>
                    </div>
                    <span style="font-size:0.75rem; padding:4px 10px; border-radius:12px; background:rgba(99,102,241,0.2); color:#a5b4fc; font-weight:600; text-transform:uppercase; letter-spacing:1px;">${r.type}</span>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; font-size:0.85rem; position:relative; z-index:2; background:rgba(0,0,0,0.3); padding:1rem; border-radius:8px;">
                    <div><strong style="color:#a5b4fc; display:block; margin-bottom:4px;">Balanced Equation</strong> <span style="font-family:monospace; font-size:1rem;">${r.ratio} → ${r.product}</span></div>
                    <div><strong style="color:#a5b4fc; display:block; margin-bottom:4px;">Primary Bond Type</strong> <span>${r.bond}</span></div>
                    <div style="grid-column:1/-1;"><strong style="color:#a5b4fc; display:block; margin-bottom:4px;">Required Conditions</strong> <span>${r.conditions}</span></div>
                </div>
            </div>
        `).join('');
    };

    // ═══════════════════════════════════════════════════
    // COMPARISON MODE
    // ═══════════════════════════════════════════════════
    window.openCompareMode = function() {
        let panel = document.getElementById('comparePanel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'comparePanel';
            panel.className = 'glass-card';
            panel.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:1000; padding:1.5rem; max-width:700px; width:90%; max-height:80vh; overflow-y:auto; background:rgba(10,15,30,0.95); border:1px solid var(--accent); border-radius:16px;';
            document.body.appendChild(panel);
        }
        
        panel.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <h3 style="margin:0; color:var(--accent);">⚖️ Element Comparison</h3>
                <button onclick="document.getElementById('comparePanel').remove()" style="background:none; border:none; color:#fff; font-size:1.2rem; cursor:pointer;">✕</button>
            </div>
            <div style="display:flex; gap:1rem; margin-bottom:1rem;">
                <select id="cmpEl1" onchange="doCompare()" style="flex:1; padding:0.5rem; background:rgba(0,0,0,0.3); color:#fff; border:1px solid rgba(255,255,255,0.15); border-radius:8px;">
                    ${elements.map(e => `<option value="${e.n}">${e.n}. ${e.name}</option>`).join('')}
                </select>
                <span style="color:var(--text-muted); align-self:center;">vs</span>
                <select id="cmpEl2" onchange="doCompare()" style="flex:1; padding:0.5rem; background:rgba(0,0,0,0.3); color:#fff; border:1px solid rgba(255,255,255,0.15); border-radius:8px;">
                    ${elements.map(e => `<option value="${e.n}" ${e.n===79?'selected':''}>${e.n}. ${e.name}</option>`).join('')}
                </select>
            </div>
            <div id="cmpResults"></div>
        `;
        doCompare();
    };

    window.doCompare = function() {
        const n1 = parseInt(document.getElementById('cmpEl1').value);
        const n2 = parseInt(document.getElementById('cmpEl2').value);
        const e1 = elements.find(x => x.n === n1);
        const e2 = elements.find(x => x.n === n2);
        if (!e1 || !e2) return;
        
        const pd1 = PHASE_DATA[n1] || {m:'?',b:'?'};
        const pd2 = PHASE_DATA[n2] || {m:'?',b:'?'};
        
        const props = [
            ['Symbol', e1.s, e2.s],
            ['Atomic Number', e1.n, e2.n],
            ['Category', e1.c?.replace(/_/g,' '), e2.c?.replace(/_/g,' ')],
            ['Period', e1.period || '?', e2.period || '?'],
            ['Group', e1.group || '?', e2.group || '?'],
            ['Melting Point', pd1.m+'K', pd2.m+'K'],
            ['Boiling Point', pd1.b+'K', pd2.b+'K'],
            ['Electronegativity', e1.electronegativity || '?', e2.electronegativity || '?'],
            ['Density', e1.density || '?', e2.density || '?']
        ];
        
        document.getElementById('cmpResults').innerHTML = `
            <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                <thead><tr style="border-bottom:2px solid rgba(99,102,241,0.3);">
                    <th style="text-align:left; padding:6px; color:var(--text-muted);">Property</th>
                    <th style="text-align:center; padding:6px; color:#4ade80;">${e1.name}</th>
                    <th style="text-align:center; padding:6px; color:#60a5fa;">${e2.name}</th>
                </tr></thead>
                <tbody>${props.map(([prop,v1,v2]) => `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                        <td style="padding:6px; color:var(--text-muted);">${prop}</td>
                        <td style="padding:6px; text-align:center; font-weight:600;">${v1}</td>
                        <td style="padding:6px; text-align:center; font-weight:600;">${v2}</td>
                    </tr>
                `).join('')}</tbody>
            </table>
        `;
    };

    // Inject Compare button
    const modeToggles = document.querySelector('.mode-toggles');
    if (modeToggles) {
        const compareBtn = document.createElement('button');
        compareBtn.className = 'btn btn-secondary btn-sm';
        compareBtn.textContent = '⚖️ Compare';
        compareBtn.onclick = openCompareMode;
        modeToggles.appendChild(compareBtn);
    }

    // Add phase legend element
    const phaseControls = document.querySelector('.phase-controls');
    if (phaseControls) {
        const legend = document.createElement('div');
        legend.id = 'phaseLegend';
        legend.style.cssText = 'display:flex; gap:1rem; font-size:0.8rem; margin-top:0.5rem; justify-content:center;';
        phaseControls.appendChild(legend);
        updatePhaseLegend(298);
    }
    
    // ═══════════════════════════════════════════════════
    // NEW UI TABS & ALCHEMY LAB LOGIC
    // ═══════════════════════════════════════════════════
    document.getElementById('tabInfo')?.addEventListener('click', (e) => {
        document.getElementById('tabInfo').classList.add('active');
        document.getElementById('tab3D').classList.remove('active');
        document.getElementById('infoView').classList.remove('hidden');
        document.getElementById('modelView').classList.add('hidden');
    });

    document.getElementById('tab3D')?.addEventListener('click', (e) => {
        document.getElementById('tab3D').classList.add('active');
        document.getElementById('tabInfo').classList.remove('active');
        document.getElementById('modelView').classList.remove('hidden');
        document.getElementById('infoView').classList.add('hidden');
        
        // Render 3D model now
        const numTxt = document.querySelector('.detail-num')?.textContent;
        if(numTxt) {
            const el = elements.find(x => x.n === parseInt(numTxt));
            if(el) draw3DAtomicModel(el);
        }
    });
    
    // Alchemy Lab
    window.isAlchemyLabOpen = false;
    let alchemySelection = [];
    
    document.getElementById('openLabBtn')?.addEventListener('click', () => {
        const lab = document.getElementById('alchemyLab');
        lab.style.transform = 'translateY(0)';
        document.getElementById('openLabBtn').style.display = 'none';
        window.isAlchemyLabOpen = true;
    });
    
    document.getElementById('toggleLabBtn')?.addEventListener('click', () => {
        document.getElementById('alchemyLab').style.transform = 'translateY(100%)';
        document.getElementById('openLabBtn').style.display = 'block';
        window.isAlchemyLabOpen = false;
    });
    
    document.getElementById('clearLabBtn')?.addEventListener('click', () => {
        alchemySelection = [];
        renderAlchemyDropzone();
        document.getElementById('alchemyResult').style.display = 'none';
    });
    
    window.addToAlchemy = function(id) {
        if(alchemySelection.length >= 6) {
            alert("Maximum 6 elements can be combined at once.");
            return;
        }
        const el = elements.find(x => x.n === id);
        if(el) {
            alchemySelection.push(el);
            renderAlchemyDropzone();
            // Flash the dropzone border
            const dz = document.getElementById('alchemyDropzone');
            dz.style.boxShadow = 'inset 0 0 20px var(--accent)';
            setTimeout(() => dz.style.boxShadow = 'none', 300);
        }
    };
    
    function renderAlchemyDropzone() {
        const dz = document.getElementById('alchemyDropzone');
        if(alchemySelection.length === 0) {
            dz.innerHTML = '<div id="dropText" class="text-muted text-sm w-100 text-center" style="font-style:italic;">Click elements in the table to add them here, then click Combine!</div>';
            return;
        }
        
        let html = '';
        alchemySelection.forEach((el, index) => {
            const color = CATEGORIES[el.c] ? CATEGORIES[el.c].color : 'var(--border)';
            html += `
            <div style="position:relative; width:60px; height:60px; border-radius:8px; border:2px solid ${color}; background:rgba(0,0,0,0.5); display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0;">
                <span style="font-size:0.6rem; color:var(--text-muted); position:absolute; top:2px; left:4px;">${el.n}</span>
                <span style="font-weight:bold; font-size:1.2rem; color:${color};">${el.s}</span>
                <button onclick="removeFromAlchemy(${index})" style="position:absolute; top:-8px; right:-8px; background:var(--danger); color:#fff; border:none; border-radius:50%; width:20px; height:20px; font-size:0.7rem; cursor:pointer; display:flex; align-items:center; justify-content:center;">×</button>
            </div>
            `;
            if(index < alchemySelection.length - 1) {
                html += `<span style="color:var(--accent); font-weight:bold; font-size:1.5rem;">+</span>`;
            }
        });
        dz.innerHTML = html;
    }
    
    window.removeFromAlchemy = function(index) {
        alchemySelection.splice(index, 1);
        renderAlchemyDropzone();
    };
    
    document.getElementById('combineBtn')?.addEventListener('click', () => {
        if(alchemySelection.length === 0) return;
        
        const nums = alchemySelection.map(e => e.n).sort((a,b)=>a-b);
        const results = findReactions(nums);
        
        const resultPanel = document.getElementById('alchemyResult');
        const title = document.getElementById('resultTitle');
        const desc = document.getElementById('resultDesc');
        const container3d = document.getElementById('result3DContainer');
        
        resultPanel.style.display = 'flex';
        container3d.innerHTML = '';
        
        if (results.length > 0) {
            const r = results[0];
            title.textContent = "Synthesized: " + r.product;
            title.style.color = 'var(--neon-green)';
            desc.innerHTML = `<strong>${r.name}</strong><br>Type: ${r.type}<br>Equation: <span style="font-family:monospace;">${r.ratio} → ${r.product}</span>`;
            
            // Draw 3D molecule based on reaction!
            draw3DMolecule(r.product, container3d);
        } else {
            title.textContent = "Reaction Failed";
            title.style.color = 'var(--danger)';
            desc.innerHTML = "No stable compound forms from these elements directly under normal conditions.";
            // Draw explosion or dust
            draw3DFailedReaction(container3d);
        }
    });
    
    document.getElementById('closeResultBtn')?.addEventListener('click', () => {
        document.getElementById('alchemyResult').style.display = 'none';
        if(window.currentMolModel) {
            cancelAnimationFrame(window.currentMolModel.req);
            window.currentMolModel.renderer.dispose();
            window.currentMolModel = null;
        }
    });

    function draw3DMolecule(formula, container) {
        const w = container.clientWidth;
        const h = container.clientHeight;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 1000);
        camera.position.z = 40;
        
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);
        
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        
        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        scene.add(dirLight);
        
        const molGroup = new THREE.Group();
        scene.add(molGroup);
        
        // Simple heuristic for molecular geometry based on formula
        // NaCl -> linear
        // H2O -> bent
        // CO2 -> linear
        // CH4 -> tetrahedral
        
        const atomGeo = new THREE.SphereGeometry(1, 32, 32);
        const bondGeo = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
        const matC = new THREE.MeshPhysicalMaterial({color:0x222222, metalness:0.1, roughness:0.5}); // Carbon
        const matO = new THREE.MeshPhysicalMaterial({color:0xff0000, metalness:0.1, roughness:0.5}); // Oxygen
        const matH = new THREE.MeshPhysicalMaterial({color:0xffffff, metalness:0.1, roughness:0.5}); // Hydrogen
        const matNa = new THREE.MeshPhysicalMaterial({color:0xaa55ff, metalness:0.5, roughness:0.3}); // Sodium
        const matCl = new THREE.MeshPhysicalMaterial({color:0x00ff00, metalness:0.1, roughness:0.5}); // Chlorine
        const bondMat = new THREE.MeshPhysicalMaterial({color:0xaaaaaa, metalness:0.5, roughness:0.2});
        
        function addAtom(mat, x, y, z, r=1) {
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 32), mat);
            mesh.position.set(x, y, z);
            molGroup.add(mesh);
            return mesh;
        }
        
        function addBond(p1, p2) {
            const dist = p1.distanceTo(p2);
            const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, dist, 8), bondMat);
            mesh.position.copy(p1).lerp(p2, 0.5);
            mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
            molGroup.add(mesh);
        }

        if(formula === "H2O") {
            const o = addAtom(matO, 0, 0, 0, 1.5);
            const h1 = addAtom(matH, -2, -1.5, 0, 0.8);
            const h2 = addAtom(matH, 2, -1.5, 0, 0.8);
            addBond(o.position, h1.position);
            addBond(o.position, h2.position);
        } else if(formula === "CO2") {
            const c = addAtom(matC, 0, 0, 0, 1.2);
            const o1 = addAtom(matO, -3, 0, 0, 1.5);
            const o2 = addAtom(matO, 3, 0, 0, 1.5);
            addBond(c.position, o1.position);
            addBond(c.position, o2.position);
        } else if(formula === "NaCl") {
            const na = addAtom(matNa, -2, 0, 0, 1.4);
            const cl = addAtom(matCl, 2, 0, 0, 1.8);
            addBond(na.position, cl.position);
        } else {
            // Generic cluster for unknown combinations
            const matGen = new THREE.MeshPhysicalMaterial({color:0x00aaff, metalness:0.3, roughness:0.2, transmission:0.5, transparent:true});
            const c = addAtom(matGen, 0,0,0, 2);
            for(let i=0; i<3; i++) {
                const a = addAtom(matGen, (Math.random()-0.5)*6, (Math.random()-0.5)*6, (Math.random()-0.5)*6, 1);
                addBond(c.position, a.position);
            }
        }
        
        const render = () => {
            const req = requestAnimationFrame(render);
            molGroup.rotation.y += 0.01;
            controls.update();
            renderer.render(scene, camera);
            window.currentMolModel = { req, renderer };
        };
        render();
    }
    
    function draw3DFailedReaction(container) {
        const w = container.clientWidth;
        const h = container.clientHeight;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 1000);
        camera.position.z = 40;
        
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);
        
        const geo = new THREE.BufferGeometry();
        const count = 500;
        const pos = new Float32Array(count * 3);
        for(let i=0; i<count*3; i++) pos[i] = (Math.random()-0.5)*20;
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({color: 0x888888, size: 0.5, transparent:true, opacity:0.6});
        const points = new THREE.Points(geo, mat);
        scene.add(points);
        
        const render = () => {
            const req = requestAnimationFrame(render);
            points.rotation.y += 0.02;
            points.rotation.x += 0.01;
            renderer.render(scene, camera);
            window.currentMolModel = { req, renderer };
        };
        render();
    }

})();


// ------------------------------------------------------------------
// ADVANCED PROPERTIES AND CLASSIFICATIONS
// ------------------------------------------------------------------
const propertySelect = document.getElementById('propertySelect');
const classificationSelect = document.getElementById('classificationSelect');
const propertySliderArea = document.getElementById('propertySliderArea');
const tempSliderArea = document.getElementById('tempSliderArea');
const sliderLabel = document.getElementById('sliderLabel');
const sliderMinVal = document.getElementById('sliderMinVal');
const sliderMaxVal = document.getElementById('sliderMaxVal');

let currentProperty = '';
let currentClassification = 'category';

propertySelect?.addEventListener('change', (e) => {
    currentProperty = e.target.value;
    if(currentProperty) {
        classificationSelect.value = '';
        currentClassification = '';
        tempSliderArea.style.display = 'none';
        propertySliderArea.style.display = 'flex';
        updatePropertyColors();
    } else {
        propertySliderArea.style.display = 'none';
        classificationSelect.value = 'category';
        currentClassification = 'category';
        updateClassificationColors();
    }
});

classificationSelect?.addEventListener('change', (e) => {
    currentClassification = e.target.value;
    if(currentClassification) {
        propertySelect.value = '';
        currentProperty = '';
        propertySliderArea.style.display = 'none';
        
        if(currentClassification === 'state') {
            tempSliderArea.style.display = 'flex';
        } else {
            tempSliderArea.style.display = 'none';
        }
        updateClassificationColors();
    }
});

function updatePropertyColors() {
    if(!currentProperty) return;
    
    // Find min and max
    let min = Infinity, max = -Infinity;
    elements.forEach(el => {
        let val = el[currentProperty];
        if(val !== null && val !== undefined) {
            if(val < min) min = val;
            if(val > max) max = val;
        }
    });
    
    if(min === Infinity) return;
    
    sliderMinVal.textContent = min.toFixed(1);
    sliderMaxVal.textContent = max.toFixed(1);
    
    const propNames = {
        'melt': 'Melting Point (K)',
        'boil': 'Boiling Point (K)',
        'density': 'Density',
        'electronegativity': 'Electronegativity',
        'first_ionization': '1st Ionization Energy',
        'electron_affinity': 'Electron Affinity',
        'specific_heat': 'Specific Heat'
    };
    sliderLabel.textContent = propNames[currentProperty] || currentProperty;
    
    document.querySelectorAll('.element').forEach(elDiv => {
        const n = parseInt(elDiv.dataset.n);
        const el = elements.find(e => e.n === n);
        const val = el[currentProperty];
        
        if(val !== null && val !== undefined) {
            // Calculate gradient position
            const pct = (val - min) / (max - min);
            
            // HSL from Blue (240) to Red (0)
            const hue = (1 - pct) * 240;
            elDiv.style.background = `hsla(${hue}, 80%, 30%, 0.9)`;
            elDiv.style.borderColor = `hsla(${hue}, 100%, 50%, 0.8)`;
            elDiv.style.boxShadow = `0 0 10px hsla(${hue}, 100%, 50%, 0.3)`;
            elDiv.style.opacity = 1;
            
            // Add a small label with the value if it doesn't exist
            let valLabel = elDiv.querySelector('.prop-val');
            if(!valLabel) {
                valLabel = document.createElement('div');
                valLabel.className = 'prop-val';
                valLabel.style.fontSize = '0.55rem';
                valLabel.style.marginTop = '2px';
                valLabel.style.color = 'rgba(255,255,255,0.8)';
                elDiv.appendChild(valLabel);
            }
            valLabel.textContent = Number.isInteger(val) ? val : val.toFixed(2);
        } else {
            elDiv.style.background = 'rgba(20,20,30,0.6)';
            elDiv.style.borderColor = 'var(--border)';
            elDiv.style.boxShadow = 'none';
            elDiv.style.opacity = 0.3;
            const valLabel = elDiv.querySelector('.prop-val');
            if(valLabel) valLabel.textContent = '';
        }
    });
    
    const legendFilter = document.getElementById('legendFilter');
    if(legendFilter) legendFilter.innerHTML = '';
}

function updateClassificationColors() {
    // Remove property values
    document.querySelectorAll('.prop-val').forEach(el => el.remove());
    
    const legendFilter = document.getElementById('legendFilter');
    if(legendFilter) legendFilter.innerHTML = '';
    
    document.querySelectorAll('.element').forEach(elDiv => {
        elDiv.style.opacity = 1;
        elDiv.style.boxShadow = '';
        elDiv.className = 'element'; // reset to base
        const n = parseInt(elDiv.dataset.n);
        const el = elements.find(e => e.n === n);
        
        if(currentClassification === 'category') {
            elDiv.classList.add('cat-' + el.c);
        } else if(currentClassification === 'block') {
            elDiv.classList.add('cat-' + (el.block || 'unknown').toLowerCase());
        } else if(currentClassification === 'state') {
            const temp = parseFloat(document.getElementById('tempInput')?.value || 298);
            let state = 'solid';
            if(el.melt !== null && temp >= el.melt) state = 'liquid';
            if(el.boil !== null && temp >= el.boil) state = 'gas';
            if(el.melt === null && el.boil === null) state = 'unknown';
            
            if(state === 'gas') {
                elDiv.style.background = 'rgba(239, 68, 68, 0.2)';
                elDiv.style.borderColor = 'var(--danger)';
            } else if (state === 'liquid') {
                elDiv.style.background = 'rgba(59, 130, 246, 0.2)';
                elDiv.style.borderColor = 'var(--info)';
            } else if (state === 'solid') {
                elDiv.style.background = 'rgba(16, 185, 129, 0.2)';
                elDiv.style.borderColor = 'var(--success)';
            } else {
                elDiv.style.background = 'rgba(100, 116, 139, 0.2)';
                elDiv.style.borderColor = 'var(--border)';
            }
        }
    });
}

// Override original updateElementColors if needed, or just let events handle it
const originalTempChange = document.getElementById('tempInput')?.onchange;
document.getElementById('tempInput')?.addEventListener('input', (e) => {
    document.getElementById('tempVal').textContent = e.target.value + ' K';
    if(currentClassification === 'state') {
        updateClassificationColors();
    }
});

// Update the 3D Bohr model logic
function draw3DAtomicModel(el) {
    const container = document.getElementById('threeContainer');
    if(!container) return;
    container.innerHTML = ''; // clear old
    
    if(window.currentAtomicModel) {
        cancelAnimationFrame(window.currentAtomicModel.req);
        window.currentAtomicModel.renderer.dispose();
    }
    
    const w = container.clientWidth;
    const h = container.clientHeight;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 1000);
    camera.position.z = Math.min(40 + (el.shells ? el.shells.length * 8 : 20), 120);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);
    
    const atomGroup = new THREE.Group();
    scene.add(atomGroup);
    
    // NUCLEUS
    const protons = el.n;
    const neutrons = Math.round(el.mass) - protons;
    
    const nucGroup = new THREE.Group();
    const nucRadius = Math.min(2 + protons * 0.05, 8);
    
    const protonMat = new THREE.MeshPhysicalMaterial({ color: 0xff3333, metalness: 0.2, roughness: 0.5 });
    const neutronMat = new THREE.MeshPhysicalMaterial({ color: 0x888888, metalness: 0.2, roughness: 0.5 });
    
    const totalParticles = Math.min(protons + (neutrons > 0 ? neutrons : 0), 150); // cap for performance
    for(let i=0; i<totalParticles; i++) {
        const isProton = i % 2 === 0;
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), isProton ? protonMat : neutronMat);
        const phi = Math.acos(-1 + (2 * i) / totalParticles);
        const theta = Math.sqrt(totalParticles * Math.PI) * phi;
        const r = Math.random() * nucRadius;
        mesh.position.setFromSphericalCoords(r, phi, theta);
        nucGroup.add(mesh);
    }
    atomGroup.add(nucGroup);
    
    // ELECTRONS
    const shells = el.shells || [];
    const electronMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    
    const rings = [];
    
    shells.forEach((electronCount, index) => {
        const ringRadius = 10 + index * 6;
        
        // Draw the orbit ring
        const ringGeo = new THREE.RingGeometry(ringRadius - 0.1, ringRadius + 0.1, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, side: THREE.DoubleSide });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        atomGroup.add(ringMesh);
        
        // Add electrons
        const shellGroup = new THREE.Group();
        for(let e=0; e<electronCount; e++) {
            const electron = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), electronMat);
            const angle = (e / electronCount) * Math.PI * 2;
            electron.position.set(Math.cos(angle) * ringRadius, 0, Math.sin(angle) * ringRadius);
            shellGroup.add(electron);
        }
        
        // Give each shell a slightly different rotation plane
        shellGroup.rotation.x = (Math.random() - 0.5) * 0.5;
        shellGroup.rotation.z = (Math.random() - 0.5) * 0.5;
        
        atomGroup.add(shellGroup);
        rings.push({ group: shellGroup, speed: 0.02 / (index + 1) });
    });
    
    const render = () => {
        const req = requestAnimationFrame(render);
        nucGroup.rotation.y += 0.005;
        nucGroup.rotation.x += 0.003;
        
        rings.forEach(ring => {
            ring.group.rotation.y += ring.speed;
        });
        
        controls.update();
        renderer.render(scene, camera);
        window.currentAtomicModel = { req, renderer };
    };
    render();
}

// Ensure classification runs on init
setTimeout(() => {
    updateClassificationColors();
}, 500);

