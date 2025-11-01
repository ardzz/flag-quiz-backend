const jwt = require('jsonwebtoken');
const db = require('../config/database');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.warn('Access token missing');
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await db.query(
      'SELECT id, username, email, role, is_email_verified FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      logger.warn(`User not found for userId: ${decoded.userId}`);
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Token expired');
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid token format:', error.message);
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }
    logger.error('Auth middleware error:', error);
    return res.status(403).json({ success: false, error: 'Invalid token' });
  }
};

const requireEmailVerified = (req, res, next) => {
  if (!req.user.is_email_verified) {
    logger.warn(`Email not verified for user: ${req.user.id}`);
    return res.status(403).json({ success: false, error: 'Email verification required' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    logger.warn(`Admin access denied for user: ${req.user.id}`);
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireEmailVerified,
  requireAdmin,
};
