import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router";
import { useAppStore } from "@/shared/lib/store";
import { CreateProjectModal } from "@/widgets/modal/CreateProject.modal";
import { ProjectDetailModal } from "@/widgets/modal/ProjectDetail.modal";
import { ProjectSettingsModal } from "@/widgets/modal/ProjectSettings.modal";
import { InviteMemberModal } from "@/widgets/modal/InviteMember.modal";
import { cn } from "@/shared/lib/cn";
import { ProjectCard } from "@/entities/project/ui/ProjectCard";
import type { Project } from "@/entities/project/model/types";
import { projectApi, mapProjectFromDb } from "@/entities/project/api/project";
import { Clock, Mail, LayoutGrid, User, Loader2, Bell, Plus } from "lucide-react";
import { supabase } from "@/shared/lib/supabase";
import { getProfileImageUrl } from "@/shared/lib/storage";
import { useQuery } from "@tanstack/react-query";

type FilterType = "all" | "pending" | "invites" | "my";

export function ProjectListPage() {
  const navigate = useNavigate();
  const { projectId: urlProjectId } = useParams();
  const { projects, currentUser, acceptInvitation, setProjects } = useAppStore();
  const [modalMode, setModalMode] = useState<"none" | "create" | "join" | "detail" | "settings" | "invite">("none");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [invitingProject, setInvitingProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 세션 유효성 검사: Supabase 세션이 없는데 스토어상 인증된 상태라면 초기화
  const { data: authUser, isFetched: isAuthFetched, isLoading: isAuthLoading } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) return null;
      return user;
    },
    retry: false,
  });

  const { logout, isAuthenticated } = useAppStore();

  useEffect(() => {
    if (isAuthFetched && !isAuthLoading && !authUser && isAuthenticated) {
      console.warn("Invalid session detected. Clearing local data.");
      logout();
      navigate("/onboarding");
    }
  }, [authUser, isAuthLoading, isAuthFetched, isAuthenticated, logout, navigate]);

  // 프로젝트 데이터 로드
  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser) return;
      try {
        setIsLoading(true);
        // 공개 프로젝트 + 본인이 참여/생성한 프로젝트 가져오기
        const data = await projectApi.getPublicProjects(currentUser.id);
        
        // 데이터 변환 (DB -> UI Model)
        const mappedProjects: Project[] = data.map((p: any) => mapProjectFromDb(p));

        // 생성순 정렬 (최신순)
        const sortedProjects = mappedProjects.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setProjects(sortedProjects);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [currentUser]);

  // 실시간 DB 프로필 정보 가져오기
  const { data: dbProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["user-profile", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return null;
      const { data, error } = await supabase.rpc("v1_get_user_profile", {
        p_auth_id: currentUser.id
      });
      
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!currentUser,
  });

  // 표시할 아바타 URL 결정 (DB 정보 우선, 없으면 스토어 정보)
  const displayAvatarUrl = getProfileImageUrl(dbProfile?.avatar_url || currentUser?.profileImageUrl, "sm");
  
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
      const isOwner = project.createdBy === currentUser.id;
      const isInvited = project.invitations?.some(i => i.email === currentUser.email && i.status === "pending");
      const isPublic = project.visibilityType === "public";
      const isRequest = project.visibilityType === "request";

      // 1. My 탭인 경우: 내가 만든 프로젝트라면 아카이브 여부 상관없이 노출
      if (filter === "my") {
        return isOwner;
      }

      // 2. 그 외 탭(전체, 체크인, 초대)인 경우: 아카이브된 프로젝트는 무조건 제외
      if (project.archivedAt) return false;

      if (filter === "all") {
        // 멤버이거나 소유자이거나 초대받았거나, 공개/참여요청 프로젝트인 경우 노출
        if (isMember || isOwner || isInvited) return true;
        if (isPublic || isRequest) return true;
        return false;
      }
      
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
      // 전체 탭 숫자: 아카이브되지 않은 내가 참여 중인 프로젝트
      all: projects.filter(p => !p.archivedAt && p.members.some(m => m.id === currentUser.id)).length,
      
      // 체크인 탭 숫자: 아카이브되지 않은 프로젝트 중 체크인 안 한 것
      pending: projects.filter(p =>
        !p.archivedAt &&
        p.members.some(m => m.id === currentUser.id) &&
        !p.checkIns.some(c => c.userId === currentUser.id && c.date === today)
      ).length,
      
      // 초대 탭 숫자: 아카이브되지 않은 프로젝트 초대
      invites: projects.filter(p =>
        !p.archivedAt &&
        p.invitations?.some(i => i.email === currentUser.email && i.status === "pending")
      ).length,
      
      // My 탭 숫자: 아카이브 여부와 상관없이 내가 만든 프로젝트 전체
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

  const handleSettingsClick = (project: Project) => {
    setEditingProject(project);
    setModalMode("settings");
  };

  const handleInviteClick = (project: Project) => {
    setInvitingProject(project);
    setModalMode("invite");
  };

  const handleSuccess = () => {
    setModalMode("none");
    setEditingProject(null);
    setInvitingProject(null);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-surface-950 overflow-hidden">
      {/* 1. Header: Avatar & Top Icons */}
      <header className="px-5 py-4 flex items-center justify-between shrink-0 bg-white dark:bg-surface-950 z-20" style={{ paddingTop: `calc(env(safe-area-inset-top) + 1rem)` }}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/profile")}
            className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center border border-surface-200 dark:border-surface-700 active:scale-95 transition-all overflow-hidden shadow-sm"
          >
            {isProfileLoading ? (
              <Loader2 className="w-5 h-5 text-surface-400 animate-spin" />
            ) : displayAvatarUrl ? (
              <img src={displayAvatarUrl} alt={dbProfile?.display_name || currentUser?.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-surface-400" />
            )}
          </button>
          <div className="flex flex-col -space-y-1">
            <span className="text-[14px] font-medium text-surface-500 dark:text-surface-400">Hello,</span>
            <span className="text-[16px] font-bold text-surface-900 dark:text-white tracking-tight">
              {dbProfile?.display_name || currentUser?.name || "Member"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setModalMode("create")}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5 text-surface-600 dark:text-surface-400" />
          </button>
          <button 
            disabled
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm opacity-40 cursor-not-allowed"
          >
            <Bell className="w-5 h-5 text-surface-600 dark:text-surface-400" />
          </button>
        </div>
      </header>

      {/* <div className="px-5 pt-2 pb-4 space-y-6 flex-shrink-0"> */}
        {/* 2. Title */}
        {/* <div className="space-y-1">
          <h1 className="text-[32px] font-bold leading-[1.1] tracking-tight text-surface-900 dark:text-white">
            참여 중인 프로젝트<br />
            현황을 확인하세요
          </h1>
        </div> */}
      {/* </div> */}

      {/* 4. Tab Filters */}
      <div className="px-5 py-4 flex-shrink-0">
        <div className="flex items-center p-1 bg-surface-50 dark:bg-surface-900/50 rounded-[20px] border border-surface-100 dark:border-surface-800">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as FilterType)}
                className={cn(
                  "relative flex-1 flex flex-col items-center justify-center py-3 rounded-[16px] transition-all duration-300",
                  isActive 
                    ? "bg-white dark:bg-surface-800 text-primary-600 dark:text-primary-400 shadow-sm shadow-black/[0.05]" 
                    : "text-surface-400 hover:text-surface-500 dark:hover:text-surface-300"
                )}
              >
                <div className="relative">
                  <Icon className={cn("w-5 h-5 mb-1", isActive ? "opacity-100" : "opacity-40")} />
                  {tab.count > 0 && (
                    <span className={cn(
                      "absolute -top-1.5 -right-2.5 px-1.5 py-0.5 rounded-full text-[9px] font-black font-mono flex items-center justify-center min-w-[16px]",
                      isActive 
                        ? "bg-primary-600 text-white shadow-sm shadow-primary-500/20" 
                        : "bg-surface-200 dark:bg-surface-700 text-surface-400"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold tracking-tight">{tab.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 border-2 border-primary-600/10 dark:border-primary-400/10 rounded-[16px]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Project List Title */}
      <div className="px-5 pt-2 flex items-center justify-between flex-shrink-0">
        <motion.h2 
          key={filter}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[20px] font-bold text-surface-900 dark:text-white tracking-tight"
        >
          {filter === "all" && "전체 프로젝트"}
          {filter === "my" && "내가 만든 프로젝트"}
          {filter === "pending" && "오늘 체크인이 필요한 프로젝트"}
          {filter === "invites" && "새로 도착한 프로젝트 초대"}
        </motion.h2>
      </div>

      {/* Scrollable Project List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pt-4 pb-32">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <p className="mt-4 text-[14px] font-bold text-surface-400">프로젝트를 불러오는 중...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  onClick={handleProjectClick}
                  onSettingsClick={handleSettingsClick}
                  onInviteClick={handleInviteClick}
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
        )}
      </div>

      <AnimatePresence>
        {modalMode === "create" && (
          <CreateProjectModal 
            isOpen={true} 
            onClose={() => setModalMode("none")} 
            onSuccess={handleSuccess} 
          />
        )}
        {modalMode === "settings" && editingProject && (
          <ProjectSettingsModal
            isOpen={true}
            project={editingProject}
            onClose={() => {
              setModalMode("none");
              setEditingProject(null);
            }}
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
        {modalMode === "invite" && invitingProject && (
          <InviteMemberModal
            isOpen={true}
            project={invitingProject}
            onClose={() => {
              setModalMode("none");
              setInvitingProject(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
