import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useAppStore } from "@/shared/lib/store";
import { cn } from "@/shared/lib/cn";
import type { Project, User } from "@/entities/project/model/types";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_EMOJIS = ["🚀", "🎨", "🌈", "🔥", "⭐️", "🍀", "🍎", "🍕", "🐶", "👾", "☀️", "🌙", "☁️", "🌊", "🌸"];

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [userName, setUserName] = useState("");
  const [icon, setIcon] = useState(PRESET_EMOJIS[0]);
  const [iconType, setIconType] = useState<"emoji" | "image">("emoji");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addProject = useAppStore((state) => state.addProject);
  const { currentUser, setCurrentUser } = useAppStore();

  useEffect(() => {
    if (isOpen) {
      setProjectName("");
      setUserName(currentUser?.name || "");
      setIcon(PRESET_EMOJIS[Math.floor(Math.random() * PRESET_EMOJIS.length)]);
      setIconType("emoji");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, currentUser]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIcon(reader.result as string);
        setIconType("image");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!projectName.trim() || !userName.trim()) return;

    const newUser: User = currentUser || {
      id: crypto.randomUUID(),
      name: userName.trim(),
    };

    const newProject: Project = {
      id: crypto.randomUUID(),
      name: projectName.trim(),
      icon,
      iconType,
      inviteCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
      members: [newUser],
      checkIns: [],
      createdBy: newUser.id,
      createdAt: new Date().toISOString(),
    };

    if (!currentUser) setCurrentUser(newUser);
    addProject(newProject);
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  const isValid = projectName.trim() !== "" && userName.trim() !== "";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white md:bg-black/40 md:backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative w-full h-full md:w-[480px] md:h-[85vh] md:rounded-[32px] md:shadow-2xl overflow-hidden bg-white flex flex-col"
      >
        {/* Header */}
        <header className="shrink-0 border-b border-surface-100 dark:border-surface-800">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full text-surface-500 transition-colors active:bg-surface-100 dark:active:bg-surface-800"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-[17px] font-bold text-surface-900 dark:text-white">프로젝트 만들기</h1>
            </div>
            <div className="w-10" />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-10">
          <div className="max-w-md mx-auto space-y-10">
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-surface-400 uppercase tracking-widest px-2 py-1 bg-surface-50 dark:bg-surface-900 rounded-md">
                새 프로젝트
              </span>
              <h2 className="text-[28px] font-bold leading-tight tracking-tighter text-surface-900 dark:text-white">
                프로젝트의<br />이름을 정해주세요
              </h2>
            </div>

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
                  내 이름
                </label>
                <input
                  autoFocus
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="홍길동"
                  className={cn(
                    "w-full h-14 text-[17px] font-bold rounded-2xl border-none transition-all px-4",
                    userName.trim() !== "" 
                      ? "bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700" 
                      : "bg-surface-50 dark:bg-surface-900 focus:bg-white dark:focus:bg-surface-800 focus:ring-2 focus:ring-surface-900 dark:focus:ring-white"
                  )}
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[14px] font-bold text-surface-900 dark:text-white ml-1">
                  프로젝트 이름
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="예: 멋진 우리 팀"
                  className={cn(
                    "w-full h-14 text-[17px] font-bold rounded-2xl border-none transition-all px-4",
                    projectName.trim() !== "" 
                      ? "bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700" 
                      : "bg-surface-50 dark:bg-surface-900 focus:bg-white dark:focus:bg-surface-800 focus:ring-2 focus:ring-surface-900 dark:focus:ring-white"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isValid) handleSubmit();
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="shrink-0 p-6 bg-white dark:bg-surface-900 border-t border-surface-100 dark:border-surface-800">
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={cn(
              "w-full h-16 flex items-center justify-center rounded-2xl font-bold text-[17px] transition-all duration-300",
              isValid
                ? "bg-surface-900 dark:bg-white text-white dark:text-surface-900 active:scale-[0.98]"
                : "bg-surface-100 dark:bg-surface-800 text-surface-400 cursor-not-allowed"
            )}
          >
            프로젝트 시작하기
          </button>
        </footer>
      </motion.div>
    </div>,
    document.body
  );
}
