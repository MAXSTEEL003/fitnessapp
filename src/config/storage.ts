import { 
  AppState, 
  DailyChecklist, 
  DayRecord, 
  UserProfile, 
  DailyMealPlan, 
  Meal, 
  GymRoutine, 
  WorkoutSession,
  FoodLibraryItem,
  FoodDiaryEntry,
  ExerciseLibraryItem,
  ExerciseDiaryEntry,
  DailyLog,
  MeasurementRecord,
  MealCategory,
  Recipe
} from '../app/types';
import { firestoreService } from './firebase-services';
import { auth } from './firebase';
import { getTodayDateString, formatDateToKolkata } from '../app/utils/date';
import { 
  calculateFoodNutrition, 
  calculateDailyNutritionTotals, 
  calculateRemainingCarbs,
  round
} from '../app/utils/nutrition-calculations';
import { MASTER_FOODS, MASTER_RECIPES } from './master-food-library';
import { MASTER_EXERCISES } from './master-exercise-library';

const STORAGE_KEY = 'fitness-shred-data';

export const DEFAULT_TARGETS = {
  calories: 2100,
  protein: 150,
  fats: 60,
  steps: 10000,
  carbs: 240, // (2100 - (150*4 + 60*9)) / 4 = 240g
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Athlete',
  startWeight: 82,
  currentWeight: 82,
  goalWeight: 75,
  height: 168,
  age: 23,
  currentBodyFat: 30,
  startDate: '2026-01-01',
  targetSteps: 10000,
  targetProtein: 150,
  targetCalories: 2100,
  targetFats: 60,
  targetCarbs: 240,
  targetWater: 3500,
  wakeUpTime: '06:00',
  currentWaist: 92,
  goalWaist: 82,
};

export const INITIAL_SAMPLE_FOOD = MASTER_FOODS[0];
export const INITIAL_SAMPLE_EXERCISES = MASTER_EXERCISES;

/**
 * Deduplicated Seeding of Master Foods, Recipes, and Exercises.
 * Preserves existing user entries and edits; never duplicates IDs.
 */
