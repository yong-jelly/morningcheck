import { useMemo, useState, useEffect } from "react";
import { format, parseISO, addDays, subDays } from "date-fns";
import { ko } from "date-fns/locale";
import type { Project, User as UserType, CheckIn } from "@/entities/project/model/types";
import { cn } from "@/shared/lib/cn";
import { ChevronLeft, ChevronRight, Sun, Loader2 } from "lucide-react";
import { getCurrentDateString } from "@/shared/lib/utils";
import { projectApi } from "@/entities/project/api/project";
import { getProfileImageUrl } from "@/shared/lib/storage";

interface ProjectMainDashboardTabProps {
  project: Project;
  currentUser: UserType;
  onTabChange: (tab: "check-in" | "list" | "stats" | "dashboard") => void;
  selectedDate?: string;
  onDateSelect?: (date: string | null) => void;
  onInviteClick?: () => void;
  onSettingsClick?: () => void;
}

export function ProjectMainDashboardTab({ 
  project, 
  currentUser,
  onTabChange, 
  selectedDate, 
  onDateSelect,
  onInviteClick,
  onSettingsClick
}: ProjectMainDashboardTabProps) {
  const [historicalData, setHistoricalData] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredCheckIn, setHoveredCheckIn] = useState<string | null>(null);

  const today = getCurrentDateString();
  const targetDate = selectedDate || today;
  const isToday = targetDate === today;
  
  useEffect(() => {
    const fetchHistory = async () => {
      if (isToday) {
        setHistoricalData([]);
        return;
      }
      
      try {
        setIsLoading(true);
        const data = await projectApi.getProjectCheckInsByDate(project.id, targetDate);
        setHistoricalData(data);
      } catch (error) {
        console.error("Failed to fetch check-ins for date:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistory();
  }, [project.id, targetDate, isToday]);

  const displayCheckIns = useMemo(() => {
    const source = isToday ? project.checkIns : historicalData;
    return [...source]
      .filter(c => c.date === targetDate)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [project.checkIns, historicalData, targetDate, isToday]);

  const stats = useMemo(() => {
    const avg = displayCheckIns.length > 0
      ? (displayCheckIns.reduce((acc, curr) => acc + curr.condition, 0) / displayCheckIns.length).toFixed(1)
      : "0.0";
    const participation = project.members.length > 0
      ? ((displayCheckIns.length / project.members.length) * 100).toFixed(0)
      : "0";
    
    return {
      avg,
      memberCount: project.members.length,
      participation
    };
  }, [displayCheckIns, project.members.length]);

  const handlePrevDate = () => {
    const prevDate = format(subDays(parseISO(targetDate), 1), "yyyy-MM-dd");
    onDateSelect?.(prevDate);
  };

  const handleNextDate = () => {
    const nextDate = format(addDays(parseISO(targetDate), 1), "yyyy-MM-dd");
    onDateSelect?.(nextDate);
  };

  // 차트 데이터 포인트 계산
  const chartPoints = useMemo(() => {
    if (displayCheckIns.length === 0) return [];
    
    return displayCheckIns.map((c, i) => {
      // X: 체크인 순서 (0 ~ length-1) -> 10% ~ 90%
      const x = displayCheckIns.length > 1 
        ? 10 + (i * (80 / (displayCheckIns.length - 1)))
        : 50;
      
      // Y: 점수 (0 ~ 10) -> 90% (0점) ~ 10% (10점)
      const y = 90 - (c.condition * 8);
      
      return { ...c, x, y };
    });
  }, [displayCheckIns]);

  // SVG 경로 생성
  const linePath = useMemo(() => {
    if (chartPoints.length < 2) return "";
    return chartPoints.reduce((path, p, i) => {
      return path + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
    }, "");
  }, [chartPoints]);

  return (
    <div className="flex flex-col space-y-8 -mx-6 -my-8 px-6 py-8 min-h-full bg-white dark:bg-surface-950 pb-20">
      {/* Header Actions & Tabs */}
      <div className="space-y-4">
        {project.createdBy === currentUser.id && (
          <div className="flex items-center justify-end gap-4 px-1">
            <button 
              onClick={onInviteClick}
              className="text-[13px] font-bold text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors"
            >
              초대
            </button>
            <button 
              onClick={onSettingsClick}
              className="text-[13px] font-bold text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors"
            >
              설정
            </button>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center p-1 bg-surface-50 dark:bg-surface-800/50 rounded-[14px] border border-surface-100 dark:border-surface-700/50">
            <button
              onClick={() => onTabChange("dashboard")}
              className="px-4 h-8 flex items-center justify-center rounded-[10px] bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm transition-all"
            >
              <span className="text-[12px] font-bold">대시보드</span>
            </button>
            <button
              onClick={() => onTabChange("list")}
              className="px-4 h-8 flex items-center justify-center rounded-[10px] text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-all"
            >
              <span className="text-[12px] font-bold">목록</span>
            </button>
            <button
              onClick={() => onTabChange("stats")}
              className="px-4 h-8 flex items-center justify-center rounded-[10px] text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-all"
            >
              <span className="text-[12px] font-bold">통계</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex justify-between px-2">
        <div className="text-center flex-1">
          <p className="text-[28px] font-black text-surface-900 dark:text-white leading-tight">{stats.avg}</p>
          <p className="text-[12px] font-bold text-surface-400">평균점수</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-[28px] font-black text-surface-900 dark:text-white leading-tight">{stats.memberCount}</p>
          <p className="text-[12px] font-bold text-surface-400">멤버 수</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-[28px] font-black text-surface-900 dark:text-white leading-tight">{stats.participation}%</p>
          <p className="text-[12px] font-bold text-surface-400">참여율</p>
        </div>
      </div>

      {/* Main Dashboard Card */}
      <div className="bg-white dark:bg-surface-800 rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-surface-100 dark:border-surface-700">
        {/* Date & Weather Row */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-1">
            <button onClick={handlePrevDate} className="p-1 text-surface-400 hover:text-surface-600 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-[16px] font-bold text-surface-900 dark:text-white">
              {format(parseISO(targetDate), "yyyy년 M월 d일 EEEE", { locale: ko })}
            </span>
            <button onClick={handleNextDate} className="p-1 text-surface-400 hover:text-surface-600 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-900 text-white rounded-xl shadow-sm">
            <span className="text-[14px] font-bold">-7</span>
            <Sun className="w-4 h-4 fill-current" />
          </div>
        </div>

        {/* Chart Area */}
        <div className="relative mt-4">
          {/* Score Labels (Y-axis) - Fixed Left */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[11px] font-bold text-surface-300 py-[10%] z-30 pointer-events-none">
            <span>10</span>
            <span>8</span>
            <span>6</span>
            <span>4</span>
            <span>2</span>
            <span>0</span>
          </div>

          <div className="overflow-x-auto scrollbar-hide ml-6 -mr-6 pr-6"
            style={{ 
              willChange: 'scroll-position',
              WebkitOverflowScrolling: 'touch',
              transform: 'translateZ(0)',
            }}
          >
            <div 
              className="relative h-[440px]" 
              style={{ 
                minWidth: displayCheckIns.length > 6 
                  ? `${displayCheckIns.length * 100}px` 
                  : "100%" 
              }}
            >
              {isLoading ? (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-surface-800/50 rounded-xl">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    <p className="text-[12px] font-bold text-surface-400">데이터 로드 중...</p>
                  </div>
                </div>
              ) : displayCheckIns.length === 0 && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-surface-50/30 dark:bg-surface-800/30 rounded-xl">
                  <p className="text-[13px] font-bold text-surface-400">기록이 없습니다.</p>
                </div>
              )}

              {/* Grid lines (Score) */}
              <div className="absolute left-0 right-0 top-0 h-full flex flex-col justify-between py-[10%] pointer-events-none">
                {[10, 8, 6, 4, 2, 0].map((s) => (
                  <div key={s} className="border-t border-dashed border-surface-100 dark:border-surface-700/50 w-full" />
                ))}
              </div>

              {/* SVG Line */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                {linePath && (
                  <path 
                    d={linePath} 
                    fill="none" 
                    stroke="#6366f1" 
                    strokeWidth="0.2" 
                    strokeOpacity="0.2"
                  />
                )}
              </svg>

              {/* Data Points */}
              <div className="absolute inset-0">
                {chartPoints.map((p) => (
                  <div 
                    key={p.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    onMouseEnter={() => setHoveredCheckIn(p.id)}
                    onMouseLeave={() => setHoveredCheckIn(null)}
                  >
                    {/* Note Tooltip */}
                    {hoveredCheckIn === p.id && p.note && (
                      <div 
                        className={cn(
                          "absolute w-48 p-3 bg-surface-900 text-white text-[12px] font-medium rounded-2xl shadow-xl z-[100]",
                          p.condition > 8 
                            ? "top-full mt-4" 
                            : "bottom-full mb-4",
                          // 위치에 따라 좌우 정렬 조정
                          p.x < 20 ? "left-0" : p.x > 80 ? "right-0" : "left-1/2 -translate-x-1/2"
                        )}
                      >
                        {p.note}
                        <div 
                          className={cn(
                            "absolute border-8 border-transparent",
                            p.condition > 8 
                              ? "bottom-full border-b-surface-900" 
                              : "top-full border-t-surface-900",
                            // 위치에 따라 화살표 위치 조정
                            p.x < 20 ? "left-4" : p.x > 80 ? "right-4" : "left-1/2 -translate-x-1/2"
                          )} 
                        />
                      </div>
                    )}

                    <div className="flex flex-col items-center gap-1">
                      <div className="relative">
                        <div 
                          className="w-10 h-10 rounded-full p-0.5 shadow-lg border-2 bg-white dark:bg-surface-800 transition-transform hover:scale-110"
                          style={{ borderColor: getScoreColor(p.condition) }}
                        >
                          <div className="w-full h-full rounded-full overflow-hidden bg-surface-50 dark:bg-surface-700 flex items-center justify-center">
                            {p.userProfileImage ? (
                              <img 
                                src={getProfileImageUrl(p.userProfileImage, "sm")} 
                                alt={p.userName} 
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xl">{getEmojiForUser(p.userId)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="bg-white/90 dark:bg-surface-800/90 px-2 py-0.5 rounded-full border border-surface-100 dark:border-surface-700 shadow-sm flex items-center gap-1">
                        <span className="text-[10px] font-black text-surface-900 dark:text-white whitespace-nowrap">
                          {p.userName}
                        </span>
                        <span className="text-[9px] font-bold text-surface-500 dark:text-surface-400">
                          {p.condition}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      {/* X-axis Label */}
        <div className="flex justify-center mt-8">
          <span className="text-[11px] font-black text-surface-300 tracking-[0.2em] uppercase">
            Check-in Order →
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper: 사용자별 고정 이모지 생성
function getEmojiForUser(userId: string) {
  const emojis = ["😊", "😎", "🤔", "😴", "🤩", "🥳", "😇", "🤠", "🤖", "👻", "😺", "🐶"];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return emojis[Math.abs(hash) % emojis.length];
}

// Helper: 점수별 색상 반환
function getScoreColor(score: number) {
  if (score >= 8) return "#22c55e"; // green-500
  if (score >= 4) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}
