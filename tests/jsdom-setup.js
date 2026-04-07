import { vi } from 'vitest';

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
