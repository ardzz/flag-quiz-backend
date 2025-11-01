const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const gameTemplateController = require('../controllers/gameTemplate.controller');
const { authenticateToken, requireEmailVerified } = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');

/**
 * @swagger
 * /api/v1/game-templates:
 *   get:
 *     summary: Get all game templates
 *     tags: [Game Templates]
 *     responses:
 *       200:
 *         description: List of game templates
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
 *                     $ref: '#/components/schemas/GameTemplate'
 */
router.get('/', gameTemplateController.getAllTemplates);

/**
 * @swagger
 * /api/v1/game-templates/continent/{continentId}:
 *   get:
 *     summary: Get templates by continent
 *     tags: [Game Templates]
 *     parameters:
 *       - in: path
 *         name: continentId
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3, 4, 5, 6]
 *     responses:
 *       200:
 *         description: Templates for the continent
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
 *                     $ref: '#/components/schemas/GameTemplate'
 */
router.get('/continent/:continentId', gameTemplateController.getTemplatesByContinent);

/**
 * @swagger
 * /api/v1/game-templates:
 *   post:
 *     summary: Create a custom game template
 *     tags: [Game Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - numberOfFlags
 *               - timePerFlag
 *               - difficulty
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 example: My Custom Quiz
 *               description:
 *                 type: string
 *                 example: A challenging European flags quiz
 *               continentId:
 *                 type: integer
 *                 example: 3
 *               numberOfFlags:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 50
 *                 example: 15
 *               timePerFlag:
 *                 type: integer
 *                 minimum: 10
 *                 maximum: 60
 *                 example: 25
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 example: hard
 *     responses:
 *       201:
 *         description: Template created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/GameTemplate'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/',
  authenticateToken,
  requireEmailVerified,
  [
    body('name').trim().isLength({ min: 3, max: 100 }).withMessage('Name must be 3-100 characters'),
    body('description').optional().trim(),
    body('continentId').optional().isInt().withMessage('Invalid continent ID'),
    body('numberOfFlags').isInt({ min: 5, max: 50 }).withMessage('Number of flags must be 5-50'),
    body('timePerFlag').isInt({ min: 10, max: 60 }).withMessage('Time per flag must be 10-60 seconds'),
    body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
  ],
  validate,
  gameTemplateController.createTemplate
);

/**
 * @swagger
 * /api/v1/game-templates/{id}:
 *   put:
 *     summary: Update game template
 *     tags: [Game Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Template updated
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/:id',
  authenticateToken,
  requireEmailVerified,
  [param('id').isUUID().withMessage('Invalid template ID')],
  validate,
  gameTemplateController.updateTemplate
);

/**
 * @swagger
 * /api/v1/game-templates/{id}:
 *   delete:
 *     summary: Delete game template
 *     tags: [Game Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Template deleted
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/:id',
  authenticateToken,
  [param('id').isUUID().withMessage('Invalid template ID')],
  validate,
  gameTemplateController.deleteTemplate
);

module.exports = router;
