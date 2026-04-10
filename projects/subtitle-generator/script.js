/* script.js for subtitle-generator */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    
    // Initialize common utilities
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    let recognition, recording = false, srt = [], index = 1;
const rec = $('#recordBtn'), exp = $('#exportBtn'), log = $('#transcriptLog');
const Sr = window.SpeechRecognition || window.webkitSpeechRecognition;
if(Sr) {
    recognition = new Sr();
    recognition.continuous = true;
    recognition.interimResults = false;
    let startTime;
    function fTime(ms) { let date = new Date(ms); return date.toISOString().substr(11, 8)+',000'; }
    recognition.onstart = () => { startTime = Date.now(); recording=true; rec.innerHTML='🛑 Stop Recording'; rec.style.color='red'; };
    recognition.onresult = (e) => {
        let text = e.results[e.results.length-1][0].transcript;
        srt.push({id: index++, start: fTime(Date.now()-startTime-2000), end: fTime(Date.now()-startTime), text });
        log.innerHTML += `[${srt[srt.length-1].start}] ${text}<br>`;
        log.scrollTop = log.scrollHeight;
    };
    recognition.onerror = (e) => console.log(e);
    recognition.onend = () => { recording=false; rec.innerHTML='🎙️ Start Recording'; rec.style.color=''; };
    rec.onclick = () => recording ? recognition.stop() : recognition.start();
    exp.onclick = () => {
        let content = srt.map(s => `${s.id}\n${s.start} --> ${s.end}\n${s.text}\n`).join('\n');
        let a = document.createElement('a'); a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content); a.download = 'subs.srt'; a.click();
    };
} else { log.innerHTML = "Speech recognition not supported in this browser."; }
})();