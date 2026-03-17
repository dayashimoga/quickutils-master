/**
 * Cookie Consent Banner — GDPR/AdSense Compliance
 * Shows a consent banner on first visit; remembers the user's choice in localStorage.
 * Required by Google AdSense Publisher Policies.
 */
(function () {
  'use strict';

  const CONSENT_KEY = 'qu_cookie_consent';
  const CONSENT_VERSION = '1'; // Bump to re-show after policy changes

  // Check if user already consented
  if (localStorage.getItem(CONSENT_KEY) === CONSENT_VERSION) return;

  // Create banner
  const banner = document.createElement('div');
  banner.id = 'cookie-consent-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.innerHTML = `
    <div class="cc-content">
      <p>We use cookies for analytics (Google Analytics) and personalized advertising (Google AdSense).
         By continuing to use this site, you consent to our use of cookies.
         <a href="privacy.html" style="color: var(--clr-accent, #6366f1); text-decoration: underline;">Privacy Policy</a>
      </p>
      <div class="cc-actions">
        <button id="cc-accept" class="cc-btn cc-btn-accept">Accept All</button>
        <button id="cc-reject" class="cc-btn cc-btn-reject">Reject Non-Essential</button>
      </div>
    </div>
  `;

  // Styles
  const style = document.createElement('style');
  style.textContent = `
    #cookie-consent-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 99999;
      background: rgba(15, 15, 20, 0.97);
      backdrop-filter: blur(12px);
      border-top: 1px solid rgba(99, 102, 241, 0.3);
      padding: 1rem 1.5rem;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 0.9rem;
      color: #e0e0e6;
      animation: cc-slide-up 0.4s ease-out;
    }
    @keyframes cc-slide-up {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .cc-content {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .cc-content p {
      flex: 1;
      min-width: 250px;
      margin: 0;
      line-height: 1.5;
    }
    .cc-actions {
      display: flex;
      gap: 0.75rem;
      flex-shrink: 0;
    }
    .cc-btn {
      border: none;
      border-radius: 8px;
      padding: 0.6rem 1.25rem;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      white-space: nowrap;
    }
    .cc-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .cc-btn-accept {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
    }
    .cc-btn-reject {
      background: rgba(255,255,255,0.1);
      color: #ccc;
      border: 1px solid rgba(255,255,255,0.15);
    }
    @media (max-width: 600px) {
      .cc-content { flex-direction: column; text-align: center; }
      .cc-actions { width: 100%; justify-content: center; }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(banner);

  // Accept handler
  document.getElementById('cc-accept').addEventListener('click', function () {
    localStorage.setItem(CONSENT_KEY, CONSENT_VERSION);
    banner.style.animation = 'cc-slide-down 0.3s ease-in forwards';
    setTimeout(function () { banner.remove(); }, 300);
  });

  // Reject handler — disable non-essential cookies (GA + AdSense)
  document.getElementById('cc-reject').addEventListener('click', function () {
    localStorage.setItem(CONSENT_KEY, CONSENT_VERSION);
    // Disable GA tracking
    window['ga-disable-G-QPDP38ZCCV'] = true;
    banner.style.animation = 'cc-slide-down 0.3s ease-in forwards';
    setTimeout(function () { banner.remove(); }, 300);
  });

  // Add slide-down animation
  const slideDown = document.createElement('style');
  slideDown.textContent = `
    @keyframes cc-slide-down {
      from { transform: translateY(0); opacity: 1; }
      to { transform: translateY(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(slideDown);
})();
