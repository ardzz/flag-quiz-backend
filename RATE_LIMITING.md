# Rate Limiting Configuration

## Overview
The API uses Redis-backed rate limiting to prevent abuse and ensure fair usage across all users.

---

## Rate Limiters

### 1. Auth Limiter (Strictest)
**Used for:** Login, Register, Password Reset

```javascript
authLimiter = 20 requests per 15 minutes
```

**Applied to:**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/verify-email`

**Why strict?**
- Prevent brute force attacks
- Prevent spam registrations
- Protect authentication system

---

### 2. API Limiter (Moderate)
**Used for:** General API endpoints (Global)

```javascript
apiLimiter = 500 requests per 15 minutes
```

**Applied to:**
- All `/api/v1/*` routes (global middleware)
- User management endpoints
- Profile updates
- Settings changes

**Purpose:**
- Fair usage across all users
- Prevent API abuse
- Maintain server performance

---

### 3. Game Limiter (Lenient)
**Used for:** Active gameplay endpoints

```javascript
gameLimiter = 200 requests per 5 minutes
```

**Can be applied to:**
- `POST /api/v1/games/{gameId}/questions/{questionId}/answer`
- `GET /api/v1/games/{gameId}/question/{number}`
- Real-time game interactions

**Purpose:**
- Allow smooth gameplay
- Prevent answer spam
- Balance between UX and protection

---

### 4. Public Limiter (Most Lenient)
**Used for:** Public read-only endpoints

```javascript
publicLimiter = 1000 requests per 15 minutes
```

**Can be applied to:**
- `GET /api/v1/templates` (game templates)
- `GET /api/v1/leaderboards`
- Public statistics
- Health check endpoints

**Purpose:**
- Enable high-traffic public access
- Support frontend caching strategies
- Allow guest users

---

### 5. Strict Limiter (Most Restrictive)
**Used for:** Sensitive operations

```javascript
strictLimiter = 10 requests per 60 minutes
```

**Can be applied to:**
- Account deletion
- Email changes
- Security-critical operations

**Purpose:**
- Maximum security
- Prevent accidental actions
- Limit damage from compromised accounts

---

## Current Configuration

| Limiter | Window | Max Requests | Requests/Minute |
|---------|--------|--------------|-----------------|
| Auth    | 15 min | 20           | ~1.3/min        |
| API     | 15 min | 500          | ~33/min         |
| Game    | 5 min  | 200          | 40/min          |
| Public  | 15 min | 1000         | ~66/min         |
| Strict  | 60 min | 10           | ~0.16/min       |

---

## Headers Returned

When rate limited, the API returns these headers:

```http
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1635789600
```

**Example:**
```
RateLimit-Limit: 500        # Total allowed requests
RateLimit-Remaining: 485    # Requests remaining
RateLimit-Reset: 1635789600 # Unix timestamp when limit resets
```

---

## Error Response

When rate limit is exceeded:

```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later."
}
```

**Status Code:** `429 Too Many Requests`

**Headers:**
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 900
RateLimit-Limit: 20
RateLimit-Remaining: 0
RateLimit-Reset: 1635789600
```

---

## Implementation

### Global API Limiter

In `src/app.js`:
```javascript
const { apiLimiter } = require('./middleware/rateLimiter.middleware');

// Apply to all API routes
app.use(apiLimiter);
```

### Route-Specific Limiter

In `src/routes/auth.routes.js`:
```javascript
const { authLimiter } = require('../middleware/rateLimiter.middleware');

router.post('/login', 
  authLimiter,  // ← Applied here
  validate,
  authController.login
);
```

### Custom Limiter

```javascript
const { createRateLimiter } = require('../middleware/rateLimiter.middleware');

// Create custom limiter
const customLimiter = createRateLimiter(10, 50); // 50 requests per 10 min

router.post('/special-endpoint',
  customLimiter,
  controller.specialAction
);
```

---

## Testing Rate Limits

### Test Auth Limiter (20 requests / 15 min)

```bash
# Make 21 requests quickly
for i in {1..21}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "Request $i"
done

# Request 21 should return 429
```

### Test API Limiter (500 requests / 15 min)

```bash
# Use apache bench
ab -n 600 -c 10 -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/v1/games

# Last 100 requests should be rate limited
```

---

## Recommendations

### For Different Endpoints

| Endpoint Type | Recommended Limiter |
|---------------|---------------------|
| Login/Register | `authLimiter` |
| Game creation | `apiLimiter` |
| Answer submission | `gameLimiter` |
| Leaderboards | `publicLimiter` |
| Profile view | `apiLimiter` |
| Account deletion | `strictLimiter` |
| Public data | `publicLimiter` |

### Production Adjustments

For production, consider:

```javascript
// Production example
const authLimiter = createRateLimiter(15, 10);    // Stricter: 10/15min
const apiLimiter = createRateLimiter(15, 300);    // Moderate: 300/15min
const gameLimiter = createRateLimiter(5, 100);    // Careful: 100/5min
const publicLimiter = createRateLimiter(15, 500); // Allow: 500/15min
```

---

## Redis Storage

Rate limits are stored in Redis for:
- ✅ **Shared state** across multiple server instances
- ✅ **Persistence** across server restarts
- ✅ **Performance** fast lookups
- ✅ **Automatic expiry** of old data

**Redis Key Format:**
```
rl:192.168.1.1:auth:/api/v1/auth/login
rl:192.168.1.1:api:/api/v1/games
```

---

## Bypassing Rate Limits

### Development Mode

In development, you might want to disable:

```javascript
// .env
DISABLE_RATE_LIMIT=true
```

```javascript
// rateLimiter.middleware.js
const createRateLimiter = (windowMinutes, maxRequests) => {
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    return (req, res, next) => next(); // No-op
  }
  // ... normal limiter
};
```

### Trusted IPs

Skip rate limiting for specific IPs:

```javascript
const limiterConfig = {
  skip: (req) => {
    const trustedIPs = ['127.0.0.1', '::1'];
    return trustedIPs.includes(req.ip);
  },
  // ... rest of config
};
```

---

## Monitoring

### Check Current Limits

```bash
# In Redis
redis-cli

# List all rate limit keys
KEYS rl:*

# Check specific IP
GET rl:192.168.1.1:api:/api/v1/games
```

### Clear Rate Limits

```bash
# Clear all rate limits
redis-cli FLUSHDB

# Clear specific IP
redis-cli DEL rl:192.168.1.1:auth:/api/v1/auth/login
```

---

## Best Practices

1. **Auth endpoints** → Use `authLimiter` (strict)
2. **Game play** → Use `gameLimiter` (lenient for UX)
3. **Public data** → Use `publicLimiter` (very lenient)
4. **Sensitive ops** → Use `strictLimiter` (very strict)
5. **Default** → Use `apiLimiter` (moderate)

6. **Monitor** your Redis for unusual patterns
7. **Adjust** limits based on actual usage
8. **Log** rate limit hits for analysis
9. **Inform** users when they're close to limits
10. **Document** all rate limits in API docs

---

## Summary

```
┌─────────────────────────────────────────────┐
│  Rate Limiter Hierarchy                     │
├─────────────────────────────────────────────┤
│  Strictest  → Auth (20/15min)              │
│  Strict     → Strict (10/60min)            │
│  Moderate   → API (500/15min)              │
│  Lenient    → Game (200/5min)              │
│  Public     → Public (1000/15min)          │
└─────────────────────────────────────────────┘
```

Updated: November 1, 2025
