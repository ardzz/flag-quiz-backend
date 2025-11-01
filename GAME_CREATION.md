# Game Creation Guide

## Overview
There are three ways to create a game in the Flag Quiz API.

---

## 1. Using a Template Only

Create a game from a pre-defined template.

### Request
```json
POST /api/v1/games
Authorization: Bearer <token>
Content-Type: application/json

{
  "templateId": "6db6d26d-e87e-489e-9cc9-e823381f5ff5"
}
```

### What happens:
- Game is created using template settings
- Template defines: numberOfFlags, timePerFlag, difficulty, continent

### Example Templates:
- Quick Play: 5 flags, 15 sec each
- Standard: 10 flags, 30 sec each
- Challenge: 20 flags, 20 sec each
- Expert: 50 flags, 10 sec each

---

## 2. Using Custom Options Only

Create a completely custom game without a template.

### Request
```json
POST /api/v1/games
Authorization: Bearer <token>
Content-Type: application/json

{
  "customOptions": {
    "numberOfFlags": 10,
    "timePerFlag": 30,
    "difficulty": "medium",
    "continentId": 6
  }
}
```

### Available Options:

| Field | Type | Range | Required | Description |
|-------|------|-------|----------|-------------|
| `numberOfFlags` | integer | 1-50 | No | Number of questions |
| `timePerFlag` | integer | 5-300 | No | Seconds per question |
| `difficulty` | string | easy/medium/hard | No | Game difficulty |
| `continentId` | integer | 1-6 | No | Filter by continent |

### Continent IDs:
1. Africa
2. Asia
3. Europe
4. North America
5. Oceania
6. South America

### Defaults (if not specified):
```javascript
{
  numberOfFlags: 10,
  timePerFlag: 30,
  difficulty: 'medium',
  continentId: null  // All continents
}
```

---

## 3. Template with Custom Overrides

Use a template but override specific settings.

### Request
```json
POST /api/v1/games
Authorization: Bearer <token>
Content-Type: application/json

{
  "templateId": "6db6d26d-e87e-489e-9cc9-e823381f5ff5",
  "customOptions": {
    "continentId": 2
  }
}
```

### What happens:
- Base settings come from template
- Custom options override template settings
- Useful for "Play this template but only Asia flags"

### Example Use Cases:

**1. Template + Continent Filter**
```json
{
  "templateId": "standard-template-uuid",
  "customOptions": {
    "continentId": 3  // Europe only
  }
}
```

**2. Template + Difficulty Change**
```json
{
  "templateId": "quick-play-uuid",
  "customOptions": {
    "difficulty": "hard"  // Make it harder
  }
}
```

**3. Template + More Time**
```json
{
  "templateId": "challenge-uuid",
  "customOptions": {
    "timePerFlag": 60  // Give more time
  }
}
```

---

## Validation Rules

### Required Fields
- ✅ **At least one** of `templateId` OR `customOptions` must be provided
- ❌ You cannot send an empty request body

### Field Constraints

**templateId:**
- Must be a valid UUID format
- Must reference an active template in the database

**numberOfFlags:**
- Minimum: 1
- Maximum: 50
- Default: 10

**timePerFlag:**
- Minimum: 5 seconds
- Maximum: 300 seconds (5 minutes)
- Default: 30

**difficulty:**
- Must be one of: `"easy"`, `"medium"`, `"hard"`
- Default: `"medium"`

**continentId:**
- Must be between 1-6
- Default: `null` (all continents)

---

## Error Responses

### Missing both templateId and customOptions
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "body",
      "message": "Either templateId or customOptions must be provided"
    }
  ]
}
```

### Invalid templateId format
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "templateId",
      "message": "Invalid template ID"
    }
  ]
}
```

### Invalid numberOfFlags
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "customOptions.numberOfFlags",
      "message": "Number of flags must be between 1 and 50"
    }
  ]
}
```

### Invalid difficulty
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "customOptions.difficulty",
      "message": "Difficulty must be easy, medium, or hard"
    }
  ]
}
```

---

## Common Mistakes

### ❌ Wrong: Nested Structure
```json
{
  "templateId": {
    "templateId": "uuid",
    "customOptions": {...}
  }
}
```

### ✅ Correct: Flat Structure
```json
{
  "templateId": "uuid",
  "customOptions": {...}
}
```

---

### ❌ Wrong: Empty Body
```json
{}
```

### ✅ Correct: Provide at least one
```json
{
  "templateId": "6db6d26d-e87e-489e-9cc9-e823381f5ff5"
}
```

---

### ❌ Wrong: Invalid continent
```json
{
  "customOptions": {
    "continentId": 7  // No continent 7!
  }
}
```

### ✅ Correct: Valid continent (1-6)
```json
{
  "customOptions": {
    "continentId": 2  // Asia
  }
}
```

---

## Complete Examples

### Example 1: Quick Europe Game
```bash
curl -X POST http://localhost:3000/api/v1/games \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customOptions": {
      "numberOfFlags": 5,
      "timePerFlag": 20,
      "difficulty": "easy",
      "continentId": 3
    }
  }'
```

### Example 2: Hard Asia Challenge
```bash
curl -X POST http://localhost:3000/api/v1/games \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customOptions": {
      "numberOfFlags": 20,
      "timePerFlag": 15,
      "difficulty": "hard",
      "continentId": 2
    }
  }'
```

### Example 3: Template Game
```bash
curl -X POST http://localhost:3000/api/v1/games \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "6db6d26d-e87e-489e-9cc9-e823381f5ff5"
  }'
```

### Example 4: Template + Override
```bash
curl -X POST http://localhost:3000/api/v1/games \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "6db6d26d-e87e-489e-9cc9-e823381f5ff5",
    "customOptions": {
      "continentId": 1,
      "difficulty": "hard"
    }
  }'
```

---

## Testing

### Get Available Templates
```http
GET /api/v1/templates
Authorization: Bearer <token>
```

### Check What You Created
```http
GET /api/v1/games/{gameId}
Authorization: Bearer <token>
```

Response shows your game configuration:
```json
{
  "success": true,
  "data": {
    "id": "game-uuid",
    "totalQuestions": 10,
    "difficulty": "medium",
    "continentId": 6,
    "timeLimit": 300
  }
}
```

---

## Summary

✅ **Three creation methods:**
1. Template only
2. Custom options only
3. Template + custom overrides

✅ **Flexible configuration:**
- Number of questions: 1-50
- Time per question: 5-300 seconds
- Difficulty: easy/medium/hard
- Continent filter: 1-6 or all

✅ **Smart validation:**
- Ensures at least one method is used
- Validates all field ranges
- Clear error messages

---

Updated: November 1, 2025
