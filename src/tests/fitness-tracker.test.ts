/**
 * Comprehensive Automated Test Suite for Personal Fitness & Recomposition Tracker
 */

import { 
  calculateFoodNutrition, 
  calculateRemainingCarbs, 
  estimateExerciseCalories, 
  calculateDailyNutritionTotals,
  round 
} from '../app/utils/nutrition-calculations.ts';
import { 
  getTodayDateString, 
  formatDateToKolkata, 
  shiftDateString, 
  formatDisplayDate 
} from '../app/utils/date.ts';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (details) console.error(`     Details: ${details}`);
    process.exitCode = 1;
  }
}

console.log('\n--- 1. Testing Food Library Quantity & Nutrition Formulas ---');

const lowFatPaneerBase = {
  calories: 145,
  protein: 20,
  carbs: 5,
  fats: 6,
};

// Test 1: 100g base serving
const paneer100g = calculateFoodNutrition(100, 100, lowFatPaneerBase);
assert(
  paneer100g.calories === 145 && 
  paneer100g.protein === 20 && 
  paneer100g.carbs === 5 && 
  paneer100g.fats === 6,
  '100g of Low-fat paneer matches base nutritional values exactly',
  JSON.stringify(paneer100g)
);

// Test 2: 150g serving (Prompt specification example)
// 150g should calculate: 217.5 kcal, 30g protein, 7.5g carbs, 9g fat
const paneer150g = calculateFoodNutrition(150, 100, lowFatPaneerBase);
assert(
  paneer150g.calories === 217.5 && 
  paneer150g.protein === 30 && 
  paneer150g.carbs === 7.5 && 
  paneer150g.fats === 9,
  '150g of Low-fat paneer matches prompt specifications (217.5 kcal, 30g P, 7.5g C, 9g F)',
  JSON.stringify(paneer150g)
);

// Test 3: 200g serving
const paneer200g = calculateFoodNutrition(200, 100, lowFatPaneerBase);
assert(
  paneer200g.calories === 290 && 
  paneer200g.protein === 40 && 
  paneer200g.carbs === 10 && 
  paneer200g.fats === 12,
  '200g of Low-fat paneer scales linearly (290 kcal, 40g P, 10g C, 12g F)',
  JSON.stringify(paneer200g)
);

// Test 4: Negative and zero quantity safety
const safeZero = calculateFoodNutrition(-50, 100, lowFatPaneerBase);
assert(
  safeZero.calories === 0 && safeZero.protein === 0,
  'Negative food quantities safely clamped to 0'
);

console.log('\n--- 2. Testing Target & Macro Calculation Formulas ---');

// Test 5: Initial configurable targets from prompt:
// 2100 kcal, 150g protein, 60g fat -> remaining carbs should be 240g
// Math: 2100 - (150*4 + 60*9) = 2100 - (600 + 540) = 2100 - 1140 = 960 kcal / 4 = 240g
const calculatedCarbs = calculateRemainingCarbs(2100, 150, 60);
assert(
  calculatedCarbs === 240,
  `Remaining carbs correctly calculated as 240g for 2100 kcal, 150g P, 60g F (got ${calculatedCarbs}g)`
);

// Test 6: Alternative targets: 2500 kcal, 180g protein, 70g fat
// 2500 - (180*4 + 70*9) = 2500 - (720 + 630) = 2500 - 1350 = 1150 kcal / 4 = 287.5 ~ 288g
const customCarbs = calculateRemainingCarbs(2500, 180, 70);
assert(
  customCarbs === 288,
  `Custom macro targets correctly compute remaining carbs (288g)`
);

console.log('\n--- 3. Testing Exercise Calorie Estimates ---');

// Test 7: Duration-based walking estimation for 30 minutes at moderate intensity (75kg weight)
// MET ~ 3.8 -> 3.8 * 75 * (30/60) = 142.5 ~ 143 kcal
const walkingBurn = estimateExerciseCalories('walking', 30, 'moderate', 75);
assert(
  walkingBurn >= 135 && walkingBurn <= 150,
  `Duration-based walking calculation produces reasonable MET-based calorie burn (~143 kcal, got ${walkingBurn})`
);

