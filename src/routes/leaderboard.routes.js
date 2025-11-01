const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboard.controller');

/**
 * @swagger
 * /api/v1/leaderboard/daily:
 *   get:
 *     summary: Get daily leaderboard
 *     tags: [Leaderboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top players to return
 *       - in: query
 *         name: continent
 *         schema:
 *           type: integer
 *         description: Filter by continent ID (optional)
 *     responses:
 *       200:
 *         description: Daily leaderboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaderboardEntry'
 */
router.get('/daily', leaderboardController.getDailyLeaderboard);

/**
 * @swagger
 * /api/v1/leaderboard/weekly:
 *   get:
 *     summary: Get weekly leaderboard
 *     tags: [Leaderboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: continent
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Weekly leaderboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaderboardEntry'
 */
router.get('/weekly', leaderboardController.getWeeklyLeaderboard);

/**
 * @swagger
 * /api/v1/leaderboard/monthly:
 *   get:
 *     summary: Get monthly leaderboard
 *     tags: [Leaderboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: continent
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Monthly leaderboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaderboardEntry'
 */
router.get('/monthly', leaderboardController.getMonthlyLeaderboard);

/**
 * @swagger
 * /api/v1/leaderboard/all-time:
 *   get:
 *     summary: Get all-time leaderboard
 *     tags: [Leaderboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: continent
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: All-time leaderboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaderboardEntry'
 */
router.get('/all-time', leaderboardController.getAllTimeLeaderboard);

/**
 * @swagger
 * /api/v1/leaderboard/user/{userId}:
 *   get:
 *     summary: Get user's ranks across all leaderboards
 *     tags: [Leaderboard]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User ranks
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
 *                     daily:
 *                       type: object
 *                     weekly:
 *                       type: object
 *                     monthly:
 *                       type: object
 *                     allTime:
 *                       type: object
 */
router.get('/user/:userId', leaderboardController.getUserRanks);

module.exports = router;
