import { useEffect, useRef } from "react";
import { motion } from "motion/react";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  label?: string;
}

export function ProgressRing({ 
  progress, 
  size = 200, 
  strokeWidth = 12,
  showPercentage = true,
  label 
}: ProgressRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const progressRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size - strokeWidth) / 2;

    const animate = () => {
      progressRef.current += (progress - progressRef.current) * 0.1;

      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Background ring with enhanced depth
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(229, 231, 235, 0.15)";
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowColor = "transparent";

      // Progress ring with enhanced 3D gradient
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (2 * Math.PI * progressRef.current) / 100;

      // Create radial gradient for 3D depth
      const radialGradient = ctx.createRadialGradient(centerX, centerY, radius - strokeWidth, centerX, centerY, radius + strokeWidth);
      radialGradient.addColorStop(0, "#60a5fa");
      radialGradient.addColorStop(0.5, "#3b82f6");
      radialGradient.addColorStop(1, "#1d4ed8");

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.strokeStyle = radialGradient;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(59, 130, 246, 0.4)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 5;
      ctx.stroke();

      if (Math.abs(progress - progressRef.current) > 0.1) {
        animationRef.current = requestAnimationFrame(animate);
      } else if (Math.abs(progress - progressRef.current) <= 0.1) {
        progressRef.current = progress;
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [progress, size, strokeWidth]);

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      {/* 3D Background Glow */}
      <div 
        className="absolute rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/10 blur-3xl"
        style={{ 
          width: size + 40, 
          height: size + 40,
          filter: "blur(30px)"
        }}
      />
      
      {/* Main Ring Container with Shadow */}
      <div 
        className="relative" 
        style={{ 
          width: size, 
          height: size,
          boxShadow: "0 20px 60px rgba(59, 130, 246, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.3)",
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)"
        }}
      >
        {/* Top Highlight for 3D Effect */}
        <div 
          className="absolute top-0 left-1/4 right-1/4 h-1 rounded-full bg-white/30 blur-md"
          style={{ opacity: 0.6 }}
        />
        
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            display: "block",
            filter: "drop-shadow(0 10px 20px rgba(59, 130, 246, 0.1))"
          }}
          className="absolute inset-0"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showPercentage && (
            <>
              <motion.div
                key={progress}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl font-bold text-gray-900 dark:text-white drop-shadow-lg"
              >
                {Math.round(progress)}%
              </motion.div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">
                {label || "Complete"}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProgressBarProps {
  progress: number;
  height?: "sm" | "md" | "lg";
  showLabel?: boolean;
  color?: "blue" | "green" | "yellow" | "red";
  animated?: boolean;
}

export function ProgressBar({ 
  progress, 
  height = "md",
  showLabel = false,
  color = "blue",
  animated = true 
}: ProgressBarProps) {
  const heightStyles = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const colorStyles = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-yellow-600",
    red: "from-red-500 to-red-600",
  };

  return (
    <div className="w-full">
      <div className={`w-full bg-white/30 dark:bg-gray-800/30 rounded-full overflow-hidden ${heightStyles[height]} shadow-inner`}>
        <motion.div
          initial={animated ? { width: 0 } : { width: `${progress}%` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${colorStyles[color]} shadow-lg shadow-blue-500/30 rounded-full`}
        />
      </div>
      {showLabel && (
        <div className="text-right mt-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          {progress}%
        </div>
      )}
    </div>
  );
}

interface StatBadgeProps {
  icon: React.ElementType;
  value: string | number;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
}

export function StatBadge({ icon: Icon, value, color = "blue" }: StatBadgeProps) {
  const colorStyles = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    yellow: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
    red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring" }}
      className={`${colorStyles[color]} px-4 py-2 rounded-full flex items-center gap-2`}
    >
      <Icon className="size-5" />
      <span className="text-xl font-bold">{value}</span>
    </motion.div>
  );
}

interface MiniStatProps {
  label: string;
  value: string | number;
  color?: "blue" | "green" | "purple";
}

export function MiniStat({ label, value, color = "blue" }: MiniStatProps) {
  const colorStyles = {
    blue: "text-blue-600 dark:text-blue-400",
    green: "text-green-600 dark:text-green-400",
    purple: "text-purple-600 dark:text-purple-400",
  };

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${colorStyles[color]}`}>
        {value}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
        {label}
      </div>
    </div>
  );
}
