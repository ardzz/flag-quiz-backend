const knex = require('knex');
require('dotenv').config();

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: 5432,
    user: process.env.DB_USER || 'flag_game_app',
    password: process.env.DB_PASSWORD || 'your_secure_password',
    database: process.env.DB_NAME || 'flag_game_db',
  },
});

async function checkTemplatePlayability() {
  try {
    const templates = await db('game_templates').select('*');
    
    console.log('\n========================================================================');
    console.log('              GAME TEMPLATES PLAYABILITY CHECK');
    console.log('========================================================================\n');

    const results = [];
    
    for (const template of templates) {
      console.log(`\nTemplate: ${template.name}`);
      console.log(`  ID: ${template.id}`);
      console.log(`  Continent: ${template.continent_id ? `ID ${template.continent_id}` : 'ALL (Global)'}`);
      console.log(`  Flags Needed: ${template.number_of_flags}`);
      console.log(`  Time/Flag: ${template.time_per_flag}s`);
      console.log(`  Difficulty: ${template.difficulty}`);
      
      let query = db('countries').where('is_active', true);
      if (template.continent_id) {
        query = query.where('continent_id', template.continent_id);
      }
      
      const available = await query.count('* as count');
      const count = parseInt(available[0].count);
      const needed = template.number_of_flags + 3; // Need 3 extra for wrong options
      
      console.log(`  Available Countries: ${count}`);
      console.log(`  Required (for 4 options): ${needed}`);
      
      const playable = count >= needed;
      
      if (playable) {
        console.log(`  Status: PLAYABLE - Enough countries available`);
      } else {
        console.log(`  Status: NOT PLAYABLE - Need ${needed - count} more countries`);
      }
      
      results.push({
        name: template.name,
        playable,
        available: count,
        needed,
      });
    }

    console.log('\n========================================================================');
    console.log('                          SUMMARY');
    console.log('========================================================================\n');
    
    const totalTemplates = results.length;
    const playableCount = results.filter(r => r.playable).length;
    const notPlayableCount = results.filter(r => !r.playable).length;
    
    console.log(`Total Templates: ${totalTemplates}`);
    console.log(`Playable: ${playableCount}`);
    console.log(`Not Playable: ${notPlayableCount}\n`);
    
    if (notPlayableCount > 0) {
      console.log('Templates NOT Playable:');
      results.filter(r => !r.playable).forEach(r => {
        console.log(`  - ${r.name}: Need ${r.needed - r.available} more countries`);
      });
      console.log('');
    }
    
    console.log('Recommendation:');
    if (playableCount === totalTemplates) {
      console.log('  All templates are playable!');
    } else {
      console.log('  Import more flags to make all templates playable.');
      console.log('  Current CSV has 194 countries, but only 75 have image URLs.');
    }
    console.log('');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.destroy();
  }
}

checkTemplatePlayability();
