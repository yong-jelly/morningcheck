import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { CheckInForm } from "@/features/check-in/ui/CheckInForm";
import { projectApi } from "@/entities/project/api/project";
import { useAppStore } from "@/shared/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, Home } from "lucide-react";

export function CheckInPage() {
  const navigate = useNavigate();
  const currentUser = useAppStore((state) => state.currentUser);
  const [condition, setCondition] = useState(5);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 이미 오늘 체크인했는지 확인
  useEffect(() => {
    const checkTodayCheckIn = async () => {
      if (!currentUser) return;
      try {
        const todayCheckIn = await projectApi.getTodayCheckIn(currentUser.id);
        if (todayCheckIn) {
          setCondition(todayCheckIn.condition);
          setNote(todayCheckIn.note || "");
          // 이미 체크인했다면 홈으로 이동할 수도 있지만, 
          // 유저가 수정을 원할 수도 있으므로 여기서는 상태만 업데이트합니다.
        }
      } catch (error) {
        console.error("Failed to fetch today's check-in:", error);
      }
    };
    checkTodayCheckIn();
  }, [currentUser]);

  const handleSubmit = async () => {
    if (!currentUser) return;
    
    setIsSubmitting(true);
    try {
      await projectApi.checkIn("", currentUser.id, condition, note);
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

  return (
    <div className="relative w-full h-full bg-surface-950 overflow-hidden">
      <div className="absolute inset-0 w-full h-full max-w-[500px] mx-auto overflow-hidden">
      <CheckInForm 
        condition={condition} 
        setCondition={setCondition} 
        note={note} 
        setNote={setNote} 
        userName={currentUser?.name}
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

        {/* Home Navigation (Floating bottom-left) */}
        <button
          onClick={() => navigate("/projects")}
          className="absolute bottom-10 left-8 z-30 w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <Home className="w-6 h-6" />
        </button>

        {/* Submit Button (Floating bottom-right) */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={isSubmitting || isSuccess}
          className="absolute bottom-10 right-8 z-30 h-14 px-8 rounded-2xl bg-white text-black font-black text-lg shadow-2xl disabled:opacity-50"
        >
          기록 완료
        </motion.button>
      </div>
    </div>
  );
}
