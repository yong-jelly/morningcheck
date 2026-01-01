import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useAppStore } from "@/shared/lib/store";
import { cn } from "@/shared/lib/cn";
import type { Project } from "@/entities/project/model/types";
import { projectApi } from "@/entities/project/api/project";
import { supabase } from "@/shared/lib/supabase";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_EMOJIS = ["🚀", "🎨", "🌈", "🔥", "⭐️", "🍀", "🍎", "🍕", "🐶", "👾", "☀️", "🌙", "☁️", "🌊", "🌸"];

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [icon, setIcon] = useState(PRESET_EMOJIS[0]);
  const [iconType, setIconType] = useState<"emoji" | "image">("emoji");
  const [visibilityType, setVisibilityType] = useState<"public" | "request" | "invite">("invite");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addProject = useAppStore((state) => state.addProject);
  const { currentUser } = useAppStore();

  useEffect(() => {
    if (isOpen) {
      setProjectName("");
      setProjectDescription("");
      setIcon(PRESET_EMOJIS[Math.floor(Math.random() * PRESET_EMOJIS.length)]);
      setIconType("emoji");
      setVisibilityType("invite");
      setSelectedFile(null);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      let finalIcon = icon;
      if (iconType === "image" && selectedFile) {
        finalIcon = await projectApi.uploadProjectIcon(selectedFile, user.id);
      }

      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      const createdProject = await projectApi.createProject({
        name: projectName.trim(),
        description: projectDescription.trim(),
        icon: finalIcon,
        iconType,
        inviteCode,
        visibilityType,
        createdBy: user.id,
      });

      // 스토어 업데이트 (UI 반영용)
      const newProject: Project = {
        id: createdProject.id,
        name: createdProject.name,
        description: createdProject.description,
        icon: createdProject.icon,
        iconType: createdProject.icon_type,
        inviteCode: createdProject.invite_code,
        visibilityType: createdProject.visibility_type,
        members: currentUser ? [currentUser] : [],
        checkIns: [],
        createdBy: createdProject.created_by,
        createdAt: createdProject.created_at,
        updatedAt: createdProject.updated_at,
      };

      addProject(newProject);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("프로젝트 생성에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isValid = projectName.trim() !== "";

  const visibilityOptions = [
    {
      id: "invite",
      title: "초대 전용",
      description: "초대된 사람만 참여할 수 있습니다.",
    },
    {
      id: "request",
      title: "참여 요청",
      description: "관리자 승인 후 참여할 수 있습니다.",
    },
    {
      id: "public",
      title: "전체 공개",
      description: "누구나 즉시 참여할 수 있습니다.",
    },
  ];
  
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white md:bg-black/40 md:backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative w-full h-full md:w-[480px] md:h-[85vh] md:rounded-[32px] md:shadow-2xl overflow-hidden bg-white flex flex-col"
      >
        {/* Header - Simplified */}
        <header className="shrink-0 border-b border-surface-100 dark:border-surface-800">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-[17px] font-bold text-surface-900 dark:text-white">프로젝트 만들기</h1>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!isValid || isLoading}
              className={cn(
                "px-5 h-9 flex items-center justify-center rounded-full font-bold text-[14px] transition-all duration-200",
                isValid && !isLoading
                  ? "bg-surface-900 text-white dark:bg-white dark:text-surface-900 active:scale-95"
                  : "bg-surface-100 text-surface-400 dark:bg-surface-800 dark:text-surface-600 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "저장"
              )}
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-10">
          <div className="max-w-md mx-auto space-y-10">
            {/* <div className="space-y-3">
              <span className="text-[11px] font-bold text-surface-400 uppercase tracking-widest px-2 py-1 bg-surface-50 dark:bg-surface-900 rounded-md">
                새 프로젝트
              </span>
              <h2 className="text-[28px] font-bold leading-tight tracking-tighter text-surface-900 dark:text-white">
                프로젝트의<br />아이콘과 이름을 정해주세요
              </h2>
            </div> */}

            <div className="space-y-8">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div 
                    className={cn(
                      "w-24 h-24 rounded-[32px] flex items-center justify-center text-4xl shadow-xl border-4 border-white dark:border-surface-800 transition-all overflow-hidden",
                      iconType === "emoji" ? "bg-surface-50 dark:bg-surface-900" : "bg-surface-100"
                    )}
                  >
                    {iconType === "emoji" ? (
                      icon
                    ) : (
                      <img src={icon} alt="Project Icon" className="w-full h-full object-cover" />
                    )}
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
                  autoFocus
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="아침햇살 팀 TF"
                  className={cn(
                    "w-full h-14 text-[17px] font-bold rounded-2xl border-none transition-all px-4",
                    projectName.trim() !== "" 
                      ? "bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700" 
                      : "bg-surface-50 dark:bg-surface-900 focus:bg-white dark:focus:bg-surface-800 focus:ring-2 focus:ring-surface-900 dark:focus:ring-white"
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
                  placeholder="예: 멋진 우리 팀"
                  className={cn(
                    "w-full h-14 text-[17px] font-bold rounded-2xl border-none transition-all px-4",
                    projectDescription.trim() !== "" 
                      ? "bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700" 
                      : "bg-surface-50 dark:bg-surface-900 focus:bg-white dark:focus:bg-surface-800 focus:ring-2 focus:ring-surface-900 dark:focus:ring-white"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isValid) handleSubmit();
                  }}
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[14px] font-bold text-surface-900 dark:text-white ml-1">
                  공개 설정 (변경 불가)
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {visibilityOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setVisibilityType(option.id as any)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl text-left transition-all border-2",
                        visibilityType === option.id
                          ? "bg-white dark:bg-surface-800 border-surface-900 dark:border-white"
                          : "bg-white dark:bg-surface-800 border-surface-100 dark:border-surface-700 hover:border-surface-200 dark:hover:border-surface-600"
                      )}
                    >
                      <div className="flex-1">
                        <div className="text-[15px] font-bold text-surface-900 dark:text-white">
                          {option.title}
                        </div>
                        <div className="text-[12px] text-surface-500 dark:text-surface-400">
                          {option.description}
                        </div>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                        visibilityType === option.id
                          ? "border-surface-900 dark:border-white"
                          : "border-surface-200 dark:border-surface-700"
                      )}>
                        {visibilityType === option.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-surface-900 dark:bg-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
