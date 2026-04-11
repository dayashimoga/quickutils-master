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

})();
