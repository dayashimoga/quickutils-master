# pragma: no cover
"""
Generate remaining 8 new project sites efficiently.
Each gets an index.html, style.css, script.js with full functionality.
"""
import os
from pathlib import Path

ROOT = Path(r"j:\quickutils\quickutils-master\projects")

# Common CSS template (shared across all new sites)
def make_css(accent_color, accent2_color, gradient):
    return f""":root{{--bg:#0a0a0f;--bg-card:rgba(18,18,30,0.85);--bg-surface:#12121e;--text:#e8e8f0;--text-muted:#888;--accent:{accent_color};--accent2:{accent2_color};--accent-glow:rgba(99,102,241,0.3);--gradient:{gradient};--border:rgba(255,255,255,0.08);--radius:12px;--font:'Inter',sans-serif;--mono:'JetBrains Mono',monospace}}
[data-theme="light"]{{--bg:#f5f5fa;--bg-card:rgba(255,255,255,0.9);--bg-surface:#fff;--text:#1a1a2e;--text-muted:#666;--border:rgba(0,0,0,0.08);--accent-glow:rgba(99,102,241,0.15)}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:var(--font);background:var(--bg);color:var(--text);min-height:100vh}}
.container{{max-width:1100px;margin:0 auto;padding:0 1.5rem}}
.navbar{{position:sticky;top:0;z-index:100;background:rgba(10,10,15,0.8);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);padding:0.75rem 0}}
[data-theme="light"] .navbar{{background:rgba(245,245,250,0.85)}}
.nav-inner{{display:flex;align-items:center;justify-content:space-between;gap:1rem}}
.brand{{text-decoration:none;color:var(--text);font-weight:700;font-size:1.25rem;display:flex;align-items:center;gap:0.5rem}}
.brand span{{background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}}
.nav-links{{display:flex;gap:0.5rem;align-items:center}}
.nav-links a{{text-decoration:none;color:var(--text-muted);font-size:0.9rem;padding:0.4rem 0.75rem;border-radius:8px;transition:all 0.2s}}
.nav-links a:hover,.nav-links a.active{{color:var(--text);background:var(--accent-glow)}}
.kofi-link{{color:#ff5e5b !important;font-weight:600}}
.theme-btn{{background:none;border:1px solid var(--border);width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;transition:all 0.2s}}
.theme-btn:hover{{border-color:var(--accent);transform:scale(1.1)}}
.hero{{text-align:center;padding:2rem 0 1.5rem}}
.hero h1{{font-size:clamp(1.75rem,4vw,2.75rem);font-weight:800;margin-bottom:0.5rem}}
.gradient-text{{background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}}
.hero-sub{{color:var(--text-muted);font-size:1rem;max-width:500px;margin:0 auto}}
.glass-card{{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;margin-bottom:1.5rem;backdrop-filter:blur(10px)}}
.glass-card:hover{{border-color:rgba(99,102,241,0.2)}}
.mt-2{{margin-top:0.5rem}}.mt-3{{margin-top:1rem}}.mt-4{{margin-top:1.5rem}}
.text-muted{{color:var(--text-muted)}}
.btn{{padding:0.6rem 1.2rem;border:none;border-radius:8px;cursor:pointer;font-family:var(--font);font-weight:600;font-size:0.85rem;transition:all 0.2s}}
.btn-primary{{background:var(--gradient);color:#fff}}
.btn-primary:hover{{transform:translateY(-2px);box-shadow:0 4px 20px var(--accent-glow)}}
.btn-secondary{{background:transparent;color:var(--text);border:1px solid var(--border)}}
.btn-secondary:hover{{border-color:var(--accent);color:var(--accent)}}
.btn-sm{{padding:0.4rem 0.8rem;font-size:0.8rem}}
.btn-group{{display:flex;gap:2px}}
.btn-group button{{background:var(--bg-card);color:var(--text-muted);border:1px solid var(--border);padding:0.4rem 0.8rem;font-size:0.8rem;cursor:pointer;transition:all 0.2s;font-family:var(--font)}}
.btn-group button:first-child{{border-radius:8px 0 0 8px}}
.btn-group button:last-child{{border-radius:0 8px 8px 0}}
.btn-group button.active,.btn-group button:hover{{background:var(--accent);color:#fff;border-color:var(--accent)}}
input[type="text"],input[type="number"],textarea,select{{width:100%;padding:0.6rem 0.9rem;background:var(--bg-surface);color:var(--text);border:1px solid var(--border);border-radius:8px;outline:none;font-family:var(--font);font-size:0.9rem}}
input:focus,textarea:focus,select:focus{{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow)}}
.info-section{{margin:2rem 0}}.info-section h2{{text-align:center;margin-bottom:1.5rem}}
.info-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem}}
.info-card{{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem;transition:all 0.3s}}
.info-card:hover{{border-color:var(--accent);transform:translateY(-3px)}}
.info-card h3{{font-size:1rem;margin-bottom:0.5rem}}.info-card p{{font-size:0.85rem;color:var(--text-muted);line-height:1.6}}
.footer{{margin-top:3rem;border-top:1px solid var(--border);padding:2rem 0}}
.footer-inner{{display:flex;flex-wrap:wrap;gap:2rem;justify-content:space-between}}
.footer-brand span{{font-weight:700;font-size:1.1rem}}.footer-brand p{{color:var(--text-muted);font-size:0.85rem;margin-top:0.3rem}}
.footer-brand a{{color:var(--accent);text-decoration:none}}
.copyright{{width:100%;text-align:center;color:var(--text-muted);font-size:0.8rem;margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)}}
@media(max-width:768px){{.nav-links{{display:none}}}}
"""

