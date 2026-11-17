import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { ProgressRing, StatBadge, MiniStat, ProgressBar } from "./ui/progress";
import { Card, StatCard, QuoteCard, SectionHeader } from "./ui/cards";
import { PageHeader, PageContainer } from "./ui/navigation";
import { Button } from "./ui/buttons";
import { DailyChecklist } from "./DailyChecklist";
import { storage } from "../../config/storage";
import { getMotivationalQuote } from "../utils/quotes";
import { 
  getTodayDateString, 
  shiftDateString, 
  formatDisplayDate, 
  formatFullDisplayDate 
} from "../utils/date";
import { round } from "../utils/nutrition-calculations";
import { FoodLibraryModal } from "./FoodLibraryModal";
import { ExerciseDiaryModal } from "./ExerciseDiaryModal";
import { MeasurementModal } from "./MeasurementModal";
import { 
  TrendingDown, 
  Target, 
  Calendar, 
  Flame, 
  Trophy,
  Scale,
  UtensilsCrossed,
  Dumbbell,
  ChevronRight,
  ChevronLeft,
  Footprints,
  Clock,
  Plus,
  Trash2,
  Activity,
  CheckCircle2,
  Sparkles
} from "lucide-react";

export function Dashboard() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());
  const [state, setState] = useState(() => storage.get());
  const [todayRecord, setTodayRecord] = useState(() => storage.getTodayRecord());
  const [summary, setSummary] = useState(() => storage.getDailySummary(selectedDate));
  const [dailyLog, setDailyLog] = useState(() => storage.getDailyLog(selectedDate));
  const [quote] = useState(getMotivationalQuote());

  // Modals
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);

  const refreshData = () => {
    setState(storage.get());
    setTodayRecord(storage.getTodayRecord());
    setSummary(storage.getDailySummary(selectedDate));
    setDailyLog(storage.getDailyLog(selectedDate));
  };

  useEffect(() => {
    refreshData();
  }, [selectedDate]);

  // Listen for checklist updates or storage updates
  useEffect(() => {
    const handleUpdate = () => {
      refreshData();
    };

    window.addEventListener('checklistUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('checklistUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [selectedDate]);

  const changeDate = (days: number) => {
    const newDate = shiftDateString(selectedDate, days);
    setSelectedDate(newDate);
  };

  const profile = state?.profile;
  const currentDay = storage.getCurrentDay();
  const currentStreak = state?.currentStreak || 0;
  const daysCompleted = storage.getDaysCompleted();

  const weightLost = profile 
    ? profile.startWeight - (summary.weight || profile.currentWeight)
    : 0;

  // Calorie & Macro calculations
  const caloriePercent = Math.min(100, Math.round((summary.consumedCalories / (summary.targetCalories || 1)) * 100));
  const proteinPercent = Math.min(100, Math.round((summary.consumedProtein / (summary.targetProtein || 1)) * 100));
  const stepsPercent = Math.min(100, Math.round((summary.steps / (summary.targetSteps || 1)) * 100));

  const handleDeleteExerciseEntry = (entryId: string, name: string) => {
    if (confirm(`Delete "${name}" exercise entry?`)) {
      storage.deleteExerciseEntry(selectedDate, entryId);
      refreshData();
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <PageHeader
        title="Fitness Shred"
        subtitle={`Day ${currentDay} • ${formatDisplayDate(selectedDate)}`}
        gradient
        action={
          <StatBadge icon={Flame} value={currentStreak} color="yellow" />
        }
      />

      {/* Date Switcher Ribbon */}
      <div className="max-w-lg mx-auto px-6 -mt-20 relative z-20 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-3 shadow-xl border border-white/40 dark:border-gray-800 flex items-center justify-between"
        >
          <button
            onClick={() => changeDate(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="size-5 text-gray-700 dark:text-gray-300" />
          </button>

          <div className="text-center">
            <div className="flex items-center gap-1.5 justify-center">
              <Calendar className="size-4 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-gray-900 dark:text-white text-base">
                {formatDisplayDate(selectedDate)}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {formatFullDisplayDate(selectedDate)}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {selectedDate !== getTodayDateString() && (
              <button
                onClick={() => setSelectedDate(getTodayDateString())}
                className="text-[11px] font-semibold px-2 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100"
              >
                Today
              </button>
            )}
            <button
              onClick={() => changeDate(1)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="size-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Hero Progress Ring - Calorie Progress */}
      <div className="flex flex-col items-center justify-center px-6 py-4">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
          className="relative cursor-pointer"
          onClick={() => navigate('/diet')}
        >
          <ProgressRing 
            progress={caloriePercent} 
            size={220} 
            strokeWidth={14} 
            label="Calories Consumed"
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mt-3"
        >
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {summary.consumedCalories} <span className="text-sm font-semibold text-gray-500">/ {summary.targetCalories} kcal</span>
          </div>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
            {summary.remainingCalories > 0
              ? `${summary.remainingCalories} kcal remaining for today`
              : `${Math.abs(summary.consumedCalories - summary.targetCalories)} kcal over target`}
          </div>
        </motion.div>
      </div>

      {/* Main Content Container */}
      <PageContainer>
        {/* Quick Action Floating Bar */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <Button
            onClick={() => setShowFoodModal(true)}
            icon={UtensilsCrossed}
            size="sm"
            className="rounded-2xl text-xs py-3"
          >
            Log Food
          </Button>
          <Button
            onClick={() => setShowExerciseModal(true)}
            icon={Dumbbell}
            size="sm"
            variant="secondary"
            className="rounded-2xl text-xs py-3 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
          >
            Log Exercise
          </Button>
          <Button
            onClick={() => setShowMeasurementModal(true)}
            icon={Scale}
            size="sm"
            variant="secondary"
            className="rounded-2xl text-xs py-3 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
          >
            Log Stats
          </Button>
        </div>

        {/* Daily Nutrition & Target Progress Cards */}
        <Card delay={0.2} className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UtensilsCrossed className="size-5 text-blue-600" />
              Daily Nutrition Progress
            </h3>
            <button
              onClick={() => navigate('/diet')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              Food Diary <ChevronRight className="size-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {/* Protein Indicator */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-blue-600 dark:text-blue-400">Protein</span>
                <span className="text-gray-900 dark:text-white">
                  {summary.consumedProtein} / {summary.targetProtein} g ({proteinPercent}%)
                </span>
              </div>
              <ProgressBar progress={proteinPercent} color="blue" height="sm" />
            </div>

            {/* Carbs Indicator */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-emerald-600 dark:text-emerald-400">Carbohydrates</span>
                <span className="text-gray-900 dark:text-white">
                  {summary.consumedCarbs} / {summary.targetCarbs} g
                </span>
              </div>
              <ProgressBar 
                progress={Math.min(100, Math.round((summary.consumedCarbs / (summary.targetCarbs || 1)) * 100))} 
                color="green" 
                height="sm" 
              />
            </div>

            {/* Fats Indicator */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-amber-600 dark:text-amber-400">Fats</span>
                <span className="text-gray-900 dark:text-white">
                  {summary.consumedFats} / {summary.targetFats} g
                </span>
              </div>
              <ProgressBar 
                progress={Math.min(100, Math.round((summary.consumedFats / (summary.targetFats || 1)) * 100))} 
                color="yellow" 
                height="sm" 
              />
            </div>
          </div>
        </Card>

        {/* Activity & Exercise Expenditure Section */}
        <Card delay={0.3} className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="size-5 text-purple-600" />
              Daily Activity & Exercise
            </h3>
            <button
              onClick={() => setShowExerciseModal(true)}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5"
            >
              + Add Session
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Steps Card */}
            <div 
              onClick={() => setShowMeasurementModal(true)}
              className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200/50 dark:border-emerald-800/40 p-4 rounded-2xl cursor-pointer hover:bg-emerald-500/20 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                <Footprints className="size-4" />
                <span>Daily Steps</span>
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {summary.steps.toLocaleString()}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                Goal: {summary.targetSteps.toLocaleString()} ({stepsPercent}%)
              </div>
            </div>

            {/* Estimated Burn Card */}
            <div 
              onClick={() => setShowExerciseModal(true)}
              className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-200/50 dark:border-purple-800/40 p-4 rounded-2xl cursor-pointer hover:bg-purple-500/20 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                <Flame className="size-4" />
                <span>Exercise Burn</span>
              </div>
              <div className="text-2xl font-black text-purple-700 dark:text-purple-300">
                {summary.exerciseCalories} <span className="text-xs font-normal">kcal</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                {summary.exerciseSessions} session{summary.exerciseSessions !== 1 ? 's' : ''} • {summary.exerciseDuration} min
              </div>
            </div>
          </div>

          {/* Exercise Log Entries List for Today */}
          {dailyLog.exerciseEntries && dailyLog.exerciseEntries.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Logged Sessions ({dailyLog.exerciseEntries.length}):
              </div>
              {dailyLog.exerciseEntries.map((ex) => (
                <div
                  key={ex.id}
                  className="bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">{ex.name}</div>
                    <div className="text-gray-500 text-[11px]">
                      {ex.type === 'duration' ? `${ex.duration} mins • ` : ''}
                      {ex.calories} kcal est. ({ex.type === 'fixed' ? 'Fixed' : 'Duration'})
                      {ex.time ? ` at ${ex.time}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteExerciseEntry(ex.id, ex.name)}
                    className="p-1 rounded text-gray-400 hover:text-red-500"
                    title="Remove"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Body Measurements & Weight Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            icon={Scale}
            label="Weight"
            value={`${summary.weight || profile?.currentWeight || 0} kg`}
            delay={0.2}
          />
          <StatCard
            icon={Target}
            label="Goal Weight"
            value={`${profile?.goalWeight || 0} kg`}
            delay={0.3}
          />
          <StatCard
            icon={TrendingDown}
            label="Weight Lost"
            value={`${weightLost.toFixed(1)} kg`}
            delay={0.4}
          />
          <StatCard
            icon={Activity}
            label="Waist"
            value={summary.waist ? `${summary.waist} cm` : (profile?.currentWaist ? `${profile.currentWaist} cm` : "Not set")}
            delay={0.5}
          />
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={() => navigate('/diet')}
            className="bg-gradient-to-br from-orange-500 to-red-500 p-5 rounded-2xl shadow-lg text-left hover:scale-[1.02] transition-transform"
          >
            <UtensilsCrossed className="size-7 text-white mb-2" />
            <h3 className="text-lg font-bold text-white mb-0.5">Food Diary</h3>
            <p className="text-xs text-white/80">
              {dailyLog.foodEntries.length} items logged
            </p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            onClick={() => navigate('/gym')}
            className="bg-gradient-to-br from-purple-500 to-blue-600 p-5 rounded-2xl shadow-lg text-left hover:scale-[1.02] transition-transform"
          >
            <Dumbbell className="size-7 text-white mb-2" />
            <h3 className="text-lg font-bold text-white mb-0.5">Gym Routine</h3>
            <p className="text-xs text-white/80">
              Track sets & weights
            </p>
          </motion.button>
        </div>

        {/* Motivational Quote */}
        <QuoteCard quote={quote} icon={Trophy} delay={0.7} />

        {/* Achievement Stats */}
        <Card delay={0.8} className="mt-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
            <span>Consistency Stats</span>
            <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
              Day {currentDay}
            </span>
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <MiniStat label="Days Complete" value={daysCompleted} color="blue" />
            <MiniStat label="Current Streak" value={currentStreak} color="green" />
            <MiniStat label="Best Streak" value={state?.longestStreak || 0} color="purple" />
          </div>
        </Card>

        {/* Daily Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-6"
        >
          <DailyChecklist />
        </motion.div>

        {/* Modals */}
        <FoodLibraryModal
          isOpen={showFoodModal}
          onClose={() => setShowFoodModal(false)}
          selectedDate={selectedDate}
          onFoodLogged={refreshData}
        />

        <ExerciseDiaryModal
          isOpen={showExerciseModal}
          onClose={() => setShowExerciseModal(false)}
          selectedDate={selectedDate}
          onExerciseLogged={refreshData}
        />

        <MeasurementModal
          isOpen={showMeasurementModal}
          onClose={() => setShowMeasurementModal(false)}
          selectedDate={selectedDate}
          onSaved={refreshData}
        />
      </PageContainer>
    </div>
  );
}
