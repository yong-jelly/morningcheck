import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { projectApi } from "@/entities/project/api/project";
import { PersonalDashboard } from "@/widgets/modal/project-detail/ui/PersonalDashboard";
import { supabase } from "@/shared/lib/supabase";

export function UserStatusPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 사용자 프로필 정보 가져오기
  const { data: dbProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.rpc("v1_get_user_profile", {
        p_auth_id: userId
      });
      
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!userId,
  });

  // 체크인 히스토리 가져오기 (전체 기간 30일로 확장)
  const { data: checkInHistory, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["user-check-in-history", userId],
    queryFn: async () => {
      if (!userId) return [];
      return await projectApi.getUserCheckInHistory(userId, 30);
    },
    enabled: !!userId,
  });

  const isLoading = isProfileLoading || isHistoryLoading;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-surface-950 overflow-hidden">
      {/* Header */}
      <header 
        className="px-4 h-14 flex items-center bg-white dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800 sticky top-0 z-10"
        style={{ paddingTop: `env(safe-area-inset-top)` }}
      >
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-surface-600 dark:text-surface-400 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center font-bold text-surface-900 dark:text-white mr-8">
          {dbProfile?.display_name || "사용자"}의 현황
        </h1>
      </header>

      {/* Content */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          willChange: 'scroll-position',
          transform: 'translateZ(0)'
        }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : userId && dbProfile ? (
          <div className="p-5">
            <PersonalDashboard 
              checkIns={checkInHistory}
              currentUser={{
                id: userId,
                name: dbProfile.display_name,
                profileImageUrl: dbProfile.avatar_url
              }}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-surface-400 font-medium">
            사용자 정보를 찾을 수 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