# Common HTML wrapper
def make_html(title, emoji, brand, desc, body_content, extra_css="", extra_head=""):
    return f"""<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | QuickUtils</title>
    <meta name="description" content="{desc}">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>{emoji}</text></svg>">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">{extra_head}
</head>
<body>
<nav class="navbar"><div class="container nav-inner">
    <a href="/" class="brand">{emoji} <span>{brand}</span></a>
    <div class="nav-links">
        <a href="https://ko-fi.com/dayatin" target="_blank" rel="noopener" class="kofi-link">☕ Support</a>
        <a href="https://quickutils.top" target="_blank">QuickUtils</a>
    </div>
    <button class="theme-btn" id="themeBtn">🌙</button>
</div></nav>
<main class="container">
{body_content}
</main>
<footer class="footer"><div class="container footer-inner">
    <div class="footer-brand"><span>{emoji} {brand}</span><p>Part of <a href="https://quickutils.top">QuickUtils</a></p></div>
    <p class="copyright">© 2026 QuickUtils. All rights reserved.</p>
</div></footer>
<script src="script.js"></script>
</body>
</html>"""

# ════════════════════════════
# PROJECT DEFINITIONS
# ════════════════════════════
PROJECTS = {}

# 1. Code Arena
PROJECTS['code-arena'] = {
    'title': 'Code Arena — JavaScript Challenges',
    'emoji': '💻', 'brand': 'CodeArena',
    'desc': 'Solve JavaScript coding challenges with a live editor. Compete against time and track your streak.',
    'accent': '#10b981', 'accent2': '#059669',
    'gradient': 'linear-gradient(135deg,#10b981,#059669,#3b82f6)',
    'extra_css': """
.challenge-card{margin-bottom:1.5rem}
.challenge-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}
.difficulty{padding:3px 10px;border-radius:20px;font-size:0.7rem;font-weight:700;text-transform:uppercase}
.difficulty.easy{background:rgba(16,185,129,0.2);color:#10b981}
.difficulty.medium{background:rgba(245,158,11,0.2);color:#f59e0b}
.difficulty.hard{background:rgba(239,68,68,0.2);color:#ef4444}
.code-editor{width:100%;min-height:200px;padding:1rem;background:#0d1117;color:#c9d1d9;border:1px solid var(--border);border-radius:8px;font-family:var(--mono);font-size:0.85rem;resize:vertical;tab-size:2;line-height:1.6}
.test-results{margin-top:1rem}
.test-case{display:flex;align-items:center;gap:0.5rem;padding:0.5rem;border-radius:6px;margin-bottom:4px;font-size:0.8rem;font-family:var(--mono)}
.test-case.pass{background:rgba(16,185,129,0.1);color:#10b981}
.test-case.fail{background:rgba(239,68,68,0.1);color:#ef4444}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem}
.stat-card{text-align:center;padding:1rem;background:var(--bg-surface);border-radius:8px;border:1px solid var(--border)}
.stat-card .val{font-size:1.5rem;font-weight:800;font-family:var(--mono);background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.stat-card .label{font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;margin-top:0.25rem}
.timer-bar{height:4px;background:var(--border);border-radius:2px;margin:0.5rem 0;overflow:hidden}
.timer-fill{height:100%;background:var(--gradient);border-radius:2px;transition:width 0.5s linear}
""",
    'body': """
    <section class="hero">
        <h1><span class="gradient-text">Code Arena</span></h1>
        <p class="hero-sub">Solve JavaScript challenges, beat the clock, build your streak</p>
    </section>
    <div class="stats-grid">
        <div class="stat-card"><div class="val" id="solvedCount">0</div><div class="label">Solved</div></div>
        <div class="stat-card"><div class="val" id="streakCount">0 🔥</div><div class="label">Streak</div></div>
        <div class="stat-card"><div class="val" id="totalPoints">0</div><div class="label">Points</div></div>
        <div class="stat-card"><div class="val" id="bestTime">-</div><div class="label">Best Time</div></div>
    </div>
    <section class="glass-card challenge-card">
        <div class="challenge-header">
            <h2 id="challengeTitle">Loading...</h2>
            <div style="display:flex;gap:0.5rem;align-items:center">
                <span class="difficulty" id="challengeDifficulty">easy</span>
                <span id="challengePoints" style="font-size:0.8rem;color:var(--text-muted)">10 pts</span>
            </div>
        </div>
        <p id="challengeDesc" class="text-muted" style="margin-bottom:1rem;font-size:0.9rem"></p>
        <div class="timer-bar"><div class="timer-fill" id="timerFill" style="width:100%"></div></div>
        <p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.5rem">Time: <span id="timerDisplay">5:00</span></p>
        <textarea class="code-editor" id="codeEditor" spellcheck="false"></textarea>
        <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
            <button class="btn btn-primary" id="runBtn">▶ Run Tests</button>
            <button class="btn btn-secondary" id="skipBtn">⏭ Skip</button>
            <button class="btn btn-secondary" id="hintBtn">💡 Hint</button>
        </div>
        <div class="test-results" id="testResults"></div>
    </section>
    <section class="info-section">
        <h2>📚 Challenge Categories</h2>
        <div class="info-grid">
            <div class="info-card"><h3>🔤 Strings</h3><p>Reverse, palindromes, anagrams, compression, and pattern matching.</p></div>
            <div class="info-card"><h3>📦 Arrays</h3><p>Sorting, searching, two pointers, sliding window, and matrix operations.</p></div>
            <div class="info-card"><h3>🧮 Math</h3><p>Fibonacci, primes, factorials, GCD, and number theory problems.</p></div>
            <div class="info-card"><h3>🏗️ Data Structures</h3><p>Stacks, queues, linked lists, trees, and hash maps.</p></div>
        </div>
    </section>""",
}

