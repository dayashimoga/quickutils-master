(() => {
'use strict';
const $ = s => document.querySelector(s);

const inputType = $('#inputType'), outputType = $('#outputType');
const inputArea = $('#inputArea'), outputArea = $('#outputArea');
const inputStatus = $('#inputStatus'), outputStatus = $('#outputStatus');
const convertBtn = $('#convertBtn'), swapBtn = $('#swapBtn'), copyBtn = $('#copyBtn'), downloadBtn = $('#downloadBtn'), clearBtn = $('#clearBtn');
const fileInput = $('#fileInput');

function setStatus(el, msg, type = '') {
    el.textContent = msg;
    el.className = 'status-bar ' + (type ? `status-${type}` : '');
}


const treeViewArea = $('#treeViewArea');
const treeViewBtn = $('#treeViewBtn');
let isTreeView = false;

const x2js = typeof X2JS !== 'undefined' ? new X2JS() : null;

// JSON Tree Generator
function createTree(data) {
    if (typeof data !== 'object' || data === null) {
        return `<span style="color:var(--accent)">${escapeHtml(String(data))}</span>`;
    }
    const isArr = Array.isArray(data);
    let html = `<ul style="list-style:none; padding-left:20px; border-left:1px dashed var(--border); margin:0;">`;
    for (const key in data) {
        html += `<li style="margin:4px 0;">`;
        if (!isArr) html += `<strong style="color:var(--primary)">${escapeHtml(key)}:</strong> `;
        html += createTree(data[key]);
        html += `</li>`;
    }
    html += `</ul>`;
    return html;
}

function escapeHtml(s) { return s.replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function parseInput(text, type) {
    text = text.trim();
    if (!text) throw new Error('Empty input');
    if (type === 'json') return JSON.parse(text);
    if (type === 'yaml') return jsyaml.load(text);

    if (type === 'xml') {
        if (!x2js) throw new Error("x2js library failed to load");
        const obj = x2js.xml_str2json(text);
        if (!obj) throw new Error("Invalid XML");
        return obj;
    }

    if (type === 'csv') {
        const res = Papa.parse(text, { header: true, skipEmptyLines: true });
        if (res.errors.length) throw new Error(res.errors[0].message);
        return res.data;
    }
}

function formatOutput(data, type) {
    if (type === 'json') return JSON.stringify(data, null, 2);
    if (type === 'yaml') return jsyaml.dump(data, { indent: 2, lineWidth: -1 });

    if (type === 'xml') {
        if (!x2js) throw new Error("x2js library failed to load");
        // x2js expects a root valid element. Wrap if needed.
        let wrapped = data;
        if (Array.isArray(data)) { wrapped = { root: { item: data } }; }
        else if (Object.keys(data).length !== 1) { wrapped = { root: data }; }
        return x2js.json2xml_str(wrapped);
    }

    if (type === 'csv') {
        if (!Array.isArray(data)) {
            // Try to make it an array if it's an object
            if (typeof data === 'object' && data !== null) {
                const isArrOfObjs = Object.values(data).every(v => typeof v === 'object' && v !== null && !Array.isArray(v));
                if (isArrOfObjs) {
                    data = Object.keys(data).map(k => ({ id: k, ...data[k] }));
                } else {
                    data = [data]; // wrap single object
                }
            } else {
                throw new Error('Data must be an array of objects for CSV conversion');
            }
        }
        return Papa.unparse(data);
    }
}

function convert() {
    const text = inputArea.value;
    const iType = inputType.value;
    const oType = outputType.value;
    
    if (!text.trim()) {
        outputArea.value = '';
        setStatus(inputStatus, 'Ready');
        setStatus(outputStatus, 'Waiting for input');
        return;
    }
    
    try {
        const data = parseInput(text, iType);
        setStatus(inputStatus, 'Valid ' + iType.toUpperCase(), 'success');
        
        try {
            const out = formatOutput(data, oType);
            outputArea.value = out;

            if (isTreeView) {
                treeViewArea.innerHTML = createTree(data);
            }

            setStatus(outputStatus, 'Converted successfully', 'success');
        } catch (e) {
            outputArea.value = '';
            setStatus(outputStatus, 'Export Error: ' + e.message, 'error');
        }
    } catch (e) {
        outputArea.value = '';
        setStatus(inputStatus, 'Parse Error: ' + e.message, 'error');
        setStatus(outputStatus, 'Waiting for valid input...');
    }
}

// Events

treeViewBtn.addEventListener('click', () => {
    isTreeView = !isTreeView;
    if (isTreeView) {
        outputArea.style.display = 'none';
        treeViewArea.style.display = 'block';
        treeViewBtn.classList.add('btn-primary');
        treeViewBtn.classList.remove('btn-secondary');
        convert(); // re-trigger to draw tree
    } else {
        outputArea.style.display = 'block';
        treeViewArea.style.display = 'none';
        treeViewBtn.classList.add('btn-secondary');
        treeViewBtn.classList.remove('btn-primary');
    }
});

convertBtn.addEventListener('click', convert);

inputArea.addEventListener('input', () => {
    setStatus(inputStatus, 'Typing...');
    // Optional: auto-convert if small input
    if (inputArea.value.length < 5000) convert();
});

inputType.addEventListener('change', convert);
outputType.addEventListener('change', convert);

swapBtn.addEventListener('click', () => {
    if (!outputArea.value) return;
    const tempType = inputType.value;
    inputType.value = outputType.value;
    outputType.value = tempType;
    
    inputArea.value = outputArea.value;
    outputArea.value = '';
    convert();
});

clearBtn.addEventListener('click', () => {
    inputArea.value = '';
    outputArea.value = '';
    setStatus(inputStatus, 'Ready');
    setStatus(outputStatus, 'Waiting for input');
});

copyBtn.addEventListener('click', () => {
    if (!outputArea.value) return;
    navigator.clipboard.writeText(outputArea.value);
    const orig = copyBtn.textContent;
    copyBtn.textContent = '✅ Copied!';
    setTimeout(() => copyBtn.textContent = orig, 2000);
});

downloadBtn.addEventListener('click', () => {
    const text = outputArea.value;
    if (!text) return;
    const type = outputType.value;
    const extensions = { json: 'json', yaml: 'yaml', csv: 'csv', xml: 'xml' };
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_converted.${extensions[type]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'json') inputType.value = 'json';
    else if (ext === 'yaml' || ext === 'yml') inputType.value = 'yaml';
    else if (ext === 'csv') inputType.value = 'csv';
    else if (ext === 'xml') inputType.value = 'xml';
    
    const reader = new FileReader();
    reader.onload = (e) => {
        inputArea.value = e.target.result;
        convert();
        fileInput.value = ''; // reset
    };
    reader.readAsText(file);
});

$('#themeBtn').addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.dataset.theme === 'dark';
    html.dataset.theme = isDark ? 'light' : 'dark';
    $('#themeBtn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', html.dataset.theme);
});

if (localStorage.getItem('theme') === 'light') {
    document.documentElement.dataset.theme = 'light';
    $('#themeBtn').textContent = '☀️';
}
})();
