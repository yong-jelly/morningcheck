import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { ArrowLeft, BookOpen, CheckCircle2, Shield, Users } from "lucide-react";

export function HelpPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-surface-900">
      {/* Header */}
      <header className="px-4 h-14 flex items-center border-b border-surface-200 dark:border-surface-800 shrink-0">
        <button 
          onClick={() => navigate(-1)}
          className="p-1.5 -ml-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-surface-500" />
        </button>
        <h1 className="ml-3 text-sm font-bold">Help & Guide</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-12 pb-10">
        <section className="space-y-4">
          <div className="w-10 h-10 bg-white dark:bg-surface-800 border-2 border-primary-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">MorningCheck</h2>
            <p className="text-sm text-surface-500 leading-relaxed">
              MorningCheck은 팀 멤버들의 일일 컨디션을 기록하고 관리하며, 
              팀의 활력을 연결하는 협업 플랫폼입니다.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-[10px] font-bold text-surface-400 uppercase tracking-[0.2em] ml-1">Features</h3>
          <div className="space-y-8">
            {[
              { 
                title: "일일 체크인", 
                desc: "1-10점 사이의 점수와 간단한 메모로 매일의 상태를 기록합니다." 
              },
              { 
                title: "팀 대시보드", 
                desc: "팀 전체의 평균 컨디션과 참여율을 실시간으로 확인합니다." 
              },
              { 
                title: "데이터 추이", 
                desc: "개인과 팀의 컨디션 추이를 차트로 확인하여 건강한 문화를 만듭니다." 
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="space-y-1"
              >
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary-600" />
                  {item.title}
                </h4>
                <p className="text-xs text-surface-500 leading-relaxed pl-3">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="p-6 rounded-xl border border-primary-100 dark:border-primary-900 bg-primary-50/30 dark:bg-primary-950/20 space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-primary-900 dark:text-primary-100">Get Started</h3>
            <p className="text-primary-700/70 dark:text-primary-300/50 text-xs leading-relaxed">
              프로젝트를 생성하거나 초대 코드를 입력하여 팀에 합류하세요. 
              매일 아침 30초의 체크인으로 충분합니다.
            </p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-2.5 bg-primary-600 text-white text-xs font-bold rounded-lg active:scale-98 transition-all"
          >
            Start Now
          </button>
        </section>
      </div>
    </div>
  );
}
