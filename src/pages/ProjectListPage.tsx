import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router";
import { useAppStore } from "@/shared/lib/store";
import { CreateProjectModal } from "@/widgets/modal/CreateProject.modal";
import { ProjectDetailModal } from "@/widgets/modal/ProjectDetail.modal";
import { ProjectSettingsModal } from "@/widgets/modal/ProjectSettings.modal";
import { InviteMemberModal } from "@/widgets/modal/InviteMember.modal";
import { ProjectCardV2 } from "@/entities/project/ui/ProjectCardV2";
import type { Project } from "@/entities/project/model/types";
import { projectApi, mapProjectFromDb } from "@/entities/project/api/project";
import { Loader2 } from "lucide-react";
import { supabase } from "@/shared/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { UserProfileHeader, UserContent } from "@/widgets/UserHeader";

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

  // 오늘의 통합 체크인 정보 가져오기
  const { data: todayCheckIn, isLoading: isTodayCheckInLoading } = useQuery({
    queryKey: ["today-check-in", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return null;
      return await projectApi.getTodayCheckIn(currentUser.id);
    },
    enabled: !!currentUser,
  });

  // 최근 6일간의 체크인 히스토리 가져오기
  const { data: checkInHistory } = useQuery({
    queryKey: ["check-in-history", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      return await projectApi.getUserCheckInHistory(currentUser.id, 6);
    },
    enabled: !!currentUser,
  });

  const weather = useAppStore((state) => state.weather);
  const setWeather = useAppStore((state) => state.setWeather);

  useEffect(() => {
    // 이미 날씨 정보가 있다면 다시 호출하지 않음 (불필요한 중복 호출 방지)
    if (weather) return;

    async function fetchWeather() {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current=temperature_2m,weather_code"
        );
        const data = await res.json();
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code,
        });
      } catch (error) {
        console.error("Failed to fetch weather:", error);
      }
    }
    fetchWeather();
  }, [weather, setWeather]);

  /**
   * URL 파라미터(projectId)에 따라 상세 모달 표시 여부를 결정합니다.
   * 직접 URL로 접근하거나 뒤로가기 시에도 모달 상태가 동기화됩니다.
   */
  useEffect(() => {
    if (urlProjectId) {
      // 오늘 체크인을 하지 않은 경우 체크인 페이지로 이동
      if (!isTodayCheckInLoading && !todayCheckIn) {
        navigate("/check-in", { replace: true });
        return;
      }
      setSelectedProjectId(urlProjectId);
      setModalMode("detail");
    } else if (modalMode === "detail") {
      setModalMode("none");
      setSelectedProjectId(null);
    }
  }, [urlProjectId, todayCheckIn, isTodayCheckInLoading, navigate]);

  const filteredProjects = useMemo(() => {
    if (!currentUser) return [];

    return projects.filter(project => {
      // 아카이브된 프로젝트는 제외
      if (project.archivedAt) return false;

      const isMember = project.members.some(m => m.id === currentUser.id);
      const isOwner = project.createdBy === currentUser.id;
      const isInvited = project.invitations?.some(i => i.email === currentUser.email && i.status === "pending");
      const isPublic = project.visibilityType === "public";
      const isRequest = project.visibilityType === "request";

      // 멤버이거나 소유자이거나 초대받았거나, 공개/참여요청 프로젝트인 경우 노출
      if (isMember || isOwner || isInvited) return true;
      if (isPublic || isRequest) return true;
      return false;
    });
  }, [projects, currentUser]);

  const handleProjectClick = (projectId: string) => {
    // 오늘 체크인을 하지 않은 경우 체크인 페이지로 이동
    if (!todayCheckIn) {
      navigate("/check-in");
      return;
    }
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
    <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-surface-950 overflow-hidden">
      {/* 고정 헤더 - 스크롤과 무관하게 항상 최상단 고정 */}
      <div className="flex-shrink-0 z-50">
        <UserProfileHeader 
          user={dbProfile ? { ...dbProfile, id: dbProfile.auth_id } : (currentUser ? { ...currentUser, display_name: currentUser.name, avatar_url: currentUser.profileImageUrl } : null)}
          isLoading={isProfileLoading || isTodayCheckInLoading}
        />
      </div>

      {/* 스크롤 영역 - 헤더 아래 나머지 전체 */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          willChange: 'scroll-position',
          transform: 'translateZ(0)'
        }}
      >
        <UserContent 
          user={dbProfile ? { ...dbProfile, id: dbProfile.auth_id } : (currentUser ? { ...currentUser, display_name: currentUser.name, avatar_url: currentUser.profileImageUrl } : null)}
          todayCheckIn={todayCheckIn}
          checkInHistory={checkInHistory}
          weather={weather}
          isLoading={isProfileLoading || isTodayCheckInLoading}
        />

        <div className="px-5 space-y-8 pb-32">
          {/* Project List Section */}
          <div className="space-y-4">
            {/* Project List Title */}
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-bold text-surface-900 dark:text-white tracking-tight">
                My Teams
              </h2>
              
              <button 
                onClick={() => setModalMode("create")}
                className="text-[14px] font-bold text-[#404750] dark:text-surface-400 active:opacity-60 transition-opacity"
              >
                + 팀 추가하기
              </button>
            </div>

            {/* Project List Content */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                  <p className="mt-4 text-[14px] font-bold text-surface-400">프로젝트를 불러오는 중...</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((project, index) => {
                      const isInvitedProject = project.invitations?.some(i => i.email === currentUser?.email && i.status === "pending");
                      return (
                        <ProjectCardV2
                          key={project.id}
                          project={project}
                          index={index}
                          onClick={handleProjectClick}
                          onSettingsClick={handleSettingsClick}
                          onInviteClick={handleInviteClick}
                          isInvitation={isInvitedProject}
                          onAccept={handleAcceptInvite}
                        />
                      );
                    })
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center justify-center py-24 text-center space-y-8"
                    >
                      <div className="w-20 h-20 bg-white dark:bg-surface-800 rounded-[32px] flex items-center justify-center border border-surface-100 dark:border-surface-700 shadow-sm">
                        <span className="text-4xl">👋</span>
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-[20px] font-bold text-surface-900 dark:text-white">
                          참여 중인 팀이 없습니다
                        </h2>
                        <p className="text-[14px] font-medium text-surface-400 leading-relaxed whitespace-pre-line">
                          새로운 팀을 만들거나{"\n"}초대 코드로 참여해보세요.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
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
