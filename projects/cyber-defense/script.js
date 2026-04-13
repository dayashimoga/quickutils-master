'use strict';
(function() {
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    if(typeof QU !== 'undefined') QU.init({ kofi: false }); // pure custom theme

    const term = $('#terminalOutput');
    const svg = $('#netSvg');
    const rulesList = $('#rulesList');
    
    let integrity = 100;
    let threatLevel = 0;
    let packets = [];
    let rules = {
        BLOCK_IP: { active: false, time: 0 },
        RATE_LIMIT: { active: false, time: 0 },
        DEEP_INSPECT: { active: false, time: 0 }
    };

    // Node Positions
    const nodes = {
        int:  { el: $('#n_int'), x:10, y:50 },
        auth: { el: $('#n_auth'), x:50, y:30 },
        web:  { el: $('#n_web'), x:50, y:70 },
        root: { el: $('#n_root'), x:80, y:50 }
    };

    function getCoords(nId) {
        let el = nodes[nId].el;
        let p = el.parentElement;
        let w = p.clientWidth;
        let h = p.clientHeight;
        return {
            x: (nodes[nId].x / 100) * w,
            y: (nodes[nId].y / 100) * h
        };
    }

    function drawLinks() {
        svg.innerHTML = '';
        const links = [
            ['int', 'auth'], ['int', 'web'],
            ['auth', 'root'], ['web', 'root']
        ];
        
        links.forEach(l => {
            let p1 = getCoords(l[0]);
            let p2 = getCoords(l[1]);
            let line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
            line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y);
            line.setAttribute('class', 'net-link');
            svg.appendChild(line);
        });
    }
    
    window.addEventListener('resize', drawLinks);
    drawLinks();

    function log(msg, type='info') {
        let div = document.createElement('div');
        div.className = `log-line ${type}`;
        
        let t = new Date().toISOString().substring(11,23); // time
        div.textContent = `[${t}] ${msg}`;
        term.appendChild(div);
        term.scrollTop = term.scrollHeight;
        if(term.children.length > 50) term.firstChild.remove();
    }

    function spawnPacket() {
        let isMalicious = Math.random() < (threatLevel / 100);
        let dst = Math.random() < 0.5 ? 'auth' : 'web';
        
        let pEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pEl.setAttribute('r', '4');
        pEl.setAttribute('class', `net-packet ${isMalicious ? 'malicious' : ''}`);
        svg.appendChild(pEl);

        packets.push({
            el: pEl,
            src: 'int',
            dst: dst,
            progress: 0,
            malicious: isMalicious,
            speed: 0.005 + Math.random()*0.005,
            stage: 1 // 1: int->proxy, 2: proxy->root
        });
        
        if(isMalicious && !rules.DEEP_INSPECT.active) {
            log(`Suspicious payload from external IP detected`, 'warn');
        }
    }

    function updatePackets() {
        for(let i=packets.length-1; i>=0; i--) {
            let p = packets[i];
            p.progress += p.speed;
            
            // Firewall logic
            if(p.malicious) {
                if(rules.BLOCK_IP.active && p.stage === 1) { p.el.remove(); packets.splice(i,1); continue; }
                if(rules.DEEP_INSPECT.active && p.stage === 2) { 
                    log(`Dropped malicious packet at ${p.src}`, 'info');
                    p.el.remove(); packets.splice(i,1); continue; 
                }
            } else {
                if(rules.RATE_LIMIT.active && Math.random() < 0.3) {
                    // rate limit drops normal packets sometimes too
                    p.el.remove(); packets.splice(i,1); continue;
                }
            }
            
            if(p.progress >= 1.0) {
                if(p.stage === 1) {
                    p.stage = 2;
                    p.progress = 0;
                    p.src = p.dst;
                    p.dst = 'root';
                } else {
                    // reached root!
                    if(p.malicious) {
                        integrity -= 2;
                        $('#sysIntegrity').textContent = integrity;
                        log(`CRITICAL: Data breach on CORE_DB!`, 'err');
                        if(integrity <= 0) alert("SYSTEM COMPROMISED. REBOOTING...");
                    } else {
                        // normal processing
                    }
                    p.el.remove();
                    packets.splice(i, 1);
                    continue;
                }
            }

            let p1 = getCoords(p.src);
            let p2 = getCoords(p.dst);
            let x = p1.x + (p2.x - p1.x) * p.progress;
            let y = p1.y + (p2.y - p1.y) * p.progress;
            p.el.setAttribute('cx', x);
            p.el.setAttribute('cy', y);
        }
    }

    function updateRulesUI() {
        rulesList.innerHTML = '';
        Object.keys(rules).forEach(k => {
            let r = rules[k];
            let div = document.createElement('div');
            div.className = `rule-item ${r.active ? 'active' : ''}`;
            div.innerHTML = `<span>${k}</span> <span>${r.active ? 'ACTIVE ('+r.time+'s)' : 'STANDBY'}</span>`;
            rulesList.appendChild(div);
        });
    }

    $('#btnDeploy').onclick = () => {
        let type = $('#ruleType').value;
        if(rules[type].active) return;
        rules[type].active = true;
        rules[type].time = 15; // 15 sec duration
        log(`Deployed countermeasure: ${type}`, 'info');
        updateRulesUI();
    };

    // Game loop
    setInterval(() => {
        // Threat Director
        threatLevel += 0.5;
        if(threatLevel > 100) threatLevel = 10;
        $('#threatLevel').style.width = threatLevel + '%';
        
        let spawnRate = rules.RATE_LIMIT.active ? 0.3 : 0.8;
        if(Math.random() < spawnRate) spawnSpawn = spawnPacket();

        // Reduce rule timer
        Object.keys(rules).forEach(k => {
            if(rules[k].active) {
                rules[k].time--;
                if(rules[k].time <= 0) {
                    rules[k].active = false;
                    log(`Countermeasure offline: ${k}`, 'warn');
                }
            }
        });
        updateRulesUI();
    }, 1000);

    function loop() {
        requestAnimationFrame(loop);
        updatePackets();
    }
    
    log(`OVERSEER ON-LINE`);
    updateRulesUI();
    requestAnimationFrame(loop);

})();
