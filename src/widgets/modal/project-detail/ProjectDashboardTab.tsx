import { useState, useMemo } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { format, subDays, isSameDay, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import type { Project, User as UserType } from "@/entities/project/model/types";
import { cn } from "@/shared/lib/cn";

interface ProjectDashboardTabProps {
  project: Project;
  currentUser: UserType;
  onTabChange: (tab: "check-in" | "list" | "dashboard") => void;
  hasCheckedInToday: boolean;
}

type DashboardMode = "team" | "personal";

export function ProjectDashboardTab({ 
  project, 
  currentUser,
  onTabChange,
  hasCheckedInToday
}: ProjectDashboardTabProps) {
  const [mode, setMode] = useState<DashboardMode>("team");

  // --- Personal Data Calculation ---
  const myChecks = useMemo(() => project.checkIns
    .filter((c) => c.userId === currentUser.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [project.checkIns, currentUser.id]);

  const personalStats = useMemo(() => {
    const avg = myChecks.length > 0 
      ? (myChecks.reduce((acc, curr) => acc + curr.condition, 0) / myChecks.length).toFixed(1)
      : "0.0";

    let streak = 0;
    if (myChecks.length > 0) {
      let checkDate = new Date();
      const hasToday = myChecks.some(c => isSameDay(parseISO(c.date), checkDate));
      if (!hasToday) checkDate = subDays(checkDate, 1);
      const reversedChecks = [...myChecks].reverse();
      for (const check of reversedChecks) {
        if (isSameDay(parseISO(check.date), checkDate)) {
          streak++;
          checkDate = subDays(checkDate, 1);
        } else break;
      }
    }

    return { avg, streak, total: myChecks.length };
  }, [myChecks]);

  const personalChartData = useMemo(() => Array.from({ length: 14 }).map((_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const check = myChecks.find((c) => c.date === dateStr);
    return {
      name: format(date, "MM/dd"),
      condition: check?.condition || null,
    };
  }), [myChecks]);

  // --- Team Data Calculation ---
  const today = format(new Date(), "yyyy-MM-dd");
  const todayCheckIns = useMemo(() => project.checkIns.filter(c => c.date === today), [project.checkIns, today]);
  
  const teamStats = useMemo(() => {
    const avg = todayCheckIns.length > 0
      ? (todayCheckIns.reduce((acc, curr) => acc + curr.condition, 0) / todayCheckIns.length).toFixed(1)
      : "0.0";
    const participation = project.members.length > 0
      ? Math.round((todayCheckIns.length / project.members.length) * 100)
      : 0;
    
    // Distribution for bar chart
    const distribution = [
      { name: "좋음", count: todayCheckIns.filter(c => c.condition >= 8).length, color: "#22c55e" },
      { name: "보통", count: todayCheckIns.filter(c => c.condition >= 5 && c.condition <= 7).length, color: "#f97316" },
      { name: "나쁨", count: todayCheckIns.filter(c => c.condition <= 4).length, color: "#ef4444" },
    ];

    return { avg, participation, distribution };
  }, [todayCheckIns, project.members.length]);

  const teamTrendData = useMemo(() => Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayChecks = project.checkIns.filter(c => c.date === dateStr);
    const avg = dayChecks.length > 0
      ? (dayChecks.reduce((acc, curr) => acc + curr.condition, 0) / dayChecks.length)
      : null;
    return {
      name: format(date, "MM/dd"),
      avg: avg ? parseFloat(avg.toFixed(1)) : null,
    };
  }), [project.checkIns]);

  return (
    <div className="space-y-6 pb-10">
      {/* Top Bar: Navigation & Mode Switcher (Compact Single Line) */}
      <div className="flex items-center justify-between">
        {/* Left: View Switcher */}
        <div className="flex items-center p-1 bg-surface-50 dark:bg-surface-800/50 rounded-[14px] border border-surface-100 dark:border-surface-700/50">
          <button
            onClick={() => onTabChange("list")}
            className={cn(
              "px-4 h-8 flex items-center justify-center rounded-[10px] transition-all duration-200",
              "text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
            )}
          >
            <span className="text-[12px] font-bold">목록</span>
          </button>
          <button
            onClick={() => onTabChange("dashboard")}
            className={cn(
              "px-4 h-8 flex items-center justify-center rounded-[10px] transition-all duration-200",
              "bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm"
            )}
          >
            <span className="text-[12px] font-bold">통계</span>
          </button>
        </div>

        {/* Right: Mode Switcher (Team vs Personal) */}
        <div className="flex items-center gap-1 p-1 bg-surface-50 dark:bg-surface-800/50 rounded-[14px] border border-surface-100 dark:border-surface-700/50">
          <button
            onClick={() => setMode("team")}
            className={cn(
              "px-3 h-8 rounded-[10px] text-[11px] font-bold transition-all duration-200",
              mode === "team" 
                ? "bg-primary-600 text-white shadow-sm" 
                : "text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
            )}
          >
            팀
          </button>
          <button
            onClick={() => setMode("personal")}
            className={cn(
              "px-3 h-8 rounded-[10px] text-[11px] font-bold transition-all duration-200",
              mode === "personal" 
                ? "bg-primary-600 text-white shadow-sm" 
                : "text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
            )}
          >
            개인
          </button>
        </div>
      </div>

      {mode === "team" ? (
        <div className="space-y-6">
          {/* Team Stats Summary */}
          <section className="grid grid-cols-2 gap-3">
            <div className="p-5 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-800">
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">오늘 팀 평균</p>
              <div className="flex items-baseline gap-1">
                <p className="text-[24px] font-black text-surface-900 dark:text-white leading-none font-mono">{teamStats.avg}</p>
                <p className="text-[12px] font-bold text-surface-400">점</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-800">
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">팀 참여율</p>
              <div className="flex items-baseline gap-1">
                <p className="text-[24px] font-black text-surface-900 dark:text-white leading-none font-mono">{teamStats.participation}</p>
                <p className="text-[12px] font-bold text-surface-400">% ({todayCheckIns.length}/{project.members.length})</p>
              </div>
            </div>
          </section>

          {/* Team Distribution */}
          <section className="space-y-4">
            <h3 className="text-[13px] font-bold text-surface-900 dark:text-white ml-1">오늘의 컨디션 분포</h3>
            <div className="h-40 w-full bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamStats.distribution} layout="vertical" margin={{ left: -20, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#737373' }} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 800 }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                    {teamStats.distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Team Trend */}
          <section className="space-y-4">
            <h3 className="text-[13px] font-bold text-surface-900 dark:text-white ml-1">최근 7일 평균 추이</h3>
            <div className="h-52 w-full bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={teamTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a3a3a3', fontWeight: 700 }} dy={10} />
                  <YAxis domain={[0, 10]} hide />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 800 }} />
                  <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={3} dot={{ r: 3, fill: '#6366f1', strokeWidth: 1, stroke: '#fff' }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Personal Stats */}
          <section className="grid grid-cols-3 gap-2">
            {[
              { label: "평균", value: personalStats.avg, unit: "점" },
              { label: "연속", value: personalStats.streak, unit: "일" },
              { label: "전체", value: personalStats.total, unit: "회" },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-800">
                <p className="text-[9px] font-bold text-surface-400 uppercase tracking-wider mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-0.5">
                  <p className="text-[18px] font-black text-surface-900 dark:text-white leading-none font-mono">{stat.value}</p>
                  <p className="text-[10px] font-bold text-surface-400">{stat.unit}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Personal Trend */}
          <section className="space-y-4">
            <h3 className="text-[13px] font-bold text-surface-900 dark:text-white ml-1">14일간 나의 트렌드</h3>
            <div className="h-52 w-full bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={personalChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a3a3a3', fontWeight: 700 }} dy={10} />
                  <YAxis domain={[0, 10]} hide />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 800 }} />
                  <Line type="monotone" dataKey="condition" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: '#10b981', strokeWidth: 1, stroke: '#fff' }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Recent Personal Logs */}
          <section className="space-y-4">
            <h3 className="text-[13px] font-bold text-surface-900 dark:text-white ml-1">최근 나의 기록</h3>
            <div className="space-y-2">
              {myChecks.length === 0 ? (
                <p className="text-center py-10 text-surface-300 text-[10px] font-bold uppercase tracking-widest">기록이 없습니다</p>
              ) : (
                [...myChecks].reverse().slice(0, 3).map((check) => (
                  <div key={check.id} className="p-4 bg-surface-50 dark:bg-surface-800/30 rounded-2xl border border-surface-100 dark:border-surface-800/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
                        {format(parseISO(check.date), "MM월 dd일", { locale: ko })}
                      </span>
                      <span className="font-mono text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                        {check.condition} PT
                      </span>
                    </div>
                    <p className="text-[12px] font-bold leading-relaxed text-surface-600 dark:text-surface-400 truncate">
                      {check.note || "메모 없음"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
