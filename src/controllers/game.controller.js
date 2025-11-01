const gameService = require('../services/game.service');
const { getPaginationParams, getPaginationMeta } = require('../utils/pagination');

class GameController {
  async createGame(req, res, next) {
    try {
      const { templateId, customOptions } = req.body;
      const game = await gameService.createGame(req.user.id, templateId, customOptions);
      
      res.status(201).json({
        success: true,
        message: 'Game created successfully',
        data: game,
      });
    } catch (error) {
      next(error);
    }
  }

  async getGame(req, res, next) {
    try {
      const { gameId } = req.params;
      const game = await gameService.getGame(gameId, req.user.id);
      
      res.json({ 
        success: true,
        data: game 
      });
    } catch (error) {
      next(error);
    }
  }

  async getQuestion(req, res, next) {
    try {
      const { gameId, number } = req.params;
      const question = await gameService.getQuestion(gameId, parseInt(number), req.user.id);
      
      res.json({ 
        success: true,
        data: question 
      });
    } catch (error) {
      next(error);
    }
  }

  async getNextUnansweredQuestion(req, res, next) {
    try {
      const { gameId } = req.params;
      const result = await gameService.getNextUnansweredQuestion(gameId, req.user.id);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async submitAnswer(req, res, next) {
    try {
      const { gameId, questionId } = req.params;
      const { answerId, timeTaken } = req.body;
      
      const result = await gameService.submitAnswer(
        gameId,
        questionId,
        answerId,
        timeTaken,
        req.user.id
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async completeGame(req, res, next) {
    try {
      const { gameId } = req.params;
      const game = await gameService.completeGame(gameId, req.user.id);
      
      res.json({
        success: true,
        message: 'Game completed successfully',
        data: game,
      });
    } catch (error) {
      next(error);
    }
  }

  async abandonGame(req, res, next) {
    try {
      const { gameId } = req.params;
      const game = await gameService.abandonGame(gameId, req.user.id);
      
      res.json({
        success: true,
        message: 'Game abandoned',
        data: game,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserGames(req, res, next) {
    try {
      const { page, limit, offset } = getPaginationParams(req);
      const { total, games } = await gameService.getUserGames(req.user.id, page, limit, offset);
      
      res.json({
        success: true,
        data: {
          games,
          pagination: getPaginationMeta(total, page, limit),
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GameController();
