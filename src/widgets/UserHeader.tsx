import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { User, Bell, Sun, Cloud, CloudRain, CloudSnow, CloudFog, CloudDrizzle, CloudLightning, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { getConditionColor } from "@/shared/lib/utils";
import type { CheckIn } from "@/entities/project/model/types";
import { useMemo } from "react";

const DAYS_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THUR", "FRI", "SAT"];
const DAYS_OF_WEEK_KO = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

interface UserProfileHeaderProps {
  user: {
    display_name?: string;
    avatar_url?: string;
    id?: string;
    name?: string;
  } | null;
  isLoading?: boolean;
}

/**
 * 프로필 헤더 - 스크롤과 무관하게 항상 고정
 */
export function UserProfileHeader({ user, isLoading }: UserProfileHeaderProps) {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate("/profile");
  };

  if (isLoading) {
    return (
      <header 
        className="px-5 pt-10 pb-4 flex items-center justify-between bg-[#F8FAFC] dark:bg-surface-950"
        style={{ paddingTop: `calc(env(safe-area-inset-top) + 1.5rem)` }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-surface-200 dark:bg-surface-800 animate-pulse" />
          <div className="flex flex-col gap-2">
            <div className="w-32 h-4 bg-surface-200 dark:bg-surface-800 rounded animate-pulse" />
            <div className="w-20 h-5 bg-surface-200 dark:bg-surface-800 rounded animate-pulse" />
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-surface-200 dark:bg-surface-800 animate-pulse" />
      </header>
    );
  }

  return (
    <header 
      className="px-5 pt-10 pb-4 flex items-center justify-between bg-[#F8FAFC] dark:bg-surface-950"
      style={{ paddingTop: `calc(env(safe-area-inset-top) + 1.5rem)` }}
    >
      <div 
        className="flex items-center gap-3 cursor-pointer active:opacity-70 transition-opacity"
        onClick={handleProfileClick}
      >
        <div className="w-12 h-12 rounded-full bg-surface-200 dark:bg-surface-800 flex-shrink-0 overflow-hidden border-2 border-white">
          {user?.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt="Profile" 
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-surface-400">
              <User className="w-6 h-6" />
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[14px] text-surface-500 dark:text-surface-400 font-medium leading-tight">
            안녕하세요. 좋은 하루 입니다!
          </span>
          <span className="text-[18px] font-bold text-surface-900 dark:text-white leading-tight">
            {user?.display_name || user?.name || "Member"}님!
          </span>
        </div>
      </div>
      
      <button className="relative p-2 text-surface-700 dark:text-surface-300 active:scale-95 transition-transform">
        <Bell className="w-7 h-7 stroke-[1.5]" />
        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#E15A5A] border-2 border-[#F8FAFC] dark:border-surface-950 rounded-full" />
      </button>
    </header>
  );
}

interface UserContentProps {
  user: {
    display_name?: string;
    avatar_url?: string;
    id?: string;
    name?: string;
  } | null;
  todayCheckIn?: CheckIn | null;
  checkInHistory?: CheckIn[];
  weather?: {
    temp: number;
    code: number;
  } | null;
  isLoading?: boolean;
}

/**
 * 사용자 컨텐츠 - Today Card + Daily Check in (스크롤 영역 내부)
 */
export function UserContent({ user, todayCheckIn, checkInHistory = [], weather, isLoading }: UserContentProps) {
  const navigate = useNavigate();
  const todayDate = new Date();
  const year = todayDate.getFullYear();
  const month = todayDate.getMonth() + 1;
  const date = todayDate.getDate();

  const last6Days = useMemo(() => {
    const days = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const historyItem = checkInHistory?.find((h: any) => h.date === dateStr);
      days.push({
        date: d,
        dateStr,
        dayName: DAYS_OF_WEEK[d.getDay()],
        dayNum: d.getDate(),
        condition: historyItem?.condition ?? null,
        isToday: i === 0,
      });
    }
    return days;
  }, [checkInHistory]);

  const getWeatherIcon = (code: number, className: string = "w-12 h-12 stroke-[1]") => {
    const props = { className };
    if (code === 0) return <Sun {...props} />;
    if (code >= 1 && code <= 3) return <Cloud {...props} />;
    if (code === 45 || code === 48) return <CloudFog {...props} />;
    if (code >= 51 && code <= 57) return <CloudDrizzle {...props} />;
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain {...props} />;
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return <CloudSnow {...props} />;
    if (code >= 95) return <CloudLightning {...props} />;
    return <Sun {...props} />;
  };

  if (isLoading) {
    return (
      <div className="px-5 space-y-8 pb-6">
        {/* Skeleton: Today Summary Card */}
        <div className="h-44 rounded-[12px] bg-surface-200 dark:bg-surface-800 animate-pulse" />

        {/* Skeleton: Daily Check in Grid */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="w-32 h-6 bg-surface-200 dark:bg-surface-800 rounded animate-pulse" />
            <div className="w-16 h-4 bg-surface-200 dark:bg-surface-800 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-6 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 rounded-[18px] bg-surface-200 dark:bg-surface-800 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 space-y-8 pb-6">
      {/* Today Summary Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-[12px] p-8 text-white shadow-lg",
          !todayCheckIn && "cursor-pointer active:scale-[0.98] transition-transform"
        )}
        style={{ 
          backgroundColor: todayCheckIn ? getConditionColor(todayCheckIn.condition) : "#E15A5A" 
        }}
        onClick={() => !todayCheckIn && navigate("/check-in")}
      >
        <div className="flex justify-between items-start mb-5">
          <div className="space-y-0.5">
            <span className="text-[14px] font-normal text-white/80">Today</span>
            <h3 className="text-[18px] font-normal tracking-tight text-white">
              {year}년 {month}월 {date}일 {DAYS_OF_WEEK_KO[todayDate.getDay()]}
            </h3>
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-0.5 bg-white/30 rounded-[10px] border border-white/20">
            <span className="text-[20px] font-medium text-white">{weather?.temp ?? "--"}°</span>
            <div className="w-5 h-5 flex items-center justify-center">
              {weather ? (
                getWeatherIcon(weather.code, "w-5 h-5 stroke-[1.5] text-white")
              ) : (
                <Sun className="w-4 h-4 animate-pulse text-white" />
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 overflow-hidden">
          {todayCheckIn ? (
            <div className="flex items-baseline justify-between gap-3 text-white w-full">
              <span className="text-[28px] font-bold truncate flex-1">{todayCheckIn.note || "오늘도 파이팅!"}</span>
              <div className="flex items-baseline gap-1 shrink-0">
                <span className="text-[42px] font-black leading-none">{todayCheckIn.condition}</span>
                <span className="text-[18px] font-bold opacity-80">점</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <h2 className="text-[28px] font-bold tracking-tight leading-tight text-white">
                아직 체크인을<br />하지 않았어요
              </h2>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <ChevronRight className="w-8 h-8 text-white" />
              </div>
            </div>
          )}
        </div>
        
        {/* Background decorative circle */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      </motion.div>

      {/* Daily Check in Grid */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-bold text-surface-900 dark:text-white tracking-tight">
            Daily Check in
          </h2>
          <button 
            onClick={() => (user?.id || (user as any)?.auth_id) && navigate(`/p/status/${user?.id || (user as any)?.auth_id}`)}
            className="flex items-center gap-1 text-[15px] font-semibold text-surface-500 dark:text-surface-400 active:opacity-60 transition-opacity"
          >
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-6 gap-2">
          {last6Days.map((day) => (
            <div 
              key={day.dateStr}
              onClick={() => (user?.id || (user as any)?.auth_id) && navigate(`/p/status/${user?.id || (user as any)?.auth_id}`)}
              className={cn(
                "flex flex-col items-center justify-between py-4 rounded-[18px] border-2 transition-all bg-white dark:bg-surface-900 cursor-pointer active:scale-95",
                day.isToday 
                  ? "border-surface-900 dark:border-white shadow-lg shadow-black/5" 
                  : "border-transparent"
              )}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-black text-white mb-2"
                style={{ 
                  backgroundColor: day.condition !== null 
                    ? getConditionColor(day.condition) 
                    : "#E2E8F0" 
                }}
              >
                {day.condition ?? "-"}
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[11px] font-bold text-surface-400 uppercase tracking-wider">
                  {day.dayName}
                </span>
                <span className="text-[15px] font-black text-surface-900 dark:text-white">
                  {day.dayNum}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 기존 UserHeader는 하위 호환성을 위해 유지 (두 컴포넌트를 함께 렌더링)
interface UserHeaderProps {
  user: {
    display_name?: string;
    avatar_url?: string;
    id?: string;
    name?: string;
  } | null;
  todayCheckIn?: CheckIn | null;
  checkInHistory?: CheckIn[];
  weather?: {
    temp: number;
    code: number;
  } | null;
  isLoading?: boolean;
}

export function UserHeader({ user, todayCheckIn, checkInHistory = [], weather, isLoading }: UserHeaderProps) {
  return (
    <div className="flex flex-col">
      <UserProfileHeader user={user} isLoading={isLoading} />
      <UserContent 
        user={user} 
        todayCheckIn={todayCheckIn} 
        checkInHistory={checkInHistory} 
        weather={weather} 
        isLoading={isLoading} 
      />
    </div>
  );
}
