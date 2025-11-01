# Test Suite Documentation

## Overview

Comprehensive unit and integration tests for the Flag Guesser Game API using Jest and Supertest.

## Test Structure

```
tests/
├── setup.js              # Global test configuration
├── api.test.js          # Health checks and general API tests
├── auth.test.js         # Authentication tests
├── user.test.js         # User management tests
├── country.test.js      # Country data tests
├── game.test.js         # Game logic tests
├── gameTemplate.test.js # Game template tests
├── leaderboard.test.js  # Leaderboard tests
└── admin.test.js        # Admin functionality tests
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test file
```bash
npm test auth.test.js
```

### Run with coverage
```bash
npm run test:coverage
```

### Watch mode
```bash
npm run test:watch
```

## Test Coverage

Current coverage targets:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Test Features

### 1. Authentication Tests (`auth.test.js`)
- ✅ User registration
- ✅ Login with valid/invalid credentials
- ✅ Token refresh
- ✅ Logout
- ✅ Email validation
- ✅ Password strength validation

### 2. User Tests (`user.test.js`)
- ✅ Get user profile
- ✅ Update user profile
- ✅ Get user by ID
- ✅ Get user statistics
- ✅ Get user achievements
- ✅ Authorization checks

### 3. Country Tests (`country.test.js`)
- ✅ Get all countries with pagination
- ✅ Filter by continent
- ✅ Get random countries
- ✅ Get country by ID
- ✅ Input validation

### 4. Game Tests (`game.test.js`)
- ✅ Create game from template
- ✅ Create game with custom options
- ✅ Create game with defaults
- ✅ Get user games
- ✅ Get game details
- ✅ Get questions
- ✅ Submit answers
- ✅ Complete game
- ✅ Abandon game

### 5. Game Template Tests (`gameTemplate.test.js`)
- ✅ Get all templates
- ✅ Filter by continent
- ✅ Create custom template
- ✅ Update template
- ✅ Delete template
- ✅ Permission checks

### 6. Leaderboard Tests (`leaderboard.test.js`)
- ✅ Daily leaderboard
- ✅ Weekly leaderboard
- ✅ Monthly leaderboard
- ✅ All-time leaderboard
- ✅ User ranks
- ✅ Pagination and filtering

### 7. Admin Tests (`admin.test.js`)
- ✅ Get all users
- ✅ Get user details
- ✅ Update user
- ✅ Get all games
- ✅ Platform statistics
- ✅ Admin-only access control

## Test Data

### Dummy Users

The tests use pre-seeded users:

**Admin:**
- Email: `admin@flaggame.com`
- Password: `admin123`
- Role: admin

**Player:**
- Email: `player@flaggame.com`
- Password: `player123`
- Role: player

### Test Database

Tests run against the development database. Make sure:
1. Database is running
2. Migrations are applied
3. Seeds are loaded

## Best Practices

### 1. Test Isolation
Each test suite cleans up after itself using `afterAll()` hooks.

### 2. Authentication
Tests obtain fresh tokens for each test suite to ensure valid authentication.

### 3. Data Cleanup
Created test data (games, templates, etc.) is deleted after tests complete.

### 4. Async/Await
All tests use async/await for better readability and error handling.

### 5. Descriptive Names
Test descriptions clearly state what is being tested.

## Common Test Patterns

### Testing Protected Endpoints
```javascript
test('should fail without authentication', async () => {
  const response = await request(app).get('/api/v1/protected-endpoint');
  expect(response.statusCode).toBe(401);
});
```

### Testing Validation
```javascript
test('should fail with invalid data', async () => {
  const response = await request(app)
    .post('/api/v1/endpoint')
    .send({ invalid: 'data' });
  expect(response.statusCode).toBe(400);
});
```

### Testing Pagination
```javascript
test('should support pagination', async () => {
  const response = await request(app)
    .get('/api/v1/endpoint')
    .query({ page: 1, limit: 10 });
  expect(response.body.data).toHaveProperty('pagination');
});
```

## Troubleshooting

### Tests Timing Out
Increase timeout in `jest.config.js`:
```javascript
testTimeout: 60000 // 60 seconds
```

### Database Connection Issues
Ensure:
```bash
# Check if database is running
docker-compose ps

# Check environment variables
cat .env
```

### Token Expiration
Tests obtain fresh tokens, but if issues persist, check JWT expiry settings.

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run tests
  run: npm test
  env:
    NODE_ENV: test
    DB_HOST: localhost
    DB_USER: test_user
```

## Coverage Reports

After running tests with coverage:
```bash
npm run test:coverage
```

View the report:
- Console output: Terminal
- HTML report: `coverage/lcov-report/index.html`
- LCOV file: `coverage/lcov.info`

## Future Improvements

- [ ] Add performance tests
- [ ] Add load testing
- [ ] Mock external services
- [ ] Add E2E tests
- [ ] Increase coverage to 90%

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Ensure all tests pass
3. Maintain coverage above 70%
4. Follow existing test patterns
5. Clean up test data

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
