import { AppState, DailyChecklist, DayRecord, UserProfile, DailyMealPlan, Meal, GymRoutine, WorkoutSession } from '../app/types';
import { firestoreService } from './firebase-services';
import { auth } from './firebase';

const STORAGE_KEY = 'fitness-shred-data';

const defaultChecklist: DailyChecklist = {
  wakeUpOnTime: false,
  fastedCardio: false,
  gymWorkout: false,
  proteinTarget: false,
  stepsGoal: false,
  waterIntake: false,
  noCheatMeals: false,
  sleepOnTime: false,
};

export const storageWithFirebase = {
  get(): AppState | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;

      const state = JSON.parse(data);

      // Migrate old data to include new properties
      if (state && !state.mealPlans) {
        state.mealPlans = {};
      }
      if (state && !state.gymRoutine) {
        state.gymRoutine = {};
      }
      if (state && !state.workoutHistory) {
        state.workoutHistory = {};
      }

      return state;
    } catch {
      return null;
    }
  },

  save(state: AppState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

      // Sync with Firebase if user is authenticated
      const userId = auth.currentUser?.uid;
      if (userId) {
        firestoreService.saveAppState(userId, state).catch((error) => {
          console.error('Failed to sync with Firebase:', error);
        });
      }
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  async loadFromFirebase(): Promise<AppState | null> {
    const userId = auth.currentUser?.uid;
    if (!userId) return null;

    try {
      const remoteState = await firestoreService.getAppState(userId);
      if (remoteState) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteState));
        return remoteState;
      }
      return null;
    } catch (error) {
      console.error('Failed to load from Firebase:', error);
      return null;
    }
  },

  updateProfile(profile: UserProfile): void {
    const state = this.get() || {
      profile: null,
      records: {},
      currentStreak: 0,
      longestStreak: 0,
      mealPlans: {},
      gymRoutine: {},
      workoutHistory: {},
    };
    state.profile = profile;
    this.save(state);

    // Also sync just the profile to Firebase
    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveProfile(userId, profile).catch((error) => {
        console.error('Failed to sync profile with Firebase:', error);
      });
    }
  },

  // Meal Plan Methods
  getMealPlan(date: string): DailyMealPlan | null {
    const state = this.get();
    if (!state || !state.mealPlans) return null;
    return state.mealPlans[date] || null;
  },

  saveMealPlan(mealPlan: DailyMealPlan): void {
    const state = this.get() || {
      profile: null,
      records: {},
      currentStreak: 0,
      longestStreak: 0,
      mealPlans: {},
      gymRoutine: {},
      workoutHistory: {},
    };
    state.mealPlans[mealPlan.date] = mealPlan;
    this.save(state);

    // Sync with Firebase
    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveMealPlans(userId, state.mealPlans).catch((error) => {
        console.error('Failed to sync meal plans with Firebase:', error);
      });
    }
  },

  addMeal(date: string, meal: Meal): void {
    const state = this.get() || {
      profile: null,
      records: {},
      currentStreak: 0,
      longestStreak: 0,
      mealPlans: {},
      gymRoutine: {},
      workoutHistory: {},
    };

    const mealPlan = state.mealPlans[date] || {
      date,
      meals: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
    };

    mealPlan.meals.push(meal);
    mealPlan.totalCalories += meal.calories;
    mealPlan.totalProtein += meal.protein;
    mealPlan.totalCarbs += meal.carbs;
    mealPlan.totalFats += meal.fats;

    state.mealPlans[date] = mealPlan;
    this.save(state);
  },

  deleteMeal(date: string, mealId: string): void {
    const state = this.get();
    if (!state?.mealPlans[date]) return;

    const mealPlan = state.mealPlans[date];
    const meal = mealPlan.meals.find((m) => m.id === mealId);

    if (meal) {
      mealPlan.meals = mealPlan.meals.filter((m) => m.id !== mealId);
      mealPlan.totalCalories -= meal.calories;
      mealPlan.totalProtein -= meal.protein;
      mealPlan.totalCarbs -= meal.carbs;
      mealPlan.totalFats -= meal.fats;

      this.save(state);
    }
  },

  // Gym Routine Methods
  getGymRoutine(): GymRoutine {
    const state = this.get();
    return state?.gymRoutine || {};
  },

  saveWorkoutForDay(day: string, workout: WorkoutSession): void {
    const state = this.get() || {
      profile: null,
      records: {},
      currentStreak: 0,
      longestStreak: 0,
      mealPlans: {},
      gymRoutine: {},
      workoutHistory: {},
    };

    state.gymRoutine[day] = workout;
    this.save(state);

    // Sync with Firebase
    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveGymRoutine(userId, state.gymRoutine).catch((error) => {
        console.error('Failed to sync gym routine with Firebase:', error);
      });
    }
  },

  // Daily Record Methods
  recordDay(date: string, checklist: DailyChecklist, completionRate: number, weight?: number, notes?: string): void {
    const state = this.get() || {
      profile: null,
      records: {},
      currentStreak: 0,
      longestStreak: 0,
      mealPlans: {},
      gymRoutine: {},
      workoutHistory: {},
    };

    const dayRecord: DayRecord = {
      date,
      checklist,
      weight,
      notes,
      completionRate,
    };

    state.records[date] = dayRecord;

    // Update streaks
    const previousDate = new Date(new Date(date).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (completionRate === 100) {
      if (state.records[previousDate]?.completionRate === 100) {
        state.currentStreak += 1;
      } else {
        state.currentStreak = 1;
      }
      state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
    } else {
      state.currentStreak = 0;
    }

    this.save(state);

    // Sync with Firebase
    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveDailyRecords(userId, state.records).catch((error) => {
        console.error('Failed to sync daily records with Firebase:', error);
      });
    }
  },

  getRecord(date: string): DayRecord | undefined {
    const state = this.get();
    return state?.records[date];
  },

  // Workout History
  saveWorkout(date: string, workout: WorkoutSession): void {
    const state = this.get() || {
      profile: null,
      records: {},
      currentStreak: 0,
      longestStreak: 0,
      mealPlans: {},
      gymRoutine: {},
      workoutHistory: {},
    };

    state.workoutHistory[date] = workout;
    this.save(state);

    // Sync with Firebase
    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveWorkoutHistory(userId, state.workoutHistory).catch((error) => {
        console.error('Failed to sync workout history with Firebase:', error);
      });
    }
  },

  getWorkoutHistory(date: string): WorkoutSession | undefined {
    const state = this.get();
    return state?.workoutHistory[date];
  },

  // Streak Methods
  getCurrentStreak(): number {
    const state = this.get();
    if (!state) return 0;
    return state.currentStreak;
  },

  getLongestStreak(): number {
    const state = this.get();
    if (!state) return 0;
    return state.longestStreak;
  },

  getDaysCompleted(): number {
    const state = this.get();
    if (!state) return 0;

    return Object.values(state.records).filter((record) => record.completionRate === 100).length;
  },

  getDaysRemaining(): number {
    // No limit on days remaining - program can be extended indefinitely
    return Infinity;
  },

  getCurrentDay(): number {
    const state = this.get();
    if (!state?.profile?.startDate) return 1;

    const start = new Date(state.profile.startDate);
    const today = new Date();
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return Math.max(1, diffDays);
  },

  getTodayRecord(): DayRecord {
    const state = this.get();
    const today = new Date().toISOString().split('T')[0];

    if (state?.records[today]) {
      return state.records[today];
    }

    return {
      date: today,
      checklist: { ...defaultChecklist },
      completionRate: 0,
    };
  },

  updateTodayChecklist(checklist: DailyChecklist): void {
    const state = this.get() || {
      profile: null,
      records: {},
      currentStreak: 0,
      longestStreak: 0,
      mealPlans: {},
      gymRoutine: {},
      workoutHistory: {},
    };
    const today = new Date().toISOString().split('T')[0];

    const completionRate = this.calculateCompletionRate(checklist);

    state.records[today] = {
      date: today,
      checklist,
      completionRate,
    };

    // Update streaks
    this.updateStreaks(state);

    this.save(state);

    // Sync with Firebase
    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveDailyRecords(userId, state.records).catch((error) => {
        console.error('Failed to sync daily records with Firebase:', error);
      });
    }
  },

  updateTodayWeight(weight: number): void {
    const state = this.get();
    if (!state) return;

    const today = new Date().toISOString().split('T')[0];
    if (state.records[today]) {
      state.records[today].weight = weight;
      this.save(state);
    }
  },

  calculateCompletionRate(checklist: DailyChecklist): number {
    const values = Object.values(checklist);
    const completed = values.filter(Boolean).length;
    return Math.round((completed / values.length) * 100);
  },

  updateStreaks(state: AppState): void {
    const sortedDates = Object.keys(state.records).sort();
    let currentStreak = 0;
    let tempStreak = 0;
    let longestStreak = 0;

    const today = new Date().toISOString().split('T')[0];

    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const date = sortedDates[i];
      const record = state.records[date];

      if (record.completionRate === 100) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }

        if (date === today || this.isConsecutiveDay(date, sortedDates[i + 1] || today)) {
          currentStreak = tempStreak;
        }
      } else {
        if (date === today) {
          currentStreak = tempStreak;
        }
        tempStreak = 0;
      }
    }

    state.currentStreak = currentStreak;
    state.longestStreak = longestStreak;
  },

  isConsecutiveDay(date1: string, date2: string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  },

  saveWorkoutHistoryForDate(date: string, workout: WorkoutSession): void {
    const state = this.get() || {
      profile: null,
      records: {},
      currentStreak: 0,
      longestStreak: 0,
      mealPlans: {},
      gymRoutine: {},
      workoutHistory: {},
    };

    state.workoutHistory[date] = { ...workout, completed: true };
    this.save(state);

    // Sync with Firebase
    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveWorkoutHistory(userId, state.workoutHistory).catch((error) => {
        console.error('Failed to sync workout history with Firebase:', error);
      });
    }
  },

  getWorkoutForDay(day: string): WorkoutSession | null {
    const routine = this.getGymRoutine();
    return routine[day] || null;
  },
};

// For backwards compatibility, export as default
export const storage = storageWithFirebase;
