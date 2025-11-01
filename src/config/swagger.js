const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Flag Guesser Game API',
      version: '1.0.0',
      description: 'REST API for Flag Guesser Game Platform - A multiplayer flag guessing game with leaderboards, achievements, and real-time gameplay',
      contact: {
        name: 'Flag Guesser Team',
        email: 'support@flagguesser.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.flagguesser.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User unique identifier',
            },
            username: {
              type: 'string',
              description: 'Username (3-50 characters)',
              minLength: 3,
              maxLength: 50,
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            role: {
              type: 'string',
              enum: ['player', 'admin'],
              description: 'User role',
            },
            photoUrl: {
              type: 'string',
              nullable: true,
              description: 'Profile photo URL',
            },
            isEmailVerified: {
              type: 'boolean',
              description: 'Email verification status',
            },
            totalGamesPlayed: {
              type: 'integer',
              description: 'Total games played',
            },
            totalCorrectAnswers: {
              type: 'integer',
              description: 'Total correct answers',
            },
            totalScore: {
              type: 'integer',
              description: 'Total accumulated score',
            },
            averageResponseTime: {
              type: 'number',
              format: 'float',
              description: 'Average response time in seconds',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Country: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Country ID',
            },
            name: {
              type: 'string',
              description: 'Country name',
            },
            flagUrl: {
              type: 'string',
              description: 'Flag image URL',
            },
            continentId: {
              type: 'integer',
              description: 'Continent ID',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether country is active in games',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Game: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Game ID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'Player ID',
            },
            status: {
              type: 'string',
              enum: ['in_progress', 'completed', 'abandoned'],
              description: 'Game status',
            },
            score: {
              type: 'integer',
              description: 'Current score',
            },
            correctAnswers: {
              type: 'integer',
              description: 'Number of correct answers',
            },
            totalQuestions: {
              type: 'integer',
              description: 'Total number of questions',
            },
            timeLimit: {
              type: 'integer',
              description: 'Time limit per question in seconds',
            },
            timeSpent: {
              type: 'integer',
              description: 'Total time spent in seconds',
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              description: 'Game difficulty',
            },
            continentId: {
              type: 'integer',
              nullable: true,
              description: 'Continent filter (null for global)',
            },
            startedAt: {
              type: 'string',
              format: 'date-time',
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
        GameTemplate: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              description: 'Template name',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Template description',
            },
            type: {
              type: 'string',
              enum: ['default', 'custom'],
              description: 'Template type',
            },
            continentId: {
              type: 'integer',
              nullable: true,
              description: 'Continent filter',
            },
            numberOfFlags: {
              type: 'integer',
              description: 'Number of flags in game',
            },
            timePerFlag: {
              type: 'integer',
              description: 'Time per flag in seconds',
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              description: 'Game difficulty',
            },
            isActive: {
              type: 'boolean',
              description: 'Template availability',
            },
          },
        },
        LeaderboardEntry: {
          type: 'object',
          properties: {
            rank: {
              type: 'integer',
              description: 'Player rank',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            username: {
              type: 'string',
              description: 'Player username',
            },
            photoUrl: {
              type: 'string',
              nullable: true,
            },
            score: {
              type: 'integer',
              description: 'Player score',
            },
            gamesPlayed: {
              type: 'integer',
              description: 'Number of games played',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
              },
              description: 'Validation errors (if any)',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Success message',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Users',
        description: 'User management and profile endpoints',
      },
      {
        name: 'Countries',
        description: 'Country and flag data endpoints',
      },
      {
        name: 'Games',
        description: 'Game session management endpoints',
      },
      {
        name: 'Leaderboard',
        description: 'Player rankings and leaderboards',
      },
      {
        name: 'Game Templates',
        description: 'Pre-configured game templates',
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints (admin only)',
      },
      {
        name: 'Health',
        description: 'API health and status endpoints',
      },
    ],
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
