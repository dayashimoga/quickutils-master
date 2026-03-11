/* DailyFacts — Main App Logic */
(function () {
    'use strict';

    // ── Mobile Nav ──
    var navToggle = document.getElementById('navToggle');
    var navLinks = document.getElementById('navLinks');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function () {
            var isOpen = navLinks.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', isOpen);
        });
    }

    // ── Globals ──
    var allFacts = [];
    var currentCategory = 'All';
    var factsShown = 0;
    var FACTS_PER_PAGE = 12;
    var quizState = { score: 0, total: 0, currentFact: null, isReal: true };

    // ── Load Facts Database ──
    function loadFacts() {
        return fetch('data/database.json')
            .then(function (res) { return res.json(); })
            .then(function (data) { allFacts = data; return data; })
            .catch(function () { allFacts = []; return []; });
    }

    // ── Daily Fact (deterministic) ──
    function showDailyFact() {
        if (allFacts.length === 0) return;
        var today = new Date();
        var daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
        var idx = daysSinceEpoch % allFacts.length;
        var fact = allFacts[idx];

        var heroText = document.getElementById('heroFactText');
        var heroCategory = document.getElementById('heroFactCategory');
        var heroDate = document.getElementById('heroFactDate');
        var dailyText = document.getElementById('dailyFactText');
        var dailyCategory = document.getElementById('dailyFactCategory');
        var dailyDate = document.getElementById('dailyFactDate');

        var dateStr = today.toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        [heroText, dailyText].forEach(function (el) {
            if (el) el.textContent = '"' + fact.text + '"';
        });
        [heroCategory, dailyCategory].forEach(function (el) {
            if (el) el.textContent = '— ' + fact.category + ' • ' + fact.source;
        });
        [heroDate, dailyDate].forEach(function (el) {
            if (el) el.textContent = dateStr;
        });
    }

    // ── Category Tabs ──
    function renderCategoryTabs() {
        var container = document.getElementById('categoryTabs');
        if (!container) return;
        var categories = ['All'];
        allFacts.forEach(function (f) {
            if (categories.indexOf(f.category) === -1) categories.push(f.category);
        });
        container.innerHTML = categories.map(function (cat) {
            var cls = cat === currentCategory ? 'category-tab active' : 'category-tab';
            return '<button class="' + cls + '" data-category="' + cat + '">' + cat + '</button>';
        }).join('');
        container.addEventListener('click', function (e) {
            if (e.target.classList.contains('category-tab')) {
                currentCategory = e.target.dataset.category;
                factsShown = 0;
                renderCategoryTabs();
                renderFacts();
            }
        });
    }

    // ── Render Facts Grid ──
    function renderFacts() {
        var grid = document.getElementById('factsGrid');
        var loadBtn = document.getElementById('loadMoreBtn');
        if (!grid) return;
        var filtered = currentCategory === 'All' ? allFacts :
            allFacts.filter(function (f) { return f.category === currentCategory; });
        var toShow = filtered.slice(0, factsShown + FACTS_PER_PAGE);
        factsShown = toShow.length;
        grid.innerHTML = toShow.map(function (f) {
            return '<div class="fact-card"><div class="fact-text">' + f.text +
                '</div><div class="fact-meta"><span class="fact-category">' + f.category +
                '</span><span class="fact-source">' + f.source + '</span></div></div>';
        }).join('');
        if (loadBtn) loadBtn.style.display = factsShown < filtered.length ? 'inline-flex' : 'none';
    }

    // ── Tool Tabs ──
    function initToolTabs() {
        var tabs = document.querySelectorAll('.tool-tab');
        var panels = document.querySelectorAll('.tool-panel');
        if (tabs.length === 0) return;
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                tabs.forEach(function (t) { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
                panels.forEach(function (p) { p.classList.remove('active'); });
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                var panelId = 'panel-' + tab.dataset.tool;
                var panel = document.getElementById(panelId);
                if (panel) panel.classList.add('active');
            });
        });
    }

    // ── Random Fact Tool ──
    function initRandomTool() {
        var btn = document.getElementById('randomBtn');
        if (!btn) return;
        btn.addEventListener('click', function () {
            if (allFacts.length === 0) return;
            var idx = Math.floor(Math.random() * allFacts.length);
            var fact = allFacts[idx];
            document.getElementById('randomFactText').textContent = fact.text;
            document.getElementById('randomFactMeta').textContent = fact.category + ' • ' + fact.source;
        });
    }

    // ── Quiz Tool ──
    function initQuizTool() {
        var startBtn = document.getElementById('quizStart');
        var trueBtn = document.getElementById('quizTrue');
        var falseBtn = document.getElementById('quizFalse');
        if (!startBtn) return;

        function nextQuestion() {
            if (allFacts.length === 0) return;
            var isReal = Math.random() > 0.3; // 70% real facts
            quizState.isReal = isReal;
            var fact = allFacts[Math.floor(Math.random() * allFacts.length)];
            quizState.currentFact = fact;
            var text = isReal ? fact.text : scrambleFact(fact.text);
            document.getElementById('quizFactText').textContent = text;
            document.getElementById('quizScore').textContent = 'Score: ' + quizState.score + '/' + quizState.total;
        }

        function scrambleFact(text) {
            var mods = [
                function (t) { return t.replace(/\d+/g, function (n) { return String(parseInt(n) * 7); }); },
                function (t) { return t.replace(/can |do |is |are /i, "can't "); },
                function (t) { return t + ' — but only on Tuesdays.'; }
            ];
            return mods[Math.floor(Math.random() * mods.length)](text);
        }

        function answer(userSaysTrue) {
            quizState.total++;
            if (userSaysTrue === quizState.isReal) quizState.score++;
            nextQuestion();
        }

        startBtn.addEventListener('click', function () {
            quizState = { score: 0, total: 0, currentFact: null, isReal: true };
            nextQuestion();
        });
        if (trueBtn) trueBtn.addEventListener('click', function () { answer(true); });
        if (falseBtn) falseBtn.addEventListener('click', function () { answer(false); });
    }

    // ── Search Tool ──
    function initSearchTool() {
        var input = document.getElementById('searchInput');
        if (!input) return;
        input.addEventListener('input', function () {
            var q = input.value.toLowerCase().trim();
            var results = document.getElementById('searchResults');
            var count = document.getElementById('searchCount');
            if (q.length < 2) {
                if (results) results.innerHTML = '';
                if (count) count.textContent = 'Type to search ' + allFacts.length + '+ facts';
                return;
            }
            var matched = allFacts.filter(function (f) {
                return f.text.toLowerCase().indexOf(q) !== -1 || f.category.toLowerCase().indexOf(q) !== -1;
            }).slice(0, 20);
            if (results) {
                results.innerHTML = matched.map(function (f) {
                    return '<div class="fact-card"><div class="fact-text">' + f.text +
                        '</div><div class="fact-meta"><span class="fact-category">' + f.category +
                        '</span><span class="fact-source">' + f.source + '</span></div></div>';
                }).join('');
            }
            if (count) count.textContent = matched.length + ' facts found';
        });
    }

    // ── Scroll Animations ──
    function initScrollAnimations() {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.animate-on-scroll').forEach(function (el) { observer.observe(el); });
    }

    // ── Load More Button ──
    function initLoadMore() {
        var btn = document.getElementById('loadMoreBtn');
        if (btn) btn.addEventListener('click', function () { renderFacts(); });
    }

    // ── Init ──
    document.addEventListener('DOMContentLoaded', function () {
        loadFacts().then(function () {
            showDailyFact();
            renderCategoryTabs();
            renderFacts();
            initToolTabs();
            initRandomTool();
            initQuizTool();
            initSearchTool();
            initLoadMore();
            initScrollAnimations();
        });
    });
})();