# 2. Quiz Master
PROJECTS['quiz-master'] = {
    'title': 'Quiz Master — Dynamic Trivia',
    'emoji': '🏆', 'brand': 'QuizMaster',
    'desc': 'Test your knowledge across science, tech, history, geography, and pop culture. 200+ questions with scoring.',
    'accent': '#f59e0b', 'accent2': '#d97706',
    'gradient': 'linear-gradient(135deg,#f59e0b,#ec4899,#8b5cf6)',
    'extra_css': """
.quiz-container{max-width:700px;margin:0 auto}
.category-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.75rem;margin-bottom:1.5rem}
.category-btn{padding:1rem;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;text-align:center;transition:all 0.2s;font-size:0.85rem;font-weight:600}
.category-btn:hover,.category-btn.active{border-color:var(--accent);background:var(--accent-glow);transform:translateY(-2px)}
.category-btn .emoji{font-size:1.5rem;display:block;margin-bottom:0.3rem}
.question-card{text-align:center;padding:2rem}
.question-number{font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem}
.question-text{font-size:1.2rem;font-weight:600;margin-bottom:1.5rem;line-height:1.5}
.options-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;max-width:500px;margin:0 auto}
.option-btn{padding:0.8rem 1rem;background:var(--bg-surface);border:2px solid var(--border);border-radius:10px;cursor:pointer;font-size:0.9rem;transition:all 0.2s;text-align:left}
.option-btn:hover{border-color:var(--accent);transform:scale(1.02)}
.option-btn.correct{border-color:#10b981;background:rgba(16,185,129,0.15);color:#10b981}
.option-btn.wrong{border-color:#ef4444;background:rgba(239,68,68,0.15);color:#ef4444}
.option-btn.disabled{pointer-events:none;opacity:0.6}
.progress-bar{height:6px;background:var(--border);border-radius:3px;margin:1rem 0;overflow:hidden}
.progress-fill{height:100%;background:var(--gradient);border-radius:3px;transition:width 0.3s}
.score-display{display:flex;justify-content:center;gap:2rem;margin-bottom:1rem}
.score-item{text-align:center}.score-item .num{font-size:1.5rem;font-weight:800;font-family:var(--mono)}
.score-item .lbl{font-size:0.7rem;color:var(--text-muted);text-transform:uppercase}
.result-card{text-align:center;padding:2rem}
.result-card .big-score{font-size:4rem;font-weight:900;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.streak-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:600;background:rgba(245,158,11,0.2);color:#f59e0b;margin-top:0.5rem}
""",
    'body': """
    <section class="hero">
        <h1><span class="gradient-text">Quiz Master</span></h1>
        <p class="hero-sub">200+ questions across 6 categories. How high can you score?</p>
    </section>
    <div class="quiz-container">
        <div class="score-display">
            <div class="score-item"><div class="num" id="scoreNum">0</div><div class="lbl">Score</div></div>
            <div class="score-item"><div class="num" id="streakNum">0🔥</div><div class="lbl">Streak</div></div>
            <div class="score-item"><div class="num" id="questionNum">0/10</div><div class="lbl">Question</div></div>
        </div>
        <div class="progress-bar"><div class="progress-fill" id="quizProgress" style="width:0%"></div></div>
        <section class="glass-card" id="categorySelect">
            <h2 style="text-align:center;margin-bottom:1rem">Choose a Category</h2>
            <div class="category-grid" id="categoryGrid"></div>
            <div style="text-align:center;margin-top:0.5rem">
                <button class="btn btn-primary" id="startQuizBtn">🚀 Start Quiz</button>
            </div>
        </section>
        <section class="glass-card question-card" id="questionCard" style="display:none">
            <div class="question-number" id="qNumber">Question 1 of 10</div>
            <div class="question-text" id="qText"></div>
            <div class="options-grid" id="optionsGrid"></div>
            <button class="btn btn-primary mt-3" id="nextBtn" style="display:none">Next →</button>
        </section>
        <section class="glass-card result-card" id="resultCard" style="display:none">
            <h2>Quiz Complete!</h2>
            <div class="big-score" id="finalScore">0</div>
            <p class="text-muted mt-2" id="resultMsg"></p>
            <div class="streak-badge" id="resultStreak"></div>
            <button class="btn btn-primary mt-3" id="retryBtn">🔄 Play Again</button>
        </section>
    </div>""",
}

