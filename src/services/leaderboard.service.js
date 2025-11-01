const db = require('../config/database');
const cacheService = require('./cache.service');
const { CACHE_TTL } = require('../config/constants');
const { getTimeBasedPeriod } = require('../utils/helpers');

class LeaderboardService {
  async getDailyLeaderboard(date, continentId, page, limit, offset) {
    const cacheKey = `leaderboard:daily:${date}:${continentId || 'global'}:${page}:${limit}`;
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    let query = `
      SELECT 
        l.user_id,
        u.username,
        u.photo_url,
        l.score,
        ROW_NUMBER() OVER (ORDER BY l.score DESC) as rank
      FROM leaderboard_daily l
      JOIN users u ON l.user_id = u.id
      WHERE l.date = $1
    `;
    const params = [date];

    if (continentId) {
      query += ' AND l.continent_id = $2';
      params.push(continentId);
    } else {
      query += ' AND l.continent_id IS NULL';
    }

    query += ' ORDER BY l.score DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const countQuery = query.replace(/SELECT.*FROM/s, 'SELECT COUNT(*) FROM').split('ORDER BY')[0];
    
    const [countResult, dataResult] = await Promise.all([
      db.query(countQuery, params.slice(0, -2)),
      db.query(query, params),
    ]);

    const result = {
      total: parseInt(countResult.rows[0]?.count || 0),
      leaderboard: dataResult.rows,
    };

    await cacheService.set(cacheKey, result, CACHE_TTL.LEADERBOARD);
    return result;
  }

  async getWeeklyLeaderboard(weekStart, continentId, page, limit, offset) {
    const cacheKey = `leaderboard:weekly:${weekStart}:${continentId || 'global'}:${page}:${limit}`;
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    let query = `
      SELECT 
        l.user_id,
        u.username,
        u.photo_url,
        l.score,
        ROW_NUMBER() OVER (ORDER BY l.score DESC) as rank
      FROM leaderboard_weekly l
      JOIN users u ON l.user_id = u.id
      WHERE l.week_start = $1
    `;
    const params = [weekStart];

    if (continentId) {
      query += ' AND l.continent_id = $2';
      params.push(continentId);
    } else {
      query += ' AND l.continent_id IS NULL';
    }

    query += ' ORDER BY l.score DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const countQuery = query.replace(/SELECT.*FROM/s, 'SELECT COUNT(*) FROM').split('ORDER BY')[0];
    
    const [countResult, dataResult] = await Promise.all([
      db.query(countQuery, params.slice(0, -2)),
      db.query(query, params),
    ]);

    const result = {
      total: parseInt(countResult.rows[0]?.count || 0),
      leaderboard: dataResult.rows,
    };

    await cacheService.set(cacheKey, result, CACHE_TTL.LEADERBOARD);
    return result;
  }

  async getMonthlyLeaderboard(month, year, continentId, page, limit, offset) {
    const cacheKey = `leaderboard:monthly:${month}:${year}:${continentId || 'global'}:${page}:${limit}`;
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    let query = `
      SELECT 
        l.user_id,
        u.username,
        u.photo_url,
        l.score,
        ROW_NUMBER() OVER (ORDER BY l.score DESC) as rank
      FROM leaderboard_monthly l
      JOIN users u ON l.user_id = u.id
      WHERE l.month = $1 AND l.year = $2
    `;
    const params = [month, year];

    if (continentId) {
      query += ' AND l.continent_id = $3';
      params.push(continentId);
    } else {
      query += ' AND l.continent_id IS NULL';
    }

    query += ' ORDER BY l.score DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const countQuery = query.replace(/SELECT.*FROM/s, 'SELECT COUNT(*) FROM').split('ORDER BY')[0];
    
    const [countResult, dataResult] = await Promise.all([
      db.query(countQuery, params.slice(0, -2)),
      db.query(query, params),
    ]);

    const result = {
      total: parseInt(countResult.rows[0]?.count || 0),
      leaderboard: dataResult.rows,
    };

    await cacheService.set(cacheKey, result, CACHE_TTL.LEADERBOARD);
    return result;
  }

  async getAllTimeLeaderboard(continentId, page, limit, offset) {
    const cacheKey = `leaderboard:alltime:${continentId || 'global'}:${page}:${limit}`;
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    let query = `
      SELECT 
        l.user_id,
        u.username,
        u.photo_url,
        l.score,
        ROW_NUMBER() OVER (ORDER BY l.score DESC) as rank
      FROM leaderboard_alltime l
      JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (continentId) {
      query += ' AND l.continent_id = $1';
      params.push(continentId);
    } else {
      query += ' AND l.continent_id IS NULL';
    }

    query += ' ORDER BY l.score DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const countQuery = query.replace(/SELECT.*FROM/s, 'SELECT COUNT(*) FROM').split('ORDER BY')[0];
    
    const [countResult, dataResult] = await Promise.all([
      db.query(countQuery, params.slice(0, -2)),
      db.query(query, params),
    ]);

    const result = {
      total: parseInt(countResult.rows[0]?.count || 0),
      leaderboard: dataResult.rows,
    };

    await cacheService.set(cacheKey, result, CACHE_TTL.LEADERBOARD);
    return result;
  }

  async getUserRanks(userId) {
    const cacheKey = `user:${userId}:ranks`;
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    const [daily, weekly, monthly, allTime] = await Promise.all([
      db.query(
        `WITH ranked AS (
          SELECT user_id, score, ROW_NUMBER() OVER (ORDER BY score DESC) as rank
          FROM leaderboard_daily
          WHERE date = $1 AND continent_id IS NULL
        )
        SELECT rank, score FROM ranked WHERE user_id = $2`,
        [today, userId]
      ),
      db.query(
        `WITH ranked AS (
          SELECT user_id, score, ROW_NUMBER() OVER (ORDER BY score DESC) as rank
          FROM leaderboard_weekly
          WHERE week_start = $1 AND continent_id IS NULL
        )
        SELECT rank, score FROM ranked WHERE user_id = $2`,
        [weekStartStr, userId]
      ),
      db.query(
        `WITH ranked AS (
          SELECT user_id, score, ROW_NUMBER() OVER (ORDER BY score DESC) as rank
          FROM leaderboard_monthly
          WHERE month = $1 AND year = $2 AND continent_id IS NULL
        )
        SELECT rank, score FROM ranked WHERE user_id = $3`,
        [month, year, userId]
      ),
      db.query(
        `WITH ranked AS (
          SELECT user_id, score, ROW_NUMBER() OVER (ORDER BY score DESC) as rank
          FROM leaderboard_alltime
          WHERE continent_id IS NULL
        )
        SELECT rank, score FROM ranked WHERE user_id = $1`,
        [userId]
      ),
    ]);

    const result = {
      daily: daily.rows[0] || null,
      weekly: weekly.rows[0] || null,
      monthly: monthly.rows[0] || null,
      allTime: allTime.rows[0] || null,
    };

    await cacheService.set(cacheKey, result, CACHE_TTL.USER_STATS);
    return result;
  }
}

module.exports = new LeaderboardService();
