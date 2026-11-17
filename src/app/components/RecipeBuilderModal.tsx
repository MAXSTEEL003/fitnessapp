import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Recipe, RecipeIngredient, FoodLibraryItem, MealCategory, FoodCategory } from "../types";
import { storage } from "../../config/storage";
import { calculateFoodNutrition, calculateRecipeNutrition, round } from "../utils/nutrition-calculations";
import { Button } from "./ui/buttons";
import { InputField } from "./ui/forms";
import { Card } from "./ui/cards";
import { 
  Plus, 
  Trash2, 
  UtensilsCrossed, 
  Sparkles, 
  Check, 
  X, 
  Search, 
  Flame, 
  Dumbbell, 
  Layers,
  ChefHat,
  BookmarkPlus,
  Scale
} from "lucide-react";

interface RecipeBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  recipeToEdit?: Recipe | null;
  onRecipeSaved?: (recipe: Recipe) => void;
  onRecipeLogged?: () => void;
}

export function RecipeBuilderModal({
  isOpen,
  onClose,
  selectedDate,
  recipeToEdit,
  onRecipeSaved,
  onRecipeLogged,
}: RecipeBuilderModalProps) {
  const [foods] = useState<FoodLibraryItem[]>(() => storage.getFoods());

  // Recipe basic info
  const [name, setName] = useState("");
  const [category, setCategory] = useState<FoodCategory>("Indian Meals");
  const [servings, setServings] = useState<number>(2);
  const [notes, setNotes] = useState("");
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  // Ingredient picker state
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [selectedFoodId, setSelectedFoodId] = useState<string>("");
  const [ingredientQty, setIngredientQty] = useState<number>(100);

  // Quick Log modal state after save
  const [showLogPrompt, setShowLogPrompt] = useState(false);
  const [savedRecipeForLog, setSavedRecipeForLog] = useState<Recipe | null>(null);
  const [logMealCategory, setLogMealCategory] = useState<MealCategory>("Lunch");
  const [logServings, setLogServings] = useState<number>(1);

  // Load recipeToEdit if provided
  useEffect(() => {
    if (recipeToEdit) {
      setName(recipeToEdit.name);
      setCategory(recipeToEdit.category);
      setServings(recipeToEdit.servings || 1);
      setNotes(recipeToEdit.notes || "");
      setIngredients(recipeToEdit.ingredients || []);
    } else {
      resetForm();
    }
  }, [recipeToEdit, isOpen]);

  const resetForm = () => {
    setName("");
    setCategory("Indian Meals");
    setServings(2);
    setNotes("");
    setIngredients([]);
    setSelectedFoodId("");
    setIngredientSearch("");
    setIngredientQty(100);
    setShowLogPrompt(false);
    setSavedRecipeForLog(null);
  };

  // Filter foods for picker
  const filteredFoods = useMemo(() => {
    if (!ingredientSearch.trim()) return foods.slice(0, 8);
    const q = ingredientSearch.toLowerCase();
    return foods
      .filter((f) => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q))
      .slice(0, 10);
  }, [foods, ingredientSearch]);

  const activeSelectedFood = useMemo(() => {
    return foods.find((f) => f.id === selectedFoodId);
  }, [foods, selectedFoodId]);

  // Preview nutrition for currently selected ingredient
  const currentIngredientPreview = useMemo(() => {
    if (!activeSelectedFood) return null;
    return calculateFoodNutrition(ingredientQty, activeSelectedFood.servingSize, {
      calories: activeSelectedFood.calories,
      protein: activeSelectedFood.protein,
      carbs: activeSelectedFood.carbs,
      fats: activeSelectedFood.fats,
    });
  }, [activeSelectedFood, ingredientQty]);

  // Calculate live total and per-serving nutrition
  const calculatedNutrition = useMemo(() => {
    return calculateRecipeNutrition(ingredients, servings);
  }, [ingredients, servings]);

  const handleAddIngredient = () => {
    if (!activeSelectedFood || ingredientQty <= 0) return;

    const nutrition = calculateFoodNutrition(ingredientQty, activeSelectedFood.servingSize, {
      calories: activeSelectedFood.calories,
      protein: activeSelectedFood.protein,
      carbs: activeSelectedFood.carbs,
      fats: activeSelectedFood.fats,
    });

    const newIng: RecipeIngredient = {
      foodId: activeSelectedFood.id,
      name: activeSelectedFood.name,
      quantity: ingredientQty,
      servingUnit: activeSelectedFood.servingUnit,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fats: nutrition.fats,
    };

    setIngredients((prev) => [...prev, newIng]);
    setSelectedFoodId("");
    setIngredientSearch("");
    setIngredientQty(100);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = (alsoPromptLog: boolean = false) => {
    if (!name.trim()) {
      alert("Please enter a recipe name.");
      return;
    }
    if (ingredients.length === 0) {
      alert("Please add at least one ingredient to the recipe.");
      return;
    }

    const recipe: Recipe = {
      id: recipeToEdit?.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      category,
      servings: Math.max(1, servings),
      totalNutrition: calculatedNutrition.totalNutrition,
      perServingNutrition: calculatedNutrition.perServingNutrition,
      ingredients,
      notes: notes.trim(),
      isFavorite: recipeToEdit?.isFavorite ?? true,
      createdAt: recipeToEdit?.createdAt || new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    };

    storage.saveRecipe(recipe);
    onRecipeSaved?.(recipe);

    if (alsoPromptLog) {
      setSavedRecipeForLog(recipe);
      setLogServings(1);
      setShowLogPrompt(true);
    } else {
      onClose();
      resetForm();
    }
  };

  const handleConfirmLog = () => {
    if (!savedRecipeForLog) return;

    storage.logRecipeToFoodDiary(
      savedRecipeForLog.id,
      logServings,
      logMealCategory,
      selectedDate
    );

    onRecipeLogged?.();
    setShowLogPrompt(false);
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {recipeToEdit ? "Edit Recipe" : "Recipe Builder & Indian Meals"}
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Custom Macro Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Combine raw ingredients from your Food Library to calculate precise serving nutrition
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-200">
          {showLogPrompt ? (
            /* Log immediately prompt view */
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
                <Check className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-300">Recipe Saved Successfully!</p>
                  <p className="text-xs text-emerald-400/80">
                    "{savedRecipeForLog?.name}" has been stored in your reusable Recipe Library.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <BookmarkPlus className="w-4 h-4 text-orange-400" />
                  Log to Food Diary for {selectedDate}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Meal Category</label>
                    <select
                      value={logMealCategory}
                      onChange={(e) => setLogMealCategory(e.target.value as MealCategory)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Snacks">Snacks</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Number of Servings</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={logServings}
                      onChange={(e) => setLogServings(Math.max(0.1, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {savedRecipeForLog && (
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/40 text-xs flex justify-between items-center text-slate-300">
                    <span>
                      Logging <strong className="text-white">{logServings}</strong> serving(s):
                    </span>
                    <span className="font-mono text-orange-400 font-semibold">
                      {round(savedRecipeForLog.perServingNutrition.calories * logServings, 0)} kcal •{" "}
                      {round(savedRecipeForLog.perServingNutrition.protein * logServings, 1)}g P
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button variant="secondary" onClick={() => { onClose(); resetForm(); }}>
                  Close without Logging
                </Button>
                <Button variant="primary" onClick={handleConfirmLog}>
                  <Check className="w-4 h-4 mr-1.5" />
                  Log to Diary
                </Button>
              </div>
            </div>
          ) : (
            /* Main Form View */
            <>
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                    Recipe / Indian Meal Name *
                  </label>
                  <InputField
                    placeholder="e.g. Paneer Bhurji with Ghee"
                    value={name}
                    onChange={(v) => setName(v)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                    Servings Produced *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={servings}
                    onChange={(e) => setServings(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Add Ingredient Section */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" />
                    Add Ingredient from Food Library
                  </span>
                  <span className="text-xs text-slate-400">
                    {foods.length} foods available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6 relative">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search food (paneer, dal, ghee, oats)..."
                        value={ingredientSearch}
                        onChange={(e) => setIngredientSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Quick suggestion dropdown */}
                    {ingredientSearch.trim() && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-800">
                        {filteredFoods.length === 0 ? (
                          <div className="p-2.5 text-xs text-slate-400 text-center">No foods match</div>
                        ) : (
                          filteredFoods.map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => {
                                setSelectedFoodId(f.id);
                                setIngredientSearch(f.name);
                              }}
                              className={`w-full text-left p-2.5 hover:bg-slate-800 text-xs transition-colors flex items-center justify-between ${
                                selectedFoodId === f.id ? "bg-amber-500/10 text-amber-300" : "text-slate-200"
                              }`}
                            >
                              <span className="font-medium">{f.name}</span>
                              <span className="text-[10px] text-slate-400">
                                {f.calories} kcal / {f.servingSize}{f.servingUnit}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-3">
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={ingredientQty}
                        onChange={(e) => setIngredientQty(Math.max(1, Number(e.target.value)))}
                        placeholder="Qty"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400">
                        {activeSelectedFood?.servingUnit || "g"}
                      </span>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddIngredient}
                      disabled={!activeSelectedFood}
                      className="w-full h-full text-xs font-semibold py-2"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Ingredient preview helper */}
                {activeSelectedFood && currentIngredientPreview && (
                  <div className="text-[11px] text-amber-300/90 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 flex items-center justify-between">
                    <span>Selected: <strong>{activeSelectedFood.name}</strong> ({ingredientQty}{activeSelectedFood.servingUnit})</span>
                    <span>
                      {currentIngredientPreview.calories} kcal • {currentIngredientPreview.protein}g P • {currentIngredientPreview.carbs}g C • {currentIngredientPreview.fats}g F
                    </span>
                  </div>
                )}
              </div>

              {/* Added Ingredients Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Recipe Ingredients ({ingredients.length})</span>
                  {ingredients.length > 0 && (
                    <span className="text-slate-400">Calories / Protein</span>
                  )}
                </div>

                {ingredients.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    No ingredients added yet. Search your Food Library above to add paneer, dals, veggies, spices, oil, etc.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {ingredients.map((ing, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-between text-xs hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-medium text-white">{ing.name}</span>
                            <span className="text-slate-400 ml-2">
                              {ing.quantity} {ing.servingUnit}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right text-[11px]">
                            <span className="font-semibold text-amber-400">{ing.calories} kcal</span>
                            <span className="text-slate-400 ml-2">{ing.protein}g P</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(idx)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Macro Summary Dashboard Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    Recipe Nutrition Breakdown
                  </div>
                  <div className="text-xs text-slate-400">
                    Yields: <strong className="text-white">{servings}</strong> serving(s)
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Calories / Serv</div>
                    <div className="text-base font-bold text-amber-400 font-mono">
                      {calculatedNutrition.perServingNutrition.calories}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Total: {calculatedNutrition.totalNutrition.calories}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Protein / Serv</div>
                    <div className="text-base font-bold text-blue-400 font-mono">
                      {calculatedNutrition.perServingNutrition.protein}g
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Total: {calculatedNutrition.totalNutrition.protein}g
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Carbs / Serv</div>
                    <div className="text-base font-bold text-emerald-400 font-mono">
                      {calculatedNutrition.perServingNutrition.carbs}g
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Total: {calculatedNutrition.totalNutrition.carbs}g
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Fat / Serv</div>
                    <div className="text-base font-bold text-rose-400 font-mono">
                      {calculatedNutrition.perServingNutrition.fats}g
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Total: {calculatedNutrition.totalNutrition.fats}g
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">
                  Cooking Notes or Recipe Tips (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cook with 1 tsp ghee, high protein meal prep"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex flex-wrap gap-3 justify-end pt-3 border-t border-slate-800">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleSaveRecipe(false)}
                  disabled={ingredients.length === 0 || !name.trim()}
                  className="border-slate-600 hover:border-amber-500 text-amber-300"
                >
                  <BookmarkPlus className="w-4 h-4 mr-1.5" />
                  Save to My Recipes
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleSaveRecipe(true)}
                  disabled={ingredients.length === 0 || !name.trim()}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Save & Log to Diary
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
