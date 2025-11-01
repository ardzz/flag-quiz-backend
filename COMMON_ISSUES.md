# Common Issues & Solutions

## Issue 1: "Question Already Answered" Error

### Problem
```json
{
  "success": false,
  "error": "Question already answered"
}
```

### Cause
Trying to submit an answer to a question that was already answered.

### Solution
Use the new endpoint to get next unanswered question:

```javascript
GET /api/v1/games/{gameId}/next-unanswered
```

**See:** `UNANSWERED_QUESTIONS_QUICKFIX.md` for details.

---

## Issue 2: Duplicate Users in Leaderboard

### Problem
```json
{
  "leaderboard": [
    { "user_id": "abc-123", "username": "reky", "score": 75 },
    { "user_id": "def-456", "username": "player", "score": 50 },
    { "user_id": "abc-123", "username": "reky", "score": 0 }  // ← Duplicate!
  ]
}
```

### Cause
PostgreSQL doesn't treat NULL values as equal in unique constraints. The unique constraint `(user_id, continent_id)` didn't work when `continent_id` was NULL, allowing multiple entries for the same user.

### Solution
**✅ FIXED** in commit `a8976b3`

Changes made:
1. Updated `updateLeaderboards()` to handle NULL continent_id properly
2. Added partial unique indexes for NULL continent_id cases
3. Cleaned up existing duplicate entries
4. Created migration script for existing databases

### Database Migration
If you have existing duplicate data, run:
```sql
-- Already executed in the fix, but for reference:
DELETE FROM leaderboard_alltime 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, COALESCE(continent_id, -1)) id
  FROM leaderboard_alltime
  ORDER BY user_id, COALESCE(continent_id, -1), score DESC
);
```

---

## Issue 3: Token Expired After Refresh

### Problem
After refreshing token, subsequent requests still return 401.

### Cause
Not using the new access token from the refresh response.

### Solution
Always use the NEW token after refresh:

```javascript
const { data } = await refreshToken();
const newAccessToken = data.accessToken;  // ← Use this!
localStorage.setItem('accessToken', newAccessToken);

// Then use it
fetch('/api/v1/games/...', {
  headers: { 'Authorization': `Bearer ${newAccessToken}` }
});
```

**See:** `TOKEN_REFRESH_QUICKFIX.md` for details.

---

## Issue 4: "Too Many Requests" Error

### Problem
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

### Cause
Rate limiter was set to 5 requests per 15 minutes.

### Solution
**✅ FIXED** in commit `7c4a317`

Rate limit increased from 5 to 20 requests per 15 minutes.

If you still hit the limit, flush Redis:
```bash
podman exec flag_game_redis_dev redis-cli -a redis_dev_password FLUSHALL
```

---

## Issue 5: Not Enough Countries for Template

### Problem
```json
{
  "error": "Not enough countries for this configuration"
}
```

### Cause
Database had only 20 countries, but templates require more.

### Solution
**✅ FIXED** - Run country import script

193 countries imported from CSV.

To re-import:
```bash
podman cp scripts/import-countries.js flag_game_api_dev:/app/
podman exec flag_game_api_dev node /app/import-countries.js
```

---

## Issue 6: Login Only Accepts Email

### Problem
Can't login with username, only email.

### Solution
**✅ FIXED** in commit `f70ca32`

Login now accepts both email AND username:

```json
{
  "username": "player",
  "password": "player123"
}
```

OR

```json
{
  "email": "player@flaggame.com",
  "password": "player123"
}
```

---

## Issue 7: Broken Flag URLs (404 Errors)

### Problem
Some flag URLs return 404 errors because they're missing the hash path.

**Broken:** `https://upload.wikimedia.org/wikipedia/commons/Flag_of_Tonga.svg`  
**Correct:** `https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Tonga.svg`

### Affected Countries
Approximately 118 countries have broken URLs (imported without proper URLs from CSV).

### Solution
**🔧 Tools Created** in commit `8363fdc`

Two scripts available in `scripts/`:
1. `check-flag-url.js` - Fix single country
2. `fix-flag-urls.js` - Batch fix all countries

### Quick Manual Fix

For specific countries:
```bash
podman exec flag_game_postgres_dev psql -U postgres -d flag_game_db -c "
UPDATE countries 
SET flag_url = 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Tonga.svg'
WHERE name = 'Tonga';
"
```

**See:** `QUICK_FIX_FLAGS.md` for detailed instructions

---

## Quick Reference

| Issue | Status | Fix Commit | Documentation |
|-------|--------|-----------|---------------|
| Question already answered | ✅ Fixed | `ce09d1b` | `UNANSWERED_QUESTIONS_QUICKFIX.md` |
| Duplicate leaderboard entries | ✅ Fixed | `a8976b3`, `a1c1da7` | This file |
| Token refresh not working | ✅ Fixed | `2c3d4e8` | `TOKEN_REFRESH_QUICKFIX.md` |
| Too many requests | ✅ Fixed | `7c4a317` | - |
| Not enough countries | ✅ Fixed | `500c4f7` | - |
| Login with username | ✅ Fixed | `f70ca32` | - |
| Broken flag URLs (404) | 🔧 Tools Added | `8363fdc` | `QUICK_FIX_FLAGS.md` |

Updated: November 1, 2025
