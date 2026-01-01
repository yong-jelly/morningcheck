import { useState } from "react";
import { UserPlus, CircleDashed, Users, History } from "lucide-react";
import type { Project } from "@/entities/project/model/types";
import { cn } from "@/shared/lib/cn";
import { ConditionBar } from "@/shared/ui/ConditionBar";
import { useAppStore } from "@/shared/lib/store";

interface TeamCheckInListProps {
  project: Project;
  activeTab?: "check-in" | "team" | "history";
  onTabChange?: (tab: "check-in" | "team" | "history") => void;
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
      {/* Top Bar: Navigation (Conditional) & Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        {/* Navigation Icons - Simplified */}
        {hasCheckedInToday && onTabChange && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onTabChange("team")}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200",
                activeTab === "team" 
                  ? "text-primary-600 dark:text-primary-400" 
                  : "text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
              )}
            >
              <Users className={cn("w-5 h-5", activeTab === "team" ? "stroke-[2.5px]" : "stroke-2")} />
            </button>
            <button
              onClick={() => onTabChange("history")}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200",
                activeTab === "history" 
                  ? "text-primary-600 dark:text-primary-400" 
                  : "text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
              )}
            >
              <History className={cn("w-5 h-5", activeTab === "history" ? "stroke-[2.5px]" : "stroke-2")} />
            </button>
          </div>
        )}

        {/* Filter Tabs - Right Aligned (Simplified) */}
        <div className="flex-1 flex justify-end">
          <div className="inline-flex items-center p-1 bg-surface-100/30 dark:bg-surface-800/30 rounded-2xl border border-surface-200/50 dark:border-surface-700/30">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as FilterType)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-black transition-all duration-300",
                  filter === tab.id 
                    ? "bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/[0.05]" 
                    : "text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
                )}
              >
                {tab.label}
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-md font-mono",
                  filter === tab.id ? "bg-primary-600 text-white" : "bg-surface-200 dark:bg-surface-600 text-surface-400"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
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
