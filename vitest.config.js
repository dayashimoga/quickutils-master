import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/jsdom-setup.js'],
    include: [
      'tests/web-chess.test.js',
      'tests/speed-test.test.js',
      'tests/solar-system.test.js',
      'tests/country-explorer.test.js',
      'tests/sound-board.test.js'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'xml', 'html'],
      include: [
        'projects/web-chess/script.js',
        'projects/speed-test/script.js',
        'projects/solar-system/script.js',
        'projects/country-explorer/script.js',
        'projects/sound-board/script.js'
      ]
    }
  }
});
