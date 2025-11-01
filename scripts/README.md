# Test Data Seeder

This script seeds the database with test data required for running unit tests.

## What It Creates

### Users
- **Admin User**
  - Email: `admin@flaggame.com`
  - Password: `admin123`
  - Role: `admin`
  - Email verified: `true`

- **Player User**
  - Email: `player@flaggame.com`
  - Password: `player123`
  - Role: `player`
  - Email verified: `true`

### Countries
Seeds 20 sample countries across all continents:
- United States, Canada, Mexico (North America)
- Brazil (South America)
- United Kingdom, France, Germany, Italy, Spain, Netherlands, Sweden, Switzerland, Norway (Europe)
- Japan, China, India, South Korea, Indonesia, Singapore (Asia)
- Australia (Oceania)

### Game Templates
Creates 5 game templates:
1. **Quick Quiz** (easy) - 5 flags, 30s per flag
2. **World Challenge** (medium) - 10 flags, 60s per flag
3. **Expert Mode** (hard) - 20 flags, 120s per flag
4. **European Flags** (medium, custom) - 10 flags, 60s per flag
5. **Asian Flags** (medium, custom) - 10 flags, 60s per flag

### Sample Game Data
- 1 completed game for the player user
- Leaderboard entries in all 4 leaderboard tables (daily, weekly, monthly, all-time)

## Usage

### Manual Seeding
```bash
npm run test:seed
```

### Automatic Seeding
The seeder automatically runs before tests via `tests/setup.js`. No manual intervention needed for testing.

## How It Works

1. **Cleans Existing Data**: Deletes all test data (users with @flaggame.com emails, games, leaderboards, etc.)
2. **Seeds Users**: Creates admin and player accounts with hashed passwords
3. **Seeds Countries**: Inserts sample countries with continent associations
4. **Seeds Templates**: Creates game templates with various difficulties
5. **Seeds Game Data**: Creates sample completed game
6. **Seeds Leaderboards**: Populates all leaderboard tables

## Database Requirements

The seeder expects the following tables to exist:
- `users`
- `continents` (with pre-seeded continent data)
- `countries`
- `game_templates`
- `games`
- `game_questions`
- `leaderboard_daily`
- `leaderboard_weekly`
- `leaderboard_monthly`
- `leaderboard_alltime`

Make sure migrations have been run before using the seeder:
```bash
# If using migrations
npm run migrate
```

## Environment Variables

Uses the database configuration from your environment:
- In test mode: Uses `.env.test` configuration
- In manual mode: Uses `.env` or `.env.development` configuration

## Cleaning Data

The seeder automatically cleans existing test data before seeding. It only removes:
- Users with emails ending in `@flaggame.com`
- Users with emails starting with `test` and ending in `@example.com`
- All games and leaderboard entries (to avoid orphaned data)

**Note**: Production data is NOT affected.

## Error Handling

If seeding fails:
1. Check database connection (ensure PostgreSQL is running)
2. Verify all required tables exist
3. Check that continents table has data
4. Review error messages for specific SQL issues

## Extending the Seeder

To add more test data:

1. Add new data to the appropriate arrays in `seed-test-data.js`
2. Add cleanup for new data types in the cleaning section
3. Test the seeder manually before committing

Example - Adding more countries:
```javascript
const countries = [
  // ... existing countries
  { name: 'Egypt', flag_url: '/flags/eg.svg', continent: 'Africa' },
  // ... add more
];
```

## Troubleshooting

### "relation does not exist" errors
- Run database migrations first: `npm run migrate`

### "password authentication failed"
- Check `.env.test` file has correct database credentials
- Ensure PostgreSQL user exists and has permissions

### Duplicate key errors
- The seeder uses ON CONFLICT clauses for idempotency
- If you see these errors, check the cleanup queries

## Related Files

- `tests/setup.js` - Calls the seeder before tests run
- `.env.test` - Test environment database configuration
- `database/init.sql` - Database schema definition
