import { useState } from "react";
import { UserPlus, CircleDashed } from "lucide-react";
import type { Project } from "@/entities/project/model/types";
import { cn } from "@/shared/lib/cn";
import { ConditionBar } from "@/shared/ui/ConditionBar";
import { useAppStore } from "@/shared/lib/store";

interface TeamCheckInListProps {
  project: Project;
  activeTab?: "check-in" | "list" | "dashboard";
  onTabChange?: (tab: "check-in" | "list" | "dashboard") => void;
  hasCheckedInToday?: boolean;
}

type FilterType = "all" | "checked" | "pending";

export function TeamCheckInList({ 
  project, 
  activeTab, 
  onTabChange, 
  hasCheckedInToday 
}: TeamCheckInListProps) {
  const { currentUser } = useAppStore();
  const [filter, setFilter] = useState<FilterType>("all");
  
  const isMember = project.members.some(m => m.id === currentUser?.id);
  
  const today = new Date().toISOString().split("T")[0];
  const todayCheckIns = project.checkIns
    .filter((c) => c.date === today)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const checkedUserIds = new Set(todayCheckIns.map(c => c.userId));
  const pendingMembers = project.members.filter(m => !checkedUserIds.has(m.id));

  const filteredItems = (() => {
    if (filter === "checked") return todayCheckIns.map(c => ({ type: "checked" as const, data: c }));
    if (filter === "pending") return pendingMembers.map(m => ({ type: "pending" as const, data: m }));
    
    // "all" - Combine both, but maybe show checked ones first or mixed? 
    const all = [
      ...todayCheckIns.map(c => ({ type: "checked" as const, data: c, time: new Date(c.createdAt).getTime() })),
      ...pendingMembers.map(m => ({ type: "pending" as const, data: m, time: 0 }))
    ];
    return all.sort((a, b) => b.time - a.time);
  })();

  const filterTabs = [
    { id: "all", label: "전체", count: project.members.length },
    { id: "checked", label: "참여", count: todayCheckIns.length },
    { id: "pending", label: "미참여", count: pendingMembers.length },
  ];

  return (
    <div className="space-y-8">
      {/* Top Bar: Navigation & Filter Tabs (Compact Single Line) */}
      <div className="flex items-center justify-between">
        {/* Left: View Switcher */}
        <div className="flex items-center p-1 bg-surface-50 dark:bg-surface-800/50 rounded-[14px] border border-surface-100 dark:border-surface-700/50">
          <button
            onClick={() => onTabChange?.("list")}
            className={cn(
              "px-4 h-8 flex items-center justify-center rounded-[10px] transition-all duration-200",
              activeTab === "list" 
                ? "bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm" 
                : "text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
            )}
          >
            <span className="text-[12px] font-bold">목록</span>
          </button>
          <button
            onClick={() => onTabChange?.("dashboard")}
            className={cn(
              "px-4 h-8 flex items-center justify-center rounded-[10px] transition-all duration-200",
              activeTab === "dashboard" 
                ? "bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm" 
                : "text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
            )}
          >
            <span className="text-[12px] font-bold">통계</span>
          </button>
        </div>

        {/* Right: Filter Tabs (Simplified) */}
        <div className="flex items-center gap-1 p-1 bg-surface-50 dark:bg-surface-800/50 rounded-[14px] border border-surface-100 dark:border-surface-700/50">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as FilterType)}
              className={cn(
                "px-3 h-8 rounded-[10px] text-[11px] font-bold transition-all duration-200",
                filter === tab.id 
                  ? "bg-primary-600 text-white shadow-sm" 
                  : "text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
              )}
            >
              {tab.label}
              <span className="ml-1 opacity-60 font-mono text-[9px]">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {filteredItems.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <CircleDashed className="w-12 h-12 mx-auto text-surface-200 animate-spin-slow" />
            <p className="text-[14px] font-black text-surface-400 tracking-tight">표시할 데이터가 없습니다.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            if (item.type === "checked") {
              const checkIn = item.data;
              const member = project.members.find((m) => m.id === checkIn.userId);
              
              // More vivid colors
              const getAvatarColor = (score: number) => {
                if (score >= 8) return "bg-[#27AE60]"; // Vivid Emerald
                if (score >= 4) return "bg-[#F2994A]"; // Vivid Orange
                return "bg-[#EB5757]"; // Vivid Red
              };

              return (
                <div
                  key={`checked-${checkIn.id}`}
                  className="group bg-white dark:bg-surface-800 rounded-[28px] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-surface-200 dark:border-surface-700 transition-all duration-300 space-y-5"
                >
                  {/* User Info & Score */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-black shrink-0 shadow-md",
                        getAvatarColor(checkIn.condition)
                      )}>
                        {member?.name?.[0] || "U"}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-[16px] font-black text-surface-950 dark:text-white leading-none tracking-tight">
                          {member?.name || "익명"}
                        </h4>
                        <p className="text-[13px] font-bold text-surface-400 dark:text-surface-500 leading-tight">
                          {checkIn.note || null}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-xl flex items-center justify-center shadow-sm",
                      checkIn.condition >= 8 ? "bg-[#27AE60]/10 text-[#219653]" :
                      checkIn.condition >= 4 ? "bg-[#F2994A]/10 text-[#E27C3E]" :
                      "bg-[#EB5757]/10 text-[#C0392B]"
                    )}>
                      <span className="font-mono text-[14px] font-black tracking-tight">
                        {checkIn.condition} <span className="text-[11px] font-bold ml-0.5 opacity-80">점</span>
                      </span>
                    </div>
                  </div>

                  {/* Condition Bar */}
                  <ConditionBar value={checkIn.condition} />
                </div>
              );
            } else {
              const member = item.data;
              return (
                <div
                  key={`pending-${member.id}`}
                  className="flex items-center justify-between p-6 bg-surface-50 dark:bg-surface-800/40 rounded-[32px] border border-surface-200 dark:border-surface-700/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center text-surface-400 font-black shrink-0 border-2 border-white dark:border-surface-600 shadow-sm">
                      {member.name?.[0] || "U"}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[16px] font-black text-surface-700 dark:text-surface-300 leading-none">
                        {member.name}
                      </h4>
                      <p className="text-[13px] font-bold text-surface-400 dark:text-surface-500">
                        아직 체크인 전입니다.
                      </p>
                    </div>
                  </div>
                  {isMember && (
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 text-surface-500 text-[12px] font-black active:scale-95 transition-all hover:bg-surface-50 dark:hover:bg-surface-700 hover:text-primary-600 shadow-sm">
                      <UserPlus className="w-4 h-4" />
                      리마인드
                    </button>
                  )}
                </div>
              );
            }
          })
        )}
      </div>
    </div>
  );
}
