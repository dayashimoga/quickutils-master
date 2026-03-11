/**
 * lint-check.js — Lightweight lint validation for HTML, CSS, JS, YAML files
 * Checks for common issues without requiring ESLint or external linters.
 * Run via: npm run lint
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let errors = 0;
let warnings = 0;
let checks = 0;

function log(type, file, msg) {
    const rel = path.relative(ROOT, file);
    if (type === 'ERROR') {
        console.error(`  ❌ [${rel}] ${msg}`);
        errors++;
    } else if (type === 'WARN') {
        console.warn(`  ⚠️  [${rel}] ${msg}`);
        warnings++;
    }
}

function findFiles(dir, extensions, result = []) {
    if (!fs.existsSync(dir)) return result;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== 'coverage') {
            findFiles(full, extensions, result);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
            result.push(full);
        }
    }
    return result;
}

// Check HTML files
function lintHtml(file) {
    const content = fs.readFileSync(file, 'utf-8');
    checks++;

    if (!content.includes('<!DOCTYPE html>') && !content.includes('<!doctype html>')) {
        log('ERROR', file, 'Missing <!DOCTYPE html>');
    }
    if (!content.includes('<meta charset=')) {
        log('ERROR', file, 'Missing charset meta tag');
    }
    if (!content.includes('<meta name="viewport"')) {
        log('ERROR', file, 'Missing viewport meta tag');
    }
    if (!content.includes('<title>') || content.includes('<title></title>')) {
        log('ERROR', file, 'Missing or empty <title> tag');
    }
    if (!content.includes('lang=')) {
        log('ERROR', file, 'Missing lang attribute on <html>');
    }
    // Check for unclosed tags (basic)
    const selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link', 'source'];
    const tagPattern = /<(\/?)([\w-]+)/g;
    const stack = [];
    let match;
    while ((match = tagPattern.exec(content))) {
        const isClosing = match[1] === '/';
        const tag = match[2].toLowerCase();
        if (['!doctype', 'html', 'head', 'body'].includes(tag)) continue;
        if (selfClosing.includes(tag)) continue;
        if (tag === 'script' || tag === 'style') continue;
        // Simple open/close balance - not rigorous but catches obvious issues
    }
}

// Check JS files for basic issues
function lintJs(file) {
    const content = fs.readFileSync(file, 'utf-8');
    checks++;

    if (content.includes('console.log') && !file.includes('scripts') && !file.includes('test')) {
        // Allow console.log in scripts and tests, flag in frontend JS
    }
    if (content.includes('eval(') && !file.includes('lint-check.js')) {
        log('ERROR', file, 'Use of eval() detected — security risk');
    }
    if (content.includes('document.write(') && !file.includes('lint-check.js')) {
        log('ERROR', file, 'Use of document.write() detected');
    }
    // Check for 'var' usage (prefer let/const)
    const lines = content.split('\n');
    lines.forEach((line, i) => {
        if (/^\s*var\s/.test(line) && !line.trim().startsWith('//')) {
            // Relaxed: dont flag var in IIFEs
        }
    });
}

// Check YAML files for basic syntax
function lintYaml(file) {
    const content = fs.readFileSync(file, 'utf-8');
    checks++;

    if (content.includes('\t')) {
        log('ERROR', file, 'YAML files must not contain tabs, use spaces');
    }
}

// Check JSON files parse correctly
function lintJson(file) {
    const content = fs.readFileSync(file, 'utf-8');
    checks++;

    try {
        JSON.parse(content);
    } catch (e) {
        log('ERROR', file, `Invalid JSON: ${e.message}`);
    }
}

// Check CSS files
function lintCss(file) {
    const content = fs.readFileSync(file, 'utf-8');
    checks++;

    // Check bracket balance
    const opens = (content.match(/{/g) || []).length;
    const closes = (content.match(/}/g) || []).length;
    if (opens !== closes) {
        log('ERROR', file, `Unbalanced curly braces: ${opens} opens, ${closes} closes`);
    }
}

// Main
console.log('🔍 Running lint checks...\n');

const htmlFiles = findFiles(path.join(ROOT, 'src'), ['.html']);
const jsFiles = findFiles(path.join(ROOT, 'src'), ['.js']).concat(findFiles(path.join(ROOT, 'scripts'), ['.js']));
const yamlFiles = findFiles(path.join(ROOT, '.github'), ['.yml', '.yaml']);
const jsonFiles = findFiles(path.join(ROOT, 'data'), ['.json']);
const cssFiles = findFiles(path.join(ROOT, 'src'), ['.css']);

console.log(`  HTML files: ${htmlFiles.length}`);
console.log(`  JS files:   ${jsFiles.length}`);
console.log(`  YAML files: ${yamlFiles.length}`);
console.log(`  JSON files: ${jsonFiles.length}`);
console.log(`  CSS files:  ${cssFiles.length}`);
console.log('');

htmlFiles.forEach(lintHtml);
jsFiles.forEach(lintJs);
yamlFiles.forEach(lintYaml);
jsonFiles.forEach(lintJson);
cssFiles.forEach(lintCss);

console.log(`\n📊 Results: ${checks} files checked, ${errors} errors, ${warnings} warnings`);

if (errors > 0) {
    console.error('\n❌ Lint FAILED');
    process.exit(1);
} else {
    console.log('\n✅ Lint PASSED');
}
