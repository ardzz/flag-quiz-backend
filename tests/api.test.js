const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

describe('API Health and General Tests', () => {
  afterAll(async () => {
    await db.end();
  });

  describe('Health Checks', () => {
    test('GET /health should return 200', async () => {
      const response = await request(app).get('/health');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET / should return API info', async () => {
      const response = await request(app).get('/');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('Error Handling', () => {
    test('GET /unknown-route should return 404', async () => {
      const response = await request(app).get('/unknown-route');
      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.statusCode).toBe(400);
    });
  });

  describe('CORS and Security Headers', () => {
    test('should have CORS headers', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    test('should have security headers', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('Swagger Documentation', () => {
    test('GET /api-docs should return Swagger UI', async () => {
      const response = await request(app).get('/api-docs/');
      
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });

    test('GET /api-docs.json should return OpenAPI spec', async () => {
      const response = await request(app).get('/api-docs.json');
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('openapi');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('paths');
    });
  });
});