# 3. Life Simulator (Conway's Game of Life)
PROJECTS['life-simulator'] = {
    'title': "Game of Life — Cellular Automata",
    'emoji': '🧬', 'brand': 'LifeSim',
    'desc': "Conway's Game of Life interactive simulator. Create patterns, watch them evolve, explore cellular automata.",
    'accent': '#22c55e', 'accent2': '#16a34a',
    'gradient': 'linear-gradient(135deg,#22c55e,#06b6d4,#3b82f6)',
    'extra_css': """
.life-canvas{background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;cursor:crosshair;display:block;margin:0 auto}
.controls-bar{display:flex;gap:0.75rem;align-items:center;justify-content:center;flex-wrap:wrap;margin:1rem 0}
.gen-counter{font-family:var(--mono);font-size:0.85rem;color:var(--text-muted)}
.patterns-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:0.5rem;margin-top:1rem}
.pattern-btn{padding:0.5rem;background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:0.75rem;text-align:center;transition:all 0.2s}
.pattern-btn:hover{border-color:var(--accent);transform:translateY(-2px)}
.speed-control{display:flex;align-items:center;gap:0.5rem;font-size:0.8rem}
.speed-control input[type="range"]{width:100px;-webkit-appearance:none;height:4px;background:var(--border);border-radius:2px;cursor:pointer}
.speed-control input::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:var(--accent)}
.population-counter{font-family:var(--mono);color:var(--accent)}
""",
    'body': """
    <section class="hero">
        <h1><span class="gradient-text">Game of Life</span></h1>
        <p class="hero-sub">Explore Conway's cellular automata — watch simple rules create complex patterns</p>
    </section>
    <section class="glass-card">
        <div class="controls-bar">
            <button class="btn btn-primary" id="playBtn">▶ Play</button>
            <button class="btn btn-secondary" id="stepBtn">⏭ Step</button>
            <button class="btn btn-secondary" id="clearBtn">🗑️ Clear</button>
            <button class="btn btn-secondary" id="randomBtn">🎲 Random</button>
            <div class="speed-control">
                <span>Speed</span>
                <input type="range" id="speedSlider" min="1" max="60" value="15">
            </div>
            <span class="gen-counter">Gen: <span id="genCount" class="population-counter">0</span></span>
            <span class="gen-counter">Pop: <span id="popCount" class="population-counter">0</span></span>
        </div>
        <canvas id="lifeCanvas" class="life-canvas" width="800" height="500"></canvas>
    </section>
    <section class="glass-card">
        <h3>📋 Pattern Library</h3>
        <p class="text-muted" style="font-size:0.8rem;margin-bottom:0.5rem">Click a pattern to stamp it onto the grid</p>
        <div class="patterns-grid" id="patternsGrid"></div>
    </section>
    <section class="info-section">
        <h2>📚 Rules of Life</h2>
        <div class="info-grid">
            <div class="info-card"><h3>🟢 Birth</h3><p>A dead cell with exactly 3 live neighbors becomes alive.</p></div>
            <div class="info-card"><h3>💀 Death (Lonely)</h3><p>A live cell with fewer than 2 neighbors dies of isolation.</p></div>
            <div class="info-card"><h3>💀 Death (Crowded)</h3><p>A live cell with more than 3 neighbors dies of overcrowding.</p></div>
            <div class="info-card"><h3>✨ Survival</h3><p>A live cell with 2 or 3 neighbors survives to the next generation.</p></div>
        </div>
    </section>""",
}

