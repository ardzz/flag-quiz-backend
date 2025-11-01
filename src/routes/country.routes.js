const express = require('express');
const router = express.Router();
const countryController = require('../controllers/country.controller');

/**
 * @swagger
 * /api/v1/countries:
 *   get:
 *     summary: Get all countries
 *     tags: [Countries]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: continent
 *         schema:
 *           type: integer
 *         description: Filter by continent ID (1-6)
 *     responses:
 *       200:
 *         description: List of countries
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
 *                     countries:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Country'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 */
router.get('/', countryController.getAllCountries);

/**
 * @swagger
 * /api/v1/countries/continent/{continentId}:
 *   get:
 *     summary: Get countries by continent
 *     tags: [Countries]
 *     parameters:
 *       - in: path
 *         name: continentId
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3, 4, 5, 6]
 *         description: Continent ID (1=Africa, 2=Asia, 3=Europe, 4=North America, 5=South America, 6=Oceania)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of countries in the continent
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
 *                     $ref: '#/components/schemas/Country'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/continent/:continentId', countryController.getCountriesByContinent);

/**
 * @swagger
 * /api/v1/countries/random:
 *   get:
 *     summary: Get random countries
 *     tags: [Countries]
 *     parameters:
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of random countries to return
 *       - in: query
 *         name: continent
 *         schema:
 *           type: integer
 *         description: Filter by continent ID (optional)
 *     responses:
 *       200:
 *         description: Random countries
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
 *                     $ref: '#/components/schemas/Country'
 */
router.get('/random', countryController.getRandomCountries);

/**
 * @swagger
 * /api/v1/countries/{id}:
 *   get:
 *     summary: Get country by ID
 *     tags: [Countries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Country ID
 *     responses:
 *       200:
 *         description: Country details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Country'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', countryController.getCountryById);

module.exports = router;
