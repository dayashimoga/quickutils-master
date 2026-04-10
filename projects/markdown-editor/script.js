(() => {
'use strict';
const $ = s => document.querySelector(s);
const editor = $('#editor');
const preview = $('#preview');
let saveTimer = null;

// ── Markdown Parser (lightweight GFM) ──
function parseMd(md) {
    let html = md;
    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (m, lang, code) => `<pre><code class="lang-${lang}">${esc(code.trim())}</code></pre>`);
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // Headings
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    // Blockquote
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    // HR
    html = html.replace(/^---$/gm, '<hr>');
    // Bold & italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    // Task lists
    html = html.replace(/^- \[x\] (.+)$/gm, '<li><input type="checkbox" checked disabled> $1</li>');
    html = html.replace(/^- \[ \] (.+)$/gm, '<li><input type="checkbox" disabled> $1</li>');
    // Unordered lists
    html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    // Wrap consecutive li in ul
    html = html.replace(/((<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
    // Tables
    html = html.replace(/^\|(.+)\|\n\|[\-\| :]+\|\n((?:\|.+\|\n?)*)/gm, (m, header, body) => {
        const ths = header.split('|').filter(Boolean).map(h => `<th>${h.trim()}</th>`).join('');
        const rows = body.trim().split('\n').map(row => {
            const tds = row.split('|').filter(Boolean).map(d => `<td>${d.trim()}</td>`).join('');
            return `<tr>${tds}</tr>`;
        }).join('');
        return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
    });
    // Paragraphs
    html = html.replace(/^(?!<[a-z])((?!<).+)$/gm, '<p>$1</p>');
    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    return html;
}

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Render ──
function render() {
    preview.innerHTML = parseMd(editor.value);
    updateStats();
    updateOutline();
    autoSave();
}

function updateStats() {
    const text = editor.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    $('#wordCount').textContent = `${words} words · ${chars} chars`;
    $('#readTime').textContent = `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function updateOutline() {
    const headings = editor.value.match(/^#{1,3} .+$/gm) || [];
    $('#outlineList').innerHTML = headings.map(h => {
        const level = h.match(/^(#+)/)[1].length;
        const text = h.replace(/^#+\s*/, '');
        return `<a class="h${level}" href="#">${text}</a>`;
    }).join('');
}

editor.addEventListener('input', render);

// ── Toolbar Actions ──
$$('#toolbar button').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const s = editor.selectionStart, e = editor.selectionEnd;
        const sel = editor.value.substring(s, e);
        let insert = '';
        switch(action) {
            case 'bold': insert = `**${sel||'bold'}**`; break;
            case 'italic': insert = `*${sel||'italic'}*`; break;
            case 'strike': insert = `~~${sel||'text'}~~`; break;
            case 'h1': insert = `# ${sel||'Heading 1'}`; break;
            case 'h2': insert = `## ${sel||'Heading 2'}`; break;
            case 'h3': insert = `### ${sel||'Heading 3'}`; break;
            case 'ul': insert = `- ${sel||'Item'}`; break;
            case 'ol': insert = `1. ${sel||'Item'}`; break;
            case 'task': insert = `- [ ] ${sel||'Task'}`; break;
            case 'code': insert = `\`${sel||'code'}\``; break;
            case 'codeblock': insert = `\`\`\`\n${sel||'code'}\n\`\`\``; break;
            case 'link': insert = `[${sel||'text'}](https://)`; break;
            case 'image': insert = `![${sel||'alt'}](https://)`; break;
            case 'table': insert = `| Header 1 | Header 2 | Header 3 |\n| --- | --- | --- |\n| Cell 1 | Cell 2 | Cell 3 |`; break;
            case 'hr': insert = `\n---\n`; break;
            case 'quote': insert = `> ${sel||'Quote'}`; break;
        }
        editor.setRangeText(insert, s, e, 'end');
        render();
        editor.focus();
    });
});

// ── Keyboard Shortcuts ──
editor.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'b') { e.preventDefault(); $('[data-action="bold"]').click(); }
    if (e.ctrlKey && e.key === 'i') { e.preventDefault(); $('[data-action="italic"]').click(); }
    if (e.key === 'Tab') {
        e.preventDefault();
        const s = editor.selectionStart;
        editor.setRangeText('  ', s, s, 'end');
        render();
    }
});

