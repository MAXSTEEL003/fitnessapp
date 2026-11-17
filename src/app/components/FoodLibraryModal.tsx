import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FoodLibraryItem, FoodCategory, MealCategory, Recipe } from "../types";
import { storage } from "../../config/storage";
import { calculateFoodNutrition, round } from "../utils/nutrition-calculations";
import { RecipeBuilderModal } from "./RecipeBuilderModal";
import { Button } from "./ui/buttons";
import { InputField } from "./ui/forms";
import { Card } from "./ui/cards";
import { 
  Search, 
  Plus, 
  Star, 
  Trash2, 
  Copy, 
  Edit2, 
  X, 
  Check, 
  Sparkles, 
  UtensilsCrossed,
  Filter,
  ChefHat,
  BookmarkPlus
} from "lucide-react";

const FOOD_CATEGORIES: FoodCategory[] = [
  'Protein',
  'Dairy',
  'Carbohydrates',
  'Fruits',
  'Vegetables',
  'Fats & Oils',
  'Indian Meals',
  'Snacks',
  'Supplements',
  'Other',
];

interface FoodLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  defaultMealCategory?: MealCategory;
  onFoodLogged?: () => void;
}

export function FoodLibraryModal({
  isOpen,
  onClose,
  selectedDate,
  defaultMealCategory = "Lunch",
  onFoodLogged,
}: FoodLibraryModalProps) {
  const [libraryTab, setLibraryTab] = useState<'foods' | 'recipes'>('foods');
  const [foods, setFoods] = useState<FoodLibraryItem[]>(() => storage.getFoods());
  const [recipes, setRecipes] = useState<Recipe[]>(() => storage.getRecipes());
  const [showRecipeBuilder, setShowRecipeBuilder] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Mode: 'browse' | 'create' | 'edit' | 'logQuantity' | 'logRecipe'
  const [modalMode, setModalMode] = useState<'browse' | 'create' | 'edit' | 'logQuantity' | 'logRecipe'>('browse');
  const [activeFood, setActiveFood] = useState<FoodLibraryItem | null>(null);
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);

  // Form state for create / edit
  const [formData, setFormData] = useState({
    name: "",
    category: "Protein" as FoodCategory,
    servingSize: 100,
    servingUnit: "g",
    calories: 145,
    protein: 20,
    carbs: 5,
    fats: 6,
    notes: "",
  });

  // Logging state
  const [logMealCategory, setLogMealCategory] = useState<MealCategory>(defaultMealCategory);
  const [logQuantity, setLogQuantity] = useState<number>(100);
  const [logRecipeServings, setLogRecipeServings] = useState<number>(1);

  const refreshFoods = () => {
    setFoods(storage.getFoods());
    setRecipes(storage.getRecipes());
  };

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      category: "Dairy",
      servingSize: 100,
      servingUnit: "g",
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      notes: "",
    });
    setModalMode('create');
  };

  const handleOpenEdit = (food: FoodLibraryItem) => {
    setActiveFood(food);
    setFormData({
      name: food.name,
      category: food.category,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      notes: food.notes || "",
    });
    setModalMode('edit');
  };

  const handleSaveFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (modalMode === 'edit' && activeFood) {
      storage.saveFood({
        ...activeFood,
        name: formData.name.trim(),
        category: formData.category,
        servingSize: Math.max(0.1, Number(formData.servingSize) || 100),
        servingUnit: formData.servingUnit.trim() || 'g',
        calories: Math.max(0, Number(formData.calories) || 0),
        protein: Math.max(0, Number(formData.protein) || 0),
        carbs: Math.max(0, Number(formData.carbs) || 0),
        fats: Math.max(0, Number(formData.fats) || 0),
        notes: formData.notes.trim() || undefined,
      });
    } else {
      const newFood: FoodLibraryItem = {
        id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: formData.name.trim(),
        category: formData.category,
        servingSize: Math.max(0.1, Number(formData.servingSize) || 100),
        servingUnit: formData.servingUnit.trim() || 'g',
        calories: Math.max(0, Number(formData.calories) || 0),
        protein: Math.max(0, Number(formData.protein) || 0),
        carbs: Math.max(0, Number(formData.carbs) || 0),
        fats: Math.max(0, Number(formData.fats) || 0),
        notes: formData.notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      storage.saveFood(newFood);
    }

    refreshFoods();
    setModalMode('browse');
    setActiveFood(null);
  };

  const handleDeleteFood = (foodId: string, name: string) => {
    if (confirm(`Delete "${name}" from food library? Historical diary entries will remain unaffected.`)) {
      storage.deleteFood(foodId);
      refreshFoods();
    }
  };

  const handleDuplicateFood = (foodId: string) => {
    storage.duplicateFood(foodId);
    refreshFoods();
  };

  const handleToggleFavorite = (foodId: string) => {
    storage.toggleFavoriteFood(foodId);
    refreshFoods();
  };

  const handleSelectToLog = (food: FoodLibraryItem) => {
    setActiveFood(food);
    setLogQuantity(food.servingSize || 100);
    setLogMealCategory(defaultMealCategory);
    setModalMode('logQuantity');
  };

  const handleConfirmLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFood) return;

    const calculated = calculateFoodNutrition(logQuantity, activeFood.servingSize, {
      calories: activeFood.calories,
      protein: activeFood.protein,
      carbs: activeFood.carbs,
      fats: activeFood.fats,
    });

    storage.addFoodEntry(selectedDate, {
      foodId: activeFood.id,
      name: activeFood.name,
      mealCategory: logMealCategory,
      quantity: logQuantity,
      servingUnit: activeFood.servingUnit,
      baseServingSize: activeFood.servingSize,
      calories: calculated.calories,
      protein: calculated.protein,
      carbs: calculated.carbs,
      fats: calculated.fats,
      notes: activeFood.notes,
      time: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()),
    });

    if (onFoodLogged) onFoodLogged();
    onClose();
  };

  const handleSelectRecipeToLog = (recipe: Recipe) => {
    setActiveRecipe(recipe);
    setLogRecipeServings(1);
    setModalMode('logRecipe');
  };

  const handleConfirmLogRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecipe) return;

    storage.logRecipeToFoodDiary(
      activeRecipe.id,
      logRecipeServings,
      logMealCategory,
      selectedDate
    );

    if (onFoodLogged) onFoodLogged();
    onClose();
  };

  const handleDeleteRecipe = (id: string, name: string) => {
    if (confirm(`Delete "${name}" from your Recipe Library?`)) {
      storage.deleteRecipe(id);
      refreshFoods();
    }
  };

  const handleToggleRecipeFavorite = (id: string) => {
    storage.toggleRecipeFavorite(id);
    refreshFoods();
  };

  // Filter and sort foods
  const filteredFoods = foods
    .filter((f) => {
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || f.category === selectedCategory;
      const matchesFav = !showOnlyFavorites || f.isFavorite;
      return matchesSearch && matchesCategory && matchesFav;
    })
    .sort((a, b) => {
      // Favorites first, then recently used, then alphabetical
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      if (a.lastUsedAt && b.lastUsedAt) return b.lastUsedAt.localeCompare(a.lastUsedAt);
      return a.name.localeCompare(b.name);
    });

  // Filter and sort recipes
  const filteredRecipes = recipes
    .filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.ingredients && r.ingredients.some((ing) => ing.name.toLowerCase().includes(q)));
      const matchesFav = !showOnlyFavorites || r.isFavorite;
      return matchesSearch && matchesFav;
    })
    .sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      if (a.lastUsedAt && b.lastUsedAt) return b.lastUsedAt.localeCompare(a.lastUsedAt);
      return a.name.localeCompare(b.name);
    });

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg max-h-[88vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800 flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-purple-600/10">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md">
                <UtensilsCrossed className="size-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {modalMode === 'browse' && (libraryTab === 'foods' ? "Food Library" : "Indian Meals & Recipes")}
                  {modalMode === 'create' && "Create Reusable Food"}
                  {modalMode === 'edit' && "Edit Reusable Food"}
                  {modalMode === 'logQuantity' && "Add to Daily Diary"}
                  {modalMode === 'logRecipe' && "Log Recipe to Diary"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {modalMode === 'browse' && (libraryTab === 'foods' 
                    ? `${foods.length} foods saved • Indian vegetarian & protein database`
                    : `${recipes.length} recipes saved • Custom Indian meal preparations`)}
                  {modalMode === 'logQuantity' && `For ${selectedDate} (${logMealCategory})`}
                  {modalMode === 'logRecipe' && `For ${selectedDate} (${logMealCategory})`}
                  {(modalMode === 'create' || modalMode === 'edit') && "Saved nutrition per base serving"}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (modalMode !== 'browse') {
                  setModalMode('browse');
                } else {
                  onClose();
                }
              }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* ---------------- MODE: BROWSE FOODS OR RECIPES ---------------- */}
            {modalMode === 'browse' && (
              <div className="space-y-4">
                {/* Top Tab Bar: Foods vs Indian Meals & Recipes */}
                <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800/80 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLibraryTab('foods');
                      setSelectedCategory("All");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                      libraryTab === 'foods'
                        ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    Food Library ({foods.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLibraryTab('recipes');
                      setSelectedCategory("All");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                      libraryTab === 'recipes'
                        ? "bg-white dark:bg-gray-900 text-amber-500 dark:text-amber-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    Indian Meals & Recipes ({recipes.length})
                  </button>
                </div>

                {/* Search & Actions Bar */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={
                        libraryTab === 'foods'
                          ? "Search foods (paneer, dal, rice, ghee, whey)..."
                          : "Search recipes (bhurji, tadka, khichdi, chole)..."
                      }
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {libraryTab === 'foods' ? (
                    <Button
                      onClick={handleOpenCreate}
                      icon={Plus}
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      New Food
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setRecipeToEdit(null);
                        setShowRecipeBuilder(true);
                      }}
                      icon={ChefHat}
                      size="sm"
                      className="whitespace-nowrap bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Build Recipe
                    </Button>
                  )}
                </div>

                {/* Category Filters (Only for foods tab) */}
                {libraryTab === 'foods' && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
                    <button
                      onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${
                        showOnlyFavorites
                          ? "bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-300 font-semibold"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Star className={`size-3.5 ${showOnlyFavorites ? "fill-yellow-500 text-yellow-500" : ""}`} />
                      Favorites
                    </button>

                    <button
                      onClick={() => setSelectedCategory("All")}
                      className={`px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${
                        selectedCategory === "All"
                          ? "bg-blue-600 border-blue-600 text-white font-semibold"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      All
                    </button>

                    {FOOD_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${
                          selectedCategory === cat
                            ? "bg-blue-600 border-blue-600 text-white font-semibold"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* Recipes Favorite Filter (Only for recipes tab) */}
                {libraryTab === 'recipes' && (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors ${
                        showOnlyFavorites
                          ? "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-300 font-semibold"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Star className={`size-3.5 ${showOnlyFavorites ? "fill-amber-500 text-amber-500" : ""}`} />
                      Favorite Recipes
                    </button>
                    <span className="text-gray-400 text-[11px]">
                      Showing {filteredRecipes.length} Indian & composite recipes
                    </span>
                  </div>
                )}

                {/* List: Foods or Recipes */}
                {libraryTab === 'foods' ? (
                  <div className="space-y-2.5 pt-1">
                    {filteredFoods.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <UtensilsCrossed className="size-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-300 font-medium">No foods match your search</p>
                        <p className="text-xs text-gray-400 mt-1 mb-4">Add your favorite meals to your library once and use them forever.</p>
                        <Button onClick={handleOpenCreate} icon={Plus} size="sm">
                          Create "{searchQuery || 'Custom Food'}"
                        </Button>
                      </div>
                    ) : (
                      filteredFoods.map((food) => (
                        <div
                          key={food.id}
                          className="group bg-gray-50/70 dark:bg-gray-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl p-3.5 transition-all flex items-center justify-between"
                        >
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => handleSelectToLog(food)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {food.name}
                              </span>
                              <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-200/60 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 font-medium">
                                {food.category}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-semibold text-gray-800 dark:text-gray-200">
                                {food.calories} kcal
                              </span>
                              <span>•</span>
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                P: {food.protein}g
                              </span>
                              <span>•</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                C: {food.carbs}g
                              </span>
                              <span>•</span>
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                F: {food.fats}g
                              </span>
                              <span className="text-[11px] text-gray-400">
                                (per {food.servingSize} {food.servingUnit})
                              </span>
                            </div>
                            {food.notes && (
                              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 italic line-clamp-1">
                                {food.notes}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => handleToggleFavorite(food.id)}
                              className={`p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors ${
                                food.isFavorite ? "text-yellow-500" : "text-gray-300 dark:text-gray-600"
                              }`}
                              title="Favorite"
                            >
                              <Star className={`size-4 ${food.isFavorite ? "fill-yellow-500" : ""}`} />
                            </button>
                            <button
                              onClick={() => handleDuplicateFood(food.id)}
                              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                              title="Duplicate"
                            >
                              <Copy className="size-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(food)}
                              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="size-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFood(food.id, food.name)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="size-4" />
                            </button>
                            <button
                              onClick={() => handleSelectToLog(food)}
                              className="ml-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                            >
                              Log
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  /* Recipes List */
                  <div className="space-y-3 pt-1">
                    {filteredRecipes.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <ChefHat className="size-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-300 font-medium">No recipes match your search</p>
                        <p className="text-xs text-gray-400 mt-1 mb-4">
                          Build custom Indian composite meals from your food library with exact macro calculation.
                        </p>
                        <Button
                          onClick={() => {
                            setRecipeToEdit(null);
                            setShowRecipeBuilder(true);
                          }}
                          icon={ChefHat}
                          size="sm"
                        >
                          Build New Recipe
                        </Button>
                      </div>
                    ) : (
                      filteredRecipes.map((recipe) => (
                        <div
                          key={recipe.id}
                          className="group bg-gray-50/70 dark:bg-gray-800/40 hover:bg-amber-50/40 dark:hover:bg-amber-900/10 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl p-4 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => handleSelectRecipeToLog(recipe)}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="font-bold text-gray-900 dark:text-white text-base group-hover:text-amber-500 transition-colors">
                                  {recipe.name}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                                  {recipe.category}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                                  Yields {recipe.servings} serving{recipe.servings > 1 ? 's' : ''}
                                </span>
                              </div>

                              {/* Per Serving Nutrition */}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-bold text-gray-900 dark:text-white">
                                  {recipe.perServingNutrition.calories} kcal / serv
                                </span>
                                <span>•</span>
                                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                  P: {recipe.perServingNutrition.protein}g
                                </span>
                                <span>•</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  C: {recipe.perServingNutrition.carbs}g
                                </span>
                                <span>•</span>
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  F: {recipe.perServingNutrition.fats}g
                                </span>
                              </div>

                              {/* Ingredient Summary Chips */}
                              {recipe.ingredients && recipe.ingredients.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {recipe.ingredients.map((ing, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700/60"
                                    >
                                      {ing.name} ({ing.quantity}{ing.servingUnit})
                                    </span>
                                  ))}
                                </div>
                              )}

                              {recipe.notes && (
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 italic line-clamp-1">
                                  {recipe.notes}
                                </p>
                              )}
                            </div>

                            {/* Recipe Actions */}
                            <div className="flex items-center gap-1 ml-3 shrink-0">
                              <button
                                onClick={() => handleToggleRecipeFavorite(recipe.id)}
                                className={`p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors ${
                                  recipe.isFavorite ? "text-amber-500" : "text-gray-300 dark:text-gray-600"
                                }`}
                                title="Favorite"
                              >
                                <Star className={`size-4 ${recipe.isFavorite ? "fill-amber-500" : ""}`} />
                              </button>
                              <button
                                onClick={() => {
                                  setRecipeToEdit(recipe);
                                  setShowRecipeBuilder(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-amber-500 transition-colors"
                                title="Edit Recipe"
                              >
                                <Edit2 className="size-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecipe(recipe.id, recipe.name)}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Delete Recipe"
                              >
                                <Trash2 className="size-4" />
                              </button>
                              <button
                                onClick={() => handleSelectRecipeToLog(recipe)}
                                className="ml-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
                              >
                                <Plus className="size-3.5" />
                                Log
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ---------------- MODE: LOG QUANTITY ---------------- */}
            {modalMode === 'logQuantity' && activeFood && (
              <form onSubmit={handleConfirmLog} className="space-y-5">
                <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-200/50 dark:border-blue-800/50 p-4 rounded-2xl">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                      {activeFood.name}
                    </h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold">
                      {activeFood.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Base: {activeFood.calories} kcal • {activeFood.protein}g P • {activeFood.carbs}g C • {activeFood.fats}g F per {activeFood.servingSize} {activeFood.servingUnit}
                  </p>
                </div>

                {/* Meal Category Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Meal Category
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as MealCategory[]).map((meal) => (
                      <button
                        key={meal}
                        type="button"
                        onClick={() => setLogMealCategory(meal)}
                        className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                          logMealCategory === meal
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {meal}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Quantity ({activeFood.servingUnit})
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={logQuantity}
                      onChange={(e) => setLogQuantity(Math.max(0, Number(e.target.value)))}
                      required
                      className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-lg font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-14">
                      {activeFood.servingUnit}
                    </div>
                  </div>
                  {/* Quick Quantity Chips */}
                  <div className="flex items-center gap-2 mt-2">
                    {[
                      { label: "0.5x", val: activeFood.servingSize * 0.5 },
                      { label: "1x", val: activeFood.servingSize },
                      { label: "1.5x", val: activeFood.servingSize * 1.5 },
                      { label: "2x", val: activeFood.servingSize * 2 },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => setLogQuantity(round(chip.val, 1))}
                        className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                      >
                        {chip.label} ({round(chip.val, 1)}{activeFood.servingUnit})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamically Calculated Nutrition Display */}
                {(() => {
                  const calculated = calculateFoodNutrition(logQuantity, activeFood.servingSize, {
                    calories: activeFood.calories,
                    protein: activeFood.protein,
                    carbs: activeFood.carbs,
                    fats: activeFood.fats,
                  });

                  return (
                    <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                        Calculated Nutrition for {logQuantity} {activeFood.servingUnit}:
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-red-500/10 dark:bg-red-500/20">
                          <div className="text-[11px] text-red-600 dark:text-red-400 font-semibold">Calories</div>
                          <div className="text-xl font-bold text-red-700 dark:text-red-300">{calculated.calories}</div>
                          <div className="text-[10px] text-gray-400">kcal</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-blue-500/10 dark:bg-blue-500/20">
                          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Protein</div>
                          <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{calculated.protein}g</div>
                          <div className="text-[10px] text-gray-400">grams</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20">
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Carbs</div>
                          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{calculated.carbs}g</div>
                          <div className="text-[10px] text-gray-400">grams</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20">
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Fat</div>
                          <div className="text-xl font-bold text-amber-700 dark:text-amber-300">{calculated.fats}g</div>
                          <div className="text-[10px] text-gray-400">grams</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    fullWidth
                    onClick={() => setModalMode('browse')}
                  >
                    Back to Foods
                  </Button>
                  <Button type="submit" fullWidth icon={Check}>
                    Add to Diary
                  </Button>
                </div>
              </form>
            )}

            {/* ---------------- MODE: LOG RECIPE SERVINGS ---------------- */}
            {modalMode === 'logRecipe' && activeRecipe && (
              <form onSubmit={handleConfirmLogRecipe} className="space-y-5">
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/50 dark:border-amber-800/50 p-4 rounded-2xl">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                      {activeRecipe.name}
                    </h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-semibold">
                      {activeRecipe.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Per serving: {activeRecipe.perServingNutrition.calories} kcal • {activeRecipe.perServingNutrition.protein}g P • {activeRecipe.perServingNutrition.carbs}g C • {activeRecipe.perServingNutrition.fats}g F (Yields {activeRecipe.servings} total)
                  </p>
                </div>

                {/* Meal Category Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Meal Category
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as MealCategory[]).map((meal) => (
                      <button
                        key={meal}
                        type="button"
                        onClick={() => setLogMealCategory(meal)}
                        className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                          logMealCategory === meal
                            ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {meal}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Servings Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Servings to Log
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      value={logRecipeServings}
                      onChange={(e) => setLogRecipeServings(Math.max(0.1, Number(e.target.value)))}
                      required
                      className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-lg font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-16">
                      serving(s)
                    </div>
                  </div>

                  {/* Quick Serving Chips */}
                  <div className="flex items-center gap-2 mt-2">
                    {[0.5, 1, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setLogRecipeServings(s)}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                          logRecipeServings === s
                            ? "bg-amber-500 text-white font-semibold"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                        }`}
                      >
                        {s} serv
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live calculated macros */}
                {(() => {
                  const cals = round(activeRecipe.perServingNutrition.calories * logRecipeServings, 1);
                  const prot = round(activeRecipe.perServingNutrition.protein * logRecipeServings, 1);
                  const carbs = round(activeRecipe.perServingNutrition.carbs * logRecipeServings, 1);
                  const fats = round(activeRecipe.perServingNutrition.fats * logRecipeServings, 1);

                  return (
                    <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                        Calculated Nutrition for {logRecipeServings} serving(s):
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-red-500/10 dark:bg-red-500/20">
                          <div className="text-[11px] text-red-600 dark:text-red-400 font-semibold">Calories</div>
                          <div className="text-xl font-bold text-red-700 dark:text-red-300">{cals}</div>
                          <div className="text-[10px] text-gray-400">kcal</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-blue-500/10 dark:bg-blue-500/20">
                          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Protein</div>
                          <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{prot}g</div>
                          <div className="text-[10px] text-gray-400">grams</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20">
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Carbs</div>
                          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{carbs}g</div>
                          <div className="text-[10px] text-gray-400">grams</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20">
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Fat</div>
                          <div className="text-xl font-bold text-amber-700 dark:text-amber-300">{fats}g</div>
                          <div className="text-[10px] text-gray-400">grams</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    fullWidth
                    onClick={() => setModalMode('browse')}
                  >
                    Back to Recipes
                  </Button>
                  <Button
                    type="submit"
                    fullWidth
                    icon={Check}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    Add Recipe to Diary
                  </Button>
                </div>
              </form>
            )}

            {/* ---------------- MODE: CREATE / EDIT FOOD ---------------- */}
            {(modalMode === 'create' || modalMode === 'edit') && (
              <form onSubmit={handleSaveFood} className="space-y-4">
                <InputField
                  label="Food Name"
                  type="text"
                  placeholder="e.g., Low-fat paneer, Grilled Chicken, Oats"
                  value={formData.name}
                  onChange={(v) => setFormData({ ...formData, name: v })}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as FoodCategory })}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {FOOD_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <InputField
                      label="Serving Size"
                      type="number"
                      step="any"
                      value={formData.servingSize}
                      onChange={(v) => setFormData({ ...formData, servingSize: Number(v) })}
                      required
                    />
                    <InputField
                      label="Serving Unit"
                      type="text"
                      placeholder="g, ml, cup"
                      value={formData.servingUnit}
                      onChange={(v) => setFormData({ ...formData, servingUnit: v })}
                      required
                    />
                  </div>
                </div>

                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3.5 rounded-2xl border border-blue-200/50 dark:border-blue-800/40">
                  <div className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-1.5">
                    <Sparkles className="size-4" />
                    Nutrition per {formData.servingSize || 100} {formData.servingUnit || 'g'}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Calories (kcal)"
                      type="number"
                      step="0.1"
                      value={formData.calories}
                      onChange={(v) => setFormData({ ...formData, calories: Number(v) })}
                      required
                    />
                    <InputField
                      label="Protein (g)"
                      type="number"
                      step="0.1"
                      value={formData.protein}
                      onChange={(v) => setFormData({ ...formData, protein: Number(v) })}
                      required
                    />
                    <InputField
                      label="Carbohydrates (g)"
                      type="number"
                      step="0.1"
                      value={formData.carbs}
                      onChange={(v) => setFormData({ ...formData, carbs: Number(v) })}
                      required
                    />
                    <InputField
                      label="Fat (g)"
                      type="number"
                      step="0.1"
                      value={formData.fats}
                      onChange={(v) => setFormData({ ...formData, fats: Number(v) })}
                      required
                    />
                  </div>
                </div>

                <InputField
                  label="Notes (Optional)"
                  type="text"
                  placeholder="e.g. Brand, preparation style, high casein"
                  value={formData.notes}
                  onChange={(v) => setFormData({ ...formData, notes: v })}
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    fullWidth
                    onClick={() => {
                      setModalMode('browse');
                      setActiveFood(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" fullWidth icon={Check}>
                    {modalMode === 'edit' ? "Update Food" : "Save to Food Library"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>

    {/* Embedded Recipe Builder Modal */}
    <RecipeBuilderModal
      isOpen={showRecipeBuilder}
      onClose={() => {
        setShowRecipeBuilder(false);
        setRecipeToEdit(null);
      }}
      selectedDate={selectedDate}
      recipeToEdit={recipeToEdit}
      onRecipeSaved={() => {
        refreshFoods();
        setShowRecipeBuilder(false);
        setRecipeToEdit(null);
      }}
      onRecipeLogged={() => {
        refreshFoods();
        if (onFoodLogged) onFoodLogged();
        onClose();
      }}
    />
  </>
  );
}
