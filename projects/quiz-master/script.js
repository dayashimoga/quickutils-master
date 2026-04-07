(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const DB = {
    science: [
        {q: "What is the most abundant gas in the Earth's atmosphere?", opts: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"], ans: 2},
        {q: "What is the nearest planet to the Sun?", opts: ["Venus", "Earth", "Mars", "Mercury"], ans: 3},
        {q: "How many bones are in the adult human body?", opts: ["206", "208", "210", "196"], ans: 0},
        {q: "What is the chemical symbol for Gold?", opts: ["Ag", "Au", "Fe", "Cu"], ans: 1},
        {q: "Who proposed the theory of relativity?", opts: ["Isaac Newton", "Galileo Galilei", "Albert Einstein", "Stephen Hawking"], ans: 2}
    ],
    tech: [
        {q: "What does HTML stand for?", opts: ["HyperText Markup Language", "HighText Machine Language", "HyperLoop Machine Language", "HyperText Multi Language"], ans: 0},
        {q: "Who is known as the father of modern computer science?", opts: ["Bill Gates", "Alan Turing", "Steve Jobs", "Charles Babbage"], ans: 1},
        {q: "What was the first commercially successful video game?", opts: ["Pac-Man", "Tetris", "Pong", "Space Invaders"], ans: 2},
        {q: "Which company developed the Java programming language?", opts: ["Microsoft", "Apple", "Sun Microsystems", "IBM"], ans: 2},
        {q: "What is the main function of a DNS server?", opts: ["Filter spam", "Host websites", "Translate domain names to IP addresses", "Encrypt data"], ans: 2}
    ],
    history: [
        {q: "In what year did World War II end?", opts: ["1941", "1943", "1945", "1947"], ans: 2},
        {q: "Who was the first President of the United States?", opts: ["Thomas Jefferson", "John Adams", "Benjamin Franklin", "George Washington"], ans: 3},
        {q: "The ancient city of Rome was built on how many hills?", opts: ["5", "7", "9", "12"], ans: 1},
        {q: "Which empire built Machu Picchu?", opts: ["Aztec", "Maya", "Inca", "Olmec"], ans: 2},
        {q: "Who painted the Mona Lisa?", opts: ["Vincent van Gogh", "Pablo Picasso", "Michelangelo", "Leonardo da Vinci"], ans: 3}
    ]
};
const CATEGORIES = [
    {id: 'science', name: 'Science', emoji: '🔬'},
    {id: 'tech', name: 'Technology', emoji: '💻'},
    {id: 'history', name: 'History', emoji: '🏛️'},
    {id: 'mix', name: 'Mixed Bag', emoji: '🎲'}
];

let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let streak = 0;
let maxStreak = 0;

// Init Categories
$('#categoryGrid').innerHTML = CATEGORIES.map(c => 
    `<div class="category-btn" data-id="${c.id}"><span class="emoji">${c.emoji}</span>${c.name}</div>`
).join('');

$$('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        $$('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

$('#startQuizBtn').addEventListener('click', () => {
    const active = $('.category-btn.active');
    if (!active) { alert("Please select a category"); return; }
    
    const cat = active.dataset.id;
    if (cat === 'mix') {
        currentQuestions = [...DB.science, ...DB.tech, ...DB.history].sort(() => 0.5 - Math.random()).slice(0, 10);
    } else {
        currentQuestions = [...DB[cat]].sort(() => 0.5 - Math.random()).slice(0, 10);
    }
    
    currentIndex = 0;
    score = 0;
    streak = 0;
    maxStreak = 0;
    updateScoreUI();
    
    $('#categorySelect').style.display = 'none';
    $('#questionCard').style.display = 'block';
    $('#resultCard').style.display = 'none';
    
    loadQuestion();
});

function loadQuestion() {
    const q = currentQuestions[currentIndex];
    $('#qNumber').textContent = `Question ${currentIndex + 1} of ${currentQuestions.length}`;
    $('#qText').textContent = q.q;
    
    $('#quizProgress').style.width = `${((currentIndex) / currentQuestions.length) * 100}%`;
    
    $('#optionsGrid').innerHTML = q.opts.map((opt, i) => 
        `<button class="option-btn" data-index="${i}">${opt}</button>`
    ).join('');
    
    $('#nextBtn').style.display = 'none';
    
    $$('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if ($('#nextBtn').style.display !== 'none') return; // already answered
            
            const selected = parseInt(btn.dataset.index);
            const correct = q.ans;
            
            $$('.option-btn').forEach(b => b.classList.add('disabled'));
            
            if (selected === correct) {
                btn.classList.add('correct');
                score += 100 + (streak * 10); // Bonus points for streak
                streak++;
                maxStreak = Math.max(maxStreak, streak);
            } else {
                btn.classList.add('wrong');
                $$('.option-btn')[correct].classList.add('correct');
                streak = 0;
            }
            
            updateScoreUI();
            $('#nextBtn').style.display = 'inline-block';
        });
    });
}

$('#nextBtn').addEventListener('click', () => {
    currentIndex++;
    if (currentIndex < currentQuestions.length) {
        loadQuestion();
    } else {
        showResults();
    }
});

function updateScoreUI() {
    $('#scoreNum').textContent = score;
    $('#streakNum').textContent = `${streak}🔥`;
    $('#questionNum').textContent = `${currentIndex}/${currentQuestions.length}`;
}

function showResults() {
    $('#questionCard').style.display = 'none';
    $('#resultCard').style.display = 'block';
    $('#quizProgress').style.width = '100%';
    
    $('#finalScore').textContent = score;
    const maxScore = currentQuestions.length * 100 + (currentQuestions.length * (currentQuestions.length-1) / 2) * 10;
    const perc = score / maxScore;
    
    if (perc > 0.8) $('#resultMsg').textContent = "Excellent! You're a trivia master standing among geniuses.";
    else if (perc > 0.5) $('#resultMsg').textContent = "Good job! You know your stuff.";
    else $('#resultMsg').textContent = "Keep practicing! Every expert was once a beginner.";
    
    $('#resultStreak').textContent = `Max Streak: ${maxStreak} 🔥`;
}

$('#retryBtn').addEventListener('click', () => {
    $('#resultCard').style.display = 'none';
    $('#categorySelect').style.display = 'block';
    $('#quizProgress').style.width = '0%';
});

// Theme
if (typeof QU !== 'undefined') QU.initTheme();
else {
    $('#themeBtn').addEventListener('click', () => { const h = document.documentElement; const d = h.dataset.theme === 'dark'; h.dataset.theme = d ? 'light' : 'dark'; $('#themeBtn').textContent = d ? '☀️' : '🌙'; localStorage.setItem('theme', h.dataset.theme); });
    if (localStorage.getItem('theme') === 'light') { document.documentElement.dataset.theme = 'light'; $('#themeBtn').textContent = '☀️'; }
}

})();
