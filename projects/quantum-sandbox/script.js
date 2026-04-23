'use strict';
(function() {
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    if(typeof QU !== 'undefined') QU.init({ kofi: true, theme: true });

    // --- Complex Math & Quantum Simulation ---
    class C {
        constructor(r, i=0) { this.r = r; this.i = i; }
        add(c) { return new C(this.r + c.r, this.i + c.i); }
        sub(c) { return new C(this.r - c.r, this.i - c.i); }
        mul(c) { return new C(this.r*c.r - this.i*c.i, this.r*c.i + this.i*c.r); }
        scale(s) { return new C(this.r*s, this.i*s); }
        mag() { return Math.sqrt(this.r*this.r + this.i*this.i); }
        magSq() { return this.r*this.r + this.i*this.i; }
        toString() { 
            let rr = this.r.toFixed(2), ii = this.i.toFixed(2);
            if(Math.abs(this.r)<1e-10) rr='0.00'; if(Math.abs(this.i)<1e-10) ii='0.00';
            if (parseFloat(ii) === 0) return `${rr}`;
            return `${rr} ${this.i >= 0 ? '+' : '-'} ${Math.abs(parseFloat(ii)).toFixed(2)}i`;
        }
    }
    const c0 = new C(0), c1 = new C(1), ci = new C(0,1), cni = new C(0,-1);
    const SQRT2_INV = 1 / Math.sqrt(2);

    // Basic 1-qubit Gates (2x2 matrices of Complex)
    const GATES = {
        I: [[c1, c0], [c0, c1]],
        X: [[c0, c1], [c1, c0]],
        Y: [[c0, cni], [ci, c0]],
        Z: [[c1, c0], [c0, new C(-1)]],
        H: [[new C(SQRT2_INV), new C(SQRT2_INV)], [new C(SQRT2_INV), new C(-SQRT2_INV)]],
        S: [[c1, c0], [c0, ci]],
        TG: [[c1, c0], [c0, new C(Math.cos(Math.PI/4), Math.sin(Math.PI/4))]]
    };

    let numQubits = 3;
    const maxSteps = 8;
    let circuit = []; // Array of steps, each step is an array of gates for each qubit [gateType, ...]. CNOT is a special string 'CNOT:target' on the control qubit, 'T' on target.

    function initCircuit() {
        circuit = Array.from({length: maxSteps}, () => Array(numQubits).fill('I'));
        const qc = $('#qubitCount');
        if (qc) qc.textContent = numQubits;
        renderCircuit();
        simulate();
        generateQASM();
    }

    // Apply 1-qubit gate to state vector
    function applyGate(state, gateMatrix, targetQubit) {
        const n = state.length;
        const newState = Array(n).fill(0).map(()=>new C(0));
        const bit = 1 << targetQubit;
        
        for (let i = 0; i < n; i++) {
            if ((i & bit) === 0) {
                const i0 = i;
                const i1 = i | bit;
                const a = state[i0];
                const b = state[i1];
                
                newState[i0] = a.mul(gateMatrix[0][0]).add(b.mul(gateMatrix[0][1]));
                newState[i1] = a.mul(gateMatrix[1][0]).add(b.mul(gateMatrix[1][1]));
            }
        }
        return newState;
    }

    // Apply CNOT gate
    function applyCNOT(state, ctrl, targ) {
        const n = state.length;
        const newState = Array(n).fill(0).map(()=>new C(0));
        const ctrlBit = 1 << ctrl;
        const targBit = 1 << targ;
        
        for (let i = 0; i < n; i++) {
            if ((i & ctrlBit) === 0) {
                // Control is 0, nothing happens
                newState[i] = state[i];
                newState[i | ctrlBit] = state[i | ctrlBit]; // wait, will be handled in loop?
            } else {
                // Control is 1, flip target
                // Since we iterate all i, we must check if we already handled it to avoid double swap.
            }
        }
        
        // Safer way: map every basis state directly
        for(let i=0; i<n; i++) {
            if ((i & ctrlBit) !== 0) {
                let flipped = i ^ targBit;
                newState[flipped] = state[i];
            } else {
                newState[i] = state[i];
            }
        }
        return newState;
    }

    function simulate() {
        let nStates = 1 << numQubits;
        let state = Array(nStates).fill(0).map(()=>new C(0));
        state[0] = new C(1); // Start in |0...0>

        for (let step = 0; step < maxSteps; step++) {
            // Find CNOTs first
            for (let q = 0; q < numQubits; q++) {
                if (circuit[step][q].startsWith('CNOT:')) {
                    const targ = parseInt(circuit[step][q].split(':')[1]);
                    // apply CNOT
                    state = applyCNOT(state, numQubits - 1 - q, numQubits - 1 - targ); // Reverse bit order so q=0 is MSB
                }
            }
            // Apply single qubit gates
            for (let q = 0; q < numQubits; q++) {
                const g = circuit[step][q];
                if (g !== 'I' && !g.startsWith('CNOT') && g !== 'T' && g !== 'M') { // skip CNOT parts and measure (Measure is just visual here)
                    state = applyGate(state, GATES[g], numQubits - 1 - q);
                }
            }
        }

        renderVis(state);
    }

    function getBinaryString(num, padding) {
        return num.toString(2).padStart(padding, '0');
    }

    let probChartInstance = null;
    function renderVis(state) {
        let vecStr = '';
        const labels = [];
        const probs = [];
        const barColors = [];

        state.forEach((amp, idx) => {
            const prob = amp.magSq();
            const bin = getBinaryString(idx, numQubits);
            labels.push(`|${bin}⟩`);
            probs.push(parseFloat((prob * 100).toFixed(2)));
            // Neon gradient: green to purple based on index
            const hue = 140 + (idx / state.length) * 180;
            barColors.push(`hsla(${hue}, 80%, 55%, 0.75)`);

            if (prob > 0.0001) {
                vecStr += `|${bin}⟩: ${amp.toString()} <br>`;
            }
        });

        // Chart.js
        const canvas = document.getElementById('probChartCanvas');
        if (canvas && typeof Chart !== 'undefined') {
            const ctx = canvas.getContext('2d');
            if (probChartInstance) probChartInstance.destroy();
            probChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Probability (%)',
                        data: probs,
                        backgroundColor: barColors,
                        borderColor: barColors.map(c => c.replace('0.75', '1')),
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 400, easing: 'easeOutQuart' },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(10,10,30,0.9)',
                            titleColor: '#7af0c8',
                            bodyColor: '#ccc',
                            bodyFont: { family: 'Space Grotesk', size: 12 },
                            cornerRadius: 6,
                            callbacks: { label: ctx => `${ctx.parsed.y.toFixed(1)}%` }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: { color: '#64748b', font: { family: 'Space Grotesk', size: 10 }, callback: v => v + '%' },
                            grid: { color: 'rgba(255,255,255,0.04)' }
                        },
                        x: {
                            ticks: { color: '#7af0c8', font: { family: 'Space Grotesk', size: 10, weight: 'bold' } },
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        $('#stateVector').innerHTML = vecStr || "Invalid State";
        
        // Compute Bloch Vector for Q0
        const bit = 1 << (numQubits - 1); // Q0 is MSB in our loop
        let r00 = 0, r11 = 0;
        let r01 = new C(0);
        for(let i=0; i< (1<<numQubits); i++) {
            if((i & bit) === 0) {
                const amp0 = state[i];
                const amp1 = state[i | bit];
                r00 += amp0.magSq();
                r11 += amp1.magSq();
                const c_amp1_conj = new C(amp1.r, -amp1.i);
                r01 = r01.add(amp0.mul(c_amp1_conj));
            }
        }
        const x = 2 * r01.r;
        const y = -2 * r01.i;
        const z = r00 - r11;
        updateBloch3D(x, y, z);
        updateProbabilityClouds(state);
    }

    // --- Three.js Setup (Bloch Sphere & Probability Clouds) ---
    let blochScene, blochCamera, blochRenderer, blochVector;
    function initBloch3D() {
        const container = $('#blochContainer');
        if(!container || typeof THREE === 'undefined') return;
        blochScene = new THREE.Scene();
        blochCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        blochCamera.position.set(2, 1.5, 3);
        
        blochRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        blochRenderer.setSize(container.clientWidth, container.clientHeight);
        blochRenderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(blochRenderer.domElement);
        
        const controls = new THREE.OrbitControls(blochCamera, blochRenderer.domElement);
        controls.enablePan = false;
        controls.enableZoom = false;

        // Sphere
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0x44aa88, wireframe: true, transparent: true, opacity: 0.15 });
        blochScene.add(new THREE.Mesh(geometry, material));

        // Axes (X, Y, Z in Three.js terms)
        const axesHelper = new THREE.AxesHelper(1.2);
        blochScene.add(axesHelper);

        // Vector
        const dir = new THREE.Vector3(0, 1, 0); // pointing up
        const origin = new THREE.Vector3(0, 0, 0);
        blochVector = new THREE.ArrowHelper(dir, origin, 1, 0x00ffcc, 0.2, 0.15);
        blochScene.add(blochVector);

        const animate = function () {
            requestAnimationFrame(animate);
            controls.update();
            blochRenderer.render(blochScene, blochCamera);
        };
        animate();
    }

    function updateBloch3D(x, y, z) {
        if(!blochVector) return;
        // Bloch standard: Z is Up, X is front, Y is right
        // Three.js: Y is Up, Z is front, X is right
        const dir = new THREE.Vector3(y, z, x).normalize();
        
        if (Math.abs(x)<0.01 && Math.abs(y)<0.01 && Math.abs(z)<0.01) {
            blochVector.visible = false;
        } else {
            blochVector.visible = true;
            blochVector.setDirection(dir);
            blochVector.setLength(Math.sqrt(x*x + y*y + z*z));
        }
        const st = $('#blochStats');
        if(st) st.textContent = `x: ${x.toFixed(2)}  y: ${y.toFixed(2)}  z: ${z.toFixed(2)}`;
    }

    let cloudScene, cloudCamera, cloudRenderer, particles;
    let cloudGeo;
    function initProbabilityClouds() {
        const container = $('#cloudContainer');
        if(!container || typeof THREE === 'undefined') return;
        cloudScene = new THREE.Scene();
        cloudCamera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
        cloudCamera.position.z = 60;

        cloudRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        cloudRenderer.setSize(window.innerWidth, window.innerHeight);
        cloudRenderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(cloudRenderer.domElement);

        cloudGeo = new THREE.BufferGeometry();
        const count = 6000;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        
        cloudGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        cloudGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({ 
            size: 1.5, 
            vertexColors: true, 
            transparent: true, 
            opacity: 0.6, 
            blending: THREE.AdditiveBlending 
        });
        particles = new THREE.Points(cloudGeo, mat);
        cloudScene.add(particles);

        function animate() {
            requestAnimationFrame(animate);
            particles.rotation.y += 0.001;
            particles.rotation.x += 0.0005;
            cloudRenderer.render(cloudScene, cloudCamera);
        }
        animate();

        window.addEventListener('resize', () => {
            if(!cloudRenderer) return;
            cloudCamera.aspect = window.innerWidth/window.innerHeight;
            cloudCamera.updateProjectionMatrix();
            cloudRenderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    function updateProbabilityClouds(state) {
        if(!cloudGeo) return;
        const count = 6000;
        const positions = cloudGeo.attributes.position.array;
        const colors = cloudGeo.attributes.color.array;

        let pIdx = 0;
        const nBasis = state.length;
        
        state.forEach((amp, idx) => {
            const prob = amp.magSq();
            const alloc = Math.floor(prob * count);
            if(alloc <= 0) return;
            
            // Assign color based on basis state
            const hue = (idx / nBasis) * 0.8 + 0.1; // spread across spectrum
            const color = new THREE.Color().setHSL(hue, 1, 0.6);

            // Assign a cluster center
            // Random fixed angle per index for stability
            const angle1 = idx * Math.PI * 0.6180339887 * 2; 
            const angle2 = idx * Math.PI * 1.41421356 * 2;
            const radius = 25;
            const cx = radius * Math.cos(angle1) * Math.sin(angle2);
            const cy = radius * Math.sin(angle1) * Math.sin(angle2);
            const cz = radius * Math.cos(angle2);

            for(let i=0; i<alloc; i++) {
                if(pIdx >= count) break;
                // Add noise
                positions[pIdx*3] = cx + (Math.random()-0.5)*20;
                positions[pIdx*3+1] = cy + (Math.random()-0.5)*20;
                positions[pIdx*3+2] = cz + (Math.random()-0.5)*20;
                
                colors[pIdx*3] = color.r;
                colors[pIdx*3+1] = color.g;
                colors[pIdx*3+2] = color.b;
                pIdx++;
            }
        });
        
        // Hide unused
        for(; pIdx < count; pIdx++) {
            positions[pIdx*3] = 0;
            positions[pIdx*3+1] = 0;
            positions[pIdx*3+2] = 0;
            colors[pIdx*3] = 0;
            colors[pIdx*3+1] = 0;
            colors[pIdx*3+2] = 0;
        }

        cloudGeo.attributes.position.needsUpdate = true;
        cloudGeo.attributes.color.needsUpdate = true;
    }

    // --- UI & Drag-Drop Logic ---
    let draggedGate = null;
    let pendingCnotCtrl = null; // {step, q}

    function renderCircuit() {
        const grid = $('#circuitGrid');
        grid.innerHTML = '';

        for (let q = 0; q < numQubits; q++) {
            const row = document.createElement('div');
            row.className = 'qubit-row';
            row.innerHTML = `<div class="qubit-label">Q${q}</div><div class="qubit-wire"></div>`;
            
            const cont = document.createElement('div');
            cont.className = 'slots-container';
            
            for (let step = 0; step < maxSteps; step++) {
                const slot = document.createElement('div');
                slot.className = 'gate-slot';
                slot.dataset.q = q;
                slot.dataset.step = step;

                const val = circuit[step][q];
                if (val !== 'I') {
                    slot.classList.add('has-gate');
                    const inst = document.createElement('div');
                    let displayVal = val;
                    if (val.startsWith('CNOT:')) displayVal = '●';
                    if (val === 'T') displayVal = '⊕';

                    inst.className = `gate-instance gate-${val.split(':')[0].toLowerCase()}`;
                    if(val === 'T') inst.style.borderColor = 'var(--gate-cx-color)';
                    if(val.startsWith('CNOT:')) inst.style.borderColor = 'var(--gate-cx-color)';
                    
                    inst.textContent = displayVal;
                    
                    // Click to remove
                    inst.addEventListener('click', () => {
                        if (val.startsWith('CNOT:')) {
                            const tg = parseInt(val.split(':')[1]);
                            circuit[step][tg] = 'I';
                        }
                        if (val === 'T') {
                            // Find control and remove it
                            for(let i=0; i<numQubits; i++) {
                                if(circuit[step][i] === `CNOT:${q}`) circuit[step][i] = 'I';
                            }
                        }
                        circuit[step][q] = 'I';
                        renderCircuit();
                        simulate();
                    });
                    
                    // Draw lines for CNOT
                    if (val.startsWith('CNOT:')) {
                        const tg = parseInt(val.split(':')[1]);
                        const line = document.createElement('div');
                        line.className = 'cnot-line';
                        const dist = Math.abs(tg - q);
                        line.style.height = `${dist * 70}px`; // approximate gap height
                        // adjust position depending on if target is above or below
                        if (tg > q) {
                            line.style.top = '25px';
                        } else {
                            line.style.bottom = '25px';
                        }
                        slot.appendChild(line);
                    }

                    slot.appendChild(inst);
                }

                // Drag and drop events
                slot.addEventListener('dragover', e => {
                    e.preventDefault();
                    if(pendingCnotCtrl && pendingCnotCtrl.step !== step) return; // Must be same step
                    slot.classList.add('drag-over');
                });
                slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
                slot.addEventListener('drop', e => {
                    e.preventDefault();
                    slot.classList.remove('drag-over');
                    
                    const qIdx = parseInt(slot.dataset.q);
                    const sIdx = parseInt(slot.dataset.step);

                    if (pendingCnotCtrl) {
                        if (pendingCnotCtrl.step === sIdx && pendingCnotCtrl.q !== qIdx) {
                            circuit[sIdx][pendingCnotCtrl.q] = `CNOT:${qIdx}`;
                            circuit[sIdx][qIdx] = 'T';
                        }
                        pendingCnotCtrl = null;
                        $$('.gate-slot').forEach(s => s.classList.remove('drag-over'));
                    } else if (draggedGate) {
                        if (draggedGate === 'CNOT') {
                            pendingCnotCtrl = {q: qIdx, step: sIdx};
                            // Hint to select target
                            alert("Select target qubit in the same column.");
                            return; // wait for next click 
                        } else {
                            // ensure clean CNOT replacement
                            if (circuit[sIdx][qIdx].startsWith('CNOT:')) {
                                const tg = parseInt(circuit[sIdx][qIdx].split(':')[1]);
                                circuit[sIdx][tg] = 'I';
                            }
                            if (circuit[sIdx][qIdx] === 'T') {
                                for(let i=0; i<numQubits; i++) {
                                    if(circuit[sIdx][i] === `CNOT:${qIdx}`) circuit[sIdx][i] = 'I';
                                }
                            }
                            circuit[sIdx][qIdx] = draggedGate;
                        }
                    }
                    renderCircuit();
                    simulate();
                });

                // In case user clicks to place CNOT target
                slot.addEventListener('click', () => {
                    if (pendingCnotCtrl) {
                        const qIdx = parseInt(slot.dataset.q);
                        const sIdx = parseInt(slot.dataset.step);
                        if (pendingCnotCtrl.step === sIdx && pendingCnotCtrl.q !== qIdx) {
                            circuit[sIdx][pendingCnotCtrl.q] = `CNOT:${qIdx}`;
                            circuit[sIdx][qIdx] = 'T';
                            pendingCnotCtrl = null;
                            renderCircuit();
                            simulate();
                        }
                    }
                });

                cont.appendChild(slot);
            }
            row.appendChild(cont);
            grid.appendChild(row);
        }
    }

    // Drag source setup
    $$('.q-gate').forEach(gt => {
        gt.addEventListener('dragstart', (e) => {
            draggedGate = gt.dataset.type;
            pendingCnotCtrl = null;
        });
        gt.addEventListener('dragend', () => draggedGate = null);
    });

    $('#addQubitBtn').onclick = () => { if(numQubits<5) {numQubits++; initCircuit();} };
    $('#remQubitBtn').onclick = () => { if(numQubits>1) {numQubits--; initCircuit();} };
    $('#resetBtn').onclick = () => initCircuit();

    const dEnt = $('#btnDemoEntangle');
    if(dEnt) dEnt.onclick = () => {
        numQubits = 2;
        circuit = Array.from({length: maxSteps}, () => Array(numQubits).fill('I'));
        circuit[0][0] = 'H';
        circuit[1][0] = 'CNOT:1';
        circuit[1][1] = 'T';
        renderCircuit();
        simulate();
    };

    const dInt = $('#btnDemoInterference');
    if(dInt) dInt.onclick = () => {
        numQubits = 1;
        circuit = Array.from({length: maxSteps}, () => Array(1).fill('I'));
        circuit[0][0] = 'H';
        circuit[1][0] = 'H';
        renderCircuit();
        simulate();
        generateQASM();
    };

    const dGHZ = $('#btnDemoGHZ');
    if(dGHZ) dGHZ.onclick = () => {
        numQubits = 3;
        circuit = Array.from({length: maxSteps}, () => Array(numQubits).fill('I'));
        circuit[0][0] = 'H';
        circuit[1][0] = 'CNOT:1';
        circuit[1][1] = 'T';
        circuit[2][1] = 'CNOT:2';
        circuit[2][2] = 'T';
        renderCircuit();
        simulate();
        generateQASM();
    };

    // QASM Export
    function generateQASM() {
        const qasmEl = $('#qasmOutput');
        if (!qasmEl) return;
        let qasm = `OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[${numQubits}];\ncreg c[${numQubits}];\n`;
        for (let step = 0; step < maxSteps; step++) {
            for (let q = 0; q < numQubits; q++) {
                const g = circuit[step][q];
                if (g === 'I' || g === 'T') continue;
                if (g === 'H') qasm += `h q[${q}];\n`;
                else if (g === 'X') qasm += `x q[${q}];\n`;
                else if (g === 'Y') qasm += `y q[${q}];\n`;
                else if (g === 'Z') qasm += `z q[${q}];\n`;
                else if (g === 'S') qasm += `s q[${q}];\n`;
                else if (g === 'TG') qasm += `t q[${q}];\n`;
                else if (g === 'M') qasm += `measure q[${q}] -> c[${q}];\n`;
                else if (g.startsWith('CNOT:')) {
                    const targ = parseInt(g.split(':')[1]);
                    qasm += `cx q[${q}],q[${targ}];\n`;
                }
            }
        }
        qasmEl.textContent = qasm;
    }

    const exportBtn = $('#exportQASM');
    if (exportBtn) exportBtn.onclick = () => {
        generateQASM();
        const qasmEl = $('#qasmOutput');
        if (qasmEl && qasmEl.textContent) {
            navigator.clipboard.writeText(qasmEl.textContent).then(() => {
                exportBtn.textContent = '✅ Copied!';
                setTimeout(() => { exportBtn.textContent = '📋 Copy QASM'; }, 2000);
            }).catch(() => {});
        }
    };

    initBloch3D();
    initProbabilityClouds();
    initCircuit();

    // Re-bind drag events for new gate elements added in HTML
    $$('.q-gate').forEach(gt => {
        gt.addEventListener('dragstart', (e) => {
            draggedGate = gt.dataset.type;
            pendingCnotCtrl = null;
        });
        gt.addEventListener('dragend', () => draggedGate = null);
    });

})();
