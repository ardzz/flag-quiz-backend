const bcrypt = require('bcryptjs');
const knex = require('knex');
require('dotenv').config();

// Database configuration
const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'flag_game_app',
    password: process.env.DB_PASSWORD || 'your_secure_password',
    database: process.env.DB_NAME || 'flag_game_db',
  },
});

async function createDummyUsers() {
  try {
    console.log('Creating dummy users...');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const playerPassword = await bcrypt.hash('player123', 10);

    // Create admin user
    const adminData = {
      username: 'admin',
      email: 'admin@flaggame.com',
      password_hash: adminPassword,
      role: 'admin',
      is_email_verified: true,
      total_games_played: 0,
      total_correct_answers: 0,
      total_score: 0,
      average_response_time: 0,
    };

    // Create player user
    const playerData = {
      username: 'player',
      email: 'player@flaggame.com',
      password_hash: playerPassword,
      role: 'player',
      is_email_verified: true,
      total_games_played: 5,
      total_correct_answers: 35,
      total_score: 450,
      average_response_time: 12.5,
    };

    // Insert or update users
    await db('users')
      .insert(adminData)
      .onConflict('username')
      .merge();

    console.log('✅ Admin user created/updated:');
    console.log('   Username: admin');
    console.log('   Email: admin@flaggame.com');
    console.log('   Password: admin123');
    console.log('   Role: admin\n');

    await db('users')
      .insert(playerData)
      .onConflict('username')
      .merge();

    console.log('✅ Player user created/updated:');
    console.log('   Username: player');
    console.log('   Email: player@flaggame.com');
    console.log('   Password: player123');
    console.log('   Role: player\n');

    // Get the created users
    const admin = await db('users').where({ username: 'admin' }).first();
    const player = await db('users').where({ username: 'player' }).first();

    console.log('User IDs:');
    console.log(`   Admin ID: ${admin.id}`);
    console.log(`   Player ID: ${player.id}`);

    console.log('\n✅ Dummy users created successfully!');
  } catch (error) {
    console.error('❌ Error creating dummy users:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Run the script
createDummyUsers();
