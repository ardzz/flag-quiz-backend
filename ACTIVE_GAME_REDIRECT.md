# Active Game Redirect - Implementation Guide

## Problem Solved
When a player tries to create a new game while already having one in progress, the API now returns the **active game information** so the frontend can redirect them to continue playing.

---

## New Error Response

### Request
```http
POST /api/v1/games
Authorization: Bearer <token>
Content-Type: application/json

{
  "templateId": "6db6d26d-e87e-489e-9cc9-e823381f5ff5"
}
```

### Response (400 Bad Request)
```json
{
  "success": false,
  "error": "You already have a game in progress. Please complete or abandon it before starting a new one.",
  "activeGame": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "in_progress",
    "score": 150,
    "correctAnswers": 2,
    "totalQuestions": 10,
    "answeredQuestions": 3,
    "difficulty": "medium",
    "continentId": 2,
    "createdAt": "2025-11-01T13:00:00.000Z"
  }
}
```

---

## Frontend Implementation

### React Example

```javascript
async function createNewGame(templateId) {
  try {
    const response = await fetch('/api/v1/games', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ templateId })
    });

    const data = await response.json();

    if (!data.success && data.activeGame) {
      // Redirect to active game
      const gameId = data.activeGame.id;
      const progress = `${data.activeGame.answeredQuestions}/${data.activeGame.totalQuestions}`;
      
      // Show modal/notification
      const shouldContinue = confirm(
        `You have an active game in progress (${progress} questions answered).\n` +
        `Do you want to continue playing?`
      );

      if (shouldContinue) {
        // Redirect to game page
        window.location.href = `/game/${gameId}`;
        // or using React Router: navigate(`/game/${gameId}`);
      } else {
        // Show abandon option
        showAbandonGameModal(gameId);
      }
    } else if (data.success) {
      // New game created successfully
      const gameId = data.data.id;
      window.location.href = `/game/${gameId}`;
    }

  } catch (error) {
    console.error('Failed to create game:', error);
  }
}
```

### Vue.js Example

```javascript
async createNewGame(templateId) {
  try {
    const response = await axios.post('/api/v1/games', 
      { templateId },
      { 
        headers: { 'Authorization': `Bearer ${this.token}` } 
      }
    );

    const gameId = response.data.data.id;
    this.$router.push(`/game/${gameId}`);

  } catch (error) {
    if (error.response?.data?.activeGame) {
      const activeGame = error.response.data.activeGame;
      
      // Show active game info
      this.activeGameDialog = {
        show: true,
        gameId: activeGame.id,
        progress: `${activeGame.answeredQuestions}/${activeGame.totalQuestions}`,
        score: activeGame.score
      };
    }
  }
}

// Handle continue or abandon
continueActiveGame() {
  this.$router.push(`/game/${this.activeGameDialog.gameId}`);
}

async abandonActiveGame() {
  await axios.put(`/api/v1/games/${this.activeGameDialog.gameId}/abandon`);
  this.activeGameDialog.show = false;
  // Now can create new game
}
```

### Angular Example

```typescript
async createNewGame(templateId: string): Promise<void> {
  try {
    const response = await this.http.post<GameResponse>('/api/v1/games', 
      { templateId },
      { headers: { 'Authorization': `Bearer ${this.token}` } }
    ).toPromise();

    const gameId = response.data.id;
    this.router.navigate(['/game', gameId]);

  } catch (error: any) {
    if (error.error?.activeGame) {
      const activeGame = error.error.activeGame;
      
      const dialogRef = this.dialog.open(ActiveGameDialog, {
        data: {
          gameId: activeGame.id,
          progress: `${activeGame.answeredQuestions}/${activeGame.totalQuestions}`,
          score: activeGame.score
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === 'continue') {
          this.router.navigate(['/game', activeGame.id]);
        } else if (result === 'abandon') {
          this.abandonGame(activeGame.id);
        }
      });
    }
  }
}
```

---

## Active Game Information

The `activeGame` object includes:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Game ID for redirecting |
| `status` | string | Always "in_progress" |
| `score` | integer | Current score |
| `correctAnswers` | integer | Number of correct answers |
| `totalQuestions` | integer | Total questions in game |
| `answeredQuestions` | integer | Questions already answered |
| `difficulty` | string | Game difficulty (easy/medium/hard) |
| `continentId` | integer\|null | Continent filter if applied |
| `createdAt` | datetime | When game was created |

---

## User Flow

### Before (Without Active Game Info)
1. Try to create game ❌
2. Get error message ❌
3. User confused - what game? where? 😕

### After (With Active Game Info)
1. Try to create game ❌
2. Get error + active game details ✅
3. Frontend shows:
   - "You have a game in progress!"
   - Progress: 3/10 questions answered
   - Current score: 150 points
   - [Continue] [Abandon] buttons
4. User clicks [Continue] ✅
5. Redirect to `/game/{gameId}` ✅

---

## UI Examples

### Modal/Dialog
```
┌─────────────────────────────────────────┐
│  Game In Progress                    ×  │
├─────────────────────────────────────────┤
│                                         │
│  You already have an active game:       │
│                                         │
│  Progress: 3/10 questions               │
│  Current Score: 150 points              │
│  Difficulty: Medium                     │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ Continue │  │ Abandon  │            │
│  └──────────┘  └──────────┘            │
│                                         │
└─────────────────────────────────────────┘
```

### Notification Toast
```
🎮 Active Game Detected!
You have 3/10 questions answered. Continue playing?
[Resume Game] [Dismiss]
```

---

## Testing

### Test Case 1: Active Game Detection
```bash
# 1. Create first game
POST /api/v1/games
Response: 201 Created

# 2. Try creating another
POST /api/v1/games
Response: 400 Bad Request with activeGame data

# 3. Verify activeGame object structure
{
  "activeGame": {
    "id": "uuid",
    "answeredQuestions": 0-10,
    "totalQuestions": 10,
    ...
  }
}
```

### Test Case 2: Frontend Redirect
1. Parse activeGame from error response
2. Extract gameId
3. Navigate to `/game/${gameId}`
4. Verify game loads correctly

### Test Case 3: Abandon Flow
1. Get activeGame.id from error
2. Call PUT `/api/v1/games/{id}/abandon`
3. Retry POST `/api/v1/games`
4. Should succeed now

---

## Backend Implementation

### Custom Error Class
```javascript
class GameInProgressError extends Error {
  constructor(message, activeGame) {
    super(message);
    this.name = 'GameInProgressError';
    this.statusCode = 400;
    this.activeGame = activeGame;
  }
}
```

### Error Handler Middleware
```javascript
if (err.name === 'GameInProgressError') {
  return res.status(err.statusCode).json({
    success: false,
    error: err.message,
    activeGame: err.activeGame,
  });
}
```

### Service Query
```sql
SELECT g.*, 
       COUNT(DISTINCT q.id) as total_questions,
       COUNT(DISTINCT CASE WHEN ga.is_correct IS NOT NULL THEN ga.id END) as answered_questions
FROM games g
LEFT JOIN game_questions q ON q.game_id = g.id
LEFT JOIN game_answers ga ON ga.question_id = q.id
WHERE g.user_id = $1 AND g.status = 'in_progress'
GROUP BY g.id
LIMIT 1
```

---

## Benefits

✅ **Better UX** - Users know exactly what's happening  
✅ **Seamless Navigation** - Direct link to continue playing  
✅ **Progress Visibility** - See how far they've gotten  
✅ **Clear Actions** - Continue or Abandon options  
✅ **Reduced Confusion** - No more "what game?" questions  

---

Updated: November 1, 2025
