(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
let parsed = null;

// ── Tab Switching ──
$$('.tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.tab').forEach(t => t.classList.remove('active'));
    $$('.panel').forEach(p => p.classList.add('hidden'));
    tab.classList.add('active');
    $(`#panel-${tab.dataset.tab}`).classList.remove('hidden');
}));

// ── Tree Renderer ──
function renderTree(data, container, path = '$') {
    container.innerHTML = '';
    container.appendChild(buildTreeNode(data, '', path, 0));
}

function buildTreeNode(val, key, path, depth) {
    const el = document.createElement('div');
    if (depth > 0) el.classList.add('tree-node');
    if (val === null) {
        el.innerHTML = `${key ? `<span class="tree-key">${esc(key)}</span>: ` : ''}<span class="tree-null">null</span>`;
    } else if (typeof val === 'string') {
        el.innerHTML = `${key ? `<span class="tree-key">${esc(key)}</span>: ` : ''}<span class="tree-str">"${esc(val)}"</span>`;
    } else if (typeof val === 'number') {
        el.innerHTML = `${key ? `<span class="tree-key">${esc(key)}</span>: ` : ''}<span class="tree-num">${val}</span>`;
    } else if (typeof val === 'boolean') {
        el.innerHTML = `${key ? `<span class="tree-key">${esc(key)}</span>: ` : ''}<span class="tree-bool">${val}</span>`;
    } else if (Array.isArray(val)) {
        const toggle = document.createElement('span');
        toggle.className = 'tree-toggle';
        toggle.textContent = '▼';
        const header = document.createElement('div');
        header.appendChild(toggle);
        if (key) { const k = document.createElement('span'); k.className = 'tree-key'; k.textContent = key; header.appendChild(k); header.appendChild(document.createTextNode(': ')); }
        header.appendChild(Object.assign(document.createElement('span'), { className: 'tree-bracket', textContent: `Array[${val.length}]` }));
        el.appendChild(header);
        const children = document.createElement('div');
        children.className = 'tree-children';
        val.forEach((item, i) => children.appendChild(buildTreeNode(item, String(i), `${path}[${i}]`, depth + 1)));
        el.appendChild(children);
        toggle.addEventListener('click', () => { el.classList.toggle('collapsed'); toggle.textContent = el.classList.contains('collapsed') ? '▶' : '▼'; });
    } else if (typeof val === 'object') {
        const keys = Object.keys(val);
        const toggle = document.createElement('span');
        toggle.className = 'tree-toggle';
        toggle.textContent = '▼';
        const header = document.createElement('div');
        header.appendChild(toggle);
        if (key) { const k = document.createElement('span'); k.className = 'tree-key'; k.textContent = key; header.appendChild(k); header.appendChild(document.createTextNode(': ')); }
        header.appendChild(Object.assign(document.createElement('span'), { className: 'tree-bracket', textContent: `{${keys.length}}` }));
        el.appendChild(header);
        const children = document.createElement('div');
        children.className = 'tree-children';
        keys.forEach(k => children.appendChild(buildTreeNode(val[k], k, `${path}.${k}`, depth + 1)));
        el.appendChild(children);
        toggle.addEventListener('click', () => { el.classList.toggle('collapsed'); toggle.textContent = el.classList.contains('collapsed') ? '▶' : '▼'; });
    }
    return el;
}

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

// ── Parse & Render ──
$('#jsonInput').addEventListener('input', () => {
    try {
        parsed = JSON.parse($('#jsonInput').value);
        renderTree(parsed, $('#treeView'));
        updateStats(parsed);
    } catch (e) {
        $('#treeView').innerHTML = `<span style="color:var(--danger)">❌ ${e.message}</span>`;
        $('#jsonStats').textContent = `Error: ${e.message}`;
    }
});

function updateStats(data) {
    const str = JSON.stringify(data);
    const keys = countKeys(data);
    const depth = maxDepth(data);
    $('#jsonStats').textContent = `${str.length} bytes · ${keys} keys · depth ${depth} · ${typeof data === 'object' ? (Array.isArray(data) ? `Array[${data.length}]` : `Object{${Object.keys(data).length}}`) : typeof data}`;
}

