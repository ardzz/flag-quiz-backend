const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
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

// Mapping of landmass values to continent IDs
const landmassToContinent = {
  1: 4, // North America
  2: 5, // South America
  3: 3, // Europe
  4: 1, // Africa
  5: 2, // Asia
  6: 6, // Oceania
};

// Clean BOM from string
function cleanBOM(str) {
  if (!str) return str;
  return str.replace(/^\uFEFF/, '').trim();
}

async function importFlags() {
  try {
    console.log('Starting flag import...');

    const csvFilePath = path.join(__dirname, '..', 'flags.csv');
    const flags = [];

    // Read and parse CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv({ 
          separator: ';',
          skipLines: 0,
          mapHeaders: ({ header }) => cleanBOM(header)
        }))
        .on('data', (row) => {
          // Clean the name field (might have BOM)
          const name = cleanBOM(row.name);
          const image = row.image;
          
          // Skip rows without a name or image
          if (!name || !image) {
            console.log('Skipping row:', { name, image });
            return;
          }

          const flag = {
            name: name,
            flag_url: image.trim(),
            continent_id: landmassToContinent[parseInt(row.landmass)] || null,
            landmass: parseInt(row.landmass) || null,
            zone: parseInt(row.zone) || null,
            area: parseInt(row.area) || null,
            population: parseInt(row.population) || null,
            language: parseInt(row.language) || null,
            religion: parseInt(row.religion) || null,
            bars: parseInt(row.bars) || 0,
            stripes: parseInt(row.stripes) || 0,
            colours: parseInt(row.colours) || 0,
            red: parseInt(row['red '] || row.red) === 1,
            green: parseInt(row.green) === 1,
            blue: parseInt(row.blue) === 1,
            gold: parseInt(row.gold) === 1,
            white: parseInt(row.white) === 1,
            black: parseInt(row.black) === 1,
            orange: parseInt(row['orange '] || row.orange) === 1,
            mainhue: row.mainhue?.trim() || null,
            circles: parseInt(row.circles) || 0,
            crosses: parseInt(row.crosses) || 0,
            saltires: parseInt(row.saltires) || 0,
            quarters: parseInt(row.quarters) || 0,
            sunstars: parseInt(row.sunstars) || 0,
            crescent: parseInt(row.crescent) || 0,
            triangle: parseInt(row.triangle) || 0,
            icon: parseInt(row.icon) || 0,
            animate: parseInt(row.animate) || 0,
            text: parseInt(row.text) || 0,
            topleft: row.topleft?.trim() || null,
            botright: row.botright?.trim() || null,
            is_active: true,
          };

          flags.push(flag);
        })
        .on('end', () => {
          console.log(`Parsed ${flags.length} flags from CSV`);
          resolve();
        })
        .on('error', reject);
    });

    if (flags.length === 0) {
      console.log('⚠️  No flags were parsed from the CSV file');
      return;
    }

    // Insert flags into database
    console.log('Inserting flags into database...');
    
    // Use batch insert for better performance
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < flags.length; i += batchSize) {
      const batch = flags.slice(i, i + batchSize);
      
      await db('countries')
        .insert(batch)
        .onConflict('name')
        .merge(); // Update if exists
      
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${flags.length} flags...`);
    }

    console.log(`✅ Successfully imported ${flags.length} flags!`);

    // Show summary
    const summary = await db('countries')
      .select('continent_id')
      .count('* as count')
      .groupBy('continent_id')
      .orderBy('continent_id');

    console.log('\nFlags by continent:');
    const continents = await db('continents').select('id', 'name');
    const continentMap = {};
    continents.forEach(c => continentMap[c.id] = c.name);

    summary.forEach(s => {
      const continentName = continentMap[s.continent_id] || 'Unknown';
      console.log(`  ${continentName}: ${s.count} flags`);
    });

  } catch (error) {
    console.error('❌ Error importing flags:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Run the import
importFlags();
