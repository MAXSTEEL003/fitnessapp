/**
 * Reusable Nutrition and Fitness Calculation Utilities
 */

export interface NutritionValues {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

/**
 * Rounds a number to a specified number of decimal places (default 1 decimal).
 * Prevents floating point errors like 217.50000000000003.
 */
export function round(value: number, decimals: number = 1): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculates nutritional values for a given quantity of food based on its base serving.
 * Formula: Quantity / Serving size * Nutritional value
 */
export function calculateFoodNutrition(
  quantity: number,
  servingSize: number,
  baseNutrition: NutritionValues
): NutritionValues {
  const safeQty = Math.max(0, Number(quantity) || 0);
  const safeServing = Math.max(0.0001, Number(servingSize) || 1);

  const ratio = safeQty / safeServing;

  return {
    calories: round(Math.max(0, (baseNutrition.calories || 0) * ratio), 1),
    protein: round(Math.max(0, (baseNutrition.protein || 0) * ratio), 1),
    carbs: round(Math.max(0, (baseNutrition.carbs || 0) * ratio), 1),
    fats: round(Math.max(0, (baseNutrition.fats || 0) * ratio), 1),
  };
}

/**
 * Calculates remaining carbohydrates target in grams given total calorie target,
 * protein target (g) and fat target (g).
 * 
 * Protein = 4 kcal/g
 * Fat = 9 kcal/g
 * Carbohydrates = 4 kcal/g
 * 
 * Remaining kcal = Total calories - (Protein * 4 + Fat * 9)
 * Remaining carbs = Remaining kcal / 4
 */
export function calculateRemainingCarbs(
  targetCalories: number,
  targetProtein: number,
  targetFat: number
): number {
  const proteinKcal = (targetProtein || 0) * 4;
  const fatKcal = (targetFat || 0) * 9;
  const remainingKcal = Math.max(0, (targetCalories || 0) - (proteinKcal + fatKcal));
  return Math.round(remainingKcal / 4);
}

/**
 * Estimates exercise calorie expenditure based on duration, activity type, and intensity.
 * Uses the ACSM MET (Metabolic Equivalent of Task) formula:
 * Calories = MET × 3.5 × body weight in kg / 200 × duration in minutes
 * 
 * If user weight is unavailable, assumes user default profile weight of 82kg.
 */
export type ExerciseIntensity = 'low' | 'moderate' | 'high';

export interface MetActivityDefinition {
  name: string;
  met: number;
  category: string;
}

export const MET_TABLE: Record<string, MetActivityDefinition> = {
  walking_moderate: { name: 'Walking (moderate 4.8 km/h)', met: 3.5, category: 'Walking' },
  walking_brisk: { name: 'Walking (brisk 6 km/h)', met: 4.3, category: 'Walking' },
  walking_incline: { name: 'Incline walking', met: 5.3, category: 'Walking' },
  walking_casual: { name: 'Casual walking', met: 2.8, category: 'Walking' },
  jogging: { name: 'Jogging', met: 7.0, category: 'Cardio' },
  running: { name: 'Running', met: 9.8, category: 'Cardio' },
  cycling_moderate: { name: 'Cycling (moderate)', met: 6.8, category: 'Cardio' },
  weight_training: { name: 'Weight training', met: 5.0, category: 'Strength Training' },
  calisthenics: { name: 'Calisthenics', met: 4.0, category: 'Strength Training' },
  stair_climbing: { name: 'Stair climbing', met: 8.0, category: 'Cardio' },
  rowing: { name: 'Rowing', met: 7.0, category: 'Cardio' },
  elliptical: { name: 'Elliptical', met: 5.0, category: 'Cardio' },
};

export const ACTIVITY_METS: Record<string, Record<ExerciseIntensity, number>> = {
  walking: { low: 2.8, moderate: 3.5, high: 4.3 },
  jogging: { low: 6.0, moderate: 7.0, high: 8.5 },
  running: { low: 8.0, moderate: 9.8, high: 12.0 },
  cycling: { low: 4.5, moderate: 6.8, high: 9.0 },
  treadmill: { low: 3.5, moderate: 5.3, high: 7.5 },
  weight_training: { low: 3.5, moderate: 5.0, high: 6.5 },
  swimming: { low: 5.0, moderate: 7.0, high: 9.5 },
  yoga: { low: 2.0, moderate: 3.0, high: 4.0 },
  hiit: { low: 6.0, moderate: 8.5, high: 11.0 },
  calisthenics: { low: 3.5, moderate: 4.0, high: 6.0 },
  stair_climber: { low: 6.0, moderate: 8.0, high: 10.0 },
  rowing: { low: 5.0, moderate: 7.0, high: 8.5 },
  elliptical: { low: 4.5, moderate: 5.0, high: 7.0 },
  other: { low: 3.0, moderate: 5.0, high: 7.0 },
};

/**
 * Exact MET formula calculation:
 * Calories = MET × 3.5 × weightKg / 200 × durationMinutes
 */
export function calculateMetCalories(
  met: number,
  weightKg: number = 82,
  durationMinutes: number = 30
): number {
  const safeMet = Math.max(0.1, Number(met) || 3.5);
  const safeWeight = Math.max(30, Number(weightKg) || 82);
  const safeDuration = Math.max(0, Number(durationMinutes) || 0);

  // Exact formula: MET * 3.5 * weightKg / 200 * durationMinutes
  const burn = (safeMet * 3.5 * safeWeight / 200) * safeDuration;
  return Math.round(burn);
}

export function estimateExerciseCalories(
  activityName: string,
  durationMinutes: number,
  intensity: ExerciseIntensity = 'moderate',
  userWeightKg: number = 82
): number {
  const safeDuration = Math.max(0, durationMinutes || 0);
  const safeWeight = Math.max(30, userWeightKg || 82);

  const normalized = activityName.toLowerCase().replace(/[^a-z]/g, '_');
  
  let matchedKey = 'other';
  for (const key of Object.keys(ACTIVITY_METS)) {
    if (normalized.includes(key)) {
      matchedKey = key;
      break;
    }
  }

  const met = ACTIVITY_METS[matchedKey]?.[intensity] || 4.5;
  return calculateMetCalories(met, safeWeight, safeDuration);
}

/**
 * Calculates recipe total nutrition and per-serving nutrition from ingredients.
 */
export function calculateRecipeNutrition(
  ingredients: Array<{
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
  }>,
  servings: number = 1
): {
  totalNutrition: NutritionValues;
  perServingNutrition: NutritionValues;
} {
  const safeServings = Math.max(0.1, Number(servings) || 1);
  const total = ingredients.reduce<NutritionValues>(
    (acc, ing) => ({
      calories: round(acc.calories + (Number(ing.calories) || 0), 1),
      protein: round(acc.protein + (Number(ing.protein) || 0), 1),
      carbs: round(acc.carbs + (Number(ing.carbs) || 0), 1),
      fats: round(acc.fats + (Number(ing.fats) || 0), 1),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const perServing: NutritionValues = {
    calories: round(total.calories / safeServings, 1),
    protein: round(total.protein / safeServings, 1),
    carbs: round(total.carbs / safeServings, 1),
    fats: round(total.fats / safeServings, 1),
  };

  return {
    totalNutrition: total,
    perServingNutrition: perServing,
  };
}

/**
 * Calculates daily totals from an array of food entries.
 */
export function calculateDailyNutritionTotals(entries: Array<{
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}>): NutritionValues {
  return entries.reduce<NutritionValues>(
    (acc, entry) => ({
      calories: round(acc.calories + (Number(entry.calories) || 0), 1),
      protein: round(acc.protein + (Number(entry.protein) || 0), 1),
      carbs: round(acc.carbs + (Number(entry.carbs) || 0), 1),
      fats: round(acc.fats + (Number(entry.fats) || 0), 1),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
}
