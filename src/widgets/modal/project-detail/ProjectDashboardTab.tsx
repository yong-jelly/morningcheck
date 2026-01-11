import { useState } from "react";
import type { Project, User as UserType } from "@/entities/project/model/types";
import { cn } from "@/shared/lib/cn";
import { TeamDashboard } from "./ui/TeamDashboard";

interface ProjectDashboardTabProps {
  project: Project;
  currentUser: UserType;
  onTabChange: (tab: "check-in" | "list" | "stats" | "dashboard") => void;
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
  onDateSelect,
  onInviteClick,
  onSettingsClick
}: ProjectDashboardTabProps) {
  return (
    <div className="space-y-10 pb-10">
      <div className="space-y-4">
        {project.createdBy === currentUser.id && (
          <div className="flex items-center justify-end gap-4 px-1">
            <button 
              onClick={onInviteClick}
              className="text-[13px] font-bold text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors"
            >
              초대
            </button>
            <button 
              onClick={onSettingsClick}
              className="text-[13px] font-bold text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors"
            >
              설정
            </button>
          </div>
        )}
        <div className="flex items-center justify-between">
          {/* Left: View Switcher */}
          <div className="flex items-center p-1 bg-surface-50 dark:bg-surface-800/50 rounded-[14px] border border-surface-100 dark:border-surface-700/50">
            <button
              onClick={() => onTabChange("dashboard")}
              className={cn(
                "px-4 h-8 flex items-center justify-center rounded-[10px] transition-all duration-200",
                "text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
              )}
            >
              <span className="text-[12px] font-bold">대시보드</span>
            </button>
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
              onClick={() => onTabChange("stats")}
              className={cn(
                "px-4 h-8 flex items-center justify-center rounded-[10px] transition-all duration-200",
                "bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm"
              )}
            >
              <span className="text-[12px] font-bold">통계</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        <TeamDashboard 
          project={project} 
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
        />
      </div>
    </div>
  );
}
