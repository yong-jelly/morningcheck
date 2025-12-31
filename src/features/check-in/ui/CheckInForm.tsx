import { motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";
import { ConditionBar } from "@/shared/ui/ConditionBar";

interface CheckInFormProps {
  condition: number;
  setCondition: (v: number) => void;
  note: string;
  setNote: (v: string) => void;
}

const CONDITION_LABELS = [
  { range: [10, 10], label: "최상", color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
  { range: [8, 9], label: "좋음", color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
  { range: [6, 7], label: "보통", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
  { range: [4, 5], label: "조금 피곤", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
  { range: [1, 3], label: "나쁨", color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
];

export function CheckInForm({ condition, setCondition, note, setNote }: CheckInFormProps) {
  const currentLabel = CONDITION_LABELS.find(
    (l) => condition >= l.range[0] && condition <= l.range[1]
  );

  return (
    <div className="space-y-10 py-4">
      <div className="space-y-8">
        <div className="space-y-3">
          <span className="text-[13px] font-bold text-primary-600 uppercase tracking-wider px-2.5 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            Daily Check-in
          </span>
          <h2 className="text-[28px] font-black leading-tight tracking-tight text-surface-900 dark:text-white">
            오늘 컨디션은 어떠신가요?
          </h2>
          <p className="text-[15px] font-medium text-surface-500 leading-relaxed">
            팀원들과 지금의 상태를 공유해보세요.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <span className="text-[15px] font-bold text-surface-900 dark:text-white ml-1">컨디션 점수</span>
            <motion.span 
              key={condition}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "text-2xl font-black italic font-mono",
                currentLabel?.color
              )}
            >
              {condition} <span className="text-xs not-italic font-bold ml-1 opacity-60">/ 10</span>
            </motion.span>
          </div>

          <div className="px-1">
            <ConditionBar 
              value={condition} 
              onChange={setCondition} 
              isEditable 
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-[15px] font-bold text-surface-900 dark:text-white ml-1">
          오늘의 한 줄 평 (선택)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="오늘의 기분이나 공유하고 싶은 내용을 적어주세요."
          className={cn(
            "w-full h-32 p-4 text-[16px] font-medium rounded-2xl border-none transition-all resize-none placeholder:text-surface-300",
            note.trim() !== "" 
              ? "bg-primary-50/50 dark:bg-primary-900/10 ring-1 ring-primary-600/20" 
              : "bg-surface-50 dark:bg-surface-900 focus:bg-white dark:focus:bg-surface-800 focus:ring-2 focus:ring-primary-600"
          )}
        />
      </div>
    </div>
  );
}
