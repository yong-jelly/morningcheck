import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useAppStore } from "@/shared/lib/store";
import { cn } from "@/shared/lib/cn";
import { format, differenceInDays, parseISO } from "date-fns";

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const PRESET_EMOJIS = ["🚀", "🎨", "🌈", "🔥", "⭐️", "🍀", "🍎", "🍕", "🐶", "👾", "☀️", "🌙", "☁️", "🌊", "🌸"];

export function ProjectSettingsModal({ isOpen, onClose, projectId }: ProjectSettingsModalProps) {
  const { projects, updateProject, inviteMember, removeInvitation, removeMember, currentUser } = useAppStore();
  const project = projects.find((p) => p.id === projectId);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [iconType, setIconType] = useState<"emoji" | "image">("emoji");
  const [inviteEmail, setInviteEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "members" | "invites">("info");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasChanges = project && (
    name !== project.name || 
    description !== (project.description || "") ||
    icon !== (project.icon || "") ||
    iconType !== (project.iconType || "emoji")
  );

  useEffect(() => {
    if (isOpen && project) {
      setName(project.name);
      setDescription(project.description || "");
      setIcon(project.icon || PRESET_EMOJIS[0]);
      setIconType(project.iconType || "emoji");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, project]);

  if (!isOpen || !project || !currentUser) return null;

  const handleUpdateInfo = () => {
    if (name.trim()) {
      updateProject(projectId, { 
        name: name.trim(), 
        description: description.trim(),
        icon,
        iconType
      });
    }
  };

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

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail.trim() && inviteEmail.includes("@")) {
      inviteMember(projectId, inviteEmail.trim());
      setInviteEmail("");
    }
  };

  // Stats calculation
  const createdDate = parseISO(project.createdAt);
  const duration = differenceInDays(new Date(), createdDate) + 1;
  const totalPossibleCheckIns = duration * project.members.length;
  const participationRate = totalPossibleCheckIns > 0 
    ? Math.round((project.checkIns.length / totalPossibleCheckIns) * 100) 
    : 0;

  const isCreator = project.createdBy === currentUser.id;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-white md:bg-black/40 md:backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="relative w-full h-full md:w-[480px] md:h-[80vh] md:rounded-[32px] overflow-hidden bg-white dark:bg-surface-900 flex flex-col border border-surface-100 dark:border-surface-800"
      >
        {/* Header */}
        <header className="shrink-0 border-b border-surface-100 dark:border-surface-800 safe-area-top bg-white/80 dark:bg-surface-900/80 backdrop-blur-md z-10">
          <div className="px-5 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full text-surface-500 transition-colors active:bg-surface-100 dark:active:bg-surface-800"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center">
              <h1 className="text-[17px] font-bold tracking-tight text-surface-900 dark:text-white">설정</h1>
            </div>
            <div className="w-10" />
          </div>
          
          {/* Tabs */}
          <div className="flex border-t border-surface-50 dark:border-surface-800">
            {[
              { id: "info", label: "정보" },
              { id: "members", label: "팀원" },
              { id: "invites", label: "초대" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 py-4 text-[13px] font-bold transition-all relative",
                  activeTab === tab.id 
                    ? "text-surface-900 dark:text-white" 
                    : "text-surface-400 hover:text-surface-600"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTabSettings"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-surface-900 dark:bg-white"
                  />
                )}
              </button>
            ))}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === "info" && (
              <motion.div
                key="info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Icon Selection */}
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
                      아이콘 변경
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

                {/* Project Info Fields */}
                <div className="space-y-8">
                  <section className="space-y-3">
                    <label className="text-[12px] font-bold text-surface-400 uppercase tracking-widest ml-1">프로젝트 이름</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="프로젝트 이름을 입력하세요"
                      className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 rounded-2xl px-6 py-5 font-bold text-[17px] text-surface-900 dark:text-white focus:ring-2 focus:ring-surface-900 dark:focus:ring-white transition-all outline-none"
                    />
                  </section>

                  <section className="space-y-3">
                    <label className="text-[12px] font-bold text-surface-400 uppercase tracking-widest ml-1">프로젝트 소개</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
                      rows={4}
                      className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 rounded-2xl px-6 py-5 font-bold text-[15px] text-surface-900 dark:text-white focus:ring-2 focus:ring-surface-900 dark:focus:ring-white transition-all outline-none resize-none leading-relaxed"
                    />
                  </section>
                </div>

                {/* Project Stats */}
                <section className="space-y-5">
                  <label className="text-[12px] font-bold text-surface-400 uppercase tracking-widest ml-1">프로젝트 현황</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "팀원", value: `${project.members.length}명` },
                      { label: "참여율", value: `${participationRate}%` },
                      { label: "체크인", value: `${project.checkIns.length}회` },
                      { label: "유지일", value: `${duration}일` },
                      { label: "생성일", value: format(createdDate, "yyyy-MM-dd"), fullWidth: true },
                    ].map((stat, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "flex flex-col gap-2 p-5 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-800",
                          stat.fullWidth && "col-span-2"
                        )}
                      >
                        <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-[18px] font-bold text-surface-900 dark:text-white leading-none">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === "members" && (
              <motion.div
                key="members"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[12px] font-bold text-surface-400 uppercase tracking-widest">팀원 목록 ({project.members.length})</label>
                </div>
                <div className="space-y-3">
                  {project.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-800 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 flex items-center justify-center text-surface-900 dark:text-white font-bold text-lg">
                          {member.name[0]}
                        </div>
                        <div>
                          <p className="text-[16px] font-bold text-surface-900 dark:text-white flex items-center gap-2">
                            {member.name}
                            {member.id === project.createdBy && <span className="text-[10px] font-bold bg-surface-900 dark:bg-white text-white dark:text-surface-900 px-1.5 py-0.5 rounded uppercase tracking-tighter">팀장</span>}
                          </p>
                          <p className="text-[13px] font-medium text-surface-400">{member.email || "이메일 없음"}</p>
                        </div>
                      </div>
                      {isCreator && member.id !== currentUser.id && (
                        <button
                          onClick={() => removeMember(projectId, member.id)}
                          className="text-[12px] font-bold text-surface-300 hover:text-red-500 transition-colors"
                        >
                          제거
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "invites" && (
              <motion.div
                key="invites"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Invite Form */}
                <section className="space-y-4">
                  <label className="text-[12px] font-bold text-surface-400 uppercase tracking-widest ml-1">새로운 팀원 초대</label>
                  <form onSubmit={handleInvite} className="flex gap-2.5">
                    <div className="relative flex-1">
                      <input
                        type="email"
                        placeholder="이메일 주소 입력"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-800 rounded-2xl px-6 py-5 font-bold text-[16px] text-surface-900 dark:text-white placeholder:text-surface-300 focus:ring-2 focus:ring-surface-900 dark:focus:ring-white transition-all outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-surface-900 dark:bg-white text-white dark:text-surface-900 px-6 py-5 rounded-2xl font-bold text-[15px] active:scale-95 transition-all"
                    >
                      추가
                    </button>
                  </form>
                </section>

                {/* Invitations List */}
                <section className="space-y-5">
                  <label className="text-[12px] font-bold text-surface-400 uppercase tracking-widest ml-1">초대 현황</label>
                  {!project.invitations || project.invitations.length === 0 ? (
                    <div className="py-16 text-center space-y-4 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-dashed border-surface-200 dark:border-surface-700">
                      <p className="text-[12px] font-bold text-surface-300 uppercase tracking-widest text-center">대기 중인 초대가 없습니다</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {project.invitations.map((invite) => (
                        <div key={invite.id} className="p-5 rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-800 shadow-sm flex items-center justify-between">
                          <div className="space-y-2">
                            <p className="text-[16px] font-bold text-surface-900 dark:text-white">{invite.email}</p>
                            <div className="flex items-center gap-4">
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border",
                                invite.status === "pending" ? "bg-amber-50 text-amber-600 border-amber-100" : 
                                invite.status === "accepted" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                                "bg-surface-50 text-surface-400 border-surface-100"
                              )}>
                                {invite.status === "pending" ? "대기 중" : invite.status === "accepted" ? "수락됨" : "거절됨"}
                              </span>
                              <span className="text-[11px] font-medium text-surface-400">{format(parseISO(invite.invitedAt), "MM/dd HH:mm")}</span>
                            </div>
                          </div>
                          {isCreator && (
                            <button
                              onClick={() => removeInvitation(projectId, invite.id)}
                              className="text-[12px] font-bold text-surface-300 hover:text-red-500 transition-colors"
                            >
                              취소
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="shrink-0 p-6 bg-white dark:bg-surface-900 border-t border-surface-100 dark:border-surface-800">
          {activeTab === "info" && (
            <button
              onClick={handleUpdateInfo}
              disabled={!hasChanges}
              className={cn(
                "w-full h-16 flex items-center justify-center rounded-2xl font-bold text-[18px] transition-all duration-300",
                hasChanges
                  ? "bg-surface-900 dark:bg-white text-white dark:text-surface-900 active:scale-[0.98]"
                  : "bg-surface-50 dark:bg-surface-800 text-surface-300 cursor-not-allowed opacity-50"
              )}
            >
              변경사항 저장
            </button>
          )}
        </footer>
      </motion.div>
    </div>,
    document.body
  );
}
