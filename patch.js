const fs = require('fs');

let code = fs.readFileSync('projects/web-chess/script.js', 'utf8');

// 1. Inject coach UI display logic in finishBatchAnalysis
const r1 = `        let flag = null;
        let colorBox = '';
        if (errorDrop > 250) { flag = 'Blunder'; blunders++; colorBox = 'rgba(239,68,68,0.2)'; }
        else if (errorDrop > 120) { flag = 'Mistake'; mistakes++; colorBox = 'rgba(249,115,22,0.2)'; }
        else if (errorDrop > 70) { flag = 'Inaccuracy'; inaccuracies++; colorBox = 'rgba(234,179,8,0.2)'; }
        
        if (flag) {
            const moveNumStr = Math.ceil(i / 2) + (colorMoved === 'w' ? '.' : '...');
            const bestMv = prev.bestMoveEngine || '?';
            
            // COACH: Inject into reviewMistakesList
            if (flag === 'Blunder' || flag === 'Mistake') {
                if(!window.reviewMistakesList) window.reviewMistakesList = [];
                window.reviewMistakesList.push({
                    histIdx: i - 1,
                    bestMoveUci: bestMv,
                    flag: flag,
                    badMoveSan: moveData.san,
                    fenBefore: prev.fen
                });
            }
`;

code = code.replace(/        let flag = null;[\s\S]*?const bestMv = prev\.bestMoveEngine \|\| '\?';/, r1);

// 2. Inject btnStartCoach toggle
const r2 = `    document.getElementById('ar-inaccuracies').textContent = inaccuracies;
    
    const btnCoach = document.getElementById('btnStartCoach');
    if (window.reviewMistakesList && window.reviewMistakesList.length > 0) {
        if(btnCoach) btnCoach.style.display = 'block';
    } else {
        if(btnCoach) btnCoach.style.display = 'none';
        reportHtml = '<div class="text-center text-neon-green" style="padding:1rem;">Perfect game! No significant mistakes detected.</div>';
    }
`;
code = code.replace(/    document\.getElementById\('ar-inaccuracies'\)\.textContent = inaccuracies;[ \t\r\n]*if \(reportHtml === ''\) \{[ \t\r\n]*reportHtml = '[^']+';[ \t\r\n]*\}/, r2);


// 3. Append the Coach Mode Engine
const coachEngine = `
// ═══════════════════════════════════════════════════
// NEW INTERACTIVE COACH ENGINE
// ═══════════════════════════════════════════════════
window.currentReviewIdx = -1;

window.startInteractiveCoach = function() {
    if (!window.reviewMistakesList || window.reviewMistakesList.length === 0) return;
    
    // Switch to Play Tab so board is big
    document.querySelector('.tab-btn[data-tab="play"]').click();
    
    window.currentReviewIdx = 0;
    
    // Hide controls, show HUD
    document.getElementById('controlsBox').style.display = 'none';
    document.getElementById('interactiveCoachHud').classList.remove('hidden');
    
    loadReviewMistake();
};

window.coachExitReview = function() {
    document.getElementById('controlsBox').style.display = 'block';
    document.getElementById('interactiveCoachHud').classList.add('hidden');
    
    // Go back to end of game
    jumpToMove(moveHistory.length - 1);
    clearTheoryHighlights();
};

window.coachSkipMistake = function() {
    window.currentReviewIdx++;
    if (window.currentReviewIdx >= window.reviewMistakesList.length) {
        alert("You have reviewed all your mistakes! Good job!");
        coachExitReview();
        return;
    }
    loadReviewMistake();
};

window.coachShowHint = function() {
    const mistake = window.reviewMistakesList[window.currentReviewIdx];
    if (mistake.bestMoveUci && mistake.bestMoveUci !== '?') {
        const fm = mistake.bestMoveUci.substring(0, 2);
        const tm = mistake.bestMoveUci.substring(2, 4);
        drawArrowRaw(fm, tm, 'rgba(34,197,94,0.85)', 'arrowhead-green');
    }
};

window.loadReviewMistake = function() {
    const mistake = window.reviewMistakesList[window.currentReviewIdx];
    
    // Sync the internal chess engine to the history index BEFORE the bad move
    jumpToMove(mistake.histIdx - 1);
    
    // Ensure it's human turn on the board for the human player's color at that move
    // actually user can just drag a piece in jumpToMove state.
    // wait, we need to bypass normal 'play' logic
    window.isReviewMode = true;
    
    const uiText = document.getElementById('coachHudText');
    uiText.innerHTML = \`Move \${Math.ceil(mistake.histIdx/2)}: You played <strong style="color:#ef4444">\${mistake.badMoveSan}</strong> (\${mistake.flag}). Can you find the engine's suggested move?\`;
    clearTheoryHighlights();
};

// We must dynamically override the board onDrop handling within the game
`;

fs.writeFileSync('projects/web-chess/script.js', code + coachEngine);
console.log('Patched script.js');