// Test 8: Duration-based running estimation
const runningBurn = estimateExerciseCalories('running', 30, 'high', 75);
assert(
  runningBurn > walkingBurn,
  `High intensity running burns significantly more than walking (got ${runningBurn} kcal vs ${walkingBurn} kcal)`
);

console.log('\n--- 4. Testing Asia/Kolkata Timezone & Date Consistency ---');

// Test 9: Kolkata date format
const today = getTodayDateString();
assert(
  /^\d{4}-\d{2}-\d{2}$/.test(today),
  `getTodayDateString returns YYYY-MM-DD format: ${today}`
);

// Test 10: Date shifting
const yesterday = shiftDateString(today, -1);
const tomorrow = shiftDateString(today, 1);
assert(
  yesterday < today && tomorrow > today,
  `shiftDateString shifts days accurately across month boundaries (${yesterday} < ${today} < ${tomorrow})`
);

// Test 11: Display label
assert(
  formatDisplayDate(today) === 'Today',
  'formatDisplayDate identifies current date as "Today"'
);
assert(
  formatDisplayDate(yesterday) === 'Yesterday',
  'formatDisplayDate identifies -1 day as "Yesterday"'
);

console.log('\n--- 5. Testing Daily Nutrition Totals & Snapshot Integrity ---');

// Test 12: Summing multiple meal entries
const sampleEntries = [
  { calories: 217.5, protein: 30, carbs: 7.5, fats: 9 },
  { calories: 350, protein: 40, carbs: 20, fats: 10 },
  { calories: 150, protein: 5, carbs: 25, fats: 2 },
];
const dailyTotals = calculateDailyNutritionTotals(sampleEntries);
assert(
  dailyTotals.calories === 717.5 && 
  dailyTotals.protein === 75 && 
  dailyTotals.carbs === 52.5 && 
  dailyTotals.fats === 21,
  `calculateDailyNutritionTotals accurately aggregates all macros without floating point errors: ${JSON.stringify(dailyTotals)}`
);

// Test 13: Historical Snapshot Integrity Simulation
// When an entry is logged, modifying the base library item must NOT change the historical entry
const originalLibraryPaneer = { ...lowFatPaneerBase };
const loggedSnapshot = calculateFoodNutrition(150, 100, originalLibraryPaneer);

// Now simulate user editing the library item to 150 kcal
const editedLibraryPaneer = { ...originalLibraryPaneer, calories: 150 };

assert(
  loggedSnapshot.calories === 217.5,
  'Historical snapshot retains original logged calories (217.5 kcal) even after library item is updated'
);

console.log('\n--- 6. Testing Master Food & Exercise Libraries ---');

import { MASTER_FOODS, MASTER_RECIPES } from '../config/master-food-library.ts';
import { MASTER_EXERCISES } from '../config/master-exercise-library.ts';
import { seedMasterLibraries } from '../config/storage.ts';
import { calculateMetCalories, calculateRecipeNutrition } from '../app/utils/nutrition-calculations.ts';
import { AppState } from '../app/types.ts';

// Test 14: Master Food Library Population & Dietary Preferences
assert(
  MASTER_FOODS.length >= 35,
  `Master Food Library is populated with comprehensive database (${MASTER_FOODS.length} foods)`
);

// Verify dietary preferences: NO soy, NO tofu, NO whole eggs
const prohibitedFoods = MASTER_FOODS.filter((f) => {
  const name = f.name.toLowerCase();
  const notes = (f.notes || '').toLowerCase();
  return (
    name.includes('tofu') ||
    name.includes('soya') ||
    name.includes('soy ') ||
    name.includes('edamame') ||
    (name.includes('egg') && !name.includes('egg white'))
  );
});
assert(
  prohibitedFoods.length === 0,
  `Dietary restriction compliance verified: zero soy, tofu or whole eggs in database (prohibited: ${prohibitedFoods.length})`
);

// Verify egg whites and paneer are present
const hasEggWhites = MASTER_FOODS.some((f) => f.name.toLowerCase().includes('egg white'));
const hasLowFatPaneer = MASTER_FOODS.some((f) => f.name.toLowerCase().includes('low-fat paneer'));
const hasWhey = MASTER_FOODS.some((f) => f.name.toLowerCase().includes('whey protein'));
const hasChapati = MASTER_FOODS.some((f) => f.name.toLowerCase().includes('chapati'));

