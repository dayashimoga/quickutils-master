/* ==========================================================================
   QuickUtils API Directory — Main JavaScript
   Dark/Light mode toggle, mobile menu, smooth scrolling
   ========================================================================== */

(function () {
    'use strict';

    // ---------- Dark/Light Mode ----------
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    function setTheme(theme) {
        html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    // Load saved theme or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            const current = html.getAttribute('data-theme');
            setTheme(current === 'dark' ? 'light' : 'dark');
        });
    }

    // ---------- Mobile Menu ----------
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mainNav = document.getElementById('main-nav');

    if (menuBtn && mainNav) {
        menuBtn.addEventListener('click', function () {
            const isOpen = mainNav.classList.toggle('open');
            menuBtn.setAttribute('aria-expanded', isOpen);
        });

        // Close menu when clicking a nav link
        mainNav.querySelectorAll('.nav-link').forEach(function (link) {
            link.addEventListener('click', function () {
                mainNav.classList.remove('open');
                menuBtn.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // ---------- Smooth Scroll for Anchor Links ----------
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    // ---------- World Clock ----------
    function updateWorldClocks() {
        var clocks = document.querySelectorAll('.clock-time[data-tz]');
        clocks.forEach(function (el) {
            try {
                var time = new Date().toLocaleTimeString('en-US', {
                    timeZone: el.getAttribute('data-tz'),
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                el.textContent = time;
            } catch (e) {
                el.textContent = '--:--';
            }
        });
    }

    if (document.querySelector('.clock-time')) {
        updateWorldClocks();
        setInterval(updateWorldClocks, 1000);
    }

    // ---------- Time Converter (Past / Future / Any Timezone) ----------
    var dtInput = document.getElementById('converter-datetime');
    var fromTzSelect = document.getElementById('converter-from-tz');
    var toTzSelect = document.getElementById('converter-to-tz');
    var fromDisplay = document.getElementById('converter-from-display');
    var toDisplay = document.getElementById('converter-to-display');
    var nowBtn = document.getElementById('converter-now-btn');

    function setDatetimeToNow() {
        if (!dtInput) return;
        var now = new Date();
        // Format as YYYY-MM-DDTHH:MM for datetime-local input
        var y = now.getFullYear();
        var m = String(now.getMonth() + 1).padStart(2, '0');
        var d = String(now.getDate()).padStart(2, '0');
        var h = String(now.getHours()).padStart(2, '0');
        var min = String(now.getMinutes()).padStart(2, '0');
        dtInput.value = y + '-' + m + '-' + d + 'T' + h + ':' + min;
    }

    function getOffsetMs(tz, refDate) {
        // Get the UTC offset in ms for a given timezone at a given date
        var fmt = new Intl.DateTimeFormat('en-US', {
            timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
        var parts = {};
        fmt.formatToParts(refDate).forEach(function (p) { parts[p.type] = p.value; });
        var hr = parseInt(parts.hour, 10);
        if (hr === 24) hr = 0;
        var tzDate = new Date(
            parseInt(parts.year, 10), parseInt(parts.month, 10) - 1, parseInt(parts.day, 10),
            hr, parseInt(parts.minute, 10), parseInt(parts.second, 10)
        );
        return tzDate.getTime() - refDate.getTime();
    }

    function updateConverter() {
        if (!dtInput || !fromTzSelect || !toTzSelect || !fromDisplay || !toDisplay) return;
        if (!dtInput.value) { setDatetimeToNow(); }

        var inputDate = new Date(dtInput.value);
        if (isNaN(inputDate.getTime())) {
            fromDisplay.textContent = 'Invalid date';
            toDisplay.textContent = '--';
            return;
        }

        var fromTz = fromTzSelect.value;
        var toTz = toTzSelect.value;

        try {
            // The input is "wall clock" time in the FROM timezone.
            // We need to find the UTC instant, then display it in TO timezone.
            var utcInstant;
            if (fromTz === 'LOCAL') {
                utcInstant = inputDate;
            } else {
                // Convert from-tz wall time to UTC:
                // offset = how far fromTz is from UTC at that time
                var localOffset = getOffsetMs(fromTz, inputDate);
                utcInstant = new Date(inputDate.getTime() - localOffset);
                // Iteratively refine (offset may change near DST boundary)
                var refined = getOffsetMs(fromTz, utcInstant);
                utcInstant = new Date(inputDate.getTime() - refined);
            }

            var fmtOpts = {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true
            };

            var fromStr = utcInstant.toLocaleString('en-US',
                Object.assign({}, fmtOpts, fromTz !== 'LOCAL' ? { timeZone: fromTz } : {})
            );
            var toStr = utcInstant.toLocaleString('en-US',
                Object.assign({}, fmtOpts, { timeZone: toTz })
            );

            fromDisplay.textContent = fromStr;
            toDisplay.textContent = toStr;
        } catch (e) {
            fromDisplay.textContent = '--';
            toDisplay.textContent = '--';
        }
    }

    if (dtInput) {
        setDatetimeToNow();
        updateConverter();
        dtInput.addEventListener('input', updateConverter);
        if (fromTzSelect) fromTzSelect.addEventListener('change', updateConverter);
        if (toTzSelect) toTzSelect.addEventListener('change', updateConverter);
        if (nowBtn) nowBtn.addEventListener('click', function () {
            setDatetimeToNow();
            updateConverter();
        });
    }

})();

// BOOKMARKS SYSTEM
document.addEventListener('DOMContentLoaded', () => {
    // Render bookmarks link in nav
    const nav = document.getElementById('main-nav');
    if (nav) {
        const bookmarksLink = document.createElement('a');
        bookmarksLink.href = '#';
        bookmarksLink.className = 'nav-link';
        bookmarksLink.innerHTML = '?? Bookmarks <span id="bookmark-count" style="background:var(--accent, #6366f1);color:white;border-radius:10px;padding:2px 6px;font-size:0.8em;vertical-align:top;margin-left:4px;">0</span>';
        bookmarksLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleBookmarkModal();
        });
        nav.insertBefore(bookmarksLink, nav.lastElementChild);
    }

    updateBookmarkCount();

    // Add bookmark button to items
    const h1 = document.querySelector('main h1');
    if (h1 && window.location.pathname.includes('/item/')) {
        const btn = document.createElement('button');
        const slug = window.location.pathname.split('/').pop().replace('.html', '');
        btn.className = 'btn btn-ghost';
        btn.style.marginLeft = '15px';
        btn.style.padding = '4px 10px';
        btn.style.fontSize = '0.6em';
        btn.style.verticalAlign = 'middle';
        btn.dataset.slug = slug;
        btn.dataset.title = h1.innerText.trim();
        
        checkIsBookmarked(slug, btn);
        
        btn.addEventListener('click', () => {
            toggleBookmark(slug, btn.dataset.title);
            checkIsBookmarked(slug, btn);
        });
        h1.appendChild(btn);
    }
});

function getBookmarks() {
    return JSON.parse(localStorage.getItem('qu_bookmarks') || '[]');
}

function saveBookmarks(b) {
    localStorage.setItem('qu_bookmarks', JSON.stringify(b));
    updateBookmarkCount();
    renderBookmarkList();
}

function toggleBookmark(slug, title) {
    let b = getBookmarks();
    const idx = b.findIndex(x => x.slug === slug);
    if (idx !== -1) {
        b.splice(idx, 1);
    } else {
        b.push({ slug, title, url: window.location.href });
    }
    saveBookmarks(b);
}

function checkIsBookmarked(slug, btn) {
    const b = getBookmarks();
    if (b.find(x => x.slug === slug)) {
        btn.innerHTML = '?? Saved';
        btn.style.background = 'var(--accent, #6366f1)';
        btn.style.color = '#fff';
    } else {
        btn.innerHTML = '?? Save';
        btn.style.background = 'transparent';
        btn.style.color = 'var(--text-base)';
    }
}

function updateBookmarkCount() {
    const b = getBookmarks();
    const el = document.getElementById('bookmark-count');
    if (el) el.innerText = b.length;
}

function toggleBookmarkModal() {
    let modal = document.getElementById('bookmark-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'bookmark-modal';
        Object.assign(modal.style, {
            position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
            background: 'rgba(0,0,0,0.7)', zIndex: '10001', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
        });
        
        modal.innerHTML = `
            <div style="background: var(--bg-card, #1e1e1e); padding: 2rem; border-radius: 8px; width: 90%; max-width: 500px; max-height:80vh; overflow-y:auto; position: relative; color: var(--text-base, #eaeaea);">
                <button onclick="document.getElementById('bookmark-modal').style.display='none'" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: var(--text-muted); font-size: 1.5rem; cursor: pointer;">&times;</button>
                <h2 style="margin-top: 0">My Bookmarks</h2>
                <div id="bookmark-list" style="margin-top:1rem; display:flex; flex-direction:column; gap:0.5rem;"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    } else {
        modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
    }
    
    if (modal.style.display === 'flex') {
        renderBookmarkList();
    }
}

function renderBookmarkList() {
    const list = document.getElementById('bookmark-list');
    if (!list) return;
    
    const b = getBookmarks();
    if (b.length === 0) {
        list.innerHTML = '<p>No bookmarks yet. Start browsing and save your favorites!</p>';
        return;
    }
    
    list.innerHTML = b.map(x => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem; background:var(--bg-body, #121212); border-radius:4px;">
            <a href="${x.url}" style="color:var(--accent, #6366f1); text-decoration:none;">${x.title}</a>
            <button onclick="toggleBookmark('${x.slug}', '${x.title}')" class="btn btn-ghost" style="padding:2px 8px; font-size:0.8em; color:#ff5e5b;">Remove</button>
        </div>
    `).join('');
}

// QUIZ WIDGET SYSTEM
document.addEventListener('DOMContentLoaded', () => {
    const quizContainers = document.querySelectorAll('.quiz-container');
    if (quizContainers.length === 0) return;
    
    // Sample questions pool
    const questions = {
        "Development": [
            { q: "What does API stand for?", o: ["Application Programming Interface", "Advanced Program Integration", "Automated Process Interaction"], a: 0 },
            { q: "Which HTTP method is typically used to create a resource?", o: ["GET", "POST", "PUT", "DELETE"], a: 1 }
        ],
        "Science": [
            { q: "What is the speed of light?", o: ["300,000 km/s", "150,000 km/s", "1,000,000 km/s"], a: 0 },
            { q: "Which planet is known as the Red Planet?", o: ["Venus", "Mars", "Jupiter"], a: 1 }
        ],
        "Finance": [
            { q: "What does ROI stand for?", o: ["Return On Investment", "Rate Of Inflation", "Revenue Over Income"], a: 0 }
        ],
        "Default": [
            { q: "What is the primary function of a web browser?", o: ["Process data", "Render HTML", "Store databases"], a: 1 },
            { q: "What does URL stand for?", o: ["Uniform Resource Locator", "Universal Reference Link", "Unified Resource Label"], a: 0 }
        ]
    };
    
    quizContainers.forEach(container => {
        let category = container.dataset.category || "Default";
        let pool = questions[category] || questions["Default"];
        let qIndex = Math.floor(Math.random() * pool.length);
        
        const qElem = container.querySelector('.quiz-question');
        const optsElem = container.querySelector('.quiz-options');
        const feedback = container.querySelector('.quiz-feedback');
        const nextBtn = container.querySelector('.quiz-next-btn');
        
        function renderQuiz() {
            let currentQ = pool[qIndex];
            qElem.innerText = currentQ.q;
            optsElem.innerHTML = '';
            feedback.style.display = 'none';
            nextBtn.style.display = 'none';
            
            currentQ.o.forEach((opt, i) => {
                let btn = document.createElement('button');
                btn.className = 'btn btn-ghost';
                btn.style.border = '1px solid #444';
                btn.innerText = opt;
                btn.addEventListener('click', () => {
                    Array.from(optsElem.children).forEach(c => c.disabled = true);
                    if (i === currentQ.a) {
                        btn.style.background = '#10b981';
                        btn.style.color = '#fff';
                        feedback.innerText = "? Correct!";
                        feedback.style.color = '#10b981';
                    } else {
                        btn.style.background = '#ef4444';
                        btn.style.color = '#fff';
                        optsElem.children[currentQ.a].style.background = '#10b981';
                        optsElem.children[currentQ.a].style.color = '#fff';
                        feedback.innerText = "? Incorrect!";
                        feedback.style.color = '#ef4444';
                    }
                    feedback.style.display = 'block';
                    if (pool.length > 1) nextBtn.style.display = 'inline-block';
                });
                optsElem.appendChild(btn);
            });
        }
        
        nextBtn.addEventListener('click', () => {
            qIndex = (qIndex + 1) % pool.length;
            renderQuiz();
        });
        
        renderQuiz();
    });
});
