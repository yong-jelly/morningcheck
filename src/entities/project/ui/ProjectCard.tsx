import { motion } from "framer-motion";
import { Settings, UserCircle2, Clock, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, UserPlus, Mail } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { Project } from "@/entities/project/model/types";
import { useAppStore } from "@/shared/lib/store";
import { formatRelativeTime } from "@/shared/lib/utils";

interface ProjectCardProps {
  project: Project;
  index: number;
  onClick: (projectId: string) => void;
  onSettingsClick?: (project: Project) => void;
  onInviteClick?: (project: Project) => void;
  isInvitation?: boolean;
  onAccept?: (projectId: string) => void;
}

export function ProjectCard({ 
  project, 
  index, 
  onClick, 
  onSettingsClick, 
  onInviteClick,
  isInvitation: isInviteFilter, 
  onAccept 
}: ProjectCardProps) {
  const { currentUser } = useAppStore();
  const isOwner = currentUser?.id === project.createdBy;
  
  const today = new Date().toISOString().split('T')[0];
  
  // 체크인 및 초대 여부 확인
  const hasCheckedInToday = project.checkIns?.some(c => c.userId === currentUser?.id && c.date === today);
  const isMember = project.members?.some(m => m.id === currentUser?.id);
  const invitation = project.invitations?.find(i => i.email === currentUser?.email && i.status === "pending");
  const isInvited = !!invitation;

  // 스냅샷 데이터가 있으면 사용, 없으면 실시간 계산
  const memberCount = project.stats?.memberCount ?? project.members.length;
  const memberCountChange = project.stats?.memberCountChange ?? 0;
  
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
          "w-full bg-white dark:bg-surface-900 border rounded-[24px] flex flex-col gap-5 p-5 group active:scale-[0.99] transition-all shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] text-left cursor-pointer",
          isInvited 
            ? "border-primary-500/50 dark:border-primary-400/50 bg-primary-50/10 dark:bg-primary-900/5" 
            : "border-surface-100 dark:border-surface-800"
        )}
      >
        <div className="flex items-start justify-between w-full">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm transition-transform group-hover:scale-105",
              project.iconType === "image" ? "bg-surface-50" : "bg-surface-50 dark:bg-surface-800",
              isInvited && "ring-2 ring-primary-500/20"
            )}>
              {project.iconType === "image" ? (
                <img src={project.icon} alt={project.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span>{project.icon || "🚀"}</span>
              )}
            </div>
            <div className="flex flex-col gap-1 overflow-hidden flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-[19px] font-bold text-surface-900 dark:text-white tracking-tight leading-none truncate">
                  {project.name}
                </h3>
                {isInvited && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                    <Mail className="w-3 h-3" />
                    <span>초대됨</span>
                  </div>
                )}
                {isMember && !isInvited && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                    hasCheckedInToday 
                      ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" 
                      : "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 animate-pulse"
                  )}>
                    {hasCheckedInToday ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>체크인 완료</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        <span>체크인 필요</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isOwner && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSettingsClick?.(project);
                      }}
                      className="shrink-0 px-1.5 py-0.5 bg-surface-100 dark:bg-surface-800 text-surface-400 dark:text-surface-500 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                    >
                      <UserCircle2 className="w-2.5 h-2.5" />
                      Owner
                      <Settings className="w-2.5 h-2.5 ml-0.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInviteClick?.(project);
                      }}
                      className="shrink-0 px-1.5 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors border border-primary-100/50 dark:border-primary-800/30"
                    >
                      <UserPlus className="w-2.5 h-2.5" />
                      Invite
                    </button>
                  </div>
                )}
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
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {isInvited ? (
              <div className="px-4 py-2 rounded-xl bg-primary-600 text-white text-[12px] font-black shadow-md">
                초대 수락 대기
              </div>
            ) : isInviteFilter && onAccept ? (
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
        </div>

        {/* 마지막 체크인 정보 */}
        {project.lastCheckIn && (
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
            <div className="w-5 h-5 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden shrink-0">
              {project.lastCheckIn.userAvatarUrl ? (
                <img src={project.lastCheckIn.userAvatarUrl} alt={project.lastCheckIn.userDisplayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-surface-400">
                  {project.lastCheckIn.userDisplayName[0]}
                </div>
              )}
            </div>
            <p className="text-[11px] font-medium text-surface-500 dark:text-surface-400 truncate">
              <span className="font-bold text-surface-700 dark:text-surface-200">{project.lastCheckIn.userDisplayName}</span>
              님이 {formatRelativeTime(project.lastCheckIn.checkInTime)} 체크인함
            </p>
            <Clock className="w-3 h-3 text-surface-300 ml-auto shrink-0" />
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1 px-1">
            <span className="text-[10px] font-bold text-surface-400 uppercase">멤버</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[17px] font-black text-surface-900 dark:text-white">{memberCount}</span>
              <span className="text-[11px] font-bold text-surface-400">명</span>
              {memberCountChange !== 0 && (
                <span className={cn(
                  "flex items-center text-[10px] font-bold",
                  memberCountChange > 0 ? "text-green-500" : "text-red-500"
                )}>
                  {memberCountChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(memberCountChange)}
                </span>
              )}
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
