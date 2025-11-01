const db = require('../config/database');
const bcrypt = require('bcryptjs');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const cacheService = require('../services/cache.service');
const { getPaginationParams, getPaginationMeta } = require('../utils/pagination');

class UserController {
  async getProfile(req, res, next) {
    try {
      const result = await db.query(
        `SELECT id, username, email, role, photo_url, 
                total_games_played, total_correct_answers, total_score,
                is_email_verified, created_at
         FROM users WHERE id = $1`,
        [req.user.id]
      );
      
      res.json({ user: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { username, email, currentPassword, newPassword } = req.body;
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (username) {
        updates.push(`username = $${paramCount++}`);
        values.push(username);
      }

      if (email) {
        updates.push(`email = $${paramCount++}`);
        values.push(email);
      }

      if (newPassword && currentPassword) {
        const userResult = await db.query(
          'SELECT password_hash FROM users WHERE id = $1',
          [req.user.id]
        );
        
        const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
        if (!isValid) {
          return res.status(400).json({ error: 'Current password is incorrect' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        updates.push(`password_hash = $${paramCount++}`);
        values.push(passwordHash);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
      }

      updates.push(`updated_at = NOW()`);
      values.push(req.user.id);

      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, username, email, photo_url`;
      const result = await db.query(query, values);

      res.json({
        message: 'Profile updated successfully',
        user: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadPhoto(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const filename = `profile-${req.user.id}-${Date.now()}.jpg`;
      const outputPath = path.join(process.env.UPLOAD_PATH || 'uploads/', filename);

      await sharp(req.file.path)
        .resize(300, 300)
        .jpeg({ quality: 90 })
        .toFile(outputPath);

      await fs.unlink(req.file.path);

      const photoUrl = `/uploads/${filename}`;

      await db.query(
        'UPDATE users SET photo_url = $1 WHERE id = $2',
        [photoUrl, req.user.id]
      );

      res.json({
        message: 'Photo uploaded successfully',
        photoUrl,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      
      const result = await db.query(
        `SELECT id, username, photo_url, 
                total_games_played, total_correct_answers, total_score,
                created_at
         FROM users WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }

  async getUserStatistics(req, res, next) {
    try {
      const { id } = req.params;

      const cacheKey = `user:${id}:stats`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return res.json({ statistics: cached });
      }

      const result = await db.query(
        `SELECT 
           us.*,
           c.name as continent_name
         FROM user_statistics us
         LEFT JOIN continents c ON us.continent_id = c.id
         WHERE us.user_id = $1
         ORDER BY us.continent_id, us.difficulty`,
        [id]
      );

      await cacheService.set(cacheKey, result.rows, 600);
      res.json({ statistics: result.rows });
    } catch (error) {
      next(error);
    }
  }

  async getUserAchievements(req, res, next) {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT ua.*, a.name, a.description, a.icon
         FROM user_achievements ua
         JOIN achievements a ON ua.achievement_id = a.id
         WHERE ua.user_id = $1
         ORDER BY ua.earned_at DESC`,
        [id]
      );

      res.json({ achievements: result.rows });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
