import { useMemo, useState, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { BarChart3, Activity, Users, Grid3x3, MessageSquare, Loader2 } from 'lucide-react';
import type { Project, CheckIn } from "@/entities/project/model/types";
import { projectApi } from "@/entities/project/api/project";
import { cn } from "@/shared/lib/cn";

interface TeamDashboardProps {
  project: Project;
  selectedDate?: string | null;
  onDateSelect?: (date: string | null) => void;
}

export function TeamDashboard({ project, selectedDate, onDateSelect }: TeamDashboardProps) {
  const [historicalCheckIns, setHistoricalCheckIns] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const internalSelectedDate = selectedDate;
  const setInternalSelectedDate = onDateSelect || (() => {});

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        // 최근 7일치 데이터를 가져와서 히트맵과 메모에 사용
        const data = await projectApi.getProjectCheckIns(project.id, 7);
        setHistoricalCheckIns(data);
      } catch (error) {
        console.error("Failed to fetch historical check-ins:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [project.id]);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayCheckIns = useMemo(() => project.checkIns.filter(c => c.date === today), [project.checkIns, today]);
  
  const teamStats = useMemo(() => {
    const avg = todayCheckIns.length > 0
      ? (todayCheckIns.reduce((acc, curr) => acc + curr.condition, 0) / todayCheckIns.length).toFixed(1)
      : "0.0";
    const participation = project.members.length > 0
      ? Math.round((todayCheckIns.length / project.members.length) * 100)
      : 0;
    
    const low = todayCheckIns.filter(c => c.condition <= 3).length;
    const medium = todayCheckIns.filter(c => c.condition >= 4 && c.condition <= 7).length;
    const high = todayCheckIns.filter(c => c.condition >= 8).length;
    const total = todayCheckIns.length;

    const distribution = [
      { name: "좋음 (8-10)", count: high, percent: total > 0 ? (high / total) * 100 : 0, color: "bg-green-500", textColor: "text-green-600" },
      { name: "보통 (4-7)", count: medium, percent: total > 0 ? (medium / total) * 100 : 0, color: "bg-yellow-400", textColor: "text-yellow-600" },
      { name: "나쁨 (1-3)", count: low, percent: total > 0 ? (low / total) * 100 : 0, color: "bg-red-500", textColor: "text-red-600" },
    ];

    return { avg, participation, distribution };
  }, [todayCheckIns, project.members.length]);

  const teamTrendData = useMemo(() => Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    // historicalCheckIns 또는 project.checkIns(오늘 데이터용)에서 해당 날짜 데이터 필터링
    const allSource = [...historicalCheckIns, ...project.checkIns];
    // 중복 제거 (id 기준)
    const uniqueCheckIns = Array.from(new Map(allSource.map(item => [item.id, item])).values());
    
    const dayChecks = uniqueCheckIns.filter(c => c.date === dateStr);
    const avg = dayChecks.length > 0
      ? (dayChecks.reduce((acc, curr) => acc + curr.condition, 0) / dayChecks.length)
      : null;
    return {
      name: format(date, "MM/dd"),
      avg: avg ? parseFloat(avg.toFixed(1)) : null,
    };
  }), [historicalCheckIns, project.checkIns]);

  // 히트맵용 날짜 배열 (최근 7일)
  const heatmapDates = useMemo(() => Array.from({ length: 7 }).map((_, i) => 
    format(subDays(new Date(), 6 - i), "yyyy-MM-dd")
  ), []);

  const getColorForScore = (score: number | undefined): string => {
    if (score === undefined || score === null) return 'bg-surface-100 dark:bg-surface-800 text-transparent';
    if (score >= 8) return 'bg-green-500 text-white';
    if (score >= 6) return 'bg-yellow-400 text-gray-900';
    if (score >= 4) return 'bg-orange-400 text-white';
    return 'bg-red-500 text-white';
  };

  const filteredMemos = useMemo(() => {
    const baseMemos = internalSelectedDate 
      ? historicalCheckIns.filter(c => c.date === internalSelectedDate)
      : historicalCheckIns.filter(c => {
          const checkDate = parseISO(c.date);
          const weekAgo = subDays(new Date(), 7);
          return checkDate >= weekAgo;
        });

    // 날짜 역순 (최신순) 정렬
    const sorted = [...baseMemos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (isExpanded || internalSelectedDate) return sorted;
    return sorted.slice(0, 3);
  }, [historicalCheckIns, internalSelectedDate, isExpanded]);

  const remainingCount = useMemo(() => {
    const baseMemos = internalSelectedDate 
      ? historicalCheckIns.filter(c => c.date === internalSelectedDate)
      : historicalCheckIns.filter(c => {
          const checkDate = parseISO(c.date);
          const weekAgo = subDays(new Date(), 7);
          return checkDate >= weekAgo;
        });
    return Math.max(0, baseMemos.length - 5);
  }, [historicalCheckIns, internalSelectedDate]);

  return (
    <div className="space-y-6">
      {/* Team Stats Summary */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-sm border border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-[11px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">오늘 팀 평균</span>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-[28px] font-black text-surface-900 dark:text-white leading-none font-mono">{teamStats.avg}</p>
            <p className="text-[12px] font-bold text-surface-400">점</p>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-sm border border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">팀 참여율</span>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-[28px] font-black text-surface-900 dark:text-white leading-none font-mono">{teamStats.participation}</p>
            <p className="text-[12px] font-bold text-surface-400">% ({todayCheckIns.length}/{project.members.length})</p>
          </div>
        </div>
      </section>

      {/* Individual Score Distribution (Heatmap) */}
      <section className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-100 dark:border-surface-700 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Grid3x3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-[13px] font-bold text-surface-900 dark:text-white">개인별 점수 분포</h3>
        </div>
        
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 text-[11px] font-bold text-surface-400 uppercase tracking-wider sticky left-0 bg-white dark:bg-surface-800 z-10">멤버</th>
                {heatmapDates.map((date) => (
                  <th key={date} className="p-1 text-center text-[10px] font-bold text-surface-400 min-w-[36px]">
                    {format(parseISO(date), "MM/dd")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50 dark:divide-surface-700/50">
              {project.members.map((member) => (
                <tr key={member.id}>
                  <td className="py-3 pr-4 sticky left-0 bg-white dark:bg-surface-800 z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-surface-100 dark:bg-surface-700 overflow-hidden shrink-0">
                        {member.profileImageUrl ? (
                          <img src={member.profileImageUrl} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-surface-400 uppercase">
                            {member.name.substring(0, 1)}
                          </div>
                        )}
                      </div>
                      <span className="text-[12px] font-bold text-surface-700 dark:text-surface-200 truncate max-w-[80px]">
                        {member.name}
                      </span>
                    </div>
                  </td>
                  {heatmapDates.map((date) => {
                    const checkIn = historicalCheckIns.find(c => c.userId === member.id && c.date === date);
                    return (
                      <td key={date} className="p-1">
                        <button
                          onClick={() => setInternalSelectedDate(internalSelectedDate === date ? null : date)}
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black transition-all",
                            getColorForScore(checkIn?.condition),
                            internalSelectedDate === date ? "ring-2 ring-primary-500 ring-offset-2 scale-110" : "hover:scale-105"
                          )}
                        >
                          {checkIn !== undefined ? checkIn.condition : "-"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Team Distribution */}
      <section className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-100 dark:border-surface-700 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-[13px] font-bold text-surface-900 dark:text-white">오늘의 컨디션 요약</h3>
        </div>
        
        <div className="space-y-4">
          {teamStats.distribution.map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[12px] font-bold text-surface-600 dark:text-surface-400">{item.name}</span>
                <span className={cn("text-[12px] font-black", item.textColor)}>{item.percent.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-7 overflow-hidden">
                <div 
                  className={cn(item.color, "h-full flex items-center justify-center transition-all duration-500")}
                  style={{ width: `${item.percent}%` }}
                >
                  {item.count > 0 && (
                    <span className="text-[11px] font-black text-white">{item.count}명</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team Memos (All Memos) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-[13px] font-bold text-surface-900 dark:text-white">
              {internalSelectedDate ? `${format(parseISO(internalSelectedDate), "M월 d일", { locale: ko })} 기록` : '최근 팀 기록'}
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
          {isLoading ? (
            <div className="py-10 flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
          ) : filteredMemos.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center bg-white dark:bg-surface-800/50 rounded-2xl border border-dashed border-surface-200 dark:border-surface-700">
              <MessageSquare className="w-8 h-8 text-surface-200 dark:text-surface-700 mb-2" />
              <p className="text-surface-400 text-[11px] font-bold uppercase tracking-widest">기록이 없습니다</p>
            </div>
          ) : (
            filteredMemos.map((check) => (
              <div 
                key={check.id} 
                className="p-4 bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-700 overflow-hidden">
                      {check.userProfileImage ? (
                        <img src={check.userProfileImage} alt={check.userName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[12px] font-bold text-surface-400 uppercase">
                          {check.userName?.substring(0, 1) || "?"}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-surface-900 dark:text-white leading-tight">{check.userName}</p>
                      <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">{format(parseISO(check.date), "MM월 dd일", { locale: ko })}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "font-mono text-[12px] font-black px-2.5 py-1 rounded-lg",
                    check.condition >= 8 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" :
                    check.condition >= 4 ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" :
                    "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  )}>
                    {check.condition} PT
                  </span>
                </div>
                <p className="text-[13px] font-medium leading-relaxed text-surface-600 dark:text-surface-300">
                  {check.note || "작성된 메모가 없습니다."}
                </p>
              </div>
            ))
          )}
        </div>
        
        {!isExpanded && !internalSelectedDate && remainingCount > 0 && (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full py-4 mt-2 text-[13px] font-bold text-surface-500 hover:text-primary-600 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-dashed border-surface-200 dark:border-surface-700 transition-colors active:scale-[0.99]"
          >
            더보기 ({remainingCount}건)
          </button>
        )}
      </section>

      {/* Team Trend (Keep for completeness) */}
      <section className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-100 dark:border-surface-700 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <h3 className="text-[13px] font-bold text-surface-900 dark:text-white">주간 팀 컨디션 추이</h3>
        </div>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart 
              data={teamTrendData}
              margin={{ top: 5, right: 15, left: 15, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" opacity={0.5} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#a3a3a3', fontWeight: 700 }} 
                dy={10} 
                padding={{ left: 10, right: 10 }}
              />
              <YAxis domain={[0, 10]} hide />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  fontSize: '11px', 
                  fontWeight: 800,
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="avg" 
                stroke="#6366f1" 
                strokeWidth={3} 
                dot={{ r: 3, fill: '#6366f1', strokeWidth: 1, stroke: '#fff' }} 
                activeDot={{ r: 5, strokeWidth: 0 }}
                connectNulls 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
