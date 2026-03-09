import { AppState, DailyChecklist, DayRecord, UserProfile, DailyMealPlan, Meal, GymRoutine, WorkoutSession } from '../types';

const STORAGE_KEY = '30-day-shred-data';

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

export const storage = {
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
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
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
      workoutHistory: {}
    };
    state.profile = profile;
    this.save(state);
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
      workoutHistory: {}
    };
    state.mealPlans[mealPlan.date] = mealPlan;
    this.save(state);
  },

  addMeal(date: string, meal: Meal): void {
    const state = this.get() || { 
      profile: null, 
      records: {}, 
      currentStreak: 0, 
      longestStreak: 0,
      mealPlans: {},
      gymRoutine: {},
      workoutHistory: {}
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
    const meal = mealPlan.meals.find(m => m.id === mealId);
    
    if (meal) {
      mealPlan.meals = mealPlan.meals.filter(m => m.id !== mealId);
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
      workoutHistory: {}
    };
    
    state.gymRoutine[day] = workout;
    this.save(state);
  },

  getWorkoutForDay(day: string): WorkoutSession | null {
    const routine = this.getGymRoutine();
    return routine[day] || null;
  },

  // Workout History
  saveWorkoutHistory(date: string, workout: WorkoutSession): void {
    const state = this.get() || { 
      profile: null, 
      records: {}, 
      currentStreak: 0, 
      longestStreak: 0,
      mealPlans: {},
      gymRoutine: {},
      workoutHistory: {}
    };
    
    state.workoutHistory[date] = { ...workout, completed: true };
    this.save(state);
  },

  getWorkoutHistory(date: string): WorkoutSession | null {
    const state = this.get();
    return state?.workoutHistory[date] || null;
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
      workoutHistory: {}
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

  getDaysCompleted(): number {
    const state = this.get();
    if (!state) return 0;
    
    return Object.values(state.records).filter(
      record => record.completionRate === 100
    ).length;
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
};