# 4. Whiteboard
PROJECTS['whiteboard'] = {
    'title': 'Infinite Whiteboard — Drawing Canvas',
    'emoji': '🖌️', 'brand': 'Whiteboard',
    'desc': 'Freeform drawing whiteboard with shapes, text, colors, and infinite canvas. Export your creations.',
    'accent': '#8b5cf6', 'accent2': '#7c3aed',
    'gradient': 'linear-gradient(135deg,#8b5cf6,#ec4899,#f43f5e)',
    'extra_css': """
.wb-container{position:relative}
.wb-canvas{background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;cursor:crosshair;display:block;width:100%;touch-action:none}
.wb-toolbar{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:0.75rem;align-items:center}
.wb-tool{width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:8px;border:1px solid var(--border);background:var(--bg-surface);cursor:pointer;font-size:1rem;transition:all 0.2s}
.wb-tool:hover,.wb-tool.active{border-color:var(--accent);background:var(--accent-glow)}
.wb-separator{width:1px;height:28px;background:var(--border);margin:0 4px}
.wb-color-picker{width:36px;height:36px;border:none;border-radius:8px;cursor:pointer;padding:0}
.wb-size-slider{width:80px;-webkit-appearance:none;height:4px;background:var(--border);border-radius:2px;cursor:pointer}
.wb-size-slider::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--accent)}
.wb-size-label{font-size:0.75rem;color:var(--text-muted);font-family:var(--mono)}
""",
    'body': """
    <section class="hero">
        <h1><span class="gradient-text">Whiteboard</span></h1>
        <p class="hero-sub">Draw, sketch, and brainstorm on an infinite canvas</p>
    </section>
    <section class="glass-card">
        <div class="wb-toolbar" id="toolbar">
            <button class="wb-tool active" data-tool="pen" title="Pen">✏️</button>
            <button class="wb-tool" data-tool="line" title="Line">📏</button>
            <button class="wb-tool" data-tool="rect" title="Rectangle">⬜</button>
            <button class="wb-tool" data-tool="circle" title="Circle">⭕</button>
            <button class="wb-tool" data-tool="text" title="Text">🔤</button>
            <button class="wb-tool" data-tool="eraser" title="Eraser">🧹</button>
            <div class="wb-separator"></div>
            <input type="color" class="wb-color-picker" id="wbColor" value="#6366f1" title="Color">
            <div class="wb-separator"></div>
            <input type="range" class="wb-size-slider" id="wbSize" min="1" max="20" value="3" title="Brush Size">
            <span class="wb-size-label" id="wbSizeLabel">3px</span>
            <div class="wb-separator"></div>
            <button class="wb-tool" id="undoBtn" title="Undo">↩️</button>
            <button class="wb-tool" id="redoBtn" title="Redo">↪️</button>
            <button class="wb-tool" id="clearBtn" title="Clear">🗑️</button>
            <button class="wb-tool" id="downloadBtn" title="Download">💾</button>
        </div>
        <div class="wb-container">
            <canvas id="wbCanvas" class="wb-canvas" width="1000" height="600"></canvas>
        </div>
    </section>""",
}

