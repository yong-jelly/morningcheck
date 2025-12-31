import { motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";

/**
 * @component ConditionBar
 * @description 팀원의 컨디션 점수를 시각적으로 보여주거나 선택할 수 있는 게이지 바 컴포넌트입니다.
 * 
 * @example
 * // 단순 표시용 (View Mode)
 * <ConditionBar value={8} />
 * 
 * @example
 * // 선택용 (Input Mode)
 * <ConditionBar 
 *   value={condition} 
 *   onChange={(val) => setCondition(val)} 
 *   isEditable 
 * />
 */

interface ConditionBarProps {
  value: number;
  onChange?: (value: number) => void;
  isEditable?: boolean;
  className?: string;
}

export function ConditionBar({ value, onChange, isEditable = false, className }: ConditionBarProps) {
  const percentage = (value / 10) * 100;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative h-3 w-full bg-surface-100 dark:bg-surface-900 rounded-full overflow-visible">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#EB5757] via-[#F2C94C] to-[#27AE60] rounded-full opacity-90 shadow-inner" />
        
        {/* Pointer / Indicator */}
        <motion.div 
          initial={false}
          animate={{ left: `${percentage}%` }}
          transition={{ duration: isEditable ? 0.1 : 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 -ml-3 bg-white dark:bg-surface-800 border-[4px] border-[#A4C8FF] rounded-full shadow-lg z-10 pointer-events-none"
        />

        {/* Input Overlay (Only when editable) */}
        {isEditable && (
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={value}
            onChange={(e) => onChange?.(parseInt(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
        )}
      </div>
      
      {/* Labels */}
      <div className="flex justify-between px-1 text-[10px] font-black text-surface-400 uppercase tracking-widest">
        <span>나쁨</span>
        <span>보통</span>
        <span>최상</span>
      </div>
    </div>
  );
}
