const db = require('../config/database');
const { shuffleArray, calculatePoints } = require('../utils/helpers');
const { GAME_STATUS } = require('../config/constants');
const cacheService = require('./cache.service');
const logger = require('../utils/logger');

class GameService {
  async createGame(userId, templateId, customOptions = null) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Check if user has any active (in-progress) games
      const activeGameCheck = await client.query(
        `SELECT id, status FROM games 
         WHERE user_id = $1 AND status = $2
         LIMIT 1`,
        [userId, GAME_STATUS.IN_PROGRESS]
      );

      if (activeGameCheck.rows.length > 0) {
        throw new Error('You already have a game in progress. Please complete or abandon it before starting a new one.');
      }

      let gameConfig;
      if (templateId) {
        // Get template from database
        const templateResult = await client.query(
          'SELECT * FROM game_templates WHERE id = $1 AND is_active = true',
          [templateId]
        );
        
        if (templateResult.rows.length === 0) {
          throw new Error('Template not found or inactive');
        }
        
        const template = templateResult.rows[0];
        gameConfig = {
          numberOfFlags: template.number_of_flags,
          timePerFlag: template.time_per_flag,
          difficulty: template.difficulty,
          continentId: template.continent_id,
        };
      } else if (customOptions) {
        // Use custom options
        gameConfig = {
          numberOfFlags: customOptions.numberOfFlags || 10,
          timePerFlag: customOptions.timePerFlag || 30,
          difficulty: customOptions.difficulty || 'medium',
          continentId: customOptions.continentId || null,
        };
      } else {
        // Use default configuration
        gameConfig = {
          numberOfFlags: 10,
          timePerFlag: 30,
          difficulty: 'medium',
          continentId: null,
        };
      }