# 5. Chart Maker
PROJECTS['chart-maker'] = {
    'title': 'Chart Maker — Data Visualization Builder',
    'emoji': '📊', 'brand': 'ChartMaker',
    'desc': 'Create beautiful charts from your data. Bar, line, pie, doughnut, and radar charts with customization.',
    'accent': '#3b82f6', 'accent2': '#2563eb',
    'gradient': 'linear-gradient(135deg,#3b82f6,#6366f1,#8b5cf6)',
    'extra_css': """
.chart-layout{display:grid;grid-template-columns:350px 1fr;gap:1.5rem}
.data-input textarea{min-height:150px;font-family:var(--mono);font-size:0.8rem}
.chart-type-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:1rem}
.chart-type-btn{padding:0.5rem;background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;cursor:pointer;text-align:center;font-size:0.75rem;transition:all 0.2s}
.chart-type-btn:hover,.chart-type-btn.active{border-color:var(--accent);background:var(--accent-glow)}
.chart-type-btn .emoji{font-size:1.2rem;display:block;margin-bottom:2px}
.chart-preview{display:flex;align-items:center;justify-content:center;min-height:400px;position:relative}
.chart-preview canvas{max-width:100%;max-height:400px}
.color-presets{display:flex;gap:4px;margin-top:0.5rem;flex-wrap:wrap}
.color-preset{width:24px;height:24px;border-radius:6px;cursor:pointer;border:2px solid transparent;transition:all 0.2s}
.color-preset:hover,.color-preset.active{border-color:#fff;transform:scale(1.15)}
@media(max-width:768px){.chart-layout{grid-template-columns:1fr}}
""",
    'extra_head': '\n    <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>',
    'body': """
    <section class="hero">
        <h1><span class="gradient-text">Chart Maker</span></h1>
        <p class="hero-sub">Turn your data into beautiful, interactive charts in seconds</p>
    </section>
    <div class="chart-layout">
        <aside class="glass-card">
            <h3 style="margin-bottom:0.75rem">📋 Data Input</h3>
            <div class="chart-type-grid" id="chartTypeGrid">
                <div class="chart-type-btn active" data-type="bar"><span class="emoji">📊</span>Bar</div>
                <div class="chart-type-btn" data-type="line"><span class="emoji">📈</span>Line</div>
                <div class="chart-type-btn" data-type="pie"><span class="emoji">🥧</span>Pie</div>
                <div class="chart-type-btn" data-type="doughnut"><span class="emoji">🍩</span>Donut</div>
                <div class="chart-type-btn" data-type="radar"><span class="emoji">🕸️</span>Radar</div>
                <div class="chart-type-btn" data-type="polarArea"><span class="emoji">🎯</span>Polar</div>
            </div>
            <label class="text-muted" style="font-size:0.75rem">Chart Title</label>
            <input type="text" id="chartTitle" value="My Chart" style="margin-bottom:0.75rem">
            <label class="text-muted" style="font-size:0.75rem">Labels (comma separated)</label>
            <input type="text" id="chartLabels" value="Jan, Feb, Mar, Apr, May, Jun" style="margin-bottom:0.75rem">
            <label class="text-muted" style="font-size:0.75rem">Values (comma separated)</label>
            <input type="text" id="chartValues" value="12, 19, 3, 5, 2, 8" style="margin-bottom:0.75rem">
            <label class="text-muted" style="font-size:0.75rem">Color Palette</label>
            <div class="color-presets" id="colorPresets"></div>
            <div style="display:flex;gap:0.5rem;margin-top:1rem">
                <button class="btn btn-primary" id="generateBtn" style="flex:1">🎨 Generate</button>
                <button class="btn btn-secondary" id="downloadChartBtn">💾</button>
            </div>
        </aside>
        <section class="glass-card chart-preview">
            <canvas id="chartCanvas"></canvas>
        </section>
    </div>""",
}

# 6. CSS Battle
PROJECTS['css-battle'] = {
    'title': 'CSS Battle — Recreate Targets with CSS',
    'emoji': '🎯', 'brand': 'CSSBattle',
    'desc': 'Recreate target images using only HTML and CSS. Score based on accuracy and code length.',
    'accent': '#ec4899', 'accent2': '#db2777',
    'gradient': 'linear-gradient(135deg,#ec4899,#f43f5e,#f59e0b)',
    'extra_css': """
.battle-layout{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}
.target-frame,.output-frame{width:100%;aspect-ratio:4/3;border:2px solid var(--border);border-radius:8px;overflow:hidden;position:relative}
.target-frame{background:#fff}.output-frame{background:#fff}
.frame-label{position:absolute;top:8px;left:8px;padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:600;z-index:2}
.frame-label.target{background:var(--accent);color:#fff}
.frame-label.output{background:#10b981;color:#fff}
.code-area{margin-top:1rem}
.code-area textarea{width:100%;min-height:180px;font-family:var(--mono);font-size:0.8rem;background:#0d1117;color:#c9d1d9;border:1px solid var(--border);border-radius:8px;padding:1rem;resize:vertical;tab-size:2}
.score-bar{display:flex;justify-content:space-between;align-items:center;margin:0.75rem 0}
.score-badge{padding:4px 12px;border-radius:20px;font-size:0.8rem;font-weight:700;font-family:var(--mono)}
.score-badge.gold{background:rgba(234,179,8,0.2);color:#eab308}
.score-badge.silver{background:rgba(156,163,175,0.2);color:#9ca3af}
.score-badge.bronze{background:rgba(180,83,9,0.2);color:#b45309}
.char-count{font-size:0.75rem;color:var(--text-muted);font-family:var(--mono)}
.challenge-nav{display:flex;gap:0.5rem;justify-content:center;margin-bottom:1rem}
.challenge-dot{width:32px;height:32px;border-radius:8px;border:1px solid var(--border);background:var(--bg-surface);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;transition:all 0.2s}
.challenge-dot:hover,.challenge-dot.active{border-color:var(--accent);background:var(--accent-glow)}
.challenge-dot.solved{border-color:#10b981;color:#10b981}
output iframe{width:100%;height:100%;border:none}
@media(max-width:768px){.battle-layout{grid-template-columns:1fr}}
""",
    'body': """
    <section class="hero">
        <h1><span class="gradient-text">CSS Battle</span></h1>
        <p class="hero-sub">Recreate the target image using only HTML & CSS. Less code = higher score!</p>
    </section>
    <div class="challenge-nav" id="challengeNav"></div>
    <div class="battle-layout">
        <div>
            <h3>🎯 Target</h3>
            <div class="target-frame" id="targetFrame"><span class="frame-label target">Target</span></div>
        </div>
        <div>
            <h3>💻 Your Output</h3>
            <div class="output-frame" id="outputFrame"><span class="frame-label output">Output</span><iframe id="outputIframe"></iframe></div>
        </div>
    </div>
    <div class="score-bar">
        <span class="score-badge gold" id="scoreBadge">Score: 0%</span>
        <span class="char-count" id="charCount">0 chars</span>
    </div>
    <div class="code-area">
        <textarea id="cssEditor" spellcheck="false" placeholder="<div style='...'></div>"></textarea>
        <div style="display:flex;gap:0.5rem;margin-top:0.5rem">
            <button class="btn btn-primary" id="submitBtn">🚀 Submit</button>
            <button class="btn btn-secondary" id="resetCssBtn">🔄 Reset</button>
        </div>
    </div>""",
}

