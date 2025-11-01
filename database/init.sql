-- Flag Guesser Game Platform Database Initialization
-- PostgreSQL 15

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create database user
CREATE ROLE flag_game_app WITH LOGIN PASSWORD 'your_secure_password';
GRANT CONNECT ON DATABASE flag_game_db TO flag_game_app;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('player', 'admin')),
    photo_url VARCHAR(500),
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    total_games_played INTEGER DEFAULT 0,
    total_correct_answers INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    average_response_time FLOAT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_total_score ON users(total_score DESC);

-- Continents table
CREATE TABLE IF NOT EXISTS continents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert continents
INSERT INTO continents (name, code) VALUES
('Africa', 'AF'),
('Asia', 'AS'),
('Europe', 'EU'),
('North America', 'NA'),
('South America', 'SA'),
('Oceania', 'OC'),
('Antarctica', 'AN')
ON CONFLICT (code) DO NOTHING;

-- Countries table
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    flag_url VARCHAR(500) NOT NULL,
    continent_id INTEGER REFERENCES continents(id),
    landmass INTEGER,
    zone INTEGER,
    area INTEGER,
    population INTEGER,
    language INTEGER,
    religion INTEGER,
    bars INTEGER,
    stripes INTEGER,
    colours INTEGER,
    red BOOLEAN DEFAULT FALSE,
    green BOOLEAN DEFAULT FALSE,
    blue BOOLEAN DEFAULT FALSE,
    gold BOOLEAN DEFAULT FALSE,
    white BOOLEAN DEFAULT FALSE,
    black BOOLEAN DEFAULT FALSE,
    orange BOOLEAN DEFAULT FALSE,
    mainhue VARCHAR(20),
    circles INTEGER,
    crosses INTEGER,
    saltires INTEGER,
    quarters INTEGER,
    sunstars INTEGER,
    crescent INTEGER,
    triangle INTEGER,
    icon INTEGER,
    animate INTEGER,
    text INTEGER,
    topleft VARCHAR(20),
    botright VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_countries_continent ON countries(continent_id);
CREATE INDEX idx_countries_active ON countries(is_active);
CREATE INDEX idx_countries_name ON countries(name);

-- Game templates table
CREATE TABLE IF NOT EXISTS game_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) CHECK (type IN ('default', 'custom')),
    continent_id INTEGER REFERENCES continents(id),
    number_of_flags INTEGER DEFAULT 10,
    time_per_flag INTEGER DEFAULT 30,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_game_templates_type ON game_templates(type);
CREATE INDEX idx_game_templates_continent ON game_templates(continent_id);
CREATE INDEX idx_game_templates_active ON game_templates(is_active);

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES game_templates(id),
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    score INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_questions INTEGER,
    time_limit INTEGER,
    time_spent INTEGER DEFAULT 0,
    difficulty VARCHAR(20),
    continent_id INTEGER REFERENCES continents(id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_games_user ON games(user_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_completed ON games(completed_at DESC);
CREATE INDEX idx_games_score ON games(score DESC);

-- Game questions table
CREATE TABLE IF NOT EXISTS game_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    country_id INTEGER REFERENCES countries(id),
    options JSONB NOT NULL,
    user_answer_id INTEGER,
    time_limit INTEGER,
    time_taken INTEGER,
    points_earned INTEGER DEFAULT 0,
    answered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_game_questions_game ON game_questions(game_id);
CREATE INDEX idx_game_questions_number ON game_questions(question_number);

-- User sessions table (for refresh tokens)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(refresh_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Leaderboard daily table
CREATE TABLE IF NOT EXISTS leaderboard_daily (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    date DATE NOT NULL,
    continent_id INTEGER REFERENCES continents(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date, continent_id)
);

CREATE INDEX idx_leaderboard_daily_date ON leaderboard_daily(date);
CREATE INDEX idx_leaderboard_daily_score ON leaderboard_daily(score DESC);
CREATE INDEX idx_leaderboard_daily_continent ON leaderboard_daily(continent_id);

-- Leaderboard weekly table
CREATE TABLE IF NOT EXISTS leaderboard_weekly (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    week_start DATE NOT NULL,
    continent_id INTEGER REFERENCES continents(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, week_start, continent_id)
);

CREATE INDEX idx_leaderboard_weekly_week ON leaderboard_weekly(week_start);
CREATE INDEX idx_leaderboard_weekly_score ON leaderboard_weekly(score DESC);
CREATE INDEX idx_leaderboard_weekly_continent ON leaderboard_weekly(continent_id);

-- Leaderboard monthly table
CREATE TABLE IF NOT EXISTS leaderboard_monthly (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    continent_id INTEGER REFERENCES continents(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, month, year, continent_id)
);

CREATE INDEX idx_leaderboard_monthly_period ON leaderboard_monthly(year, month);
CREATE INDEX idx_leaderboard_monthly_score ON leaderboard_monthly(score DESC);
CREATE INDEX idx_leaderboard_monthly_continent ON leaderboard_monthly(continent_id);

-- Leaderboard all-time table
CREATE TABLE IF NOT EXISTS leaderboard_alltime (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    continent_id INTEGER REFERENCES continents(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, continent_id)
);

CREATE INDEX idx_leaderboard_alltime_score ON leaderboard_alltime(score DESC);
CREATE INDEX idx_leaderboard_alltime_continent ON leaderboard_alltime(continent_id);

-- User statistics table
CREATE TABLE IF NOT EXISTS user_statistics (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    continent_id INTEGER REFERENCES continents(id),
    difficulty VARCHAR(20),
    games_played INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    average_score FLOAT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, continent_id, difficulty)
);

CREATE INDEX idx_user_statistics_user ON user_statistics(user_id);
CREATE INDEX idx_user_statistics_continent ON user_statistics(continent_id);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    requirement_type VARCHAR(50),
    requirement_value INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES achievements(id),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_earned ON user_achievements(earned_at DESC);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    details JSONB,
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Grant permissions to app user
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO flag_game_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO flag_game_app;

-- Insert default game templates
INSERT INTO game_templates (name, description, type, continent_id, number_of_flags, time_per_flag, difficulty) VALUES
('Quick Africa Quiz', '10 African flags in 30 seconds each', 'default', 1, 10, 30, 'medium'),
('Quick Asia Quiz', '10 Asian flags in 30 seconds each', 'default', 2, 10, 30, 'medium'),
('Quick Europe Quiz', '10 European flags in 30 seconds each', 'default', 3, 10, 30, 'medium'),
('Quick Americas Quiz', '10 American flags in 30 seconds each', 'default', 4, 10, 30, 'medium'),
('Global Challenge', '20 flags from around the world', 'default', NULL, 20, 25, 'hard'),
('Easy Starter', '5 well-known flags', 'default', NULL, 5, 45, 'easy')
ON CONFLICT DO NOTHING;

-- Insert sample achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value) VALUES
('First Steps', 'Complete your first game', 'trophy', 'games_completed', 1),
('Flag Master', 'Complete 10 games', 'star', 'games_completed', 10),
('Perfectionist', 'Get a perfect score in a game', 'medal', 'perfect_score', 1),
('Speed Demon', 'Answer 10 questions in under 5 seconds each', 'lightning', 'fast_answers', 10),
('Global Explorer', 'Play games from all continents', 'globe', 'all_continents', 7),
('Century Club', 'Score 100 total points', 'hundred', 'total_score', 100),
('Millionaire', 'Score 1000 total points', 'diamond', 'total_score', 1000)
ON CONFLICT DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_game_templates_updated_at BEFORE UPDATE ON game_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
