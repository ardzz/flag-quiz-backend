# Flag Guesser Game API 🎌

A comprehensive REST API for a multiplayer flag guessing game platform. Test your geography knowledge by identifying country flags from around the world!

## 🌟 Features

- **Multiple Game Modes**: Play with pre-configured templates or create custom games
- **6 Continents**: Focus on specific regions or go global
- **Difficulty Levels**: Easy, Medium, and Hard
- **Real-time Scoring**: Time-based points system with bonuses
- **Leaderboards**: Daily, Weekly, Monthly, and All-time rankings
- **User Achievements**: Unlock achievements as you play
- **JWT Authentication**: Secure user sessions
- **Swagger Documentation**: Interactive API documentation at `/api-docs`
- **PostgreSQL Database**: Robust data persistence
- **Redis Caching**: Optimized performance

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 13
- Redis (optional, for caching)
- Docker & Docker Compose (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flag-quiz-backend-copilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=flag_game_app
   DB_PASSWORD=your_secure_password
   DB_NAME=flag_game_db
   
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   ```

4. **Setup database with Docker Compose**
   ```bash
   docker-compose up -d
   ```
   
   Or manually create PostgreSQL database:
   ```bash
   createdb flag_game_db
   ```

5. **Run migrations**
   ```bash
   npm run migrate
   ```

6. **Seed the database**
   ```bash
   # Import countries/flags
   node scripts/import-flags.js
   
   # Create dummy users
   node scripts/create-dummy-users.js
   ```

7. **Start the server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Interactive Documentation
Visit `http://localhost:3000/api-docs` for Swagger UI with interactive API testing.

### Postman Collection
Import `Flag-Guesser-API.postman_collection.json` and `Flag-Guesser-Local.postman_environment.json` into Postman for ready-to-use API requests.

## 🎮 Game Templates

The system includes 6 pre-configured game templates:

| Template | Flags | Time/Flag | Difficulty | Continent |
|----------|-------|-----------|------------|-----------|
| Quick Africa Quiz | 10 | 30s | Medium | Africa |
| Quick Asia Quiz | 4 | 30s | Medium | Asia |
| Quick Europe Quiz | 10 | 30s | Medium | Europe |
| Quick Americas Quiz | 10 | 30s | Medium | North America |
| Global Challenge | 20 | 25s | Hard | All |
| Easy Starter | 5 | 45s | Easy | All |

## 🔑 Authentication

### Dummy Users

Two test users are available:

**Admin User:**
- Email: `admin@flaggame.com`
- Password: `admin123`

**Player User:**
- Email: `player@flaggame.com`
- Password: `player123`

### Login Example

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player@flaggame.com",
    "password": "player123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

## 🎯 Playing a Game

### 1. Create a Game

Using a template:
```bash
curl -X POST http://localhost:3000/api/v1/games \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "92c18ad5-498c-4e11-8841-46f078f57b8f"
  }'
```

Using custom options:
```bash
curl -X POST http://localhost:3000/api/v1/games \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customOptions": {
      "continentId": 1,
      "numberOfFlags": 10,
      "timePerFlag": 30,
      "difficulty": "medium"
    }
  }'
```

### 2. Answer Questions

```bash
curl -X POST http://localhost:3000/api/v1/games/{gameId}/questions/{questionId}/answer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answerId": 5,
    "timeTaken": 15
  }'
```

### 3. Complete Game

```bash
curl -X POST http://localhost:3000/api/v1/games/{gameId}/complete \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Leaderboards

Get daily leaderboard:
```bash
curl http://localhost:3000/api/v1/leaderboard/daily?limit=10
```

Available leaderboards:
- `/leaderboard/daily` - Today's top players
- `/leaderboard/weekly` - This week's rankings
- `/leaderboard/monthly` - This month's rankings
- `/leaderboard/all-time` - All-time best players

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start with nodemon (auto-reload)
npm run dev:debug    # Start with debugging enabled

# Production
npm start            # Start production server

# Database
npm run migrate      # Run database migrations
npm run seed         # Seed database

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode

# Code Quality
npm run lint         # Check code quality
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
```

## 🗄️ Database Schema

### Core Tables

- **users** - User accounts and profiles
- **countries** - Flag data and metadata (75 countries)
- **continents** - Continent reference data (7 continents)
- **game_templates** - Pre-configured game settings (6 templates)
- **games** - Active and completed game sessions
- **game_questions** - Questions within games
- **achievements** - Achievement definitions
- **user_achievements** - Earned achievements
- **leaderboard_*** - Rankings (daily, weekly, monthly, all-time)

## 🏗️ Project Structure

```
flag-quiz-backend-copilot/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── swagger.js
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── validators/      # Request validation
├── database/
│   ├── migrations/      # Database migrations
│   └── seeds/           # Database seeds
├── scripts/             # Utility scripts
│   ├── import-flags.js
│   ├── create-dummy-users.js
│   └── check-templates.js
├── tests/               # Test files
├── uploads/             # Uploaded files
└── logs/                # Application logs
```

## 🌍 Continents & Countries

| ID | Continent | Countries Available |
|----|-----------|---------------------|
| 1 | Africa | 21 |
| 2 | Asia | 7 |
| 3 | Europe | 15 |
| 4 | North America | 17 |
| 5 | South America | 9 |
| 6 | Oceania | 6 |

**Total:** 75 countries with flag images from Wikimedia Commons

## 🎨 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/verify-email/:token` - Verify email

### Users
- `GET /api/v1/users/profile` - Get current user profile
- `PUT /api/v1/users/profile` - Update profile
- `POST /api/v1/users/upload-photo` - Upload profile photo
- `GET /api/v1/users/:id` - Get user by ID
- `GET /api/v1/users/:id/statistics` - Get user statistics
- `GET /api/v1/users/:id/achievements` - Get user achievements

### Countries
- `GET /api/v1/countries` - Get all countries (paginated)
- `GET /api/v1/countries/continent/:id` - Get countries by continent
- `GET /api/v1/countries/random` - Get random countries
- `GET /api/v1/countries/:id` - Get country by ID

### Games
- `POST /api/v1/games` - Create new game
- `GET /api/v1/games` - Get user's game history
- `GET /api/v1/games/:id` - Get game details
- `GET /api/v1/games/:id/question/:number` - Get specific question
- `POST /api/v1/games/:id/questions/:qid/answer` - Submit answer
- `POST /api/v1/games/:id/complete` - Complete game
- `PUT /api/v1/games/:id/abandon` - Abandon game

### Leaderboard
- `GET /api/v1/leaderboard/daily` - Daily rankings
- `GET /api/v1/leaderboard/weekly` - Weekly rankings
- `GET /api/v1/leaderboard/monthly` - Monthly rankings
- `GET /api/v1/leaderboard/all-time` - All-time rankings
- `GET /api/v1/leaderboard/user/:id` - User's ranks

### Game Templates
- `GET /api/v1/game-templates` - Get all templates
- `GET /api/v1/game-templates/continent/:id` - Get templates by continent
- `POST /api/v1/game-templates` - Create custom template
- `PUT /api/v1/game-templates/:id` - Update template
- `DELETE /api/v1/game-templates/:id` - Delete template

### Health & Docs
- `GET /health` - API health status
- `GET /api-docs` - Swagger UI documentation
- `GET /api-docs.json` - OpenAPI specification

## 🔒 Security

- JWT-based authentication with refresh tokens
- Bcrypt password hashing (10 rounds)
- Rate limiting on authentication endpoints
- Helmet.js security headers
- CORS configuration
- Input validation with express-validator
- SQL injection prevention with parameterized queries
- XSS protection

## ⚡ Performance

- Redis caching for leaderboards and frequently accessed data
- Database connection pooling with pg
- Response compression with gzip
- Pagination on all list endpoints
- Indexed database queries
- Optimized query patterns

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

Test with Postman:
1. Import `Flag-Guesser-API.postman_collection.json`
2. Import `Flag-Guesser-Local.postman_environment.json`
3. Run the collection

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment (development/production) | development |
| API_VERSION | API version | v1 |
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_USER | Database user | flag_game_app |
| DB_PASSWORD | Database password | - |
| DB_NAME | Database name | flag_game_db |
| JWT_SECRET | JWT secret key (min 32 chars) | - |
| JWT_EXPIRES_IN | Access token expiry | 15m |
| JWT_REFRESH_EXPIRES_IN | Refresh token expiry | 7d |
| REDIS_HOST | Redis host (optional) | localhost |
| REDIS_PORT | Redis port | 6379 |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3001 |

## 🐳 Docker

Start all services with Docker Compose:

```bash
# Development mode
docker-compose -f docker-compose.dev.yml up -d

# Production mode
docker-compose up -d
```

Services included:
- **API Server** - Port 3000
- **PostgreSQL** - Port 5432
- **Redis** - Port 6379

## 📦 Database Setup

### Migrations
```bash
npm run migrate
```

### Seeding
```bash
# Import flag data (75 countries)
node scripts/import-flags.js

# Create test users (admin & player)
node scripts/create-dummy-users.js

# Check template playability
node scripts/check-templates.js
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Development Team - Flag Guesser Game Platform

## 🙏 Acknowledgments

- Flag images from [Wikimedia Commons](https://commons.wikimedia.org/)
- Flag dataset inspired by [UCI Machine Learning Repository](https://archive.ics.uci.edu/ml/datasets/Flags)
- Built with Node.js, Express, PostgreSQL, and Redis

## 📞 Support

For support or questions:
- Open an issue in the repository
- Email: support@flagguesser.com

---

**Happy Flag Guessing! 🎌🌍**
- Podman and podman-compose (or Docker and Docker Compose)
- PostgreSQL 15 (if not using containers)
- Redis 7 (if not using containers)

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd flag-quiz-backend-copilot
```

### 2. Environment Configuration

Copy the example environment file and update with your settings:

```bash
cp .env.example .env
```

Edit `.env` and update the following:
- JWT secrets
- Email configuration (SMTP)
- Database password
- Redis password

### 3. Start with Container Compose

```bash
# Using Podman
podman-compose up -d

# Or using Docker
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- API server
- PgAdmin (database management UI)

### 4. Access the Application

- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **PgAdmin**: http://localhost:5050 (admin@flaggame.com / admin_password)

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `GET /verify-email/:token` - Verify email
- `POST /login` - User login
- `POST /refresh-token` - Refresh access token
- `POST /logout` - Logout user
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password

### Users (`/api/v1/users`)
- `GET /profile` - Get current user profile
- `PUT /profile` - Update profile
- `POST /upload-photo` - Upload profile photo
- `GET /:id` - Get user by ID
- `GET /:id/statistics` - Get user statistics
- `GET /:id/achievements` - Get user achievements

### Games (`/api/v1/games`)
- `POST /` - Create new game
- `GET /` - Get user's games
- `GET /:gameId` - Get game details
- `GET /:gameId/question/:number` - Get question
- `POST /:gameId/questions/:questionId/answer` - Submit answer
- `POST /:gameId/complete` - Complete game
- `PUT /:gameId/abandon` - Abandon game

### Leaderboards (`/api/v1/leaderboard`)
- `GET /daily` - Daily leaderboard
- `GET /weekly` - Weekly leaderboard
- `GET /monthly` - Monthly leaderboard
- `GET /all-time` - All-time leaderboard
- `GET /user/:userId` - User ranks

### Countries (`/api/v1/countries`)
- `GET /` - List all countries
- `GET /continent/:continentId` - Get countries by continent
- `GET /random` - Get random countries
- `GET /:id` - Get country details

### Game Templates (`/api/v1/game-templates`)
- `GET /` - List all templates
- `GET /continent/:continentId` - Get templates by continent
- `POST /` - Create custom template
- `PUT /:id` - Update template
- `DELETE /:id` - Delete template

### Admin (`/api/v1/admin`) - Requires Admin Role
- `GET /users` - List all users
- `PUT /users/:id/role` - Update user role
- `DELETE /users/:id` - Delete user
- `POST /countries/import` - Import countries from CSV
- `PUT /countries/:id` - Update country
- `DELETE /countries/:id` - Deactivate country
- `GET /statistics` - System statistics
- `GET /audit-logs` - View audit logs

## Development

### Install Dependencies

```bash
npm install
```

### Run in Development Mode

```bash
npm run dev
```

### Run Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

## Database Management

### Connect to PostgreSQL

```bash
# Using Podman
podman-compose exec postgres psql -U postgres -d flag_game_db

# Or using Docker
docker-compose exec postgres psql -U postgres -d flag_game_db
```

### Backup Database

```bash
# Using Podman
podman-compose exec postgres pg_dump -U postgres flag_game_db > backup.sql

# Or using Docker
docker-compose exec postgres pg_dump -U postgres flag_game_db > backup.sql
```

### Restore Database

```bash
# Using Podman
podman-compose exec -T postgres psql -U postgres flag_game_db < backup.sql

# Or using Docker
docker-compose exec -T postgres psql -U postgres flag_game_db < backup.sql
```

### Access Redis CLI

```bash
# Using Podman
podman-compose exec redis redis-cli -a redis_password

# Or using Docker
docker-compose exec redis redis-cli -a redis_password
```

## Project Structure

```
flag-quiz-backend-copilot/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   ├── validators/       # Input validators
│   └── app.js           # Main application
├── database/
│   ├── migrations/       # Database migrations
│   ├── seeds/           # Seed data
│   └── init.sql         # Initial schema
├── tests/               # Test files
├── uploads/             # Uploaded files
├── .env                 # Environment variables
├── docker-compose.yml   # Docker compose config
├── Dockerfile           # Docker image config
└── package.json         # Node dependencies
```

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `NODE_ENV` - Environment (development/production)
- `PORT` - API server port
- `DB_*` - Database connection settings
- `REDIS_*` - Redis connection settings
- `JWT_SECRET` - JWT signing secret
- `EMAIL_*` - Email service configuration

## Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt (12 rounds)
- Rate limiting (100 req/15min)
- Input validation with express-validator
- SQL injection prevention
- XSS protection with Helmet
- CORS configuration
- File upload restrictions

## Performance Optimizations

- Redis caching for:
  - Leaderboards (5min TTL)
  - Countries (1hr TTL)
  - User statistics (10min TTL)
- Database indexes on frequently queried columns
- Pagination on all list endpoints
- Connection pooling
- Compression middleware

## Logging

Logs are stored in:
- `logs/error.log` - Error logs
- `logs/combined.log` - All logs

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.

## Acknowledgments

- Flag data from flags.csv
- Built with Express.js and PostgreSQL
- Containerized with Docker
