import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { LogIn, Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { useAppStore } from "@/shared/lib/store";

export function OnboardingPage() {
  const navigate = useNavigate();
  const login = useAppStore((state) => state.login);

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

  return (
    <div className="flex flex-col h-full bg-white dark:bg-surface-900 px-8 py-12">
      <div className="flex-1 flex flex-col justify-center space-y-16">
        {/* Hero */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-minimal"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">MorningCheck</h1>
            <p className="text-sm text-surface-500 leading-relaxed">팀원들과 함께 아침의 에너지를 <br />투명하게 공유하고 연결하세요.</p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-10">
          {[
            { title: "매일 아침 30초", desc: "간편한 슬라이더로 팀원에게 내 상태를 공유하세요." },
            { title: "실시간 대시보드", desc: "팀 전체의 활력 지수와 트렌드를 즉시 확인합니다." },
            { title: "안전한 팀 관리", desc: "초대 코드로 우리 팀만의 독립된 공간을 만드세요." },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 + 0.3 }}
              className="space-y-1"
            >
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary-600" />
                {f.title}
              </h3>
              <p className="text-xs text-surface-500 leading-relaxed pl-3">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Login Buttons */}
      <div className="space-y-3">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          onClick={handleGoogleLogin}
          className="w-full h-12 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white font-bold rounded-xl flex items-center justify-center gap-3 active:scale-98 transition-all"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          Google 계정으로 시작하기
        </motion.button>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={() => navigate("/")}
          className="w-full h-12 text-surface-400 text-xs font-semibold hover:text-surface-600 transition-colors"
        >
          나중에 둘러보기
        </motion.button>
      </div>
    </div>
  );
}
