(() => {
    'use strict';

    // Theme
    const themeBtn = document.getElementById('themeBtn');
    themeBtn.addEventListener('click', () => {
        const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = t;
        themeBtn.textContent = t === 'dark' ? '🌙' : '☀️';
        localStorage.setItem('theme', t);
    });
    const saved = localStorage.getItem('theme');
    if (saved) { document.documentElement.dataset.theme = saved; themeBtn.textContent = saved === 'dark' ? '🌙' : '☀️'; }

    // Tabs
    document.querySelectorAll('.tool-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tool-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
            tab.classList.add('active');
            document.getElementById('panel-' + tab.dataset.panel).classList.remove('hidden');
        });
    });

    // ═══════════════════════════════════════════════════
    // CODON TABLE
    // ═══════════════════════════════════════════════════
    const CODON_TABLE = {
        'UUU':'Phe','UUC':'Phe','UUA':'Leu','UUG':'Leu','CUU':'Leu','CUC':'Leu','CUA':'Leu','CUG':'Leu',
        'AUU':'Ile','AUC':'Ile','AUA':'Ile','AUG':'Met','GUU':'Val','GUC':'Val','GUA':'Val','GUG':'Val',
        'UCU':'Ser','UCC':'Ser','UCA':'Ser','UCG':'Ser','CCU':'Pro','CCC':'Pro','CCA':'Pro','CCG':'Pro',
        'ACU':'Thr','ACC':'Thr','ACA':'Thr','ACG':'Thr','GCU':'Ala','GCC':'Ala','GCA':'Ala','GCG':'Ala',
        'UAU':'Tyr','UAC':'Tyr','UAA':'Stop','UAG':'Stop','CAU':'His','CAC':'His','CAA':'Gln','CAG':'Gln',
        'AAU':'Asn','AAC':'Asn','AAA':'Lys','AAG':'Lys','GAU':'Asp','GAC':'Asp','GAA':'Glu','GAG':'Glu',
        'UGU':'Cys','UGC':'Cys','UGA':'Stop','UGG':'Trp','CGU':'Arg','CGC':'Arg','CGA':'Arg','CGG':'Arg',
        'AGU':'Ser','AGC':'Ser','AGA':'Arg','AGG':'Arg','GGU':'Gly','GGC':'Gly','GGA':'Gly','GGG':'Gly'
    };

    const AA_PROPS = {
        'Phe':'hydrophobic','Leu':'hydrophobic','Ile':'hydrophobic','Met':'special','Val':'hydrophobic',
        'Ser':'polar','Pro':'special','Thr':'polar','Ala':'hydrophobic','Tyr':'polar',
        'His':'positive','Gln':'polar','Asn':'polar','Lys':'positive','Asp':'negative',
        'Glu':'negative','Cys':'special','Trp':'hydrophobic','Arg':'positive','Gly':'special','Stop':'stop'
    };

    const AA_COLORS = {
        'hydrophobic':'rgba(239,68,68,0.2)','polar':'rgba(59,130,246,0.2)','positive':'rgba(16,185,129,0.2)',
        'negative':'rgba(245,158,11,0.2)','special':'rgba(139,92,246,0.2)','stop':'rgba(100,100,100,0.15)'
    };

    function buildCodonGrid(filter = '') {
        const grid = document.getElementById('codonGrid');
        const fl = filter.toUpperCase();
        grid.innerHTML = Object.entries(CODON_TABLE).map(([codon, aa]) => {
            if (fl && !codon.includes(fl) && !aa.toUpperCase().includes(fl)) return '';
            const prop = AA_PROPS[aa] || 'special';
            return `<div class="codon-cell" style="background:${AA_COLORS[prop]}" title="${aa} (${prop})">
                <div class="codon-code">${codon}</div>
                <div class="codon-aa">${aa}</div>
            </div>`;
        }).join('');
    }
    buildCodonGrid();
    document.getElementById('codonSearch').addEventListener('input', e => buildCodonGrid(e.target.value));

    // ═══════════════════════════════════════════════════
    // DNA TRANSCRIPTION & TRANSLATION
    // ═══════════════════════════════════════════════════
    function dnaToRna(dna) { return dna.replace(/T/gi, 'U'); }
    function complementBase(b) { return { A:'T', T:'A', G:'C', C:'G' }[b.toUpperCase()] || b; }

    function translateRna(rna) {
        const proteins = [];
        for (let i = 0; i + 2 < rna.length; i += 3) {
            const codon = rna.substring(i, i + 3).toUpperCase();
            const aa = CODON_TABLE[codon];
            if (!aa) proteins.push({ codon, aa: '?', prop: 'special' });
            else if (aa === 'Stop') { proteins.push({ codon, aa: 'Stop', prop: 'stop' }); break; }
            else proteins.push({ codon, aa, prop: AA_PROPS[aa] || 'special' });
        }
        return proteins;
    }

    function renderDna(dna) {
        return dna.split('').map(b => `<span class="base base-${b.toUpperCase()}">${b.toUpperCase()}</span>`).join('');
    }

    function renderRna(rna) {
        return rna.split('').map(b => `<span class="base base-${b.toUpperCase()}">${b.toUpperCase()}</span>`).join('');
    }

    function renderProtein(proteins) {
        return proteins.map(p => `<span class="amino amino-${p.prop}" title="${p.codon} → ${p.aa}">${p.aa}</span>`).join('');
    }

    function processSequence() {
        let dna = document.getElementById('dnaInput').value.replace(/[^ATGCatgc]/g, '').toUpperCase();
        if (!dna) return;

        const rna = dnaToRna(dna);
        const proteins = translateRna(rna);

        document.getElementById('dnaDisplay').innerHTML = renderDna(dna);
        document.getElementById('rnaDisplay').innerHTML = renderRna(rna);
        document.getElementById('proteinDisplay').innerHTML = renderProtein(proteins);

        // Stats
        const gc = (dna.match(/[GC]/g) || []).length;
        const gcPct = ((gc / dna.length) * 100).toFixed(1);
        const mw = proteins.reduce((s, p) => s + (p.aa === 'Stop' ? 0 : 110), 0);

        document.getElementById('seqStats').innerHTML = `
            <div class="stat-item"><span class="label">Length</span><span class="value">${dna.length} bp</span></div>
            <div class="stat-item"><span class="label">GC Content</span><span class="value">${gcPct}%</span></div>
            <div class="stat-item"><span class="label">Codons</span><span class="value">${Math.floor(dna.length / 3)}</span></div>
            <div class="stat-item"><span class="label">Amino Acids</span><span class="value">${proteins.filter(p => p.aa !== 'Stop').length}</span></div>
            <div class="stat-item"><span class="label">A count</span><span class="value" style="color:var(--dna-a)">${(dna.match(/A/g)||[]).length}</span></div>
            <div class="stat-item"><span class="label">T count</span><span class="value" style="color:var(--dna-t)">${(dna.match(/T/g)||[]).length}</span></div>
            <div class="stat-item"><span class="label">G count</span><span class="value" style="color:var(--dna-g)">${(dna.match(/G/g)||[]).length}</span></div>
            <div class="stat-item"><span class="label">C count</span><span class="value" style="color:var(--dna-c)">${(dna.match(/C/g)||[]).length}</span></div>
            <div class="stat-item"><span class="label">Est. MW</span><span class="value">~${(mw/1000).toFixed(1)} kDa</span></div>
            <div class="stat-item"><span class="label">Tm (basic)</span><span class="value">~${(2*(dna.length-gc)+4*gc).toFixed(0)}°C</span></div>
        `;

        drawHelix(dna);
    }

    document.getElementById('transcribeBtn').addEventListener('click', processSequence);
    document.getElementById('randomDna').addEventListener('click', () => {
        const bases = 'ATGC';
        let dna = 'ATG'; // Start codon
        for (let i = 0; i < 27 + Math.floor(Math.random() * 30) * 3; i++) dna += bases[Math.floor(Math.random() * 4)];
        dna += ['TAA', 'TAG', 'TGA'][Math.floor(Math.random() * 3)]; // Stop codon
        document.getElementById('dnaInput').value = dna;
        processSequence();
    });
    document.getElementById('clearSeq').addEventListener('click', () => {
        document.getElementById('dnaInput').value = '';
        ['dnaDisplay', 'rnaDisplay', 'proteinDisplay', 'seqStats'].forEach(id => document.getElementById(id).innerHTML = '');
    });

    // ═══════════════════════════════════════════════════
    // DNA HELIX CANVAS VISUALIZATION
    // ═══════════════════════════════════════════════════
    const helixCanvas = document.getElementById('helixCanvas');
    const hctx = helixCanvas.getContext('2d');
    const BASE_COLORS = { A: '#ef4444', T: '#3b82f6', G: '#10b981', C: '#f59e0b' };
    const COMPLEMENT = { A: 'T', T: 'A', G: 'C', C: 'G' };
    let helixDna = '';
    let helixTime = 0;

    function drawHelix(dna) {
        helixDna = dna.substring(0, 60); // Show first 60 bases
        if (!helixAnimating) { helixAnimating = true; animateHelix(); }
    }

    let helixAnimating = false;
    function animateHelix() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = helixCanvas.getBoundingClientRect();
        helixCanvas.width = rect.width * dpr;
        helixCanvas.height = rect.height * dpr;
        hctx.scale(dpr, dpr);
        const w = rect.width, h = rect.height;
        hctx.clearRect(0, 0, w, h);

        helixTime += 0.02;
        const n = helixDna.length;
        const spacing = w / (n + 2);
        const midY = h / 2;
        const amp = h * 0.3;

        for (let i = 0; i < n; i++) {
            const x = spacing * (i + 1);
            const phase = i * 0.5 + helixTime;
            const y1 = midY + Math.sin(phase) * amp;
            const y2 = midY - Math.sin(phase) * amp;
            const z = Math.cos(phase);

            const base1 = helixDna[i];
            const base2 = COMPLEMENT[base1] || 'A';

            // Backbone strands
            if (i > 0) {
                const px = spacing * i;
                const pp = (i - 1) * 0.5 + helixTime;
                const py1 = midY + Math.sin(pp) * amp;
                const py2 = midY - Math.sin(pp) * amp;

                hctx.strokeStyle = `rgba(139,92,246,${0.3 + z * 0.2})`;
                hctx.lineWidth = 2;
                hctx.beginPath(); hctx.moveTo(px, py1); hctx.lineTo(x, y1); hctx.stroke();

                hctx.strokeStyle = `rgba(6,182,212,${0.3 - z * 0.2})`;
                hctx.beginPath(); hctx.moveTo(px, py2); hctx.lineTo(x, y2); hctx.stroke();
            }

            // Hydrogen bond (connecting line) — only draw when bases are in front
            if (Math.abs(z) < 0.8) {
                hctx.strokeStyle = `rgba(255,255,255,${0.1 + Math.abs(z) * 0.1})`;
                hctx.lineWidth = 1;
                hctx.setLineDash([3, 3]);
                hctx.beginPath(); hctx.moveTo(x, y1); hctx.lineTo(x, y2); hctx.stroke();
                hctx.setLineDash([]);
            }

            // Draw the front strand on top
            if (z > 0) {
                drawBase(x, y1, base1, 4 + z * 2);
                drawBase(x, y2, base2, 4 - z * 2);
            } else {
                drawBase(x, y2, base2, 4 - z * 2);
                drawBase(x, y1, base1, 4 + z * 2);
            }
        }

        if (helixDna) requestAnimationFrame(animateHelix);
        else helixAnimating = false;
    }

    function drawBase(x, y, base, size) {
        const color = BASE_COLORS[base] || '#888';
        const grad = hctx.createRadialGradient(x, y, 0, x, y, size * 2);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        hctx.fillStyle = grad;
        hctx.beginPath(); hctx.arc(x, y, size * 2, 0, Math.PI * 2); hctx.fill();

        hctx.fillStyle = color;
        hctx.beginPath(); hctx.arc(x, y, size, 0, Math.PI * 2); hctx.fill();
    }

    // ═══════════════════════════════════════════════════
    // MUTATION SIMULATOR
    // ═══════════════════════════════════════════════════
    document.getElementById('mutateBtn').addEventListener('click', () => {
        let dna = document.getElementById('mutDnaInput').value.replace(/[^ATGCatgc]/g, '').toUpperCase();
        if (!dna || dna.length < 3) return;

        const mutType = document.getElementById('mutType').value;
        const mutCount = parseInt(document.getElementById('mutRate').value);
        const bases = 'ATGC';
        let mutated = dna.split('');
        let mutations = [];

        for (let i = 0; i < mutCount; i++) {
            const pos = Math.floor(Math.random() * mutated.length);
            if (mutType === 'substitution') {
                const orig = mutated[pos];
                let newBase = orig;
                while (newBase === orig) newBase = bases[Math.floor(Math.random() * 4)];
                mutations.push({ pos, type: 'sub', from: orig, to: newBase });
                mutated[pos] = newBase;
            } else if (mutType === 'insertion') {
                const newBase = bases[Math.floor(Math.random() * 4)];
                mutations.push({ pos, type: 'ins', to: newBase });
                mutated.splice(pos, 0, newBase);
            } else if (mutType === 'deletion') {
                const deleted = mutated[pos];
                mutations.push({ pos, type: 'del', from: deleted });
                mutated.splice(pos, 1);
            }
        }

        const mutatedDna = mutated.join('');
        const origRna = dnaToRna(dna);
        const mutRna = dnaToRna(mutatedDna);
        const origProteins = translateRna(origRna);
        const mutProteins = translateRna(mutRna);

        // Diff display
        let origHtml = '', mutHtml = '';
        const maxLen = Math.max(dna.length, mutatedDna.length);
        for (let i = 0; i < dna.length; i++) {
            origHtml += `<span class="base base-${dna[i]}">${dna[i]}</span>`;
        }
        for (let i = 0; i < mutatedDna.length; i++) {
            const isMutated = i < dna.length ? mutatedDna[i] !== dna[i] : true;
            mutHtml += isMutated ?
                `<span class="mutated">${mutatedDna[i]}</span>` :
                `<span class="base base-${mutatedDna[i]}">${mutatedDna[i]}</span>`;
        }

        const container = document.getElementById('mutationResult');
        container.innerHTML = `
            <h4 style="margin-bottom:0.5rem;color:var(--text-muted)">Mutations: ${mutations.map(m => m.type === 'sub' ? `${m.from}→${m.to}@${m.pos}` : m.type === 'ins' ? `+${m.to}@${m.pos}` : `-${m.from}@${m.pos}`).join(', ')}</h4>
            <div class="diff-line"><strong>Original:</strong> ${origHtml}</div>
            <div class="diff-line"><strong>Mutated:</strong> ${mutHtml}</div>
            <div class="diff-line"><strong>Original Protein:</strong> ${renderProtein(origProteins)}</div>
            <div class="diff-line"><strong>Mutated Protein:</strong> ${renderProtein(mutProteins)}</div>
            <p style="margin-top:1rem;font-size:0.85rem;color:var(--text-muted)">
                ${origProteins.map(p=>p.aa).join('') === mutProteins.map(p=>p.aa).join('') ?
                    '✅ <strong>Silent mutation</strong> — protein sequence unchanged' :
                    '⚠️ <strong>Non-silent mutation</strong> — protein sequence altered'}
            </p>
        `;
    });

    // Initial transcription
    processSequence();
})();
