import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib/cn";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "danger" | "primary" | "default";
  showCancel?: boolean;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  onConfirm,
  variant = "default",
  showCancel = true,
}: DialogProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />

          {/* Dialog Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-[320px] bg-white dark:bg-surface-900 rounded-[32px] p-8 shadow-2xl border border-surface-100 dark:border-surface-800 flex flex-col items-center text-center"
          >
            <h3 className="text-[20px] font-black text-surface-950 dark:text-white leading-tight tracking-tight mb-2">
              {title}
            </h3>
            {description && (
              <p className="text-[14px] font-bold text-surface-500 dark:text-surface-400 leading-relaxed mb-8">
                {description}
              </p>
            )}

            <div className="flex flex-col w-full gap-2">
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={cn(
                  "w-full h-12 rounded-2xl font-black text-[15px] transition-all active:scale-95",
                  variant === "danger"
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-surface-950 dark:bg-white text-white dark:text-surface-950 hover:opacity-90"
                )}
              >
                {confirmLabel}
              </button>
              {showCancel && (
                <button
                  onClick={onClose}
                  className="w-full h-12 rounded-2xl font-black text-[15px] text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-all active:scale-95"
                >
                  {cancelLabel}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
