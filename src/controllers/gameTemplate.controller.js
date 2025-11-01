const db = require('../config/database');
const { getPaginationParams, getPaginationMeta } = require('../utils/pagination');

class GameTemplateController {
  async getAllTemplates(req, res, next) {
    try {
      const { page, limit, offset } = getPaginationParams(req);

      const countResult = await db.query(
        'SELECT COUNT(*) FROM game_templates WHERE is_active = true'
      );

      const result = await db.query(
        `SELECT gt.*, c.name as continent_name
         FROM game_templates gt
         LEFT JOIN continents c ON gt.continent_id = c.id
         WHERE gt.is_active = true
         ORDER BY gt.type, gt.name
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      res.json({
        templates: result.rows,
        pagination: getPaginationMeta(parseInt(countResult.rows[0].count), page, limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async getTemplatesByContinent(req, res, next) {
    try {
      const { continentId } = req.params;

      const result = await db.query(
        `SELECT gt.*, c.name as continent_name
         FROM game_templates gt
         LEFT JOIN continents c ON gt.continent_id = c.id
         WHERE gt.continent_id = $1 AND gt.is_active = true
         ORDER BY gt.name`,
        [continentId]
      );

      res.json({ templates: result.rows });
    } catch (error) {
      next(error);
    }
  }

  async createTemplate(req, res, next) {
    try {
      const { name, description, continentId, numberOfFlags, timePerFlag, difficulty } = req.body;

      const result = await db.query(
        `INSERT INTO game_templates 
         (name, description, type, continent_id, number_of_flags, time_per_flag, difficulty, created_by)
         VALUES ($1, $2, 'custom', $3, $4, $5, $6, $7)
         RETURNING *`,
        [name, description, continentId, numberOfFlags, timePerFlag, difficulty, req.user.id]
      );

      res.status(201).json({
        message: 'Template created successfully',
        template: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, numberOfFlags, timePerFlag, difficulty } = req.body;

      const result = await db.query(
        `UPDATE game_templates 
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             number_of_flags = COALESCE($3, number_of_flags),
             time_per_flag = COALESCE($4, time_per_flag),
             difficulty = COALESCE($5, difficulty),
             updated_at = NOW()
         WHERE id = $6 AND (created_by = $7 OR $8 = 'admin')
         RETURNING *`,
        [name, description, numberOfFlags, timePerFlag, difficulty, id, req.user.id, req.user.role]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Template not found or unauthorized' });
      }

      res.json({
        message: 'Template updated successfully',
        template: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTemplate(req, res, next) {
    try {
      const { id } = req.params;

      const result = await db.query(
        `UPDATE game_templates 
         SET is_active = false
         WHERE id = $1 AND (created_by = $2 OR $3 = 'admin')
         RETURNING id`,
        [id, req.user.id, req.user.role]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Template not found or unauthorized' });
      }

      res.json({ message: 'Template deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GameTemplateController();
