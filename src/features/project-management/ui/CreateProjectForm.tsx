import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useAppStore } from "@/shared/lib/store";
import { cn } from "@/shared/lib/cn";
import type { Project, User } from "@/entities/project/model/types";

interface CreateProjectFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProjectForm({ onClose, onSuccess }: CreateProjectFormProps) {
  const [projectName, setProjectName] = useState("");
  const [userName, setUserName] = useState("");
  const addProject = useAppStore((state) => state.addProject);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !userName.trim()) return;

    const newUser: User = {
      id: crypto.randomUUID(),
      name: userName.trim(),
    };

    const newProject: Project = {
      id: crypto.randomUUID(),
      name: projectName.trim(),
      inviteCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
      members: [newUser],
      checkIns: [],
      createdBy: newUser.id,
      createdAt: new Date().toISOString(),
    };

    setCurrentUser(newUser);
    addProject(newProject);
    onSuccess();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-surface-800 p-6 rounded-2xl border border-surface-200 dark:border-surface-700 w-full"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-lg font-bold">New Project</h2>
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
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="멋진 우리 팀"
            className="w-full h-11 px-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 focus:border-primary-500 focus:ring-0 transition-all text-sm font-medium"
          />
        </div>

        <button
          type="submit"
          disabled={!projectName.trim() || !userName.trim()}
          className={cn(
            "w-full h-12 bg-primary-600 text-white text-sm font-bold rounded-xl mt-2 transition-all active:scale-98",
            "disabled:opacity-50"
          )}
        >
          Create Project
        </button>
      </form>
    </motion.div>
  );
}
