import {
  collection,
  doc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { AppState, UserProfile } from '../app/types';

/**
 * Initialize Firestore collections for a new user
 * This should be called after user signs up
 */
export async function initializeUserCollections(userId: string, profile: UserProfile) {
  try {
    // Create main user document
    const userDocRef = doc(db, 'users', userId);
    
    const initialState: AppState = {
      profile,
      records: {},
      currentStreak: 0,
      longestStreak: 0,
      mealPlans: {},
      gymRoutine: {},
      workoutHistory: {},
    };

    await setDoc(userDocRef, {
      ...initialState,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('User collections initialized successfully');
  } catch (error) {
    console.error('Error initializing user collections:', error);
    throw error;
  }
}

/**
 * Create a new user document with minimal data
 */
export async function createUserDocument(userId: string, email: string) {
  try {
    const userDocRef = doc(db, 'users', userId);

    await setDoc(userDocRef, {
      id: userId,
      email,
      profile: null,
      records: {},
      currentStreak: 0,
      longestStreak: 0,
      mealPlans: {},
      gymRoutine: {},
      workoutHistory: {},
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('User document created successfully');
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
}

/**
 * Get or create the "metadata" collection for app-wide data
 */
export async function ensureMetadataCollection() {
  try {
    const metadataRef = doc(db, 'metadata', 'app');

    await setDoc(
      metadataRef,
      {
        initialized: true,
        version: '1.0',
        lastUpdated: Timestamp.now(),
      },
      { merge: true }
    );

    console.log('Metadata collection ensured');
  } catch (error) {
    console.error('Error ensuring metadata collection:', error);
    throw error;
  }
}
