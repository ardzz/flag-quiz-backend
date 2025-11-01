# Fix Broken Flag URLs

## Problem
Some flag URLs from the CSV are outdated or broken, returning 404 errors.

Example: `https://upload.wikimedia.org/wikipedia/commons/Flag_of_Tonga.svg` → 404

Correct URL: `https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Tonga.svg`

---

## Automated Solutions

### Option 1: Fix All Broken URLs (Batch)

This script checks all countries and fixes broken URLs automatically:

```bash
# Copy script to container
podman cp scripts/fix-flag-urls.js flag_game_api_dev:/app/

# Run the script
podman exec flag_game_api_dev node /app/fix-flag-urls.js
```

**What it does:**
1. Checks all 193 countries
2. Tests each flag URL
3. If broken, searches Wikimedia Commons API
4. Updates database with correct URL
5. Includes rate limiting (200ms between requests)

---

### Option 2: Fix Single Country

Check and fix one specific country:

```bash
# Copy script to container
podman cp scripts/check-flag-url.js flag_game_api_dev:/app/

# Fix Tonga's flag
podman exec flag_game_api_dev node /app/check-flag-url.js "Tonga"

# Fix any country
podman exec flag_game_api_dev node /app/check-flag-url.js "Country Name"
```

---

## How It Works

### 1. Wikimedia Commons API Search

The script uses the Wikimedia Commons API to find the correct URL:

```
https://commons.wikimedia.org/w/api.php?action=query&titles=File:Flag_of_Tonga.svg&prop=imageinfo&iiprop=url&format=json
```

Response includes the correct URL:
```json
{
  "imageinfo": [{
    "url": "https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Tonga.svg"
  }]
}
```

### 2. URL Validation

Before updating, the script verifies the new URL actually works:
- Sends HEAD request to check status
- Only updates if status is 200 OK

### 3. Database Update

If valid URL found, updates the database:
```sql
UPDATE countries SET flag_url = 'correct-url' WHERE id = country_id;
```

---

## Manual Fix (SQL)

If you know the correct URL, update manually:

```sql
UPDATE countries 
SET flag_url = 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Tonga.svg'
WHERE name = 'Tonga';
```

Run in container:
```bash
podman exec flag_game_postgres_dev psql -U postgres -d flag_game_db -c "
UPDATE countries 
SET flag_url = 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Tonga.svg'
WHERE name = 'Tonga';
"
```

---

## Finding Correct URLs Manually

1. **Go to Wikimedia Commons:**
   ```
   https://commons.wikimedia.org/wiki/File:Flag_of_Tonga.svg
   ```

2. **Look for the full resolution link:**
   - In the page HTML, find `<a href="https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Tonga.svg">`
   - Or click "Original file" link

3. **Copy the full URL** (includes hash path like `/9/9a/`)

---

## URL Pattern Explanation

Wikimedia Commons uses MD5 hashing for file organization:

```
https://upload.wikimedia.org/wikipedia/commons/[hash1]/[hash2]/[filename]
                                                   ↓       ↓
                                                   9       9a
```

Where:
- `hash1` = First character of MD5 hash of filename
- `hash2` = First 2 characters of MD5 hash
- `filename` = Actual file name

**Old (broken):**
```
https://upload.wikimedia.org/wikipedia/commons/Flag_of_Tonga.svg
```

**New (correct):**
```
https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Tonga.svg
```

---

## Running the Batch Fix

### Full Process:

```bash
# 1. Copy script to container
podman cp scripts/fix-flag-urls.js flag_game_api_dev:/app/fix-flag-urls.js

# 2. Run the fix (this may take 5-10 minutes for 193 countries)
podman exec flag_game_api_dev node /app/fix-flag-urls.js

# 3. Check the output for summary
# Expected output:
# ================================================
# Summary:
#   Total checked: 193
#   Fixed: 45
#   Failed: 3
#   Already valid: 145
# ================================================
```

---

## Testing After Fix

### Check specific country:
```bash
podman exec flag_game_postgres_dev psql -U postgres -d flag_game_db -c "SELECT name, flag_url FROM countries WHERE name = 'Tonga';"
```

### List all potentially broken URLs:
```bash
podman exec flag_game_postgres_dev psql -U postgres -d flag_game_db -c "
SELECT name, flag_url 
FROM countries 
WHERE flag_url NOT LIKE '%/commons/_/%/_/%' 
  AND flag_url LIKE '%commons%'
LIMIT 20;
"
```

---

## Alternative: Use Different Flag Source

If Wikimedia Commons URLs are unreliable, consider alternative sources:

### 1. FlagCDN (Recommended)
```javascript
// Format: https://flagcdn.com/w320/[country-code].png
const flagUrl = 'https://flagcdn.com/w320/to.png'; // Tonga
```

### 2. REST Countries API
```
https://restcountries.com/v3.1/name/tonga
// Returns flag URLs in response
```

### 3. Flagpedia
```
https://flagpedia.net/data/flags/w580/to.png
```

---

## Troubleshooting

### Script fails with "axios not found"
Install axios in the container:
```bash
podman exec flag_game_api_dev npm install axios
```

### Rate limiting errors
The script includes 200ms delay between requests. If you still get rate limited:
- Increase the delay in `sleep(200)` to `sleep(500)`
- Run the script in smaller batches

### Database connection errors
Make sure the database config in the script matches your .env file.

---

## Prevention

To avoid broken URLs in the future:

1. **Validate URLs during import**
2. **Use reliable flag sources** (FlagCDN, etc.)
3. **Store local copies** in your uploads folder
4. **Regular health checks** (run validation script weekly)

---

Updated: November 1, 2025
