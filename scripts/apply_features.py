import os
import json
import shutil
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).parent.parent if 'scripts' in Path(__file__).resolve().parts else Path.cwd()
PROJECTS_DIR = ROOT_DIR / "projects"
CONFIG_FILE = ROOT_DIR / "project_config.json"

# ---------------------------------------------------------
# 1. DELETE DNA-LAB & CLEANUP
# ---------------------------------------------------------
dna_lab = PROJECTS_DIR / "dna-lab"
if dna_lab.exists():
    shutil.rmtree(dna_lab)

if CONFIG_FILE.exists():
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        config = json.load(f)
    if "network_links" in config:
        config["network_links"] = [link for link in config["network_links"] if link["id"] != "dna-lab"]
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=4)

# ---------------------------------------------------------
# 2. WEB CHESS FIXES
# ---------------------------------------------------------
chess_js = PROJECTS_DIR / "web-chess" / "script.js"
if chess_js.exists():
    with open(chess_js, 'r', encoding='utf-8') as f:
        content = f.read()

    # Apply smooth animation rendering logic
    render_old = """function renderPosition() {
    // Clear all dynamic state from squares
    document.querySelectorAll('.piece').forEach(p => p.remove());
    document.querySelectorAll('.square').forEach(sq => {
        sq.classList.remove('highlight', 'in-check', 'selected', 'can-capture');
        const dot = sq.querySelector('.move-dot');
        if (dot) dot.classList.add('hidden');
    });"""

    render_new = """function renderPosition() {
    // Instead of deleting all pieces, we mark them for diffing to allow CSS transitions
    const existingPieces = Array.from(document.querySelectorAll('.piece'));
    existingPieces.forEach(p => p.dataset.stale = 'true');

    document.querySelectorAll('.square').forEach(sq => {
        sq.classList.remove('highlight', 'in-check', 'selected', 'can-capture');
        const dot = sq.querySelector('.move-dot');
        if (dot) dot.classList.add('hidden');
    });"""
    content = content.replace(render_old, render_new)

    piece_append_old = """                const sqEl = document.getElementById('sq-' + sq);
                if (sqEl) {
                    const pieceEl = document.createElement('div');
                    pieceEl.className = 'piece';
                    pieceEl.style.backgroundImage = `url(${PIECE_URLS[p.color + p.type]})`;
                    sqEl.appendChild(pieceEl);
                }"""

    piece_append_new = """                const sqEl = document.getElementById('sq-' + sq);
                if (sqEl) {
                    const pieceId = `${p.color}${p.type}`;
                    // Find a stale piece of same type to move
                    let pieceEl = existingPieces.find(el => el.dataset.stale === 'true' && el.dataset.pieceType === pieceId);
                    if (pieceEl) {
                        pieceEl.dataset.stale = 'false';
                        if (pieceEl.parentElement !== sqEl) {
                            sqEl.appendChild(pieceEl); // Move it
                        }
                    } else {
                        // Create new
                        pieceEl = document.createElement('div');
                        pieceEl.className = 'piece animate-in-piece';
                        pieceEl.dataset.pieceType = pieceId;
                        pieceEl.style.backgroundImage = `url(${PIECE_URLS[pieceId]})`;
                        sqEl.appendChild(pieceEl);
                        // Force reflow for transition
                        void pieceEl.offsetWidth;
                    }
                }"""
    content = content.replace(piece_append_old, piece_append_new)

    # Remove unmapped pieces
    content = content.replace("updateCapturedPieces();", "document.querySelectorAll('[data-stale=\"true\"]').forEach(p => p.remove());\n    updateCapturedPieces();")

    # Update difficulty names
    content = content.replace(">Level 1 (Easy)<", ">Beginner<")
    content = content.replace(">Level 2 (Medium)<", ">Amateur<")
    content = content.replace(">Level 3 (Hard)<", ">Club Player<")
    content = content.replace(">Level 4 (Harder)<", ">Master<")
    content = content.replace(">Level 5 (Grandmaster)<", ">Grandmaster Level<")

    # Fix engine delay so it doesn't move instantly
    content = content.replace("setTimeout(() => { executeEngineMove(match[1]); }, 600);", "setTimeout(() => { executeEngineMove(match[1]); }, 1200);")
    
    with open(chess_js, 'w', encoding='utf-8') as f:
        f.write(content)

chess_css = PROJECTS_DIR / "web-chess" / "style.css"
if chess_css.exists():
    with open(chess_css, 'a', encoding='utf-8') as f:
        f.write("""
/* Patched CSS */
.board-wrapper { min-width: 320px; min-height: 320px; flex-shrink: 0; }
.piece { transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
.animate-in-piece { animation: piece-drop 0.3s ease-out forwards; }
""")

