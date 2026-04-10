/* DNA Lab Simulator Implementation */
'use strict';

(function() {
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    // --- State & Constants ---
    let sequence = ''; // The 5' -> 3' coding string
    const canvas = $('#dnaCanvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    
    let width = 0, height = 0;
    
    // View state
    let viewMode = 'helix'; // helix or flat
    let rotation = 0;
    let autoRotate = true;
    let seqLengthTarget = parseInt($('#lengthSlider').value);
    
    // Sim state
    let simMode = 'idle'; // idle, tx_playing, tx_paused, tl_playing, tl_paused
    let simProgress = 0; // 0 to 1
    let mrnaStrand = '';
    let proteinChain = [];
    let simSpeed = 5;

    const COLORS = {
        A: '#10b981', T: '#ef4444', U: '#f59e0b', G: '#3b82f6', C: '#eab308',
        backbone1: '#8b5cf6', backbone2: '#ec4899', rnaBackbone: '#06b6d4',
        bg: '#0f0f14'
    };

    // Standard Genetic Code
    const CODON_TABLE = {
        'UUU':'Phe', 'UUC':'Phe', 'UUA':'Leu', 'UUG':'Leu',
        'CUU':'Leu', 'CUC':'Leu', 'CUA':'Leu', 'CUG':'Leu',
        'AUU':'Ile', 'AUC':'Ile', 'AUA':'Ile', 'AUG':'Met', // Start
        'GUU':'Val', 'GUC':'Val', 'GUA':'Val', 'GUG':'Val',
        'UCU':'Ser', 'UCC':'Ser', 'UCA':'Ser', 'UCG':'Ser',
        'CCU':'Pro', 'CCC':'Pro', 'CCA':'Pro', 'CCG':'Pro',
        'ACU':'Thr', 'ACC':'Thr', 'ACA':'Thr', 'ACG':'Thr',
        'GCU':'Ala', 'GCC':'Ala', 'GCA':'Ala', 'GCG':'Ala',
        'UAU':'Tyr', 'UAC':'Tyr', 'UAA':'STOP', 'UAG':'STOP',
        'CAU':'His', 'CAC':'His', 'CAA':'Gln', 'CAG':'Gln',
        'AAU':'Asn', 'AAC':'Asn', 'AAA':'Lys', 'AAG':'Lys',
        'GAU':'Asp', 'GAC':'Asp', 'GAA':'Glu', 'GAG':'Glu',
        'UGU':'Cys', 'UGC':'Cys', 'UGA':'STOP', 'UGG':'Trp',
        'CGU':'Arg', 'CGC':'Arg', 'CGA':'Arg', 'CGG':'Arg',
        'AGU':'Ser', 'AGC':'Ser', 'AGA':'Arg', 'AGG':'Arg',
        'GGU':'Gly', 'GGC':'Gly', 'GGA':'Gly', 'GGG':'Gly'
    };

    const AA_PROPERTIES = {
        'Met': 'met', 'STOP': 'stop',
        'Ala': 'nonpolar', 'Val': 'nonpolar', 'Leu': 'nonpolar', 'Ile': 'nonpolar', 'Pro': 'nonpolar', 'Phe': 'nonpolar', 'Trp': 'nonpolar',
        'Gly': 'polar', 'Ser': 'polar', 'Thr': 'polar', 'Cys': 'polar', 'Tyr': 'polar', 'Asn': 'polar', 'Gln': 'polar',
        'Asp': 'acidic', 'Glu': 'acidic',
        'Lys': 'basic', 'Arg': 'basic', 'His': 'basic'
    };

    // --- Core Data Functions ---
    
    function getComplement(base, isRna = false) {
        const map = { A: isRna?'U':'T', T: 'A', U: 'A', G: 'C', C: 'G' };
        return map[base] || '?';
    }

    function generateRandomSeq(len) {
        const bases = ['A', 'T', 'G', 'C'];
        let seq = '';
        // Ensure starting with ATG for translation to work nicely most of the time
        if (len > 3) {
            seq = 'ATG';
            len -= 3;
        }
        for(let i=0; i<len; i++) seq += bases[Math.floor(Math.random()*4)];
        return seq;
    }

    // --- UI Updaters ---
    
    function updateStats() {
        const len = sequence.length;
        $('#seqLen').textContent = `Length: ${len} bp`;
        
        let gcCount = 0;
        for(let i=0; i<len; i++) {
            if(sequence[i] === 'G' || sequence[i] === 'C') gcCount++;
        }
        
        const gcPercent = len === 0 ? 0 : Math.round((gcCount/len)*100);
        $('#gcContent').textContent = `${gcPercent}%`;
        
        // Approx melting temp: 4(G+C) + 2(A+T) for < 14bp, else 64.9 + 41*(G+C-16.4)/N
        let tm = 0;
        if(len === 0) tm = 0;
        else if(len < 14) tm = 4 * gcCount + 2 * (len - gcCount);
        else tm = 64.9 + 41 * (gcCount - 16.4) / len;
        $('#meltTemp').textContent = `${Math.round(tm)}°C`;
        
        // Approx MW: len * 660 Da / 1000 for kDa
        const mw = (len * 660 / 1000).toFixed(1);
        $('#molWt').textContent = `${mw} kDa`;
    }

    // Tab switching
    $$('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            $$('.tab-btn').forEach(b => b.classList.remove('active'));
            $$('.tab-pane').forEach(p => p.classList.remove('active'));
            
            e.target.classList.add('active');
            const targetId = `pane-${e.target.dataset.tab}`;
            $(`#${targetId}`).classList.add('active');
        });
    });

    // --- Rendering (Canvas) ---
    function initCanvas() {
        const rect = canvas.parentElement.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function renderFrame() {
        if(autoRotate) rotation += 0.01;
        
        // Background
        ctx.fillStyle = '#0f0f14';
        ctx.fillRect(0, 0, width, height);
        
        ctx.save();
        ctx.translate(width/2, height/2);
        
        const actualLen = sequence.length;
        // Don't try to draw massive strings explicitly if slider is 100, but we just draw what we have
        const spacing = Math.min(20, (height - 100) / Math.max(10, actualLen));
        const totalHeight = (actualLen - 1) * spacing;
        
        // Center vertically
        ctx.translate(0, -totalHeight/2);
        
        const radius = 60; // helix radius
        const rnaRadius = 80;
        const phaseShift = Math.PI; // Opposite strand
        const twistY = 0.2; // Radians per base pair
        
        for(let i=0; i<actualLen; i++) {
            const base1 = sequence[i];
            const base2 = getComplement(base1);
            const y = i * spacing;
            
            let angle = rotation + i * twistY;
            
            // Sim overrides
            let drawGap = false;
            let drawRnaBase = false;
            let rnaY = 0;
            
            if (simMode.startsWith('tx')) {
                // Transcription logic: Open helix locally
                const currentPos = simProgress * actualLen;
                const distToPol = Math.abs(currentPos - i);
                
                // Bubble effect
                if (distToPol < 3) {
                    angle = 0; // untwist
                    drawGap = true;
                    if (i <= currentPos) {
                        drawRnaBase = true;
                        rnaY = y - (currentPos - i) * spacing * 0.1; // Extrude outwards
                    }
                }
            }

            // Calculate x positions
            const isFlat = viewMode === 'flat' || drawGap;
            const x1 = isFlat ? -radius : Math.cos(angle) * radius;
            const x2 = isFlat ? radius : Math.cos(angle + phaseShift) * radius;
            
            // Z-sorting hack for 3D effect: draw back items first
            const z1 = isFlat ? 0 : Math.sin(angle);
            const z2 = isFlat ? 0 : Math.sin(angle + phaseShift);
            
            const r1 = 5 + (z1 + 1) * 2;
            const r2 = 5 + (z2 + 1) * 2;

            function drawStrand1() {
                ctx.beginPath();
                ctx.arc(x1, y, r1, 0, Math.PI*2);
                ctx.fillStyle = COLORS[base1] || '#888';
                ctx.fill();
            }

            function drawStrand2() {
                ctx.beginPath();
                ctx.arc(x2, y, r2, 0, Math.PI*2);
                ctx.fillStyle = COLORS[base2] || '#888';
                ctx.fill();
            }

            function drawBond() {
                if(drawGap) return; // Broken H-rods
                ctx.beginPath();
                ctx.moveTo(x1, y);
                ctx.lineTo(x2, y);
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            // Render back to front
            if (z1 < z2) {
                drawStrand1();
                drawBond();
                drawStrand2();
            } else {
                drawStrand2();
                drawBond();
                drawStrand1();
            }
            
            // Draw backbone connections (lazy lines to previous)
            if (i > 0) {
                const pBase1X = isFlat ? -radius : Math.cos(angle - twistY) * radius;
                const pBase2X = isFlat ? radius : Math.cos(angle - twistY + Math.PI) * radius;
                
                // Opacity based on z to push to back visually
                ctx.lineWidth = 3;
                
                ctx.strokeStyle = COLORS.backbone1;
                ctx.globalAlpha = isFlat ? 1 : (Math.sin(angle-twistY/2) + 1)/2 * 0.8 + 0.2;
                ctx.beginPath(); ctx.moveTo(pBase1X, y-spacing); ctx.lineTo(x1, y); ctx.stroke();
                
                ctx.strokeStyle = COLORS.backbone2;
                ctx.globalAlpha = isFlat ? 1 : (Math.sin(angle+Math.PI-twistY/2) + 1)/2 * 0.8 + 0.2;
                ctx.beginPath(); ctx.moveTo(pBase2X, y-spacing); ctx.lineTo(x2, y); ctx.stroke();
                
                ctx.globalAlpha = 1.0;
            }

            // Draw mRNA if in TX mode
            if (drawRnaBase) {
                const compRna = getComplement(base2, true); // Read from coding/template
                const rx = x2 + 50; // offset right
                
                ctx.beginPath();
                ctx.arc(rx, y, 6, 0, Math.PI*2);
                ctx.fillStyle = COLORS[compRna];
                ctx.fill();
                
                // connect RNA to template (x2 line)
                ctx.beginPath();
                ctx.moveTo(rx, y);
                ctx.lineTo(x2, y);
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 2]);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // RNA backbone
                if (i > 0 && simProgress * actualLen > i) {
                     ctx.beginPath();
                     ctx.moveTo(rx, y-spacing);
                     ctx.lineTo(rx, y);
                     ctx.strokeStyle = COLORS.rnaBackbone;
                     ctx.lineWidth = 3;
                     ctx.stroke();
                }
            }
        }
        
        // Draw RNA Polymerase (blob)
        if (simMode.startsWith('tx')) {
           const currentPos = simProgress * (actualLen - 1);
           const py = currentPos * spacing;
           
           ctx.beginPath();
           ctx.ellipse(0, py, 70, 30, 0, 0, Math.PI*2);
           ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
           ctx.fill();
           ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
           ctx.stroke();
        }

        ctx.restore();
        
        // Draw simple TL visualization if in TL mode (just a flowing effect)
        if (simMode.startsWith('tl')) {
            drawTranslationOverlay();
        }

        requestAnimationFrame(renderFrame);
    }

    function drawTranslationOverlay() {
         const t = Date.now() / 1000;
         const ox = width / 2;
         const oy = height / 2;
         
         // Draw Ribosome
         ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
         ctx.beginPath();
         ctx.arc(ox, oy, 80, 0, Math.PI*2);
         ctx.fill();
         ctx.beginPath();
         ctx.arc(ox, oy+40, 50, 0, Math.PI*2);
         ctx.fill();
         
         // mRNA passing through
         if(mrnaStrand.length > 0) {
             const cx = simProgress * mrnaStrand.length * 20; // 20px per base
             ctx.fillStyle = COLORS.rnaBackbone;
             ctx.fillRect(ox - 150, oy - 2, 300, 4);
             
             // Draw passing bases
             ctx.save();
             ctx.rect(ox - 100, oy - 20, 200, 40);
             ctx.clip();
             
             for(let i=0; i<mrnaStrand.length; i++) {
                 const bx = ox + (i * 20) - cx;
                 ctx.fillStyle = COLORS[mrnaStrand[i]] || '#fff';
                 ctx.fillRect(bx - 5, oy - 15, 10, 15);
             }
             ctx.restore();
         }
    }

    // --- Core Logic ---

    function parseInput() {
        const raw = $('#dnaInput').value.toUpperCase().replace(/[^ATGCN]/g, '').replace(/N/g, 'A');
        sequence = raw;
        $('#dnaInput').value = sequence;
        updateStats();

        // Reset everything
        simMode = 'idle';
        simProgress = 0;
        mrnaStrand = '';
        proteinChain = [];
        $('#simOverlay').classList.add('hidden');
        $('#proteinChainContainer').classList.add('hidden');
        $('#startTranslationBtn').disabled = true;
        $('#mRNAOutput').innerHTML = 'Sequence changed. Re-run transcription.';
    }

    // Output formatter helper
    function getColoredSeqHtml(seq, isRna = false) {
        return seq.split('').map(b => `<span class="base-${b.toLowerCase()}">${b}</span>`).join('');
    }

    // Transcription Logic
    function startTranscription() {
        if(sequence.length === 0) return;
        simMode = 'tx_playing';
        simProgress = 0;
        mrnaStrand = '';
        autoRotate = false;
        
        $('#simOverlay').classList.remove('hidden');
        $('#simStatus').textContent = 'Transcription...';
        $('#codonReader').classList.add('hidden');
        $('#proteinChainContainer').classList.add('hidden');
        
        $('#pauseTxBtn').disabled = false;
        $('#resetTxBtn').disabled = false;
        
        $('#mRNAOutput').innerHTML = '';
        
        txStep();
    }

    function txStep() {
        if(simMode !== 'tx_playing') return;
        
        // speed maps 1-10 to step sizes
        const stepSize = simSpeed / 1000; 
        simProgress += stepSize;
        
        // Build mRNA string incrementally
        const basesRead = Math.floor(simProgress * sequence.length);
        if(basesRead > mrnaStrand.length && basesRead <= sequence.length) {
            // Add next base.
            // Simplified: reading Coding strand (sequence) replace T with U for mRNA
            const nextBase = sequence[mrnaStrand.length].replace('T', 'U');
            mrnaStrand += nextBase;
            // update UI smoothly
            $('#mRNAOutput').innerHTML = getColoredSeqHtml(mrnaStrand, true);
        }

        if(simProgress >= 1.0) {
            simProgress = 1.0;
            simMode = 'idle';
            autoRotate = true;
            $('#simStatus').textContent = 'Transcription Complete';
            $('#pauseTxBtn').disabled = true;
            $('#startTranslationBtn').disabled = false;
            $('#translationWarn').style.display = 'none';
        } else {
            requestAnimationFrame(txStep);
        }
    }

    // Translation Logic
    function startTranslation() {
        if(mrnaStrand.length < 3) return;
        // switch tab
        $$('.tab-btn')[2].click();
        
        simMode = 'tl_playing';
        simProgress = 0;
        proteinChain = [];
        
        $('#simOverlay').classList.remove('hidden');
        $('#simStatus').textContent = 'Translation...';
        $('#codonReader').classList.remove('hidden');
        $('#proteinChainContainer').classList.remove('hidden');
        $('#proteinChain').innerHTML = ''; // clear
        
        tlStep();
    }

    function tlStep() {
        if(simMode !== 'tl_playing') return;
        
        const stepSize = simSpeed / 1000;
        simProgress += stepSize;
        
        const charsRead = Math.floor(simProgress * mrnaStrand.length);
        const currentCodonStart = charsRead - (charsRead % 3);
        
        if (currentCodonStart + 3 <= mrnaStrand.length) {
            const codon = mrnaStrand.substring(currentCodonStart, currentCodonStart + 3);
            const aa = CODON_TABLE[codon] || 'Unknown';
            
            $('#currentCodon').innerHTML = getColoredSeqHtml(codon, true);
            $('#currentAmino').textContent = aa;
            
            // Add AA to chain if we just transitioned into this codon entirely?
            // Simplified: We just determine how many complete codons we've read
            const numCodonsRead = Math.floor(charsRead / 3);
            if (proteinChain.length < numCodonsRead) {
                // New AA added
                proteinChain.push(aa);
                renderProteinChain();
                
                if (aa === 'STOP') {
                    // Halt translation early
                    simProgress = 1.0;
                }
            }
        }

        if(simProgress >= 1.0) {
            simProgress = 1.0;
            simMode = 'idle';
            $('#simStatus').textContent = 'Translation Complete';
            setTimeout(() => { $('#simOverlay').classList.add('hidden'); }, 3000);
        } else {
            requestAnimationFrame(tlStep);
        }
    }

    function renderProteinChain() {
        const c = $('#proteinChain');
        c.innerHTML = '';
        proteinChain.forEach(aa => {
            const div = document.createElement('div');
            const propClass = AA_PROPERTIES[aa] || '';
            div.className = `amino-acid ${propClass}`;
            div.textContent = aa.substring(0,3); // short name
            div.title = `Codon resolved to ${aa} (${propClass})`;
            c.appendChild(div);
        });
    }

    // Mutation Logic
    function applyMutation(type) {
        if(sequence.length === 0) return;
        
        const idx = Math.floor(Math.random() * sequence.length);
        const original = sequence[idx];
        const bases = ['A', 'T', 'G', 'C'];
        let updated = sequence;
        let desc = '';
        
        if (type === 'substitution') {
             let newBase = original;
             while(newBase === original) newBase = bases[Math.floor(Math.random()*4)];
             updated = sequence.substring(0, idx) + newBase + sequence.substring(idx+1);
             desc = `<span class="sub">Substituted</span> ${original} with ${newBase} at position ${idx+1}`;
        } else if (type === 'insertion') {
             const newBase = bases[Math.floor(Math.random()*4)];
             updated = sequence.substring(0, idx) + newBase + sequence.substring(idx);
             desc = `<span class="ins">Inserted</span> ${newBase} at position ${idx+1}`;
        } else if (type === 'deletion') {
             updated = sequence.substring(0, idx) + sequence.substring(idx+1);
             desc = `<span class="del">Deleted</span> ${original} at position ${idx+1}`;
        }
        
        const log = $('#mutationLogList');
        // Clear default msg if there
        if(log.innerHTML.includes('No mutations')) log.innerHTML = '';
        
        const li = document.createElement('li');
        li.innerHTML = desc;
        log.prepend(li); // add to top
        
        $('#dnaInput').value = updated;
        parseInput(); // triggers re-render and stats update
    }

    // --- UI Listeners ---

    $('#dnaInput').addEventListener('input', () => {
        // Enforce max length approx to prevent browser freezing
        if($('#dnaInput').value.length > 200) {
            $('#dnaInput').value = $('#dnaInput').value.substring(0, 200);
        }
        parseInput();
    });
    
    $('#randomizeBtn').addEventListener('click', () => {
        $('#dnaInput').value = generateRandomSeq(seqLengthTarget);
        parseInput();
    });

    $('#complementBtn').addEventListener('click', () => {
        let comp = '';
        for(let i=0; i<sequence.length; i++) {
            comp += getComplement(sequence[i]);
        }
        $('#dnaInput').value = comp;
        parseInput();
    });

    // View controls
    $('#viewSelect').addEventListener('change', e => {
        viewMode = e.target.value;
    });
    $('#autoRotateBtn').addEventListener('click', e => {
        autoRotate = !autoRotate;
        e.target.textContent = autoRotate ? '⏸️ Rotation' : '▶️ Rotation';
    });
    $('#lengthSlider').addEventListener('input', e => {
        seqLengthTarget = parseInt(e.target.value);
        $('#dnaInput').value = generateRandomSeq(seqLengthTarget);
        parseInput();
    });
    
    // Sim controls
    $('#simSpeedSlider').addEventListener('input', e => {
        simSpeed = parseInt(e.target.value);
    });

    $('#startTranscriptionBtn').addEventListener('click', startTranscription);
    
    $('#pauseTxBtn').addEventListener('click', e => {
        if(simMode === 'tx_playing') {
            simMode = 'tx_paused';
            e.target.textContent = '▶️ Resume';
        } else if (simMode === 'tx_paused') {
            simMode = 'tx_playing';
            e.target.textContent = '⏸️ Pause';
            txStep();
        }
    });

    $('#resetTxBtn').addEventListener('click', () => {
        simMode = 'idle';
        simProgress = 0;
        mrnaStrand = '';
        $('#simOverlay').classList.add('hidden');
        $('#mRNAOutput').innerHTML = '';
        $('#pauseTxBtn').disabled = true;
        $('#startTranslationBtn').disabled = true;
    });

    $('#startTranslationBtn').addEventListener('click', startTranslation);
    
    $('#applyRandomMutationBtn').addEventListener('click', () => {
        applyMutation($('#mutationType').value);
    });

    window.addEventListener('resize', initCanvas);

    // --- Setup ---
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    // Initial setup
    $('#dnaInput').value = generateRandomSeq(seqLengthTarget);
    parseInput();
    initCanvas();
    requestAnimationFrame(renderFrame);

})();
