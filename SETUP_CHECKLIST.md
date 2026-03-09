# Firebase Setup Checklist ✅

## Before You Start
- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore Database created
- [ ] Environment variables set in `.env.local`

## Collections (Auto-Created)
Collections are created automatically when needed. Here's what happens:

- [ ] `users` collection created on first sign-up
- [ ] `metadata` collection created on app initialization
- [ ] User subcollections created as data is added

## Security Rules Setup ⚠️ IMPORTANT

**These rules MUST be set before using the app in production:**

1. [ ] Open Firebase Console
2. [ ] Go to **Firestore Database → Rules**
3. [ ] Replace with security rules from below
4. [ ] Click **Publish**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    match /metadata/{document=**} {
      allow read: if request.auth != null;
    }
  }
}
```

## Test the Setup

1. [ ] Start dev server: `npm run dev`
2. [ ] Go to http://localhost:5173/signin
3. [ ] Click "Sign Up"
4. [ ] Create account with email/password
5. [ ] Fill in weight and goals
6. [ ] Click "Save Profile"
7. [ ] **Go to Firebase Console → Firestore Database**
8. [ ] **Look for your user ID in the `users` collection**
9. [ ] ✅ Data should appear there

## Verification

After testing:

- [ ] Firebase Auth shows your new account
- [ ] Firestore `users` collection has your document
- [ ] Your profile data appears in Firestore
- [ ] Sign out and sign back in works
- [ ] Data persists after refresh

## Common Issues & Solutions

### ❌ "Permission denied" in console
```
Solution:
1. Check Firestore rules are published
2. Make sure rules match the code above
3. Refresh the app
```

### ❌ Collections not showing in Firebase Console
```
Solution:
1. Sign up and create a profile in the app
2. Wait a few seconds
3. Refresh Firebase Console
4. Collections appear after first data write
```

### ❌ User document not appearing
```
Solution:
1. Check Firestore rules allow write
2. Fill in complete profile (weight, goals, etc.)
3. Watch browser console for errors
4. Check Firebase Auth shows the account
```

## Data Structure Created

When you complete setup, each user will have:

```
users/{userId}
├── profile
│   ├── startWeight
│   ├── currentWeight
│   ├── goalWeight
│   ├── startDate
│   ├── targetSteps
│   ├── targetProtein
│   ├── targetWater
│   └── wakeUpTime
├── records (daily progress)
├── mealPlans (meal tracking)
├── gymRoutine (workout templates)
├── workoutHistory (completed workouts)
├── currentStreak
├── longestStreak
├── createdAt
└── updatedAt
```

## Production Deployment Checklist

Before going live:

- [ ] Firestore rules reviewed and approved
- [ ] Backup strategy configured
- [ ] CORS settings verified
- [ ] Rate limiting enabled (if needed)
- [ ] Error monitoring set up
- [ ] Firebase pricing reviewed

## Next Steps

✅ **Once setup is verified:**
1. Read `FIREBASE_COMPLETE_SETUP.md` for detailed info
2. Read `FIRESTORE_SETUP.md` for database schema
3. Start building features
4. Test with real users

✅ **For production:**
1. Set up Firebase Hosting deployment
2. Configure custom domain
3. Enable monitoring and alerts
4. Set up backups
