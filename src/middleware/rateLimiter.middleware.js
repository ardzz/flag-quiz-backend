const rateLimit = require('express-rate-limit');
const { default: RedisStore } = require('rate-limit-redis');
const redis = require('../config/redis');

const createRateLimiter = (windowMinutes = 15, maxRequests = 100) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
    }),
    message: 'Too many requests from this IP, please try again later.',
  });
};

const authLimiter = createRateLimiter(15, 5);
const apiLimiter = createRateLimiter(15, 100);
const strictLimiter = createRateLimiter(60, 10);

module.exports = {
  createRateLimiter,
  authLimiter,
  apiLimiter,
  strictLimiter,
};
