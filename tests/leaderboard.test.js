const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

describe('Leaderboard API', () => {
  afterAll(async () => {
    await db.end();
  });

  describe('GET /api/v1/leaderboard/daily', () => {
    test('should get daily leaderboard', async () => {
      const response = await request(app)
        .get('/api/v1/leaderboard/daily')
        .query({ limit: 10 });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/leaderboard/daily')
        .query({ limit: 5 });

      expect(response.statusCode).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    test('should filter by continent', async () => {
      const response = await request(app)
        .get('/api/v1/leaderboard/daily')
        .query({ continent: 1, limit: 10 });

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should use default limit if not provided', async () => {
      const response = await request(app).get('/api/v1/leaderboard/daily');

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/leaderboard/weekly', () => {
    test('should get weekly leaderboard', async () => {
      const response = await request(app)
        .get('/api/v1/leaderboard/weekly')
        .query({ limit: 10 });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should contain required fields', async () => {
      const response = await request(app)
        .get('/api/v1/leaderboard/weekly')
        .query({ limit: 1 });

      if (response.body.data.length > 0) {
        const entry = response.body.data[0];
        expect(entry).toHaveProperty('user_id');
        expect(entry).toHaveProperty('score');
        expect(entry).toHaveProperty('rank');
      }
    });
  });

  describe('GET /api/v1/leaderboard/monthly', () => {
    test('should get monthly leaderboard', async () => {
      const response = await request(app)
        .get('/api/v1/leaderboard/monthly')
        .query({ limit: 10 });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should handle invalid limit', async () => {
      const response = await request(app)
        .get('/api/v1/leaderboard/monthly')
        .query({ limit: -1 });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/leaderboard/all-time', () => {
    test('should get all-time leaderboard', async () => {
      const response = await request(app)
        .get('/api/v1/leaderboard/all-time')
        .query({ limit: 100 });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should be sorted by score descending', async () => {
      const response = await request(app)
        .get('/api/v1/leaderboard/all-time')
        .query({ limit: 10 });

      if (response.body.data.length > 1) {
        const scores = response.body.data.map(entry => entry.score);
        const sortedScores = [...scores].sort((a, b) => b - a);
        expect(scores).toEqual(sortedScores);
      }
    });
  });

  describe('GET /api/v1/leaderboard/user/:userId', () => {
    let userId;

    beforeAll(async () => {
      // Get a user ID
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'player@flaggame.com',
          password: 'player123',
        });
      userId = response.body.data.user.id;
    });

    test('should get user ranks', async () => {
      const response = await request(app).get(`/api/v1/leaderboard/user/${userId}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('daily');
      expect(response.body.data).toHaveProperty('weekly');
      expect(response.body.data).toHaveProperty('monthly');
      expect(response.body.data).toHaveProperty('allTime');
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app).get(`/api/v1/leaderboard/user/${fakeId}`);

      expect(response.statusCode).toBe(404);
    });

    test('should fail with invalid UUID', async () => {
      const response = await request(app).get('/api/v1/leaderboard/user/invalid-id');

      expect(response.statusCode).toBe(400);
    });
  });
});