function countKeys(obj) {
    if (typeof obj !== 'object' || obj === null) return 0;
    let count = 0;
    for (const k in obj) { count++; count += countKeys(obj[k]); }
    return count;
}

function maxDepth(obj, d = 0) {
    if (typeof obj !== 'object' || obj === null) return d;
    let max = d;
    for (const k in obj) { max = Math.max(max, maxDepth(obj[k], d + 1)); }
    return max;
}

// ── Collapse/Expand ──
$('#collapseAllBtn').addEventListener('click', () => { $$('#treeView .tree-toggle').forEach(t => { t.textContent = '▶'; t.parentElement.parentElement.classList.add('collapsed'); }); });
$('#expandAllBtn').addEventListener('click', () => { $$('#treeView .tree-toggle').forEach(t => { t.textContent = '▼'; t.parentElement.parentElement.classList.remove('collapsed'); }); });

// ── JSONPath Query (simplified) ──
$('#queryInput').addEventListener('input', () => {
    if (!parsed) return;
    const q = $('#queryInput').value.trim();
    try {
        const result = queryJsonPath(parsed, q);
        $('#queryResult').textContent = JSON.stringify(result, null, 2);
    } catch (e) { $('#queryResult').textContent = `Error: ${e.message}`; }
});

function queryJsonPath(data, path) {
    if (!path || path === '$') return data;
    const parts = path.replace(/^\$\.?/, '').split(/\.|\[|\]/).filter(Boolean);
    let current = data;
    for (const p of parts) {
        if (p === '*') {
            if (Array.isArray(current)) return current;
            if (typeof current === 'object') return Object.values(current);
        }
        if (Array.isArray(current)) current = current[parseInt(p)];
        else if (typeof current === 'object' && current !== null) current = current[p];
        else return undefined;
    }
    return current;
}

// ── Diff ──
$('#diffBtn').addEventListener('click', () => {
    try {
        const a = JSON.parse($('#diffA').value);
        const b = JSON.parse($('#diffB').value);
        const diffs = jsonDiff(a, b, '$');
        if (diffs.length === 0) {
            $('#diffResult').innerHTML = '<span style="color:var(--success)">✅ Identical</span>';
        } else {
            $('#diffResult').innerHTML = diffs.map(d => {
                if (d.type === 'added') return `<div class="diff-line diff-add">+ ${d.path}: ${JSON.stringify(d.val)}</div>`;
                if (d.type === 'removed') return `<div class="diff-line diff-del">- ${d.path}: ${JSON.stringify(d.val)}</div>`;
                return `<div class="diff-line diff-del">- ${d.path}: ${JSON.stringify(d.oldVal)}</div><div class="diff-line diff-add">+ ${d.path}: ${JSON.stringify(d.newVal)}</div>`;
            }).join('');
        }
    } catch (e) { $('#diffResult').innerHTML = `<span style="color:var(--danger)">❌ ${e.message}</span>`; }
});

function jsonDiff(a, b, path) {
    const diffs = [];
    if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
        diffs.push({ type: 'changed', path, oldVal: a, newVal: b }); return diffs;
    }
    if (typeof a !== 'object' || a === null) {
        if (a !== b) diffs.push({ type: 'changed', path, oldVal: a, newVal: b });
        return diffs;
    }
    const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of allKeys) {
        const p = Array.isArray(a) ? `${path}[${k}]` : `${path}.${k}`;
        if (!(k in a)) diffs.push({ type: 'added', path: p, val: b[k] });
        else if (!(k in b)) diffs.push({ type: 'removed', path: p, val: a[k] });
        else diffs.push(...jsonDiff(a[k], b[k], p));
    }
    return diffs;
}

