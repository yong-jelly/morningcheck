import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import type { Project, User } from "@/entities/project/model/types";
import { cn } from "@/shared/lib/cn";

interface TeamCheckInListProps {
  project: Project;
}

const CONDITION_COLORS = {
  good: "text-accent-emerald bg-accent-emerald/5 border-accent-emerald/10",
  normal: "text-accent-amber bg-accent-amber/5 border-accent-amber/10",
  bad: "text-accent-rose bg-accent-rose/5 border-accent-rose/10",
};

export function TeamCheckInList({ project }: TeamCheckInListProps) {
  const today = new Date().toISOString().split("T")[0];
  const todayCheckIns = project.checkIns.filter((c) => c.date === today);

  const getConditionType = (score: number) => {
    if (score >= 8) return "good";
    if (score >= 5) return "normal";
    return "bad";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-bold text-surface-400 uppercase tracking-[0.2em]">Live Feed</h3>
        <span className="text-[10px] font-bold text-primary-600 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded border border-primary-100 dark:border-primary-900">
          {todayCheckIns.length} / {project.members.length} Active
        </span>
      </div>

      {todayCheckIns.length === 0 ? (
        <div className="py-12 text-center bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-dashed border-surface-200 dark:border-surface-800">
          <p className="text-xs font-medium text-surface-400">아직 체크인한 팀원이 없어요.</p>
        </div>
      ) : (
        <div className="divide-y divide-surface-100 dark:divide-surface-800 border-y border-surface-100 dark:border-surface-800">
          {todayCheckIns.map((checkIn, i) => {
            const member = project.members.find((m) => m.id === checkIn.userId);
            const type = getConditionType(checkIn.condition);
            
            return (
              <motion.div
                key={checkIn.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="py-4 flex gap-4"
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm shrink-0 border",
                  CONDITION_COLORS[type]
                )}>
                  {checkIn.condition}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold truncate">{member?.name || "Member"}</span>
                    <span className="text-[10px] text-surface-400 font-medium">
                      {new Date(checkIn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {checkIn.note && (
                    <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2 leading-relaxed">
                      {checkIn.note}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
