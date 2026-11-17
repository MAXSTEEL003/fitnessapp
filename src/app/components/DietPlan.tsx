import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader, PageContainer } from "./ui/navigation";
import { Card, SectionHeader } from "./ui/cards";
import { Button } from "./ui/buttons";
import { InputField } from "./ui/forms";
import { storage } from "../../config/storage";
import { 
  FoodDiaryEntry, 
  MealCategory, 
  FoodCategory, 
  FoodLibraryItem 
} from "../types";
import { 
  getTodayDateString, 
  shiftDateString, 
  formatDisplayDate, 
  formatFullDisplayDate 
} from "../utils/date";
import { 
  calculateDailyNutritionTotals, 
  calculateFoodNutrition,
  round 
} from "../utils/nutrition-calculations";
import { FoodLibraryModal } from "./FoodLibraryModal";
import { 
  UtensilsCrossed, 
  Plus, 
  Trash2, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  BookOpen,
  Copy,
  Edit2,
  ArrowRightLeft,
  Check,
  X,
  Sparkles,
  BookmarkPlus
} from "lucide-react";

const MEAL_CATEGORIES: MealCategory[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export function DietPlan() {
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());
  const [dailyLog, setDailyLog] = useState(() => storage.getDailyLog(selectedDate));
  const [summary, setSummary] = useState(() => storage.getDailySummary(selectedDate));

  // Modals state
  const [showFoodLibrary, setShowFoodLibrary] = useState(false);
  const [libraryMealCategory, setLibraryMealCategory] = useState<MealCategory>('Lunch');

  // Quick Manual Add Modal
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [manualCategory, setManualCategory] = useState<MealCategory>('Lunch');
  const [manualForm, setManualForm] = useState({
    name: "",
    quantity: 1,
    servingUnit: "serving",
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    time: "12:00",
    saveToLibrary: false,
    libraryCategory: "Other" as FoodCategory,
  });

  // Edit Entry Modal
  const [editingEntry, setEditingEntry] = useState<FoodDiaryEntry | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    quantity: 1,
    servingUnit: "serving",
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    mealCategory: "Lunch" as MealCategory,
  });

  // Move Entry Modal
  const [movingEntry, setMovingEntry] = useState<FoodDiaryEntry | null>(null);

  const refreshData = () => {
    setDailyLog(storage.getDailyLog(selectedDate));
    setSummary(storage.getDailySummary(selectedDate));
  };

  useEffect(() => {
    refreshData();
  }, [selectedDate]);

  const changeDate = (days: number) => {
    const newDate = shiftDateString(selectedDate, days);
    setSelectedDate(newDate);
  };

  // ---------------- Quick Manual Add ----------------
  const handleOpenQuickAdd = (category: MealCategory = 'Lunch') => {
    setManualCategory(category);
    setManualForm({
      name: "",
      quantity: 1,
      servingUnit: "serving",
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      time: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()),
      saveToLibrary: false,
      libraryCategory: "Other",
    });
    setShowQuickAdd(true);
  };

  const handleSaveManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.name.trim()) return;

    let foodId: string | undefined = undefined;

    // Optional: Save to Reusable Food Library
    if (manualForm.saveToLibrary) {
      const newFood: FoodLibraryItem = {
        id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: manualForm.name.trim(),
        category: manualForm.libraryCategory,
        servingSize: Math.max(0.1, Number(manualForm.quantity) || 1),
        servingUnit: manualForm.servingUnit.trim() || 'serving',
        calories: Math.max(0, Number(manualForm.calories) || 0),
        protein: Math.max(0, Number(manualForm.protein) || 0),
        carbs: Math.max(0, Number(manualForm.carbs) || 0),
        fats: Math.max(0, Number(manualForm.fats) || 0),
        createdAt: new Date().toISOString(),
      };
      storage.saveFood(newFood);
      foodId = newFood.id;
    }

    storage.addFoodEntry(selectedDate, {
      foodId,
      name: manualForm.name.trim(),
      mealCategory: manualCategory,
      quantity: Math.max(0.1, Number(manualForm.quantity) || 1),
      servingUnit: manualForm.servingUnit.trim() || 'serving',
      baseServingSize: Math.max(0.1, Number(manualForm.quantity) || 1),
      calories: Math.max(0, Number(manualForm.calories) || 0),
      protein: Math.max(0, Number(manualForm.protein) || 0),
      carbs: Math.max(0, Number(manualForm.carbs) || 0),
      fats: Math.max(0, Number(manualForm.fats) || 0),
      time: manualForm.time,
    });

    setShowQuickAdd(false);
    refreshData();
  };

  // ---------------- Entry Actions ----------------
  const handleDeleteEntry = (entryId: string, name: string) => {
    if (confirm(`Remove "${name}" from today's food diary?`)) {
      storage.deleteFoodEntry(selectedDate, entryId);
      refreshData();
    }
  };

  const handleDuplicateEntry = (entryId: string) => {
    storage.duplicateFoodEntry(selectedDate, entryId);
    refreshData();
  };

  const handleOpenEdit = (entry: FoodDiaryEntry) => {
    setEditingEntry(entry);
    setEditForm({
      name: entry.name,
      quantity: entry.quantity,
      servingUnit: entry.servingUnit,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fats: entry.fats,
      mealCategory: entry.mealCategory,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    // If quantity changed and it's tied to a library food, adjust proportionally
    let updatedCalories = Number(editForm.calories);
    let updatedProtein = Number(editForm.protein);
    let updatedCarbs = Number(editForm.carbs);
    let updatedFats = Number(editForm.fats);

    if (editingEntry.recipeId && editForm.quantity !== editingEntry.quantity) {
      const recipe = storage.getRecipeById(editingEntry.recipeId);
      if (recipe) {
        const qty = Number(editForm.quantity) || 1;
        updatedCalories = round(recipe.perServingNutrition.calories * qty, 1);
        updatedProtein = round(recipe.perServingNutrition.protein * qty, 1);
        updatedCarbs = round(recipe.perServingNutrition.carbs * qty, 1);
        updatedFats = round(recipe.perServingNutrition.fats * qty, 1);
      }
    } else if (editingEntry.foodId && editingEntry.baseServingSize && editForm.quantity !== editingEntry.quantity) {
      const baseFood = storage.getFoodById(editingEntry.foodId);
      if (baseFood) {
        const recalc = calculateFoodNutrition(editForm.quantity, baseFood.servingSize, {
          calories: baseFood.calories,
          protein: baseFood.protein,
          carbs: baseFood.carbs,
          fats: baseFood.fats,
        });
        updatedCalories = recalc.calories;
        updatedProtein = recalc.protein;
        updatedCarbs = recalc.carbs;
        updatedFats = recalc.fats;
      }
    }

    storage.updateFoodEntry(selectedDate, editingEntry.id, {
      name: editForm.name.trim(),
      quantity: Math.max(0.1, Number(editForm.quantity) || 1),
      servingUnit: editForm.servingUnit,
      calories: updatedCalories,
      protein: updatedProtein,
      carbs: updatedCarbs,
      fats: updatedFats,
      mealCategory: editForm.mealCategory,
    });

    setEditingEntry(null);
    refreshData();
  };

  const handleMoveEntry = (targetCategory: MealCategory) => {
    if (!movingEntry) return;
    storage.moveFoodEntry(selectedDate, movingEntry.id, targetCategory);
    setMovingEntry(null);
    refreshData();
  };

  const openLibraryForCategory = (category: MealCategory) => {
    setLibraryMealCategory(category);
    setShowFoodLibrary(true);
  };

  const entries = dailyLog.foodEntries || [];
  const entriesByCategory = (cat: MealCategory) => entries.filter((e) => e.mealCategory === cat);

  return (
    <div className="min-h-screen">
      <PageContainer padding>
        <PageHeader 
          title="Food Diary" 
          subtitle="Track calories, macros, and meals"
          icon={UtensilsCrossed} 
          action={
            <Button
              onClick={() => {
                setLibraryMealCategory('Lunch');
                setShowFoodLibrary(true);
              }}
              icon={BookOpen}
              size="sm"
              variant="secondary"
              className="border border-white/20"
            >
              Food Library
            </Button>
          }
        />

        {/* Date Selector */}
        <Card delay={0.1} className="mt-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="size-6 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center mb-1">
                <Calendar className="size-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatDisplayDate(selectedDate)}
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFullDisplayDate(selectedDate)}
              </p>
              {selectedDate !== getTodayDateString() && (
                <button
                  onClick={() => setSelectedDate(getTodayDateString())}
                  className="mt-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Jump to Today
                </button>
              )}
            </div>

            <button
              onClick={() => changeDate(1)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="size-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </Card>

        {/* Daily Nutrition Totals & Target Comparison */}
        <Card delay={0.15} className="mt-4">
          <SectionHeader title="Daily Nutrition Summary" icon={Flame} />
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Calories Card */}
            <div className="bg-gradient-to-br from-red-500 to-orange-500 p-4 rounded-2xl text-white shadow-lg shadow-orange-500/20">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Calories</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 font-medium">
                  Goal: {summary.targetCalories}
                </span>
              </div>
              <div className="text-3xl font-extrabold">{summary.consumedCalories} <span className="text-sm font-normal">kcal</span></div>
              <div className="text-xs text-white/90 mt-1 font-medium">
                {summary.remainingCalories > 0
                  ? `${summary.remainingCalories} kcal remaining`
                  : `${Math.abs(summary.consumedCalories - summary.targetCalories)} kcal over target`}
              </div>
            </div>

            {/* Protein Card */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-500/20">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Protein</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 font-medium">
                  Goal: {summary.targetProtein}g
                </span>
              </div>
              <div className="text-3xl font-extrabold">{summary.consumedProtein} <span className="text-sm font-normal">g</span></div>
              <div className="text-xs text-white/90 mt-1 font-medium">
                {summary.consumedProtein >= summary.targetProtein
                  ? `Target hit! +${round(summary.consumedProtein - summary.targetProtein, 1)}g`
                  : `${round(summary.targetProtein - summary.consumedProtein, 1)}g remaining`}
              </div>
            </div>
          </div>

          {/* Carbs and Fats secondary grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-100/80 dark:bg-gray-800/60 p-3.5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Carbohydrates</span>
                <span>Goal: {summary.targetCarbs}g</span>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {summary.consumedCarbs}g
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (summary.consumedCarbs / (summary.targetCarbs || 1)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-100/80 dark:bg-gray-800/60 p-3.5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span className="font-semibold text-amber-600 dark:text-amber-400">Fats</span>
                <span>Goal: {summary.targetFats}g</span>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {summary.consumedFats}g
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (summary.consumedFats / (summary.targetFats || 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Food Diary - Grouped by Meal Categories */}
        <div className="space-y-5 mt-6">
          {MEAL_CATEGORIES.map((category) => {
            const mealEntries = entriesByCategory(category);
            const categoryTotals = calculateDailyNutritionTotals(mealEntries);

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl p-5 shadow-xl border border-white/40 dark:border-gray-800"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-800 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {category}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        {categoryTotals.calories} kcal
                      </span>
                    </h3>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      P: {categoryTotals.protein}g • C: {categoryTotals.carbs}g • F: {categoryTotals.fats}g
                    </div>
                  </div>

                  {/* Actions for this meal */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openLibraryForCategory(category)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 flex items-center gap-1"
                      title="Select from reusable food library"
                    >
                      <BookOpen className="size-3.5" />
                      Library
                    </button>
                    <button
                      onClick={() => handleOpenQuickAdd(category)}
                      className="p-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                      title="Quick manual entry"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Items in this category */}
                <div className="space-y-2.5">
                  {mealEntries.length === 0 ? (
                    <div className="text-center py-5 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                      <p className="text-xs text-gray-400">No {category.toLowerCase()} logged</p>
                      <div className="flex justify-center gap-2 mt-2">
                        <button
                          onClick={() => openLibraryForCategory(category)}
                          className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                        >
                          + From Library
                        </button>
                        <span className="text-xs text-gray-300">•</span>
                        <button
                          onClick={() => handleOpenQuickAdd(category)}
                          className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                        >
                          + Quick Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    mealEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-gray-50/80 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl p-3.5 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {entry.time && (
                                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                  <Clock className="size-3" />
                                  {entry.time}
                                </span>
                              )}
                              <h4 className="font-bold text-gray-900 dark:text-white text-base">
                                {entry.name}
                              </h4>
                              {entry.foodId && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                                  Saved Food
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                              <span>Portion:</span>
                              <span className="text-gray-900 dark:text-gray-200 font-bold">
                                {entry.quantity} {entry.servingUnit}
                              </span>
                            </div>

                            {/* Macro Badges */}
                            <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                              <div className="bg-red-50 dark:bg-red-900/20 py-1 px-1.5 rounded-lg">
                                <div className="text-[10px] text-red-600 font-medium">Cal</div>
                                <div className="font-bold text-red-700 dark:text-red-300">{entry.calories}</div>
                              </div>
                              <div className="bg-blue-50 dark:bg-blue-900/20 py-1 px-1.5 rounded-lg">
                                <div className="text-[10px] text-blue-600 font-medium">Protein</div>
                                <div className="font-bold text-blue-700 dark:text-blue-300">{entry.protein}g</div>
                              </div>
                              <div className="bg-emerald-50 dark:bg-emerald-900/20 py-1 px-1.5 rounded-lg">
                                <div className="text-[10px] text-emerald-600 font-medium">Carbs</div>
                                <div className="font-bold text-emerald-700 dark:text-emerald-300">{entry.carbs}g</div>
                              </div>
                              <div className="bg-amber-50 dark:bg-amber-900/20 py-1 px-1.5 rounded-lg">
                                <div className="text-[10px] text-amber-600 font-medium">Fat</div>
                                <div className="font-bold text-amber-700 dark:text-amber-300">{entry.fats}g</div>
                              </div>
                            </div>
                          </div>

                          {/* Action icons */}
                          <div className="flex flex-col gap-1 ml-3 pt-0.5">
                            <button
                              onClick={() => handleOpenEdit(entry)}
                              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit Portion or Entry"
                            >
                              <Edit2 className="size-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicateEntry(entry.id)}
                              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Duplicate Entry"
                            >
                              <Copy className="size-4" />
                            </button>
                            <button
                              onClick={() => setMovingEntry(entry)}
                              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-purple-600 transition-colors"
                              title="Move to another meal"
                            >
                              <ArrowRightLeft className="size-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id, entry.name)}
                              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete Entry"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ---------------- QUICK MANUAL ENTRY MODAL ---------------- */}
        <AnimatePresence>
          {showQuickAdd && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowQuickAdd(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden z-10 max-h-[88vh] flex flex-col"
              >
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-red-500/10">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-orange-500 text-white shadow-md">
                      <Plus className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Quick Manual Entry
                      </h3>
                      <p className="text-xs text-gray-500">
                        Log food directly without needing a library item
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowQuickAdd(false)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveManualAdd} className="p-5 space-y-4 overflow-y-auto">
                  <InputField
                    label="Food Name"
                    type="text"
                    placeholder="e.g. Scrambled eggs, Protein Shake"
                    value={manualForm.name}
                    onChange={(v) => setManualForm({ ...manualForm, name: v })}
                    required
                  />

                  {/* Meal Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Meal Category
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {MEAL_CATEGORIES.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setManualCategory(m)}
                          className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all ${
                            manualCategory === m
                              ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity and Unit */}
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Quantity"
                      type="number"
                      step="any"
                      value={manualForm.quantity}
                      onChange={(v) => setManualForm({ ...manualForm, quantity: Number(v) })}
                      required
                    />
                    <InputField
                      label="Unit"
                      type="text"
                      placeholder="g, ml, serving, scoop"
                      value={manualForm.servingUnit}
                      onChange={(v) => setManualForm({ ...manualForm, servingUnit: v })}
                      required
                    />
                  </div>

                  {/* Nutritional Values */}
                  <div className="bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
                      Nutritional Totals for this portion:
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <InputField
                        label="Calories (kcal)"
                        type="number"
                        step="0.1"
                        value={manualForm.calories || ""}
                        onChange={(v) => setManualForm({ ...manualForm, calories: Number(v) })}
                        required
                      />
                      <InputField
                        label="Protein (g)"
                        type="number"
                        step="0.1"
                        value={manualForm.protein || ""}
                        onChange={(v) => setManualForm({ ...manualForm, protein: Number(v) })}
                        required
                      />
                      <InputField
                        label="Carbohydrates (g)"
                        type="number"
                        step="0.1"
                        value={manualForm.carbs || ""}
                        onChange={(v) => setManualForm({ ...manualForm, carbs: Number(v) })}
                        required
                      />
                      <InputField
                        label="Fat (g)"
                        type="number"
                        step="0.1"
                        value={manualForm.fats || ""}
                        onChange={(v) => setManualForm({ ...manualForm, fats: Number(v) })}
                        required
                      />
                    </div>
                  </div>

                  {/* Save to Food Library Checkbox */}
                  <div className="pt-1 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-2xl border border-blue-200/50 dark:border-blue-800/50">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="saveManualToLib"
                        checked={manualForm.saveToLibrary}
                        onChange={(e) => setManualForm({ ...manualForm, saveToLibrary: e.target.checked })}
                        className="size-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="saveManualToLib" className="text-xs font-semibold text-blue-900 dark:text-blue-300 cursor-pointer flex items-center gap-1">
                        <BookmarkPlus className="size-4 text-blue-600" />
                        Save to Food Library for future reuse
                      </label>
                    </div>

                    {manualForm.saveToLibrary && (
                      <div className="mt-2.5 pt-2 border-t border-blue-200/40 dark:border-blue-800/40">
                        <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Library Category:
                        </label>
                        <select
                          value={manualForm.libraryCategory}
                          onChange={(e) => setManualForm({ ...manualForm, libraryCategory: e.target.value as FoodCategory })}
                          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 dark:text-white"
                        >
                          {(['Dairy', 'Meat & Poultry', 'Fish & Seafood', 'Grains & Cereals', 'Legumes & Pulses', 'Vegetables', 'Fruits', 'Supplements', 'Snacks', 'Beverages', 'Other'] as FoodCategory[]).map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" fullWidth onClick={() => setShowQuickAdd(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" fullWidth icon={Check}>
                      Add to Diary
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ---------------- EDIT ENTRY MODAL ---------------- */}
        <AnimatePresence>
          {editingEntry && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setEditingEntry(null)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden z-10"
              >
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Edit Food Entry
                  </h3>
                  <button
                    onClick={() => setEditingEntry(null)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
                  <InputField
                    label="Food Name"
                    type="text"
                    value={editForm.name}
                    onChange={(v) => setEditForm({ ...editForm, name: v })}
                    required
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Portion Quantity"
                      type="number"
                      step="any"
                      value={editForm.quantity}
                      onChange={(v) => setEditForm({ ...editForm, quantity: Number(v) })}
                      required
                    />
                    <InputField
                      label="Unit"
                      type="text"
                      value={editForm.servingUnit}
                      onChange={(v) => setEditForm({ ...editForm, servingUnit: v })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Calories (kcal)"
                      type="number"
                      step="0.1"
                      value={editForm.calories}
                      onChange={(v) => setEditForm({ ...editForm, calories: Number(v) })}
                      required
                    />
                    <InputField
                      label="Protein (g)"
                      type="number"
                      step="0.1"
                      value={editForm.protein}
                      onChange={(v) => setEditForm({ ...editForm, protein: Number(v) })}
                      required
                    />
                    <InputField
                      label="Carbs (g)"
                      type="number"
                      step="0.1"
                      value={editForm.carbs}
                      onChange={(v) => setEditForm({ ...editForm, carbs: Number(v) })}
                      required
                    />
                    <InputField
                      label="Fats (g)"
                      type="number"
                      step="0.1"
                      value={editForm.fats}
                      onChange={(v) => setEditForm({ ...editForm, fats: Number(v) })}
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" fullWidth onClick={() => setEditingEntry(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" fullWidth icon={Check}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ---------------- MOVE ENTRY MODAL ---------------- */}
        <AnimatePresence>
          {movingEntry && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setMovingEntry(null)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800 p-5 z-10 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Move "{movingEntry.name}"
                  </h3>
                  <button onClick={() => setMovingEntry(null)} className="text-gray-400">
                    <X className="size-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Select destination meal for this item:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {MEAL_CATEGORIES.map((m) => (
                    <button
                      key={m}
                      onClick={() => handleMoveEntry(m)}
                      disabled={m === movingEntry.mealCategory}
                      className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                        m === movingEntry.mealCategory
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 opacity-50 cursor-not-allowed"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Reusable Food Library Modal */}
        <FoodLibraryModal
          isOpen={showFoodLibrary}
          onClose={() => setShowFoodLibrary(false)}
          selectedDate={selectedDate}
          defaultMealCategory={libraryMealCategory}
          onFoodLogged={refreshData}
        />
      </PageContainer>
    </div>
  );
}
