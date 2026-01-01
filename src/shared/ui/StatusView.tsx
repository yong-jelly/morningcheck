import { motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";

interface StatusViewProps {
  icon?: string;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  requestedAt?: string;
  showIcon?: boolean;
  showButton?: boolean;
}

export function StatusView({
  icon,
  title,
  description,
  confirmLabel = "확인",
  onConfirm,
  requestedAt,
  showIcon = true,
  showButton = true,
}: StatusViewProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center space-y-8"
    >
      {showIcon && icon && (
        <div className="w-24 h-24 bg-surface-50 dark:bg-surface-800 rounded-[40px] flex items-center justify-center border border-surface-100 dark:border-surface-700 shadow-sm">
          <span className="text-5xl">{icon}</span>
        </div>
      )}
      
      <div className={cn("space-y-3 px-4", !showIcon && "pt-12")}>
        <h2 className="text-[24px] font-black text-surface-900 dark:text-white leading-tight tracking-tight">
          {title}
        </h2>
        <div className="space-y-1">
          <p className="text-[15px] font-bold text-surface-400 dark:text-surface-500 leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
          {requestedAt && (
            <p className="text-[12px] font-medium text-surface-400 opacity-60">
              요청 일시: {new Date(requestedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {showButton && onConfirm && (
        <div className="w-full px-8 pt-4">
          <button 
            onClick={onConfirm}
            className="w-full h-14 bg-surface-900 dark:bg-white text-white dark:text-surface-900 font-black rounded-[20px] text-[16px] active:scale-95 transition-all shadow-lg"
          >
            {confirmLabel}
          </button>
        </div>
      )}
    </motion.div>
  );
}
