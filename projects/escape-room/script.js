/* escape-room */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    const rooms=[
        {title:'🏠 The Study',desc:'A dusty room with an old bookshelf. A note on the desk reads: "The answer is always in the middle."',puzzle:'What 3-letter word reads the same forwards and backwards and is found in every book?',answer:'eye',hint:'Think about what you use to read...'},
        {title:'🔬 The Lab',desc:'Beakers and flasks everywhere. A periodic table hangs on the wall with element 79 circled.',puzzle:'What element has atomic number 79?',answer:'gold',hint:'Its symbol is Au...'},
        {title:'🗝️ The Vault',desc:'A massive safe with a combination lock. The walls show: 2, 3, 5, 7, 11, ?',puzzle:'What is the next number in the sequence: 2, 3, 5, 7, 11, ?',answer:'13',hint:'These are all prime numbers...'},
        {title:'🌊 The Deck',desc:'You are on a ship. A compass shows N=14, E=5, S=19. What does W equal?',puzzle:'If N=14, E=5, S=19 based on their position in the alphabet, what does W equal?',answer:'23',hint:'W is the 23rd letter...'},
        {title:'🏆 The Throne Room',desc:'The final room! A riddle is carved into the throne.',puzzle:'I have cities but no houses, forests but no trees, water but no fish. What am I?',answer:'map',hint:'You use me to find your way...'}
    ];
    let currentRoom=0, hints=3;
    function loadRoom(){
        const r=rooms[currentRoom];
        $('#roomDisplay').innerHTML='<h2>'+r.title+'</h2><p class="text-muted mt-2">'+r.desc+'</p>';
        $('#puzzle').innerHTML='<div style="padding:1rem;background:rgba(255,255,255,0.05);border-radius:8px;border-left:4px solid #6366f1;font-size:1.1rem;">'+r.puzzle+'</div>';
        $('#roomNum').textContent=(currentRoom+1);
        $('#answerInput').value=''; $('#feedback').textContent='';
    }
    $('#submitAnswer').addEventListener('click',()=>{
        const a=$('#answerInput').value.trim().toLowerCase();
        if(a===rooms[currentRoom].answer){ currentRoom++;
            if(currentRoom>=rooms.length){$('#gameArea').innerHTML='<div class="text-center py-4"><h1 style="font-size:4rem;">🎉</h1><h2 class="gradient-text">YOU ESCAPED!</h2><p class="text-muted mt-2">Congratulations! You solved all 5 rooms!</p><button class="btn btn-primary mt-3" onclick="location.reload()">Play Again</button></div>';}
            else{$('#feedback').textContent='✅ Correct! Moving to next room...';$('#feedback').style.color='#22c55e';setTimeout(loadRoom,1000);}
        }else{$('#feedback').textContent='❌ Wrong answer, try again!';$('#feedback').style.color='#ef4444';}
    });
    $('#answerInput').addEventListener('keypress',e=>{if(e.key==='Enter')$('#submitAnswer').click();});
    $('#hintBtn').addEventListener('click',()=>{if(hints>0){hints--;$('#hintsLeft').textContent=hints;$('#feedback').textContent='💡 '+rooms[currentRoom].hint;$('#feedback').style.color='#f59e0b';}});
    loadRoom();

})();
