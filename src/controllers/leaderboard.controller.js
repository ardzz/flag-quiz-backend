const leaderboardService = require('../services/leaderboard.service');
const { getPaginationParams, getPaginationMeta } = require('../utils/pagination');

class LeaderboardController {
  async getDailyLeaderboard(req, res, next) {
    try {
      const { date, continentId } = req.query;
      const { page, limit, offset } = getPaginationParams(req);
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const { total, leaderboard } = await leaderboardService.getDailyLeaderboard(
        targetDate,
        continentId,
        page,
        limit,
        offset
      );
      
      res.json({
        leaderboard,
        pagination: getPaginationMeta(total, page, limit),
        date: targetDate,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWeeklyLeaderboard(req, res, next) {
    try {
      const { weekStart, continentId } = req.query;
      const { page, limit, offset } = getPaginationParams(req);
      
      const targetWeekStart = weekStart || (() => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(now.setDate(diff)).toISOString().split('T')[0];
      })();
      
      const { total, leaderboard } = await leaderboardService.getWeeklyLeaderboard(
        targetWeekStart,
        continentId,
        page,
        limit,
        offset
      );
      
      res.json({
        leaderboard,
        pagination: getPaginationMeta(total, page, limit),
        weekStart: targetWeekStart,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyLeaderboard(req, res, next) {
    try {
      const { month, year, continentId } = req.query;
      const { page, limit, offset } = getPaginationParams(req);
      
      const now = new Date();
      const targetMonth = month || now.getMonth() + 1;
      const targetYear = year || now.getFullYear();
      
      const { total, leaderboard } = await leaderboardService.getMonthlyLeaderboard(
        targetMonth,
        targetYear,
        continentId,
        page,
        limit,
        offset
      );
      
      res.json({
        leaderboard,
        pagination: getPaginationMeta(total, page, limit),
        month: targetMonth,
        year: targetYear,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllTimeLeaderboard(req, res, next) {
    try {
      const { continentId } = req.query;
      const { page, limit, offset } = getPaginationParams(req);
      
      const { total, leaderboard } = await leaderboardService.getAllTimeLeaderboard(
        continentId,
        page,
        limit,
        offset
      );
      
      res.json({
        leaderboard,
        pagination: getPaginationMeta(total, page, limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserRanks(req, res, next) {
    try {
      const { userId } = req.params;
      const ranks = await leaderboardService.getUserRanks(userId);
      
      res.json({ ranks });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LeaderboardController();
