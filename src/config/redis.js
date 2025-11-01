const Redis = require('ioredis');
require('dotenv').config();

let redis;

// Use mock Redis in test environment
if (process.env.NODE_ENV === 'test') {
  // Create a mock Redis client that doesn't actually connect
  class MockRedis {
    constructor() {
      this.data = new Map();
    }
    
    async get(key) {
      return this.data.get(key) || null;
    }
    
    async set(key, value, ...args) {
      this.data.set(key, value);
      return 'OK';
    }
    
    async setex(key, seconds, value) {
      this.data.set(key, value);
      return 'OK';
    }
    
    async del(key) {
      return this.data.delete(key) ? 1 : 0;
    }
    
    async flushall() {
      this.data.clear();
      return 'OK';
    }
    
    async quit() {
      return 'OK';
    }
    
    async disconnect() {
      return 'OK';
    }
    
    on() {
      return this;
    }
    
    call() {
      return Promise.resolve('OK');
    }
  }
  
  redis = new MockRedis();
} else {
  redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  redis.on('error', (err) => {
    console.error('Redis Client Error', err);
  });

  redis.on('connect', () => {
    console.log('Redis connected successfully');
  });
}

module.exports = redis;
