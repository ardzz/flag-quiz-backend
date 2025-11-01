// Set NODE_ENV to test before anything else loads
process.env.NODE_ENV = 'test';

// Load test environment variables
require('dotenv').config({ path: '.env.test' });
