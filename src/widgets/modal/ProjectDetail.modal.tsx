import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft } from "lucide-react";
import { useAppStore } from "@/shared/lib/store";
import { cn } from "@/shared/lib/cn";
import type { CheckIn } from "@/entities/project/model/types";

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
  const { currentUser, projects, addCheckIn, removeCheckIn } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>("check-in");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Check-in form state
  const [condition, setCondition] = useState(5);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const project = projects.find((p) => p.id === projectId);
  const today = new Date().toISOString().split("T")[0];
  
  const todayCheckIn = project?.checkIns.find(
    (c) => c.userId === currentUser?.id && c.date === today
  );
  const hasCheckedInToday = !!todayCheckIn;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // 오늘 체크인을 이미 했다면 바로 팀 탭을, 아니면 체크인 탭을 보여줍니다.
      setActiveTab(hasCheckedInToday ? "team" : "check-in");
      setCondition(5);
      setNote("");
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, hasCheckedInToday]);

  if (!isOpen || !project || !currentUser) return null;

  const handleCheckInSubmit = async () => {
    setIsSubmitting(true);
    // Simulation
    await new Promise(r => setTimeout(r, 600));
    
    const newCheckIn: CheckIn = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      date: today,
      condition,
      note,
      createdAt: new Date().toISOString(),
    };
    addCheckIn(projectId, newCheckIn);
    setIsSubmitting(false);
    setActiveTab("team");
  };

  const handleCheckInCancel = () => {
    if (todayCheckIn) {
      removeCheckIn(projectId, todayCheckIn.id);
      setActiveTab("check-in");
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
            <div className="shrink-0 flex items-center justify-end">
              {!hasCheckedInToday && activeTab === "check-in" ? (
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
              ) : hasCheckedInToday ? (
                <button
                  onClick={handleCheckInCancel}
                  className="px-3 h-9 flex items-center justify-center font-bold text-[13px] text-red-500 hover:text-red-600 transition-colors active:scale-95"
                >
                  취소
                </button>
              ) : (
                <div className="w-10" /> // 여백 유지
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
        projectId={projectId} 
      />
    </div>,
    document.body
  );
}
