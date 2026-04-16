'use strict';
(function() {
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    if(typeof QU !== 'undefined') QU.init({ kofi: true });

    // Scroll Progress
    const progText = $('#scrollProgress');
    window.addEventListener('scroll', () => {
        let winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        let height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        let scrolled = (winScroll / height) * 100;
        progText.textContent = Math.round(scrolled) + '%';
    });

    // Intersection Observer for fade-ins
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once faded in if we want it to stay
                // observer.unobserve(entry.target);
            } else {
                // allow fade out on scroll up
                entry.target.classList.remove('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px"
    });

    $$('.timeline-event').forEach(el => {
        observer.observe(el);
    });

    // Dynamic Starfield Parallax using Canvas (lighter than hundreds of DOM elements)
    const starContainer = $('#starsBg');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    starContainer.appendChild(canvas);

    let width, height;
    let stars = [];

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    function initStars() {
        stars = [];
        for(let i=0; i<400; i++) {
            stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                r: Math.random() * 1.5 + 0.5,
                opacity: Math.random(),
                speedX: 0,
                speedY: (Math.random() - 0.5) * 0.1 // drift drift
            });
        }
    }

    window.addEventListener('resize', () => { resize(); initStars(); });
    resize();
    initStars();

    let lastScroll = 0;
    
    function animate() {
        requestAnimationFrame(animate);
        
        ctx.clearRect(0, 0, width, height);

        // Calculate scroll delta
        let currentScroll = window.scrollY;
        let scrollDelta = currentScroll - lastScroll;
        lastScroll = currentScroll;

        // Base drift
        let currentScrollPct = currentScroll / (document.documentElement.scrollHeight - window.innerHeight);

        for(let i=0; i<stars.length; i++) {
            let s = stars[i];
            
            // As we scroll deeper (closer to end of timeline), stars drift faster away or change color
            // This is just a nice subtle effect.
            let scrollOffset = scrollDelta * (s.r * 0.5); // Parallax factor based on size
            
            s.y -= scrollOffset;
            s.y += s.speedY; // Natural drift
            
            // Wrap around
            if (s.y < 0) s.y += height;
            if (s.y > height) s.y -= height;
            
            // Twinkle
            s.opacity += (Math.random() - 0.5) * 0.05;
            if (s.opacity < 0.1) s.opacity = 0.1;
            if (s.opacity > 1) s.opacity = 1;

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            
            // Near the end (heat death), stars turn reddish then fade to black.
            if (currentScrollPct > 0.8) {
                let heatDeathFac = (currentScrollPct - 0.8) * 5; // 0 to 1
                // Red and dim
                ctx.fillStyle = `rgba(${255 - heatDeathFac*100}, ${255 - heatDeathFac*255}, ${255 - heatDeathFac*255}, ${s.opacity * (1 - heatDeathFac)})`;
            } else {
                ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
            }
            
            ctx.fill();
        }
    }
    
    animate();

})();
