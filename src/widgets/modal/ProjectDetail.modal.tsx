import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, Settings, Users, History } from "lucide-react";
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

export function ProjectDetailModal({ isOpen, onClose, projectId }: ProjectDetailModalProps) {
  const { currentUser, projects, addCheckIn, removeCheckIn } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>("check-in");
  const [copied, setCopied] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Check-in form state
  const [condition, setCondition] = useState(5);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const project = projects.find((p) => p.id === projectId);
  const today = new Date().toISOString().split("T")[0];
  
  const hasCheckedInToday = project?.checkIns.some(
    (c) => c.userId === currentUser?.id && c.date === today
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setActiveTab("check-in");
      setCondition(5);
      setNote("");
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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

  const handleCancelCheckIn = () => {
    const todayCheckIn = project.checkIns.find(
      (c) => c.userId === currentUser.id && c.date === today
    );
    if (todayCheckIn) {
      removeCheckIn(projectId, todayCheckIn.id);
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(project.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              className="w-10 h-10 flex items-center justify-center rounded-full text-surface-500 transition-colors active:bg-surface-100 dark:active:bg-surface-800 shrink-0"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center px-1 overflow-hidden">
              <button 
                onClick={() => setActiveTab("check-in")}
                className="flex items-center justify-center gap-2 mb-0.5 mx-auto max-w-full"
              >
                <div className={cn(
                  "w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0",
                  project.iconType === "image" ? "bg-surface-100" : "bg-surface-50 dark:bg-primary-900/20"
                )}>
                  {project.iconType === "image" ? (
                    <img src={project.icon} alt={project.name} className="w-full h-full object-cover rounded-md" />
                  ) : (
                    <span>{project.icon || "🚀"}</span>
                  )}
                </div>
                <h1 className="text-[17px] font-bold tracking-tight text-surface-900 dark:text-white truncate">{project.name}</h1>
              </button>
              <button 
                onClick={copyInviteCode}
                className="flex items-center justify-center gap-1.5 mx-auto text-[10px] font-bold text-surface-400 hover:text-primary-600 transition-colors uppercase tracking-[0.2em]"
              >
                #{project.inviteCode} {copied && "(복사됨)"}
              </button>
            </div>
            <div className="flex items-center shrink-0">
              <button
                onClick={() => setActiveTab("team")}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-full transition-colors active:bg-surface-100 dark:active:bg-surface-800",
                  activeTab === "team" ? "text-primary-600 dark:text-primary-400" : "text-surface-500"
                )}
              >
                <Users className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-full transition-colors active:bg-surface-100 dark:active:bg-surface-800",
                  activeTab === "history" ? "text-primary-600 dark:text-primary-400" : "text-surface-500"
                )}
              >
                <History className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-surface-500 transition-colors active:bg-surface-100 dark:active:bg-surface-800"
              >
                <Settings className="w-5 h-5" />
              </button>
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
              hasCheckedInToday={hasCheckedInToday || false}
            />
          )}
          {activeTab === "team" && (
            <ProjectTeamTab project={project} />
          )}
          {activeTab === "history" && (
            <ProjectHistoryTab project={project} currentUser={currentUser} />
          )}
        </div>

        {/* Footer Action */}
        <footer className="shrink-0 p-6 bg-white dark:bg-surface-900 border-t border-surface-100 dark:border-surface-800">
          {!hasCheckedInToday && activeTab === "check-in" ? (
            <button
              onClick={handleCheckInSubmit}
              disabled={isSubmitting}
              className={cn(
                "w-full h-16 flex items-center justify-center rounded-2xl font-bold text-[17px] transition-all duration-300 bg-surface-900 dark:bg-white text-white dark:text-surface-900 active:scale-[0.98]",
                isSubmitting && "opacity-70"
              )}
            >
              {isSubmitting ? "체크인 중..." : "체크인 완료"}
            </button>
          ) : (
            <div className="flex flex-col items-center w-full">
              <button
                onClick={() => setActiveTab(activeTab === "check-in" ? "team" : "check-in")}
                className="w-full h-16 flex items-center justify-center rounded-2xl font-bold text-[17px] bg-surface-50 dark:bg-surface-800 text-surface-400"
              >
                {activeTab === "check-in" ? "오늘의 체크인 완료" : "체크인 화면으로 돌아가기"}
              </button>
              
              {/* Debug Button */}
              <button 
                onClick={handleCancelCheckIn}
                className="mt-4 text-[10px] font-bold text-surface-200 hover:text-red-500 transition-colors uppercase tracking-widest"
              >
                Debug: Reset Today's Check-in
              </button>
            </div>
          )}
        </footer>
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
