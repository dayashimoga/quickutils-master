'use strict';
(function() {
    const $ = s => document.querySelector(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, theme: true });

    let scene, camera, renderer, controls, planetMesh, atmoMesh;
    
    // Shader Uniforms
    const uniforms = {
        uSeed: { value: Math.random() * 100.0 },
        uWaterLevel: { value: 0.5 },
        uTemp: { value: 0.5 },
        uAtmo: { value: 0.3 },
        uTime: { value: 0.0 },
        uLightDir: { value: new THREE.Vector3(1, 0.5, 0.5).normalize() }
    };

    const shaderMaterial = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uSeed;
            uniform float uWaterLevel;
            uniform float uTemp;
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            uniform vec3 uLightDir;

            // Simplex 3D Noise (ashima/webgl-noise)
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

            float snoise(vec3 v) { 
                const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
                const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

                vec3 i  = floor(v + dot(v, C.yyy) );
                vec3 x0 = v - i + dot(i, C.xxx) ;

                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min( g.xyz, l.zxy );
                vec3 i2 = max( g.xyz, l.zxy );

                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;

                i = mod289(i); 
                vec4 p = permute( permute( permute( 
                            i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

                float n_ = 0.142857142857; // 1.0/7.0
                vec3  ns = n_ * D.wyz - D.xzx;

                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_ );

                vec4 x = x_ *ns.x + ns.yyyy;
                vec4 y = y_ *ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);

                vec4 b0 = vec4( x.xy, y.xy );
                vec4 b1 = vec4( x.zw, y.zw );

                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));

                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

                vec3 p0 = vec3(a0.xy,h.x);
                vec3 p1 = vec3(a0.zw,h.y);
                vec3 p2 = vec3(a1.xy,h.z);
                vec3 p3 = vec3(a1.zw,h.w);

                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
            }

            float fbm(vec3 p) {
                float value = 0.0;
                float amplitude = 0.5;
                float frequency = 1.0;
                for (int i = 0; i < 6; i++) {
                    value += amplitude * snoise(p * frequency);
                    frequency *= 2.0;
                    amplitude *= 0.5;
                }
                return value;
            }

            void main() {
                vec3 p = normalize(vPosition);
                // Elevation noise
                float e = fbm(p * 2.0 + uSeed);
                e = e * 0.5 + 0.5; // 0 to 1
                
                // Moisture / Temp noise
                float m = fbm(p * 1.5 - uSeed * 2.0);
                m = m * 0.5 + 0.5;

                // Latitude affects temp
                float latTemp = 1.0 - abs(p.y); // 0 at poles, 1 at equator
                float temp = latTemp * uTemp * 2.0 + m * 0.3 - 0.15;

                vec3 col;
                vec3 waterCol = vec3(0.05, 0.1, 0.4);
                vec3 shallowCol = vec3(0.1, 0.4, 0.6);
                vec3 sandCol = vec3(0.8, 0.7, 0.5);
                vec3 grassCol = vec3(0.1, 0.4, 0.1);
                vec3 forestCol = vec3(0.05, 0.25, 0.05);
                vec3 barrenCol = vec3(0.4, 0.35, 0.3);
                vec3 snowCol = vec3(0.9, 0.9, 0.95);

                if (e < uWaterLevel) { // Ocean
                    float depth = e / uWaterLevel; // 0 to 1
                    col = mix(waterCol, shallowCol, depth * depth);
                    // Ice caps over water
                    if (temp < 0.2) col = mix(col, snowCol, (0.2-temp)/0.2);
                } else { // Land
                    float h = (e - uWaterLevel) / (1.0 - uWaterLevel); // 0 to 1
                    
                    if (temp < 0.2) {
                        col = snowCol;
                    } else if (temp < 0.5) {
                        col = mix(barrenCol, forestCol, m);
                    } else if (temp < 0.7) {
                        col = mix(grassCol, forestCol, m);
                        if (h < 0.1) col = mix(sandCol, col, h*10.0);
                    } else { // Hot
                        col = mix(sandCol, barrenCol, m);
                    }
                    // Mountains top
                    if (h > 0.8) col = mix(col, snowCol, (h-0.8)*5.0);
                }

                // Diffuse Lighting
                float diff = max(dot(vNormal, uLightDir), 0.0);
                float ambient = 0.1;
                
                gl_FragColor = vec4(col * (diff + ambient), 1.0);
            }
        `
    });

    const atmoMaterial = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            uniform vec3 uLightDir;
            uniform float uAtmo;

            void main() {
                float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.5);
                // Also light up based on sun dir
                float sunLite = smoothstep(0.0, 0.5, dot(vNormal, uLightDir)) * 0.5 + 0.5;
                vec3 col = vec3(0.3, 0.6, 1.0);
                gl_FragColor = vec4(col, intensity * uAtmo * sunLite * 2.0);
            }
        `
    });

    function init() {
        const wrap = $('#canvasWrap');
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.z = 4;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        wrap.appendChild(renderer.domElement);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enablePan = false;
        controls.minDistance = 2.0;
        controls.maxDistance = 10.0;

        // Background stars
        const starsGeo = new THREE.BufferGeometry();
        const starsMat = new THREE.PointsMaterial({color: 0xffffff, size: 0.02});
        const stPos = [];
        for(let i=0; i<2000; i++) {
            stPos.push((Math.random()-0.5)*50, (Math.random()-0.5)*50, (Math.random()-0.5)*50);
        }
        starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(stPos, 3));
        scene.add(new THREE.Points(starsGeo, starsMat));

        // Planet
        const geo = new THREE.SphereGeometry(1, 128, 128);
        planetMesh = new THREE.Mesh(geo, shaderMaterial);
        scene.add(planetMesh);

        // Atmo
        const atmoGeo = new THREE.SphereGeometry(1.05, 64, 64);
        atmoMesh = new THREE.Mesh(atmoGeo, atmoMaterial);
        scene.add(atmoMesh);

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        bindUI();
        animate();
    }

    let rotationSpeed = 1.0;

    function bindUI() {
        const oW = $('#optWater'), vW = $('#valWater');
        const oT = $('#optTemp'), vT = $('#valTemp');
        const oA = $('#optAtmo'), vA = $('#valAtmo');
        
        const seedInput = $('#seedDisplay');
        const btnCopy = $('#btnCopySeed');

        function setSliders(w, t, a) {
            oW.value = w; vW.textContent = parseFloat(w).toFixed(2); uniforms.uWaterLevel.value = w;
            oT.value = t; vT.textContent = parseFloat(t).toFixed(2); uniforms.uTemp.value = t;
            oA.value = a; vA.textContent = parseFloat(a).toFixed(2); uniforms.uAtmo.value = a;
            updateBars();
            updateStats();
            updateSeedDisplay();
        }

        function updateSeedDisplay() {
            const s = Math.round(uniforms.uSeed.value * 1000);
            const w = Math.round(oW.value * 100);
            const t = Math.round(oT.value * 100);
            const a = Math.round(oA.value * 100);
            seedInput.value = btoa(`${s}:${w}:${t}:${a}`);
        }

        seedInput.addEventListener('change', () => {
            try {
                const str = atob(seedInput.value);
                const [s, w, t, a] = str.split(':').map(Number);
                if(!isNaN(s) && !isNaN(w) && !isNaN(t) && !isNaN(a)) {
                    uniforms.uSeed.value = s / 1000;
                    setSliders(w / 100, t / 100, a / 100);
                }
            } catch(e) {}
        });

        $('#btnRandomize').onclick = () => {
            uniforms.uSeed.value = Math.random() * 100;
            updateSeedDisplay();
            updateStats();
        };

        if(btnCopy) {
            btnCopy.onclick = () => {
                navigator.clipboard.writeText(seedInput.value).catch(()=>{});
                const orig = btnCopy.textContent;
                btnCopy.textContent = '✅';
                setTimeout(() => btnCopy.textContent = orig, 1000);
            };
        }

        // Screenshot Export
        const btnScreenshot = $('#btnScreenshot');
        if(btnScreenshot) {
            btnScreenshot.onclick = () => {
                renderer.render(scene, camera);
                const link = document.createElement('a');
                link.download = 'planet_' + Date.now() + '.png';
                link.href = renderer.domElement.toDataURL('image/png');
                link.click();
            };
        }

        // 8 Presets
        const prstEarth = $('#btnPrstEarth'); if(prstEarth) prstEarth.onclick = () => setSliders(0.55, 0.5, 0.35);
        const prstMars = $('#btnPrstMars'); if(prstMars) prstMars.onclick = () => setSliders(0.0, 0.7, 0.1);
        const prstIce = $('#btnPrstIce'); if(prstIce) prstIce.onclick = () => setSliders(0.8, 0.0, 0.4);
        const prstDesert = $('#btnPrstDesert'); if(prstDesert) prstDesert.onclick = () => setSliders(0.1, 0.9, 0.2);
        const prstVolcanic = $('#btnPrstVolcanic'); if(prstVolcanic) prstVolcanic.onclick = () => setSliders(0.05, 1.0, 0.6);
        const prstOcean = $('#btnPrstOcean'); if(prstOcean) prstOcean.onclick = () => setSliders(0.9, 0.5, 0.5);
        const prstGasGiant = $('#btnPrstGasGiant'); if(prstGasGiant) prstGasGiant.onclick = () => setSliders(0.0, 0.4, 0.95);
        const prstFrozen = $('#btnPrstFrozen'); if(prstFrozen) prstFrozen.onclick = () => setSliders(0.6, 0.1, 0.2);

        oW.oninput = () => { uniforms.uWaterLevel.value = oW.value; vW.textContent = parseFloat(oW.value).toFixed(2); updateBars(); updateStats(); updateSeedDisplay(); };
        oT.oninput = () => { uniforms.uTemp.value = oT.value; vT.textContent = parseFloat(oT.value).toFixed(2); updateBars(); updateStats(); updateSeedDisplay(); };
        oA.oninput = () => { uniforms.uAtmo.value = oA.value; vA.textContent = parseFloat(oA.value).toFixed(2); updateStats(); updateSeedDisplay(); };
        
        // Rotation Speed
        const oR = $('#optRotation'), vR = $('#valRotation');
        if(oR) oR.oninput = () => { rotationSpeed = parseFloat(oR.value); if(vR) vR.textContent = rotationSpeed.toFixed(1); };

        // Light Angle
        const oL = $('#optLight'), vL = $('#valLight');
        if(oL) oL.oninput = () => {
            const deg = parseFloat(oL.value);
            if(vL) vL.textContent = Math.round(deg) + '°';
            const rad = deg * Math.PI / 180;
            uniforms.uLightDir.value.set(Math.cos(rad), 0.5, Math.sin(rad)).normalize();
        };

        updateSeedDisplay();
    }

    function updateBars() {
        // Approximate stats based on params
        let w = parseFloat($('#optWater').value);
        let t = parseFloat($('#optTemp').value);
        let water = w * 100;
        let pLand = 100 - water;
        let ice = (1.0 - t) * 0.4 * pLand;
        let desert = (t) * 0.5 * pLand;
        let forest = pLand - ice - desert;
        if(forest < 0) forest = 0;

        $('#barWater').style.width = water + '%';
        $('#barIce').style.width = ice + '%';
        $('#barDesert').style.width = desert + '%';
        $('#barForest').style.width = forest + '%';
    }

    function updateStats() {
        const w = parseFloat($('#optWater')?.value || 0.5);
        const t = parseFloat($('#optTemp')?.value || 0.5);
        const a = parseFloat($('#optAtmo')?.value || 0.3);

        const area = Math.round(300 + w * 400);
        const ocean = Math.round(w * 100);
        const tempC = Math.round(-50 + t * 130);
        const biomes = (w > 0.1 ? 1 : 0) + (t > 0.3 ? 1 : 0) + (t < 0.3 ? 1 : 0) + (w < 0.9 ? 1 : 0) + (a > 0.2 ? 1 : 0);

        // Habitability: best when water~0.5, temp~0.5, atmo~0.3
        const wScore = 1 - Math.abs(w - 0.55) * 2;
        const tScore = 1 - Math.abs(t - 0.5) * 2;
        const aScore = 1 - Math.abs(a - 0.35) * 2;
        const habit = Math.max(0, Math.min(100, Math.round((wScore * 40 + tScore * 35 + aScore * 25))));

        const el = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
        el('statArea', area + 'M km²');
        el('statOcean', ocean + '%');
        el('statTemp', tempC + '°C');
        el('statAtmo', parseFloat(a).toFixed(2) + ' atm');
        el('statBiomes', Math.min(6, biomes));
        el('habitScore', habit + ' / 100');

        const fill = document.getElementById('habitFill');
        if(fill) {
            fill.style.width = habit + '%';
            if(habit > 60) fill.style.background = '#10b981';
            else if(habit > 30) fill.style.background = '#f59e0b';
            else fill.style.background = '#ef4444';
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        uniforms.uTime.value += 0.01;
        
        planetMesh.rotation.y += 0.001 * rotationSpeed;
        
        controls.update();
        renderer.render(scene, camera);
    }

    const waitInt = setInterval(() => {
        if(window.THREE) {
            clearInterval(waitInt);
            init();
            updateBars();
            updateStats();
        }
    }, 100);

})();
