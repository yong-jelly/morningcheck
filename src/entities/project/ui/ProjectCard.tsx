import { motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";
import type { Project } from "@/entities/project/model/types";

interface ProjectCardProps {
  project: Project;
  index: number;
  onClick: (projectId: string) => void;
  isInvitation?: boolean;
  onAccept?: (projectId: string) => void;
}

export function ProjectCard({ project, index, onClick, isInvitation, onAccept }: ProjectCardProps) {
  const today = new Date().toISOString().split('T')[0];
  const todayCheckIns = project.checkIns.filter(c => c.date === today);
  const participationRate = project.members.length > 0 
    ? Math.round((todayCheckIns.length / project.members.length) * 100) 
    : 0;
  const averageRating = todayCheckIns.length > 0
    ? (todayCheckIns.reduce((acc, curr) => acc + curr.condition, 0) / todayCheckIns.length).toFixed(1)
    : "0.0";

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
        className="w-full bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-800 rounded-[24px] flex flex-col gap-6 p-5 group active:scale-[0.99] transition-all shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] text-left cursor-pointer"
      >
        <div className="flex items-start justify-between w-full">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0",
              project.iconType === "image" ? "bg-surface-50" : "bg-surface-50 dark:bg-surface-800"
            )}>
              {project.iconType === "image" ? (
                <img src={project.icon} alt={project.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span>{project.icon || "🚀"}</span>
              )}
            </div>
            <div className="flex flex-col gap-1 overflow-hidden">
              <h3 className="text-[19px] font-bold text-surface-900 dark:text-white tracking-tight leading-none truncate">
                {project.name}
              </h3>
              {project.description ? (
                <p className="text-[12px] font-medium text-surface-400 line-clamp-1">
                  {project.description}
                </p>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-surface-400">#</span>
                  <span className="text-[12px] font-black text-primary-600 dark:text-primary-400 tracking-wider">
                    {project.inviteCode}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {isInvitation && onAccept ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept(project.id);
              }}
              className="px-4 py-2 rounded-xl bg-primary-600 text-white text-[12px] font-black active:scale-95 transition-all shadow-md hover:bg-primary-700"
            >
              수락하기
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1 px-1">
            <span className="text-[10px] font-bold text-surface-400 uppercase">멤버</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[17px] font-black text-surface-900 dark:text-white">{project.members.length}</span>
              <span className="text-[11px] font-bold text-surface-400">명</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 px-1">
            <span className="text-[10px] font-bold text-surface-400 uppercase">컨디션</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[17px] font-black text-surface-900 dark:text-white">{averageRating}</span>
              <span className="text-[11px] font-bold text-surface-400">점</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 px-1">
            <span className="text-[10px] font-bold text-surface-400 uppercase">참여율</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[17px] font-black text-primary-600 dark:text-primary-400">{participationRate}</span>
              <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400">%</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
