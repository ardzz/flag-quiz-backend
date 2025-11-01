const db = require('../src/config/database');
const seedTestData = require('../scripts/seed-test-data');

// Global test setup
beforeAll(async () => {
  // Ensure test database is properly connected
  try {
    await db.query('SELECT 1');
    console.log('✓ Test database connected');
    
    // Seed test data
    console.log('\nSeeding test data...');
    await seedTestData();
    
  } catch (error) {
    console.error('✗ Test setup failed:', error.message);
    throw error;
  }
});

// Global test teardown - only close once at the very end
afterAll(async () => {
  // Close all database connections
  try {
    await db.end();
    console.log('✓ Test database connections closed');
  } catch (error) {
    // Ignore error if pool already closed
    if (!error.message.includes('Called end on pool more than once')) {
      console.error('Error closing database:', error.message);
    }
  }
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