      // Create game record
      const gameResult = await client.query(
        `INSERT INTO games (user_id, template_id, total_questions, time_limit, difficulty, continent_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          userId,
          templateId || null,
          gameConfig.numberOfFlags,
          gameConfig.timePerFlag * gameConfig.numberOfFlags,
          gameConfig.difficulty,
          gameConfig.continentId,
        ]
      );

      const game = gameResult.rows[0];

      // Get countries based on configuration
      let countriesQuery = 'SELECT * FROM countries WHERE is_active = true';
      const queryParams = [];

      if (gameConfig.continentId) {
        countriesQuery += ' AND continent_id = $1';
        queryParams.push(gameConfig.continentId);
      }

      const countriesResult = await client.query(countriesQuery, queryParams);
      const allCountries = countriesResult.rows;

      if (allCountries.length < gameConfig.numberOfFlags + 3) {
        throw new Error('Not enough countries for this configuration');
      }

      // Randomly select countries for questions
      const shuffledCountries = shuffleArray(allCountries);
      const selectedCountries = shuffledCountries.slice(0, gameConfig.numberOfFlags);

      // Create questions with multiple choice options
      for (let i = 0; i < selectedCountries.length; i++) {
        const correctCountry = selectedCountries[i];
        
        // Get 3 wrong options from same continent
        const sameContinent = allCountries.filter(
          c => c.continent_id === correctCountry.continent_id && c.id !== correctCountry.id
        );
        const shuffledOptions = shuffleArray(sameContinent).slice(0, 3);
        
        // Combine and shuffle all 4 options
        const options = shuffleArray([correctCountry, ...shuffledOptions]);

        await client.query(
          `INSERT INTO game_questions 
           (game_id, question_number, country_id, options, time_limit)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            game.id,
            i + 1,
            correctCountry.id,
            JSON.stringify(options.map(o => ({ id: o.id, name: o.name }))),
            gameConfig.timePerFlag,
          ]
        );
      }

      await client.query('COMMIT');
      
      logger.info(`Game created: ${game.id} for user ${userId} using ${templateId ? 'template ' + templateId : 'custom options'}`);
      
      // Return game with first question
      const firstQuestion = await this.getQuestion(game.id, 1, userId);
      
      return {
        ...game,
        currentQuestion: firstQuestion,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error creating game: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async getGame(gameId, userId) {
    const result = await db.query(
      `SELECT g.*, 
              COUNT(gq.id) as total_questions,
              COUNT(gq.id) FILTER (WHERE gq.user_answer_id = gq.country_id) as correct_answers,
              COUNT(gq.id) FILTER (WHERE gq.user_answer_id IS NULL) as unanswered_count
       FROM games g
       LEFT JOIN game_questions gq ON g.id = gq.game_id
       WHERE g.id = $1 AND g.user_id = $2
       GROUP BY g.id`,
      [gameId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Game not found');
    }

    const game = result.rows[0];
    
    // Get first unanswered question if exists
    const unansweredResult = await db.query(
      `SELECT gq.id, gq.question_number
       FROM game_questions gq
       WHERE gq.game_id = $1 AND gq.user_answer_id IS NULL
       ORDER BY gq.question_number ASC
       LIMIT 1`,
      [gameId]
    );
    
    const nextUnansweredQuestion = unansweredResult.rows.length > 0 
      ? {
          questionId: unansweredResult.rows[0].id,
          questionNumber: unansweredResult.rows[0].question_number
        }
      : null;

    return {
      ...game,
      nextUnansweredQuestion
    };
  }

  async getQuestion(gameId, questionNumber, userId) {
    const gameResult = await db.query(
      'SELECT * FROM games WHERE id = $1 AND user_id = $2',
      [gameId, userId]
    );

    if (gameResult.rows.length === 0) {
      throw new Error('Game not found');
    }

    const game = gameResult.rows[0];

    if (game.status !== GAME_STATUS.IN_PROGRESS) {
      throw new Error('Game is not in progress');
    }

    const questionResult = await db.query(
      `SELECT gq.*, c.flag_url
       FROM game_questions gq
       JOIN countries c ON gq.country_id = c.id
       WHERE gq.game_id = $1 AND gq.question_number = $2`,
      [gameId, questionNumber]
    );

    if (questionResult.rows.length === 0) {
      throw new Error('Question not found');
    }

    const question = questionResult.rows[0];

    return {
      id: question.id,
      questionNumber: question.question_number,
      flagUrl: question.flag_url,
      options: question.options,
      timeLimit: question.time_limit,
      isAnswered: question.user_answer_id !== null,
    };
  }

  async getNextUnansweredQuestion(gameId, userId) {
    const gameResult = await db.query(
      'SELECT * FROM games WHERE id = $1 AND user_id = $2',
      [gameId, userId]
    );

    if (gameResult.rows.length === 0) {
      throw new Error('Game not found');
    }

    const game = gameResult.rows[0];

    if (game.status !== GAME_STATUS.IN_PROGRESS) {
      throw new Error('Game is not in progress');
    }

    const questionResult = await db.query(
      `SELECT gq.*, c.flag_url
       FROM game_questions gq
       JOIN countries c ON gq.country_id = c.id
       WHERE gq.game_id = $1 AND gq.user_answer_id IS NULL
       ORDER BY gq.question_number ASC
       LIMIT 1`,
      [gameId]
    );

    if (questionResult.rows.length === 0) {
      return {
        hasUnanswered: false,
        message: 'All questions have been answered'
      };
    }

    const question = questionResult.rows[0];

    return {
      hasUnanswered: true,
      question: {
        id: question.id,
        questionNumber: question.question_number,
        flagUrl: question.flag_url,
        options: question.options,
        timeLimit: question.time_limit,
      }
    };
  }

  async submitAnswer(gameId, questionId, answerId, timeTaken, userId) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      const gameResult = await client.query(
        'SELECT * FROM games WHERE id = $1 AND user_id = $2 AND status = $3',
        [gameId, userId, GAME_STATUS.IN_PROGRESS]
      );

      if (gameResult.rows.length === 0) {
        throw new Error('Game not found or not in progress');
      }

      const game = gameResult.rows[0];

      const questionResult = await client.query(
        'SELECT * FROM game_questions WHERE id = $1 AND game_id = $2',
        [questionId, gameId]
      );

      if (questionResult.rows.length === 0) {
        throw new Error('Question not found');
      }

      const question = questionResult.rows[0];

      if (question.user_answer_id !== null) {
        throw new Error('Question already answered');
      }

      const isCorrect = question.country_id === answerId;
      const points = calculatePoints(game.difficulty, question.time_limit, timeTaken, isCorrect);

      await client.query(
        `UPDATE game_questions 
         SET user_answer_id = $1, time_taken = $2, points_earned = $3, answered_at = NOW()
         WHERE id = $4`,
        [answerId, timeTaken, points, questionId]
      );

      const updatedGame = await client.query(
        `UPDATE games 
         SET score = score + $1,
             correct_answers = correct_answers + $2,
             time_spent = time_spent + $3
         WHERE id = $4
         RETURNING *`,
        [points, isCorrect ? 1 : 0, timeTaken, gameId]
      );

      await client.query('COMMIT');

      logger.info(`Answer submitted for game ${gameId}, question ${questionId}`);

      return {
        isCorrect,
        correctAnswerId: question.country_id,
        points,
        totalScore: updatedGame.rows[0].score,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async completeGame(gameId, userId) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      const gameResult = await client.query(
        `UPDATE games 
         SET status = $1, completed_at = NOW()
         WHERE id = $2 AND user_id = $3 AND status = $4
         RETURNING *`,
        [GAME_STATUS.COMPLETED, gameId, userId, GAME_STATUS.IN_PROGRESS]
      );

      if (gameResult.rows.length === 0) {
        throw new Error('Game not found or already completed');
      }

      const game = gameResult.rows[0];

      await client.query(
        `UPDATE users 
         SET total_games_played = total_games_played + 1,
             total_correct_answers = total_correct_answers + $1,
             total_score = total_score + $2
         WHERE id = $3`,
        [game.correct_answers, game.score, userId]
      );

      await this.updateLeaderboards(userId, game.score, game.continent_id, client);
      await this.updateStatistics(userId, game, client);

      await client.query('COMMIT');

      await cacheService.delPattern('leaderboard:*');
      await cacheService.del(`user:${userId}:stats`);

      logger.info(`Game completed: ${gameId}`);
      return game;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async abandonGame(gameId, userId) {
    const result = await db.query(
      `UPDATE games 
       SET status = $1, completed_at = NOW()
       WHERE id = $2 AND user_id = $3 AND status = $4
       RETURNING *`,
      [GAME_STATUS.ABANDONED, gameId, userId, GAME_STATUS.IN_PROGRESS]
    );

    if (result.rows.length === 0) {
      throw new Error('Game not found or already completed');
    }

    logger.info(`Game abandoned: ${gameId}`);
    return result.rows[0];
  }

  async updateLeaderboards(userId, score, continentId, client) {
    const today = new Date().toISOString().split('T')[0];
    // Use -1 to represent global leaderboard instead of NULL to make unique constraints work
    const continentValue = continentId || -1;
    
    await client.query(
      `INSERT INTO leaderboard_daily (user_id, score, date, continent_id)
       VALUES ($1, $2, $3, NULLIF($4, -1))
       ON CONFLICT (user_id, date, COALESCE(continent_id, -1))
       DO UPDATE SET score = leaderboard_daily.score + EXCLUDED.score`,
      [userId, score, today, continentValue]
    );

    await client.query(
      `INSERT INTO leaderboard_weekly (user_id, score, week_start, continent_id)
       VALUES ($1, $2, DATE_TRUNC('week', NOW()), NULLIF($3, -1))
       ON CONFLICT (user_id, week_start, COALESCE(continent_id, -1))
       DO UPDATE SET score = leaderboard_weekly.score + EXCLUDED.score`,
      [userId, score, continentValue]
    );

    await client.query(
      `INSERT INTO leaderboard_monthly (user_id, score, month, year, continent_id)
       VALUES ($1, $2, EXTRACT(MONTH FROM NOW()), EXTRACT(YEAR FROM NOW()), NULLIF($3, -1))
       ON CONFLICT (user_id, month, year, COALESCE(continent_id, -1))
       DO UPDATE SET score = leaderboard_monthly.score + EXCLUDED.score`,
      [userId, score, continentValue]
    );

    await client.query(
      `INSERT INTO leaderboard_alltime (user_id, score, continent_id)
       VALUES ($1, $2, NULLIF($3, -1))
       ON CONFLICT (user_id, COALESCE(continent_id, -1))
       DO UPDATE SET score = leaderboard_alltime.score + EXCLUDED.score`,
      [userId, score, continentValue]
    );
  }

  async updateStatistics(userId, game, client) {
    await client.query(
      `INSERT INTO user_statistics (user_id, continent_id, difficulty, games_played, correct_answers, total_score)
       VALUES ($1, $2, $3, 1, $4, $5)
       ON CONFLICT (user_id, continent_id, difficulty)
       DO UPDATE SET 
         games_played = user_statistics.games_played + 1,
         correct_answers = user_statistics.correct_answers + $4,
         total_score = user_statistics.total_score + $5`,
      [userId, game.continent_id || null, game.difficulty, game.correct_answers, game.score]
    );
  }

  async getUserGames(userId, page, limit, offset) {
    const countResult = await db.query(
      'SELECT COUNT(*) FROM games WHERE user_id = $1',
      [userId]
    );

    const gamesResult = await db.query(
      `SELECT g.*, 
              gt.name as template_name,
              c.name as continent_name
       FROM games g
       LEFT JOIN game_templates gt ON g.template_id = gt.id
       LEFT JOIN continents c ON g.continent_id = c.id
       WHERE g.user_id = $1
       ORDER BY g.started_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      total: parseInt(countResult.rows[0].count),
      games: gamesResult.rows,
    };
  }
}

module.exports = new GameService();
