import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  fullWidth = false,
  disabled = false,
  className = "",
}: ButtonProps) {
  const baseStyles = "font-semibold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm transform";
  
  const variantStyles = {
    primary: "bg-gradient-to-br from-blue-500/85 to-blue-600/85 text-white hover:from-blue-600/95 hover:to-blue-700/95 dark:bg-gradient-to-br dark:from-blue-600/85 dark:to-blue-700/85 dark:hover:from-blue-700/95 dark:hover:to-blue-800/95 border border-blue-400/30 dark:border-blue-400/30 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105",
    secondary: "bg-white/45 dark:bg-gray-800/45 text-gray-900 dark:text-white border-2 border-white/40 dark:border-gray-700/40 hover:bg-white/55 dark:hover:bg-gray-800/55 hover:border-blue-400/40 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300",
    danger: "bg-red-500/40 text-red-600 dark:text-red-400 border border-red-500/50 hover:bg-red-500/50 backdrop-blur-sm shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300",
    ghost: "bg-white/30 dark:bg-gray-800/40 text-gray-900 dark:text-white hover:bg-white/45 dark:hover:bg-gray-800/60 border border-white/25 dark:border-gray-700/40 backdrop-blur-sm shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300",
  };

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {Icon && iconPosition === "left" && <Icon className="size-5" />}
      {children}
      {Icon && iconPosition === "right" && <Icon className="size-5" />}
    </motion.button>
  );
}

interface IconButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  label?: string;
  variant?: "default" | "active";
  size?: "sm" | "md" | "lg";
}

export function IconButton({ 
  icon: Icon, 
  onClick, 
  label, 
  variant = "default",
  size = "md" 
}: IconButtonProps) {
  const sizeStyles = {
    sm: { button: "px-3 py-2", icon: "size-4", text: "text-xs" },
    md: { button: "px-4 py-2", icon: "size-6", text: "text-xs" },
    lg: { button: "px-6 py-3", icon: "size-8", text: "text-sm" },
  };

  const isActive = variant === "active";

  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 ${sizeStyles[size].button} rounded-xl transition-all
        ${isActive 
          ? "text-blue-600 dark:text-blue-400" 
          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        }
      `}
    >
      <Icon className={sizeStyles[size].icon} strokeWidth={isActive ? 2.5 : 2} />
      {label && (
        <span className={`${sizeStyles[size].text} font-medium`}>{label}</span>
      )}
    </button>
  );
}

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  description: string;
  onClick: () => void;
  variant?: "default" | "danger";
}

export function ActionButton({ 
  icon: Icon, 
  label, 
  description, 
  onClick,
  variant = "default" 
}: ActionButtonProps) {
  const colorScheme = variant === "danger" 
    ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:border-red-500 dark:hover:border-red-500"
    : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:border-blue-500 dark:hover:border-blue-500";

  return (
    <button
      onClick={onClick}
      className="w-full bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorScheme.split(" ").slice(0, 3).join(" ")}`}>
          <Icon className="size-5" />
        </div>
        <div className="text-left">
          <div className="font-semibold text-gray-900 dark:text-white">
            {label}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </div>
        </div>
      </div>
      <div className="size-5 text-gray-400">→</div>
    </button>
  );
}
