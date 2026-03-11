/* ============================================================
   app.js — Main application logic for DailyLift
   ============================================================ */

(function () {
  'use strict';

  // ── Mobile Navigation Toggle ──
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── Load Daily Quote ──
  async function loadDailyQuote() {
    const textEls = document.querySelectorAll('#heroQuoteText, #dailyQuoteText');
    const authorEls = document.querySelectorAll('#heroQuoteAuthor, #dailyQuoteAuthor');
    const dateEls = document.querySelectorAll('#heroQuoteDate, #dailyQuoteDate');

    if (textEls.length === 0) return;

    try {
      const res = await fetch('data/quotes-collection.json');
      if (!res.ok) throw new Error('Quotes collection not found');
      const quotes = await res.json();

      const today = new Date();
      // Deterministically pick a quote based on days since epoch
      const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
      const quoteIndex = daysSinceEpoch % quotes.length;
      const data = quotes[quoteIndex];

      textEls.forEach(el => el.textContent = `"${data.text}"`);
      authorEls.forEach(el => el.textContent = `— ${data.author}`);
      dateEls.forEach(el => {
        el.textContent = today.toLocaleDateString('en-IN', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
      });
    } catch (e) {
      // Fallback quote
      textEls.forEach(el => el.textContent = '"The only way to do great work is to love what you do."');
      authorEls.forEach(el => el.textContent = '— Steve Jobs');
      dateEls.forEach(el => el.textContent = 'Fallback quote — API will update daily');
    }
  }

  // ── Scroll Animations (Intersection Observer) ──
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
  }

  // ── Tool Tabs (Tools Page) ──
  function initToolTabs() {
    const tabs = document.querySelectorAll('.tool-tab');
    const panels = document.querySelectorAll('.tool-panel');

    if (tabs.length === 0) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        panels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        const panelId = 'panel-' + tab.dataset.tool.split('-')[0];
        const panel = document.getElementById(panelId);
        if (panel) panel.classList.add('active');
      });
    });

    // Handle URL hash
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const matchTab = document.querySelector(`[data-tool="${hash}"]`);
      if (matchTab) matchTab.click();
    }
  }

  // ── PDF Download Button ──
  function initPdfDownload() {
    const pdfBtns = document.querySelectorAll('#downloadQuotePdf, #downloadQuotePdfCta');
    pdfBtns.forEach(btn => {
      if (!btn) return;
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        btn.textContent = '⏳ Generating PDF...';
        try {
          // Dynamically load pdf-lib from CDN
          if (typeof PDFLib === 'undefined') {
            await loadScript('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');
          }
          await generateQuotePDF();
          btn.textContent = '✅ Downloaded!';
          setTimeout(() => { btn.textContent = '📄 Download 500+ Quotes PDF (Free)'; }, 3000);
        } catch (err) {
          console.error('PDF generation failed:', err);
          btn.textContent = '❌ Failed — try again';
          setTimeout(() => { btn.textContent = '📄 Download 500+ Quotes PDF (Free)'; }, 3000);
        }
      });
    });
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function generateQuotePDF() {
    const { PDFDocument, rgb, StandardFonts } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Fetch quotes collection
    let quotes = [];
    try {
      const res = await fetch('data/quotes-collection.json');
      quotes = await res.json();
    } catch (e) {
      quotes = [{ text: 'The best time to plant a tree was 20 years ago.', author: 'Chinese Proverb' }];
    }

    // Title page
    let page = pdfDoc.addPage([595, 842]);
    page.drawText('500+ Motivational Quotes', {
      x: 50, y: 750, size: 28, font: boldFont, color: rgb(0.3, 0.2, 0.6)
    });
    page.drawText('Curated by DailyLift', {
      x: 50, y: 710, size: 14, font: font, color: rgb(0.4, 0.4, 0.5)
    });
    page.drawText('quickutils.top', {
      x: 50, y: 680, size: 12, font: font, color: rgb(0.3, 0.5, 0.8)
    });

    // Quotes pages
    let y = 780;
    let pageNum = 1;
    page = pdfDoc.addPage([595, 842]);

    for (let i = 0; i < quotes.length; i++) {
      const q = quotes[i];
      const text = `"${q.text}"`;
      const author = `— ${q.author}`;

      if (y < 100) {
        page = pdfDoc.addPage([595, 842]);
        y = 780;
        pageNum++;
      }

      // Wrap text
      const words = text.split(' ');
      let line = '';
      const lines = [];
      for (const word of words) {
        const testLine = line ? line + ' ' + word : word;
        if (font.widthOfTextAtSize(testLine, 11) > 480) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      }
      if (line) lines.push(line);

      for (const l of lines) {
        page.drawText(l, { x: 50, y, size: 11, font: font, color: rgb(0.2, 0.2, 0.2) });
        y -= 16;
      }
      page.drawText(author, { x: 50, y, size: 10, font: boldFont, color: rgb(0.3, 0.2, 0.6) });
      y -= 30;
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DailyLift-500-Quotes.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Load Blog Preview (Home Page) ──
  async function loadBlogPreview() {
    const grid = document.getElementById('blogGrid');
    if (!grid) return;

    try {
      const res = await fetch('data/blog-index.json');
      if (!res.ok) return;
      const posts = await res.json();

      const preview = posts.slice(0, 3);
      grid.innerHTML = preview.map(post => `
        <a href="blog/${post.slug}.html" class="glass-card blog-card animate-on-scroll">
          <div class="blog-image" style="background: linear-gradient(135deg, hsl(${post.hue || 265}, 40%, 20%), hsl(${post.hue || 200}, 30%, 15%));">
            <div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem;">${post.emoji || '📝'}</div>
          </div>
          <div class="blog-body">
            <div class="blog-meta">
              <span>${post.date}</span>
              <span>${post.readTime || '5 min read'}</span>
            </div>
            <h3>${post.title}</h3>
            <p class="blog-excerpt">${post.description}</p>
          </div>
        </a>
      `).join('');

      initScrollAnimations();
    } catch (e) {
      // Blog index not available yet
    }
  }

  // ── Load Full Blog Grid (Blog Page) ──
  async function loadBlogGrid() {
    const grid = document.getElementById('blogGridFull');
    if (!grid) return;

    try {
      const res = await fetch('data/blog-index.json');
      if (!res.ok) return;
      const posts = await res.json();

      grid.innerHTML = posts.map(post => `
        <a href="blog/${post.slug}.html" class="glass-card blog-card animate-on-scroll">
          <div class="blog-image" style="background: linear-gradient(135deg, hsl(${post.hue || 265}, 40%, 20%), hsl(${post.hue || 200}, 30%, 15%));">
            <div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem;">${post.emoji || '📝'}</div>
          </div>
          <div class="blog-body">
            <div class="blog-meta">
              <span>${post.date}</span>
              <span>${post.readTime || '5 min read'}</span>
            </div>
            <h3>${post.title}</h3>
            <p class="blog-excerpt">${post.description}</p>
          </div>
        </a>
      `).join('');

      initScrollAnimations();
    } catch (e) {
      grid.innerHTML = '<p style="text-align:center; color: var(--clr-text-muted);">Blog articles coming soon!</p>';
    }
  }

  // ── Initialize ──
  document.addEventListener('DOMContentLoaded', () => {
    loadDailyQuote();
    initScrollAnimations();
    initToolTabs();
    initPdfDownload();
    loadBlogPreview();
    loadBlogGrid();
  });
})();
