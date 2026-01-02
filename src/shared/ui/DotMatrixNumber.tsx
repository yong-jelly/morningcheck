import { motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";

// 5x7 Dot Matrix patterns for numbers 0-9
export const DOT_PATTERNS: Record<number, number[][]> = {
  0: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  1: [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
  ],
  2: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  3: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  4: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
  ],
  5: [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  6: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  7: [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 1, 0, 0, 0],
  ],
  8: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  9: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
};

interface DotMatrixNumberProps {
  value: number;
  color?: string;
  dotClassName?: string;
  className?: string;
  dotSize?: "sm" | "md" | "lg";
}

/**
 * @component DotMatrixNumber
 * @description 숫자를 5x7 도트 매트릭스 형태로 시각화하는 컴포넌트입니다.
 */
export function DotMatrixNumber({ 
  value, 
  color = "white", 
  dotClassName, 
  className,
  dotSize = "md" 
}: DotMatrixNumberProps) {
  // If value is 10, we show 1 and 0 side by side.
  const digits = value === 10 ? [1, 0] : [Math.max(0, Math.min(9, Math.floor(value)))];
  
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3 sm:w-4 sm:h-4",
    lg: "w-4 h-4 sm:w-6 sm:h-6"
  };

  const gapClasses = {
    sm: "gap-1",
    md: "gap-1.5 sm:gap-2",
    lg: "gap-2.5 sm:gap-3"
  };

  return (
    <div className={cn("flex gap-3 items-center justify-center", value === 10 ? "scale-90" : "scale-100", className)}>
      {digits.map((digit, idx) => (
        <div key={idx} className={cn("grid grid-cols-5", gapClasses[dotSize])}>
          {DOT_PATTERNS[digit].map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <motion.div
                key={`${rowIndex}-${colIndex}`}
                initial={false}
                animate={{
                  opacity: 1,
                  scale: cell ? 1 : 0.95,
                }}
                className={cn("rounded-[2px] transition-colors", sizeClasses[dotSize], dotClassName)}
                style={{ backgroundColor: cell ? color : "rgba(255,255,255,0.1)" }}
              />
            ))
          )}
        </div>
      ))}
    </div>
  );
}
