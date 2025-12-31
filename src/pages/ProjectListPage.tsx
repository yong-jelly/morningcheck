import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router";
import { useAppStore } from "@/shared/lib/store";
import { CreateProjectModal } from "@/widgets/modal/CreateProject.modal";
import { ProjectDetailModal } from "@/widgets/modal/ProjectDetail.modal";
import { cn } from "@/shared/lib/cn";
import { ProjectCard } from "@/entities/project/ui/ProjectCard";
import { Clock, Mail, LayoutGrid, User } from "lucide-react";

type FilterType = "all" | "pending" | "invites" | "my";

export function ProjectListPage() {
  const navigate = useNavigate();
  const { projectId: urlProjectId } = useParams();
  const { projects, currentUser, acceptInvitation } = useAppStore();
  const [modalMode, setModalMode] = useState<"none" | "create" | "join" | "detail">("none");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  /**
   * URL 파라미터(projectId)에 따라 상세 모달 표시 여부를 결정합니다.
   * 직접 URL로 접근하거나 뒤로가기 시에도 모달 상태가 동기화됩니다.
   */
  useEffect(() => {
    if (urlProjectId) {
      setSelectedProjectId(urlProjectId);
      setModalMode("detail");
    } else if (modalMode === "detail") {
      setModalMode("none");
      setSelectedProjectId(null);
    }
  }, [urlProjectId]);

  const [filter, setFilter] = useState<FilterType>("all");

  const today = new Date().toISOString().split('T')[0];

  const filteredProjects = useMemo(() => {
    if (!currentUser) return [];

    return projects.filter(project => {
      const isMember = project.members.some(m => m.id === currentUser.id);
      const isInvited = project.invitations?.some(i => i.email === currentUser.email && i.status === "pending");

      if (filter === "all") return isMember;
      if (filter === "my") return project.createdBy === currentUser.id;
      if (filter === "pending") {
        const hasCheckedIn = project.checkIns.some(c => c.userId === currentUser.id && c.date === today);
        return isMember && !hasCheckedIn;
      }
      if (filter === "invites") return isInvited;

      return false;
    });
  }, [projects, currentUser, filter, today]);

  const stats = useMemo(() => {
    if (!currentUser) return { all: 0, pending: 0, invites: 0, my: 0 };

    return {
      all: projects.filter(p => p.members.some(m => m.id === currentUser.id)).length,
      pending: projects.filter(p =>
        p.members.some(m => m.id === currentUser.id) &&
        !p.checkIns.some(c => c.userId === currentUser.id && c.date === today)
      ).length,
      invites: projects.filter(p =>
        p.invitations?.some(i => i.email === currentUser.email && i.status === "pending")
      ).length,
      my: projects.filter(p => p.createdBy === currentUser.id).length,
    };
  }, [projects, currentUser, today]);

  const filterTabs = [
    { id: "all", label: "전체", count: stats.all, icon: LayoutGrid, description: "참여 중인 모든 프로젝트입니다." },
    { id: "my", label: "My", count: stats.my, icon: User, description: "내가 생성한 프로젝트입니다." },
    { id: "pending", label: "체크인", count: stats.pending, icon: Clock, description: "오늘 아직 체크인하지 않은 프로젝트입니다." },
    { id: "invites", label: "초대", count: stats.invites, icon: Mail, description: "새로운 프로젝트 초대 내역입니다." },
  ];

  const handleProjectClick = (projectId: string) => {
    // 프로젝트 클릭 시 상세 URL로 이동하여 모달을 띄웁니다.
    navigate(`/projects/${projectId}`);
  };

  const handleAcceptInvite = (projectId: string) => {
    if (currentUser) {
      acceptInvitation(projectId, currentUser);
    }
  };

  const handleSuccess = () => {
    setModalMode("none");
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-surface-950 overflow-hidden">
      {/* Fixed Top Header */}
      {/* <header className="px-5 py-4 min-h-16 flex items-center justify-between shrink-0 bg-white dark:bg-surface-950 safe-area-top z-20"> */}
      <header className="px-5 py-4 flex items-center justify-between shrink-0 bg-white dark:bg-surface-950 z-20" style={{ paddingTop: `calc(env(safe-area-inset-top) + 1rem)` }}>
        
        <div className="flex flex-col gap-0">
          <h1 className="text-[28px] font-bold tracking-tighter text-surface-900 dark:text-white">프로젝트</h1>
        </div>
        <div className="flex items-center gap-3 pb-1">
          <button 
            onClick={() => setModalMode("create")}
            className="px-4 py-2 rounded-full bg-surface-900 dark:bg-white text-white dark:text-surface-900 text-[13px] font-bold active:scale-95 transition-all shadow-sm"
          >
            새 프로젝트
          </button>
          <button 
            onClick={() => navigate("/profile")}
            className="w-9 h-9 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center border border-surface-200 dark:border-surface-700 active:scale-95 transition-all overflow-hidden shadow-inner"
          >
            {currentUser?.profileImageUrl ? (
              <img src={currentUser.profileImageUrl} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-surface-500">프로필</span>
            )}
          </button>
        </div>
      </header>

      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-10 px-4 py-4 bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-100 dark:border-surface-800/50">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 inline-flex items-center p-1 bg-surface-100/50 dark:bg-surface-800/50 rounded-2xl border border-surface-200/50 dark:border-surface-700/30">
              {filterTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as FilterType)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[14px] text-[12px] font-black transition-all duration-300",
                      isActive 
                        ? "bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/[0.03]" 
                        : "text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5", isActive ? "opacity-100" : "opacity-40")} />
                    {tab.label}
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-md font-mono",
                      isActive ? "bg-primary-600 text-white" : "bg-surface-200 dark:bg-surface-600 text-surface-400"
                    )}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="px-2">
            <motion.p 
              key={filter}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] font-bold text-surface-400/80 tracking-tight"
            >
              {filterTabs.find(t => t.id === filter)?.description}
            </motion.p>
          </div>
        </div>
      </div>

      {/* Scrollable Project List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pt-6 pb-32">
        <AnimatePresence mode="popLayout">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                onClick={handleProjectClick}
                isInvitation={filter === "invites"}
                onAccept={handleAcceptInvite}
              />
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-24 text-center space-y-8"
            >
              <div className="w-20 h-20 bg-surface-50 dark:bg-surface-800 rounded-[32px] flex items-center justify-center border border-surface-100 dark:border-surface-700">
                <span className="text-4xl">
                  {filter === "all" ? "👋" : filter === "pending" ? "✨" : "✉️"}
                </span>
              </div>
              <div className="space-y-2">
                <h2 className="text-[20px] font-bold text-surface-900 dark:text-white">
                  {filter === "all" ? "프로젝트가 없습니다" : 
                   filter === "pending" ? "모든 체크인을 완료했습니다!" : 
                   "초대받은 내역이 없습니다"}
                </h2>
                <p className="text-[14px] font-medium text-surface-400 leading-relaxed">
                  {filter === "all" ? "새로운 프로젝트를 만들거나\n초대 코드로 참여해보세요." :
                   filter === "pending" ? "오늘의 컨디션 체크가 모두 끝났습니다.\n멋진 하루 되세요!" :
                   "동료들에게 초대 코드를 요청해보세요."}
                </p>
              </div>
              {filter === "all" && (
                <div className="flex flex-col w-full gap-3 px-8">
                  <button 
                    onClick={() => setModalMode("create")}
                    className="w-full h-14 bg-surface-900 dark:bg-white text-white dark:text-surface-900 font-bold rounded-2xl text-[16px] active:scale-95 transition-transform"
                  >
                    프로젝트 만들기
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {modalMode === "create" && (
          <CreateProjectModal 
            isOpen={true} 
            onClose={() => setModalMode("none")} 
            onSuccess={handleSuccess} 
          />
        )}
        {modalMode === "detail" && selectedProjectId && (
          <ProjectDetailModal
            isOpen={true}
            projectId={selectedProjectId}
            onClose={() => navigate("/projects")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
