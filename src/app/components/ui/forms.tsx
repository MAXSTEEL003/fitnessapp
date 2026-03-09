import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface InputFieldProps {
  label: string;
  type: string;
  value?: string | number;
  onChange: (value: string) => void;
  icon?: LucideIcon;
  step?: string;
  placeholder?: string;
  required?: boolean;
}

export function InputField({ 
  label, 
  type, 
  value, 
  onChange, 
  icon: Icon, 
  step,
  placeholder,
  required = false 
}: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
        )}
        <input
          type={type}
          value={value}
          step={step}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 
            rounded-xl py-3 text-gray-900 dark:text-white placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${Icon ? "px-10" : "px-4"}
          `}
          required={required}
        />
      </div>
    </div>
  );
}

interface GlassInputFieldProps {
  label: string;
  type: string;
  value?: string | number;
  onChange: (value: string) => void;
  icon?: LucideIcon;
  step?: string;
  placeholder?: string;
  required?: boolean;
}

export function GlassInputField({ 
  label, 
  type, 
  value, 
  onChange, 
  icon: Icon, 
  step,
  placeholder,
  required = false 
}: GlassInputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/80 mb-2">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/60" />
        )}
        <input
          type={type}
          value={value}
          step={step}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full bg-white/20 border border-white/30 rounded-xl py-3
            text-white placeholder-white/50
            focus:outline-none focus:ring-2 focus:ring-white/50
            ${Icon ? "px-10" : "px-4"}
          `}
          required={required}
        />
      </div>
    </div>
  );
}

interface SwitchFieldProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function SwitchField({ label, description, checked, onChange }: SwitchFieldProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-gray-900 dark:text-white">{label}</div>
        {description && (
          <div className="text-sm text-gray-600 dark:text-gray-400">{description}</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? "translate-x-6" : "translate-x-1"}
          `}
        />
      </button>
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  size?: "sm" | "md";
}

export function Badge({ children, variant = "default", size = "md" }: BadgeProps) {
  const variantStyles = {
    default: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    success: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    warning: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
    danger: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]}`}>
      {children}
    </span>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <Icon className="size-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action}
    </motion.div>
  );
}
