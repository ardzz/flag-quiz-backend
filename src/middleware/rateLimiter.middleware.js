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

const authLimiter = createRateLimiter(15, 20); // 20 requests per 15 minutes for auth endpoints
const apiLimiter = createRateLimiter(15, 500); // 500 requests per 15 minutes for general API
const gameLimiter = createRateLimiter(5, 200); // 200 requests per 5 minutes for game play
const publicLimiter = createRateLimiter(15, 1000); // 1000 requests per 15 minutes for public endpoints
const strictLimiter = createRateLimiter(60, 10); // 10 requests per hour for sensitive operations

module.exports = {
  createRateLimiter,
  authLimiter,
  apiLimiter,
  gameLimiter,
  publicLimiter,
  strictLimiter,
};
