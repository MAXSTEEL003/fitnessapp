import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader, PageContainer } from "./ui/navigation";
import { Card, InfoRow } from "./ui/cards";
import { ActionButton, Button } from "./ui/buttons";
import { MiniStat } from "./ui/progress";
import { InputField } from "./ui/forms";
import { storage } from "../../config/storage";
import { useAuth } from "../../config/auth-context";
import { UserProfile } from "../types";
import { calculateRemainingCarbs } from "../utils/nutrition-calculations";
import { 
  Settings as SettingsIcon, 
  User, 
  Edit, 
  Trophy, 
  Trash2, 
  LogOut, 
  Target, 
  Flame, 
  Beef, 
  Footprints, 
  Check, 
  X, 
  Sliders,
  Scale,
  Ruler
} from "lucide-react";

export function Settings() {
  const navigate = useNavigate();
  const { signout } = useAuth();
  const [state, setState] = useState(() => storage.get());
  const [showEditTargets, setShowEditTargets] = useState(false);

  const profile = state?.profile;
  const profileName = profile?.name || "User";

  // Targets Editor state
  const [targetCalories, setTargetCalories] = useState<number>(profile?.targetCalories || 2100);
  const [targetProtein, setTargetProtein] = useState<number>(profile?.targetProtein || 150);
  const [targetFats, setTargetFats] = useState<number>(profile?.targetFats || 60);
  const [targetSteps, setTargetSteps] = useState<number>(profile?.targetSteps || 10000);
  const [targetCarbs, setTargetCarbs] = useState<number>(
    profile?.targetCarbs || calculateRemainingCarbs(targetCalories, targetProtein, targetFats)
  );
  const [currentWeight, setCurrentWeight] = useState<number>(profile?.currentWeight || 80);
  const [goalWeight, setGoalWeight] = useState<number>(profile?.goalWeight || 70);
  const [currentWaist, setCurrentWaist] = useState<number>(profile?.currentWaist || 85);

  const handleOpenEditTargets = () => {
    if (profile) {
      setTargetCalories(profile.targetCalories || 2100);
      setTargetProtein(profile.targetProtein || 150);
      setTargetFats(profile.targetFats || 60);
      setTargetSteps(profile.targetSteps || 10000);
      setTargetCarbs(profile.targetCarbs || calculateRemainingCarbs(profile.targetCalories || 2100, profile.targetProtein || 150, profile.targetFats || 60));
      setCurrentWeight(profile.currentWeight || 80);
      setGoalWeight(profile.goalWeight || 70);
      setCurrentWaist(profile.currentWaist || 85);
    }
    setShowEditTargets(true);
  };

  const handleCaloriesOrMacrosChange = (cals: number, prot: number, fats: number) => {
    setTargetCalories(cals);
    setTargetProtein(prot);
    setTargetFats(fats);
    const suggestedCarbs = calculateRemainingCarbs(cals, prot, fats);
    setTargetCarbs(suggestedCarbs);
  };

  const handleSaveTargets = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const updatedProfile: UserProfile = {
      ...profile,
      targetCalories: Number(targetCalories) || 2100,
      targetProtein: Number(targetProtein) || 150,
      targetFats: Number(targetFats) || 60,
      targetCarbs: Number(targetCarbs) || 240,
      targetSteps: Number(targetSteps) || 10000,
      currentWeight: Number(currentWeight) || profile.currentWeight,
      goalWeight: Number(goalWeight) || profile.goalWeight,
      currentWaist: currentWaist ? Number(currentWaist) : profile.currentWaist,
    };

    storage.updateProfile(updatedProfile);
    setState(storage.get());
    setShowEditTargets(false);
  };

  const handleResetData = () => {
    if (confirm("Are you sure you want to reset all data? This will clear local cache and start fresh.")) {
      localStorage.clear();
      navigate("/onboarding");
    }
  };

  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      try {
        await signout();
        navigate("/signin");
      } catch (error) {
        console.error("Sign out error:", error);
      }
    }
  };

  const daysCompleted = storage.getDaysCompleted();
  const currentDay = storage.getCurrentDay();

  return (
    <div className="min-h-screen">
      <PageContainer padding>
        <PageHeader 
          title="Settings" 
          subtitle="Configure targets & manage account"
          icon={SettingsIcon} 
        />

        {/* Profile & Target Summary Card */}
        <Card delay={0.1} className="mt-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <User className="size-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {profileName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Day {currentDay} • {daysCompleted} days completed
              </p>
            </div>
            <button
              onClick={handleOpenEditTargets}
              className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
              title="Edit Targets"
            >
              <Sliders className="size-5" />
            </button>
          </div>

          {profile && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Body & Goal Targets
              </div>
              <InfoRow label="Start Weight" value={`${profile.startWeight} kg`} />
              <InfoRow label="Current Weight" value={`${profile.currentWeight} kg`} />
              <InfoRow label="Goal Weight" value={`${profile.goalWeight} kg`} />
              {profile.currentWaist && (
                <InfoRow label="Current Waist" value={`${profile.currentWaist} cm`} />
              )}
              
              <div className="pt-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Daily Nutrition & Macro Targets
              </div>
              <InfoRow label="Daily Calories" value={`${profile.targetCalories || 2100} kcal`} />
              <InfoRow label="Protein Target" value={`${profile.targetProtein || 150}g`} />
              <InfoRow label="Carbohydrates Target" value={`${profile.targetCarbs || 240}g`} />
              <InfoRow label="Fats Target" value={`${profile.targetFats || 60}g`} />
              <InfoRow label="Daily Steps Goal" value={(profile.targetSteps || 10000).toLocaleString()} />
              <InfoRow label="Water Target" value={`${profile.targetWater || 3}L`} border={false} />
            </div>
          )}
        </Card>

        {/* Achievements Card */}
        <Card gradient delay={0.2} className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="size-6 text-white" />
            <h3 className="text-lg font-bold text-white">Consistency & Streaks</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <MiniStat label="Days Done" value={daysCompleted} color="blue" />
            <MiniStat label="Streak" value={state?.currentStreak || 0} color="green" />
            <MiniStat label="Best" value={state?.longestStreak || 0} color="purple" />
          </div>
        </Card>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 mt-6"
        >
          <ActionButton
            icon={Sliders}
            label="Edit Targets & Macros"
            description="Adjust calories, protein, fat, and step goals"
            onClick={handleOpenEditTargets}
          />

          <ActionButton
            icon={Edit}
            label="Full Profile Onboarding"
            description="Update full onboarding questionnaire"
            onClick={() => navigate("/onboarding")}
          />

          <ActionButton
            icon={Trash2}
            label="Reset Local Data"
            description="Clear cache and re-sync"
            onClick={handleResetData}
            variant="danger"
          />

          <ActionButton
            icon={LogOut}
            label="Sign Out"
            description="Log out of authenticated Firebase account"
            onClick={handleSignOut}
            variant="danger"
          />
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            Personal Fitness & Body Recomposition Tracker
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Asia/Kolkata timezone • Firebase synced
          </p>
        </motion.div>

        {/* ---------------- EDIT TARGETS MODAL ---------------- */}
        <AnimatePresence>
          {showEditTargets && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowEditTargets(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800 p-6 z-10 max-h-[88vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Edit Fitness Targets
                    </h3>
                    <p className="text-xs text-gray-500">
                      Customize your daily nutrition and activity goals
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEditTargets(false)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveTargets} className="space-y-4">
                  {/* Calorie & Macro Section */}
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-200/50 dark:border-blue-800/40 space-y-3">
                    <InputField
                      label="Daily Calorie Target (kcal)"
                      type="number"
                      value={targetCalories}
                      onChange={(v) => handleCaloriesOrMacrosChange(Number(v), targetProtein, targetFats)}
                      required
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <InputField
                        label="Protein Target (g)"
                        type="number"
                        value={targetProtein}
                        onChange={(v) => handleCaloriesOrMacrosChange(targetCalories, Number(v), targetFats)}
                        required
                      />
                      <InputField
                        label="Fat Target (g)"
                        type="number"
                        value={targetFats}
                        onChange={(v) => handleCaloriesOrMacrosChange(targetCalories, targetProtein, Number(v))}
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Carbohydrates Target (g)
                        </label>
                        <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                          Calculated: {calculateRemainingCarbs(targetCalories, targetProtein, targetFats)}g
                        </span>
                      </div>
                      <input
                        type="number"
                        value={targetCarbs}
                        onChange={(e) => setTargetCarbs(Number(e.target.value))}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Activity and Steps */}
                  <InputField
                    label="Daily Step Goal"
                    type="number"
                    value={targetSteps}
                    onChange={(v) => setTargetSteps(Number(v))}
                    icon={Footprints}
                    required
                  />

                  {/* Body Goals */}
                  <div className="grid grid-cols-3 gap-2">
                    <InputField
                      label="Current Wt (kg)"
                      type="number"
                      step="0.1"
                      value={currentWeight}
                      onChange={(v) => setCurrentWeight(Number(v))}
                    />
                    <InputField
                      label="Goal Wt (kg)"
                      type="number"
                      step="0.1"
                      value={goalWeight}
                      onChange={(v) => setGoalWeight(Number(v))}
                    />
                    <InputField
                      label="Waist (cm)"
                      type="number"
                      step="0.5"
                      value={currentWaist}
                      onChange={(v) => setCurrentWaist(Number(v))}
                    />
                  </div>

                  <div className="flex gap-3 pt-3">
                    <Button
                      type="button"
                      variant="ghost"
                      fullWidth
                      onClick={() => setShowEditTargets(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" fullWidth icon={Check}>
                      Save Targets
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </PageContainer>
    </div>
  );
}