# 7. Retro Games
PROJECTS['retro-games'] = {
    'title': 'Retro Games — Snake, Tetris & 2048',
    'emoji': '🎮', 'brand': 'RetroGames',
    'desc': 'Play classic retro games: Snake, Tetris, and 2048 all in one place. Mobile-friendly with high scores.',
    'accent': '#f43f5e', 'accent2': '#e11d48',
    'gradient': 'linear-gradient(135deg,#f43f5e,#f59e0b,#10b981)',
    'extra_css': """
.game-selector{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem}
.game-card{padding:1.5rem;background:var(--bg-card);border:2px solid var(--border);border-radius:var(--radius);cursor:pointer;text-align:center;transition:all 0.3s}
.game-card:hover,.game-card.active{border-color:var(--accent);transform:translateY(-4px);box-shadow:0 8px 32px var(--accent-glow)}
.game-card .game-emoji{font-size:2.5rem;margin-bottom:0.5rem}
.game-card .game-name{font-weight:700;font-size:1.1rem}
.game-card .game-desc{font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem}
.game-area{display:flex;flex-direction:column;align-items:center}
.game-canvas{background:var(--bg-surface);border:2px solid var(--border);border-radius:8px;display:block}
.game-controls{display:flex;gap:0.5rem;margin-top:1rem;flex-wrap:wrap;justify-content:center}
.game-stats{display:flex;gap:2rem;margin:1rem 0;font-family:var(--mono)}
.game-stats span{font-size:0.85rem;color:var(--text-muted)}
.game-stats strong{color:var(--text);font-size:1.1rem}
.mobile-dpad{display:none;margin-top:1rem}
.dpad-grid{display:grid;grid-template-columns:repeat(3,48px);grid-template-rows:repeat(3,48px);gap:4px;justify-content:center}
.dpad-btn{background:var(--bg-card);border:1px solid var(--border);border-radius:8px;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.1s}
.dpad-btn:active{background:var(--accent);color:#fff}
.dpad-blank{visibility:hidden}
@media(max-width:768px){.game-selector{grid-template-columns:1fr}.mobile-dpad{display:block}}
.game-over-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.8);display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:8px;z-index:10}
.game-over-overlay h2{font-size:2rem;margin-bottom:0.5rem}.game-over-overlay p{color:var(--text-muted)}
""",
    'body': """
    <section class="hero">
        <h1><span class="gradient-text">Retro Games</span></h1>
        <p class="hero-sub">Classic games, modern design. Play Snake, Tetris, or 2048!</p>
    </section>
    <div class="game-selector" id="gameSelector">
        <div class="game-card active" data-game="snake"><div class="game-emoji">🐍</div><div class="game-name">Snake</div><div class="game-desc">Eat food, grow longer, don't crash!</div></div>
        <div class="game-card" data-game="tetris"><div class="game-emoji">🧩</div><div class="game-name">Tetris</div><div class="game-desc">Stack blocks, clear lines, survive!</div></div>
        <div class="game-card" data-game="2048"><div class="game-emoji">🔢</div><div class="game-name">2048</div><div class="game-desc">Merge tiles to reach 2048!</div></div>
    </div>
    <section class="glass-card game-area" id="gameArea">
        <div class="game-stats">
            <span>Score: <strong id="gameScore">0</strong></span>
            <span>Best: <strong id="gameBest">0</strong></span>
            <span>Level: <strong id="gameLevel">1</strong></span>
        </div>
        <div style="position:relative">
            <canvas id="gameCanvas" class="game-canvas" width="400" height="400"></canvas>
        </div>
        <div class="game-controls">
            <button class="btn btn-primary" id="startGameBtn">▶ Start</button>
            <button class="btn btn-secondary" id="pauseGameBtn">⏸ Pause</button>
        </div>
        <div class="mobile-dpad">
            <div class="dpad-grid">
                <div class="dpad-blank"></div><button class="dpad-btn" data-dir="up">⬆️</button><div class="dpad-blank"></div>
                <button class="dpad-btn" data-dir="left">⬅️</button><div class="dpad-blank"></div><button class="dpad-btn" data-dir="right">➡️</button>
                <div class="dpad-blank"></div><button class="dpad-btn" data-dir="down">⬇️</button><div class="dpad-blank"></div>
            </div>
        </div>
    </section>""",
}

