/* ==============================================
   QuickUtils Core JS Library v2
   Shared utilities for all interactive projects
   ============================================== */
'use strict';

const QU = (() => {
  // ── DOM Helpers ──
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  // ── Utilities ──
  function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function generateId(prefix = 'qu') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function debounce(fn, ms = 250) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn.apply(null, args), ms); };
  }

  function throttle(fn, ms = 100) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= ms) { last = now; fn.apply(null, args); }
    };
  }

  function formatNumber(n) {
    return new Intl.NumberFormat().format(n);
  }

  function formatMoney(n, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  // ── State Persistence ──
  function saveState(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); return true; }
    catch { return false; }
  }

  function loadState(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }

  // ── Theme System ──
  function initTheme(btnSelector = '#themeBtn') {
    const btn = $(btnSelector);
    const saved = localStorage.getItem('qu_theme');
    if (saved) {
      document.documentElement.dataset.theme = saved;
      if (btn) btn.textContent = saved === 'light' ? '☀️' : '🌙';
    }
    if (btn) {
      btn.addEventListener('click', () => {
        const html = document.documentElement;
        const isDark = html.dataset.theme === 'dark';
        html.dataset.theme = isDark ? 'light' : 'dark';
        btn.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('qu_theme', html.dataset.theme);
      });
    }
  }

  // ── Toast Notifications ──
  let toastContainer = null;

  function showToast(msg, type = 'info', duration = 3000) {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'qu-toast-container';
      document.body.appendChild(toastContainer);
    }
    const toast = document.createElement('div');
    toast.className = `qu-toast qu-toast-${type}`;
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => { toast.remove(); }, duration);
  }

  // ── Clipboard ──
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!', 'success');
      return true;
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Copied to clipboard!', 'success');
      return true;
    }
  }

  // ── Analytics ──
  function initAnalytics(gaId) {
    if (!gaId || typeof window === 'undefined') return;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', gaId);
  }

  // ── Ko-fi Widget ──
  function initKofi(username = 'dayatin') {
    const script = document.createElement('script');
    script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
    script.onload = () => {
      if (window.kofiWidgetOverlay) {
        window.kofiWidgetOverlay.draw(username, {
          type: 'floating-chat',
          'floating-chat.donateButton.text': 'Support Us',
          'floating-chat.donateButton.background-color': '#ff5e5b',
          'floating-chat.donateButton.text-color': '#fff'
        });
      }
    };
    document.body.appendChild(script);
  }

  // ── Discover More Widget ──
  const NETWORK_SITES = [
    { emoji: '⌨️', name: 'Typing Test', url: 'https://typing.quickutils.top' },
    { emoji: '🎨', name: 'Pixel Art', url: 'https://pixelart.quickutils.top' },
    { emoji: '🎵', name: 'Music Maker', url: 'https://music.quickutils.top' },
    { emoji: '🍅', name: 'Focus Timer', url: 'https://focus.quickutils.top' },
    { emoji: '💰', name: 'Budget Tracker', url: 'https://budget.quickutils.top' },
    { emoji: '✅', name: 'Habit Tracker', url: 'https://habits.quickutils.top' },
    { emoji: '🌈', name: 'Gradient Studio', url: 'https://gradients.quickutils.top' },
    { emoji: '🔤', name: 'Regex Playground', url: 'https://regex.quickutils.top' },
    { emoji: '⚗️', name: 'Periodic Table', url: 'https://elements.quickutils.top' },
    { emoji: '🌧️', name: 'Ambient Mixer', url: 'https://ambient.quickutils.top' },
    { emoji: '🔄', name: 'Data Converter', url: 'https://convert.quickutils.top' },
    { emoji: '📊', name: 'Chart Maker', url: 'https://charts.quickutils.top' },
    { emoji: '🧪', name: 'Chemistry Lab', url: 'https://chemistry.quickutils.top' },
    { emoji: '🏆', name: 'Quiz Master', url: 'https://quiz.quickutils.top' },
    { emoji: '💻', name: 'Code Arena', url: 'https://code.quickutils.top' },
    { emoji: '🧬', name: 'Life Simulator', url: 'https://life.quickutils.top' },
    { emoji: '🎮', name: 'Retro Games', url: 'https://games.quickutils.top' },
    { emoji: '📐', name: 'Unit Converter', url: 'https://units.quickutils.top' },
    { emoji: '🖌️', name: 'Whiteboard', url: 'https://whiteboard.quickutils.top' },
    { emoji: '🎯', name: 'CSS Battle', url: 'https://cssbattle.quickutils.top' },
    { emoji: '📈', name: 'Algorithm Viz', url: 'https://algorithms.quickutils.top' },
  ];

  function initDiscoverBar(currentUrl) {
    // Filter out current site and pick 3 random
    const others = NETWORK_SITES.filter(s => !currentUrl.includes(new URL(s.url).hostname));
    const picks = [];
    const shuffled = [...others].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(3, shuffled.length); i++) picks.push(shuffled[i]);

    const bar = document.createElement('div');
    bar.className = 'qu-discover-bar';
    bar.innerHTML = `
      <span class="discover-label">Discover More →</span>
      ${picks.map(s => `<a href="${s.url}" target="_blank" rel="noopener">${s.emoji} ${s.name}</a>`).join('')}
      <button class="qu-discover-close" aria-label="Close">✕</button>
    `;
    document.body.appendChild(bar);

    // Show after 15 seconds
    setTimeout(() => bar.classList.add('visible'), 15000);
    bar.querySelector('.qu-discover-close').addEventListener('click', () => bar.classList.remove('visible'));
  }

  // ── Keyboard Shortcuts ──
  let shortcutsMap = {};

  function registerShortcuts(shortcuts) {
    shortcutsMap = { ...shortcutsMap, ...shortcuts };
    // Build overlay
    let overlay = $('.qu-shortcuts-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'qu-shortcuts-overlay';
      overlay.innerHTML = `<div class="qu-shortcuts-card">
        <h3>⌨️ Keyboard Shortcuts</h3>
        <div class="qu-shortcuts-list"></div>
        <p style="margin-top:1rem;font-size:0.75rem;color:var(--text-muted)">Press <kbd>?</kbd> to toggle</p>
      </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('active'); });
    }
    const list = overlay.querySelector('.qu-shortcuts-list');
    list.innerHTML = Object.entries(shortcutsMap).map(([key, desc]) =>
      `<div class="qu-shortcut-row"><span>${desc}</span><kbd>${key}</kbd></div>`
    ).join('');
  }

  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === '?') {
        e.preventDefault();
        const overlay = $('.qu-shortcuts-overlay');
        if (overlay) overlay.classList.toggle('active');
      }
    });
  }

  // ── Undo/Redo Stack ──
  class UndoStack {
    constructor(maxSize = 50) {
      this.stack = [];
      this.pointer = -1;
      this.maxSize = maxSize;
    }
    push(state) {
      // Remove any forward states
      this.stack = this.stack.slice(0, this.pointer + 1);
      this.stack.push(JSON.parse(JSON.stringify(state)));
      if (this.stack.length > this.maxSize) this.stack.shift();
      else this.pointer++;
    }
    undo() {
      if (this.pointer <= 0) return null;
      this.pointer--;
      return JSON.parse(JSON.stringify(this.stack[this.pointer]));
    }
    redo() {
      if (this.pointer >= this.stack.length - 1) return null;
      this.pointer++;
      return JSON.parse(JSON.stringify(this.stack[this.pointer]));
    }
    canUndo() { return this.pointer > 0; }
    canRedo() { return this.pointer < this.stack.length - 1; }
  }

  // ── Init Everything ──
  function init(opts = {}) {
    initTheme(opts.themeBtn || '#themeBtn');
    if (opts.gaId) initAnalytics(opts.gaId);
    if (opts.kofi !== false) initKofi(opts.kofiUser || 'dayatin');
    if (opts.discover !== false) initDiscoverBar(window.location.href);
    initKeyboardShortcuts();
    registerShortcuts({ '?': 'Show keyboard shortcuts' });
  }

  return {
    $, $$, escapeHtml, generateId, debounce, throttle,
    formatNumber, formatMoney, clamp,
    saveState, loadState,
    initTheme, showToast, copyToClipboard,
    initAnalytics, initKofi, initDiscoverBar,
    registerShortcuts, initKeyboardShortcuts,
    UndoStack, init, NETWORK_SITES
  };
})();

// Export for testing (Node.js/Vitest)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QU;
}
