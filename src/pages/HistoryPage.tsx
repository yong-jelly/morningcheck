import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Home, User, ArrowLeft, Calendar, TrendingUp, Award, CalendarClock } from "lucide-react";
import { useAppStore } from "@/shared/lib/store";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { format, subDays, isSameDay, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

export function HistoryPage() {
  const navigate = useNavigate();
  const { currentUser, projects, currentProjectId } = useAppStore();
  
  const currentProject = projects.find((p) => p.id === currentProjectId);
  const myChecks = currentProject?.checkIns
    .filter((c) => c.userId === currentUser?.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  // 통계 계산
  const avgCondition = myChecks.length > 0 
    ? (myChecks.reduce((acc, curr) => acc + curr.condition, 0) / myChecks.length).toFixed(1)
    : "0.0";

  // 연속 기록 계산 (간단한 버전)
  const calculateStreak = () => {
    if (myChecks.length === 0) return 0;
    let streak = 0;
    let checkDate = new Date();
    
    // 오늘 체크인 여부 확인
    const hasToday = myChecks.some(c => isSameDay(parseISO(c.date), checkDate));
    if (!hasToday) checkDate = subDays(checkDate, 1);

    const reversedChecks = [...myChecks].reverse();
    for (const check of reversedChecks) {
      if (isSameDay(parseISO(check.date), checkDate)) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();

  // 차트 데이터 준비 (최근 14일)
  const chartData = Array.from({ length: 14 }).map((_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const check = myChecks.find((c) => c.date === dateStr);
    
    return {
      name: format(date, "MM/dd"),
      condition: check?.condition || null,
      fullDate: format(date, "M월 d일 (E)", { locale: ko }),
      note: check?.note || "기록 없음",
    };
  });

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
        <button 
          onClick={() => navigate(-1)}
          className="p-1.5 -ml-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-surface-500" />
        </button>
        <h1 className="text-sm font-bold">My History</h1>
        <div className="w-7" />
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-8 pb-10">
        {/* Stats Grid */}
        <section className="grid grid-cols-3 gap-2">
          {[
            { label: "Avg Score", value: avgCondition, icon: TrendingUp, color: "text-accent-blue", bg: "bg-accent-blue/5" },
            { label: "Streak", value: `${streak}d`, icon: Award, color: "text-accent-amber", bg: "bg-accent-amber/5" },
            { label: "Total", value: `${myChecks.length}`, icon: CalendarClock, color: "text-primary-600", bg: "bg-primary-50 dark:bg-primary-950" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center p-3 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 space-y-2">
              <div className={`w-7 h-7 ${stat.bg} ${stat.color} rounded-md flex items-center justify-center`}>
                <stat.icon className="w-3.5 h-3.5" />
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-surface-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-sm font-black">{stat.value}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Chart Section */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-surface-400 uppercase tracking-[0.2em] ml-1">14-Day Trend</h3>
          
          <div className="h-56 w-full bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
            {myChecks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
                <p className="text-[10px] text-surface-300 font-bold uppercase tracking-widest">No Data Yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#a3a3a3', fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#a3a3a3', fontWeight: 700 }}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid #e5e5e5', 
                      boxShadow: 'none',
                      fontSize: '11px',
                      fontWeight: 700
                    }}
                    cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="condition" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={{ r: 3, fill: '#6366f1', strokeWidth: 1, stroke: '#fff' }}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Recent Notes */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-surface-400 uppercase tracking-[0.2em] ml-1">Recent Logs</h3>
          <div className="divide-y divide-surface-100 dark:divide-surface-800 border-y border-surface-100 dark:border-surface-800">
            {myChecks.length === 0 ? (
              <p className="text-center py-10 text-surface-300 text-[10px] font-bold uppercase tracking-widest">No entries found</p>
            ) : (
              [...myChecks].reverse().slice(0, 5).map((check, i) => (
                <div key={check.id} className="py-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">
                      {format(parseISO(check.date), "MMM d, yyyy")}
                    </span>
                    <span className="text-[10px] font-black italic text-primary-600">
                      {check.condition} PT
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-surface-700 dark:text-surface-300">
                    {check.note || "No notes provided."}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Bottom Nav */}
      <nav className="h-16 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800 flex items-center justify-around px-6 shrink-0">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex flex-col items-center gap-1 text-surface-400 hover:text-surface-600 transition-colors"
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Home</span>
        </button>
        <button 
          onClick={() => navigate('/history')}
          className="flex flex-col items-center gap-1 text-primary-600 transition-colors"
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">History</span>
        </button>
      </nav>
    </div>
  );
}
