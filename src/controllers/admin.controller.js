const db = require('../config/database');
const { getPaginationParams, getPaginationMeta } = require('../utils/pagination');
const fs = require('fs');
const csv = require('csv-parser');
const logger = require('../utils/logger');

class AdminController {
  async getAllUsers(req, res, next) {
    try {
      const { page, limit, offset } = getPaginationParams(req);
      const { role, search } = req.query;

      let query = 'SELECT id, username, email, role, is_email_verified, total_games_played, total_score, created_at FROM users WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (role) {
        query += ` AND role = $${paramCount++}`;
        params.push(role);
      }

      if (search) {
        query += ` AND (username ILIKE $${paramCount++} OR email ILIKE $${paramCount})`;
        params.push(`%${search}%`, `%${search}%`);
        paramCount++;
      }

      const countQuery = query.replace('SELECT id, username, email, role, is_email_verified, total_games_played, total_score, created_at', 'SELECT COUNT(*)');
      query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
      params.push(limit, offset);

      const [countResult, dataResult] = await Promise.all([
        db.query(countQuery, params.slice(0, -2)),
        db.query(query, params),
      ]);

      res.json({
        users: dataResult.rows,
        pagination: getPaginationMeta(parseInt(countResult.rows[0].count), page, limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const result = await db.query(
        'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role',
        [role, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      await db.query(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, performed_by) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, 'update_role', 'user', id, JSON.stringify({ newRole: role }), req.user.id]
      );

      logger.info(`User role updated: ${id} -> ${role} by ${req.user.id}`);

      res.json({
        message: 'User role updated successfully',
        user: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      if (id === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      const result = await db.query(
        'DELETE FROM users WHERE id = $1 RETURNING id, username, email',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      await db.query(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, performed_by) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, 'delete', 'user', id, JSON.stringify(result.rows[0]), req.user.id]
      );

      logger.info(`User deleted: ${id} by ${req.user.id}`);

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async importCountries(req, res, next) {
    try {
      const csvPath = './flags.csv';
      const countries = [];

      const continentMapping = {
        1: 1, // Africa
        2: 2, // Asia
        3: 3, // Europe
        4: 4, // North America
        5: 5, // South America
        6: 6, // Oceania
      };

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          countries.push({
            name: row.name,
            landmass: parseInt(row.landmass),
            zone: parseInt(row.zone),
            area: parseInt(row.area),
            population: parseInt(row.population),
            language: parseInt(row.language),
            religion: parseInt(row.religion),
            bars: parseInt(row.bars),
            stripes: parseInt(row.stripes),
            colours: parseInt(row.colours),
            red: parseInt(row.red) === 1,
            green: parseInt(row.green) === 1,
            blue: parseInt(row.blue) === 1,
            gold: parseInt(row.gold) === 1,
            white: parseInt(row.white) === 1,
            black: parseInt(row.black) === 1,
            orange: parseInt(row.orange) === 1,
            mainhue: row.mainhue,
            circles: parseInt(row.circles),
            crosses: parseInt(row.crosses),
            saltires: parseInt(row.saltires),
            quarters: parseInt(row.quarters),
            sunstars: parseInt(row.sunstars),
            crescent: parseInt(row.crescent),
            triangle: parseInt(row.triangle),
            icon: parseInt(row.icon),
            animate: parseInt(row.animate),
            text: parseInt(row.text),
            topleft: row.topleft,
            botright: row.botright,
            continent_id: continentMapping[parseInt(row.zone)] || null,
            flag_url: `/flags/${row.name.toLowerCase().replace(/ /g, '-')}.png`,
          });
        })
        .on('end', async () => {
          const client = await db.getClient();
          try {
            await client.query('BEGIN');
            
            for (const country of countries) {
              await client.query(
                `INSERT INTO countries 
                (name, landmass, zone, area, population, language, religion, bars, stripes, colours,
                 red, green, blue, gold, white, black, orange, mainhue, circles, crosses, saltires,
                 quarters, sunstars, crescent, triangle, icon, animate, text, topleft, botright,
                 continent_id, flag_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
                        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
                ON CONFLICT (name) DO NOTHING`,
                [
                  country.name, country.landmass, country.zone, country.area, country.population,
                  country.language, country.religion, country.bars, country.stripes, country.colours,
                  country.red, country.green, country.blue, country.gold, country.white, country.black,
                  country.orange, country.mainhue, country.circles, country.crosses, country.saltires,
                  country.quarters, country.sunstars, country.crescent, country.triangle, country.icon,
                  country.animate, country.text, country.topleft, country.botright, country.continent_id,
                  country.flag_url,
                ]
              );
            }

            await client.query('COMMIT');
            
            await db.query(
              'INSERT INTO audit_logs (action, resource_type, details, performed_by) VALUES ($1, $2, $3, $4)',
              ['import', 'countries', JSON.stringify({ count: countries.length }), req.user.id]
            );

            logger.info(`Countries imported: ${countries.length} by ${req.user.id}`);
            
            res.json({
              message: 'Countries imported successfully',
              count: countries.length,
            });
          } catch (error) {
            await client.query('ROLLBACK');
            throw error;
          } finally {
            client.release();
          }
        });
    } catch (error) {
      next(error);
    }
  }

  async updateCountry(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const setClauses = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updates).forEach((key) => {
        setClauses.push(`${key} = $${paramCount++}`);
        values.push(updates[key]);
      });

      if (setClauses.length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
      }

      values.push(id);
      const query = `UPDATE countries SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Country not found' });
      }

      await db.query(
        'INSERT INTO audit_logs (action, resource_type, resource_id, details, performed_by) VALUES ($1, $2, $3, $4, $5)',
        ['update', 'country', id, JSON.stringify(updates), req.user.id]
      );

      logger.info(`Country updated: ${id} by ${req.user.id}`);

      res.json({
        message: 'Country updated successfully',
        country: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivateCountry(req, res, next) {
    try {
      const { id } = req.params;

      const result = await db.query(
        'UPDATE countries SET is_active = false WHERE id = $1 RETURNING id, name',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Country not found' });
      }

      await db.query(
        'INSERT INTO audit_logs (action, resource_type, resource_id, details, performed_by) VALUES ($1, $2, $3, $4, $5)',
        ['deactivate', 'country', id, JSON.stringify(result.rows[0]), req.user.id]
      );

      logger.info(`Country deactivated: ${id} by ${req.user.id}`);

      res.json({ message: 'Country deactivated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req, res, next) {
    try {
      const [users, games, countries] = await Promise.all([
        db.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_email_verified = true) as verified, COUNT(*) FILTER (WHERE role = \'admin\') as admins FROM users'),
        db.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'completed\') as completed, AVG(score) as avg_score FROM games'),
        db.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM countries'),
      ]);

      res.json({
        users: users.rows[0],
        games: games.rows[0],
        countries: countries.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const { page, limit, offset } = getPaginationParams(req);
      const { action, resourceType } = req.query;

      let query = `
        SELECT al.*, u.username as performed_by_username
        FROM audit_logs al
        LEFT JOIN users u ON al.performed_by = u.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 1;

      if (action) {
        query += ` AND al.action = $${paramCount++}`;
        params.push(action);
      }

      if (resourceType) {
        query += ` AND al.resource_type = $${paramCount++}`;
        params.push(resourceType);
      }

      const countQuery = query.replace('SELECT al.*, u.username as performed_by_username', 'SELECT COUNT(*)');
      query += ` ORDER BY al.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
      params.push(limit, offset);

      const [countResult, dataResult] = await Promise.all([
        db.query(countQuery, params.slice(0, -2)),
        db.query(query, params),
      ]);

      res.json({
        logs: dataResult.rows,
        pagination: getPaginationMeta(parseInt(countResult.rows[0]?.count || 0), page, limit),
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
