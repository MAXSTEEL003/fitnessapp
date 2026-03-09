import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { AppState, UserProfile } from '../app/types';
import { createUserDocument } from './firestore-init';

// Auth Service
export const authService = {
  async signup(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Initialize user document in Firestore
      await createUserDocument(user.uid, user.email || email);

      return user;
    } catch (error) {
      throw error;
    }
  },

  async signin(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  async signout() {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  },

  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  },

  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },
};

// Firestore Service for AppState
export const firestoreService = {
  async saveAppState(userId: string, state: AppState): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(
        userDocRef,
        {
          ...state,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving app state:', error);
      throw error;
    }
  },

  async getAppState(userId: string): Promise<AppState | null> {
    try {
      const userDocRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        return docSnap.data() as AppState;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving app state:', error);
      throw error;
    }
  },

  async saveProfile(userId: string, profile: UserProfile): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        profile,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  },

  async saveDailyRecords(userId: string, records: Record<string, any>): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        records,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error saving daily records:', error);
      throw error;
    }
  },

  async saveMealPlans(userId: string, mealPlans: Record<string, any>): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        mealPlans,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error saving meal plans:', error);
      throw error;
    }
  },

  async saveGymRoutine(userId: string, gymRoutine: any): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        gymRoutine,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error saving gym routine:', error);
      throw error;
    }
  },

  async saveWorkoutHistory(userId: string, workoutHistory: Record<string, any>): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        workoutHistory,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error saving workout history:', error);
      throw error;
    }
  },
};

// Hook for auth context will be created in a separate file