# 8. Unit Converter
PROJECTS['unit-converter'] = {
    'title': 'Universal Unit Converter',
    'emoji': '📐', 'brand': 'UnitConvert',
    'desc': 'Convert between 100+ units: length, weight, temperature, time, data, speed, currency, and more.',
    'accent': '#06b6d4', 'accent2': '#0891b2',
    'gradient': 'linear-gradient(135deg,#06b6d4,#3b82f6,#6366f1)',
    'extra_css': """
.converter-layout{max-width:700px;margin:0 auto}
.category-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:1.5rem;justify-content:center}
.cat-tab{padding:0.4rem 0.8rem;border-radius:20px;background:var(--bg-surface);border:1px solid var(--border);cursor:pointer;font-size:0.8rem;font-weight:500;transition:all 0.2s}
.cat-tab:hover,.cat-tab.active{background:var(--accent-glow);border-color:var(--accent);color:var(--accent)}
.conversion-card{text-align:center;padding:2rem}
.conv-input-group{margin-bottom:1.5rem}
.conv-input{font-size:2rem;font-weight:700;font-family:var(--mono);text-align:center;background:var(--bg-surface);border:2px solid var(--border);border-radius:12px;padding:1rem;width:100%;outline:none;color:var(--text)}
.conv-input:focus{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-glow)}
.conv-select{margin-top:0.5rem;padding:0.5rem 1rem;background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:0.9rem;width:100%;max-width:300px;outline:none}
.conv-result{font-size:2.5rem;font-weight:800;font-family:var(--mono);background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin:1rem 0}
.swap-btn{width:48px;height:48px;border-radius:50%;background:var(--gradient);color:#fff;border:none;font-size:1.3rem;cursor:pointer;margin:1rem auto;display:flex;align-items:center;justify-content:center;transition:transform 0.3s}
.swap-btn:hover{transform:rotate(180deg)}
.formula-display{font-size:0.8rem;color:var(--text-muted);font-family:var(--mono);margin-top:0.5rem}
.quick-ref{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:0.75rem;margin-top:1.5rem}
.ref-card{padding:0.75rem;background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;font-size:0.8rem}
.ref-card .ref-from{color:var(--text-muted)}.ref-card .ref-to{color:var(--accent);font-weight:600;font-family:var(--mono)}
""",
    'body': """
    <section class="hero">
        <h1><span class="gradient-text">Unit Converter</span></h1>
        <p class="hero-sub">Convert anything: length, weight, temperature, data, time, and more</p>
    </section>
    <div class="converter-layout">
        <div class="category-tabs" id="categoryTabs"></div>
        <section class="glass-card conversion-card">
            <div class="conv-input-group">
                <input type="number" class="conv-input" id="fromValue" value="1" step="any">
                <select class="conv-select" id="fromUnit"></select>
            </div>
            <button class="swap-btn" id="swapUnitsBtn" title="Swap units">⇅</button>
            <div class="conv-input-group">
                <div class="conv-result" id="resultValue">-</div>
                <select class="conv-select" id="toUnit"></select>
            </div>
            <div class="formula-display" id="formulaDisplay"></div>
        </section>
        <section class="glass-card">
            <h3>📋 Quick Reference</h3>
            <div class="quick-ref" id="quickRef"></div>
        </section>
    </div>""",
}

# ════════════════════════════
# GENERATE FILES
# ════════════════════════════
for name, cfg in PROJECTS.items():
    proj_dir = ROOT / name
    proj_dir.mkdir(parents=True, exist_ok=True)
    
    # HTML
    extra_head = cfg.get('extra_head', '')
    html = make_html(cfg['title'], cfg['emoji'], cfg['brand'], cfg['desc'], cfg['body'], extra_head=extra_head)
    (proj_dir / 'index.html').write_text(html, encoding='utf-8')
    
    # CSS
    css = make_css(cfg['accent'], cfg['accent2'], cfg['gradient'])
    css += "\n" + cfg.get('extra_css', '')
    (proj_dir / 'style.css').write_text(css, encoding='utf-8')
    
    print(f"  ✓ Generated {name}/index.html + style.css")

print("\n✅ All 8 project HTML+CSS generated!")
print("Note: script.js files still need individual creation.")
