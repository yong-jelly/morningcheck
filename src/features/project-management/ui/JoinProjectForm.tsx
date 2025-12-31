import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useAppStore } from "@/shared/lib/store";
import { cn } from "@/shared/lib/cn";
import { sonner } from "sonner";
import type { User } from "@/entities/project/model/types";

interface JoinProjectFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function JoinProjectForm({ onClose, onSuccess }: JoinProjectFormProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [userName, setUserName] = useState("");
  const joinProject = useAppStore((state) => state.joinProject);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !userName.trim()) return;

    const newUser: User = {
      id: crypto.randomUUID(),
      name: userName.trim(),
    };

    const success = joinProject(inviteCode.trim().toUpperCase(), newUser);
    
    if (success) {
      setCurrentUser(newUser);
      onSuccess();
    } else {
      alert("유효하지 않은 초대 코드입니다.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-surface-800 p-6 rounded-2xl border border-surface-200 dark:border-surface-700 w-full"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-lg font-bold">Join Project</h2>
        <button onClick={onClose} className="p-1.5 hover:bg-surface-50 dark:hover:bg-surface-700 rounded-md transition-colors">
          <X className="w-4 h-4 text-surface-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest ml-1">
            Your Name
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="홍길동"
            className="w-full h-11 px-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 focus:border-primary-500 focus:ring-0 transition-all text-sm font-medium"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest ml-1">
            Invite Code
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="ABC123XY"
            className="w-full h-11 px-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 focus:border-primary-500 focus:ring-0 transition-all text-sm font-medium uppercase"
          />
        </div>

        <button
          type="submit"
          disabled={!inviteCode.trim() || !userName.trim()}
          className={cn(
            "w-full h-12 bg-primary-600 text-white text-sm font-bold rounded-xl mt-2 transition-all active:scale-98",
            "disabled:opacity-50"
          )}
        >
          Join Project
        </button>
      </form>
    </motion.div>
  );
}
