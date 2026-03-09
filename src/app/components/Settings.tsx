import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { PageHeader, PageContainer } from "./ui/navigation";
import { Card, InfoRow } from "./ui/cards";
import { ActionButton } from "./ui/buttons";
import { MiniStat } from "./ui/progress";
import { storage } from "../../config/storage";
import { useAuth } from "../../config/auth-context";
import { 
  Settings as SettingsIcon, 
  User, 
  Edit,
  Trophy,
  Trash2,
  LogOut
} from "lucide-react";

export function Settings() {
  const navigate = useNavigate();
  const { signout } = useAuth();
  const [state] = useState(() => storage.get());
  const profile = state?.profile;
  const profileName = profile?.name || "User";

  const handleEditProfile = () => {
    navigate("/onboarding");
  };

  const handleResetData = () => {
    if (confirm("Are you sure you want to reset all data? This will delete your progress and cannot be undone.")) {
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
        <PageHeader title="Settings" icon={SettingsIcon} />

        {/* Profile Card */}
        <Card delay={0.1}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <User className="size-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {profileName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Day {currentDay} • {daysCompleted} days completed
              </p>
            </div>
          </div>

          {profile && (
            <div className="space-y-3">
              {profile.name && <InfoRow label="Name" value={profile.name} />}
              <InfoRow label="Start Weight" value={`${profile.startWeight} kg`} />
              <InfoRow label="Current Weight" value={`${profile.currentWeight} kg`} />
              <InfoRow label="Goal Weight" value={`${profile.goalWeight} kg`} />
              <InfoRow label="Daily Steps" value={profile.targetSteps.toLocaleString()} />
              <InfoRow label="Protein Target" value={`${profile.targetProtein}g`} />
              <InfoRow label="Water Target" value={`${profile.targetWater}L`} border={false} />
            </div>
          )}
        </Card>

        {/* Stats Card */}
        <Card gradient delay={0.2} className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="size-6 text-white" />
            <h3 className="text-lg font-bold text-white">Achievements</h3>
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
            icon={Edit}
            label="Edit Profile"
            description="Update your goals and targets"
            onClick={handleEditProfile}
          />

          <ActionButton
            icon={Trash2}
            label="Reset All Data"
            description="Start fresh from the beginning"
            onClick={handleResetData}
            variant="danger"
          />

          <ActionButton
            icon={LogOut}
            label="Sign Out"
            description="Log out of your account"
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
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Fitness Shred v1.0
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Your fitness accountability partner
          </p>
        </motion.div>
      </PageContainer>
    </div>
  );
}