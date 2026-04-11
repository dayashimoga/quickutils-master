/* ai-prompt-builder */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    const models = {
        chatgpt: [{l:'Role',p:'You are a...',id:'role'},{l:'Task',p:'I need you to...',id:'task'},{l:'Context',p:'Background info...',id:'ctx'},{l:'Format',p:'Respond as...',id:'fmt'},{l:'Tone',p:'Professional, casual...',id:'tone'}],
        midjourney: [{l:'Subject',p:'A majestic dragon...',id:'sub'},{l:'Style',p:'Oil painting, photorealistic...',id:'sty'},{l:'Lighting',p:'Golden hour, dramatic...',id:'light'},{l:'Camera',p:'Wide angle, macro...',id:'cam'},{l:'Quality',p:'--v 6 --ar 16:9',id:'qual'}],
        dalle: [{l:'Description',p:'Generate an image of...',id:'desc'},{l:'Art Style',p:'Digital art, watercolor...',id:'art'},{l:'Mood',p:'Serene, dramatic...',id:'mood'},{l:'Details',p:'Specific details...',id:'det'}],
        code: [{l:'Language',p:'Python, JavaScript...',id:'lang'},{l:'Task',p:'Write a function that...',id:'ctask'},{l:'Constraints',p:'Must be O(n)...',id:'con'},{l:'Examples',p:'Input/output examples...',id:'ex'}]
    };
    let currentModel = 'chatgpt';
    const history = JSON.parse(localStorage.getItem('qu_prompt_history') || '[]');

    function renderBuilder() {
        const fields = models[currentModel];
        $('#builderArea').innerHTML = fields.map(f => 
            '<div class="mb-3"><label style="display:block;margin-bottom:4px;color:#aaa;font-size:0.85rem;">'+f.l+'</label><input class="form-control prompt-field" id="pf_'+f.id+'" placeholder="'+f.p+'" data-label="'+f.l+'"></div>'
        ).join('');
        $$('.prompt-field').forEach(el => el.addEventListener('input', buildPrompt));
    }

    function buildPrompt() {
        const fields = models[currentModel];
        let parts = [];
        fields.forEach(f => { const v = $('#pf_'+f.id); if(v && v.value.trim()) parts.push(f.l+': '+v.value.trim()); });
        $('#promptOutput').value = parts.join('\n\n');
    }

    $$('.model-btn').forEach(b => b.addEventListener('click', () => {
        $$('.model-btn').forEach(x => { x.classList.remove('active'); x.classList.remove('btn-primary'); x.classList.add('btn-secondary'); });
        b.classList.add('active'); b.classList.remove('btn-secondary'); b.classList.add('btn-primary');
        currentModel = b.dataset.model;
        renderBuilder();
    }));

    $('#copyBtn').addEventListener('click', () => {
        const t = $('#promptOutput').value;
        if(!t) return;
        navigator.clipboard.writeText(t);
        history.unshift({text: t.substring(0,100), model: currentModel, date: new Date().toLocaleDateString()});
        if(history.length > 20) history.pop();
        localStorage.setItem('qu_prompt_history', JSON.stringify(history));
        renderHistory();
        if(typeof QU !== 'undefined') QU.showToast('Copied!','success');
    });
    $('#clearBtn').addEventListener('click', () => { $$('.prompt-field').forEach(el=>el.value=''); $('#promptOutput').value=''; });

    function renderHistory() {
        $('#historyList').innerHTML = history.length === 0 ? '<p class="text-muted">No prompts saved yet</p>' :
            history.map((h,i) => '<div style="padding:8px;margin-bottom:4px;background:rgba(255,255,255,0.05);border-radius:6px;display:flex;justify-content:space-between;"><span>'+h.text+'...</span><span class="text-muted" style="font-size:0.75rem;">'+h.model+' • '+h.date+'</span></div>').join('');
    }
    renderBuilder();
    renderHistory();

})();
