(() => {
'use strict';
const $ = s => document.querySelector(s);

const CHALLENGES = [
    {
        id: 1,
        title: "Two Sum",
        difficulty: "easy",
        points: 10,
        desc: "Write a function <code>twoSum(nums, target)</code> that returns the indices of the two numbers such that they add up to target. You may assume exactly one solution.",
        initial: "function twoSum(nums, target) {\n  // Your code here\n  \n}",
        tests: [
            { input: "twoSum([2, 7, 11, 15], 9)", expected: "[0, 1]" },
            { input: "twoSum([3, 2, 4], 6)", expected: "[1, 2]" },
            { input: "twoSum([3, 3], 6)", expected: "[0, 1]" }
        ]
    },
    {
        id: 2,
        title: "Reverse Vowels",
        difficulty: "easy",
        points: 10,
        desc: "Write a function <code>reverseVowels(s)</code> that takes a string s and reverses only the vowels in it. Vowels are a, e, i, o, u (both lower and upper case).",
        initial: "function reverseVowels(s) {\n  // Your code here\n  \n}",
        tests: [
            { input: "reverseVowels('hello')", expected: "'holle'" },
            { input: "reverseVowels('leetcode')", expected: "'leotcede'" },
            { input: "reverseVowels('aA')", expected: "'Aa'" }
        ]
    },
    {
        id: 3,
        title: "Longest Substring Without Repeating Characters",
        difficulty: "medium",
        points: 30,
        desc: "Write a function <code>lengthOfLongestSubstring(s)</code> that finds the length of the longest substring without repeating characters.",
        initial: "function lengthOfLongestSubstring(s) {\n  // Your code here\n  \n}",
        tests: [
            { input: "lengthOfLongestSubstring('abcabcbb')", expected: "3" },
            { input: "lengthOfLongestSubstring('bbbbb')", expected: "1" },
            { input: "lengthOfLongestSubstring('pwwkew')", expected: "3" }
        ]
    }
];

let currentChallengeIndex = 0;
let timeLeft = 300; // 5 mins
let timerInterval;
const stats = {
    solved: parseInt(localStorage.getItem('qu_arena_solved') || 0),
    streak: parseInt(localStorage.getItem('qu_arena_streak') || 0),
    points: parseInt(localStorage.getItem('qu_arena_points') || 0),
    bestTime: localStorage.getItem('qu_arena_best_time') || '-'
};

function updateStatsUI() {
    $('#solvedCount').textContent = stats.solved;
    $('#streakCount').textContent = `${stats.streak} 🔥`;
    $('#totalPoints').textContent = stats.points;
    $('#bestTime').textContent = stats.bestTime;
}

let editor;

function loadChallenge(index) {
    if (index >= CHALLENGES.length) index = 0;
    currentChallengeIndex = index;
    const c = CHALLENGES[index];
    
    $('#challengeTitle').textContent = c.title;
    const diffEl = $('#challengeDifficulty');
    diffEl.textContent = c.difficulty;
    diffEl.className = `difficulty ${c.difficulty}`;
    $('#challengePoints').textContent = `${c.points} pts`;
    $('#challengeDesc').innerHTML = c.desc;
    
    if (editor) {
        editor.setValue(c.initial);
    } else {
        // Fallback or wait
        setTimeout(() => { if (editor) editor.setValue(c.initial); }, 500);
    }
    
    $('#testResults').innerHTML = '';
    
    startTimer();
}

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 300;
    updateTimerUI();
    const fill = $('#timerFill');
    fill.style.transition = 'none';
    fill.style.width = '100%';
    setTimeout(() => fill.style.transition = 'width 1s linear', 50);
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerUI();
        fill.style.width = `${(timeLeft / 300) * 100}%`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            $('#testResults').innerHTML = '<div style="color:#ef4444;font-weight:bold;margin-top:1rem">Time\'s up! Click Skip to try another.</div>';
        }
    }, 1000);
}

function updateTimerUI() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    $('#timerDisplay').textContent = `${m}:${s.toString().padStart(2, '0')}`;
}

