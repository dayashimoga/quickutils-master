module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/tests/web-chess.test.js', '**/tests/speed-test.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary'],
  collectCoverageFrom: [
    'projects/speed-test/script.js'
  ]
};
