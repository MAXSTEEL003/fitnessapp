import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { storage } from "../../config/storage";
import { UserProfile } from "../types";
import { Button } from "./ui/buttons";
import { GlassInputField } from "./ui/forms";
import { getTodayDateString } from "../utils/date";
import { calculateRemainingCarbs } from "../utils/nutrition-calculations";
import { 
  Scale, 
  Target, 
  Calendar,
  Footprints,
  Beef,
  Droplets,
  Clock,
  ChevronRight,
  Trash2,
  User as UserIcon,
  Flame,
  Ruler
} from "lucide-react";

export function Onboarding() {
  const navigate = useNavigate();
  const existingProfile = storage.get()?.profile;
  
  const [formData, setFormData] = useState<Partial<UserProfile>>(
    existingProfile || {
      name: "",
      startWeight: 82,
      currentWeight: 82,
      goalWeight: 75,
      height: 168,
      age: 23,
      currentBodyFat: 30,
      currentWaist: 92,
      goalWaist: 82,
      startDate: getTodayDateString(),
      targetCalories: 2100,
      targetProtein: 150,
      targetFats: 60,
      targetCarbs: 240,
      targetSteps: 10000,
      targetWater: 3.5,
      wakeUpTime: "06:00",
    }
  );

  const handleCaloriesOrMacroChange = (cals: number, prot: number, fats: number) => {
    const calculatedCarbs = calculateRemainingCarbs(cals, prot, fats);
    setFormData((prev) => ({
      ...prev,
      targetCalories: cals,
      targetProtein: prot,
      targetFats: fats,
      targetCarbs: calculatedCarbs,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.startWeight || !formData.currentWeight || !formData.goalWeight) {
      alert("Please fill in all required fields");
      return;
    }

    const targetCalories = formData.targetCalories || 2100;
    const targetProtein = formData.targetProtein || 150;
    const targetFats = formData.targetFats || 60;
    const targetCarbs = formData.targetCarbs || calculateRemainingCarbs(targetCalories, targetProtein, targetFats);

    const fullProfile: UserProfile = {
      name: formData.name,
      startWeight: Number(formData.startWeight),
      currentWeight: Number(formData.currentWeight),
      goalWeight: Number(formData.goalWeight),
      currentWaist: formData.currentWaist ? Number(formData.currentWaist) : undefined,
      goalWaist: formData.goalWaist ? Number(formData.goalWaist) : undefined,
      startDate: formData.startDate || getTodayDateString(),
      targetCalories,
      targetProtein,
      targetFats,
      targetCarbs,
      targetSteps: Number(formData.targetSteps) || 10000,
      targetWater: Number(formData.targetWater) || 3,
      wakeUpTime: formData.wakeUpTime || "06:00",
    };

    storage.updateProfile(fullProfile);
    navigate("/");
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 dark:from-blue-900 dark:to-black px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
            className="text-4xl font-extrabold text-white mb-2"
          >
            Fitness Shred
          </motion.h1>
          <p className="text-blue-100 text-sm">
            {existingProfile ? "Update your personal profile & targets" : "Set up your personal fat loss & muscle retention goals"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white/10 backdrop-blur-lg p-5 rounded-2xl border border-white/20"
          >
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <UserIcon className="size-5" />
              Your Name
            </h3>
            <GlassInputField
              label="Full Name"
              type="text"
              value={formData.name || ""}
              onChange={(value) => setFormData({ ...formData, name: value })}
              icon={UserIcon}
              required
            />
          </motion.div>

          {/* Body Measurements Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg p-5 rounded-2xl border border-white/20"
          >
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Scale className="size-5" />
              Weight & Waist Goals
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <GlassInputField
                  label="Start Weight (kg)"
                  type="number"
                  step="0.1"
                  value={formData.startWeight}
                  onChange={(value) => setFormData({ ...formData, startWeight: Number(value) })}
                  icon={Scale}
                  required
                />
                <GlassInputField
                  label="Current Weight (kg)"
                  type="number"
                  step="0.1"
                  value={formData.currentWeight}
                  onChange={(value) => setFormData({ ...formData, currentWeight: Number(value) })}
                  icon={Scale}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <GlassInputField
                  label="Goal Weight (kg)"
                  type="number"
                  step="0.1"
                  value={formData.goalWeight}
                  onChange={(value) => setFormData({ ...formData, goalWeight: Number(value) })}
                  icon={Target}
                  required
                />
                <GlassInputField
                  label="Waist Size (cm)"
                  type="number"
                  step="0.5"
                  value={formData.currentWaist}
                  onChange={(value) => setFormData({ ...formData, currentWaist: Number(value) })}
                  icon={Ruler}
                />
              </div>
            </div>
          </motion.div>

          {/* Daily Calorie & Macro Targets */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg p-5 rounded-2xl border border-white/20"
          >
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Flame className="size-5" />
              Nutrition Targets (Fat Loss & Muscle Retention)
            </h3>
            <div className="space-y-3">
              <GlassInputField
                label="Daily Calorie Target (kcal)"
                type="number"
                value={formData.targetCalories || 2100}
                onChange={(value) => handleCaloriesOrMacroChange(Number(value), formData.targetProtein || 150, formData.targetFats || 60)}
                icon={Flame}
                required
              />

              <div className="grid grid-cols-3 gap-2">
                <GlassInputField
                  label="Protein (g)"
                  type="number"
                  value={formData.targetProtein || 150}
                  onChange={(value) => handleCaloriesOrMacroChange(formData.targetCalories || 2100, Number(value), formData.targetFats || 60)}
                  icon={Beef}
                  required
                />
                <GlassInputField
                  label="Fats (g)"
                  type="number"
                  value={formData.targetFats || 60}
                  onChange={(value) => handleCaloriesOrMacroChange(formData.targetCalories || 2100, formData.targetProtein || 150, Number(value))}
                  required
                />
                <GlassInputField
                  label="Carbs (g)"
                  type="number"
                  value={formData.targetCarbs || 240}
                  onChange={(value) => setFormData({ ...formData, targetCarbs: Number(value) })}
                  required
                />
              </div>
            </div>
          </motion.div>

          {/* Activity Targets */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-lg p-5 rounded-2xl border border-white/20"
          >
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Footprints className="size-5" />
              Activity & Hydration
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <GlassInputField
                  label="Daily Steps Goal"
                  type="number"
                  value={formData.targetSteps || 10000}
                  onChange={(value) => setFormData({ ...formData, targetSteps: Number(value) })}
                  icon={Footprints}
                  required
                />
                <GlassInputField
                  label="Water Goal (L)"
                  type="number"
                  step="0.5"
                  value={formData.targetWater || 3}
                  onChange={(value) => setFormData({ ...formData, targetWater: Number(value) })}
                  icon={Droplets}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <GlassInputField
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(value) => setFormData({ ...formData, startDate: value })}
                  icon={Calendar}
                  required
                />
                <GlassInputField
                  label="Wake Up Time"
                  type="time"
                  value={formData.wakeUpTime || "06:00"}
                  onChange={(value) => setFormData({ ...formData, wakeUpTime: value })}
                  icon={Clock}
                  required
                />
              </div>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              icon={ChevronRight}
              iconPosition="right"
              fullWidth
            >
              {existingProfile ? "Save & Update Profile" : "Start Tracking"}
            </Button>
          </motion.div>

          {/* Reset Button (only show if profile exists) */}
          {existingProfile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                type="button"
                onClick={handleReset}
                variant="danger"
                size="md"
                icon={Trash2}
                fullWidth
              >
                Reset All Data
              </Button>
            </motion.div>
          )}
        </form>
      </motion.div>
    </div>
  );
}
