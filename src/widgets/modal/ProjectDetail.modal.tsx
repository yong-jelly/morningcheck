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
import { ProjectSettingsModal } from "./ProjectSettings.modal";

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

type TabType = "check-in" | "team" | "history";

/**
 * 프로젝트 상세 정보를 보여주는 모달 컴포넌트입니다.
 * 이제 /projects/:projectId URL을 통해 직접 접근하거나 
 * 목록에서 프로젝트를 클릭했을 때 호출됩니다.
 */
export function ProjectDetailModal({ isOpen, onClose, projectId }: ProjectDetailModalProps) {
  const { currentUser, projects, addCheckIn, removeCheckIn, setProjects } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>("check-in");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isJoinLoading, setIsJoinLoading] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  
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
      
      // 스토어 갱신: 기존 목록에서 해당 프로젝트만 교체하거나 추가
      const exists = projects.some(item => item.id === projectId);
      if (exists) {
        setProjects(projects.map(item => item.id === projectId ? mappedProject : item));
      } else {
        setProjects([...projects, mappedProject]);
      }
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
      if (!isMember) {
        setActiveTab("team"); // 비멤버는 체크인 탭 못봄
      } else {
        setActiveTab(hasCheckedInToday ? "team" : "check-in");
      }
      setCondition(5);
      setNote("");
    } else if (!isOpen) {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, hasCheckedInToday, isMember, !!project]);

  if (!isOpen || !project || !currentUser) return null;

  const handleJoin = async () => {
    if (isJoinLoading || !currentUser || !project) return;
    try {
      setIsJoinLoading(true);
      if (isInvited && invitation) {
        await projectApi.acceptInvitation(projectId, currentUser.id, invitation.id);
        await fetchProjectData();
        alert("초대를 수락하고 프로젝트에 참여했습니다.");
      } else if (project.visibilityType === "public") {
        await projectApi.joinProject(projectId, currentUser.id);
        await fetchProjectData();
        alert("프로젝트에 참여되었습니다.");
      } else if (project.visibilityType === "request") {
        await projectApi.requestToJoin(projectId, currentUser.id);
        await fetchProjectData();
        alert("참여 요청을 보냈습니다. 관리자 승인 후 참여 가능합니다.");
      }
    } catch (error) {
      console.error("Join failed:", error);
      alert("참여에 실패했습니다.");
    } finally {
      setIsJoinLoading(false);
    }
  };

  const handleLeaveProject = async () => {
    if (!currentUser || !project) return;
    if (!confirm("정말로 이 프로젝트에서 나가시겠습니까?")) return;
    
    try {
      await projectApi.leaveProject(projectId, currentUser.id);
      await fetchProjectData();
      alert("프로젝트에서 탈퇴했습니다.");
      onClose(); // 탈퇴 후 모달 닫기
    } catch (error) {
      console.error("Leave project failed:", error);
      alert("탈퇴에 실패했습니다.");
    }
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
      
      // 체크인 후 최신 데이터(통계 및 팀 현황) 재로드
      await fetchProjectData();
      
      setActiveTab("team");
    } catch (error) {
      console.error("Check-in failed:", error);
      alert("체크인에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckInCancel = async () => {
    if (todayCheckIn) {
      try {
        await projectApi.cancelCheckIn(todayCheckIn.id);
        removeCheckIn(projectId, todayCheckIn.id);
        
        // 취소 후 데이터 동기화
        await fetchProjectData();
        
        setActiveTab("check-in");
      } catch (error) {
        console.error("Cancel check-in failed:", error);
        alert("체크인 취소에 실패했습니다.");
      }
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
                onClick={() => setActiveTab("check-in")}
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
                  {/* 탈퇴 버튼 (본인이 생성한 프로젝트가 아닐 때만 노출하거나 별도 처리 가능) */}
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
                  <div className="flex flex-col items-end">
                    <span className="text-[12px] font-bold text-surface-400">참여 요청됨</span>
                    <span className="text-[9px] text-surface-400">승인 대기 중</span>
                  </div>
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
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
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
              onSettingsOpen={() => setIsSettingsOpen(true)}
              hasCheckedInToday={hasCheckedInToday || false}
            />
          )}
          {activeTab === "history" && (
            <ProjectHistoryTab 
              project={project} 
              currentUser={currentUser}
              onTabChange={setActiveTab}
              onSettingsOpen={() => setIsSettingsOpen(true)}
              hasCheckedInToday={hasCheckedInToday || false}
            />
          )}
        </div>
      </div>

      <ProjectSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        project={project}
        onSuccess={() => {}} 
      />
    </div>,
    document.body
  );
}
