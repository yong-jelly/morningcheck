import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { DotMatrixNumber } from "@/shared/ui/DotMatrixNumber";

interface CheckInFormProps {
  condition: number;
  setCondition: (v: number) => void;
  note: string;
  setNote: (v: string) => void;
}

export function CheckInForm({ condition, setCondition, note, setNote }: CheckInFormProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragY = useMotionValue(0);
  
  // DRAG_RANGE defines how much movement is needed for 0-10
  const DRAG_RANGE = 500;
  
  const rawValue = useTransform(dragY, [DRAG_RANGE / 2, -DRAG_RANGE / 2], [0, 10]);
  const springValue = useSpring(rawValue, { damping: 25, stiffness: 120 });

  useEffect(() => {
    const unsubscribe = rawValue.on("change", (v) => {
      const rounded = Math.min(10, Math.max(0, Math.round(v)));
      if (rounded !== condition) {
        setCondition(rounded);
      }
    });
    return () => unsubscribe();
  }, [rawValue, condition, setCondition]);

  const bgColor = useTransform(
    springValue,
    [0, 3, 7, 10],
    ["#E15A5A", "#F19B4C", "#5BB782", "#2FB06B"]
  );

  const glowColor = useTransform(
    springValue,
    [0, 5, 10],
    ["rgba(255, 100, 100, 0.5)", "rgba(255, 200, 100, 0.4)", "rgba(100, 255, 150, 0.5)"]
  );

  return (
    <div className="relative w-full aspect-[4/5] sm:aspect-[9/16] max-h-[750px] overflow-hidden rounded-[40px] selection:bg-none select-none touch-none shadow-2xl">
      {/* Dynamic Background */}
      <motion.div 
        className="absolute inset-0"
        style={{ backgroundColor: bgColor }}
      />

      {/* Background Glow Effect */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[80%] rounded-full blur-[100px]"
        style={{ 
          backgroundColor: glowColor,
        }}
      />

      {/* Top UI Elements */}
      <div className="absolute top-10 left-10 right-10 flex justify-between items-start text-white/95">
        <div className="space-y-1">
          <div className="text-[15px] font-bold opacity-60 uppercase tracking-widest">
            Morning Check
          </div>
          <div className="text-3xl font-medium tracking-tight">
            2026년 1월 2일
          </div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-extralight tracking-tighter opacity-90">-7</div>
          <div className="mt-1 text-2xl">☀️</div>
        </div>
      </div>

      {/* Main Interaction Area (Fixed Display) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <div className="relative flex flex-col items-center gap-6">
          <DotMatrixNumber value={condition} color="white" />
         </div>
      </div>

      {/* Invisible Drag Layer */}
      <motion.div
        drag="y"
        dragConstraints={{ top: -DRAG_RANGE / 2, bottom: DRAG_RANGE / 2 }}
        dragElastic={0.05}
        style={{ y: dragY }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-20 opacity-0"
      />

      {/* Bottom UI Elements */}
      <div className="absolute bottom-12 left-10 right-10 flex flex-col gap-10">
        <motion.div 
          className="text-white/90 text-2xl font-medium tracking-tight border-b border-white/20 pb-4"
          whileTap={{ opacity: 0.6 }}
          onClick={() => {
            const newNote = prompt("오늘의 한 줄 평을 남겨주세요", note);
            if (newNote !== null) setNote(newNote);
          }}
        >
          {note || "메모를 남겨주세요"}
        </motion.div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-[18px] bg-white/10 backdrop-blur-2xl flex items-center justify-center text-white border border-white/20">
              <span className="text-[13px] font-black uppercase opacity-60">tue</span>
            </div>
            <div className="text-white">
              <div className="text-sm font-bold opacity-40 tracking-widest">25</div>
              <div className="text-xl font-bold tracking-tighter">10 : 00</div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 rounded-[24px] bg-white text-black flex items-center justify-center shadow-2xl"
            onClick={() => {
              const newNote = prompt("메모 추가", note);
              if (newNote !== null) setNote(newNote);
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Scroll Hint */}
      <AnimatePresence>
        {!isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-36 flex flex-col items-center gap-3 pointer-events-none opacity-40"
          >
             <div className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">slide</div>
             <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-1 h-1 bg-white rounded-full"
              />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
