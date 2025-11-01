const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

describe('Game API', () => {
  let playerToken;
  let gameId;
  let questionId;
  let templateId;

  beforeAll(async () => {
    // Login as player
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'player@flaggame.com',
        password: 'player123',
      });
    playerToken = response.body.data.tokens.accessToken;

    // Get a template ID
    const templatesResponse = await request(app).get('/api/v1/game-templates');
    templateId = templatesResponse.body.data[0].id;
  });

  afterAll(async () => {
    // Cleanup
    if (gameId) {
      await db.query('DELETE FROM game_questions WHERE game_id = $1', [gameId]);
      await db.query('DELETE FROM games WHERE id = $1', [gameId]);
    }
  });

  describe('POST /api/v1/games', () => {
    test('should create game from template', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          templateId,
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('status', 'in_progress');
      expect(response.body.data).toHaveProperty('currentQuestion');
      
      gameId = response.body.data.id;
      questionId = response.body.data.currentQuestion.id;
    });

    test('should create game with custom options', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          customOptions: {
            continentId: 1,
            numberOfFlags: 5,
            timePerFlag: 30,
            difficulty: 'easy',
          },
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('difficulty', 'easy');
      
      // Cleanup this game
      const newGameId = response.body.data.id;
      await db.query('DELETE FROM game_questions WHERE game_id = $1', [newGameId]);
      await db.query('DELETE FROM games WHERE id = $1', [newGameId]);
    });

    test('should create game with defaults', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .set('Authorization', `Bearer ${playerToken}`)
        .send({});

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      
      // Cleanup
      const newGameId = response.body.data.id;
      await db.query('DELETE FROM game_questions WHERE game_id = $1', [newGameId]);
      await db.query('DELETE FROM games WHERE id = $1', [newGameId]);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .send({ templateId });

      expect(response.statusCode).toBe(401);
    });

    test('should fail with invalid template ID', async () => {
      const response = await request(app)
        .post('/api/v1/games')
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          templateId: '00000000-0000-0000-0000-000000000000',
        });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/games', () => {
    test('should get user games', async () => {
      const response = await request(app)
        .get('/api/v1/games')
        .set('Authorization', `Bearer ${playerToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('games');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.games)).toBe(true);
    });

    test('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/games')
        .set('Authorization', `Bearer ${playerToken}`)
        .query({ status: 'in_progress' });

      expect(response.statusCode).toBe(200);
      expect(response.body.data.games.every(g => g.status === 'in_progress')).toBe(true);
    });

    test('should fail without authentication', async () => {
      const response = await request(app).get('/api/v1/games');

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/games/:gameId', () => {
    test('should get game details', async () => {
      const response = await request(app)
        .get(`/api/v1/games/${gameId}`)
        .set('Authorization', `Bearer ${playerToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', gameId);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('score');
    });

    test('should fail for non-existent game', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/games/${fakeId}`)
        .set('Authorization', `Bearer ${playerToken}`);

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/games/:gameId/question/:number', () => {
    test('should get specific question', async () => {
      const response = await request(app)
        .get(`/api/v1/games/${gameId}/question/1`)
        .set('Authorization', `Bearer ${playerToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('questionNumber', 1);
      expect(response.body.data).toHaveProperty('flagUrl');
      expect(response.body.data).toHaveProperty('options');
      expect(Array.isArray(response.body.data.options)).toBe(true);
      expect(response.body.data.options.length).toBe(4);
    });

    test('should fail for invalid question number', async () => {
      const response = await request(app)
        .get(`/api/v1/games/${gameId}/question/999`)
        .set('Authorization', `Bearer ${playerToken}`);

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/v1/games/:gameId/questions/:questionId/answer', () => {
    test('should submit answer', async () => {
      // Get question to find a valid answer ID
      const questionResponse = await request(app)
        .get(`/api/v1/games/${gameId}/question/1`)
        .set('Authorization', `Bearer ${playerToken}`);
      
      const answerId = questionResponse.body.data.options[0].id;

      const response = await request(app)
        .post(`/api/v1/games/${gameId}/questions/${questionId}/answer`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          answerId,
          timeTaken: 15,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('correct');
      expect(response.body.data).toHaveProperty('pointsEarned');
    });

    test('should fail with invalid answer ID', async () => {
      const response = await request(app)
        .post(`/api/v1/games/${gameId}/questions/${questionId}/answer`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          answerId: 'invalid',
          timeTaken: 15,
        });

      expect(response.statusCode).toBe(400);
    });

    test('should fail with negative time', async () => {
      const response = await request(app)
        .post(`/api/v1/games/${gameId}/questions/${questionId}/answer`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          answerId: 1,
          timeTaken: -5,
        });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('PUT /api/v1/games/:gameId/abandon', () => {
    test('should abandon game', async () => {
      // Create a new game to abandon
      const createResponse = await request(app)
        .post('/api/v1/games')
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ templateId });

      const abandonGameId = createResponse.body.data.id;

      const response = await request(app)
        .put(`/api/v1/games/${abandonGameId}/abandon`)
        .set('Authorization', `Bearer ${playerToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Cleanup
      await db.query('DELETE FROM game_questions WHERE game_id = $1', [abandonGameId]);
      await db.query('DELETE FROM games WHERE id = $1', [abandonGameId]);
    });
  });

  describe('POST /api/v1/games/:gameId/complete', () => {
    test('should complete game', async () => {
      // Create and answer all questions in a new game
      const createResponse = await request(app)
        .post('/api/v1/games')
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          customOptions: {
            numberOfFlags: 2, // Small game for testing
            timePerFlag: 30,
            difficulty: 'easy',
          },
        });

      const completeGameId = createResponse.body.data.id;

      // Answer all questions
      const questionsResponse = await db.query(
        'SELECT id FROM game_questions WHERE game_id = $1 ORDER BY question_number',
        [completeGameId]
      );

      for (const question of questionsResponse.rows) {
        await request(app)
          .post(`/api/v1/games/${completeGameId}/questions/${question.id}/answer`)
          .set('Authorization', `Bearer ${playerToken}`)
          .send({
            answerId: 1,
            timeTaken: 10,
          });
      }

      // Complete the game
      const response = await request(app)
        .post(`/api/v1/games/${completeGameId}/complete`)
        .set('Authorization', `Bearer ${playerToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('game');
      expect(response.body.data.game).toHaveProperty('status', 'completed');
      
      // Cleanup
      await db.query('DELETE FROM game_questions WHERE game_id = $1', [completeGameId]);
      await db.query('DELETE FROM games WHERE id = $1', [completeGameId]);
    });

    test('should fail if not all questions answered', async () => {
      const response = await request(app)
        .post(`/api/v1/games/${gameId}/complete`)
        .set('Authorization', `Bearer ${playerToken}`);

      expect(response.statusCode).toBe(400);
    });
  });
});
