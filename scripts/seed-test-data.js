const bcrypt = require('bcryptjs');
const db = require('../src/config/database');

async function seedTestData() {
  console.log('Starting test data seeding...');

  try {
    // Clear existing test data (in reverse order of dependencies)
    console.log('Cleaning existing test data...');
    await db.query('DELETE FROM game_questions WHERE 1=1');
    await db.query('DELETE FROM games WHERE 1=1');
    await db.query('DELETE FROM leaderboard_daily WHERE 1=1');
    await db.query('DELETE FROM leaderboard_weekly WHERE 1=1');
    await db.query('DELETE FROM leaderboard_monthly WHERE 1=1');
    await db.query('DELETE FROM leaderboard_alltime WHERE 1=1');
    await db.query('DELETE FROM game_templates WHERE 1=1');
    await db.query('DELETE FROM countries WHERE 1=1');
    await db.query('DELETE FROM users WHERE email LIKE \'%@flaggame.com\'');
    await db.query('DELETE FROM users WHERE email LIKE \'test%@example.com\'');
    
    // 1. Seed Users
    console.log('Seeding users...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedPlayerPassword = await bcrypt.hash('player123', 10);
    
    const adminResult = await db.query(`
      INSERT INTO users (email, username, password_hash, role, is_email_verified)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, ['admin@flaggame.com', 'admin', hashedAdminPassword, 'admin', true]);
    
    const playerResult = await db.query(`
      INSERT INTO users (email, username, password_hash, role, is_email_verified)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, ['player@flaggame.com', 'player', hashedPlayerPassword, 'player', true]);
    
    const adminId = adminResult.rows[0].id;
    const playerId = playerResult.rows[0].id;
    
    console.log(`✓ Created admin user: ${adminId}`);
    console.log(`✓ Created player user: ${playerId}`);
    
    // 2. Seed Countries (sample data - add more as needed)
    console.log('Seeding countries...');
    
    // Get continent IDs
    const continentsResult = await db.query('SELECT id, name FROM continents');
    const continentMap = {};
    continentsResult.rows.forEach(c => {
      continentMap[c.name] = c.id;
    });
    
    const countries = [
      { name: 'United States', flag_url: '/flags/us.svg', continent: 'North America' },
      { name: 'United Kingdom', flag_url: '/flags/gb.svg', continent: 'Europe' },
      { name: 'France', flag_url: '/flags/fr.svg', continent: 'Europe' },
      { name: 'Germany', flag_url: '/flags/de.svg', continent: 'Europe' },
      { name: 'Japan', flag_url: '/flags/jp.svg', continent: 'Asia' },
      { name: 'China', flag_url: '/flags/cn.svg', continent: 'Asia' },
      { name: 'India', flag_url: '/flags/in.svg', continent: 'Asia' },
      { name: 'Brazil', flag_url: '/flags/br.svg', continent: 'South America' },
      { name: 'Canada', flag_url: '/flags/ca.svg', continent: 'North America' },
      { name: 'Australia', flag_url: '/flags/au.svg', continent: 'Oceania' },
      { name: 'Italy', flag_url: '/flags/it.svg', continent: 'Europe' },
      { name: 'Spain', flag_url: '/flags/es.svg', continent: 'Europe' },
      { name: 'Mexico', flag_url: '/flags/mx.svg', continent: 'North America' },
      { name: 'South Korea', flag_url: '/flags/kr.svg', continent: 'Asia' },
      { name: 'Indonesia', flag_url: '/flags/id.svg', continent: 'Asia' },
      { name: 'Netherlands', flag_url: '/flags/nl.svg', continent: 'Europe' },
      { name: 'Sweden', flag_url: '/flags/se.svg', continent: 'Europe' },
      { name: 'Switzerland', flag_url: '/flags/ch.svg', continent: 'Europe' },
      { name: 'Norway', flag_url: '/flags/no.svg', continent: 'Europe' },
      { name: 'Singapore', flag_url: '/flags/sg.svg', continent: 'Asia' }
    ];
    
    for (const country of countries) {
      await db.query(`
        INSERT INTO countries (name, flag_url, continent_id, is_active)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO UPDATE SET
          flag_url = EXCLUDED.flag_url,
          continent_id = EXCLUDED.continent_id,
          is_active = EXCLUDED.is_active
      `, [country.name, country.flag_url, continentMap[country.continent], true]);
    }
    
    console.log(`✓ Seeded ${countries.length} countries`);
    
    // 3. Seed Game Templates
    console.log('Seeding game templates...');
    
    const templates = [
      {
        name: 'Quick Quiz',
        description: 'A quick 5-question flag quiz',
        difficulty: 'easy',
        number_of_flags: 5,
        time_per_flag: 30,
        type: 'default'
      },
      {
        name: 'World Challenge',
        description: 'Test your knowledge of flags from around the world',
        difficulty: 'medium',
        number_of_flags: 10,
        time_per_flag: 60,
        type: 'default'
      },
      {
        name: 'Expert Mode',
        description: 'The ultimate flag quiz challenge',
        difficulty: 'hard',
        number_of_flags: 20,
        time_per_flag: 120,
        type: 'default'
      },
      {
        name: 'European Flags',
        description: 'Focus on European countries',
        difficulty: 'medium',
        number_of_flags: 10,
        time_per_flag: 60,
        type: 'custom',
        continent: 'Europe'
      },
      {
        name: 'Asian Flags',
        description: 'Test your knowledge of Asian countries',
        difficulty: 'medium',
        number_of_flags: 10,
        time_per_flag: 60,
        type: 'custom',
        continent: 'Asia'
      }
    ];
    
    const templateIds = [];
    for (const template of templates) {
      const result = await db.query(`
        INSERT INTO game_templates (name, description, difficulty, number_of_flags, time_per_flag, type, continent_id, is_active, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        template.name,
        template.description,
        template.difficulty,
        template.number_of_flags,
        template.time_per_flag,
        template.type,
        template.continent ? continentMap[template.continent] : null,
        true,
        adminId
      ]);
      templateIds.push(result.rows[0].id);
    }
    
    console.log(`✓ Seeded ${templates.length} game templates`);
    
    // 4. Seed Sample Games
    console.log('Seeding sample games...');
    
    const gameResult = await db.query(`
      INSERT INTO games (user_id, template_id, status, score, correct_answers, total_questions, time_spent, started_at, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '2 minutes')
      RETURNING id
    `, [playerId, templateIds[0], 'completed', 50, 5, 5, 120]);
    
    const gameId = gameResult.rows[0].id;
    
    console.log(`✓ Created sample game: ${gameId}`);
    
    // 5. Seed Leaderboard Entries
    console.log('Seeding leaderboard entries...');
    
    await db.query(`
      INSERT INTO leaderboard_daily (user_id, score, date)
      VALUES ($1, $2, CURRENT_DATE)
      ON CONFLICT (user_id, date, continent_id) DO NOTHING
    `, [playerId, 50]);
    
    await db.query(`
      INSERT INTO leaderboard_weekly (user_id, score, week_start)
      VALUES ($1, $2, DATE_TRUNC('week', CURRENT_DATE)::DATE)
      ON CONFLICT (user_id, week_start, continent_id) DO NOTHING
    `, [playerId, 50]);
    
    await db.query(`
      INSERT INTO leaderboard_monthly (user_id, score, month, year)
      VALUES ($1, $2, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
      ON CONFLICT (user_id, month, year, continent_id) DO NOTHING
    `, [playerId, 50]);
    
    await db.query(`
      INSERT INTO leaderboard_alltime (user_id, score)
      VALUES ($1, $2)
      ON CONFLICT (user_id, continent_id) DO NOTHING
    `, [playerId, 50]);
    
    console.log('✓ Created leaderboard entries');
    
    console.log('\n✅ Test data seeding completed successfully!');
    console.log('\nCreated:');
    console.log(`  - 2 users (admin, player)`);
    console.log(`  - ${countries.length} countries`);
    console.log(`  - ${templates.length} game templates`);
    console.log(`  - 1 sample game`);
    console.log(`  - 4 leaderboard entries`);
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedTestData()
    .then(() => {
      console.log('\nClosing database connection...');
      return db.end();
    })
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = seedTestData;
