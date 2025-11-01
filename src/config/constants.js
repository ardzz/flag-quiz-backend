module.exports = {
  ROLES: {
    PLAYER: 'player',
    ADMIN: 'admin',
  },
  
  GAME_STATUS: {
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    ABANDONED: 'abandoned',
  },
  
  DIFFICULTY: {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
  },
  
  TEMPLATE_TYPE: {
    DEFAULT: 'default',
    CUSTOM: 'custom',
  },
  
  CONTINENTS: {
    AF: 'Africa',
    AS: 'Asia',
    EU: 'Europe',
    NA: 'North America',
    SA: 'South America',
    OC: 'Oceania',
    AN: 'Antarctica',
  },
  
  POINTS: {
    EASY: {
      CORRECT: 10,
      TIME_BONUS_MAX: 5,
    },
    MEDIUM: {
      CORRECT: 20,
      TIME_BONUS_MAX: 10,
    },
    HARD: {
      CORRECT: 30,
      TIME_BONUS_MAX: 15,
    },
  },
  
  LEADERBOARD_TYPES: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    ALL_TIME: 'all_time',
  },
  
  CACHE_TTL: {
    LEADERBOARD: 300,
    COUNTRIES: 3600,
    USER_STATS: 600,
  },
  
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
};
