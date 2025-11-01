# Game Flow Documentation

## 🚨 NEW: Game Creation Restriction

**Players can only have ONE active game at a time.**

Before creating a new game, you must either:
- ✅ Complete your current game
- ✅ Abandon your current game

If you try to create a game while one is in progress:
```json
{
  "success": false,
  "error": "You already have a game in progress. Please complete or abandon it before starting a new one."
}
```

**Solution:** Use `PUT /api/v1/games/{gameId}/abandon` or complete the current game.

---

## How to Play the Flag Quiz Game

### 1. Create a Game

**Endpoint:** `POST /api/v1/games`

**Headers:**
```
Authorization: Bearer <your_access_token>
```

**Request Body (using template):**
```json
{
  "templateId": "6db6d26d-e87e-489e-9cc9-e823381f5ff5"
}
```

**Request Body (custom game):**
```json
{
  "customOptions": {
    "continentId": 2,
    "numberOfFlags": 10,
    "timePerFlag": 30,
    "difficulty": "medium"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Game created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-uuid",
    "status": "in_progress",
    "difficulty": "medium",
    "score": 0,
    "correctAnswers": 0,
    "totalQuestions": 10,
    "timeSpent": 0,
    "continentId": 2,
    "createdAt": "2025-11-01T11:00:00.000Z"
  }
}
```

---

### 2. Get Game Details

**Endpoint:** `GET /api/v1/games/{gameId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "in_progress",
    "score": 0,
    "correctAnswers": 0,
    "totalQuestions": 10,
    "questions": [
      {
        "id": "question-uuid-1",
        "questionNumber": 1,
        "flagUrl": "https://...",
        "options": [
          { "id": 1, "name": "Japan" },
          { "id": 2, "name": "China" },
          { "id": 3, "name": "South Korea" },
          { "id": 4, "name": "Thailand" }
        ],
        "timeLimit": 30
      }
    ]
  }
}
```

---

### 3. Get Specific Question

**Endpoint:** `GET /api/v1/games/{gameId}/question/{number}`

**Example:** `GET /api/v1/games/550e8400-e29b-41d4-a716-446655440000/question/1`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "question-uuid-1",
    "questionNumber": 1,
    "flagUrl": "https://upload.wikimedia.org/wikipedia/commons/...",
    "options": [
      { "id": 45, "name": "Japan" },
      { "id": 46, "name": "China" },
      { "id": 47, "name": "South Korea" },
      { "id": 48, "name": "Thailand" }
    ],
    "timeLimit": 30,
    "difficulty": "medium"
  }
}
```

---

### 4. Submit Answer ⭐

**Endpoint:** `POST /api/v1/games/{gameId}/questions/{questionId}/answer`

**Headers:**
```
Authorization: Bearer <your_access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "answerId": 45,
  "timeTaken": 15
}
```

**Parameters:**
- `answerId` (integer, required): The ID of the selected country from the options
- `timeTaken` (integer, required): Time taken to answer in seconds (must be >= 0)

**Response (Correct Answer):**
```json
{
  "success": true,
  "data": {
    "isCorrect": true,
    "correctAnswerId": 45,
    "points": 85,
    "totalScore": 85
  }
}
```

**Response (Wrong Answer):**
```json
{
  "success": true,
  "data": {
    "isCorrect": false,
    "correctAnswerId": 46,
    "points": 0,
    "totalScore": 85
  }
}
```

**Error Responses:**

- **Question already answered:**
```json
{
  "success": false,
  "error": "Question already answered"
}
```

- **Game not in progress:**
```json
{
  "success": false,
  "error": "Game not found or not in progress"
}
```

---

### 5. Complete Game

**Endpoint:** `POST /api/v1/games/{gameId}/complete`

**Response:**
```json
{
  "success": true,
  "message": "Game completed successfully",
  "data": {
    "game": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "completed",
      "score": 850,
      "correctAnswers": 9,
      "totalQuestions": 10,
      "timeSpent": 180,
      "completedAt": "2025-11-01T11:05:00.000Z"
    },
    "achievements": []
  }
}
```

---

## Complete Game Flow Example

### Step-by-step Flow

1. **Login/Register** → Get access token
2. **Create Game** → Get `gameId`
3. **Get First Question** → `GET /api/v1/games/{gameId}/question/1`
4. **Submit Answer** → `POST /api/v1/games/{gameId}/questions/{questionId}/answer`
5. **Get Next Question** → `GET /api/v1/games/{gameId}/question/2`
6. **Repeat steps 4-5** for all questions
7. **Complete Game** → `POST /api/v1/games/{gameId}/complete`

---

## Points Calculation

Points are calculated based on:
- **Difficulty level**: easy/medium/hard
- **Time taken**: Faster answers = more points
- **Correctness**: Wrong answers = 0 points

### Formula:
```
basePoints = difficulty multiplier (easy: 50, medium: 75, hard: 100)
timeBonus = max(0, (timeLimit - timeTaken) / timeLimit) * 50
totalPoints = isCorrect ? (basePoints + timeBonus) : 0
```

---

## Game Status

- `in_progress`: Game is active, accepting answers
- `completed`: Game finished normally
- `abandoned`: Game was abandoned by player

---

## Additional Endpoints

### Get User's Games
**Endpoint:** `GET /api/v1/games?page=1&limit=10&status=completed`

### Abandon Game
**Endpoint:** `PUT /api/v1/games/{gameId}/abandon`

---

## Example: Full Game Session

```bash
# 1. Create game
curl -X POST http://localhost:3000/api/v1/games \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"templateId":"6db6d26d-e87e-489e-9cc9-e823381f5ff5"}'

# Response: gameId = "550e8400-e29b-41d4-a716-446655440000"

# 2. Get first question
curl -X GET http://localhost:3000/api/v1/games/550e8400-e29b-41d4-a716-446655440000/question/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response: questionId = "question-uuid-1", options with IDs

# 3. Submit answer
curl -X POST http://localhost:3000/api/v1/games/550e8400-e29b-41d4-a716-446655440000/questions/question-uuid-1/answer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"answerId": 45, "timeTaken": 15}'

# Response: isCorrect, points earned

# 4. Continue for all questions...

# 5. Complete game
curl -X POST http://localhost:3000/api/v1/games/550e8400-e29b-41d4-a716-446655440000/complete \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Testing with Postman

Import the `Flag-Guesser-API.postman_collection.json` file for pre-configured requests.

See `POSTMAN.md` for detailed Postman setup instructions.
