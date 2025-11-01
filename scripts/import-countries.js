const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const db = {
  query: (text, params) => pool.query(text, params),
  end: () => pool.end(),
};

const landmassToContinent = {
  '1': 4, // North America
  '2': 5, // South America
  '3': 3, // Europe
  '4': 1, // Africa
  '5': 2, // Asia
  '6': 6, // Oceania
};

async function importCountries() {
  console.log('Starting country import from flags.csv...');

  try {
    const csvPath = '/app/flags.csv';
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvData.split('\n').slice(1); // Skip header

    let imported = 0;
    let skipped = 0;

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.split(';');
      if (parts.length < 3) continue;

      const name = parts[0].trim().replace(/-/g, ' ');
      let flagUrl = parts[1] ? parts[1].trim() : '';
      const landmass = parts[2].trim();
      const continentId = landmassToContinent[landmass];

      // Skip if no continent mapping or no name
      if (!continentId || !name) {
        console.log(`Skipping invalid entry: ${name || 'unknown'}`);
        skipped++;
        continue;
      }

      // Generate a placeholder flag URL if missing
      if (!flagUrl) {
        const encodedName = encodeURIComponent(name.replace(/ /g, '_'));
        flagUrl = `https://upload.wikimedia.org/wikipedia/commons/Flag_of_${encodedName}.svg`;
      }

      try {
        await db.query(
          `INSERT INTO countries (name, flag_url, continent_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (name) DO UPDATE SET flag_url = $2, continent_id = $3`,
          [name, flagUrl, continentId]
        );
        imported++;
        console.log(`✓ Imported: ${name} (${continentId})`);
      } catch (error) {
        console.error(`Error importing ${name}:`, error.message);
        skipped++;
      }
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   Imported: ${imported}`);
    console.log(`   Skipped: ${skipped}`);

    // Show counts per continent
    const result = await db.query(`
      SELECT c.name as continent, COUNT(co.id) as count
      FROM continents c
      LEFT JOIN countries co ON c.id = co.continent_id
      GROUP BY c.id, c.name
      ORDER BY c.id
    `);
    
    console.log('\nCountries per continent:');
    result.rows.forEach(row => {
      console.log(`  ${row.continent}: ${row.count}`);
    });

  } catch (error) {
    console.error('Error importing countries:', error);
    throw error;
  } finally {
    await db.end();
  }
}

importCountries();
