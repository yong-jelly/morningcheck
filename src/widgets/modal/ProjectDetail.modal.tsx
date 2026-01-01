import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft } from "lucide-react";
import { useAppStore } from "@/shared/lib/store";
import { cn } from "@/shared/lib/cn";
import type { CheckIn } from "@/entities/project/model/types";
import { projectApi, mapProjectFromDb } from "@/entities/project/api/project";

import { ProjectCheckInTab } from "./project-detail/ProjectCheckInTab";
import { ProjectTeamTab } from "./project-detail/ProjectTeamTab";
import { ProjectHistoryTab } from "./project-detail/ProjectHistoryTab";
import { Dialog } from "@/shared/ui/Dialog";
import { StatusView } from "@/shared/ui/StatusView";

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

type TabType = "check-in" | "team" | "history";
type ViewMode = "normal" | "result";

interface ResultData {
  icon?: string;
  title: string;
  description: string;
  confirmLabel?: string;
  requestedAt?: string;
  showIcon?: boolean;
  showButton?: boolean;
}

/**
 * 프로젝트 상세 정보를 보여주는 모달 컴포넌트입니다.
 * 
 * [정책 사항]
 * 1. 브라우저 기본 alert, confirm 대신 커스텀 Dialog 컴포넌트를 사용합니다.
 * 2. 참여하기, 탈퇴하기, 참여 요청 등의 액션 시 사용자 확인 단계를 거칩니다.
 * 3. 액션 완료 후에는 '결과 화면(StatusView)'을 노출하여 사용자에게 성공/상태 정보를 명확히 전달합니다.
 * 4. 결과 화면에서 확인을 누르면 프로젝트 상세의 초기 상태(적절한 탭)로 복귀합니다.
 * 5. '승인 대기 중' 상태인 경우, 상세 정보를 볼 수 없도록 미니멀한 텍스트 기반 화면을 노출하며 확인 버튼을 제거합니다.
 */
