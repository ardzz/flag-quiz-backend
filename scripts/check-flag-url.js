const https = require('https');
const http = require('http');
const db = require('./src/config/database');

/**
 * Quick script to check and fix specific broken flag URL
 * Usage: node scripts/check-flag-url.js "Country Name"
 */

// Helper to make HTTP requests
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { timeout: 5000 }, (res) => {
      resolve(res);
      res.resume(); // Consume response data
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

function httpHead(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    client.request({
      method: 'HEAD',
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      timeout: 5000
    }, (res) => {
      resolve(res);
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout'))).end();
  });
}

async function checkAndFixFlag(countryName) {
  try {
    // Get the country
    const result = await db.query(
      'SELECT id, name, flag_url FROM countries WHERE name ILIKE $1',
      [countryName]
    );

    if (result.rows.length === 0) {
      console.log(`Country "${countryName}" not found`);
      return;
    }

    const country = result.rows[0];
    console.log(`\nCountry: ${country.name}`);
    console.log(`Current URL: ${country.flag_url}`);

    // Check if current URL works
    console.log('\nChecking current URL...');
    try {
      const response = await httpHead(country.flag_url);
      if (response.statusCode === 200) {
        console.log('✓ Current URL is valid!');
        return;
      }
      console.log(`✗ Current URL returned status: ${response.statusCode}`);
    } catch (error) {
      console.log(`✗ Current URL is broken: ${error.message}`);
    }

    // Extract filename
    const filename = country.flag_url.split('/').pop();
    console.log(`\nSearching Wikimedia Commons for: ${filename}`);

    // Search using Wikimedia Commons API
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
    
    console.log('Querying API...');
    const apiResponse = await httpGet(apiUrl);
    
    let data = '';
    apiResponse.on('data', chunk => data += chunk);
    
    await new Promise((resolve, reject) => {
      apiResponse.on('end', resolve);
      apiResponse.on('error', reject);
    });

    const jsonData = JSON.parse(data);
    const pages = jsonData.query.pages;
    const page = Object.values(pages)[0];

    if (page && page.imageinfo && page.imageinfo[0]) {
      const newUrl = page.imageinfo[0].url;
      console.log(`\nFound new URL: ${newUrl}`);

      // Verify the new URL works
      console.log('Verifying new URL...');
      try {
        const verifyResponse = await httpHead(newUrl);
        if (verifyResponse.statusCode === 200) {
          console.log('✓ New URL is valid!');

          // Update database
          await db.query(
            'UPDATE countries SET flag_url = $1 WHERE id = $2',
            [newUrl, country.id]
          );

          console.log('\n✓ Database updated successfully!');
          console.log(`Old: ${country.flag_url}`);
          console.log(`New: ${newUrl}`);
        } else {
          console.log(`✗ New URL returned status: ${verifyResponse.statusCode}`);
        }
      } catch (error) {
        console.log(`✗ New URL verification failed: ${error.message}`);
      }
    } else {
      console.log('✗ Could not find flag on Wikimedia Commons');
      console.log('API Response:', JSON.stringify(jsonData, null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.end();
  }
}

// Run if called directly
if (require.main === module) {
  const countryName = process.argv[2] || 'Tonga';
  checkAndFixFlag(countryName)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = { checkAndFixFlag };
