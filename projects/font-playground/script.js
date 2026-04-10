/* script.js for font-playground */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    const FONTS = [
        "Inter", "Roboto", "Open Sans", "Lato", "Montserrat",
        "Oswald", "Source Sans Pro", "Slabo 27px", "Raleway", "PT Sans",
        "Merriweather", "Nunito", "Playfair Display", "Rubik", "Lora",
        "Work Sans", "Fira Sans", "Quicksand", "Karla", "Inconsolata",
        "Space Mono", "Fira Code", "Pacifico", "Dancing Script", "Caveat"
    ];

    // Load fonts dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${FONTS.map(f => f.replace(/ /g, '+') + ':wght@300;400;600;700').join('&family=')}&display=swap`;
    document.head.appendChild(link);

    let state = {
        text: "The quick brown fox jumps over the lazy dog",
        size: 32,
        weight: 400,
        lineHeight: 1.5,
        letterSpacing: 0
    };

    const grid = $('#fontGrid');
    
    function renderGrid() {
        grid.innerHTML = FONTS.map(font => `
            <div class="font-card">
                <div class="font-header">
                    <span class="font-name">${font}</span>
                    <button class="btn btn-sm btn-primary copy-btn" data-font="${font}">Copy CSS</button>
                </div>
                <div class="font-preview" style="
                    font-family: '${font}', sans-serif;
                    font-size: ${state.size}px;
                    font-weight: ${state.weight};
                    line-height: ${state.lineHeight};
                    letter-spacing: ${state.letterSpacing}px;
                " contenteditable="true" spellcheck="false">${state.text}</div>
            </div>
        `).join('');

        $$('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const font = e.target.dataset.font;
                const css = `font-family: '${font}', sans-serif;\nfont-size: ${state.size}px;\nfont-weight: ${state.weight};\nline-height: ${state.lineHeight};\nletter-spacing: ${state.letterSpacing}px;`;
                navigator.clipboard.writeText(css);
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = 'Copy CSS', 2000);
            });
        });
        
        $$('.font-preview').forEach(prev => {
            prev.addEventListener('input', (e) => {
                state.text = e.target.textContent;
                $('#previewText').value = state.text;
                // Don't re-render entire grid during typing, would lose focus
                $$('.font-preview').forEach(p => {
                    if (p !== e.target) p.textContent = state.text;
                });
            });
        });
    }

    function updateStyles() {
        $$('.font-preview').forEach(el => {
            el.style.fontSize = state.size + 'px';
            el.style.fontWeight = state.weight;
            el.style.lineHeight = state.lineHeight;
            el.style.letterSpacing = state.letterSpacing + 'px';
            if(document.activeElement !== el) {
                el.textContent = state.text;
            }
        });
    }

    const bindControl = (id, prop, suffix='') => {
        const input = $('#' + id);
        const display = $('#' + id + 'Val');
        input.addEventListener('input', e => {
            state[prop] = e.target.value;
            display.textContent = e.target.value + suffix;
            updateStyles();
        });
    };

    $('#previewText').addEventListener('input', (e) => {
        state.text = e.target.value;
        updateStyles();
    });

    bindControl('fontSize', 'size', 'px');
    bindControl('fontWeight', 'weight');
    bindControl('lineHeight', 'lineHeight');
    bindControl('letterSpacing', 'letterSpacing', 'px');

    renderGrid();
})();
