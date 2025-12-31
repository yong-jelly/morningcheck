import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { Home, BarChart2, User, ArrowLeft, Copy, Check, Users } from "lucide-react";
import { useAppStore } from "@/shared/lib/store";
import { CheckInForm } from "@/features/check-in/ui/CheckInForm";
import { TeamCheckInList } from "@/widgets/TeamCheckInList";
import { useState } from "react";
import type { CheckIn } from "@/entities/project/model/types";

export function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser, projects, currentProjectId, addCheckIn } = useAppStore();
  const [copied, setCopied] = useState(false);

  const currentProject = projects.find((p) => p.id === currentProjectId);
  const today = new Date().toISOString().split("T")[0];
  
  const hasCheckedInToday = currentProject?.checkIns.some(
    (c) => c.userId === currentUser?.id && c.date === today
  );

  const handleCheckIn = (condition: number, note: string) => {
    if (!currentUser || !currentProjectId) return;

    const newCheckIn: CheckIn = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      date: today,
      condition,
      note,
      createdAt: new Date().toISOString(),
    };

    addCheckIn(currentProjectId, newCheckIn);
  };

  const copyInviteCode = () => {
    if (!currentProject) return;
    navigator.clipboard.writeText(currentProject.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
        <p className="text-surface-500">선택된 프로젝트가 없습니다.</p>
        <button 
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl"
        >
          홈으로 가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-surface-900">
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between border-b border-surface-200 dark:border-surface-800 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="p-1.5 -ml-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-md transition-colors text-surface-500"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold leading-tight">{currentProject.name}</h1>
            <button 
              onClick={copyInviteCode}
              className="flex items-center gap-1 text-[10px] font-medium text-surface-400 hover:text-primary-600 transition-colors uppercase tracking-wider"
            >
              #{currentProject.inviteCode}
              {copied ? <Check className="w-2.5 h-2.5 text-accent-emerald" /> : <Copy className="w-2 h-2" />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-700 dark:text-surface-300 font-bold text-[10px] border border-surface-200 dark:border-surface-700">
            {currentUser?.name[0]}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <AnimatePresence mode="wait">
          {!hasCheckedInToday ? (
            <motion.div
              key="checkin-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CheckInForm onCheckIn={handleCheckIn} />
            </motion.div>
          ) : (
            <motion.div
              key="team-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Summary Card */}
              <section className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-5 relative overflow-hidden">
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-1.5 text-surface-400">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Team Status</span>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold">오늘의 활력</h2>
                    <p className="text-surface-500 text-xs">팀원들의 컨디션을 한눈에 확인하세요.</p>
                  </div>
                  <button 
                    onClick={() => navigate('/history')}
                    className="mt-1 px-3 py-1.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-[10px] font-bold text-surface-600 dark:text-surface-300 transition-colors hover:bg-surface-100"
                  >
                    히스토리 보기
                  </button>
                </div>
              </section>

              <TeamCheckInList project={currentProject} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Nav */}
      <nav className="h-16 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800 flex items-center justify-around px-6 shrink-0">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex flex-col items-center gap-1 text-primary-600 transition-colors"
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Home</span>
        </button>
        <button 
          onClick={() => navigate('/history')}
          className="flex flex-col items-center gap-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors"
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">History</span>
        </button>
      </nav>
    </div>
  );
}