$('#runBtn').addEventListener('click', () => {
    if (!editor) return;
    const code = editor.getValue();
    const c = CHALLENGES[currentChallengeIndex];
    const resultsContainer = $('#testResults');
    resultsContainer.innerHTML = 'Running...';
    
    setTimeout(() => {
        let passedAll = true;
        let html = '';
        
        // Very basic safe evaluation via Function constructor (sandboxed enough for basic algo without DOM access)
        for (let i = 0; i < c.tests.length; i++) {
            const test = c.tests[i];
            try {
                // Prepend code, then run test case
                // Use a wrapper to capture output
                const wrapper = `
                    ${code}
                    function deepEqual(x, y) {
                      if (x === y) return true;
                      if (typeof x == "object" && x != null && typeof y == "object" && y != null) {
                        if (Object.keys(x).length != Object.keys(y).length) return false;
                        for (var prop in x) {
                          if (y.hasOwnProperty(prop)) { if (!deepEqual(x[prop], y[prop])) return false; }
                          else return false;
                        }
                        return true;
                      }
                      return false;
                    }
                    const result = ${test.input};
                    const expected = ${test.expected};
                    return {pass: deepEqual(result, expected), result: JSON.stringify(result)};
                `;
                
                const testFn = new Function(wrapper);
                const out = testFn();
                
                if (out.pass) {
                    html += `<div class="test-case pass">✅ Case ${i+1}: ${test.input} => ${out.result}</div>`;
                } else {
                    passedAll = false;
                    html += `<div class="test-case fail">❌ Case ${i+1}: Expected ${test.expected}, got ${out.result}</div>`;
                }
            } catch (e) {
                passedAll = false;
                html += `<div class="test-case fail">❌ Case ${i+1}: Error: ${e.message}</div>`;
            }
        }
        
        resultsContainer.innerHTML = html;
        
        if (passedAll) {
            clearInterval(timerInterval);
            resultsContainer.innerHTML += `<div style="margin-top:1rem;color:#10b981;font-weight:bold">🎉 All tests passed! (+${c.points} pts)</div>`;
            
            stats.solved++;
            stats.streak++;
            stats.points += c.points;
            
            const timeTaken = 300 - timeLeft;
            const timeStr = `${Math.floor(timeTaken/60)}m ${timeTaken%60}s`;
            if (stats.bestTime === '-' || timeTaken < parseInt(stats.bestTime.split('m')[0])*60 + parseInt(stats.bestTime.split('m')[1])) {
                stats.bestTime = timeStr;
            }
            
            localStorage.setItem('qu_arena_solved', stats.solved);
            localStorage.setItem('qu_arena_streak', stats.streak);
            localStorage.setItem('qu_arena_points', stats.points);
            localStorage.setItem('qu_arena_best_time', stats.bestTime);
            updateStatsUI();
            
            setTimeout(() => {
                loadChallenge(currentChallengeIndex + 1);
            }, 3000);
        } else {
            stats.streak = 0;
            localStorage.setItem('qu_arena_streak', 0);
            updateStatsUI();
        }
    }, 100);
});

$('#skipBtn').addEventListener('click', () => {
    loadChallenge(currentChallengeIndex + 1);
});

$('#hintBtn').addEventListener('click', () => {
    alert("Think about optimal time complexity! Can you do it in O(n) or O(n log n)?");
});

// Theme
if (typeof QU !== 'undefined') QU.initTheme();
else {
    $('#themeBtn').addEventListener('click', () => { const h = document.documentElement; const d = h.dataset.theme === 'dark'; h.dataset.theme = d ? 'light' : 'dark'; $('#themeBtn').textContent = d ? '☀️' : '🌙'; localStorage.setItem('theme', h.dataset.theme); });
    if (localStorage.getItem('theme') === 'light') { document.documentElement.dataset.theme = 'light'; $('#themeBtn').textContent = '☀️'; }
}

// Load Monaco Editor
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.38.0/min/vs' }});
require(['vs/editor/editor.main'], function() {
    editor = monaco.editor.create(document.getElementById('editorContainer'), {
        value: CHALLENGES[0].initial,
        language: 'javascript',
        theme: document.documentElement.dataset.theme === 'dark' ? 'vs-dark' : 'vs',
        minimap: { enabled: false },
        automaticLayout: true,
        fontSize: 14,
        fontFamily: 'JetBrains Mono, monospace'
    });
    
    updateStatsUI();
    loadChallenge(0);
});

// Theme update for monaco
$('#themeBtn').addEventListener('click', () => {
    if (editor) {
        monaco.editor.setTheme(document.documentElement.dataset.theme === 'dark' ? 'vs-dark' : 'vs');
    }
});

})();
