import { useNavigate, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { IconButton } from "./buttons";
import { Home, UtensilsCrossed, Dumbbell, Settings as SettingsIcon, Moon, Sun, LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: UtensilsCrossed, label: "Diet", path: "/diet" },
  { icon: Dumbbell, label: "Gym", path: "/gym" },
  { icon: SettingsIcon, label: "Settings", path: "/settings" },
];

export function MobileNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white/50 dark:bg-gray-950/50 backdrop-blur-2xl border-t border-white/30 dark:border-gray-700/30 z-50 shadow-2xl shadow-black/20"
    >
      <div className="max-w-lg mx-auto px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => (
          <IconButton
            key={item.path}
            icon={item.icon}
            label={item.label}
            onClick={() => navigate(item.path)}
            variant={location.pathname === item.path ? "active" : "default"}
            size="sm"
          />
        ))}
        
        {mounted && (
          <IconButton
            icon={theme === "dark" ? Sun : Moon}
            label="Theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            size="sm"
          />
        )}
      </div>
    </motion.nav>
  );
}

/**
 * PageHeader Component
 * Displays a page title with optional subtitle, gradient background, icon, and action button
 */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  gradient?: boolean;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, gradient, icon: Icon, action }: PageHeaderProps) {
  return (
    <header className={`
      ${gradient 
        ? "bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 dark:from-blue-700 dark:via-blue-800 dark:to-purple-900 shadow-2xl shadow-blue-500/20" 
        : "bg-gradient-to-br from-white/60 to-white/40 dark:from-gray-950 dark:to-gray-900 backdrop-blur-md border-b border-white/20 dark:border-gray-700/30"
      }
      px-6 pt-12 pb-32 relative overflow-hidden
    `}>
      {/* Decorative gradient orbs */}
      {gradient && (
        <>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full blur-3xl -mr-40 -mt-20" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl -ml-40 -mb-20" />
        </>
      )}
      <div className="max-w-lg mx-auto relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {Icon && (
              <Icon className={`size-8 mb-3 ${
                gradient ? "text-white" : "text-blue-600 dark:text-blue-400"
              }`} />
            )}
            <h1 className={`text-4xl font-bold mb-1 drop-shadow-lg ${
              gradient ? "text-white" : "text-gray-900 dark:text-white"
            }`}>
              {title}
            </h1>
            {subtitle && (
              <p className={`text-base font-medium drop-shadow-md ${
                gradient ? "text-white/90" : "text-gray-600 dark:text-gray-300"
              }`}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      </div>
    </header>
  );
}

/**
 * PageContainer Component
 * Main content wrapper with responsive padding and bottom spacing for navigation
 */
interface PageContainerProps {
  children: React.ReactNode;
  padding?: boolean;
}

export function PageContainer({ children, padding = false }: PageContainerProps) {
  return (
    <main className={`max-w-lg mx-auto pb-24 ${padding ? "px-6" : ""} bg-gradient-to-b from-white/5 to-transparent dark:from-white/5 dark:to-transparent`}>
      {children}
    </main>
  );
}