const crypto = require('crypto');
const { POINTS } = require('../config/constants');

const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

const calculatePoints = (difficulty, timeLimit, timeTaken, isCorrect) => {
  if (!isCorrect) return 0;

  const difficultyPoints = POINTS[difficulty.toUpperCase()];
  let points = difficultyPoints.CORRECT;

  const timeRatio = timeTaken / timeLimit;
  if (timeRatio < 0.5) {
    points += difficultyPoints.TIME_BONUS_MAX;
  } else if (timeRatio < 0.75) {
    points += Math.floor(difficultyPoints.TIME_BONUS_MAX * 0.5);
  }

  return points;
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getTimeBasedPeriod = (type) => {
  const now = new Date();
  let startDate, endDate;

  switch (type) {
    case 'daily':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    case 'weekly':
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    default:
      startDate = null;
      endDate = null;
  }

  return { startDate, endDate };
};

module.exports = {
  generateToken,
  calculatePoints,
  shuffleArray,
  getTimeBasedPeriod,
};
