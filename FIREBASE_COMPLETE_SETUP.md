# Firebase + Firestore Complete Setup Guide

## ✅ What's Already Set Up

Your app now has:
- Firebase Authentication (Email/Password)
- Firestore Database with automatic collection initialization
- Data sync between localStorage and Firestore
- Security rules documentation

## 📋 Next Steps

### 1. Set Firestore Security Rules

1. Open [Firebase Console](https://console.firebase.google.com)
2. Go to **Firestore Database** → **Rules**
3. Replace the rules with:

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

4. Click **Publish**

### 2. Test the Setup

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Go to `http://localhost:5173/signin`

3. Create a new account (Sign Up via Onboarding)

4. Verify in Firebase Console:
   - Go to **Firestore Database**
   - Look for the `users` collection
   - Your account should appear as a document

### 3. Verify Data Sync

After creating your account and filling in profile:

1. Check **Firestore Database** → `users` → Your user ID
2. You should see:
   - `profile` with your weight/goals
   - `createdAt` and `updatedAt` timestamps
   - Empty `records`, `mealPlans`, etc.

### 4. Enable Additional Features (Optional)

#### Enable Analytics
Analytics is already configured but requires:
- Google Analytics property ID (optional)
- Data retention policies in Firebase Console

#### Enable Password Reset Email
Already configured - users can use "Forgot Password" on signin screen

## 📁 Database Structure

```
Firestore Collections:
├── users/
│   ├── {userId1}/
│   │   ├── profile (object)
│   │   ├── records (map) - Daily progress
│   │   ├── mealPlans (map) - Meal tracking
│   │   ├── gymRoutine (map) - Workout templates
│   │   ├── workoutHistory (map) - Completed workouts
│   │   ├── currentStreak (number)
│   │   ├── longestStreak (number)
│   │   ├── createdAt (timestamp)
│   │   └── updatedAt (timestamp)
│   └── {userId2}/
│       └── ...
└── metadata/
    └── app/
        ├── initialized (boolean)
        ├── version (string)
        └── lastUpdated (timestamp)
```

## 🔄 How Data Sync Works

1. **On App Load**:
   - User authenticates via Firebase Auth
   - Latest data is loaded from Firestore (if available)
   - App switches to online mode

2. **On User Action**:
   - Changes save to localStorage immediately (fast)
   - Changes sync to Firestore in background (reliable)
   - If offline, sync happens when connection restored

3. **On Multiple Devices**:
   - Each device syncs its own copy
   - Latest Firestore data wins on conflict
   - Consider adding conflict resolution if needed

## 🛡️ Security Best Practices

1. ✅ **Only authenticated users can access their data** (rules enforced)
2. ✅ **Users can only see their own documents** (rules enforced)
3. ✅ **Sensitive passwords never stored in Firestore** (Firebase Auth handles it)

### To Strengthen Security:

1. Enable 2FA in Firebase Auth:
   - Console → Authentication → Sign-in method → Add MFA

2. Set up Cloud Armor:
   - Prevents DDoS attacks
   - Console → Cloud Armor

3. Enable audit logging:
   - Console → Audit Logs
   - Logs all admin activities

## 📊 Monitoring & Debugging

### Check Usage in Firebase Console
- **Firestore Database** → **Usage**
- Real-time read/write metrics

### Debug Data Issues
Browser Console (F12):
```javascript
// Check if user is authenticated
console.log(auth.currentUser);

// View localStorage data
console.log(localStorage.getItem('fitness-shred-data'));

// Check for sync errors (look for "Failed to sync" messages)
```

### Common Issues & Fixes

**Issue**: "Permission denied" error
- **Fix**: Check Firestore security rules match the code above

**Issue**: User data not appearing in Firestore
- **Fix**: 
  1. Verify user is authenticated: Check Firebase Auth console
  2. Create a profile on the app (fill weight/goals)
  3. Refresh Firestore console

**Issue**: Data not syncing between devices
- **Fix**:
  1. Sign out completely
  2. Clear browser cache (Ctrl+Shift+Delete)
  3. Sign back in
  4. Updated data should sync from Firestore

## 📱 Using the App

### First Time Setup
1. Go to app → Click Sign Up
2. Create account with email/password
3. Fill in weight and fitness goals
4. Start tracking!

### Data Locations
- **Local**: Always saved to browser localStorage
- **Cloud**: Always synced to Firestore when authenticated
- **Both**: App works even if internet connection drops

### Managing Your Account
- **Settings** → **Edit Profile**: Update goals anytime
- **Settings** → **Sign Out**: Logs out and clears session
- **Settings** → **Reset All Data**: Wipes local data (Firestore copy remains)

## 🚀 Ready to Deploy?

Before deploying to production:

1. ✅ Test with multiple accounts
2. ✅ Verify Firestore rules are correct
3. ✅ Set up automatic Firestore backups
4. ✅ Enable HTTPS (automatic on Firebase Hosting)
5. ✅ Review Firebase pricing limits

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 📚 Additional Resources

- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Firestore Docs](https://firebase.google.com/docs/firestore)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/start)
- See `FIRESTORE_SETUP.md` for detailed database schema
