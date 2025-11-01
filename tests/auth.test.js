const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

describe('Authentication API', () => {
  let adminToken;
  let playerToken;
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'Test123!@#',
    username: `testuser${Date.now()}`,
  };

  afterAll(async () => {
    // Cleanup
    if (testUser.email) {
      await db.query('DELETE FROM users WHERE email = $1', [testUser.email]);
    }
  });

  describe('POST /api/v1/auth/register', () => {
    test('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    test('should fail with duplicate email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123!@#',
          username: 'testuser',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          username: 'testuser',
        });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'player@flaggame.com',
          password: 'player123',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
      
      playerToken = response.body.data.tokens.accessToken;
    });

    test('should login as admin', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@flaggame.com',
          password: 'admin123',
        });

      expect(response.statusCode).toBe(200);
      adminToken = response.body.data.tokens.accessToken;
    });

    test('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'player@flaggame.com',
          password: 'wrongpassword',
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    let refreshToken;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'player@flaggame.com',
          password: 'player123',
        });
      refreshToken = response.body.data.tokens.refreshToken;
    });

    test('should refresh access token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken });

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    test('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${playerToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

module.exports = { getAuthToken: () => playerToken };