# ---------------------------------------------------------
# 3. PERIODIC TABLE FIX
# ---------------------------------------------------------
pt_js = PROJECTS_DIR / "periodic-table" / "script.js"
if pt_js.exists():
    with open(pt_js, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "updateTempLogic" not in content:
        injection = """
    // -- ENHANCED TEMPERATURE LOGIC --
    const tempInput = document.getElementById('tempInput');
    const tempVal = document.getElementById('tempVal');
    
    // Fallback pseudo-melting/boiling thresholds if missing
    function getStateAtTemp(el, currentTemp) {
        // Mock calculations based on group/type to simulate state changes visually
        let melt = 1000, boil = 3000;
        if (el.c === 'noble_gas') { melt = 10; boil = 100; }
        else if (el.c === 'nonmetal' || el.c === 'halogen') { melt = 200; boil = 350; }
        else if (el.group === 1) { melt = 350; boil = 1000; }
        else if (el.group === 2) { melt = 900; boil = 1800; }
        
        if (currentTemp < melt) return 'solid';
        if (currentTemp < boil) return 'liquid';
        return 'gas';
    }

    if (tempInput) {
        tempInput.addEventListener('input', (e) => {
            const temp = parseInt(e.target.value);
            tempVal.textContent = temp + ' K';
            
            document.querySelectorAll('.element-card').forEach(card => {
                const num = parseInt(card.dataset.n);
                const elData = elements.find(x => x.n === num);
                if (elData) {
                    const state = getStateAtTemp(elData, temp);
                    if (state === 'liquid') {
                        card.style.opacity = '0.8';
                        card.style.boxShadow = '0 0 10px rgba(0, 150, 255, 0.5)';
                        card.style.transform = 'scale(0.98)';
                    } else if (state === 'gas') {
                        card.style.opacity = '0.3';
                        card.style.boxShadow = 'none';
                        card.style.transform = 'scale(0.95)';
                    } else {
                        card.style.opacity = '1';
                        card.style.boxShadow = 'var(--shadow-sm)';
                        card.style.transform = 'scale(1)';
                    }
                }
            });
        });
    }
"""
        content += injection
        with open(pt_js, 'w', encoding='utf-8') as f:
            f.write(content)

# ---------------------------------------------------------
# 4. UNIVERSAL PREMIUM VISUALS & LOGIC FOR SPECIFIED APPS
# ---------------------------------------------------------
targets = [
    "city-pathfinding", "procedural-planet", "logic-simulator", 
    "earthquake-explorer", "space-mission-control", "quantum-sandbox", 
    "cyber-defense", "solar-system"
]

premium_script = """
(() => {
    // Premium Visual Aesthetics Injection
    document.addEventListener('DOMContentLoaded', () => {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '-1';
        overlay.style.background = 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 80%)';
        
        // Animated particles
        for(let i=0; i<15; i++) {
            const p = document.createElement('div');
            p.style.position = 'absolute';
            p.style.width = Math.random() * 4 + 'px';
            p.style.height = p.style.width;
            p.style.background = 'rgba(139, 92, 246, 0.4)';
            p.style.borderRadius = '50%';
            p.style.left = Math.random() * 100 + 'vw';
            p.style.top = Math.random() * 100 + 'vh';
            p.style.boxShadow = '0 0 10px rgba(139, 92, 246, 0.8)';
            p.style.animation = `float ${Math.random()*10 + 10}s linear infinite`;
            overlay.appendChild(p);
        }
        document.body.appendChild(overlay);

        const style = document.createElement('style');
        style.innerHTML = `
        @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); opacity:0; }
            50% { opacity:1; }
            100% { transform: translateY(-100vh) rotate(360deg); opacity:0; }
        }
        .premium-glow {
            box-shadow: 0 0 25px rgba(99, 102, 241, 0.2) !important;
            transition: box-shadow 0.3s ease !important;
        }
        .premium-glow:hover {
            box-shadow: 0 0 40px rgba(99, 102, 241, 0.5) !important;
        }
        `;
        document.head.appendChild(style);

        // Enhance elements
        document.querySelectorAll('.glass-card').forEach(c => c.classList.add('premium-glow'));
        document.querySelectorAll('button:not(.btn-icon)').forEach(b => {
            b.style.fontWeight = 'bold';
            b.style.letterSpacing = '0.5px';
            b.style.transition = 'all 0.3s ease';
        });
    });
})();
"""

for t in targets:
    t_path = PROJECTS_DIR / t / "index.html"
    if t_path.exists():
        with open(t_path, 'r', encoding='utf-8') as f:
            html = f.read()
        if "premium_injection.js" not in html:
            with open(PROJECTS_DIR / t / "premium_injection.js", 'w', encoding='utf-8') as f:
                f.write(premium_script)
            html = html.replace('</body>', '    <script src="premium_injection.js"></script>\n</body>')
            with open(t_path, 'w', encoding='utf-8') as f:
                f.write(html)

print("Applied changes successfully")
