import { useState } from "react";
import type { Project, User as UserType } from "@/entities/project/model/types";
import { cn } from "@/shared/lib/cn";
import { TeamDashboard } from "./ui/TeamDashboard";
import { PersonalDashboard } from "./ui/PersonalDashboard";

interface ProjectDashboardTabProps {
  project: Project;
  currentUser: UserType;
  onTabChange: (tab: "check-in" | "list" | "dashboard") => void;
  hasCheckedInToday: boolean;
  selectedDate?: string;
  onDateSelect?: (date: string | null) => void;
}

type DashboardMode = "team" | "personal";

export function ProjectDashboardTab({ 
  project, 
  currentUser,
  onTabChange,
  selectedDate,
  onDateSelect
}: ProjectDashboardTabProps) {
  const [mode, setMode] = useState<DashboardMode>("team");

  return (
    <div className="space-y-6 pb-10">
      {/* ... existing code ... */}
      {/* (Skipped for brevity, but I will include the actual content in the tool call) */}
      <div className="flex items-center justify-between">
        {/* Left: View Switcher */}
        <div className="flex items-center p-1 bg-surface-50 dark:bg-surface-800/50 rounded-[14px] border border-surface-100 dark:border-surface-700/50">
          <button
            onClick={() => onTabChange("list")}
            className={cn(
              "px-4 h-8 flex items-center justify-center rounded-[10px] transition-all duration-200",
              "text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
            )}
          >
            <span className="text-[12px] font-bold">목록</span>
          </button>
          <button
            onClick={() => onTabChange("dashboard")}
            className={cn(
              "px-4 h-8 flex items-center justify-center rounded-[10px] transition-all duration-200",
              "bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm"
            )}
          >
            <span className="text-[12px] font-bold">통계</span>
          </button>
        </div>

        {/* Right: Mode Switcher (Team vs Personal) */}
        <div className="flex items-center gap-1 p-1 bg-surface-50 dark:bg-surface-800/50 rounded-[14px] border border-surface-100 dark:border-surface-700/50">
          <button
            onClick={() => setMode("team")}
            className={cn(
              "px-3 h-8 rounded-[10px] text-[11px] font-bold transition-all duration-200",
              mode === "team" 
                ? "bg-primary-600 text-white shadow-sm" 
                : "text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
            )}
          >
            팀
          </button>
          <button
            onClick={() => setMode("personal")}
            className={cn(
              "px-3 h-8 rounded-[10px] text-[11px] font-bold transition-all duration-200",
              mode === "personal" 
                ? "bg-primary-600 text-white shadow-sm" 
                : "text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
            )}
          >
            개인
          </button>
        </div>
      </div>

      {mode === "team" ? (
        <TeamDashboard 
          project={project} 
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
        />
      ) : (
        <PersonalDashboard 
          project={project} 
          currentUser={currentUser} 
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
        />
      )}
    </div>
  );
}
