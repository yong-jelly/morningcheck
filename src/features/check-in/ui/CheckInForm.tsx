import { useState } from "react";
import { motion } from "framer-motion";
import { Quote, CheckCircle2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface CheckInFormProps {
  onCheckIn: (condition: number, note: string) => void;
}

const CONDITION_LABELS = [
  { range: [10, 10], label: "최상", color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
  { range: [8, 9], label: "좋음", color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
  { range: [6, 7], label: "보통", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
  { range: [4, 5], label: "조금 피곤", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
  { range: [1, 3], label: "나쁨", color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
];

export function CheckInForm({ onCheckIn }: CheckInFormProps) {
  const [condition, setCondition] = useState(5);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentLabel = CONDITION_LABELS.find(
    (l) => condition >= l.range[0] && condition <= l.range[1]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // 500ms 딜레이로 제출 피드백 제공
    await new Promise((resolve) => setTimeout(resolve, 500));
    onCheckIn(condition, note);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 py-4">
      <div className="space-y-8">
        <div className="space-y-1">
          <h2 className="text-xl font-bold">오늘 컨디션은 어떠신가요?</h2>
          <p className="text-sm text-surface-500 leading-relaxed">팀원들과 지금의 상태를 투명하게 공유해보세요.</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Score</span>
            <motion.span 
              key={condition}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "text-lg font-black italic",
                currentLabel?.color
              )}
            >
              {condition} <span className="text-xs not-italic font-bold ml-1 opacity-60">/ 10</span>
            </motion.span>
          </div>

          <div className="relative px-1">
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={condition}
              onChange={(e) => setCondition(parseInt(e.target.value))}
              className="w-full h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between mt-3 text-[10px] font-bold text-surface-300 uppercase tracking-[0.2em]">
              <span>Low</span>
              <span>Mid</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest ml-1">
          Notes (Optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="오늘의 기분이나 공유하고 싶은 내용을 적어주세요."
          className="w-full h-28 p-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 focus:border-primary-500 focus:ring-0 transition-all resize-none text-sm placeholder:text-surface-300"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "w-full h-12 bg-primary-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-98",
          isSubmitting && "opacity-70"
        )}
      >
        {isSubmitting ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          "체크인 완료"
        )}
      </button>
    </form>
  );
}
