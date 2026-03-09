import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { storage } from "../../config/storage";
import { DailyChecklist as DailyChecklistType } from "../types";
import { 
  Check, 
  Clock, 
  Dumbbell, 
  Footprints, 
  Droplets, 
  Beef, 
  Ban, 
  Moon as MoonIcon,
  Zap
} from "lucide-react";

interface ChecklistItem {
  id: keyof DailyChecklistType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const checklistItems: ChecklistItem[] = [
  { 
    id: "wakeUpOnTime", 
    label: "Wake up on time", 
    icon: Clock,
    description: "Start your day right"
  },
  { 
    id: "fastedCardio", 
    label: "Fasted cardio", 
    icon: Zap,
    description: "30 min morning session"
  },
  { 
    id: "gymWorkout", 
    label: "Gym workout", 
    icon: Dumbbell,
    description: "Complete today's training"
  },
  { 
    id: "proteinTarget", 
    label: "Protein target", 
    icon: Beef,
    description: "Hit your daily goal"
  },
  { 
    id: "stepsGoal", 
    label: "13,000 steps", 
    icon: Footprints,
    description: "Stay active all day"
  },
  { 
    id: "waterIntake", 
    label: "Water intake", 
    icon: Droplets,
    description: "Stay hydrated"
  },
  { 
    id: "noCheatMeals", 
    label: "No cheat meals", 
    icon: Ban,
    description: "Stay disciplined"
  },
  { 
    id: "sleepOnTime", 
    label: "Sleep on time", 
    icon: MoonIcon,
    description: "Recovery is key"
  },
];

export function DailyChecklist() {
  const [checklist, setChecklist] = useState<DailyChecklistType>(
    storage.getTodayRecord().checklist
  );

  const toggleItem = (id: keyof DailyChecklistType) => {
    const updated = { ...checklist, [id]: !checklist[id] };
    setChecklist(updated);
    storage.updateTodayChecklist(updated);
    
    // Trigger re-render in parent components
    window.dispatchEvent(new Event('checklistUpdated'));
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = checklistItems.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Daily Checklist
        </h2>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {completedCount}/{totalCount}
        </div>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {checklistItems.map((item) => {
            const Icon = item.icon;
            const isCompleted = checklist[item.id];

            return (
              <motion.button
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleItem(item.id)}
                className={`w-full p-5 rounded-3xl border-2 backdrop-blur-xl transition-all duration-300 transform ${
                  isCompleted
                    ? "bg-gradient-to-br from-blue-500/85 via-blue-600/85 to-blue-700/85 border-blue-400/40 dark:from-blue-600/85 dark:to-blue-700/85 dark:border-blue-400/30 shadow-lg shadow-blue-500/30 scale-98"
                    : "bg-white/45 dark:bg-gray-900/45 border-white/40 dark:border-gray-700/40 hover:bg-white/55 dark:hover:bg-gray-900/55 hover:border-white/50 dark:hover:border-gray-700/50 hover:shadow-lg hover:scale-105"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-white/30 backdrop-blur-sm"
                        : "bg-white/20 dark:bg-white/10 backdrop-blur-sm"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="size-6 text-white" strokeWidth={3} />
                    ) : (
                      <Icon className={`size-6 ${
                        isCompleted ? "text-white" : "text-gray-600 dark:text-gray-400"
                      }`} />
                    )}
                  </div>

                  <div className="flex-1 text-left">
                    <div
                      className={`font-semibold ${
                        isCompleted
                          ? "text-white"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {item.label}
                    </div>
                    <div
                      className={`text-sm ${
                        isCompleted
                          ? "text-white/80"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>

                  <motion.div
                    initial={false}
                    animate={{
                      scale: isCompleted ? [1, 1.2, 1] : 1,
                      rotate: isCompleted ? [0, 10, -10, 0] : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                      isCompleted
                        ? "bg-white border-white"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    {isCompleted && (
                      <Check className="size-5 text-blue-600" strokeWidth={3} />
                    )}
                  </motion.div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