// ── Templates ──
const TEMPLATES = {
    readme: `# Project Name\n\n> A brief description of your project.\n\n## Features\n\n- Feature 1\n- Feature 2\n- Feature 3\n\n## Installation\n\n\`\`\`bash\nnpm install my-project\n\`\`\`\n\n## Usage\n\n\`\`\`javascript\nimport { feature } from 'my-project';\n\`\`\`\n\n## License\n\nMIT`,
    blog: `# Blog Post Title\n\n*Published: ${new Date().toLocaleDateString()}*\n\n## Introduction\n\nWrite your introduction here.\n\n## Main Content\n\nYour main content goes here.\n\n### Subheading\n\nMore details...\n\n## Conclusion\n\nWrap up your thoughts here.\n\n---\n\n*Thanks for reading!*`,
    meeting: `# Meeting Notes — ${new Date().toLocaleDateString()}\n\n**Attendees:** Name 1, Name 2\n\n## Agenda\n\n- [ ] Topic 1\n- [ ] Topic 2\n- [ ] Topic 3\n\n## Discussion\n\n### Topic 1\n\nNotes here...\n\n## Action Items\n\n- [ ] Action 1 — Owner: Name\n- [ ] Action 2 — Owner: Name\n\n## Next Meeting\n\nDate: TBD`,
    resume: `# Your Name\n\n**Email:** you@email.com | **Phone:** (555) 123-4567 | **LinkedIn:** linkedin.com/in/you\n\n---\n\n## Summary\n\nExperienced professional with expertise in...\n\n## Experience\n\n### Job Title — Company Name\n*Jan 2023 – Present*\n\n- Accomplishment 1\n- Accomplishment 2\n\n### Previous Title — Company\n*Jun 2020 – Dec 2022*\n\n- Accomplishment 1\n\n## Education\n\n### Degree — University\n*2016 – 2020*\n\n## Skills\n\n| Category | Skills |\n| --- | --- |\n| Languages | JavaScript, Python, Go |\n| Frameworks | React, Node.js, Django |`
};

$('#templateSelect').addEventListener('change', e => {
    if (e.target.value && TEMPLATES[e.target.value]) {
        if (editor.value && !confirm('Replace current content?')) return;
        editor.value = TEMPLATES[e.target.value];
        render();
    }
    e.target.value = '';
});

// ── Export ──
$('#exportHtmlBtn').addEventListener('click', () => {
    const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Document</title><style>body{font-family:sans-serif;max-width:700px;margin:2rem auto;padding:0 1rem;line-height:1.7}code{background:#f0f0f0;padding:2px 6px;border-radius:4px}pre{background:#f0f0f0;padding:1rem;border-radius:8px;overflow-x:auto}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:.5rem}blockquote{border-left:4px solid #6366f1;padding:.5rem 1rem;color:#666;background:#f8f8ff}</style></head><body>${preview.innerHTML}</body></html>`], {type:'text/html'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'document.html'; a.click();
});

$('#exportMdBtn').addEventListener('click', () => {
    const blob = new Blob([editor.value], {type:'text/markdown'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'document.md'; a.click();
});

$('#printBtn').addEventListener('click', () => window.print());

// ── Auto-save ──
function autoSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        localStorage.setItem('qu_md_draft', editor.value);
        $('#autoSaveStatus').textContent = '💾 Saved ' + new Date().toLocaleTimeString();
    }, 1000);
}

// ── Outline Toggle ──
$('#outlineToggle').addEventListener('click', () => $('#outlinePanel').classList.toggle('hidden'));

// ── Theme ──
$('#themeBtn').addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.dataset.theme === 'dark';
    html.dataset.theme = isDark ? 'light' : 'dark';
    $('#themeBtn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', html.dataset.theme);
});
if (localStorage.getItem('theme') === 'light') { document.documentElement.dataset.theme = 'light'; $('#themeBtn').textContent = '☀️'; }

// ── Init ──
const saved = localStorage.getItem('qu_md_draft');
if (saved) editor.value = saved;
else editor.value = `# Welcome to Markdown Editor\n\nStart writing **Markdown** and see the *live preview* on the right!\n\n## Features\n\n- **Bold**, *italic*, ~~strikethrough~~\n- [Links](https://quickutils.top)\n- Code: \`const x = 42;\`\n- Task lists:\n  - [x] Write markdown\n  - [ ] Export to HTML\n\n\`\`\`javascript\nfunction hello() {\n  console.log("Hello, World!");\n}\n\`\`\`\n\n> Blockquotes are supported too!\n\n| Feature | Status |\n| --- | --- |\n| Live Preview | ✅ |\n| Templates | ✅ |\n| Export | ✅ |`;
render();
})();
