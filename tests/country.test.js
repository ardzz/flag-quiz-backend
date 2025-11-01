const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

describe('Countries API', () => {
  afterAll(async () => {
    await db.end();
  });

  describe('GET /api/v1/countries', () => {
    test('should get all countries with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/countries')
        .query({ page: 1, limit: 10 });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('countries');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.countries)).toBe(true);
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 10);
    });

    test('should filter by continent', async () => {
      const response = await request(app)
        .get('/api/v1/countries')
        .query({ continent: 1 }); // Africa

      expect(response.statusCode).toBe(200);
      expect(response.body.data.countries.every(c => c.continent_id === 1)).toBe(true);
    });

    test('should handle invalid page number', async () => {
      const response = await request(app)
        .get('/api/v1/countries')
        .query({ page: -1 });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/countries/continent/:continentId', () => {
    test('should get countries by continent', async () => {
      const response = await request(app).get('/api/v1/countries/continent/1');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every(c => c.continent_id === 1)).toBe(true);
    });

    test('should return empty array for continent with no countries', async () => {
      const response = await request(app).get('/api/v1/countries/continent/99');

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    test('should validate continent ID', async () => {
      const response = await request(app).get('/api/v1/countries/continent/invalid');

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/countries/random', () => {
    test('should get random countries', async () => {
      const response = await request(app)
        .get('/api/v1/countries/random')
        .query({ count: 5 });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    test('should filter random countries by continent', async () => {
      const response = await request(app)
        .get('/api/v1/countries/random')
        .query({ count: 3, continent: 3 }); // Europe

      expect(response.statusCode).toBe(200);
      expect(response.body.data.every(c => c.continent_id === 3)).toBe(true);
    });

    test('should use default count if not provided', async () => {
      const response = await request(app).get('/api/v1/countries/random');

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/countries/:id', () => {
    test('should get country by ID', async () => {
      const response = await request(app).get('/api/v1/countries/1');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', 1);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('flag_url');
      expect(response.body.data).toHaveProperty('continent_id');
    });

    test('should return 404 for non-existent country', async () => {
      const response = await request(app).get('/api/v1/countries/99999');

      expect(response.statusCode).toBe(404);
    });

    test('should validate country ID', async () => {
      const response = await request(app).get('/api/v1/countries/invalid');

      expect(response.statusCode).toBe(400);
    });
  });
});
