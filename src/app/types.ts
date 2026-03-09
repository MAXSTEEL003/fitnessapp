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
  notes?: string;
  completionRate: number;
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  time: string;
}

export interface DailyMealPlan {
  date: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: number;
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  name: string;
  exercises: Exercise[];
  duration?: number;
  completed?: boolean;
}

export interface GymRoutine {
  [day: string]: WorkoutSession; // e.g., "Monday", "Tuesday"
}

export interface AppState {
  profile: UserProfile | null;
  records: Record<string, DayRecord>;
  currentStreak: number;
  longestStreak: number;
  mealPlans: Record<string, DailyMealPlan>; // date -> meal plan
  gymRoutine: GymRoutine;
  workoutHistory: Record<string, WorkoutSession>; // date -> completed workout
}