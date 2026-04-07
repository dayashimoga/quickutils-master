import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    testTimeout: 2000,
    globals: true,
    environment: 'jsdom',
    include: ['projects/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['./tests/jsdom-setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['projects/**/*.js', 'shared/**/*.js'],
      exclude: ['**/dist/**', '**/tests/**', '**/*.test.js', '**/package.json', '**/README.md']
    },
    deps: {
      inline: [/quickutils/]
    }
  }
});
