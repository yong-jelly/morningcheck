import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { CheckInForm } from "@/features/check-in/ui/CheckInForm";
import { projectApi } from "@/entities/project/api/project";
import { useAppStore } from "@/shared/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check } from "lucide-react";
import { supabase } from "@/shared/lib/supabase";
import { useQuery } from "@tanstack/react-query";

export function CheckInPage() {
  const navigate = useNavigate();
  const { currentUser, logout, isAuthenticated, login } = useAppStore();
  const [condition, setCondition] = useState(5);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 1. 세션 유효성 검사
  const { data: authUser, isLoading: isAuthLoading, isFetched: isAuthFetched } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) return null;
      return user;
    },
    retry: false,
  });

  // 세션이 없으면 온보딩으로 이동
  useEffect(() => {
    if (isAuthFetched && !isAuthLoading && !authUser) {
      if (isAuthenticated) {
        logout();
      }
      navigate("/onboarding");
    }
  }, [authUser, isAuthLoading, isAuthFetched, navigate, logout, isAuthenticated]);

  // 세션은 있는데 스토어에 유저 정보가 없으면 동기화
  useEffect(() => {
    const syncProfile = async () => {
      if (isAuthFetched && authUser && !currentUser) {
        try {
          const { data: profiles, error } = await supabase.rpc("v1_get_user_profile", {
            p_auth_id: authUser.id
          });

          if (error || !profiles?.[0]) {
            console.error("Profile not found for authenticated user");
            navigate("/onboarding");
            return;
          }

          const profile = profiles[0];
          login({
            id: authUser.id,
            name: profile.display_name,
            email: profile.email || "",
            profileImageUrl: profile.avatar_url,
            bio: profile.bio || ""
          });
        } catch (err) {
          console.error("Failed to sync profile:", err);
          navigate("/onboarding");
        }
      }
    };
    syncProfile();
  }, [authUser, isAuthFetched, currentUser, login, navigate]);

  const CACHE_KEY = `morningcheck_memo_cache_${currentUser?.id}`;
  const CACHE_EXPIRY = 3 * 60 * 60 * 1000; // 3시간

  // 이미 오늘 체크인했는지 확인 및 캐시된 메모 불러오기
  useEffect(() => {
    const loadInitialData = async () => {
      if (!currentUser) {
        if (isAuthFetched && authUser) {
          // 세션은 있는데 currentUser가 없는 경우 (스토어 동기화 전 등)
          // 잠시 대기하거나 프로필을 불러올 때까지 로딩 유지
          return;
        }
        setIsInitialLoading(false);
        return;
      }
      try {
        // 1. 먼저 오늘 이미 체크인했는지 확인 (서버 데이터 우선)
        const todayCheckIn = await projectApi.getTodayCheckIn(currentUser.id);
        if (todayCheckIn) {
          setCondition(todayCheckIn.condition);
          setNote(todayCheckIn.note || "");
          setIsInitialLoading(false);
          return;
        }

        // 2. 오늘 체크인 기록이 없다면 로컬 캐시 확인
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          try {
            const { note: cachedNote, timestamp } = JSON.parse(cachedData);
            const now = Date.now();
            
            if (now - timestamp < CACHE_EXPIRY) {
              setNote(cachedNote);
            } else {
              localStorage.removeItem(CACHE_KEY);
            }
          } catch (e) {
            console.error("Failed to parse cached memo:", e);
          }
        }
      } catch (error) {
        console.error("Failed to load initial check-in data:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadInitialData();
  }, [currentUser, CACHE_KEY, authUser, isAuthFetched]);

  // 메모 변경 시 캐시 저장
  useEffect(() => {
    if (isInitialLoading || !currentUser) return;

    if (!note) {
      localStorage.removeItem(CACHE_KEY);
      return;
    }
    
    const cacheData = {
      note,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  }, [note, currentUser, CACHE_KEY, isInitialLoading]);

  const handleSubmit = async () => {
    if (!currentUser) return;
    
    setIsSubmitting(true);
    try {
      await projectApi.checkIn("", currentUser.id, condition, note);
      
      // 체크인 성공 시 캐시 삭제
      localStorage.removeItem(CACHE_KEY);
      
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/projects");
      }, 1500);
    } catch (error) {
      console.error("Failed to check in:", error);
      alert("체크인에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isAuthLoading || (isAuthFetched && authUser && !currentUser) || (isInitialLoading && !!authUser);

  return (
    <div className="relative w-full h-full bg-surface-950 overflow-hidden">
      <div className="absolute inset-0 w-full h-full max-w-[500px] mx-auto overflow-hidden">
      <CheckInForm 
        condition={condition} 
        setCondition={setCondition} 
        note={note} 
        setNote={setNote} 
        userName={currentUser?.name}
        onSubmit={handleSubmit}
        onHome={() => navigate("/projects")}
        isSubmitting={isSubmitting}
        isLoading={isLoading}
      />

        {/* Submission Overlay */}
        <AnimatePresence>
          {(isSubmitting || isSuccess) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
            >
              <div className="flex flex-col items-center gap-4">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                    <span className="text-white font-bold text-lg">기록 중...</span>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 12, stiffness: 200 }}
                      className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <Check className="w-10 h-10 text-white" />
                    </motion.div>
                    <span className="text-white font-bold text-xl">체크인 완료!</span>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
