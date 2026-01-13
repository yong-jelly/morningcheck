import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { supabase } from "@/shared/lib/supabase";
import { OnboardingScene } from "./OnboardingScene";

export function OnboardingPage() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Login error:", error.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative">
      {/* 3D Hero Background/Visual */}
      <div className="absolute inset-0 opacity-100">
        <OnboardingScene />
      </div>

      <div className="relative flex-1 flex flex-col justify-center px-8 py-12 z-10 pointer-events-none">
        <div className="flex-1 flex flex-col justify-center space-y-12">
          {/* Hero Content */}
          <div className="space-y-6 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            
            <div className="space-y-3">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-black tracking-tighter text-surface-900"
              >
                MorningCheck
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-surface-500 font-medium leading-tight"
              >
                팀원들과 함께 아침의 에너지를 <br />공유하고 연결하세요.
              </motion.p>
            </div>
          </div>

          {/* Interactive 3D Visual Spacer (Optional, but gives more space for 3D) */}
          <div className="h-40">
             {/* This area is empty to show the 3D scene background */}
          </div>

          {/* Features */}
          <div className="space-y-8 pointer-events-auto">
            {[
              { title: "매일 아침 30초", desc: "간편한 슬라이더로 팀원에게 내 상태를 공유하세요." },
              { title: "실시간 대시보드", desc: "팀 전체의 활력 지수와 트렌드를 즉시 확인합니다." },
              { title: "안전한 팀 관리", desc: "초대 코드로 우리 팀만의 독립된 공간을 만드세요." },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.5 }}
                className="space-y-1"
              >
                <h3 className="text-base font-bold flex items-center gap-3 text-surface-900">
                  <span className="w-2 h-2 rounded-full bg-primary-600 shadow-sm shadow-primary-500/50" />
                  {f.title}
                </h3>
                <p className="text-sm text-surface-500 leading-relaxed pl-5 font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Login Buttons */}
        <div className="pt-8 pointer-events-auto">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            onClick={handleGoogleLogin}
            className="w-full h-14 bg-surface-900 text-white font-bold rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-surface-900/10"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Google 계정으로 시작하기
          </motion.button>
        </div>
      </div>
    </div>
  );
}
