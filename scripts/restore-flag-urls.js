const fs = require('fs');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,  // Correct port
  database: process.env.DB_NAME || 'flag_game_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_dev_password',
});

async function restoreFlagUrls() {
  console.log('Restoring flag URLs from flags.csv...\n');

  try {
    // Test connection
    console.log('Connecting to database...');
    await pool.query('SELECT 1');
    console.log('✓ Database connected\n');

    // Read CSV file
    console.log('Reading flags.csv...');
    const csvPath = 'flags.csv';
    if (!fs.existsSync(csvPath)) {
      throw new Error('flags.csv not found!');
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    console.log(`✓ CSV file read (${csvContent.length} bytes)\n`);
    
    const lines = csvContent.split('\n');
    console.log(`Found ${lines.length} lines\n`);
    
    // Skip header line and BOM
    const dataLines = lines.slice(1);
    
    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (const line of dataLines) {
      if (!line.trim()) continue;
      
      const parts = line.split(';');
      if (parts.length < 2) continue;
      
      // Remove BOM and clean name
      let countryName = parts[0].trim().replace(/^\uFEFF/, '').replace(/-/g, ' ');
      const flagUrl = parts[1].trim();
      
      if (!countryName || !flagUrl) continue;
      
      // Handle special cases
      if (countryName === 'American Samoa') countryName = 'American Samoa';
      else if (countryName === 'Antigua Barbuda') countryName = 'Antigua Barbuda';
      
      try {
        // Try exact match first
        let result = await pool.query(
          'UPDATE countries SET flag_url = $1 WHERE name = $2 RETURNING id',
          [flagUrl, countryName]
        );
        
        // If no match, try case-insensitive
        if (result.rowCount === 0) {
          result = await pool.query(
            'UPDATE countries SET flag_url = $1 WHERE LOWER(name) = LOWER($2) RETURNING id',
            [flagUrl, countryName]
          );
        }
        
        // If still no match, try partial match
        if (result.rowCount === 0) {
          result = await pool.query(
            'UPDATE countries SET flag_url = $1 WHERE name ILIKE $2 RETURNING id',
            [flagUrl, `%${countryName}%`]
          );
        }
        
        if (result.rowCount > 0) {
          console.log(`✓ Updated: ${countryName}`);
          updated++;
        } else {
          console.log(`✗ Not found in DB: ${countryName}`);
          notFound++;
        }
        
      } catch (error) {
        console.log(`✗ Error updating ${countryName}: ${error.message}`);
        errors++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log(`  Updated:   ${updated}`);
    console.log(`  Not found: ${notFound}`);
    console.log(`  Errors:    ${errors}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run
restoreFlagUrls()
  .then(() => {
    console.log('\n✓ Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
