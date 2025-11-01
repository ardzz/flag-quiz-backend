const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

describe('Game Templates API', () => {
  let adminToken;
  let playerToken;
  let templateId;

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
  });

  afterAll(async () => {
    // Cleanup created template
    if (templateId) {
      await db.query('DELETE FROM game_templates WHERE id = $1', [templateId]);
    }
    await db.end();
  });

  describe('GET /api/v1/game-templates', () => {
    test('should get all game templates', async () => {
      const response = await request(app).get('/api/v1/game-templates');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('number_of_flags');
      expect(response.body.data[0]).toHaveProperty('difficulty');
    });
  });

  describe('GET /api/v1/game-templates/continent/:continentId', () => {
    test('should get templates by continent', async () => {
      const response = await request(app).get('/api/v1/game-templates/continent/1');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should return empty array for continent with no templates', async () => {
      const response = await request(app).get('/api/v1/game-templates/continent/99');

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/game-templates', () => {
    test('should create new template as authenticated user', async () => {
      const response = await request(app)
        .post('/api/v1/game-templates')
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          name: 'Test Custom Template',
          description: 'A test template',
          continentId: 1,
          numberOfFlags: 10,
          timePerFlag: 30,
          difficulty: 'medium',
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      templateId = response.body.data.id;
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/game-templates')
        .send({
          name: 'Test Template',
          numberOfFlags: 10,
          timePerFlag: 30,
          difficulty: 'medium',
        });

      expect(response.statusCode).toBe(401);
    });

    test('should fail with invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/game-templates')
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          name: 'Te', // Too short
          numberOfFlags: 100, // Too many
          timePerFlag: 5, // Too short
          difficulty: 'invalid',
        });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('PUT /api/v1/game-templates/:id', () => {
    test('should update template', async () => {
      if (!templateId) {
        // Create template first
        const createResponse = await request(app)
          .post('/api/v1/game-templates')
          .set('Authorization', `Bearer ${playerToken}`)
          .send({
            name: 'Template to Update',
            numberOfFlags: 10,
            timePerFlag: 30,
            difficulty: 'medium',
          });
        templateId = createResponse.body.data.id;
      }

      const response = await request(app)
        .put(`/api/v1/game-templates/${templateId}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          name: 'Updated Template Name',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/game-templates/${templateId}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/v1/game-templates/:id', () => {
    test('should delete template', async () => {
      if (!templateId) {
        // Create template first
        const createResponse = await request(app)
          .post('/api/v1/game-templates')
          .set('Authorization', `Bearer ${playerToken}`)
          .send({
            name: 'Template to Delete',
            numberOfFlags: 10,
            timePerFlag: 30,
            difficulty: 'medium',
          });
        templateId = createResponse.body.data.id;
      }

      const response = await request(app)
        .delete(`/api/v1/game-templates/${templateId}`)
        .set('Authorization', `Bearer ${playerToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      
      templateId = null; // Mark as deleted
    });

    test('should fail without authentication', async () => {
      const response = await request(app).delete('/api/v1/game-templates/some-id');

      expect(response.statusCode).toBe(401);
    });
  });
});
