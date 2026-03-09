# Firebase Setup Guide

This project has been configured to use Firebase for authentication, Firestore database, and real-time database.

## Prerequisites

- A Firebase project created in [Firebase Console](https://console.firebase.google.com)
- Node.js and npm installed

## Setup Steps

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" or select an existing project
3. Follow the setup wizard to create your project

### 2. Get Your Firebase Credentials

1. In Firebase Console, click on your project
2. Click on the gear icon (Settings) in the top-left
3. Go to "Project settings"
4. Under "Your apps", click on the web icon (</>)
5. Register your app and copy the Firebase config object

Your config should look like:
```
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
  databaseURL: "..."
};
```

### 3. Set Up Environment Variables

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in your Firebase credentials in `.env.local`:
```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_DATABASE_URL=your_database_url_here
```

### 4. Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get Started"
3. Enable "Email/Password" provider
4. Click "Save"

### 5. Set Up Firestore Database (Optional)

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose your location and security rules
4. Click "Create"

### 6. Set Up Realtime Database (Optional)

1. In Firebase Console, go to "Realtime Database"
2. Click "Create Database"
3. Choose your location and security rules
4. Click "Create"

### 7. (Development) Set Up Firebase Emulator Suite

To test locally without using production Firebase:

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Initialize Firebase project:
```bash
firebase init emulators
```

3. Start emulators:
```bash
firebase emulators:start
```

The app will automatically connect to emulators when `DEV` environment is active.

## How It Works

### Authentication
- Users can sign up and sign in using the `useAuth()` hook
- User session is managed automatically via Firebase Auth
- Protected routes can be implemented using the `useAuth()` hook

### Data Sync
- User data is stored in localStorage for fast access
- When a user is authenticated, changes are automatically synced to Firestore
- On first login, remote data from Firestore is pulled and merged with local data

### Usage Example

```tsx
import { useAuth } from "@/config/auth-context";
import { storage } from "@/config/storage";

export function MyComponent() {
  const { user, signin, signout } = useAuth();
  
  const handleLogin = async () => {
    await signin("user@example.com", "password");
  };
  
  const saveProfile = () => {
    storage.updateProfile({
      startWeight: 80,
      currentWeight: 75,
      goalWeight: 70,
      startDate: new Date().toISOString(),
      targetSteps: 10000,
      targetProtein: 150,
      targetWater: 3000,
      wakeUpTime: "06:00",
    });
  };
  
  return (
    <div>
      {user ? (
        <>
          <p>Welcome {user.email}</p>
          <button onClick={signout}>Sign Out</button>
        </>
      ) : (
        <button onClick={handleLogin}>Sign In</button>
      )}
    </div>
  );
}
```

## File Structure

```
src/
├── config/
│   ├── firebase.ts              # Firebase initialization
│   ├── firebase-services.ts     # Firestore operations
│   ├── auth-context.tsx         # Auth context provider
│   └── storage.ts               # Local + Firebase sync storage
├── app/
│   ├── components/              # React components
│   ├── types.ts                 # TypeScript types
│   └── routes.ts                # Route definitions
└── main.tsx                     # App entry point with AuthProvider
```

## Security Rules

### Firestore
Add the following security rules in Firebase Console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### Realtime Database
```
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

## Troubleshooting

### Credentials not loading
- Check that `.env.local` has correct Firebase credentials
- Ensure variables are prefixed with `VITE_` for Vite to pick them up
- Restart the dev server after changing `.env.local`

### Firebase Connection Issues
- Verify your project ID is correct
- Check that all required APIs are enabled in Google Cloud Console
- Check browser console for detailed error messages

### Emulator Connection Issues
- Ensure Firebase Emulator Suite is running
- Check that ports 9099 (Auth), 8080 (Firestore), 9000 (Database) are available

## Next Steps

1. Implement login/signup UI using the `useAuth()` hook
2. Create protected routes that check `useAuth().user`
3. Customize Firestore data structure for your needs
4. Set up proper security rules for production
