import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useAppStore } from "@/shared/lib/store";
import { cn } from "@/shared/lib/cn";
import type { User } from "@/entities/project/model/types";

interface JoinProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function JoinProjectModal({ isOpen, onClose, onSuccess }: JoinProjectModalProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [userName, setUserName] = useState("");
  const joinProject = useAppStore((state) => state.joinProject);
  const { currentUser, setCurrentUser } = useAppStore();

  useEffect(() => {
    if (isOpen) {
      setInviteCode("");
      setUserName(currentUser?.name || "");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, currentUser]);

  const handleSubmit = () => {
    if (!inviteCode.trim() || !userName.trim()) return;

    const newUser: User = currentUser || {
      id: crypto.randomUUID(),
      name: userName.trim(),
    };

    const success = joinProject(inviteCode.trim().toUpperCase(), newUser);
    
    if (!currentUser) setCurrentUser(newUser);
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  const isValid = inviteCode.trim().length >= 4 && userName.trim() !== "";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white md:bg-black/40 md:backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative w-full h-full md:w-[480px] md:h-[85vh] md:rounded-[32px] overflow-hidden bg-white dark:bg-surface-900 flex flex-col border border-surface-100 dark:border-surface-800"
      >
        {/* Header */}
        <header className="shrink-0 border-b border-surface-100 dark:border-surface-800 safe-area-top">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full text-surface-500 transition-colors active:bg-surface-100 dark:active:bg-surface-800"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-[17px] font-bold tracking-tight text-surface-900 dark:text-white">프로젝트 참여하기</h1>
            </div>
            <div className="w-10" />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-10">
          <div className="max-w-md mx-auto space-y-10">
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-surface-400 uppercase tracking-widest px-2 py-1 bg-surface-50 dark:bg-surface-900 rounded-md">
                팀 합류하기
              </span>
              <h2 className="text-[28px] font-bold leading-tight tracking-tighter text-surface-900 dark:text-white">
                초대 코드를<br />입력해주세요
              </h2>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[14px] font-bold text-surface-900 dark:text-white ml-1">
                  내 이름
                </label>
                <input
                  autoFocus
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="홍길동"
                  className={cn(
                    "w-full h-14 text-[17px] font-bold rounded-2xl border-none transition-all px-4",
                    userName.trim() !== "" 
                      ? "bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700" 
                      : "bg-surface-50 dark:bg-surface-900 focus:bg-white dark:focus:bg-surface-800 focus:ring-2 focus:ring-surface-900 dark:focus:ring-white"
                  )}
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[14px] font-bold text-surface-900 dark:text-white ml-1">
                  초대 코드
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="예: ABC123XY"
                  className={cn(
                    "w-full h-14 text-[17px] font-bold rounded-2xl border-none transition-all px-4 uppercase tracking-widest",
                    inviteCode.trim() !== "" 
                      ? "bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700" 
                      : "bg-surface-50 dark:bg-surface-900 focus:bg-white dark:focus:bg-surface-800 focus:ring-2 focus:ring-surface-900 dark:focus:ring-white"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isValid) handleSubmit();
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="shrink-0 p-6 bg-white dark:bg-surface-900 border-t border-surface-100 dark:border-surface-800">
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={cn(
              "w-full h-16 flex items-center justify-center rounded-2xl font-bold text-[17px] transition-all duration-300",
              isValid
                ? "bg-surface-900 dark:bg-white text-white dark:text-surface-900 active:scale-[0.98]"
                : "bg-surface-100 dark:bg-surface-800 text-surface-400 cursor-not-allowed"
            )}
          >
            참여하기
          </button>
        </footer>
      </motion.div>
    </div>,
    document.body
  );
}
