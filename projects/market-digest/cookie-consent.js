(function () {
  'use strict';
  const CONSENT_KEY = 'qu_cookie_consent';
  const CONSENT_VERSION = '1';
  if (localStorage.getItem(CONSENT_KEY) === CONSENT_VERSION) return;
  const banner = document.createElement('div');
  banner.id = 'cookie-consent-banner';
  banner.innerHTML = `
    <div class="cc-content" style="max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;">
      <p style="flex:1;min-width:250px;margin:0;line-height:1.5;">We use cookies for analytics and personalized advertising. By continuing to use this site, you consent to our use of cookies. <a href="privacy.html" style="color:#6366f1;text-decoration:underline;">Privacy Policy</a></p>
      <div class="cc-actions" style="display:flex;gap:0.75rem;flex-shrink:0;">
        <button id="cc-accept" style="padding:0.6rem 1.25rem;background:#6366f1;color:#fff;border:none;border-radius:8px;cursor:pointer;">Accept All</button>
        <button id="cc-reject" style="padding:0.6rem 1.25rem;background:transparent;color:#ccc;border:1px solid #666;border-radius:8px;cursor:pointer;">Reject Non-Essential</button>
      </div>
    </div>
  `;
  const style = document.createElement('style');
  style.textContent = `
    #cookie-consent-banner { position:fixed;bottom:0;left:0;right:0;z-index:99999;background:rgba(15,15,20,0.97);backdrop-filter:blur(12px);border-top:1px solid rgba(99,102,241,0.3);padding:1rem 1.5rem;font-family:sans-serif;font-size:0.9rem;color:#e0e0e6;animation:cc-slide-up 0.4s ease-out; }
    @keyframes cc-slide-up { from{transform:translateY(100%);opacity:0;} to{transform:translateY(0);opacity:1;} }
    @keyframes cc-slide-down { from{transform:translateY(0);opacity:1;} to{transform:translateY(100%);opacity:0;} }
  `;
  document.head.appendChild(style);
  document.body.appendChild(banner);
  document.getElementById('cc-accept').addEventListener('click', function () {
    localStorage.setItem(CONSENT_KEY, CONSENT_VERSION);
    banner.style.animation = 'cc-slide-down 0.3s ease-in forwards';
    setTimeout(() => banner.remove(), 300);
  });
  document.getElementById('cc-reject').addEventListener('click', function () {
    localStorage.setItem(CONSENT_KEY, CONSENT_VERSION);
    window['ga-disable-G-MARKET001'] = true;
    banner.style.animation = 'cc-slide-down 0.3s ease-in forwards';
    setTimeout(() => banner.remove(), 300);
  });
})();
