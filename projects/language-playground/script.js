/* language-playground */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    const LANGS={en:'English',es:'Español',fr:'Français',de:'Deutsch',it:'Italiano',pt:'Português',ja:'日本語',ko:'한국어',zh:'中文',ar:'العربية',hi:'हिन्दी',ru:'Русский',tr:'Türkçe',nl:'Nederlands',sv:'Svenska',pl:'Polski',th:'ภาษาไทย',vi:'Tiếng Việt',id:'Bahasa',sw:'Kiswahili'};
    const PHRASES={Greetings:{'en':['Hello','Good morning','Good night','Thank you','Goodbye'],'es':['Hola','Buenos días','Buenas noches','Gracias','Adiós'],'fr':['Bonjour','Bon matin','Bonne nuit','Merci','Au revoir'],'de':['Hallo','Guten Morgen','Gute Nacht','Danke','Auf Wiedersehen'],'ja':['こんにちは','おはよう','おやすみ','ありがとう','さようなら']},
        Travel:{'en':['Where is the hotel?','How much?','I need help','Airport please','Train station'],'es':['¿Dónde está el hotel?','¿Cuánto cuesta?','Necesito ayuda','Aeropuerto por favor','Estación de tren'],'fr':['Où est l\'hôtel?','Combien?','J\'ai besoin d\'aide','Aéroport s\'il vous plaît','Gare'],'de':['Wo ist das Hotel?','Wie viel?','Ich brauche Hilfe','Flughafen bitte','Bahnhof'],'ja':['ホテルはどこ？','いくら？','助けて','空港お願い','駅']},
        Food:{'en':['Water please','The bill please','Delicious!','I am vegetarian','No spicy'],'es':['Agua por favor','La cuenta','¡Delicioso!','Soy vegetariano','Sin picante'],'fr':['De l\'eau s\'il vous plaît','L\'addition','Délicieux!','Je suis végétarien','Pas épicé'],'de':['Wasser bitte','Die Rechnung','Lecker!','Ich bin Vegetarier','Nicht scharf'],'ja':['お水ください','お会計','美味しい！','ベジタリアン','辛くない']},
        Emergency:{'en':['Help!','Police','Hospital','I am lost','Call emergency'],'es':['¡Ayuda!','Policía','Hospital','Estoy perdido','Llame emergencias'],'fr':['Au secours!','Police','Hôpital','Je suis perdu','Appelez les urgences'],'de':['Hilfe!','Polizei','Krankenhaus','Ich bin verloren','Rufen Sie den Notarzt'],'ja':['助けて！','警察','病院','迷った','緊急通報']}};
    
    const ls=$('#langSelect');
    Object.entries(LANGS).forEach(([k,v])=>{const o=document.createElement('option');o.value=k;o.textContent=v;ls.appendChild(o);});

    function renderPhrases(){
        const lang=ls.value, cat=$('#catSelect').value;
        const en=PHRASES[cat]?.en||[];
        const tr=PHRASES[cat]?.[lang]||en;
        $('#phraseList').innerHTML=en.map((e,i)=>'<div style="display:flex;justify-content:space-between;align-items:center;padding:12px;margin:4px 0;background:rgba(255,255,255,0.04);border-radius:8px;"><div><div style="font-weight:600;">'+e+'</div><div style="color:var(--clr-primary,#6366f1);margin-top:2px;">'+(tr[i]||'—')+'</div></div><button class="btn btn-sm btn-secondary speak-btn" data-text="'+(tr[i]||e)+'" data-lang="'+lang+'">🔊</button></div>').join('');
        $$('.speak-btn').forEach(b=>b.addEventListener('click',()=>{const u=new SpeechSynthesisUtterance(b.dataset.text);u.lang=b.dataset.lang;speechSynthesis.speak(u);}));
    }
    ls.addEventListener('change',renderPhrases);
    $('#catSelect').addEventListener('change',renderPhrases);
    ls.value='es'; renderPhrases();

    let quizScore=0,quizQ=0;
    $('#startQuiz').addEventListener('click',()=>{quizScore=0;quizQ=0;nextQuizQ();});
    function nextQuizQ(){
        const cats=Object.keys(PHRASES); const cat=cats[Math.floor(Math.random()*cats.length)];
        const en=PHRASES[cat].en; const idx=Math.floor(Math.random()*en.length);
        const langs=Object.keys(PHRASES[cat]).filter(l=>l!=='en');
        const lang=langs[Math.floor(Math.random()*langs.length)];
        const correct=PHRASES[cat][lang]?.[idx]; if(!correct){nextQuizQ();return;}
        const options=[correct]; while(options.length<4){const r=PHRASES[cat][lang][Math.floor(Math.random()*en.length)]; if(r&&!options.includes(r))options.push(r);}
        options.sort(()=>Math.random()-0.5);
        quizQ++;
        $('#quizArea').innerHTML='<p class="text-muted">Q'+quizQ+' | Score: '+quizScore+'</p><p style="font-size:1.2rem;font-weight:700;">What is "'+en[idx]+'" in '+LANGS[lang]+'?</p>'+options.map(o=>'<button class="btn btn-secondary mt-2 w-100 quiz-opt" data-correct="'+(o===correct)+'">'+o+'</button>').join('');
        $$('.quiz-opt').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.correct==='true'){quizScore++;b.style.background='#22c55e';}else{b.style.background='#ef4444';}setTimeout(nextQuizQ,800);}));
    }

})();
