/* script.js for flashcard-maker */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    
    // Initialize common utilities
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
    
    // Default deck if nothing in local storage
    const defaultDeck = [
        { term: "Photosynthesis", def: "The process by which green plants and some other organisms use sunlight to synthesize foods with carbon dioxide and water." },
        { term: "Mitochondria", def: "An organelle found in large numbers in most cells, in which the biochemical processes of respiration and energy production occur." },
        { term: "Neuroplasticity", def: "The ability of the brain to form and reorganize synaptic connections, especially in response to learning or experience." }
    ];

    let decks = JSON.parse(localStorage.getItem('qu_flashcards')) || { "Biology 101": defaultDeck };
    let currentDeckName = Object.keys(decks)[0];
    let currentIndex = 0;

    // DOM Elements
    const cardEl = $('#flashcard');
    const frontEl = $('#cardFront');
    const backEl = $('#cardBack');
    const editorDiv = $('#flashcardList');
    
    function renderFlashcard() {
        const deck = decks[currentDeckName];
        if(!deck || deck.length === 0) {
            frontEl.textContent = "No cards in deck";
            backEl.textContent = "Add some cards below!";
            $('#counter').textContent = "0 / 0";
            return;
        }
        
        // Wrap around bounds safely
        if (currentIndex < 0) currentIndex = deck.length - 1;
        if (currentIndex >= deck.length) currentIndex = 0;

        cardEl.classList.remove('flipped');
        
        // slight delay to allow flip animation to settle before content changes if we wanted, 
        // but changing instantly is usually fine for next/prev.
        frontEl.textContent = deck[currentIndex].term;
        backEl.textContent = deck[currentIndex].def;
        $('#counter').textContent = `${currentIndex + 1} / ${deck.length}`;
    }

    function renderEditor() {
        editorDiv.innerHTML = '';
        const deck = decks[currentDeckName] || [];
        deck.forEach((card, index) => {
            const row = document.createElement('div');
            row.className = 'flashcard-item';
            row.innerHTML = `
                <input type="text" class="card-term" value="${card.term}" placeholder="Term">
                <input type="text" class="card-def" value="${card.def}" placeholder="Definition">
                <button class="btn btn-sm btn-danger delete-btn" data-index="${index}">❌</button>
            `;
            editorDiv.appendChild(row);
        });
        
        $$('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                decks[currentDeckName].splice(idx, 1);
                save();
                renderEditor();
                currentIndex = 0;
                renderFlashcard();
            });
        });

        $$('.card-term, .card-def').forEach((input) => {
            input.addEventListener('change', () => {
                const rows = $$('.flashcard-item');
                decks[currentDeckName] = Array.from(rows).map(row => ({
                    term: row.querySelector('.card-term').value,
                    def: row.querySelector('.card-def').value
                }));
                save();
                renderFlashcard();
            });
        });
    }

    function save() {
        localStorage.setItem('qu_flashcards', JSON.stringify(decks));
    }

    // Events
    cardEl.addEventListener('click', () => {
        cardEl.classList.toggle('flipped');
    });

    $('#prevCard').addEventListener('click', () => {
        currentIndex--;
        renderFlashcard();
    });

    $('#nextCard').addEventListener('click', () => {
        currentIndex++;
        renderFlashcard();
    });

    $('#addCard').addEventListener('click', () => {
        decks[currentDeckName].push({term: "", def: ""});
        save();
        renderEditor();
    });

    $('#newDeck').addEventListener('click', () => {
        const name = prompt("Enter new deck name:");
        if(name && !decks[name]) {
            decks[name] = [];
            currentDeckName = name;
            currentIndex = 0;
            save();
            renderDeckSelector();
            renderEditor();
            renderFlashcard();
        }
    });

    function renderDeckSelector() {
        const sel = $('#deckSelect');
        sel.innerHTML = '';
        Object.keys(decks).forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            if(name === currentDeckName) opt.selected = true;
            sel.appendChild(opt);
        });
    }

    $('#deckSelect').addEventListener('change', (e) => {
        currentDeckName = e.target.value;
        currentIndex = 0;
        renderEditor();
        renderFlashcard();
    });

    // Init
    renderDeckSelector();
    renderEditor();
    renderFlashcard();
    
    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if(document.activeElement.tagName === 'INPUT') return;
        if(e.code === 'Space') { e.preventDefault(); cardEl.classList.toggle('flipped'); }
        if(e.code === 'ArrowRight') { $('#nextCard').click(); }
        if(e.code === 'ArrowLeft') { $('#prevCard').click(); }
    });
})();
