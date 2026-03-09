import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { ProgressRing, StatBadge, MiniStat } from "./ui/progress";
import { Card, StatCard, QuoteCard } from "./ui/cards";
import { PageHeader, PageContainer } from "./ui/navigation";
import { Button } from "./ui/buttons";
import { DailyChecklist } from "./DailyChecklist";
import { storage } from "../../config/storage";
import { getMotivationalQuote } from "../utils/quotes";
import { 
  TrendingDown, 
  Target, 
  Calendar, 
  Flame, 
  Trophy,
  Scale,
  UtensilsCrossed,
  Dumbbell,
  ChevronRight
} from "lucide-react";

export function Dashboard() {
  const navigate = useNavigate();
  const [state, setState] = useState(() => storage.get());
  const [todayRecord, setTodayRecord] = useState(() => storage.getTodayRecord());
  const [quote] = useState(getMotivationalQuote());

  // Listen for checklist updates
  useEffect(() => {
    const handleUpdate = () => {
      setState(storage.get());
      setTodayRecord(storage.getTodayRecord());
    };

    window.addEventListener('checklistUpdated', handleUpdate);
    return () => window.removeEventListener('checklistUpdated', handleUpdate);
  }, []);

  const profile = state?.profile;
  const currentDay = storage.getCurrentDay();
  const daysRemaining = storage.getDaysRemaining();
  const completionRate = todayRecord.completionRate;
  const currentStreak = state?.currentStreak || 0;
  const daysCompleted = storage.getDaysCompleted();

  const weightLost = profile 
    ? profile.startWeight - profile.currentWeight 
    : 0;

  // Get today's meal and workout data
  const today = new Date().toISOString().split('T')[0];
  const todayMealPlan = storage.getMealPlan(today);
  const todayWorkout = storage.getWorkoutHistory(today);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <PageHeader
        title="Fitness Shred"
        subtitle={`Day ${currentDay}`}
        gradient
        action={
          <StatBadge icon={Flame} value={currentStreak} color="yellow" />
        }
      />

      {/* Progress Ring */}
      <div className="flex justify-center px-6 py-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
          whileHover={{ scale: 1.05 }}
          className="cursor-pointer"
        >
          <ProgressRing progress={completionRate} size={220} strokeWidth={14} />
        </motion.div>
      </div>

      {/* Main Content */}
      <PageContainer>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            icon={Scale}
            label="Current"
            value={`${profile?.currentWeight || 0} kg`}
            delay={0.2}
          />
          <StatCard
            icon={Target}
            label="Goal"
            value={`${profile?.goalWeight || 0} kg`}
            delay={0.3}
          />
          <StatCard
            icon={TrendingDown}
            label="Lost"
            value={`${weightLost.toFixed(1)} kg`}
            delay={0.4}
          />
          <StatCard
            icon={Calendar}
            label="Days Left"
            value={daysRemaining.toString()}
            delay={0.5}
          />
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={() => navigate('/diet')}
            className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-2xl shadow-lg text-left hover:scale-105 transition-transform"
          >
            <UtensilsCrossed className="size-8 text-white mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Diet Plan</h3>
            <p className="text-sm text-white/80">
              {todayMealPlan ? `${todayMealPlan.meals.length} meals` : "Plan meals"}
            </p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            onClick={() => navigate('/gym')}
            className="bg-gradient-to-br from-purple-500 to-blue-500 p-6 rounded-2xl shadow-lg text-left hover:scale-105 transition-transform"
          >
            <Dumbbell className="size-8 text-white mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Gym Routine</h3>
            <p className="text-sm text-white/80">
              {todayWorkout?.completed ? "Completed ✓" : "Start workout"}
            </p>
          </motion.button>
        </div>

        {/* Motivational Quote */}
        <QuoteCard quote={quote} icon={Trophy} delay={0.7} />

        {/* Achievement Stats */}
        <Card delay={0.8} className="mt-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Progress Stats
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
      </PageContainer>
    </div>
  );
}