const axios = require('axios');
const db = require('../src/config/database');

/**
 * Script to validate and fix broken flag URLs
 * Checks each flag URL and updates it if broken
 */

async function validateAndFixFlagUrls() {
  console.log('Starting flag URL validation and repair...\n');

  try {
    // Get all countries with their flag URLs
    const result = await db.query(
      'SELECT id, name, flag_url FROM countries ORDER BY name'
    );

    const countries = result.rows;
    console.log(`Found ${countries.length} countries to check\n`);

    let checkedCount = 0;
    let fixedCount = 0;
    let failedCount = 0;

    for (const country of countries) {
      checkedCount++;
      console.log(`[${checkedCount}/${countries.length}] Checking: ${country.name}`);
      console.log(`  Current URL: ${country.flag_url}`);

      try {
        // Try to access the current URL
        const response = await axios.head(country.flag_url, {
          timeout: 5000,
          validateStatus: (status) => status < 500, // Accept 4xx and 2xx
        });

        if (response.status === 200) {
          console.log(`  ✓ URL is valid\n`);
          continue;
        }

        // URL is broken (404 or other error)
        console.log(`  ✗ URL is broken (status: ${response.status})`);
        console.log(`  Attempting to fix...`);

        // Try to extract the file name and search for correct URL
        const newUrl = await findCorrectFlagUrl(country.name, country.flag_url);

        if (newUrl && newUrl !== country.flag_url) {
          // Update the database
          await db.query(
            'UPDATE countries SET flag_url = $1 WHERE id = $2',
            [newUrl, country.id]
          );

          console.log(`  ✓ Fixed! New URL: ${newUrl}\n`);
          fixedCount++;
        } else {
          console.log(`  ✗ Could not find valid URL\n`);
          failedCount++;
        }

      } catch (error) {
        console.log(`  ✗ Error checking URL: ${error.message}`);
        
        // Try to fix it anyway
        try {
          const newUrl = await findCorrectFlagUrl(country.name, country.flag_url);
          
          if (newUrl && newUrl !== country.flag_url) {
            await db.query(
              'UPDATE countries SET flag_url = $1 WHERE id = $2',
              [newUrl, country.id]
            );

            console.log(`  ✓ Fixed! New URL: ${newUrl}\n`);
            fixedCount++;
          } else {
            console.log(`  ✗ Could not find valid URL\n`);
            failedCount++;
          }
        } catch (fixError) {
          console.log(`  ✗ Failed to fix: ${fixError.message}\n`);
          failedCount++;
        }
      }

      // Rate limiting - wait 200ms between requests
      await sleep(200);
    }

    console.log('\n' + '='.repeat(50));
    console.log('Summary:');
    console.log(`  Total checked: ${checkedCount}`);
    console.log(`  Fixed: ${fixedCount}`);
    console.log(`  Failed: ${failedCount}`);
    console.log(`  Already valid: ${checkedCount - fixedCount - failedCount}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await db.end();
  }
}

/**
 * Find the correct flag URL for a country
 */
async function findCorrectFlagUrl(countryName, oldUrl) {
  try {
    // Extract the filename from the old URL
    const filename = oldUrl.split('/').pop();
    
    // Try common patterns for Wikimedia Commons
    const patterns = [
      // Pattern 1: Try to extract hash from URL and rebuild
      async () => {
        const match = oldUrl.match(/\/commons\/([a-f0-9])\/([a-f0-9]{2})\//);
        if (match) {
          const newUrl = `https://upload.wikimedia.org/wikipedia/commons/${match[1]}/${match[2]}/${filename}`;
          if (await isUrlValid(newUrl)) return newUrl;
        }
        return null;
      },
      
      // Pattern 2: Search Wikimedia Commons API
      async () => {
        const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${filename}&prop=imageinfo&iiprop=url&format=json`;
        
        try {
          const response = await axios.get(searchUrl, { timeout: 5000 });
          const pages = response.data.query.pages;
          const page = Object.values(pages)[0];
          
          if (page && page.imageinfo && page.imageinfo[0]) {
            const newUrl = page.imageinfo[0].url;
            if (await isUrlValid(newUrl)) return newUrl;
          }
        } catch (error) {
          console.log(`    API search failed: ${error.message}`);
        }
        return null;
      },
      
      // Pattern 3: Try common hash patterns for the filename
      async () => {
        const hash = getMd5Hash(filename.replace(/ /g, '_'));
        const newUrl = `https://upload.wikimedia.org/wikipedia/commons/${hash[0]}/${hash.substring(0, 2)}/${filename}`;
        if (await isUrlValid(newUrl)) return newUrl;
        return null;
      },

      // Pattern 4: Try without hash (some files)
      async () => {
        const newUrl = `https://upload.wikimedia.org/wikipedia/commons/${filename}`;
        if (await isUrlValid(newUrl)) return newUrl;
        return null;
      },

      // Pattern 5: Generate placeholder based on country name
      async () => {
        const encodedName = encodeURIComponent(countryName.replace(/ /g, '_'));
        return `https://flagcdn.com/w320/${encodedName.toLowerCase()}.png`;
      }
    ];

    // Try each pattern
    for (const pattern of patterns) {
      const url = await pattern();
      if (url) return url;
    }

    return null;

  } catch (error) {
    console.log(`    Error finding URL: ${error.message}`);
    return null;
  }
}

/**
 * Check if a URL is valid
 */
async function isUrlValid(url) {
  try {
    const response = await axios.head(url, {
      timeout: 3000,
      validateStatus: (status) => status === 200,
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Simple MD5-like hash (not cryptographic, just for URL pattern)
 */
function getMd5Hash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(32, '0');
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the script
if (require.main === module) {
  validateAndFixFlagUrls()
    .then(() => {
      console.log('\n✓ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { validateAndFixFlagUrls, findCorrectFlagUrl };
