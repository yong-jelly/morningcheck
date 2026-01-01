import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Loader2, Mail, Trash2, Clock, CheckCircle2, XCircle, UserPlus, History as HistoryIcon } from "lucide-react";
import { useAppStore } from "@/shared/lib/store";
import { cn } from "@/shared/lib/cn";
import type { Project, ProjectInvitation, ProjectInvitationHistory } from "@/entities/project/model/types";
import { projectApi } from "@/entities/project/api/project";
import { Dialog } from "@/shared/ui/Dialog";
import { formatRelativeTime } from "@/shared/lib/utils";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

/**
 * 프로젝트 멤버 초대 및 초대 히스토리를 관리하는 모달입니다.
 * 
 * [정책 사항]
 * 1. 이메일을 통해 사용자를 초대할 수 있습니다. (GitHub 스타일)
 * 2. 초대 생성, 취소, 수락, 거절 등 모든 상태 변화는 히스토리 테이블에 기록됩니다.
 * 3. 대기 중인 초대 목록에서 초대를 취소할 수 있습니다.
 * 4. 모든 액션(초대, 취소 등) 시 사용자 확인을 위해 커스텀 Dialog를 사용합니다.
 */
export function InviteMemberModal({ isOpen, onClose, project }: InviteMemberModalProps) {
  const { currentUser, setProjects } = useAppStore();
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"invite" | "history">("invite");
  const [isLoading, setIsLoading] = useState(false);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [history, setHistory] = useState<ProjectInvitationHistory[]>([]);
  const [isFetching, setIsFetching] = useState(false);

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

  const showDialog = (config: Omit<typeof dialogConfig, "isOpen">) => {
    setDialogConfig({ ...config, isOpen: true });
  };

  const fetchData = async () => {
    if (!project.id || isFetching) return;
    try {
      setIsFetching(true);
      // 최신 프로젝트 정보를 가져와서 초대 목록 업데이트
      const updatedProject = await projectApi.getProjectById(project.id);
      if (updatedProject) {
        // 초대 목록은 status가 'pending'인 것만 필터링해서 보여줌
        const pendingInvites = (updatedProject.invitations || [])
          .filter((i: any) => i.status === 'pending')
          .map((i: any) => ({
            id: i.id,
            projectId: i.project_id,
            inviterId: i.inviter_id,
            email: i.invitee_email,
            status: i.status,
            invitedAt: i.invited_at,
            respondedAt: i.responded_at
          }));
        setInvitations(pendingInvites);
      }

      // 히스토리 가져오기
      const historyData = await projectApi.getInvitationHistory(project.id);
      setHistory(historyData.map((h: any) => ({
        id: h.id,
        projectId: h.project_id,
        invitationId: h.invitation_id,
        actorId: h.actor_id,
        actorName: h.actor_name,
        actorAvatar: h.actor_avatar,
        inviteeEmail: h.invitee_email,
        action: h.action,
        metadata: h.metadata,
        createdAt: h.created_at
      })));
    } catch (error) {
      console.error("Failed to fetch invitation data:", error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setEmail("");
      setActiveTab("invite");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, project.id]);

  const handleInvite = async () => {
    if (!email.trim() || !currentUser || isLoading) return;

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showDialog({
        title: "잘못된 이메일",
        description: "올바른 이메일 형식을 입력해주세요.",
        onConfirm: () => {}
      });
      return;
    }

    // 본인 초대 방지 체크
    if (email.trim().toLowerCase() === currentUser.email?.toLowerCase()) {
      showDialog({
        title: "초대 불가",
        description: "자기 자신은 초대할 수 없습니다.",
        onConfirm: () => {}
      });
      return;
    }

    try {
      setIsLoading(true);
      await projectApi.inviteMember(project.id, currentUser.id, email.trim());
      setEmail("");
      await fetchData();
      // 결과 알림은 생략하거나 간단한 토스트가 좋지만 여기서는 fetchData로 목록 갱신으로 충분
    } catch (error) {
      console.error("Invite failed:", error);
      showDialog({
        title: "초대 실패",
        description: "멤버 초대 중 오류가 발생했습니다.",
        onConfirm: () => {}
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvite = (invitationId: string, inviteeEmail: string) => {
    showDialog({
      title: "초대 취소",
      description: `${inviteeEmail}님에게 보낸 초대를 취소하시겠습니까?`,
      variant: "danger",
      onConfirm: async () => {
        try {
          if (!currentUser) return;
          await projectApi.cancelInvitation(invitationId, currentUser.id);
          await fetchData();
        } catch (error) {
          console.error("Cancel invite failed:", error);
        }
      }
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-white md:bg-black/40 md:backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative w-full h-full md:w-[480px] md:h-[85vh] md:rounded-[32px] md:shadow-2xl overflow-hidden bg-white dark:bg-surface-900 flex flex-col"
      >
        {/* Header */}
        <header className="shrink-0 border-b border-surface-100 dark:border-surface-800">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-[17px] font-bold text-surface-900 dark:text-white">멤버 초대하기</h1>
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>
          
          {/* Tabs */}
          <div className="flex px-6 border-t border-surface-50 dark:border-surface-800/50">
            <button
              onClick={() => setActiveTab("invite")}
              className={cn(
                "flex-1 py-3 text-[13px] font-bold transition-all border-b-2",
                activeTab === "invite" 
                  ? "text-surface-950 dark:text-white border-surface-950 dark:border-white" 
                  : "text-surface-400 border-transparent"
              )}
            >
              초대하기
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={cn(
                "flex-1 py-3 text-[13px] font-bold transition-all border-b-2",
                activeTab === "history" 
                  ? "text-surface-950 dark:text-white border-surface-950 dark:border-white" 
                  : "text-surface-400 border-transparent"
              )}
            >
              히스토리
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <AnimatePresence mode="wait">
            {activeTab === "invite" ? (
              <motion.div
                key="invite-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                {/* Invite Input */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] font-black text-surface-900 dark:text-white ml-1">
                      이메일 주소
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="invitee@example.com"
                        className="w-full h-14 bg-surface-50 dark:bg-surface-800/50 rounded-2xl pl-12 pr-4 text-[16px] font-bold focus:ring-2 focus:ring-surface-900 dark:focus:ring-white transition-all border-none"
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-300" />
                    </div>
                  </div>
                  <button
                    onClick={handleInvite}
                    disabled={!email.trim() || isLoading}
                    className={cn(
                      "w-full h-14 rounded-2xl font-black text-[16px] transition-all flex items-center justify-center gap-2",
                      email.trim() && !isLoading
                        ? "bg-surface-900 dark:bg-white text-white dark:text-surface-900 active:scale-95 shadow-lg"
                        : "bg-surface-100 dark:bg-surface-800 text-surface-400 cursor-not-allowed"
                    )}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                    초대장 보내기
                  </button>
                </div>

                {/* Pending List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[14px] font-black text-surface-900 dark:text-white">
                      대기 중인 초대 ({invitations.length})
                    </h3>
                  </div>
                  
                  {isFetching && invitations.length === 0 ? (
                    <div className="py-10 flex justify-center">
                      <Loader2 className="w-6 h-6 text-surface-200 animate-spin" />
                    </div>
                  ) : invitations.length > 0 ? (
                    <div className="space-y-2">
                      {invitations.map((inv) => (
                        <div 
                          key={inv.id}
                          className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800/40 rounded-2xl border border-surface-100 dark:border-surface-700/50"
                        >
                          <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-surface-900 dark:text-white">{inv.email}</span>
                            <span className="text-[11px] font-medium text-surface-400">
                              {formatRelativeTime(inv.invitedAt)} 초대됨
                            </span>
                          </div>
                          <button
                            onClick={() => handleCancelInvite(inv.id, inv.email)}
                            className="p-2 text-surface-300 hover:text-red-500 transition-colors active:scale-90"
                            title="초대 취소"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-surface-50/50 dark:bg-surface-800/20 rounded-[32px] border border-dashed border-surface-200 dark:border-surface-700">
                      <p className="text-[13px] font-bold text-surface-400">대기 중인 초대가 없습니다.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="history-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 px-1 mb-6">
                  <HistoryIcon className="w-4 h-4 text-surface-400" />
                  <h3 className="text-[14px] font-black text-surface-900 dark:text-white">변경 히스토리</h3>
                </div>

                {isFetching && history.length === 0 ? (
                  <div className="py-10 flex justify-center">
                    <Loader2 className="w-6 h-6 text-surface-200 animate-spin" />
                  </div>
                ) : history.length > 0 ? (
                  <div className="relative space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-100 dark:before:bg-surface-800">
                    {history.map((item) => (
                      <div key={item.id} className="relative pl-12">
                        {/* Timeline Icon */}
                        <div className={cn(
                          "absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white dark:border-surface-900 shadow-sm z-10",
                          item.action === 'invited' ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30" :
                          item.action === 'accepted' ? "bg-green-50 text-green-600 dark:bg-green-900/30" :
                          item.action === 'cancelled' ? "bg-red-50 text-red-600 dark:bg-red-900/30" :
                          "bg-surface-100 text-surface-500 dark:bg-surface-800"
                        )}>
                          {item.action === 'invited' && <UserPlus className="w-4 h-4" />}
                          {item.action === 'accepted' && <CheckCircle2 className="w-4 h-4" />}
                          {item.action === 'cancelled' && <XCircle className="w-4 h-4" />}
                          {['rejected', 'requested', 'approved'].includes(item.action) && <Clock className="w-4 h-4" />}
                        </div>

                        <div className="space-y-1">
                          <p className="text-[14px] leading-tight text-surface-900 dark:text-white">
                            <span className="font-black">{item.actorName || "시스템"}</span>님이{" "}
                            <span className="font-black text-primary-600 dark:text-primary-400">{item.inviteeEmail}</span>님을{" "}
                            {item.action === 'invited' ? '초대했습니다.' :
                             item.action === 'accepted' ? '초대를 수락했습니다.' :
                             item.action === 'cancelled' ? '초대를 취소했습니다.' :
                             item.action === 'rejected' ? '초대를 거절했습니다.' :
                             item.action === 'requested' ? '참여를 요청했습니다.' :
                             '참여를 승인했습니다.'}
                          </p>
                          <span className="text-[11px] font-bold text-surface-400">
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-24 text-center">
                    <p className="text-[13px] font-bold text-surface-400">아직 기록된 히스토리가 없습니다.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <Dialog
        {...dialogConfig}
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>,
    document.body
  );
}
