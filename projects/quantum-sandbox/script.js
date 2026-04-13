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
        H: [[new C(SQRT2_INV), new C(SQRT2_INV)], [new C(SQRT2_INV), new C(-SQRT2_INV)]]
    };

    let numQubits = 3;
    const maxSteps = 8;
    let circuit = []; // Array of steps, each step is an array of gates for each qubit [gateType, ...]. CNOT is a special string 'CNOT:target' on the control qubit, 'T' on target.

    function initCircuit() {
        circuit = Array.from({length: maxSteps}, () => Array(numQubits).fill('I'));
        renderCircuit();
        simulate();
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

    function renderVis(state) {
        const pContainer = $('#probChart');
        pContainer.innerHTML = '';
        let vecStr = '';

        state.forEach((amp, idx) => {
            const prob = amp.magSq();
            const bin = getBinaryString(idx, numQubits);
            
            // Vector text
            if (prob > 0.0001) {
                vecStr += `|${bin}⟩: ${amp.toString()} <br>`;
            }

            // Chart bar
            const row = document.createElement('div');
            row.className = 'prob-row';
            row.innerHTML = `
                <div class="prob-label">|${bin}⟩</div>
                <div class="prob-bar-container">
                    <div class="prob-bar" style="width: ${(prob*100).toFixed(1)}%"></div>
                </div>
                <div class="prob-val">${(prob*100).toFixed(1)}%</div>
            `;
            pContainer.appendChild(row);
        });

        $('#stateVector').innerHTML = vecStr || "Invalid State";
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

    initCircuit();

})();
