# Quick Fix for Broken Flag URLs

## Problem
Flag URL returns 404: `https://upload.wikimedia.org/wikipedia/commons/Flag_of_Tonga.svg`

## Quick Manual Fix

### Step 1: Find Correct URL

Go to: `https://commons.wikimedia.org/wiki/File:Flag_of_Tonga.svg`

Look for the correct URL in the page (it's in the download link).

### Step 2: Update Database

```bash
podman exec flag_game_postgres_dev psql -U postgres -d flag_game_db -c "
UPDATE countries 
SET flag_url = 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Tonga.svg'
WHERE name = 'Tonga';
"
```

### Step 3: Verify

```bash
podman exec flag_game_postgres_dev psql -U postgres -d flag_game_db -c "SELECT name, flag_url FROM countries WHERE name = 'Tonga';"
```

---

## Common Broken URLs

Here are some known broken URLs and their fixes:

```sql
-- Tonga
UPDATE countries SET flag_url = 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Tonga.svg' WHERE name = 'Tonga';

-- Add more as you find them
```

---

## Find All Potentially Broken URLs

```sql
-- URLs missing the hash path (likely broken)
SELECT name, flag_url 
FROM countries 
WHERE flag_url LIKE '%/commons/Flag_%'
ORDER BY name;
```

Run it:
```bash
podman exec flag_game_postgres_dev psql -U postgres -d flag_game_db -c "SELECT name, flag_url FROM countries WHERE flag_url LIKE '%/commons/Flag_%' ORDER BY name;"
```

---

## Automated Fix (Coming Soon)

The scripts in `scripts/` folder can automate this, but need some fixes for the async API calls.

For now, use manual SQL updates as shown above.

---

See `FIX_FLAG_URLS.md` for full documentation.

Updated: November 1, 2025
