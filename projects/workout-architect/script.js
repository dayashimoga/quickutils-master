/* workout-architect */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    const EXERCISES={Chest:['Push-ups','Bench Press','Chest Fly','Incline Press','Dips'],Back:['Pull-ups','Bent-over Row','Lat Pulldown','Deadlift','Face Pull'],Legs:['Squats','Lunges','Leg Press','Calf Raises','Romanian Deadlift'],Arms:['Bicep Curls','Tricep Extensions','Hammer Curls','Skull Crushers','Chin-ups'],Shoulders:['Shoulder Press','Lateral Raise','Front Raise','Arnold Press','Shrugs'],Core:['Plank','Crunches','Russian Twist','Leg Raises','Mountain Climbers'],'Full Body':['Burpees','Thrusters','Clean & Press','Turkish Get-up','Man Makers']};
    let routine=JSON.parse(localStorage.getItem('qu_workout_routine')||'[]');
    let timerSec=0,timerRunning=false,timerInt;

    function renderExercises(){
        const g=$('#muscleGroup').value;
        $('#exerciseList').innerHTML=(EXERCISES[g]||[]).map(e=>'<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;margin:4px 0;background:rgba(255,255,255,0.04);border-radius:6px;"><span>'+e+'</span><div class="d-flex gap-2"><input type="number" class="form-control" style="width:60px;" placeholder="Sets" value="3"><input type="number" class="form-control" style="width:60px;" placeholder="Reps" value="12"><button class="btn btn-sm btn-primary add-ex" data-name="'+e+'">+</button></div></div>').join('');
        $$('.add-ex').forEach(b=>b.addEventListener('click',()=>{const row=b.parentElement;const sets=row.children[0].value;const reps=row.children[1].value;routine.push({name:b.dataset.name,sets,reps});localStorage.setItem('qu_workout_routine',JSON.stringify(routine));renderRoutine();}));
    }
    function renderRoutine(){
        $('#myRoutine').innerHTML=routine.length?routine.map((r,i)=>'<div style="padding:6px;margin:2px 0;background:rgba(99,102,241,0.1);border-radius:4px;display:flex;justify-content:space-between;"><span>'+r.name+' ('+r.sets+'×'+r.reps+')</span><button onclick="QU_W.rm('+i+')" style="background:none;border:none;color:#ef4444;cursor:pointer;">✕</button></div>').join(''):'<p class="text-muted">Add exercises to build your routine</p>';
    }
    window.QU_W={rm:i=>{routine.splice(i,1);localStorage.setItem('qu_workout_routine',JSON.stringify(routine));renderRoutine();}};
    
    function updateTimerDisplay(){const m=Math.floor(timerSec/60);const s=timerSec%60;$('#timerDisplay').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}
    $('#startTimer').addEventListener('click',()=>{if(timerRunning){clearInterval(timerInt);timerRunning=false;$('#startTimer').textContent='▶ Start';}else{timerRunning=true;$('#startTimer').textContent='⏸ Pause';timerInt=setInterval(()=>{timerSec++;updateTimerDisplay();},1000);}});
    $('#resetTimer').addEventListener('click',()=>{clearInterval(timerInt);timerRunning=false;timerSec=0;updateTimerDisplay();$('#startTimer').textContent='▶ Start';});
    
    $('#muscleGroup').addEventListener('change',renderExercises);
    renderExercises(); renderRoutine();

    // ═══════════════════════════════════════════════════
    // RHYTHM TRAINER (merged from rhythm-trainer project)
    // ═══════════════════════════════════════════════════
    let audioCtx = null;
    function initAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }
    function playClick(freq = 880, dur = 0.05, vol = 0.3) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + dur);
    }

    const beatCanvas = $('#beatCanvas');
    if (beatCanvas) {
        const bctx = beatCanvas.getContext('2d');
        let bpm = 120, playing2 = false, beats = [], rScore = 0, rCombo = 0, maxCombo2 = 0;
        let perfectCount2 = 0, goodCount2 = 0, missCount2 = 0, startTime2 = 0, animFrame2, lastClickBeat2 = -1;
        const DIFFICULTY = { easy: 150, medium: 80, hard: 40 };
        const HIT_LINE_X = 120, SPEED = 300;

        function generateBeats() {
            const pattern = $('#pattern').value;
            const interval = 60 / bpm;
            beats = [];
            const duration = 60;
            if (pattern === 'quarter') { for (let t = 2; t < duration; t += interval) beats.push({ time: t, hit: false, missed: false, lane: 0 }); }
            else if (pattern === 'eighth') { for (let t = 2; t < duration; t += interval / 2) beats.push({ time: t, hit: false, missed: false, lane: t % interval < 0.01 ? 0 : 1 }); }
            else if (pattern === 'triplet') { for (let t = 2; t < duration; t += interval / 3) beats.push({ time: t, hit: false, missed: false, lane: Math.floor((t % interval) / (interval / 3)) % 3 }); }
            else if (pattern === 'offbeat') { for (let t = 2 + interval / 2; t < duration; t += interval) beats.push({ time: t, hit: false, missed: false, lane: 0 }); }
            else if (pattern === 'syncopated') { for (let t = 2; t < duration; t += interval) { beats.push({ time: t, hit: false, missed: false, lane: 0 }); if (Math.random() > 0.4) beats.push({ time: t + interval * 0.75, hit: false, missed: false, lane: 1 }); } }
            else { for (let t = 2; t < duration; t += interval) { beats.push({ time: t, hit: false, missed: false, lane: 0 }); if (Math.random() > 0.5) beats.push({ time: t + interval * 0.5, hit: false, missed: false, lane: 1 }); if (Math.random() > 0.7) beats.push({ time: t + interval * 0.25, hit: false, missed: false, lane: 2 }); } }
        }

        function drawBeats() {
            if (!playing2) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const rect = beatCanvas.getBoundingClientRect();
            beatCanvas.width = rect.width * dpr; beatCanvas.height = rect.height * dpr;
            bctx.scale(dpr, dpr);
            const w = rect.width, h = rect.height;
            bctx.clearRect(0, 0, w, h);
            const elapsed = (performance.now() - startTime2) / 1000;
            const window_ = DIFFICULTY[$('#difficulty').value] / 1000;
            const beatInterval = 60 / bpm;
            const beatPhase = (elapsed % beatInterval) / beatInterval;
            if (beatPhase < 0.1) { bctx.fillStyle = `rgba(244,63,94,${0.05 * (1 - beatPhase / 0.1)})`; bctx.fillRect(0, 0, w, h); }
            const grad = bctx.createLinearGradient(HIT_LINE_X, 0, HIT_LINE_X, h);
            grad.addColorStop(0, 'transparent'); grad.addColorStop(0.3, 'rgba(244,63,94,0.6)'); grad.addColorStop(0.5, 'rgba(244,63,94,0.8)'); grad.addColorStop(0.7, 'rgba(244,63,94,0.6)'); grad.addColorStop(1, 'transparent');
            bctx.fillStyle = grad; bctx.fillRect(HIT_LINE_X - 2, 0, 4, h);
            const zoneW = window_ * SPEED; bctx.fillStyle = 'rgba(244,63,94,0.05)'; bctx.fillRect(HIT_LINE_X - zoneW, 0, zoneW * 2, h);
            const laneH = h / 3;
            bctx.strokeStyle = 'rgba(255,255,255,0.03)'; bctx.lineWidth = 1;
            bctx.beginPath(); bctx.moveTo(0, laneH); bctx.lineTo(w, laneH); bctx.stroke();
            bctx.beginPath(); bctx.moveTo(0, laneH * 2); bctx.lineTo(w, laneH * 2); bctx.stroke();
            for (const beat of beats) {
                const dt = beat.time - elapsed;
                const x = HIT_LINE_X + dt * SPEED;
                if (x < -50 || x > w + 50) continue;
                if (!beat.hit && !beat.missed && dt < -window_) { beat.missed = true; rCombo = 0; missCount2++; showFeedback('MISS', 'miss'); }
                const laneY = laneH * beat.lane + laneH / 2;
                if (beat.hit) { const age = elapsed - beat.hitTime; if (age < 0.3) { bctx.strokeStyle = `rgba(16,185,129,${1 - age / 0.3})`; bctx.lineWidth = 2; bctx.beginPath(); bctx.arc(HIT_LINE_X, laneY, 20 + age * 60, 0, Math.PI * 2); bctx.stroke(); } }
                else if (beat.missed) { bctx.fillStyle = 'rgba(239,68,68,0.2)'; bctx.beginPath(); bctx.arc(x, laneY, 12, 0, Math.PI * 2); bctx.fill(); }
                else { const proximity = Math.max(0, 1 - Math.abs(dt) * 2); const size = 14 + proximity * 4; const glow = bctx.createRadialGradient(x, laneY, 0, x, laneY, size * 2); glow.addColorStop(0, `rgba(244,63,94,${0.3 + proximity * 0.3})`); glow.addColorStop(1, 'transparent'); bctx.fillStyle = glow; bctx.beginPath(); bctx.arc(x, laneY, size * 2, 0, Math.PI * 2); bctx.fill(); const noteGrad = bctx.createRadialGradient(x, laneY, 0, x, laneY, size); noteGrad.addColorStop(0, '#fff'); noteGrad.addColorStop(0.5, '#f43f5e'); noteGrad.addColorStop(1, '#a21040'); bctx.fillStyle = noteGrad; bctx.beginPath(); bctx.arc(x, laneY, size, 0, Math.PI * 2); bctx.fill(); }
            }
            const currentBeatNum = Math.floor(elapsed / beatInterval);
            if (currentBeatNum > lastClickBeat2) { lastClickBeat2 = currentBeatNum; playClick(currentBeatNum % 4 === 0 ? 1200 : 800, 0.03, 0.15); }
            updateRhythmStats();
            animFrame2 = requestAnimationFrame(drawBeats);
        }

        function tryHit() {
            if (!playing2) return;
            initAudio();
            const elapsed = (performance.now() - startTime2) / 1000;
            const window_ = DIFFICULTY[$('#difficulty').value] / 1000;
            let closestBeat = null, closestDt = Infinity;
            for (const beat of beats) { if (beat.hit || beat.missed) continue; const dt = Math.abs(beat.time - elapsed); if (dt < closestDt) { closestDt = dt; closestBeat = beat; } }
            if (closestBeat && closestDt <= window_) {
                closestBeat.hit = true; closestBeat.hitTime = elapsed;
                if (closestDt < window_ * 0.3) { rScore += 100 * (1 + rCombo * 0.1); perfectCount2++; rCombo++; showFeedback('PERFECT!', 'perfect'); playClick(1400, 0.05, 0.2); }
                else { rScore += 50 * (1 + rCombo * 0.05); goodCount2++; rCombo++; showFeedback('Good', 'good'); playClick(1000, 0.05, 0.15); }
                if (rCombo > maxCombo2) maxCombo2 = rCombo;
            } else { playClick(200, 0.1, 0.1); }
        }

        function showFeedback(text, cls) { const el = $('#hitFeedback'); el.textContent = text; el.className = 'hit-feedback ' + cls; setTimeout(() => { el.className = 'hit-feedback'; }, 400); }
        function updateRhythmStats() {
            const s = $('#score'); if (s) s.textContent = Math.floor(rScore);
            const c = $('#combo'); if (c) c.textContent = rCombo > 1 ? `${rCombo}x combo` : '';
            const p = $('#perfectCount'); if (p) p.textContent = perfectCount2;
            const g = $('#goodCount'); if (g) g.textContent = goodCount2;
            const m = $('#missCount'); if (m) m.textContent = missCount2;
            const mc = $('#maxCombo'); if (mc) mc.textContent = maxCombo2;
            const total = perfectCount2 + goodCount2 + missCount2;
            const a = $('#accuracy'); if (a) a.textContent = total > 0 ? Math.round((perfectCount2 + goodCount2) / total * 100) + '%' : '0%';
        }

        $('#startBtn').addEventListener('click', () => {
            initAudio(); playing2 = true; rScore = 0; rCombo = 0; maxCombo2 = 0;
            perfectCount2 = 0; goodCount2 = 0; missCount2 = 0; lastClickBeat2 = -1;
            generateBeats(); startTime2 = performance.now();
            $('#startBtn').disabled = true; $('#stopBtn').disabled = false;
            animFrame2 = requestAnimationFrame(drawBeats);
        });
        $('#stopBtn').addEventListener('click', () => { playing2 = false; cancelAnimationFrame(animFrame2); $('#startBtn').disabled = false; $('#stopBtn').disabled = true; });
        const tempoSlider = $('#tempoSlider'), tempoVal = $('#tempoVal');
        tempoSlider.addEventListener('input', () => { bpm = parseInt(tempoSlider.value); tempoVal.textContent = bpm; });
        $('#tempoUp').addEventListener('click', () => { bpm = Math.min(240, bpm + 5); tempoSlider.value = bpm; tempoVal.textContent = bpm; });
        $('#tempoDown').addEventListener('click', () => { bpm = Math.max(40, bpm - 5); tempoSlider.value = bpm; tempoVal.textContent = bpm; });
        document.addEventListener('keydown', e => { if (['Space', ' ', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'd', 'f', 'j', 'k'].includes(e.key) || e.code === 'Space') { e.preventDefault(); tryHit(); } });
        beatCanvas.addEventListener('click', tryHit);
        beatCanvas.addEventListener('touchstart', e => { e.preventDefault(); tryHit(); }, { passive: false });
    }

})();
