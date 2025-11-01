-- Fix leaderboard duplicate entries issue
-- This migration cleans up duplicates and adds proper unique indexes for NULL continent_id

-- Step 1: Clean up existing duplicates (keep highest score for each user)

-- Clean daily duplicates
DELETE FROM leaderboard_daily 
WHERE id NOT IN (
  SELECT id FROM (
    SELECT DISTINCT ON (user_id, date, COALESCE(continent_id, -1)) 
      id, score
    FROM leaderboard_daily
    ORDER BY user_id, date, COALESCE(continent_id, -1), score DESC
  ) t
);

-- Clean weekly duplicates
DELETE FROM leaderboard_weekly 
WHERE id NOT IN (
  SELECT id FROM (
    SELECT DISTINCT ON (user_id, week_start, COALESCE(continent_id, -1)) 
      id, score
    FROM leaderboard_weekly
    ORDER BY user_id, week_start, COALESCE(continent_id, -1), score DESC
  ) t
);

-- Clean monthly duplicates
DELETE FROM leaderboard_monthly 
WHERE id NOT IN (
  SELECT id FROM (
    SELECT DISTINCT ON (user_id, month, year, COALESCE(continent_id, -1)) 
      id, score
    FROM leaderboard_monthly
    ORDER BY user_id, month, year, COALESCE(continent_id, -1), score DESC
  ) t
);

-- Clean all-time duplicates
DELETE FROM leaderboard_alltime 
WHERE id NOT IN (
  SELECT id FROM (
    SELECT DISTINCT ON (user_id, COALESCE(continent_id, -1)) 
      id, score
    FROM leaderboard_alltime
    ORDER BY user_id, COALESCE(continent_id, -1), score DESC
  ) t
);

-- Step 2: Add partial unique indexes to handle NULL continent_id properly
-- PostgreSQL doesn't consider NULL values as equal in unique constraints,
-- so we need partial indexes for the global leaderboard (continent_id IS NULL)

CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_alltime_user_global_unique 
  ON leaderboard_alltime (user_id) WHERE continent_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_daily_user_date_global_unique 
  ON leaderboard_daily (user_id, date) WHERE continent_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_weekly_user_week_global_unique 
  ON leaderboard_weekly (user_id, week_start) WHERE continent_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_monthly_user_month_year_global_unique 
  ON leaderboard_monthly (user_id, month, year) WHERE continent_id IS NULL;
