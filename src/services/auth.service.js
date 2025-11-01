const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { generateToken } = require('../utils/helpers');
const emailService = require('./email.service');
const cacheService = require('./cache.service');
const logger = require('../utils/logger');

class AuthService {
  async register(username, email, password) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      const passwordHash = await bcrypt.hash(password, 12);
      const verificationToken = generateToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const result = await client.query(
        `INSERT INTO users (username, email, password_hash, email_verification_token, email_verification_expires)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, username, email, role, is_email_verified, created_at`,
        [username, email, passwordHash, verificationToken, verificationExpires]
      );

      const user = result.rows[0];

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE }
      );

      // Save refresh token in session
      await client.query(
        `INSERT INTO user_sessions (user_id, refresh_token, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
        [user.id, refreshToken]
      );

      await emailService.sendVerificationEmail(email, verificationToken, username);

      await client.query('COMMIT');
      
      logger.info(`User registered: ${email}`);
      
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isEmailVerified: user.is_email_verified,
        },
        tokens: {
          accessToken,
          refreshToken,
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async verifyEmail(token) {
    const result = await db.query(
      `UPDATE users 
       SET is_email_verified = true, 
           email_verification_token = NULL,
           email_verification_expires = NULL
       WHERE email_verification_token = $1 
       AND email_verification_expires > NOW()
       RETURNING id, username, email`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired verification token');
    }

    const user = result.rows[0];
    await emailService.sendWelcomeEmail(user.email, user.username);
    
    logger.info(`Email verified: ${user.email}`);
    return user;
  }

  async login(email, password) {
    const result = await db.query(
      `SELECT id, username, email, password_hash, role, is_email_verified 
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE }
    );

    await db.query(
      `INSERT INTO user_sessions (user_id, refresh_token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, refreshToken]
    );

    logger.info(`User logged in: ${email}`);
    
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.is_email_verified,
      },
      tokens: {
        accessToken,
        refreshToken,
      }
    };
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      const result = await db.query(
        `SELECT user_id FROM user_sessions 
         WHERE refresh_token = $1 AND expires_at > NOW()`,
        [refreshToken]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid refresh token');
      }

      const userResult = await db.query(
        'SELECT id, role FROM users WHERE id = $1',
        [decoded.userId]
      );

      const user = userResult.rows[0];
      const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      return { accessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(refreshToken) {
    await db.query(
      'DELETE FROM user_sessions WHERE refresh_token = $1',
      [refreshToken]
    );
    
    logger.info('User logged out');
  }

  async forgotPassword(email) {
    const result = await db.query(
      'SELECT id, username FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return;
    }

    const user = result.rows[0];
    const resetToken = generateToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await db.query(
      `UPDATE users 
       SET password_reset_token = $1, password_reset_expires = $2
       WHERE id = $3`,
      [resetToken, resetExpires, user.id]
    );

    await emailService.sendPasswordResetEmail(email, resetToken, user.username);
    
    logger.info(`Password reset requested: ${email}`);
  }

  async resetPassword(token, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 12);

    const result = await db.query(
      `UPDATE users 
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL
       WHERE password_reset_token = $2 
       AND password_reset_expires > NOW()
       RETURNING id, email`,
      [passwordHash, token]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired reset token');
    }

    await db.query(
      'DELETE FROM user_sessions WHERE user_id = $1',
      [result.rows[0].id]
    );

    logger.info(`Password reset: ${result.rows[0].email}`);
    return result.rows[0];
  }
}

module.exports = new AuthService();
