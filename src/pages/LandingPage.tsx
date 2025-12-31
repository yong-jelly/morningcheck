import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { User as UserIcon } from "lucide-react";
import { CreateProjectForm } from "@/features/project-management/ui/CreateProjectForm";
import { JoinProjectForm } from "@/features/project-management/ui/JoinProjectForm";
import { useAppStore } from "@/shared/lib/store";

export function LandingPage() {
  const navigate = useNavigate();
  const [modalMode, setModalMode] = useState<"none" | "create" | "join">("none");
  const { currentUser, isAuthenticated, login } = useAppStore();

  const handleGoogleLogin = () => {
    // UI 전용이므로 가짜 사용자 데이터로 로그인 처리
    const fakeUser = {
      id: "google-123",
      name: "구글 사용자",
      email: "user@gmail.com",
      profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
      bio: "안녕하세요! MorningCheck을 사용 중입니다."
    };
    login(fakeUser);
    navigate("/profile"); // 로그인 후 프로필 페이지로 이동
  };

  const handleSuccess = () => {
    setModalMode("none");
    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-surface-900 px-6 py-12 relative overflow-hidden">
      {/* Profile Button */}
      <div className="absolute top-6 right-6 z-10">
        <button 
          onClick={() => navigate("/profile")}
          className="w-10 h-10 rounded-lg bg-surface-50 dark:bg-surface-800 flex items-center justify-center border border-surface-200 dark:border-surface-700 active:scale-95 transition-all overflow-hidden"
        >
          {currentUser?.profileImageUrl ? (
            <img src={currentUser.profileImageUrl} alt={currentUser.name} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-4 h-4 text-surface-400" />
          )}
        </button>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-16 h-16 bg-white dark:bg-surface-800 border-2 border-primary-600 rounded-2xl flex items-center justify-center"
        >
          <span className="text-2xl font-black text-primary-600 leading-none">M</span>
        </motion.div>
        
        <div className="space-y-3">
          <motion.h1 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold tracking-tight"
          >
            MorningCheck
          </motion.h1>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-surface-500 dark:text-surface-400 max-w-[240px] leading-relaxed"
          >
            팀원들의 데일리 컨디션을 확인하고 <br />오늘의 에너지를 연결하세요.
          </motion.p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {isAuthenticated ? (
          <>
            <motion.button
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => setModalMode("create")}
              className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              프로젝트 시작하기
            </motion.button>

            <motion.button
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={() => setModalMode("join")}
              className="w-full h-12 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              팀 참여하기
            </motion.button>
          </>
        ) : (
          <motion.button
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={handleGoogleLogin}
            className="w-full h-12 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white font-bold rounded-xl flex items-center justify-center gap-3 active:scale-98 transition-all"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            Google 계정으로 시작하기
          </motion.button>
        )}

        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => navigate('/help')}
          className="w-full h-12 text-surface-500 text-sm font-semibold hover:text-surface-700 active:scale-98 transition-all"
        >
          도움말 및 소개
        </motion.button>
      </div>

      <AnimatePresence>
        {modalMode !== "none" && (
          <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalMode("none")}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-[400px]">
              {modalMode === "create" ? (
                <CreateProjectForm 
                  onClose={() => setModalMode("none")} 
                  onSuccess={handleSuccess} 
                />
              ) : (
                <JoinProjectForm 
                  onClose={() => setModalMode("none")} 
                  onSuccess={handleSuccess} 
                />
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
      
      <p className="mt-8 text-center text-xs text-surface-400">
        © 2025 MorningCheck Team. All rights reserved.
      </p>
    </div>
  );
}
