const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('projects/speed-test/index.html', 'utf8');
const scriptCode = fs.readFileSync('projects/speed-test/script.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously" });
const window = dom.window;
global.document = window.document;
global.window = window;
global.navigator = window.navigator;
global.performance = { now: () => Date.now() };

window.HTMLCanvasElement.prototype.getContext = function () {
    return {
        clearRect: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {}, createLinearGradient: () => ({ addColorStop: () => {} }), fill: () => {},
        closePath: () => {}
    };
};

global.fetch = async (url) => {
    return { ok: true, text: async () => "", json: async () => ({}), body: { getReader: () => ({ read: async () => ({ done: true }) }) } };
};

try {
    const el = window.document.createElement('script');
    el.textContent = scriptCode;
    window.document.body.appendChild(el);
    setTimeout(() => {
        const btn = window.document.getElementById('startTest');
        if (!btn) { console.error("No button found!"); process.exit(1); }
        console.log("Found button. Clicking...");
        btn.click();
        console.log("Click dispatched. Button text is now: ", btn.textContent);
    }, 500);
} catch (e) {
    if (e.stack) console.error("Caught error:", e.stack);
    else console.error(e);
}