export function ProjectDetailModal({ isOpen, onClose, projectId }: ProjectDetailModalProps) {
  const { currentUser, projects, addCheckIn, removeCheckIn, setProjects } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>("check-in");
  const [viewMode, setViewMode] = useState<ViewMode>("normal");
  const [resultData, setResultData] = useState<ResultData | null>(null);
  
  const [isJoinLoading, setIsJoinLoading] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  
  // Dialog state
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
    variant?: "danger" | "primary" | "default";
  }>({
    isOpen: false,
    title: "",
    onConfirm: () => {},
  });

  // Check-in form state
  const [condition, setCondition] = useState(5);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const project = projects.find((p) => p.id === projectId);
  const isMember = project?.members.some(m => m.id === currentUser?.id);
  
  // 현재 사용자의 초대 상태 확인
  const invitation = project?.invitations?.find(
    (i) => i.email === currentUser?.email && i.status === "pending"
  );
  const isInvited = !!invitation;

  // 현재 사용자의 참여 요청 상태 확인
  const joinRequest = project?.joinRequests?.find(
    (r) => r.userId === currentUser?.id && r.status === "pending"
  );
  const isRequested = !!joinRequest;

  const today = new Date().toISOString().split("T")[0];
  
  const todayCheckIn = project?.checkIns.find(
    (c) => c.userId === currentUser?.id && c.date === today
  );
  const hasCheckedInToday = !!todayCheckIn;

  // 모달이 열릴 때마다 최신 프로젝트 정보 페치
  const fetchProjectData = async () => {
    if (isLoadingProject) return;
    try {
      setIsLoadingProject(true);
      const p = await projectApi.getProjectById(projectId);
      const mappedProject = mapProjectFromDb(p);
      
      // 스토어 갱신
      setProjects((prev) => {
        const exists = prev.some(item => item.id === projectId);
        if (exists) {
          return prev.map(item => item.id === projectId ? mappedProject : item);
        } else {
          return [...prev, mappedProject];
        }
      });
    } catch (error) {
      console.error("Failed to fetch project:", error);
    } finally {
      setIsLoadingProject(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjectData();
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    if (isOpen && project) {
      document.body.style.overflow = "hidden";
      
      // 초대받은 상태라면 결과 화면 모드로 진입 (수락하기 유도)
      if (isInvited && invitation && viewMode === "normal") {
        setResultData({
          icon: "✉️",
          title: "초대가 도착했습니다",
          description: `${project.name} 프로젝트에서 초대장을 보냈습니다.\n수락하고 함께 시작해볼까요?`,
          confirmLabel: "초대 수락하기",
          showIcon: true,
          showButton: true
        });
        setViewMode("result");
      }
      // 참여 요청 중이면 결과 화면 모드로 진입 (미니멀 타이포 스타일)
      else if (isRequested && joinRequest && viewMode === "normal") {
        setResultData({
          title: "승인 대기 중",
          description: "관리자의 승인을 기다리고 있습니다.\n승인 후 체크인을 시작할 수 있습니다.",
          requestedAt: joinRequest.requestedAt,
          showIcon: false,
          showButton: false
        });
        setViewMode("result");
      } else if (!isMember) {
        setActiveTab("team");
      } else {
        // 이미 참여 중이고 결과 화면이 아니라면 적절한 탭 설정
        if (viewMode === "normal") {
          setActiveTab(hasCheckedInToday ? "team" : "check-in");
        }
      }
      
      if (viewMode === "normal") {
        setCondition(5);
        setNote("");
      }
    } else if (!isOpen) {
      document.body.style.overflow = "";
      setViewMode("normal");
      setResultData(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, hasCheckedInToday, isMember, isRequested, !!project]);

  if (!isOpen || !project || !currentUser) return null;

  const showDialog = (config: Omit<typeof dialogConfig, "isOpen">) => {
    setDialogConfig({ ...config, isOpen: true });
  };

  const closeDialog = () => {
    setDialogConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleJoinAction = async () => {
    if (isJoinLoading || !currentUser || !project) return;
    try {
      setIsJoinLoading(true);
      if (isInvited && invitation) {
        await projectApi.acceptInvitation(projectId, currentUser.id, invitation.id);
        await fetchProjectData();
        setResultData({
          icon: "🎉",
          title: "참여 완료!",
          description: `${project.name}에 오신 것을 환영합니다.\n지금 바로 첫 체크인을 시작해보세요!`
        });
        setViewMode("result");
      } else if (project.visibilityType === "public") {
        await projectApi.joinProject(projectId, currentUser.id);
        await fetchProjectData();
        setResultData({
          icon: "🚀",
          title: "참여 성공",
          description: `${project.name} 프로젝트에 참여했습니다.\n동료들과 함께 오늘의 컨디션을 공유해보세요!`
        });
        setViewMode("result");
      } else if (project.visibilityType === "request") {
        await projectApi.requestToJoin(projectId, currentUser.id);
        await fetchProjectData();
        // 최신 정보를 다시 가져오면 isRequested가 true가 되어 useEffect에서 처리될 것이지만,
        // 즉각적인 피드백을 위해 수동으로 설정 (미니멀 타이포 스타일)
        setResultData({
          title: "참여 요청 완료",
          description: "관리자에게 참여 요청을 보냈습니다.\n승인이 완료되면 알려드릴게요!",
          requestedAt: new Date().toISOString(),
          showIcon: false,
          showButton: false
        });
        setViewMode("result");
      }
    } catch (error) {
      console.error("Join failed:", error);
      showDialog({
        title: "참여 실패",
        description: "프로젝트 참여 중 오류가 발생했습니다. 다시 시도해주세요.",
        onConfirm: () => {}
      });
    } finally {
      setIsJoinLoading(false);
    }
  };

  const handleJoin = () => {
    let title = "프로젝트 참여";
    let description = "이 프로젝트에 참여하시겠습니까?";
    
    if (isInvited) {
      title = "초대 수락";
      description = "프로젝트 초대를 수락하고 멤버로 참여하시겠습니까?";
    } else if (project.visibilityType === "request") {
      title = "참여 요청";
      description = "관리자에게 참여 요청을 보내시겠습니까?";
    }

    showDialog({
      title,
      description,
      onConfirm: handleJoinAction
    });
  };

  const handleLeaveAction = async () => {
    if (!currentUser || !project) return;
    try {
      await projectApi.leaveProject(projectId, currentUser.id);
      await fetchProjectData();
      setResultData({
        icon: "👋",
        title: "탈퇴 완료",
        description: "프로젝트에서 안전하게 탈퇴 처리되었습니다.\n언제든 다시 돌아오세요!"
      });
      setViewMode("result");
    } catch (error) {
      console.error("Leave project failed:", error);
      showDialog({
        title: "탈퇴 실패",
        description: "탈퇴 처리 중 오류가 발생했습니다.",
        onConfirm: () => {}
      });
    }
  };

  const handleLeaveProject = () => {
    showDialog({
      title: "프로젝트 탈퇴",
      description: "정말로 이 프로젝트에서 나가시겠습니까?\n그동안의 체크인 기록은 유지되지만 멤버 목록에서 제외됩니다.",
      variant: "danger",
      onConfirm: handleLeaveAction
    });
  };

  const handleCheckInSubmit = async () => {
    if (!currentUser || !project) return;
    
    try {
      setIsSubmitting(true);
      const data = await projectApi.checkIn(
        projectId,
        currentUser.id,
        condition,
        note
      );
      
      const newCheckIn: CheckIn = {
        id: data.id,
        userId: data.user_id,
        date: data.check_in_date,
        condition: data.condition,
        note: data.note,
        createdAt: data.created_at,
      };
      
      addCheckIn(projectId, newCheckIn);
      await fetchProjectData();
      setActiveTab("team");
    } catch (error) {
      console.error("Check-in failed:", error);
      showDialog({
        title: "체크인 실패",
        description: "오늘의 컨디션 기록에 실패했습니다.",
        onConfirm: () => {}
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckInCancelAction = async () => {
    if (todayCheckIn) {
      const checkInId = todayCheckIn.id;
      try {
        await projectApi.cancelCheckIn(checkInId);
        removeCheckIn(projectId, checkInId);
        setActiveTab("check-in");
        setTimeout(() => {
          fetchProjectData();
        }, 500);
      } catch (error) {
        console.error("Cancel check-in failed:", error);
        showDialog({
          title: "취소 실패",
          description: "체크인 취소 중 오류가 발생했습니다.",
          onConfirm: () => {}
        });
      }
    }
  };

  const handleCheckInCancel = () => {
    showDialog({
      title: "체크인 취소",
      description: "오늘 기록한 컨디션 데이터를 삭제하시겠습니까?",
      variant: "danger",
      onConfirm: handleCheckInCancelAction
    });
  };

  const handleResultConfirm = () => {
    if (isInvited && viewMode === "result" && resultData?.title === "초대가 도착했습니다") {
      handleJoin(); // 초대 수락 액션 실행
      return;
    }

    setViewMode("normal");
    setResultData(null);
    // 상태에 따라 적절한 탭으로 이동
    if (isMember) {
      setActiveTab(hasCheckedInToday ? "team" : "check-in");
    } else {
      setActiveTab("team");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white md:bg-black/40 md:backdrop-blur-sm">
      <div
        className="relative w-full h-full md:w-[480px] md:h-[90vh] md:rounded-[32px] overflow-hidden bg-white dark:bg-surface-900 flex flex-col border border-surface-100 dark:border-surface-800"
      >
        {/* Header */}
        <header className="shrink-0 border-b border-surface-100 dark:border-surface-800 safe-area-top bg-white/80 dark:bg-surface-900/80 backdrop-blur-md z-10">
          <div className="px-5 py-4 flex items-center justify-between gap-2">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-white transition-colors shrink-0"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center px-1 overflow-hidden">
              <button 
                onClick={() => {
                  if (viewMode === "normal") setActiveTab("check-in");
                }}
                className="flex items-center justify-center gap-2 mb-0.5 mx-auto max-w-full"
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  {project.iconType === "image" ? (
                    <img src={project.icon} alt={project.name} className="w-full h-full object-cover rounded-md" />
                  ) : (
                    <span className="text-lg">{project.icon || "🚀"}</span>
                  )}
                </div>
                <h1 className="text-[17px] font-bold tracking-tight text-surface-900 dark:text-white truncate">{project.name}</h1>
              </button>
              <p className="text-[11px] font-medium text-surface-400 truncate mx-auto max-w-[200px]">
                {project.description || "프로젝트 설명이 없습니다"}
              </p>
            </div>
            <div className="shrink-0 flex items-center justify-end gap-2">
              {viewMode === "normal" && (
                <>
                  {isMember ? (
                    <>
                      {hasCheckedInToday ? (
                        <button
                          onClick={handleCheckInCancel}
                          className="px-3 h-9 flex items-center justify-center font-bold text-[13px] text-red-500 hover:text-red-600 transition-colors active:scale-95"
                        >
                          취소
                        </button>
                      ) : activeTab === "check-in" ? (
                        <button
                          onClick={handleCheckInSubmit}
                          disabled={isSubmitting}
                          className={cn(
                            "px-4 h-9 flex items-center justify-center rounded-full font-bold text-[14px] transition-all duration-200",
                            !isSubmitting
                              ? "bg-surface-900 text-white dark:bg-white dark:text-surface-900 active:scale-95"
                              : "bg-surface-100 text-surface-400 dark:bg-surface-800 dark:text-surface-600 cursor-not-allowed"
                          )}
                        >
                          {isSubmitting ? "..." : "체크인!"}
                        </button>
                      ) : null}
                      {project.createdBy !== currentUser.id && (
                        <button
                          onClick={handleLeaveProject}
                          className="w-9 h-9 flex items-center justify-center rounded-full text-surface-400 hover:text-red-500 transition-colors active:scale-95"
                          title="프로젝트 탈퇴"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        </button>
                      )}
                    </>
                  ) : (
                    isInvited ? (
                      <button
                        onClick={handleJoin}
                        disabled={isJoinLoading}
                        className="px-4 h-9 flex items-center justify-center rounded-full font-bold text-[14px] bg-primary-600 text-white active:scale-95 transition-all"
                      >
                        {isJoinLoading ? "..." : "초대 수락"}
                      </button>
                    ) : isRequested ? (
                      <button
                        disabled
                        className="px-4 h-9 flex items-center justify-center rounded-full font-bold text-[14px] bg-surface-100 dark:bg-surface-800 text-surface-400 cursor-not-allowed"
                      >
                        승인 대기 중
                      </button>
                    ) : project.visibilityType === "public" ? (
                      <button
                        onClick={handleJoin}
                        disabled={isJoinLoading}
                        className="px-4 h-9 flex items-center justify-center rounded-full font-bold text-[14px] bg-primary-600 text-white active:scale-95 transition-all"
                      >
                        {isJoinLoading ? "..." : "참여하기"}
                      </button>
                    ) : project.visibilityType === "request" ? (
                      <button
                        onClick={handleJoin}
                        disabled={isJoinLoading}
                        className="px-4 h-9 flex items-center justify-center rounded-full font-bold text-[14px] bg-primary-600 text-white active:scale-95 transition-all"
                      >
                        {isJoinLoading ? "..." : "참여 요청"}
                      </button>
                    ) : null
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {viewMode === "result" && resultData ? (
            <StatusView 
              {...resultData}
              onConfirm={handleResultConfirm}
            />
          ) : (
            <>
              {activeTab === "check-in" && (
                <ProjectCheckInTab 
                  project={project}
                  currentUser={currentUser}
                  condition={condition}
                  setCondition={setCondition}
                  note={note}
                  setNote={setNote}
                />
              )}
              {activeTab === "team" && (
                <ProjectTeamTab 
                  project={project} 
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  hasCheckedInToday={hasCheckedInToday || false}
                />
              )}
              {activeTab === "history" && (
                <ProjectHistoryTab 
                  project={project} 
                  currentUser={currentUser}
                  onTabChange={setActiveTab}
                  hasCheckedInToday={hasCheckedInToday || false}
                />
              )}
            </>
          )}
        </div>
      </div>

      <Dialog 
        {...dialogConfig}
        onClose={closeDialog}
      />
    </div>,
    document.body
  );
}
