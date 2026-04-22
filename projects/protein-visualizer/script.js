'use strict';

(function() {
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    
    if(typeof QU !== 'undefined') QU.init({ kofi: true, theme: true });

    // Amino Acid properties (Charge: 1/0/-1, Hydrophobicity: float 0-1)
    const AA_DICT = {
        'A': { col: 0xc8c8c8, h: 0.8, c: 0 },
        'C': { col: 0xe6e600, h: 0.6, c: 0 },
        'D': { col: 0xe60a0a, h: 0.1, c: -1 },
        'E': { col: 0xe60a0a, h: 0.1, c: -1 },
        'F': { col: 0x3232aa, h: 1.0, c: 0 },
        'G': { col: 0xebebeb, h: 0.5, c: 0 },
        'H': { col: 0x8282d2, h: 0.2, c: 1 },
        'I': { col: 0x0f820f, h: 1.0, c: 0 },
        'K': { col: 0x145aff, h: 0.1, c: 1 },
        'L': { col: 0x0f820f, h: 1.0, c: 0 },
        'M': { col: 0xe6e600, h: 0.8, c: 0 },
        'N': { col: 0x00dcdc, h: 0.2, c: 0 },
        'P': { col: 0xdc9682, h: 0.6, c: 0 },
        'Q': { col: 0x00dcdc, h: 0.2, c: 0 },
        'R': { col: 0x145aff, h: 0.0, c: 1 },
        'S': { col: 0xfa9600, h: 0.3, c: 0 },
        'T': { col: 0xfa9600, h: 0.4, c: 0 },
        'V': { col: 0x0f820f, h: 0.9, c: 0 },
        'W': { col: 0xb45ab4, h: 0.9, c: 0 },
        'Y': { col: 0x3232aa, h: 0.7, c: 0 }
    };

    let sequence = "";
    
    // UI Elements
    const seqDisp = $('#sequenceDisplay');
    const energyDisp = $('#energyRating');
    const pHydro = $('#hydroOpt');
    const pElec = $('#elecOpt');
    const pTemp = $('#tempOpt');

    function updateSeqDisplay() {
        seqDisp.innerHTML = '';
        for(let a of sequence) {
            const el = document.createElement('span');
            el.className = 'sequence-item';
            el.textContent = a;
            el.style.backgroundColor = '#' + AA_DICT[a].col.toString(16).padStart(6,'0');
            el.style.color = AA_DICT[a].h > 0.5 && a !== 'A' && a !== 'G' ? '#fff' : '#000';
            seqDisp.appendChild(el);
        }
    }

    $$('.aa-btn').forEach(btn => {
        btn.onclick = () => {
            if (sequence.length < 50) {
                sequence += btn.dataset.aa;
                updateSeqDisplay();
            }
        };
    });

    $('#clearBtn').onclick = () => {
        sequence = "";
        updateSeqDisplay();
        clearSimulation();
    };

    $('#foldBtn').onclick = () => {
        if(sequence.length < 2) return alert("Add at least 2 amino acids");
        buildChain(sequence);
    };

    let buildMode = true;
    $('#toggleModeBtn').onclick = () => {
        buildMode = !buildMode;
        if(buildMode) {
            $('.hud-left').classList.remove('hud-hidden-left');
            $('.hud-right').classList.remove('hud-hidden-right');
            $('#toggleModeBtn').textContent = 'Hide UI';
        } else {
            $('.hud-left').classList.add('hud-hidden-left');
            $('.hud-right').classList.add('hud-hidden-right');
            $('#toggleModeBtn').textContent = 'Show UI';
        }
    };

    $('#presetSelect').onchange = (e) => {
        if(!e.target.value) return;
        const val = e.target.value;
        if(val === 'insulin') sequence = "GIVEQCCTSICSLYQLENYCN";
        if(val === 'collagen') sequence = "GPPGPPGPPGPPGPPGPP";
        if(val === 'prion') sequence = "PQGGGGWGQGGTHGQWNKP";
        updateSeqDisplay();
        buildChain(sequence);
    };

    // --- Three.js WebGL ---
    let scene, camera, renderer, controls;
    let particles = [];
    let bonds = [];
    let isSimulating = false;

    function initWebGL() {
        const wrap = $('#canvasWrap');
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x050608, 0.015);
        
        camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
        camera.position.z = 40;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        wrap.innerHTML = '';
        wrap.appendChild(renderer.domElement);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.0;

        // Lights
        const amb = new THREE.AmbientLight(0x404040, 2);
        scene.add(amb);
        const p1 = new THREE.PointLight(0xffaa00, 2, 100);
        p1.position.set(20, 20, 20);
        scene.add(p1);
        const p2 = new THREE.PointLight(0x00aaff, 2, 100);
        p2.position.set(-20, -20, 20);
        scene.add(p2);

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // High-res Export
        $('#exportBtn').onclick = () => {
            // Re-render to ensure we have the latest frame
            renderer.render(scene, camera);
            const dataURL = renderer.domElement.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataURL;
            a.download = `protein_${sequence}_${Date.now()}.png`;
            a.click();
        };

        animate();
    }

    const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
    const cylGeo = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    cylGeo.translate(0, 0.5, 0);
    cylGeo.rotateX(Math.PI / 2);

    function clearSimulation() {
        isSimulating = false;
        particles.forEach(p => scene.remove(p.mesh));
        bonds.forEach(b => scene.remove(b.mesh));
        particles = [];
        bonds = [];
        energyDisp.textContent = "0.0 kcal/mol";
    }

    function buildChain(seq) {
        clearSimulation();
        
        for(let i=0; i<seq.length; i++) {
            const type = seq[i];
            const data = AA_DICT[type];
            
            const mat = new THREE.MeshPhysicalMaterial({ 
                color: data.col,
                metalness: 0.1,
                roughness: 0.3,
                clearcoat: 0.8,
                clearcoatRoughness: 0.2
            });
            const mesh = new THREE.Mesh(sphereGeo, mat);
            // Spawn in a semi-random loose line
            const pos = new THREE.Vector3((i - seq.length/2)*2.5, Math.random(), Math.random());
            mesh.position.copy(pos);
            scene.add(mesh);
            
            particles.push({
                idx: i,
                type: type,
                data: data,
                mesh: mesh,
                pos: pos,
                vel: new THREE.Vector3(),
                force: new THREE.Vector3()
            });

            if (i > 0) {
                const bMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
                const bMesh = new THREE.Mesh(cylGeo, bMat);
                scene.add(bMesh);
                bonds.push({ a: i-1, b: i, mesh: bMesh });
            }
        }
        
        isSimulating = true;
    }

    function physicsStep() {
        if(!isSimulating || particles.length < 2) return;

        const dt = 0.016;
        const hydroStrength = parseInt(pHydro.value) / 100 * 50;
        const elecStrength = parseInt(pElec.value) / 100 * 100;
        const temp = parseInt(pTemp.value) / 100 * 2;
        
        let totalEnergy = 0;

        // Reset forces
        particles.forEach(p => p.force.set(0,0,0));

        // Bonds (Hooke's Law)
        const restLen = 2.5;
        const kBond = 200.0;
        for(let b of bonds) {
            const p1 = particles[b.a];
            const p2 = particles[b.b];
            let dir = new THREE.Vector3().subVectors(p2.pos, p1.pos);
            let dist = dir.length();
            if(dist < 0.001) dist = 0.001;
            const diff = dist - restLen;
            dir.normalize();
            
            const fp = dir.multiplyScalar(kBond * diff);
            p1.force.add(fp);
            p2.force.sub(fp);
            totalEnergy += 0.5 * kBond * diff * diff;
        }

        // Pairwise forces (Lennard-Jones style and Electrostatics)
        for(let i=0; i<particles.length; i++) {
            for(let j=i+1; j<particles.length; j++) {
                if (Math.abs(i - j) === 1) continue; // Skip adjacent (handled by bonds)

                const p1 = particles[i];
                const p2 = particles[j];
                let dir = new THREE.Vector3().subVectors(p2.pos, p1.pos);
                let r = dir.length();
                if(r < 0.1) r = 0.1;
                dir.normalize();

                let forceMag = 0;

                // Steric Repulsion (VdW)
                const sigma = 2.0;
                const eps = 2.0;
                const sr2 = (sigma/r)**2;
                const sr6 = sr2*sr2*sr2;
                const sr12 = sr6*sr6;
                // F = 24*eps/r * (2*sr12 - sr6)
                forceMag -= 24 * eps / r * (2*sr12 - sr6) * 5; // Negative = repulsion
                totalEnergy += 4 * eps * (sr12 - sr6);

                // Hydrophobic clustering (simplified attraction)
                if (r < 10) {
                    const hp = p1.data.h * p2.data.h;
                    if (hp > 0.5) {
                        forceMag += hydroStrength * hp * (1/r);
                        totalEnergy -= hydroStrength * hp * (1/r);
                    }
                }

                // Electrostatic
                const chargeProd = p1.data.c * p2.data.c;
                if (chargeProd !== 0) {
                    forceMag -= elecStrength * chargeProd / (r*r); // Coulomb
                    totalEnergy += elecStrength * chargeProd / r;
                }

                // Apply
                const fVec = dir.clone().multiplyScalar(forceMag);
                p1.force.add(fVec);
                p2.force.sub(fVec);
            }
        }

        // Integration + Temperature noise + Drag
        const center = new THREE.Vector3();
        particles.forEach(p => {
            // Noise
            p.force.x += (Math.random()-0.5) * temp * 100;
            p.force.y += (Math.random()-0.5) * temp * 100;
            p.force.z += (Math.random()-0.5) * temp * 100;

            // Velocity verlet approx
            p.vel.add(p.force.multiplyScalar(dt));
            p.vel.multiplyScalar(0.9); // Damping/Drag
            p.pos.add(p.vel.clone().multiplyScalar(dt));
            p.mesh.position.copy(p.pos);
            center.add(p.pos);
        });

        // Center camera wrapper
        if (particles.length > 0) {
            center.divideScalar(particles.length);
            controls.target.lerp(center, 0.05);
        }

        // Update Bond geometry
        for(let b of bonds) {
            const p1 = particles[b.a].pos;
            const p2 = particles[b.b].pos;
            const dist = p1.distanceTo(p2);
            b.mesh.position.copy(p1);
            b.mesh.lookAt(p2);
            b.mesh.scale.set(1, 1, dist);
        }
        
        energyDisp.textContent = totalEnergy.toFixed(1) + " kcal/mol";
    }

    function animate() {
        requestAnimationFrame(animate);
        physicsStep();
        controls.update();
        renderer.render(scene, camera);
    }
    
    // Ensure ThreeJS is loaded before init
    const waitInterval = setInterval(() => {
        if(window.THREE) {
            clearInterval(waitInterval);
            initWebGL();
            // Start with insulin
            sequence = "GIVEQCCTSICSLYQLENYCN";
            updateSeqDisplay();
            buildChain(sequence);
        }
    }, 100);

})();
