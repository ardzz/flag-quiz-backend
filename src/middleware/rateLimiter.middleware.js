const rateLimit = require('express-rate-limit');
const { default: RedisStore } = require('rate-limit-redis');
const redis = require('../config/redis');

const createRateLimiter = (windowMinutes = 15, maxRequests = 100) => {
  const limiterConfig = {
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
  };

  // Only use Redis store in non-test environments
  if (process.env.NODE_ENV !== 'test') {
    limiterConfig.store = new RedisStore({
      sendCommand: (...args) => redis.call(...args),
    });
  }

  return rateLimit(limiterConfig);
};

const authLimiter = createRateLimiter(15, 20); // Increased from 5 to 20 for development
const apiLimiter = createRateLimiter(15, 100);
const strictLimiter = createRateLimiter(60, 10);

module.exports = {
  createRateLimiter,
  authLimiter,
  apiLimiter,
  strictLimiter,
};
