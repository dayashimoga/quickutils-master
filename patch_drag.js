const fs = require('fs');
let code = fs.readFileSync('projects/web-chess/script.js', 'utf8');

const target = `                if (mode === 'academy' && activeLesson && activeLesson.expected) {`;
const injection = `                if (window.isReviewMode) {
                    const testMove = chess.move({ from: targetMove.from, to: targetMove.to });
                    if (testMove) {
                        const expectedUci = window.reviewMistakesList[window.currentReviewIdx].bestMoveUci;
                        const userUci = testMove.from + testMove.to + (testMove.promotion || '');
                        if (userUci === expectedUci) {
                            document.getElementById('snd-success')?.play().catch(()=>{});
                            const uT = document.getElementById('coachHudText');
                            uT.innerHTML = '<strong style="color:#22c55e">Excellent!</strong> You found the best move.';
                            if (window.reviewMistakesList[window.currentReviewIdx].bestMoveUci.length >= 4) {
                                const fm = expectedUci.substring(0, 2);
                                const tm = expectedUci.substring(2, 4);
                                drawArrowRaw(fm, tm, 'rgba(34,197,94,0.85)', 'arrowhead-green');
                            }
                            setTimeout(() => {
                                chess.undo();
                                window.coachSkipMistake();
                            }, 1500);
                        } else {
                            chess.undo();
                            document.getElementById('snd-error')?.play().catch(()=>{});
                            const pEl = document.querySelector(\`#sq-\${targetMove.from} .piece\`);
                            if(pEl) {
                                pEl.classList.remove('shake-error');
                                void pEl.offsetWidth; // Trigger reflow
                                pEl.classList.add('shake-error');
                            }
                        }
                    }
                } else if (mode === 'academy' && activeLesson && activeLesson.expected) {`;

code = code.replace(target, injection);
fs.writeFileSync('projects/web-chess/script.js', code);
console.log("Patched drag event!");
