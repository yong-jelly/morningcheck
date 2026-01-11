import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { Project } from "@/entities/project/model/types";
import { useAppStore } from "@/shared/lib/store";
import { formatRelativeTime, getCurrentDateString } from "@/shared/lib/utils";

interface ProjectCardV2Props {
  project: Project;
  index: number;
  onClick: (projectId: string) => void;
  onSettingsClick?: (project: Project) => void;
  onInviteClick?: (project: Project) => void;
  isInvitation?: boolean;
  onAccept?: (projectId: string) => void;
}

export function ProjectCardV2({ 
  project, 
  index, 
  onClick,
  isInvitation,
  onAccept
}: ProjectCardV2Props) {
  const { currentUser } = useAppStore();
  const isOwner = currentUser?.id === project.createdBy;
  const today = getCurrentDateString();
  
  // 스냅샷 데이터가 있으면 사용, 없으면 실시간 계산
  const memberCount = project.stats?.memberCount ?? project.members.length;
  
  const participationRate = project.stats?.participationRate ?? (
    project.members.length > 0 
      ? Math.round((project.checkIns.filter(c => c.date === today).length / project.members.length) * 100) 
      : 0
  );
  
  const averageRating = project.stats?.avgCondition?.toFixed(1) ?? (
    project.checkIns.filter(c => c.date === today).length > 0
      ? (project.checkIns.filter(c => c.date === today).reduce((acc, curr) => acc + curr.condition, 0) / project.checkIns.filter(c => c.date === today).length).toFixed(1)
      : "0.0"
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 260, damping: 20 }}
      className="relative"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onClick(project.id)}
        onKeyDown={(e) => e.key === 'Enter' && onClick(project.id)}
        className={cn(
          "w-full bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-800 rounded-[12px] p-8 flex items-center justify-between group active:scale-[0.99] transition-all duration-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] text-left cursor-pointer",
          project.archivedAt && "opacity-70 grayscale-[0.5]"
        )}
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isOwner && (
                  <span 
                    className="px-3 py-1 text-white text-[12px] rounded-[10px]"
                    style={{ backgroundColor: '#744485' }}
                  >
                    관리자
                  </span>
                )}
                {isInvitation && (
                  <span className="px-3 py-1 bg-amber-500 text-white text-[12px] font-bold rounded-[10px]">
                    초대됨
                  </span>
                )}
              </div>
            </div>

            <h3 className="text-[22px] font-bold text-surface-900 dark:text-white truncate">
              {project.name}
            </h3>

            <div className="flex gap-12 mt-4">
              <div className="flex flex-col">
                <span className="text-[24px] font-bold text-surface-900 dark:text-white leading-tight">
                  {averageRating}
                </span>
                <span className="text-[13px] font-bold text-surface-300 uppercase tracking-tight">
                  평균점수
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[24px] font-bold text-surface-900 dark:text-white leading-tight">
                  {memberCount}
                </span>
                <span className="text-[13px] font-bold text-surface-300 uppercase tracking-tight">
                  멤버 수
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[24px] font-bold text-surface-900 dark:text-white leading-tight">
                  {participationRate}
                </span>
                <span className="text-[13px] font-bold text-surface-300 uppercase tracking-tight">
                  참여율
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-4">
          {isInvitation && onAccept ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept(project.id);
              }}
              className="px-6 py-3 rounded-2xl bg-primary-600 text-white text-[14px] font-black active:scale-95 transition-all shadow-lg hover:bg-primary-700"
            >
              수락하기
            </button>
          ) : (
            <ChevronRight className="w-8 h-8 text-surface-900 dark:text-white" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
