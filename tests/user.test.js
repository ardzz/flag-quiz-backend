const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

describe('User API', () => {
  let playerToken;
  let userId;

  beforeAll(async () => {
    // Login to get token
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'player@flaggame.com',
        password: 'player123',
      });
    playerToken = response.body.data.tokens.accessToken;
    userId = response.body.data.user.id;
  });

  afterAll(async () => {
    await db.end();
  });

  describe('GET /api/v1/users/profile', () => {
    test('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${playerToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('username');
      expect(response.body.data).not.toHaveProperty('password');
    });

    test('should fail without token', async () => {
      const response = await request(app).get('/api/v1/users/profile');

      expect(response.statusCode).toBe(401);
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    test('should update user profile', async () => {
      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          username: 'updatedplayer',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should fail with invalid username', async () => {
      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          username: 'ab', // Too short
        });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    test('should get user by ID', async () => {
      const response = await request(app).get(`/api/v1/users/${userId}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', userId);
      expect(response.body.data).not.toHaveProperty('password');
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app).get(`/api/v1/users/${fakeId}`);

      expect(response.statusCode).toBe(404);
    });

    test('should fail with invalid UUID', async () => {
      const response = await request(app).get('/api/v1/users/invalid-id');

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/users/:id/statistics', () => {
    test('should get user statistics', async () => {
      const response = await request(app).get(`/api/v1/users/${userId}/statistics`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalGames');
      expect(response.body.data).toHaveProperty('correctAnswers');
      expect(response.body.data).toHaveProperty('averageScore');
    });
  });

  describe('GET /api/v1/users/:id/achievements', () => {
    test('should get user achievements', async () => {
      const response = await request(app).get(`/api/v1/users/${userId}/achievements`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
