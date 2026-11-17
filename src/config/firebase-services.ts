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
  deleteDoc,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  AppState, 
  UserProfile, 
  FoodLibraryItem, 
  ExerciseLibraryItem, 
  DailyLog, 
  MeasurementRecord 
} from '../app/types';
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

// Firestore Service
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
        const data = docSnap.data() as AppState;
        
        // Also fetch any subcollections if present to ensure complete synchronization
        try {
          const foodsRef = collection(db, 'users', userId, 'foods');
          const foodsSnap = await getDocs(foodsRef);
          if (!foodsSnap.empty) {
            data.foods = data.foods || {};
            foodsSnap.forEach((docItem) => {
              data.foods![docItem.id] = docItem.data() as FoodLibraryItem;
            });
          }

          const exercisesRef = collection(db, 'users', userId, 'exercises');
          const exercisesSnap = await getDocs(exercisesRef);
          if (!exercisesSnap.empty) {
            data.exercises = data.exercises || {};
            exercisesSnap.forEach((docItem) => {
              data.exercises![docItem.id] = docItem.data() as ExerciseLibraryItem;
            });
          }

          const logsRef = collection(db, 'users', userId, 'dailyLogs');
          const logsSnap = await getDocs(logsRef);
          if (!logsSnap.empty) {
            data.dailyLogs = data.dailyLogs || {};
            logsSnap.forEach((docItem) => {
              data.dailyLogs![docItem.id] = docItem.data() as DailyLog;
            });
          }

          const measurementsRef = collection(db, 'users', userId, 'measurements');
          const measurementsSnap = await getDocs(measurementsRef);
          if (!measurementsSnap.empty) {
            data.measurements = data.measurements || {};
            measurementsSnap.forEach((docItem) => {
              data.measurements![docItem.id] = docItem.data() as MeasurementRecord;
            });
          }
        } catch (subErr) {
          console.warn('Subcollections fetch non-critical warning:', subErr);
        }

        return data;
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

  // Subcollection: Food Library
  async saveFoodItem(userId: string, food: FoodLibraryItem): Promise<void> {
    try {
      const foodDocRef = doc(db, 'users', userId, 'foods', food.id);
      await setDoc(foodDocRef, {
        ...food,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving food item:', error);
      throw error;
    }
  },

  async deleteFoodItem(userId: string, foodId: string): Promise<void> {
    try {
      const foodDocRef = doc(db, 'users', userId, 'foods', foodId);
      await deleteDoc(foodDocRef);
    } catch (error) {
      console.error('Error deleting food item:', error);
      throw error;
    }
  },

  // Subcollection: Exercise Library
  async saveExerciseItem(userId: string, exercise: ExerciseLibraryItem): Promise<void> {
    try {
      const exDocRef = doc(db, 'users', userId, 'exercises', exercise.id);
      await setDoc(exDocRef, {
        ...exercise,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving exercise item:', error);
      throw error;
    }
  },

  async deleteExerciseItem(userId: string, exerciseId: string): Promise<void> {
    try {
      const exDocRef = doc(db, 'users', userId, 'exercises', exerciseId);
      await deleteDoc(exDocRef);
    } catch (error) {
      console.error('Error deleting exercise item:', error);
      throw error;
    }
  },

  // Subcollection: Daily Logs
  async saveDailyLog(userId: string, date: string, log: DailyLog): Promise<void> {
    try {
      const logDocRef = doc(db, 'users', userId, 'dailyLogs', date);
      await setDoc(logDocRef, {
        ...log,
        date,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving daily log:', error);
      throw error;
    }
  },

  // Subcollection: Measurements
  async saveMeasurement(userId: string, measurement: MeasurementRecord): Promise<void> {
    try {
      const mDocRef = doc(db, 'users', userId, 'measurements', measurement.id);
      await setDoc(mDocRef, {
        ...measurement,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving measurement:', error);
      throw error;
    }
  },
};
