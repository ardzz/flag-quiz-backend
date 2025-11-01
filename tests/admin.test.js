const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

describe('Admin API', () => {
  let adminToken;
  let playerToken;
  let userId;

  beforeAll(async () => {
    // Login as admin
    const adminResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@flaggame.com',
        password: 'admin123',
      });
    adminToken = adminResponse.body.data.tokens.accessToken;

    // Login as player
    const playerResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'player@flaggame.com',
        password: 'player123',
      });
    playerToken = playerResponse.body.data.tokens.accessToken;
    userId = playerResponse.body.data.user.id;
  });

  describe('GET /api/v1/admin/users', () => {
    test('should get all users as admin', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    test('should fail for non-admin user', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${playerToken}`);

      expect(response.statusCode).toBe(403);
    });

    test('should fail without authentication', async () => {
      const response = await request(app).get('/api/v1/admin/users');

      expect(response.statusCode).toBe(401);
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 5 });

      expect(response.statusCode).toBe(200);
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 5);
    });
  });

  describe('GET /api/v1/admin/users/:id', () => {
    test('should get user details as admin', async () => {
      const response = await request(app)
        .get(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', userId);
    });

    test('should fail for non-admin', async () => {
      const response = await request(app)
        .get(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${playerToken}`);

      expect(response.statusCode).toBe(403);
    });
  });

  describe('PUT /api/v1/admin/users/:id', () => {
    test('should update user as admin', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: true,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should fail for non-admin', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          isActive: false,
        });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/v1/admin/users/:id', () => {
    test('should fail to delete non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/v1/admin/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
    });

    test('should fail for non-admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${playerToken}`);

      expect(response.statusCode).toBe(403);
    });
  });

  describe('GET /api/v1/admin/games', () => {
    test('should get all games as admin', async () => {
      const response = await request(app)
        .get('/api/v1/admin/games')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('games');
      expect(Array.isArray(response.body.data.games)).toBe(true);
    });

    test('should fail for non-admin', async () => {
      const response = await request(app)
        .get('/api/v1/admin/games')
        .set('Authorization', `Bearer ${playerToken}`);

      expect(response.statusCode).toBe(403);
    });
  });

  describe('GET /api/v1/admin/statistics', () => {
    test('should get platform statistics as admin', async () => {
      const response = await request(app)
        .get('/api/v1/admin/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('totalGames');
      expect(response.body.data).toHaveProperty('activeUsers');
    });

    test('should fail for non-admin', async () => {
      const response = await request(app)
        .get('/api/v1/admin/statistics')
        .set('Authorization', `Bearer ${playerToken}`);

      expect(response.statusCode).toBe(403);
    });
  });
});
