import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  gradient?: boolean;
  hoverable?: boolean;
}

export function Card({ children, className = "", delay = 0, gradient = false, hoverable = false }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className={`
        ${gradient 
          ? "bg-gradient-to-br from-blue-500/85 via-blue-600/85 to-blue-700/85 dark:from-blue-600/85 dark:via-blue-700/85 dark:to-blue-800/85 backdrop-blur-xl" 
          : "bg-white/45 dark:bg-gray-900/45 backdrop-blur-xl"
        }
        p-6 rounded-3xl shadow-xl border 
        ${gradient 
          ? "border-white/30 dark:border-blue-400/20 shadow-blue-500/20" 
          : "border-white/40 dark:border-gray-700/40 shadow-black/10"
        }
        ${hoverable ? "hover:shadow-2xl hover:bg-white/55 dark:hover:bg-gray-900/55 hover:border-white/50 dark:hover:border-gray-700/50 transition-all duration-300 transform hover:scale-105" : ""}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delay?: number;
  variant?: "default" | "gradient";
}

export function StatCard({ icon: Icon, label, value, delay = 0, variant = "default" }: StatCardProps) {
  if (variant === "gradient") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className="bg-white/10 backdrop-blur-sm p-4 rounded-xl"
      >
        <div className="flex items-center gap-2 mb-2">
          <Icon className="size-4 text-blue-100" />
          <span className="text-xs font-medium text-blue-100">{label}</span>
        </div>
        <div className="text-2xl font-bold text-white">{value}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md p-4 rounded-xl shadow-sm border border-white/30 dark:border-gray-700/30"
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="size-4 text-gray-600 dark:text-gray-300" />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
    </motion.div>
  );
}

interface QuoteCardProps {
  quote: string;
  icon?: LucideIcon;
  delay?: number;
}

export function QuoteCard({ quote, icon: Icon, delay = 0 }: QuoteCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-gradient-to-br from-yellow-400/80 to-orange-500/80 dark:from-yellow-500/80 dark:to-orange-600/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/30 dark:border-orange-400/20"
    >
      <div className="flex gap-3">
        {Icon && <Icon className="size-6 text-white flex-shrink-0 mt-1" />}
        <p className="text-white font-medium italic leading-relaxed">
          "{quote}"
        </p>
      </div>
    </motion.div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export function SectionHeader({ title, subtitle, icon: Icon, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="size-6 text-blue-600 dark:text-blue-400" />}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string | number;
  border?: boolean;
}

export function InfoRow({ label, value, border = true }: InfoRowProps) {
  return (
    <div className={`flex justify-between items-center py-2 ${border ? "border-b border-gray-100 dark:border-gray-800" : ""}`}>
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}
