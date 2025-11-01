const db = require('../src/config/database');

// Global test setup
beforeAll(async () => {
  // Ensure test database is properly connected
  try {
    await db.query('SELECT 1');
    console.log('✓ Test database connected');
  } catch (error) {
    console.error('✗ Test database connection failed:', error.message);
    throw error;
  }
});

// Global test teardown
afterAll(async () => {
  // Close all database connections
  await db.end();
  console.log('✓ Test database connections closed');
});

// Increase timeout for integration tests
jest.setTimeout(30000);

// Suppress console logs during tests (optional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: console.error,
};