// ── Format ──
$('#beautifyBtn').addEventListener('click', () => { try { $('#formatOutput').value = JSON.stringify(JSON.parse($('#jsonInput').value), null, 2); } catch(e) { $('#formatOutput').value = 'Error: ' + e.message; } });
$('#minifyBtn').addEventListener('click', () => { try { $('#formatOutput').value = JSON.stringify(JSON.parse($('#jsonInput').value)); } catch(e) { $('#formatOutput').value = 'Error: ' + e.message; } });
$('#sortKeysBtn').addEventListener('click', () => { try { const d = JSON.parse($('#jsonInput').value); $('#formatOutput').value = JSON.stringify(sortKeys(d), null, 2); } catch(e) { $('#formatOutput').value = 'Error: ' + e.message; } });
$('#copyFmtBtn').addEventListener('click', () => { $('#formatOutput').select(); document.execCommand('copy'); });

function sortKeys(obj) {
    if (Array.isArray(obj)) return obj.map(sortKeys);
    if (typeof obj === 'object' && obj !== null) {
        return Object.keys(obj).sort().reduce((acc, k) => { acc[k] = sortKeys(obj[k]); return acc; }, {});
    }
    return obj;
}

// ── TypeScript Generator ──
$('#genTypesBtn').addEventListener('click', () => {
    if (!parsed) return;
    try { $('#typesOutput').value = generateTS(parsed, 'Root'); } catch(e) { $('#typesOutput').value = 'Error: ' + e.message; }
});

function generateTS(data, name) {
    let output = '';
    if (Array.isArray(data)) {
        if (data.length > 0 && typeof data[0] === 'object') {
            output += generateTS(data[0], name + 'Item');
            output += `\ntype ${name} = ${name}Item[];\n`;
        } else {
            const t = data.length > 0 ? tsType(data[0]) : 'any';
            output += `type ${name} = ${t}[];\n`;
        }
    } else if (typeof data === 'object' && data !== null) {
        output += `interface ${name} {\n`;
        for (const [k, v] of Object.entries(data)) {
            if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
                const subName = capitalize(k);
                output = generateTS(v, subName) + '\n' + output;
                output += `  ${k}: ${subName};\n`;
            } else if (Array.isArray(v)) {
                if (v.length > 0 && typeof v[0] === 'object') {
                    const subName = capitalize(k) + 'Item';
                    output = generateTS(v[0], subName) + '\n' + output;
                    output += `  ${k}: ${subName}[];\n`;
                } else { output += `  ${k}: ${v.length > 0 ? tsType(v[0]) : 'any'}[];\n`; }
            } else { output += `  ${k}: ${tsType(v)};\n`; }
        }
        output += `}\n`;
    }
    return output;
}

function tsType(v) { if (v === null) return 'null'; const t = typeof v; if (t === 'string') return 'string'; if (t === 'number') return 'number'; if (t === 'boolean') return 'boolean'; return 'any'; }
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── Buttons ──
$('#pasteBtn').addEventListener('click', async () => { try { const t = await navigator.clipboard.readText(); $('#jsonInput').value = t; $('#jsonInput').dispatchEvent(new Event('input')); } catch {} });
$('#sampleBtn').addEventListener('click', () => {
    $('#jsonInput').value = JSON.stringify({"store":{"book":[{"category":"fiction","author":"J.K. Rowling","title":"Harry Potter","price":29.99,"isbn":"978-0439708180"},{"category":"science","author":"Stephen Hawking","title":"A Brief History of Time","price":18.95,"isbn":"978-0553380163"}],"bicycle":{"color":"red","price":19.95}},"metadata":{"version":"1.0","generated":true,"tags":["books","store","api"]}}, null, 2);
    $('#jsonInput').dispatchEvent(new Event('input'));
});
$('#clearBtn').addEventListener('click', () => { $('#jsonInput').value = ''; parsed = null; $('#treeView').innerHTML = ''; $('#jsonStats').textContent = 'Paste JSON to get started'; });

// Theme
$('#themeBtn').addEventListener('click', () => { const h = document.documentElement; const d = h.dataset.theme==='dark'; h.dataset.theme=d?'light':'dark'; $('#themeBtn').textContent=d?'☀️':'🌙'; localStorage.setItem('theme',h.dataset.theme); });
if (localStorage.getItem('theme')==='light'){document.documentElement.dataset.theme='light';$('#themeBtn').textContent='☀️';}
})();
