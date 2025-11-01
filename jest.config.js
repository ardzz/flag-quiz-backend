module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
  ],
  testMatch: [
    '**/tests/**/*.test.js',
  ],
  verbose: true,
};
