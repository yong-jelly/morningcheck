import { TrendingUp, Award, CalendarClock, Users, History, Settings } from "lucide-react";
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
import type { Project, User, CheckIn } from "@/entities/project/model/types";
import { cn } from "@/shared/lib/cn";

interface ProjectHistoryTabProps {
  project: Project;
  currentUser: User;
  onTabChange: (tab: "check-in" | "team" | "history") => void;
  onSettingsOpen: () => void;
  hasCheckedInToday: boolean;
}

export function ProjectHistoryTab({ 
  project, 
  currentUser,
  onTabChange,
  onSettingsOpen,
  hasCheckedInToday
}: ProjectHistoryTabProps) {
  const myChecks = project.checkIns
    .filter((c) => c.userId === currentUser.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const avgCondition = myChecks.length > 0 
    ? (myChecks.reduce((acc, curr) => acc + curr.condition, 0) / myChecks.length).toFixed(1)
    : "0.0";

  const streak = (() => {
    if (myChecks.length === 0) return 0;
    let s = 0;
    let checkDate = new Date();
    const hasToday = myChecks.some(c => isSameDay(parseISO(c.date), checkDate));
    if (!hasToday) checkDate = subDays(checkDate, 1);
    const reversedChecks = [...myChecks].reverse();
    for (const check of reversedChecks) {
      if (isSameDay(parseISO(check.date), checkDate)) {
        s++;
        checkDate = subDays(checkDate, 1);
      } else break;
    }
    return s;
  })();

  const chartData = Array.from({ length: 14 }).map((_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const check = myChecks.find((c) => c.date === dateStr);
    return {
      name: format(date, "MM/dd"),
      condition: check?.condition || null,
    };
  });

  return (
    <div className="space-y-10 pb-10">
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center p-1 bg-surface-100/50 dark:bg-surface-800/50 rounded-2xl border border-surface-200 dark:border-surface-700/50 shadow-sm">
          <button
            onClick={() => onTabChange("team")}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300",
              "text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
            )}
          >
            <Users className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => onTabChange("history")}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300",
              "bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/[0.05]"
            )}
          >
            <History className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={onSettingsOpen}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-all duration-300"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { label: "평균 점수", value: avgCondition, icon: TrendingUp, color: "text-accent-blue", bg: "bg-accent-blue/10" },
          { label: "연속 일수", value: `${streak}일`, icon: Award, color: "text-accent-amber", bg: "bg-accent-amber/10" },
          { label: "전체 기록", value: `${myChecks.length}회`, icon: CalendarClock, color: "text-primary-600", bg: "bg-primary-50 dark:bg-primary-900/20" },
        ].map((stat, i) => (
          <div key={i} className="flex flex-col items-center p-4 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 space-y-3">
            <div className={`w-9 h-9 ${stat.bg} ${stat.color} rounded-xl border border-current opacity-80 flex items-center justify-center`}>
              <stat.icon className="w-4.5 h-4.5" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
              <p className="text-base font-black font-mono">{stat.value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Trend */}
      <section className="space-y-5">
        <h3 className="text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] ml-1">14일간 트렌드</h3>
        <div className="h-56 w-full bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-5">
          {myChecks.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <p className="text-[10px] text-surface-300 font-bold uppercase tracking-widest">데이터가 없습니다</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#a3a3a3', fontWeight: 700 }}
                  dy={10}
                />
                <YAxis domain={[0, 10]} hide />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e5e5e5', backgroundColor: '#fff', fontSize: '11px', fontWeight: 800 }}
                            cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
                          />
                <Line 
                  type="monotone" 
                  dataKey="condition" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={{ r: 3, fill: '#6366f1', strokeWidth: 1, stroke: '#fff' }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Recent Logs */}
      <section className="space-y-5">
        <h3 className="text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] ml-1">최근 기록</h3>
        <div className="space-y-3">
          {myChecks.length === 0 ? (
            <p className="text-center py-10 text-surface-300 text-[10px] font-bold uppercase tracking-widest">기록이 없습니다</p>
          ) : (
            [...myChecks].reverse().slice(0, 5).map((check) => (
              <div key={check.id} className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-200 dark:border-surface-800/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
                    {format(parseISO(check.date), "yyyy년 MM월 dd일", { locale: ko })}
                  </span>
                  <span className="font-mono text-[11px] font-black italic text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 rounded-lg">
                    {check.condition} PT
                  </span>
                </div>
                <p className="text-[13px] font-bold leading-relaxed text-surface-700 dark:text-surface-300">
                  {check.note || "작성된 메모가 없습니다."}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
