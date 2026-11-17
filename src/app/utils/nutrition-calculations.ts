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
 * Uses MET (Metabolic Equivalent of Task) values.
 * Formula: Calorie burn = MET * Weight in kg * (Duration in minutes / 60)
 * 
 * If user weight is unavailable, assumes a standard reference weight of 75kg.
 */
export type ExerciseIntensity = 'low' | 'moderate' | 'high';

export const ACTIVITY_METS: Record<string, Record<ExerciseIntensity, number>> = {
  walking: { low: 2.8, moderate: 3.8, high: 4.8 },
  running: { low: 7.0, moderate: 9.8, high: 12.0 },
  cycling: { low: 4.0, moderate: 6.8, high: 9.0 },
  treadmill: { low: 3.5, moderate: 5.5, high: 8.0 },
  weight_training: { low: 3.5, moderate: 5.0, high: 6.5 },
  swimming: { low: 5.0, moderate: 7.0, high: 9.5 },
  yoga: { low: 2.0, moderate: 3.0, high: 4.0 },
  hiit: { low: 6.0, moderate: 8.5, high: 11.0 },
  calisthenics: { low: 3.5, moderate: 5.0, high: 7.0 },
  boxing: { low: 5.5, moderate: 8.0, high: 10.5 },
  other: { low: 3.0, moderate: 5.0, high: 7.0 },
};

export function estimateExerciseCalories(
  activityName: string,
  durationMinutes: number,
  intensity: ExerciseIntensity = 'moderate',
  userWeightKg: number = 75
): number {
  const safeDuration = Math.max(0, durationMinutes || 0);
  const safeWeight = Math.max(30, userWeightKg || 75);

  const normalized = activityName.toLowerCase().replace(/[^a-z]/g, '_');
  
  let matchedKey = 'other';
  for (const key of Object.keys(ACTIVITY_METS)) {
    if (normalized.includes(key)) {
      matchedKey = key;
      break;
    }
  }

  const met = ACTIVITY_METS[matchedKey]?.[intensity] || 4.5;
  const hours = safeDuration / 60;
  const burn = met * safeWeight * hours;

  return Math.round(burn);
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
  return entries.reduce(
    (acc, entry) => ({
      calories: round(acc.calories + (Number(entry.calories) || 0), 1),
      protein: round(acc.protein + (Number(entry.protein) || 0), 1),
      carbs: round(acc.carbs + (Number(entry.carbs) || 0), 1),
      fats: round(acc.fats + (Number(entry.fats) || 0), 1),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
}
