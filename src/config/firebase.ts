import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Realtime Database (optional)
export const realtimeDb = getDatabase(app);

// Initialize Analytics (only in browser)
export const analytics = isSupported().then((supported) => {
  if (supported) {
    return getAnalytics(app);
  }
  return null;
});

/**
 * Optional: Connect to Firebase Emulator Suite
 * 
 * To use emulators:
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Run emulators: firebase emulators:start
 * 3. Set VITE_USE_FIREBASE_EMULATOR=true in .env.local
 * 4. Uncomment the code below
 */

// To enable emulator, uncomment this section:
/*
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  } catch (e) {
    // Emulator already connected
  }

  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (e) {
    // Emulator already connected
  }

  try {
    connectDatabaseEmulator(realtimeDb, 'localhost', 9000);
  } catch (e) {
    // Emulator already connected
  }
}
*/

export default app;
