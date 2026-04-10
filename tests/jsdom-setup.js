import { vi } from 'vitest';
global.jest = {
    ...vi,
    resetModules: () => {
        vi.resetModules();
        if (typeof require !== 'undefined' && require.cache) {
            Object.keys(require.cache).forEach(key => delete require.cache[key]);
        }
    },
    isolateModules: (fn) => {
        global.jest.resetModules();
        fn();
    }
};
window.jest = global.jest;

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: vi.fn(key => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock requestAnimationFrame
window.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));
window.cancelAnimationFrame = vi.fn(id => clearTimeout(id));

// Mock MatchMedia
window.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

if (!window.AudioContext && !window.webkitAudioContext) {
  window.AudioContext = vi.fn().mockImplementation(() => ({
    createAnalyser: vi.fn(() => ({ connect: vi.fn(), fftSize: 256, frequencyBinCount: 128, getByteFrequencyData: vi.fn() })),
    createMediaElementSource: vi.fn(() => ({ connect: vi.fn() })),
    destination: {},
    resume: vi.fn()
  }));
}

// Ensure simple global objects are available
window.QU = undefined; 

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = function () {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    stroke: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    strokeRect: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    drawImage: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    scale: vi.fn(),
    translate: vi.fn(),
    canvas: this
  };
};
HTMLCanvasElement.prototype.toDataURL = vi.fn();

// Mock Media Elements
window.HTMLMediaElement.prototype.play = vi.fn();
window.HTMLMediaElement.prototype.pause = vi.fn();
window.HTMLMediaElement.prototype.load = vi.fn();

// Mock Dialogs and scroll
window.alert = vi.fn();
window.confirm = vi.fn(() => true);
window.prompt = vi.fn();
window.scrollTo = vi.fn();

// Prevent JSDOM navigation errors
window.addEventListener('click', e => {
  if (e.target.tagName === 'A' || e.target.closest('a')) {
    e.preventDefault();
  }
}, true);
window.HTMLFormElement.prototype.submit = vi.fn();

// Capture form submissions centrally to prevent navigation if script misses e.preventDefault()
window.addEventListener('submit', e => {
    e.preventDefault();
}, true);

// completely mock window.location to prevent "Not implemented: navigation"
// Some versions of JS dom don't allow redefining location. 
// Instead, catch the unhandled rejection / exception.
if (typeof process !== 'undefined') {
    const ignoreNavigationError = (err) => {
        if (err && err.message && err.message.includes('Not implemented: navigation')) {
            return true;
        }
        return false;
    };
    
    const originalEmit = process.emit;
    process.emit = function(event, error) {
        if ((event === 'uncaughtException' || event === 'unhandledRejection') && ignoreNavigationError(error)) {
            return true; // Return true to indicate the event was handled and shouldn't crash
        }
        return originalEmit.apply(this, arguments);
    };
}

// Ensure unattached anchor elements don't trigger JSDOM navigation when clicked programmatically
const originalClick = window.HTMLElement.prototype.click;
window.HTMLElement.prototype.click = function() {
    if (this.tagName === 'A') {
        return; // Prevent 'Not implemented: navigation' from unattached <a> elements
    }
    return originalClick.apply(this, arguments);
};