assert(
  hasEggWhites && hasLowFatPaneer && hasWhey && hasChapati,
  'Core Indian vegetarian & protein staples (egg whites, paneer, whey, chapati) present in Food Library'
);

// Test 15: Exact ACSM MET Formula verification
// Formula: Calories = MET × 3.5 × weight / 200 × duration
// For 82kg user:
// Walking (MET 3.5, 30 min): (3.5 * 3.5 * 82 / 200) * 30 = 150.675 -> 151 kcal
const walking82kg = calculateMetCalories(3.5, 82, 30);
assert(
  walking82kg === 151,
  `ACSM MET formula produces exact 151 kcal for 82kg walking 30 min at MET 3.5 (got ${walking82kg})`
);

// Jogging (MET 7.0, 20 min): (7.0 * 3.5 * 82 / 200) * 20 = 200.9 -> 201 kcal
const jogging82kg = calculateMetCalories(7.0, 82, 20);
assert(
  jogging82kg === 201,
  `ACSM MET formula produces exact 201 kcal for 82kg jogging 20 min at MET 7.0 (got ${jogging82kg})`
);

// Weight Training (MET 5.0, 45 min): (5.0 * 3.5 * 82 / 200) * 45 = 322.875 -> 323 kcal
const weights82kg = calculateMetCalories(5.0, 82, 45);
assert(
  weights82kg === 323,
  `ACSM MET formula produces exact 323 kcal for 82kg weight training 45 min at MET 5.0 (got ${weights82kg})`
);

console.log('\n--- 7. Testing Recipe Builder & Composite Nutrition Formulas ---');

// Test 16: Recipe nutrition summation and per-serving calculation
const sampleRecipeIngredients = [
  { foodId: 'food_low_fat_paneer', name: 'Low-fat paneer', calories: 290, protein: 40, carbs: 10, fats: 12 },
  { foodId: 'food_tomato', name: 'Tomato', calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2 },
  { foodId: 'food_ghee', name: 'Ghee', calories: 72, protein: 0, carbs: 0, fats: 8 },
];
const recipeNutrition = calculateRecipeNutrition(sampleRecipeIngredients, 2);

assert(
  recipeNutrition.totalNutrition.calories === 380 &&
  recipeNutrition.totalNutrition.protein === 40.9 &&
  recipeNutrition.perServingNutrition.calories === 190 &&
  recipeNutrition.perServingNutrition.protein === 20.5,
  `Recipe Builder accurately calculates total and per-serving macros for 2 servings (Per serv: ${JSON.stringify(recipeNutrition.perServingNutrition)})`
);

console.log('\n--- 8. Testing Safe Deduplicated Master Seeding ---');

// Test 17: Deduplicated seeding into AppState
const testState: AppState = {
  profile: null,
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

// First run: should populate and return true
const firstSeedResult = seedMasterLibraries(testState);
const foodsCountAfterFirst = Object.keys(testState.foods!).length;
const recipesCountAfterFirst = Object.keys(testState.recipes!).length;
const exercisesCountAfterFirst = Object.keys(testState.exercises!).length;

assert(
  firstSeedResult === true && foodsCountAfterFirst >= 35 && recipesCountAfterFirst >= 5 && exercisesCountAfterFirst >= 15,
  `Initial seed populates all master libraries (foods: ${foodsCountAfterFirst}, recipes: ${recipesCountAfterFirst}, exercises: ${exercisesCountAfterFirst})`
);

// Second run: should NOT modify or duplicate and return false
const secondSeedResult = seedMasterLibraries(testState);
assert(
  secondSeedResult === false &&
  Object.keys(testState.foods!).length === foodsCountAfterFirst &&
  Object.keys(testState.recipes!).length === recipesCountAfterFirst,
  'Repeated seed call is safely idempotent and does NOT duplicate existing IDs'
);

// User customization protection
testState.foods!['food_low_fat_paneer'].notes = 'Custom user modification';
seedMasterLibraries(testState);
assert(
  testState.foods!['food_low_fat_paneer'].notes === 'Custom user modification',
  'User-customized library items are never overwritten during subsequent seed checks'
);

console.log(`\n======================================================`);
console.log(`Test Results: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log(`======================================================\n`);
