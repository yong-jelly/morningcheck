import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2, Archive } from "lucide-react";
import { useAppStore } from "@/shared/lib/store";
import { cn } from "@/shared/lib/cn";
import type { Project } from "@/entities/project/model/types";
import { projectApi } from "@/entities/project/api/project";
import { supabase } from "@/shared/lib/supabase";
import { Dialog } from "@/shared/ui/Dialog";

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSuccess: () => void;
}

const PRESET_EMOJIS = ["🚀", "🎨", "🌈", "🔥", "⭐️", "🍀", "🍎", "🍕", "🐶", "👾", "☀️", "🌙", "☁️", "🌊", "🌸"];

export function ProjectSettingsModal({ isOpen, onClose, project, onSuccess }: ProjectSettingsModalProps) {
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(project.description || "");
  const [icon, setIcon] = useState(project.icon || PRESET_EMOJIS[0]);
  const [iconType, setIconType] = useState<"emoji" | "image">(project.iconType || "emoji");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProjectStore = useAppStore((state) => state.updateProject);
  const removeProjectFromStore = useAppStore((state) => state.removeProject); // Assuming removeProject exists, if not I'll check store

  useEffect(() => {
    if (isOpen) {
      setProjectName(project.name);
      setProjectDescription(project.description || "");
      setIcon(project.icon || PRESET_EMOJIS[0]);
      setIconType(project.iconType || "emoji");
      setSelectedFile(null);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, project]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIcon(reader.result as string);
        setIconType("image");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!projectName.trim() || isLoading) return;

    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let finalIcon = icon;
      if (iconType === "image" && selectedFile) {
        finalIcon = await projectApi.uploadProjectIcon(selectedFile, user.id);
      }

      const updatedProject = await projectApi.updateProject(project.id, {
        name: projectName.trim(),
        description: projectDescription.trim(),
        icon: finalIcon,
        iconType,
      });

      // 스토어 업데이트
      updateProjectStore(project.id, {
        name: updatedProject.name,
        description: updatedProject.description,
        icon: updatedProject.icon,
        iconType: updatedProject.icon_type as "emoji" | "image",
        updatedAt: updatedProject.updated_at,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to update project:", error);
      alert("프로젝트 수정에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    try {
      setIsArchiveLoading(true);
      await projectApi.archiveProject(project.id);
      
      // 스토어 업데이트 (아카이브 상태 반영)
      updateProjectStore(project.id, {
        archivedAt: new Date().toISOString(),
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to archive project:", error);
      alert("프로젝트 아카이브에 실패했습니다.");
    } finally {
      setIsArchiveLoading(false);
      setShowArchiveDialog(false);
    }
  };

  if (!isOpen) return null;

  const isValid = projectName.trim() !== "";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white md:bg-black/40 md:backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative w-full h-full md:w-[480px] md:h-[85vh] md:rounded-[32px] md:shadow-2xl overflow-hidden bg-white flex flex-col"
      >
        <header className="shrink-0 border-b border-surface-100 dark:border-surface-800">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-[17px] font-bold text-surface-900 dark:text-white">프로젝트 수정</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowArchiveDialog(true)}
                disabled={isLoading || isArchiveLoading}
                className="w-10 h-10 flex items-center justify-center text-surface-400 hover:text-red-500 transition-colors"
                title="아카이브"
              >
                <Archive className="w-5 h-5" />
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid || isLoading || isArchiveLoading}
                className={cn(
                  "px-5 h-9 flex items-center justify-center rounded-full font-bold text-[14px] transition-all duration-200",
                  isValid && !isLoading && !isArchiveLoading
                    ? "bg-surface-900 text-white dark:bg-white dark:text-surface-900 active:scale-95"
                    : "bg-surface-100 text-surface-400 dark:bg-surface-800 dark:text-surface-600 cursor-not-allowed"
                )}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "저장"}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-10">
          <div className="max-w-md mx-auto space-y-10">
            <div className="space-y-8">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div 
                    className={cn(
                      "w-24 h-24 rounded-[32px] flex items-center justify-center text-4xl shadow-xl border-4 border-white dark:border-surface-800 transition-all overflow-hidden",
                      iconType === "emoji" ? "bg-surface-50 dark:bg-surface-900" : "bg-surface-100"
                    )}
                  >
                    {iconType === "emoji" ? icon : <img src={icon} alt="Project Icon" className="w-full h-full object-cover" />}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 px-3 py-1.5 bg-white dark:bg-surface-800 rounded-2xl shadow-lg border border-surface-100 dark:border-surface-700 text-[11px] font-bold active:scale-90 transition-transform"
                  >
                    이미지
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>

                <div className="w-full space-y-3">
                  <label className="block text-[11px] font-bold text-surface-400 uppercase tracking-widest text-center">
                    아이콘 선택
                  </label>
                  <div className="flex flex-wrap justify-center gap-2">
                    {PRESET_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setIcon(emoji);
                          setIconType("emoji");
                        }}
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90",
                          icon === emoji && iconType === "emoji"
                            ? "bg-surface-100 dark:bg-surface-800 ring-2 ring-surface-900 dark:ring-white"
                            : "bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[14px] font-bold text-surface-900 dark:text-white ml-1">
                  프로젝트 이름
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className={cn(
                    "w-full h-14 text-[17px] font-bold rounded-2xl border-none transition-all px-4 bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700"
                  )}
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[14px] font-bold text-surface-900 dark:text-white ml-1">
                  프로젝트 소개 (선택)
                </label>
                <input
                  type="text"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className={cn(
                    "w-full h-14 text-[17px] font-bold rounded-2xl border-none transition-all px-4 bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700"
                  )}
                />
              </div>

              <div className="p-4 bg-surface-50 dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800">
                <div className="text-[13px] font-bold text-surface-400 mb-1 uppercase tracking-wider">공개 설정 (변경 불가)</div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {project.visibilityType === 'public' ? '🌐' : project.visibilityType === 'request' ? '✉️' : '🔒'}
                  </span>
                  <div className="text-[15px] font-bold text-surface-900 dark:text-white">
                    {project.visibilityType === 'public' ? '공개' : project.visibilityType === 'request' ? '참여요청' : '초대'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <Dialog
        isOpen={showArchiveDialog}
        onClose={() => setShowArchiveDialog(false)}
        title="프로젝트 아카이브"
        description="프로젝트를 아카이브하시겠습니까? 아카이브하면 모든 사용자에게서 보이지 않게 되며, 본인만 상세 페이지에서 복원하거나 삭제할 수 있습니다."
        confirmLabel="아카이브"
        onConfirm={handleArchive}
        variant="danger"
      />
    </div>,
    document.body
  );
}
