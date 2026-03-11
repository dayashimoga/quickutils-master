const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');

const html = fs.readFileSync('src/tools.html', 'utf8');
const script = fs.readFileSync('src/tools/currency-converter.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously" });
const document = dom.window.document;
const window = dom.window;

// Execute script
const scriptEl = document.createElement('script');
scriptEl.textContent = script;
document.body.appendChild(scriptEl);

// Simulate input
document.getElementById('currAmount').value = "1000";
document.getElementById('currFrom').value = "USD";
document.getElementById('currTo').value = "INR";

// Submit form
const form = document.getElementById('currencyForm');
const event = new dom.window.Event('submit', { cancelable: true });
form.dispatchEvent(event);

console.log("Result Box visible class? " + document.getElementById('currencyResult').classList.contains('visible'));
console.log("Curr Result Text: " + document.getElementById('currResult').textContent);
console.log("Curr Rate Text: " + document.getElementById('currRate').textContent);
