import { useState, useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { format, subDays, isSameDay, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { TrendingUp, Calendar, MessageSquare } from 'lucide-react';
import type { Project, User as UserType } from "@/entities/project/model/types";
import { cn } from "@/shared/lib/cn";

interface PersonalDashboardProps {
  project?: Project;
  checkIns?: any[];
  currentUser: UserType;
  selectedDate?: string | null;
  onDateSelect?: (date: string | null) => void;
}

type PeriodType = '7days' | '14days' | '30days';

const getColorForScore = (score: number): string => {
  if (score >= 8) return '#10b981'; // green-500
  if (score >= 4) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
};

const getBackgroundColorForScore = (score: number): string => {
  if (score >= 8) return 'bg-emerald-50 dark:bg-emerald-900/10';
  if (score >= 4) return 'bg-amber-50 dark:bg-amber-900/10';
  return 'bg-red-50 dark:bg-red-900/10';
};

const getTextColorForScore = (score: number): string => {
  if (score >= 8) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 4) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

export function PersonalDashboard({ project, checkIns, currentUser, selectedDate, onDateSelect }: PersonalDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('14days');

  const internalSelectedDate = selectedDate;
  const setInternalSelectedDate = onDateSelect || (() => {});

  const myChecks = useMemo(() => {
    const list = checkIns || project?.checkIns || [];
    return list
      .filter((c) => c.userId === currentUser.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [project?.checkIns, checkIns, currentUser.id]);

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

  const periodLength = selectedPeriod === '7days' ? 7 : selectedPeriod === '14days' ? 14 : 30;

  const personalChartData = useMemo(() => Array.from({ length: periodLength }).map((_, i) => {
    const date = subDays(new Date(), (periodLength - 1) - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const check = myChecks.find((c) => c.date === dateStr);
    return {
      name: format(date, "MM/dd"),
      date: dateStr,
      score: check?.condition || 0,
    };
  }), [myChecks, periodLength]);

  const filteredMemos = useMemo(() => {
    const sorted = [...myChecks].reverse();
    if (internalSelectedDate) {
      return sorted.filter(c => c.date === internalSelectedDate);
    }
    return sorted.slice(0, 10);
  }, [myChecks, internalSelectedDate]);

  const periods = [
    { key: '7days' as PeriodType, label: '7일' },
    { key: '14days' as PeriodType, label: '14일' },
    { key: '30days' as PeriodType, label: '30일' },
  ];

  return (
    <div className="space-y-6">
      {/* Personal Stats Summary (PersonalStatsCard.tsx style) */}
      <section className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-100 dark:border-surface-700">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <span className="text-[13px] font-bold text-surface-900 dark:text-white">나의 통계</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">평균 점수</p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[22px] font-black text-primary-600 dark:text-primary-400 font-mono">{personalStats.avg}</span>
              <span className="text-[11px] font-bold text-surface-400">점</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">현재 연승</p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[22px] font-black text-emerald-600 dark:text-emerald-400 font-mono">{personalStats.streak}</span>
              <span className="text-[11px] font-bold text-surface-400">일</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">총 기록</p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[22px] font-black text-surface-900 dark:text-white font-mono">{personalStats.total}</span>
              <span className="text-[11px] font-bold text-surface-400">회</span>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Trend (PersonalTrendChart.tsx style) */}
      <section className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-100 dark:border-surface-700 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-[13px] font-bold text-surface-900 dark:text-white">시계열 추이</h3>
          </div>
          <div className="flex bg-surface-50 dark:bg-surface-700/50 rounded-lg p-1">
            {periods.map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                className={cn(
                  "px-3 py-1 text-[11px] font-bold rounded-md transition-all",
                  selectedPeriod === period.key
                    ? "bg-white dark:bg-surface-600 text-primary-600 dark:text-primary-400 shadow-sm"
                    : "text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                )}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-48 w-full overflow-hidden">
          <ResponsiveContainer width="100%" height={192}>
            <BarChart 
              data={personalChartData}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  const date = e.activePayload[0].payload.date;
                  setInternalSelectedDate(internalSelectedDate === date ? null : date);
                }
              }}
            >
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
                cursor={{ fill: 'transparent' }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  fontSize: '11px', 
                  fontWeight: 800,
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} 
              />
              <Bar 
                dataKey="score" 
                radius={[4, 4, 0, 0]}
                barSize={selectedPeriod === '30days' ? 8 : 16}
              >
                {personalChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getColorForScore(entry.score)}
                    opacity={internalSelectedDate && internalSelectedDate !== entry.date ? 0.3 : 1}
                    className="transition-opacity duration-300 cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Personal Memos (WeeklyMemos.tsx & PersonalTrendChart.tsx style) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-[13px] font-bold text-surface-900 dark:text-white">
              {internalSelectedDate ? `${format(parseISO(internalSelectedDate), "M월 d일", { locale: ko })} 기록` : '최근 기록'}
            </h3>
          </div>
          {internalSelectedDate && (
            <button 
              onClick={() => setInternalSelectedDate(null)}
              className="text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:underline"
            >
              전체 보기
            </button>
          )}
        </div>

        <div className="space-y-3">
          {filteredMemos.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center bg-white dark:bg-surface-800/50 rounded-2xl border border-dashed border-surface-200 dark:border-surface-700">
              <MessageSquare className="w-8 h-8 text-surface-200 dark:text-surface-700 mb-2" />
              <p className="text-surface-400 text-[11px] font-bold uppercase tracking-widest">기록이 없습니다</p>
            </div>
          ) : (
            filteredMemos.map((check) => (
              <div 
                key={check.id} 
                className={cn(
                  "p-5 rounded-2xl border transition-all duration-200",
                  "border-surface-100 dark:border-surface-800/50",
                  getBackgroundColorForScore(check.condition)
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-surface-400 uppercase tracking-widest">
                      {format(parseISO(check.date), "MM월 dd일", { locale: ko })}
                    </span>
                  </div>
                  <span className={cn("font-mono text-[13px] font-black px-3 py-1 rounded-lg bg-white dark:bg-surface-800 shadow-sm", getTextColorForScore(check.condition))}>
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
