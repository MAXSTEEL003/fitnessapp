import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { storage } from "../../config/storage";
import { UserProfile } from "../types";
import { Button } from "./ui/buttons";
import { GlassInputField } from "./ui/forms";
import { Card } from "./ui/cards";
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
  User as UserIcon
} from "lucide-react";

export function Onboarding() {
  const navigate = useNavigate();
  const existingProfile = storage.get()?.profile;
  
  const [formData, setFormData] = useState<Partial<UserProfile>>(
    existingProfile || {
      name: "",
      startWeight: 80,
      currentWeight: 80,
      goalWeight: 70,
      startDate: new Date().toISOString().split('T')[0],
      targetSteps: 13000,
      targetProtein: 150,
      targetWater: 3,
      wakeUpTime: "06:00",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.startWeight || !formData.currentWeight || !formData.goalWeight) {
      alert("Please fill in all required fields");
      return;
    }

    storage.updateProfile(formData as UserProfile);
    navigate("/");
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-800 dark:to-black px-6 py-12">
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
            className="text-4xl font-bold text-white mb-2"
          >
            Fitness Shred
          </motion.h1>
          <p className="text-blue-100">
            {existingProfile ? "Update your profile" : "Let's get started with your journey"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
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

          {/* Weight Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Scale className="size-5" />
              Weight Goals
            </h3>
            <div className="space-y-4">
              <GlassInputField
                label="Start Weight (kg)"
                type="number"
                value={formData.startWeight}
                onChange={(value) => setFormData({ ...formData, startWeight: Number(value) })}
                icon={Scale}
                required
              />
              <GlassInputField
                label="Current Weight (kg)"
                type="number"
                value={formData.currentWeight}
                onChange={(value) => setFormData({ ...formData, currentWeight: Number(value) })}
                icon={Scale}
                required
              />
              <GlassInputField
                label="Goal Weight (kg)"
                type="number"
                value={formData.goalWeight}
                onChange={(value) => setFormData({ ...formData, goalWeight: Number(value) })}
                icon={Target}
                required
              />
            </div>
          </motion.div>

          {/* Start Date */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="size-5" />
              Start Date
            </h3>
            <GlassInputField
              label="Program Start Date"
              type="date"
              value={formData.startDate}
              onChange={(value) => setFormData({ ...formData, startDate: value })}
              icon={Calendar}
              required
            />
          </motion.div>

          {/* Daily Targets */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20"
          >
            <h3 className="text-lg font-bold text-white mb-4">Daily Targets</h3>
            <div className="space-y-4">
              <GlassInputField
                label="Steps Goal"
                type="number"
                value={formData.targetSteps}
                onChange={(value) => setFormData({ ...formData, targetSteps: Number(value) })}
                icon={Footprints}
                required
              />
              <GlassInputField
                label="Protein (grams)"
                type="number"
                value={formData.targetProtein}
                onChange={(value) => setFormData({ ...formData, targetProtein: Number(value) })}
                icon={Beef}
                required
              />
              <GlassInputField
                label="Water (liters)"
                type="number"
                step="0.5"
                value={formData.targetWater}
                onChange={(value) => setFormData({ ...formData, targetWater: Number(value) })}
                icon={Droplets}
                required
              />
              <GlassInputField
                label="Wake Up Time"
                type="time"
                value={formData.wakeUpTime}
                onChange={(value) => setFormData({ ...formData, wakeUpTime: value })}
                icon={Clock}
                required
              />
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
              {existingProfile ? "Update Profile" : "Start My Journey"}
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