const db = require('../config/database');
const { getPaginationParams, getPaginationMeta } = require('../utils/pagination');
const cacheService = require('../services/cache.service');
const { CACHE_TTL } = require('../config/constants');

class CountryController {
  async getAllCountries(req, res, next) {
    try {
      const { continentId, search } = req.query;
      const { page, limit, offset } = getPaginationParams(req);

      const cacheKey = `countries:${continentId || 'all'}:${search || ''}:${page}:${limit}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      let query = 'SELECT * FROM countries WHERE is_active = true';
      const params = [];
      let paramCount = 1;

      if (continentId) {
        query += ` AND continent_id = $${paramCount++}`;
        params.push(continentId);
      }

      if (search) {
        query += ` AND name ILIKE $${paramCount++}`;
        params.push(`%${search}%`);
      }

      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
      query += ` ORDER BY name LIMIT $${paramCount++} OFFSET $${paramCount}`;
      params.push(limit, offset);

      const [countResult, dataResult] = await Promise.all([
        db.query(countQuery, params.slice(0, -2)),
        db.query(query, params),
      ]);

      const result = {
        countries: dataResult.rows,
        pagination: getPaginationMeta(parseInt(countResult.rows[0].count), page, limit),
      };

      await cacheService.set(cacheKey, result, CACHE_TTL.COUNTRIES);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCountryById(req, res, next) {
    try {
      const { id } = req.params;

      const result = await db.query(
        'SELECT * FROM countries WHERE id = $1 AND is_active = true',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Country not found' });
      }

      res.json({ country: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }

  async getCountriesByContinent(req, res, next) {
    try {
      const { continentId } = req.params;

      const cacheKey = `countries:continent:${continentId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return res.json({ countries: cached });
      }

      const result = await db.query(
        'SELECT * FROM countries WHERE continent_id = $1 AND is_active = true ORDER BY name',
        [continentId]
      );

      await cacheService.set(cacheKey, result.rows, CACHE_TTL.COUNTRIES);
      res.json({ countries: result.rows });
    } catch (error) {
      next(error);
    }
  }

  async getRandomCountries(req, res, next) {
    try {
      const { count = 10, continentId } = req.query;

      let query = 'SELECT * FROM countries WHERE is_active = true';
      const params = [];

      if (continentId) {
        query += ' AND continent_id = $1';
        params.push(continentId);
      }

      query += ' ORDER BY RANDOM() LIMIT ' + parseInt(count);

      const result = await db.query(query, params);
      res.json({ countries: result.rows });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CountryController();
