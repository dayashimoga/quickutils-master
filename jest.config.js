module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '**/tests/web-chess.test.js', 
    '**/tests/speed-test.test.js',
    '**/tests/solar-system.test.js',
    '**/tests/country-explorer.test.js',
    '**/tests/sound-board.test.js'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary'],
  collectCoverageFrom: [
    'projects/speed-test/script.js',
    'projects/solar-system/script.js',
    'projects/country-explorer/script.js',
    'projects/sound-board/script.js'
  ]
};
