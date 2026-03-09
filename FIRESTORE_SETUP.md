# Firestore Database Setup

Your Firestore database has been initialized with the following structure:

## Collections

### `users` Collection
Stores all user data and fitness tracking information.

**Document ID**: `{userId}` (Firebase Auth UID)

**Schema**:
```typescript
{
  id: string;                      // User ID
  email: string;                   // User email from Firebase Auth
  profile: {
    name: string;                  // User's name
    startWeight: number;           // Starting weight in kg
    currentWeight: number;         // Current weight in kg
    goalWeight: number;            // Goal weight in kg
    startDate: string;             // ISO date string (YYYY-MM-DD)
    targetSteps: number;           // Daily step goal
    targetProtein: number;         // Daily protein target in grams
    targetWater: number;           // Daily water target in liters
    wakeUpTime: string;            // Wake up time (HH:MM)
  } | null;
  records: {
    [date: string]: {              // Date as key (YYYY-MM-DD)
      date: string;
      checklist: {
        wakeUpOnTime: boolean;
        fastedCardio: boolean;
        gymWorkout: boolean;
        proteinTarget: boolean;
        stepsGoal: boolean;
        waterIntake: boolean;
        noCheatMeals: boolean;
        sleepOnTime: boolean;
      };
      weight?: number;
      notes?: string;
      completionRate: number;      // 0-100
    }
  };
  currentStreak: number;           // Current consecutive days completed
  longestStreak: number;           // Longest streak ever achieved
  mealPlans: {
    [date: string]: {              // Date as key (YYYY-MM-DD)
      date: string;
      meals: Array<{
        id: string;
        name: string;
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        time: string;
      }>;
      totalCalories: number;
      totalProtein: number;
      totalCarbs: number;
      totalFats: number;
    }
  };
  gymRoutine: {
    [day: string]: {               // Day name as key (Monday, Tuesday, etc)
      id: string;
      name: string;
      exercises: Array<{
        id: string;
        name: string;
        sets: number;
        reps: string;
        weight?: number;
        notes?: string;
      }>;
      duration?: number;
      completed?: boolean;
    }
  };
  workoutHistory: {
    [date: string]: {              // Date as key (YYYY-MM-DD)
      id: string;
      name: string;
      exercises: Array<{...}>;
      duration?: number;
      completed: boolean;
    }
  };
  createdAt: Timestamp;            // Account creation time
  updatedAt: Timestamp;            // Last update time
}
```

### `metadata` Collection
Stores app-wide metadata.

**Document ID**: `app`

**Schema**:
```typescript
{
  initialized: boolean;
  version: string;
  lastUpdated: Timestamp;
}
```

## Firestore Security Rules

Set these rules in your Firebase Console under **Firestore Database > Rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Public metadata collection (read-only)
    match /metadata/{document=**} {
      allow read: if request.auth != null;
    }
  }
}
```

## Authentication Setup

Authentication has been enabled via Firebase Auth with the following provider:

### Email/Password Provider
- Users can sign up with email and password
- Password reset via email is supported
- Automatic user document creation in Firestore

## Automatic Collection Initialization

When a new user signs up:
1. Firebase Auth creates the user account
2. Firestore creates a `users/{userId}` document with empty records
3. The user is ready to fill in their profile during onboarding

## How Data is Synced

The app uses a **hybrid approach** for data management:

1. **Local Storage** - Primary storage for fast access and offline support
2. **Firestore** - Cloud backup and multi-device sync
3. **Sync Flow**:
   - Changes are saved to localStorage immediately
   - Changes are async synced to Firestore in the background
   - On app startup, if user is authenticated, latest data is loaded from Firestore

## Monitoring Data

### View Users in Firebase Console
1. Go to **Firestore Database**
2. Click on the `users` collection
3. Select any user document to view their data

### Debug Sync Issues
Check browser console for Firebase sync logs:
```javascript
// In console:
// Look for "Failed to sync with Firebase" messages
// This indicates connectivity or permission issues
```

## Backup Recommendations

1. Enable automatic backups in Google Cloud Console
2. Set up export schedule:
   - Go to **Cloud Firestore** in Google Cloud Console
   - Configure automatic exports to Cloud Storage
   - Recommended: Daily exports

## Scaling Considerations

- **Read Cost**: ~$0.06 per 100k reads
- **Write Cost**: ~$0.18 per 100k writes
- **Storage**: $0.18 per GB per month

Estimated monthly cost with thousands of active users: $1-10/month

## Common Issues

### User Document Not Created
**Problem**: User can sign in but profile won't load
**Solution**: Check Firestore rules - make sure auth is enabled

### Data Not Syncing
**Problem**: Changes in app aren't reflecting in Firestore
**Solution**: 
- Check browser console for errors
- Verify Firestore security rules
- Ensure user is authenticated

### Collections Missing
**Problem**: Collections not showing in Firebase Console
**Solution**: Collections are created automatically on first data write - try:
1. Sign up a new user
2. Fill in profile information
3. Refresh Firebase Console