export function seedMasterLibraries(state: AppState): boolean {
  let changed = false;
  if (!state.foods) state.foods = {};
  if (!state.recipes) state.recipes = {};
  if (!state.exercises) state.exercises = {};

  for (const food of MASTER_FOODS) {
    if (!state.foods[food.id]) {
      state.foods[food.id] = food;
      changed = true;
    }
  }

  for (const recipe of MASTER_RECIPES) {
    if (!state.recipes[recipe.id]) {
      state.recipes[recipe.id] = recipe;
      changed = true;
    }
  }

  for (const ex of MASTER_EXERCISES) {
    if (!state.exercises[ex.id]) {
      state.exercises[ex.id] = ex;
      changed = true;
    }
  }

  return changed;
}

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

      const state: AppState = JSON.parse(data);

      // Initialize missing structures
      if (!state.mealPlans) state.mealPlans = {};
      if (!state.gymRoutine) state.gymRoutine = {};
      if (!state.workoutHistory) state.workoutHistory = {};
      if (!state.records) state.records = {};
      if (!state.foods) state.foods = {};
      if (!state.recipes) state.recipes = {};
      if (!state.exercises) state.exercises = {};
      if (!state.dailyLogs) state.dailyLogs = {};
      if (!state.measurements) state.measurements = {};

      // Seed master libraries (deduplicated)
      const seeded = seedMasterLibraries(state);

      // Ensure profile defaults
      if (!state.profile) {
        state.profile = { ...DEFAULT_USER_PROFILE };
      } else {
        if (!state.profile.currentWeight) state.profile.currentWeight = 82;
        if (!state.profile.goalWeight) state.profile.goalWeight = 75;
        if (!state.profile.height) state.profile.height = 168;
        if (!state.profile.age) state.profile.age = 23;
        if (!state.profile.currentBodyFat) state.profile.currentBodyFat = 30;
        if (!state.profile.targetCalories) state.profile.targetCalories = DEFAULT_TARGETS.calories;
        if (!state.profile.targetProtein) state.profile.targetProtein = DEFAULT_TARGETS.protein;
        if (!state.profile.targetFats) state.profile.targetFats = DEFAULT_TARGETS.fats;
        if (!state.profile.targetSteps) state.profile.targetSteps = DEFAULT_TARGETS.steps;
        if (!state.profile.targetCarbs) {
          state.profile.targetCarbs = calculateRemainingCarbs(
            state.profile.targetCalories,
            state.profile.targetProtein,
            state.profile.targetFats
          );
        }
      }

      if (seeded) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
        // Merge with master seed defaults (deduplicated)
        seedMasterLibraries(remoteState);
        if (!remoteState.profile) {
          remoteState.profile = { ...DEFAULT_USER_PROFILE };
        }
        if (!remoteState.dailyLogs) remoteState.dailyLogs = {};
        if (!remoteState.measurements) remoteState.measurements = {};

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
      foods: { [INITIAL_SAMPLE_FOOD.id]: INITIAL_SAMPLE_FOOD },
      exercises: {},
      dailyLogs: {},
      measurements: {},
    };

    // Calculate carbs if missing
    const targetCalories = profile.targetCalories || DEFAULT_TARGETS.calories;
    const targetProtein = profile.targetProtein || DEFAULT_TARGETS.protein;
    const targetFats = profile.targetFats || DEFAULT_TARGETS.fats;
    const targetCarbs = profile.targetCarbs || calculateRemainingCarbs(targetCalories, targetProtein, targetFats);

    state.profile = {
      ...profile,
      targetCalories,
      targetProtein,
      targetFats,
      targetCarbs,
      targetSteps: profile.targetSteps || DEFAULT_TARGETS.steps,
    };

    this.save(state);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveProfile(userId, state.profile).catch((error) => {
        console.error('Failed to sync profile with Firebase:', error);
      });
    }
  },

  // ----------------------------------------------------
  // FOOD LIBRARY
  // ----------------------------------------------------
  getFoods(): FoodLibraryItem[] {
    const state = this.get();
    if (!state?.foods) return [INITIAL_SAMPLE_FOOD];
    return Object.values(state.foods);
  },

  getFoodById(id: string): FoodLibraryItem | undefined {
    const state = this.get();
    return state?.foods?.[id];
  },

  saveFood(food: FoodLibraryItem): void {
    const state = this.get() || this.createInitialState();
    if (!state.foods) state.foods = {};

    state.foods[food.id] = {
      ...food,
      calories: Math.max(0, Number(food.calories) || 0),
      protein: Math.max(0, Number(food.protein) || 0),
      carbs: Math.max(0, Number(food.carbs) || 0),
      fats: Math.max(0, Number(food.fats) || 0),
      servingSize: Math.max(0.1, Number(food.servingSize) || 100),
    };

    this.save(state);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveFoodItem(userId, state.foods[food.id]).catch((e) => {
        console.error('Error syncing food to Firebase:', e);
      });
    }
  },

  deleteFood(id: string): void {
    const state = this.get();
    if (!state?.foods || !state.foods[id]) return;

    delete state.foods[id];
    this.save(state);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.deleteFoodItem(userId, id).catch((e) => {
        console.error('Error deleting food from Firebase:', e);
      });
    }
  },

  duplicateFood(id: string): FoodLibraryItem | null {
    const food = this.getFoodById(id);
    if (!food) return null;

    const newFood: FoodLibraryItem = {
      ...food,
      id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${food.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };

    this.saveFood(newFood);
    return newFood;
  },

  toggleFavoriteFood(id: string): void {
    const state = this.get();
    if (!state?.foods || !state.foods[id]) return;

    state.foods[id].isFavorite = !state.foods[id].isFavorite;
    this.save(state);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveFoodItem(userId, state.foods[id]).catch(console.error);
    }
  },

  touchFoodLastUsed(id: string): void {
    const state = this.get();
    if (!state?.foods || !state.foods[id]) return;

    state.foods[id].lastUsedAt = new Date().toISOString();
    this.save(state);
  },

  // ----------------------------------------------------
  // RECIPES & INDIAN MEALS BUILDER
  // ----------------------------------------------------
  getRecipes(): Recipe[] {
    const state = this.get();
    if (!state?.recipes) return MASTER_RECIPES;
    return Object.values(state.recipes);
  },

  getRecipeById(id: string): Recipe | undefined {
    const state = this.get();
    return state?.recipes?.[id];
  },

  saveRecipe(recipe: Recipe): Recipe {
    const state = this.get() || this.createInitialState();
    if (!state.recipes) state.recipes = {};

    const existing = state.recipes[recipe.id];
    const finalRecipe: Recipe = {
      ...recipe,
      createdAt: existing?.createdAt || recipe.createdAt || new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    };

    state.recipes[finalRecipe.id] = finalRecipe;
    this.save(state);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveRecipe(userId, finalRecipe).catch((e) => {
        console.error('Error syncing recipe to Firebase:', e);
      });
    }

    return finalRecipe;
  },

  deleteRecipe(id: string): boolean {
    const state = this.get();
    if (!state?.recipes || !state.recipes[id]) return false;

    delete state.recipes[id];
    this.save(state);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.deleteRecipe(userId, id).catch((e) => {
        console.error('Error deleting recipe from Firebase:', e);
      });
    }

    return true;
  },

  toggleRecipeFavorite(id: string): void {
    const state = this.get();
    if (!state?.recipes || !state.recipes[id]) return;

    state.recipes[id].isFavorite = !state.recipes[id].isFavorite;
    this.save(state);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveRecipe(userId, state.recipes[id]).catch(console.error);
    }
  },

  touchRecipeLastUsed(id: string): void {
    const state = this.get();
    if (!state?.recipes || !state.recipes[id]) return;

    state.recipes[id].lastUsedAt = new Date().toISOString();
    this.save(state);
  },

  logRecipeToFoodDiary(
    recipeId: string,
    servingsToLog: number,
    mealCategory: MealCategory,
    date?: string,
    time?: string
  ): FoodDiaryEntry | null {
    const recipe = this.getRecipeById(recipeId);
    if (!recipe) return null;

    const safeServings = Math.max(0.1, Number(servingsToLog) || 1);
    const nutrition = {
      calories: round(recipe.perServingNutrition.calories * safeServings, 1),
      protein: round(recipe.perServingNutrition.protein * safeServings, 1),
      carbs: round(recipe.perServingNutrition.carbs * safeServings, 1),
      fats: round(recipe.perServingNutrition.fats * safeServings, 1),
    };

    const targetDate = date || getTodayDateString();
    const entry: FoodDiaryEntry = {
      id: `food_entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      foodId: recipe.id,
      recipeId: recipe.id,
      name: `${recipe.name} (${safeServings} serving${safeServings > 1 ? 's' : ''})`,
      mealCategory,
      quantity: safeServings,
      servingUnit: 'serving',
      baseServingSize: 1,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fats: nutrition.fats,
      notes: recipe.notes || `Recipe: ${recipe.name}`,
      time: time || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      loggedAt: new Date().toISOString(),
      date: targetDate,
    };

    this.addFoodDiaryEntry(targetDate, entry);
    this.touchRecipeLastUsed(recipe.id);
    return entry;
  },

  // ----------------------------------------------------
  // DAILY LOGS & FOOD DIARY
  // ----------------------------------------------------
  getDailyLog(date: string): DailyLog {
    const state = this.get();
    if (state?.dailyLogs?.[date]) {
      return state.dailyLogs[date];
    }

    // Check if legacy mealPlan exists for this date and migrate
    const legacyMealPlan = state?.mealPlans?.[date];
    const initialFoodEntries: FoodDiaryEntry[] = legacyMealPlan
      ? legacyMealPlan.meals.map((m) => ({
          id: m.id,
          name: m.name,
          mealCategory: m.category || 'Lunch',
          quantity: m.quantity || 1,
          servingUnit: m.servingUnit || 'serving',
          baseServingSize: 1,
          calories: m.calories,
          protein: m.protein,
          carbs: m.carbs,
          fats: m.fats,
          time: m.time,
          loggedAt: new Date().toISOString(),
          date,
        }))
      : [];

    return {
      date,
      foodEntries: initialFoodEntries,
      exerciseEntries: [],
      steps: state?.records?.[date]?.steps || 0,
      weight: state?.records?.[date]?.weight,
      waist: state?.records?.[date]?.waist,
      bodyFat: state?.records?.[date]?.bodyFat,
      notes: state?.records?.[date]?.notes,
    };
  },

  saveDailyLog(dailyLog: DailyLog): void {
    const state = this.get() || this.createInitialState();
    if (!state.dailyLogs) state.dailyLogs = {};

    state.dailyLogs[dailyLog.date] = {
      ...dailyLog,
      updatedAt: new Date().toISOString(),
    };

    // Keep legacy mealPlans in sync for backwards compatibility
    if (!state.mealPlans) state.mealPlans = {};
    const totals = calculateDailyNutritionTotals(dailyLog.foodEntries);
    state.mealPlans[dailyLog.date] = {
      date: dailyLog.date,
      meals: dailyLog.foodEntries.map((fe) => ({
        id: fe.id,
        name: fe.name,
        calories: fe.calories,
        protein: fe.protein,
        carbs: fe.carbs,
        fats: fe.fats,
        time: fe.time || '12:00',
        category: fe.mealCategory,
        quantity: fe.quantity,
        servingUnit: fe.servingUnit,
      })),
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFats: totals.fats,
    };

    // Update DayRecord with steps/weight/waist
    if (!state.records[dailyLog.date]) {
      state.records[dailyLog.date] = {
        date: dailyLog.date,
        checklist: { ...defaultChecklist },
        completionRate: 0,
      };
    }
    if (dailyLog.weight !== undefined) state.records[dailyLog.date].weight = dailyLog.weight;
    if (dailyLog.waist !== undefined) state.records[dailyLog.date].waist = dailyLog.waist;
    if (dailyLog.bodyFat !== undefined) state.records[dailyLog.date].bodyFat = dailyLog.bodyFat;
    if (dailyLog.steps !== undefined) state.records[dailyLog.date].steps = dailyLog.steps;

    this.save(state);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveDailyLog(userId, dailyLog.date, dailyLog).catch((e) => {
        console.error('Error syncing daily log to Firebase:', e);
      });
    }
  },

  addFoodEntry(date: string, entryData: Omit<FoodDiaryEntry, 'id' | 'loggedAt' | 'date'>): FoodDiaryEntry {
    const dailyLog = this.getDailyLog(date);
    const newEntry: FoodDiaryEntry = {
      ...entryData,
      id: `fe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      loggedAt: new Date().toISOString(),
      date,
      calories: round(Math.max(0, Number(entryData.calories) || 0), 1),
      protein: round(Math.max(0, Number(entryData.protein) || 0), 1),
      carbs: round(Math.max(0, Number(entryData.carbs) || 0), 1),
      fats: round(Math.max(0, Number(entryData.fats) || 0), 1),
      quantity: round(Math.max(0, Number(entryData.quantity) || 1), 1),
    };

    dailyLog.foodEntries.push(newEntry);
    this.saveDailyLog(dailyLog);

    if (entryData.foodId) {
      this.touchFoodLastUsed(entryData.foodId);
    }

    return newEntry;
  },

  updateFoodEntry(date: string, entryId: string, updates: Partial<FoodDiaryEntry>): void {
    const dailyLog = this.getDailyLog(date);
    const index = dailyLog.foodEntries.findIndex((e) => e.id === entryId);
    if (index === -1) return;

    dailyLog.foodEntries[index] = {
      ...dailyLog.foodEntries[index],
      ...updates,
      calories: updates.calories !== undefined ? round(Math.max(0, Number(updates.calories)), 1) : dailyLog.foodEntries[index].calories,
      protein: updates.protein !== undefined ? round(Math.max(0, Number(updates.protein)), 1) : dailyLog.foodEntries[index].protein,
      carbs: updates.carbs !== undefined ? round(Math.max(0, Number(updates.carbs)), 1) : dailyLog.foodEntries[index].carbs,
      fats: updates.fats !== undefined ? round(Math.max(0, Number(updates.fats)), 1) : dailyLog.foodEntries[index].fats,
      quantity: updates.quantity !== undefined ? round(Math.max(0, Number(updates.quantity)), 1) : dailyLog.foodEntries[index].quantity,
    };

    this.saveDailyLog(dailyLog);
  },

  deleteFoodEntry(date: string, entryId: string): void {
    const dailyLog = this.getDailyLog(date);
    dailyLog.foodEntries = dailyLog.foodEntries.filter((e) => e.id !== entryId);
    this.saveDailyLog(dailyLog);
  },

  duplicateFoodEntry(date: string, entryId: string): void {
    const dailyLog = this.getDailyLog(date);
    const entry = dailyLog.foodEntries.find((e) => e.id === entryId);
    if (!entry) return;

    const duplicated: FoodDiaryEntry = {
      ...entry,
      id: `fe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      loggedAt: new Date().toISOString(),
    };

    dailyLog.foodEntries.push(duplicated);
    this.saveDailyLog(dailyLog);
  },

  moveFoodEntry(date: string, entryId: string, targetMealCategory: MealCategory): void {
    const dailyLog = this.getDailyLog(date);
    const entry = dailyLog.foodEntries.find((e) => e.id === entryId);
    if (!entry) return;

    entry.mealCategory = targetMealCategory;
    this.saveDailyLog(dailyLog);
  },

  // Backwards compatibility for DietPlan & Dashboard
  getMealPlan(date: string): DailyMealPlan | null {
    const dailyLog = this.getDailyLog(date);
    if (dailyLog.foodEntries.length === 0) {
      const state = this.get();
      return state?.mealPlans?.[date] || null;
    }

    const totals = calculateDailyNutritionTotals(dailyLog.foodEntries);
    return {
      date,
      meals: dailyLog.foodEntries.map((fe) => ({
        id: fe.id,
        name: fe.name,
        calories: fe.calories,
        protein: fe.protein,
        carbs: fe.carbs,
        fats: fe.fats,
        time: fe.time || '12:00',
        category: fe.mealCategory,
        quantity: fe.quantity,
        servingUnit: fe.servingUnit,
      })),
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFats: totals.fats,
    };
  },

  addMeal(date: string, meal: Meal): void {
    this.addFoodEntry(date, {
      name: meal.name,
      mealCategory: meal.category || 'Lunch',
      quantity: meal.quantity || 1,
      servingUnit: meal.servingUnit || 'serving',
      baseServingSize: 1,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      time: meal.time,
    });
  },

  deleteMeal(date: string, mealId: string): void {
    this.deleteFoodEntry(date, mealId);
  },

  // ----------------------------------------------------
  // EXERCISE LIBRARY & DIARY
  // ----------------------------------------------------
  getExercises(): ExerciseLibraryItem[] {
    const state = this.get();
    if (!state?.exercises || Object.keys(state.exercises).length === 0) {
      return INITIAL_SAMPLE_EXERCISES;
    }
    return Object.values(state.exercises);
  },

  getExerciseById(id: string): ExerciseLibraryItem | undefined {
    const state = this.get();
    return state?.exercises?.[id];
  },

  saveExercise(exercise: ExerciseLibraryItem): void {
    const state = this.get() || this.createInitialState();
    if (!state.exercises) state.exercises = {};

    state.exercises[exercise.id] = {
      ...exercise,
      defaultCalories: exercise.defaultCalories ? Math.max(0, Number(exercise.defaultCalories)) : undefined,
      defaultDuration: exercise.defaultDuration ? Math.max(0, Number(exercise.defaultDuration)) : undefined,
    };

    this.save(state);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveExerciseItem(userId, state.exercises[exercise.id]).catch((e) => {
        console.error('Error syncing exercise to Firebase:', e);
      });
    }
  },

  deleteExercise(id: string): void {
    const state = this.get();
    if (!state?.exercises || !state.exercises[id]) return;

    delete state.exercises[id];
    this.save(state);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.deleteExerciseItem(userId, id).catch((e) => {
        console.error('Error deleting exercise from Firebase:', e);
      });
    }
  },

  duplicateExercise(id: string): ExerciseLibraryItem | null {
    const ex = this.getExerciseById(id);
    if (!ex) return null;

    const newEx: ExerciseLibraryItem = {
      ...ex,
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${ex.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };

    this.saveExercise(newEx);
    return newEx;
  },

  toggleFavoriteExercise(id: string): void {
    const state = this.get();
    if (!state?.exercises || !state.exercises[id]) return;

    state.exercises[id].isFavorite = !state.exercises[id].isFavorite;
    this.save(state);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveExerciseItem(userId, state.exercises[id]).catch(console.error);
    }
  },

  touchExerciseLastUsed(id: string): void {
    const state = this.get();
    if (!state?.exercises || !state.exercises[id]) return;

    state.exercises[id].lastUsedAt = new Date().toISOString();
    this.save(state);
  },

  addExerciseEntry(date: string, entryData: Omit<ExerciseDiaryEntry, 'id' | 'loggedAt' | 'date'>): ExerciseDiaryEntry {
    const dailyLog = this.getDailyLog(date);
    const newEntry: ExerciseDiaryEntry = {
      ...entryData,
      id: `ee_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      loggedAt: new Date().toISOString(),
      date,
      calories: Math.max(0, Number(entryData.calories) || 0),
      duration: entryData.duration ? Math.max(0, Number(entryData.duration)) : undefined,
    };

    dailyLog.exerciseEntries.push(newEntry);
    this.saveDailyLog(dailyLog);

    if (entryData.exerciseId) {
      this.touchExerciseLastUsed(entryData.exerciseId);
    }

    return newEntry;
  },

  updateExerciseEntry(date: string, entryId: string, updates: Partial<ExerciseDiaryEntry>): void {
    const dailyLog = this.getDailyLog(date);
    const index = dailyLog.exerciseEntries.findIndex((e) => e.id === entryId);
    if (index === -1) return;

    dailyLog.exerciseEntries[index] = {
      ...dailyLog.exerciseEntries[index],
      ...updates,
      calories: updates.calories !== undefined ? Math.max(0, Number(updates.calories)) : dailyLog.exerciseEntries[index].calories,
      duration: updates.duration !== undefined ? Math.max(0, Number(updates.duration)) : dailyLog.exerciseEntries[index].duration,
    };

    this.saveDailyLog(dailyLog);
  },

  deleteExerciseEntry(date: string, entryId: string): void {
    const dailyLog = this.getDailyLog(date);
    dailyLog.exerciseEntries = dailyLog.exerciseEntries.filter((e) => e.id !== entryId);
    this.saveDailyLog(dailyLog);
  },

  // ----------------------------------------------------
  // MEASUREMENTS & TRACKING
  // ----------------------------------------------------
  getMeasurements(): MeasurementRecord[] {
    const state = this.get();
    if (!state?.measurements) return [];
    return (Object.values(state.measurements) as MeasurementRecord[]).sort((a, b) => a.date.localeCompare(b.date));
  },

  saveDailyMeasurement(
    date: string, 
    data: { weight?: number; waist?: number; bodyFat?: number; steps?: number; notes?: string }
  ): void {
    const state = this.get() || this.createInitialState();
    if (!state.measurements) state.measurements = {};
    if (!state.dailyLogs) state.dailyLogs = {};

    const id = `meas_${date}`;
    const measurement: MeasurementRecord = {
      id,
      date,
      weight: data.weight !== undefined && data.weight > 0 ? Number(data.weight) : undefined,
      waist: data.waist !== undefined && data.waist > 0 ? Number(data.waist) : undefined,
      bodyFat: data.bodyFat !== undefined && data.bodyFat > 0 ? Number(data.bodyFat) : undefined,
      steps: data.steps !== undefined && data.steps >= 0 ? Number(data.steps) : undefined,
      notes: data.notes,
      loggedAt: new Date().toISOString(),
    };

    state.measurements[id] = measurement;

    // Update DailyLog
    const dailyLog = this.getDailyLog(date);
    if (measurement.weight !== undefined) dailyLog.weight = measurement.weight;
    if (measurement.waist !== undefined) dailyLog.waist = measurement.waist;
    if (measurement.bodyFat !== undefined) dailyLog.bodyFat = measurement.bodyFat;
    if (measurement.steps !== undefined) dailyLog.steps = measurement.steps;
    if (measurement.notes) dailyLog.notes = measurement.notes;
    state.dailyLogs[date] = dailyLog;

    // Update DayRecord
    if (!state.records[date]) {
      state.records[date] = {
        date,
        checklist: { ...defaultChecklist },
        completionRate: 0,
      };
    }
    if (measurement.weight !== undefined) state.records[date].weight = measurement.weight;
    if (measurement.waist !== undefined) state.records[date].waist = measurement.waist;
    if (measurement.bodyFat !== undefined) state.records[date].bodyFat = measurement.bodyFat;
    if (measurement.steps !== undefined) state.records[date].steps = measurement.steps;

    // Update current profile weight/waist/bodyFat if it's the latest measurement
    if (state.profile) {
      if (measurement.weight !== undefined) state.profile.currentWeight = measurement.weight;
      if (measurement.waist !== undefined) state.profile.currentWaist = measurement.waist;
      if (measurement.bodyFat !== undefined) state.profile.currentBodyFat = measurement.bodyFat;
    }

    this.save(state);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveMeasurement(userId, measurement).catch((e) => {
        console.error('Error syncing measurement to Firebase:', e);
      });
      if (state.profile) {
        firestoreService.saveProfile(userId, state.profile).catch(console.error);
      }
    }
  },

  // ----------------------------------------------------
  // DAILY TOTALS & STATS
  // ----------------------------------------------------
  getDailySummary(date: string) {
    const state = this.get();
    const dailyLog = this.getDailyLog(date);
    const profile = state?.profile;

    const targetCalories = profile?.targetCalories || DEFAULT_TARGETS.calories;
    const targetProtein = profile?.targetProtein || DEFAULT_TARGETS.protein;
    const targetFats = profile?.targetFats || DEFAULT_TARGETS.fats;
    const targetCarbs = profile?.targetCarbs || calculateRemainingCarbs(targetCalories, targetProtein, targetFats);
    const targetSteps = profile?.targetSteps || DEFAULT_TARGETS.steps;

    const nutrition = calculateDailyNutritionTotals(dailyLog.foodEntries);

    const exerciseCalories = dailyLog.exerciseEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
    const exerciseDuration = dailyLog.exerciseEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const exerciseSessions = dailyLog.exerciseEntries.length;

    const steps = dailyLog.steps || state?.records?.[date]?.steps || 0;

    return {
      date,
      // Nutrition
      consumedCalories: nutrition.calories,
      targetCalories,
      remainingCalories: Math.max(0, targetCalories - nutrition.calories),
      consumedProtein: nutrition.protein,
      targetProtein,
      consumedCarbs: nutrition.carbs,
      targetCarbs,
      consumedFats: nutrition.fats,
      targetFats,
      // Activity
      steps,
      targetSteps,
      exerciseSessions,
      exerciseCalories,
      exerciseDuration,
      // Measurements
      weight: dailyLog.weight || state?.records?.[date]?.weight,
      waist: dailyLog.waist || state?.records?.[date]?.waist,
      bodyFat: dailyLog.bodyFat || state?.records?.[date]?.bodyFat,
    };
  },

  // ----------------------------------------------------
  // GYM ROUTINE & WORKOUT SESSIONS
  // ----------------------------------------------------
  getGymRoutine(): GymRoutine {
    const state = this.get();
    return state?.gymRoutine || {};
  },

  saveWorkoutForDay(day: string, workout: WorkoutSession): void {
    const state = this.get() || this.createInitialState();
    state.gymRoutine[day] = workout;
    this.save(state);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveGymRoutine(userId, state.gymRoutine).catch((error) => {
        console.error('Failed to sync gym routine with Firebase:', error);
      });
    }
  },

  getWorkoutHistory(date: string): WorkoutSession | undefined {
    const state = this.get();
    return state?.workoutHistory?.[date];
  },

  saveWorkoutHistory(date: string, workout: WorkoutSession): void {
    const state = this.get() || this.createInitialState();
    state.workoutHistory[date] = { ...workout, date, completed: true };
    this.save(state);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveWorkoutHistory(userId, state.workoutHistory).catch((error) => {
        console.error('Failed to sync workout history with Firebase:', error);
      });
    }
  },

  saveWorkoutHistoryForDate(date: string, workout: WorkoutSession): void {
    this.saveWorkoutHistory(date, workout);
  },

  getWorkoutForDay(day: string): WorkoutSession | null {
    const routine = this.getGymRoutine();
    return routine[day] || null;
  },

  // ----------------------------------------------------
  // DAILY CHECKLIST & STREAKS
  // ----------------------------------------------------
  recordDay(date: string, checklist: DailyChecklist, completionRate: number, weight?: number, notes?: string): void {
    const state = this.get() || this.createInitialState();

    const dayRecord: DayRecord = {
      date,
      checklist,
      weight,
      notes,
      completionRate,
    };

    state.records[date] = dayRecord;
    this.updateStreaks(state);
    this.save(state);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveDailyRecords(userId, state.records).catch(console.error);
    }
  },

  getRecord(date: string): DayRecord | undefined {
    const state = this.get();
    return state?.records[date];
  },

  getCurrentStreak(): number {
    const state = this.get();
    return state?.currentStreak || 0;
  },

  getLongestStreak(): number {
    const state = this.get();
    return state?.longestStreak || 0;
  },

  getDaysCompleted(): number {
    const state = this.get();
    if (!state) return 0;
    return (Object.values(state.records) as DayRecord[]).filter((record) => record.completionRate === 100).length;
  },

  getDaysRemaining(): number {
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
    const today = getTodayDateString();

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
    const state = this.get() || this.createInitialState();
    const today = getTodayDateString();

    const completionRate = this.calculateCompletionRate(checklist);

    state.records[today] = {
      date: today,
      checklist,
      completionRate,
    };

    this.updateStreaks(state);
    this.save(state);

    const userId = auth.currentUser?.uid;
    if (userId) {
      firestoreService.saveDailyRecords(userId, state.records).catch(console.error);
    }
  },

  updateTodayWeight(weight: number): void {
    const state = this.get();
    if (!state) return;

    const today = getTodayDateString();
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

    const today = getTodayDateString();

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

  createInitialState(): AppState {
    const initialState: AppState = {
      profile: { ...DEFAULT_USER_PROFILE },
      records: {},
      currentStreak: 0,
      longestStreak: 0,
      mealPlans: {},
      gymRoutine: {},
      workoutHistory: {},
      foods: {},
      recipes: {},
      exercises: {},
      dailyLogs: {},
      measurements: {},
    };
    seedMasterLibraries(initialState);
    return initialState;
  },
};

export const storage = storageWithFirebase;
