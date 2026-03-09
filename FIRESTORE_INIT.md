# Firestore Collections Auto-Initialization Guide

## ✅ What Happens Automatically

When your app starts, it **automatically**:
1. ✅ Creates the `metadata/app` document
2. ✅ Checks collection status
3. ✅ Creates `users` collection when first user signs up
4. ✅ Initializes user documents with proper schema

**No manual action needed!** The app handles everything automatically.

## 🚀 How It Works

### On App Startup
```
1. AuthProvider loads
2. Firestore initialization runs
3. metadata/app document created
4. Collections status checked
5. App ready to use
```

### On User Sign Up
```
1. User creates account via Firebase Auth
2. User document automatically created in users/{userId}
3. User profile data synced to Firestore
4. Data backup ready
```

### On Daily Use
```
1. Changes saved to localStorage (instant)
2. Changes synced to Firestore (background)
3. Multi-device sync ready
```

## 🔧 Manual Initialization (If Needed)

If collections don't create automatically, you can manually initialize from the browser console:

### Option 1: Browser Console Commands

Open browser console (F12) and run:

```javascript
// Initialize collections
await window.firestoreSetup.initialize();

// Check collection status
await window.firestoreSetup.checkStatus();

// Verify and auto-initialize if needed
await window.firestoreSetup.verify();

// Get help
window.firestoreSetup.help();
```

### Option 2: Programmatic Initialization

In your code, you can trigger initialization:

```typescript
import { initializeFirestoreCollections } from '@/config/firestore-collections';

// Initialize collections
const initialized = await initializeFirestoreCollections();

if (initialized) {
  console.log('Collections ready!');
}
```

## ✅ Verification Checklist

### Step 1: Start Your App
```bash
npm run dev
```

### Step 2: Open Browser Console (F12)

You should see messages like:
```
✅ Firestore collections initialized
📊 Checking Firestore collections...
- metadata/app: ✅ exists
- users collection: ⚠️ not yet created (will create on first signup)
📦 Firestore utilities available as window.firestoreSetup
```

### Step 3: Sign Up and Create Profile

1. Go to http://localhost:5173/signin
2. Click "Sign Up"
3. Create account with email/password
4. Fill in weight and fitness goals
5. Click "Save Profile"

### Step 4: Check Firebase Console

Go to [Firebase Console](https://console.firebase.google.com):
1. Select your project
2. Go to **Firestore Database**
3. You should see:
   - ✅ `metadata` collection with `app` document
   - ✅ `users` collection with your user ID
   - ✅ Your profile data in the `profile` field

## 🆘 Troubleshooting

### ❌ Collections Not Created

**Problem**: Collections don't appear in Firebase Console

**Solutions**:
1. **Check in browser console** (F12):
   ```javascript
   await window.firestoreSetup.checkStatus();
   ```
   
2. **Manually initialize**:
   ```javascript
   await window.firestoreSetup.initialize();
   ```
   
3. **Verify permissions** - Check Firestore rules are set correctly:
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

4. **Clear browser cache** (Ctrl+Shift+Delete) and refresh

### ❌ "Permission denied" Error

**Problem**: Firestore returns permission denied

**Solutions**:
1. Verify security rules in Firebase Console
2. Make sure rules match code above
3. Click **Publish** after updating rules
4. Wait 5 seconds for rules to propagate
5. Refresh app

### ❌ Collections Stuck on "not yet created"

**Problem**: users collection shows as "not yet created" after signup

**Solutions**:
1. Try creating a profile with complete data
2. Check browser console for errors (F12)
3. Verify internet connection
4. Check Firebase logs in Google Cloud Console

## 📊 Monitoring Collections

### Check Collection Size
In Firebase Console:
1. **Firestore Database** → **Usage**
2. See read/write counts in real-time

### Export Data (Backup)
In Google Cloud Console:
1. **Cloud Firestore** → **Export/Import**
2. Export to Cloud Storage regularly

### Monitor App Health
In browser console, run anytime:
```javascript
window.firestoreSetup.checkStatus();
```

## 📁 Collection Structure Created

### metadata Collection
```
metadata/
└── app/
    ├── initialized: true
    ├── version: "1.0"
    ├── createdAt: Timestamp
    ├── lastUpdated: Timestamp
    └── collections: {
        users: "User accounts and fitness data",
        metadata: "App configuration and metadata"
      }
```

### users Collection (Created on First Sign Up)
```
users/
└── {userId}/
    ├── profile: { weight, goals, etc. }
    ├── records: { daily progress }
    ├── mealPlans: { meal data by date }
    ├── gymRoutine: { workout templates }
    ├── workoutHistory: { completed workouts }
    ├── currentStreak: number
    ├── longestStreak: number
    ├── profile: null or { ...user profile }
    ├── email: "user@example.com"
    ├── id: userId
    ├── createdAt: Timestamp
    └── updatedAt: Timestamp
```

## 🎯 Next Steps

1. ✅ Collections initialized? → Proceed to step 2
2. ✅ Created user account? → Proceed to step 3
3. ✅ See data in Firebase Console? → **You're all set!**
4. ✅ Ready to deploy? → See [Deployment Guide](./FIREBASE_COMPLETE_SETUP.md)

## 💡 Pro Tips

- **Collections are "lazy created"**: They don't appear in Firebase Console until created
- **After first write**: Collections appear in Console within 1-5 seconds
- **Dev environment**: Initialization logs show status in browser console
- **Production**: Silent initialization - logs still available in browser console

## 📚 Related Documentation

- [Firestore Setup](./FIRESTORE_SETUP.md)
- [Complete Firebase Setup](./FIREBASE_COMPLETE_SETUP.md)
- [Setup Checklist](./SETUP_CHECKLIST.md)
