import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader, PageContainer } from "./ui/navigation";
import { Card, SectionHeader, InfoRow } from "./ui/cards";
import { Button } from "./ui/buttons";
import { InputField } from "./ui/forms";
import { storage } from "../../config/storage";
import { Meal } from "../types";
import { 
  UtensilsCrossed, 
  Plus, 
  Trash2, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame
} from "lucide-react";

export function DietPlan() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [mealPlan, setMealPlan] = useState(() => storage.getMealPlan(selectedDate));
  
  // Form state for adding meal
  const [newMeal, setNewMeal] = useState({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    time: "12:00",
  });

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    const dateStr = newDate.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    setMealPlan(storage.getMealPlan(dateStr));
  };

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    
    const meal: Meal = {
      id: Date.now().toString(),
      ...newMeal,
    };

    storage.addMeal(selectedDate, meal);
    setMealPlan(storage.getMealPlan(selectedDate));
    
    // Reset form
    setNewMeal({
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      time: "12:00",
    });
    setShowAddMeal(false);
  };

  const handleDeleteMeal = (mealId: string) => {
    if (confirm("Delete this meal?")) {
      storage.deleteMeal(selectedDate, mealId);
      setMealPlan(storage.getMealPlan(selectedDate));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return "Today";
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const meals = mealPlan?.meals || [];
  const totals = {
    calories: mealPlan?.totalCalories || 0,
    protein: mealPlan?.totalProtein || 0,
    carbs: mealPlan?.totalCarbs || 0,
    fats: mealPlan?.totalFats || 0,
  };

  return (
    <div className="min-h-screen">
      <PageContainer padding>
        <PageHeader title="Diet Plan" icon={UtensilsCrossed} />

        {/* Date Selector */}
        <Card delay={0.1}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="size-6 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center mb-1">
                <Calendar className="size-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatDate(selectedDate)}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            <button
              onClick={() => changeDate(1)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight className="size-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </Card>

        {/* Daily Totals */}
        <Card delay={0.2} className="mt-6">
          <SectionHeader title="Daily Totals" icon={Flame} />
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-red-500 to-orange-500 p-4 rounded-xl">
              <div className="text-white/80 text-xs font-medium mb-1">Calories</div>
              <div className="text-2xl font-bold text-white">{totals.calories}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl">
              <div className="text-white/80 text-xs font-medium mb-1">Protein</div>
              <div className="text-2xl font-bold text-white">{totals.protein}g</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl">
              <div className="text-white/80 text-xs font-medium mb-1">Carbs</div>
              <div className="text-2xl font-bold text-white">{totals.carbs}g</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-4 rounded-xl">
              <div className="text-white/80 text-xs font-medium mb-1">Fats</div>
              <div className="text-2xl font-bold text-white">{totals.fats}g</div>
            </div>
          </div>
        </Card>

        {/* Meals List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Meals ({meals.length})
            </h3>
            <Button
              onClick={() => setShowAddMeal(true)}
              icon={Plus}
              size="sm"
            >
              Add Meal
            </Button>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {meals.length === 0 ? (
                <Card>
                  <div className="text-center py-8">
                    <UtensilsCrossed className="size-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No meals planned for this day
                    </p>
                  </div>
                </Card>
              ) : (
                meals.sort((a, b) => a.time.localeCompare(b.time)).map((meal, index) => (
                  <motion.div
                    key={meal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card hoverable>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="size-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {meal.time}
                            </span>
                          </div>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                            {meal.name}
                          </h4>
                          <div className="grid grid-cols-4 gap-2 text-sm">
                            <div>
                              <div className="text-gray-500 dark:text-gray-400">Cal</div>
                              <div className="font-bold text-gray-900 dark:text-white">
                                {meal.calories}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500 dark:text-gray-400">Protein</div>
                              <div className="font-bold text-gray-900 dark:text-white">
                                {meal.protein}g
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500 dark:text-gray-400">Carbs</div>
                              <div className="font-bold text-gray-900 dark:text-white">
                                {meal.carbs}g
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500 dark:text-gray-400">Fats</div>
                              <div className="font-bold text-gray-900 dark:text-white">
                                {meal.fats}g
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteMeal(meal.id)}
                          className="ml-4 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                        >
                          <Trash2 className="size-5" />
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Add Meal Modal */}
        <AnimatePresence>
          {showAddMeal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setShowAddMeal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-x-4 top-20 max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto"
              >
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Add Meal
                  </h3>
                  
                  <form onSubmit={handleAddMeal} className="space-y-4">
                    <InputField
                      label="Meal Name"
                      type="text"
                      value={newMeal.name}
                      onChange={(value) => setNewMeal({ ...newMeal, name: value })}
                      placeholder="e.g., Chicken Salad"
                      required
                    />

                    <InputField
                      label="Time"
                      type="time"
                      value={newMeal.time}
                      onChange={(value) => setNewMeal({ ...newMeal, time: value })}
                      icon={Clock}
                      required
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="Calories"
                        type="number"
                        value={newMeal.calories || ""}
                        onChange={(value) => setNewMeal({ ...newMeal, calories: Number(value) })}
                        required
                      />
                      <InputField
                        label="Protein (g)"
                        type="number"
                        value={newMeal.protein || ""}
                        onChange={(value) => setNewMeal({ ...newMeal, protein: Number(value) })}
                        required
                      />
                      <InputField
                        label="Carbs (g)"
                        type="number"
                        value={newMeal.carbs || ""}
                        onChange={(value) => setNewMeal({ ...newMeal, carbs: Number(value) })}
                        required
                      />
                      <InputField
                        label="Fats (g)"
                        type="number"
                        value={newMeal.fats || ""}
                        onChange={(value) => setNewMeal({ ...newMeal, fats: Number(value) })}
                        required
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        fullWidth
                        onClick={() => setShowAddMeal(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" fullWidth>
                        Add Meal
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </PageContainer>
    </div>
  );
}
