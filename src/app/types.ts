export interface UserProfile {
  name: string;                 // User's name
  startWeight: number;
  currentWeight: number;
  goalWeight: number;
  startDate: string;
  targetSteps: number;
  targetProtein: number;
  targetWater: number;
  wakeUpTime: string;
  // Enhanced configurable fitness & body-recomp targets
  height?: number;              // cm (default 168)
  age?: number;                 // years (default 23)
  targetCalories?: number;      // default 2,100 kcal
  targetFats?: number;          // default 60 g
  targetCarbs?: number;         // default 240 g (or calculated)
  currentWaist?: number;        // cm
  goalWaist?: number;           // cm
  currentBodyFat?: number;      // % (default 30%)
}

export interface DailyChecklist {
  wakeUpOnTime: boolean;
  fastedCardio: boolean;
  gymWorkout: boolean;
  proteinTarget: boolean;
  stepsGoal: boolean;
  waterIntake: boolean;
  noCheatMeals: boolean;
  sleepOnTime: boolean;
}

export interface DayRecord {
  date: string;
  checklist: DailyChecklist;
  weight?: number;
  waist?: number;
  bodyFat?: number;
  steps?: number;
  notes?: string;
  completionRate: number;
}

export type MealCategory = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

export type FoodCategory = 
  | 'Protein'
  | 'Dairy'
  | 'Carbohydrates'
  | 'Fruits'
  | 'Vegetables'
  | 'Fats & Oils'
  | 'Indian Meals'
  | 'Snacks'
  | 'Supplements'
  | 'Meat & Poultry'
  | 'Fish & Seafood'
  | 'Grains & Cereals'
  | 'Legumes & Pulses'
  | 'Beverages'
  | 'Other';

export interface FoodLibraryItem {
  id: string;
  name: string;
  category: FoodCategory;
  servingSize: number;
  servingUnit: string;        // 'g', 'ml', 'serving', 'piece', 'scoop', 'tsp', etc.
  calories: number;           // per servingSize
  protein: number;            // per servingSize
  carbs: number;              // per servingSize
  fats: number;               // per servingSize
  notes?: string;
  isFavorite?: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export interface RecipeIngredient {
  foodId?: string;
  name: string;
  quantity: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: 'Indian Meals' | FoodCategory;
  servings: number;
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  perServingNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  ingredients: RecipeIngredient[];
  notes?: string;
  isFavorite?: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export interface FoodDiaryEntry {
  id: string;
  foodId?: string;            // Link to library item or recipe if created from library
  recipeId?: string;          // Link to recipe if logged from recipe builder
  name: string;
  mealCategory: MealCategory;
  quantity: number;
  servingUnit: string;
  baseServingSize: number;
  // Snapshots of nutrition at time of logging (historical integrity)
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  notes?: string;
  time?: string;
  loggedAt: string;
  date: string;               // YYYY-MM-DD in Asia/Kolkata
}

export type ExerciseType = 'fixed' | 'duration';
export type ExerciseIntensity = 'low' | 'moderate' | 'high';
export type ExerciseCategory = 
  | 'Strength Training'
  | 'Cardio'
  | 'Walking'
  | 'Daily Activities'
  | 'Core Training'
  | 'Sports & Recreation'
  | 'Strength'
  | 'Other';

export interface ExerciseLibraryItem {
  id: string;
  name: string;
  type: ExerciseType;
  category?: ExerciseCategory | string;
  defaultCalories?: number;   // For fixed calorie estimate
  defaultDuration?: number;   // Duration in minutes
  defaultIntensity?: ExerciseIntensity;
  met?: number;               // MET (Metabolic Equivalent of Task) value
  notes?: string;
  isFavorite?: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export interface ExerciseDiaryEntry {
  id: string;
  exerciseId?: string;
  name: string;
  type: ExerciseType;
  duration?: number;          // minutes
  intensity?: ExerciseIntensity;
  met?: number;               // MET value used for calculation
  calories: number;           // Estimated calories snapshot
  calculationMethod?: 'fixed' | 'duration';
  time?: string;
  date: string;               // YYYY-MM-DD
  loggedAt: string;
  notes?: string;
}

export interface MeasurementRecord {
  id: string;
  date: string;               // YYYY-MM-DD
  weight?: number;            // kg
  waist?: number;             // cm
  bodyFat?: number;           // %
  steps?: number;
  notes?: string;
  loggedAt: string;
}

// Backwards-compatible Meal interface
export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  time: string;
  category?: MealCategory;
  quantity?: number;
  servingUnit?: string;
}

export interface DailyMealPlan {
  date: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

export interface WorkoutSet {
  setNumber: number;
  weight: number;             // kg
  reps: number;
  restTimeSeconds?: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: number;
  notes?: string;
  restTime?: number;          // Rest time in seconds
  detailedSets?: WorkoutSet[];
  previousBest?: {
    weight: number;
    reps: number;
    date: string;
  };
}

export interface WorkoutSession {
  id: string;
  name: string;
  exercises: Exercise[];
  duration?: number;
  completed?: boolean;
  date?: string;
}

export interface GymRoutine {
  [day: string]: WorkoutSession; // e.g., "Monday", "Tuesday"
}

export interface DailyLog {
  date: string;
  foodEntries: FoodDiaryEntry[];
  exerciseEntries: ExerciseDiaryEntry[];
  steps?: number;
  water?: number;
  weight?: number;
  waist?: number;
  bodyFat?: number;
  notes?: string;
  updatedAt?: string;
}

export interface AppState {
  profile: UserProfile | null;
  records: Record<string, DayRecord>;
  currentStreak: number;
  longestStreak: number;
  mealPlans: Record<string, DailyMealPlan>; // date -> meal plan
  gymRoutine: GymRoutine;
  workoutHistory: Record<string, WorkoutSession>; // date -> completed workout
  
  // Enhanced data stores
  foods?: Record<string, FoodLibraryItem>;
  recipes?: Record<string, Recipe>;
  exercises?: Record<string, ExerciseLibraryItem>;
  dailyLogs?: Record<string, DailyLog>;
  measurements?: Record<string, MeasurementRecord>;
}
