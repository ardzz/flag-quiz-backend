const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const gameController = require('../controllers/game.controller');
const { authenticateToken, requireEmailVerified } = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');

/**
 * @swagger
 * /api/v1/games:
 *   post:
 *     summary: Create a new game
 *     description: Creates a new game. Players cannot create a new game if they have an in-progress game. They must complete or abandon the current game first.
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               templateId:
 *                 type: string
 *                 format: uuid
 *                 description: Game template ID (optional)
 *               customOptions:
 *                 type: object
 *                 properties:
 *                   continentId:
 *                     type: integer
 *                     example: 1
 *                   numberOfFlags:
 *                     type: integer
 *                     example: 10
 *                   timePerFlag:
 *                     type: integer
 *                     example: 30
 *                   difficulty:
 *                     type: string
 *                     enum: [easy, medium, hard]
 *                     example: medium
 *     responses:
 *       201:
 *         description: Game created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Game'
 *       400:
 *         description: Bad request - User already has a game in progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: You already have a game in progress. Please complete or abandon it before starting a new one.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/',
  authenticateToken,
  requireEmailVerified,
  [
    body('templateId').optional().isUUID().withMessage('Invalid template ID'),
    body('customOptions').optional().isObject().withMessage('Custom options must be an object'),
  ],
  validate,
  gameController.createGame
);

/**
 * @swagger
 * /api/v1/games:
 *   get:
 *     summary: Get user's game history
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [in_progress, completed, abandoned]
 *     responses:
 *       200:
 *         description: User's games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     games:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Game'
 *                     pagination:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authenticateToken, gameController.getUserGames);

/**
 * @swagger
 * /api/v1/games/{gameId}:
 *   get:
 *     summary: Get game details
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Game details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Game'
 *                     - type: object
 *                       properties:
 *                         unanswered_count:
 *                           type: integer
 *                           description: Number of unanswered questions
 *                           example: 5
 *                         nextUnansweredQuestion:
 *                           type: object
 *                           nullable: true
 *                           description: Next unanswered question info (null if all answered)
 *                           properties:
 *                             questionId:
 *                               type: string
 *                               format: uuid
 *                             questionNumber:
 *                               type: integer
 *                               example: 3
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:gameId',
  authenticateToken,
  [param('gameId').isUUID().withMessage('Invalid game ID')],
  validate,
  gameController.getGame
);

/**
 * @swagger
 * /api/v1/games/{gameId}/question/{number}:
 *   get:
 *     summary: Get specific question in game
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: number
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Question number (1-based)
 *     responses:
 *       200:
 *         description: Question details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:gameId/question/:number',
  authenticateToken,
  [
    param('gameId').isUUID().withMessage('Invalid game ID'),
    param('number').isInt({ min: 1 }).withMessage('Invalid question number'),
  ],
  validate,
  gameController.getQuestion
);

/**
 * @swagger
 * /api/v1/games/{gameId}/next-unanswered:
 *   get:
 *     summary: Get next unanswered question in game
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Next unanswered question or status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     hasUnanswered:
 *                       type: boolean
 *                       description: Whether there are unanswered questions
 *                       example: true
 *                     question:
 *                       type: object
 *                       description: Next unanswered question (only if hasUnanswered is true)
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         questionNumber:
 *                           type: integer
 *                           example: 3
 *                         flagUrl:
 *                           type: string
 *                         options:
 *                           type: array
 *                           items:
 *                             type: object
 *                         timeLimit:
 *                           type: integer
 *                     message:
 *                       type: string
 *                       description: Message when no unanswered questions (only if hasUnanswered is false)
 *                       example: All questions have been answered
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:gameId/next-unanswered',
  authenticateToken,
  [param('gameId').isUUID().withMessage('Invalid game ID')],
  validate,
  gameController.getNextUnansweredQuestion
);

/**
 * @swagger
 * /api/v1/games/{gameId}/questions/{questionId}/answer:
 *   post:
 *     summary: Submit answer for a question
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answerId
 *               - timeTaken
 *             properties:
 *               answerId:
 *                 type: integer
 *                 description: Selected country ID
 *                 example: 1
 *               timeTaken:
 *                 type: integer
 *                 description: Time taken in seconds
 *                 minimum: 0
 *                 example: 15
 *     responses:
 *       200:
 *         description: Answer submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     isCorrect:
 *                       type: boolean
 *                       description: Whether the answer was correct
 *                       example: true
 *                     correctAnswerId:
 *                       type: integer
 *                       description: The ID of the correct country
 *                       example: 45
 *                     points:
 *                       type: integer
 *                       description: Points earned for this answer
 *                       example: 85
 *                     totalScore:
 *                       type: integer
 *                       description: Updated total game score
 *                       example: 85
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/:gameId/questions/:questionId/answer',
  authenticateToken,
  requireEmailVerified,
  [
    param('gameId').isUUID().withMessage('Invalid game ID'),
    param('questionId').isUUID().withMessage('Invalid question ID'),
    body('answerId').isInt().withMessage('Answer ID must be an integer'),
    body('timeTaken').isInt({ min: 0 }).withMessage('Time taken must be a positive integer'),
  ],
  validate,
  gameController.submitAnswer
);

/**
 * @swagger
 * /api/v1/games/{gameId}/complete:
 *   post:
 *     summary: Complete a game
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Game completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     game:
 *                       $ref: '#/components/schemas/Game'
 *                     achievements:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  '/:gameId/complete',
  authenticateToken,
  requireEmailVerified,
  [param('gameId').isUUID().withMessage('Invalid game ID')],
  validate,
  gameController.completeGame
);

/**
 * @swagger
 * /api/v1/games/{gameId}/abandon:
 *   put:
 *     summary: Abandon a game
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Game abandoned
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/:gameId/abandon',
  authenticateToken,
  [param('gameId').isUUID().withMessage('Invalid game ID')],
  validate,
  gameController.abandonGame
);

module.exports = router;
