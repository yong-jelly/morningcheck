import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { DotMatrixNumber } from "@/shared/ui/DotMatrixNumber";
import { Sun, Cloud, CloudRain, CloudSnow, CloudFog, CloudDrizzle, CloudLightning, Home, Check, PenLine, X } from "lucide-react";
import { useAppStore } from "@/shared/lib/store";

interface CheckInFormProps {
  condition: number;
  setCondition: (v: number) => void;
  note: string;
  setNote: (v: string) => void;
  userName?: string;
  onSubmit?: () => void;
  onHome?: () => void;
  isSubmitting?: boolean;
  isLoading?: boolean;
}

export function CheckInForm({ 
  condition, 
  setCondition, 
  note, 
  setNote, 
  userName,
  onSubmit,
  onHome,
  isSubmitting,
  isLoading
}: CheckInFormProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isMemoOpen, setIsMemoOpen] = useState(false);
  const [tempNote, setTempNote] = useState(note);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mounted, setMounted] = useState(false);
  const dragY = useMotionValue(0);

  const weather = useAppStore((state) => state.weather);
  const setWeather = useAppStore((state) => state.setWeather);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMemoOpen) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 300); // 슬라이드 애니메이션이 어느 정도 진행된 후 포커스
      return () => clearTimeout(timer);
    }
  }, [isMemoOpen]);

  useEffect(() => {
    // 날씨 정보가 이미 전역 스토어에 있다면 다시 호출하지 않음
    if (weather) return;

    async function fetchWeather() {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current=temperature_2m,weather_code"
        );
        const data = await res.json();
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code,
        });
      } catch (error) {
        console.error("Failed to fetch weather:", error);
      }
    }
    fetchWeather();
  }, [weather, setWeather]);

  const getWeatherIcon = (code: number) => {
    const props = { className: "w-20 h-20 stroke-[1]" };
    if (code === 0) return <Sun {...props} />;
    if (code >= 1 && code <= 3) return <Cloud {...props} />;
    if (code === 45 || code === 48) return <CloudFog {...props} />;
    if (code >= 51 && code <= 57) return <CloudDrizzle {...props} />;
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain {...props} />;
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return <CloudSnow {...props} />;
    if (code >= 95) return <CloudLightning {...props} />;
    return <Sun {...props} />;
  };
  
  // DRAG_RANGE defines how much movement is needed for 0-10
  const DRAG_RANGE = 600;
  
  const rawValue = useTransform(dragY, [DRAG_RANGE / 2, -DRAG_RANGE / 2], [0, 10]);
  const springValue = useSpring(rawValue, { damping: 25, stiffness: 120 });

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const date = today.getDate();

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

  // Main Interaction Area (Fixed Display)
  return (
    <div className="relative w-full h-full overflow-hidden selection:bg-none select-none touch-none">
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
      <div className="absolute top-8 left-8 right-8 flex flex-col gap-4 text-white/95 z-30 pointer-events-none">
        <div className="text-[30px] font-extralight tracking-tight opacity-90">
          {userName ? `${userName}님의 모닝쳌!!` : "오늘의 모닝쳌!!"}
        </div>
        
        <div className="flex justify-between items-end">
          <div className="flex flex-col -space-y-1">
            <div className="text-[55px] font-extralight tracking-tighter">
              {year}년
            </div>
            <div className="text-[55px] font-extralight tracking-tighter">
              {month}월 {date}일
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            {weather ? (
              <>
                {getWeatherIcon(weather.code)}
                <div className="text-[48px] font-extralight tracking-tighter opacity-90">
                  {weather.temp}°
                </div>
              </>
            ) : (
              <>
                <Sun className="w-20 h-20 stroke-[1] animate-pulse" />
                <div className="text-[48px] font-extralight tracking-tighter opacity-40">
                  --
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Interaction Area (Fixed Display) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="w-4 h-4 sm:w-6 sm:h-6 bg-white/20 rounded-[2px]" />
              ))}
            </div>
          </div>
        ) : (
          <DotMatrixNumber 
            value={condition} 
            color="white" 
            dotSize="lg" 
            className="scale-100 sm:scale-135 origin-center" 
          />
        )}
      </div>

      {/* Invisible Drag Layer */}
      {!isLoading && (
        <motion.div
          drag="y"
          dragConstraints={{ top: -DRAG_RANGE / 2, bottom: DRAG_RANGE / 2 }}
          dragElastic={0.1}
          style={{ y: dragY }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          className="absolute inset-0 cursor-grab active:cursor-grabbing z-20"
        />
      )}

      {/* Bottom UI Elements */}
      <div className="absolute bottom-40 left-10 right-10 flex flex-col gap-10 z-30">
        {isLoading ? (
          <div className="h-12 w-full bg-white/10 rounded-2xl animate-pulse flex items-center justify-center">
            <div className="h-4 w-32 bg-white/20 rounded-full" />
          </div>
        ) : (
          <motion.div 
            className="flex items-center justify-center gap-2 text-white/90 text-2xl font-medium tracking-tight border-b border-white/20 pb-4 text-center cursor-pointer"
            whileTap={{ opacity: 0.6 }}
            onClick={() => {
              setTempNote(note);
              setIsMemoOpen(true);
            }}
          >
            <PenLine className="w-5 h-5 opacity-60" />
            <span className="truncate">
              {note || "메모를 남겨주세요"}
            </span>
          </motion.div>
        )}
      </div>

      {/* Memo Input Overlay */}
      {mounted && !isLoading && createPortal(
        <AnimatePresence>
          {isMemoOpen && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMemoOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-[500px] bg-surface-900 rounded-t-[32px] p-8 flex flex-col gap-6 shadow-2xl z-10"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">메모</h3>
                  <button 
                    onClick={() => setIsMemoOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value)}
                  placeholder="오늘의 기분이나 생각을 남겨보세요"
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 resize-none text-lg"
                />

                <button
                  onClick={() => {
                    setNote(tempNote);
                    setIsMemoOpen(false);
                  }}
                  className="w-full h-14 bg-white text-black rounded-2xl font-bold text-lg active:scale-95 transition-transform"
                >
                  확인
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Scroll Hint */}
      <AnimatePresence>
        {!isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-48 flex flex-col items-center gap-3 pointer-events-none opacity-40 z-30"
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

      {/* Action Buttons */}
      {(onSubmit || onHome) && (
        <div className="absolute bottom-10 left-8 right-8 flex items-center gap-3 z-40">
          {/* Check-in Button (Left, Fill Width) */}
          {onSubmit && (
            <motion.button
              whileHover={isLoading ? {} : { scale: 1.02 }}
              whileTap={isLoading ? {} : { scale: 0.98 }}
              onClick={onSubmit}
              disabled={isSubmitting || isLoading}
              className="flex-1 h-14 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white font-bold disabled:opacity-30 transition-all"
            >
              <Check className="w-5 h-5 mr-2" />
              오늘의 컨디션 기록하기
            </motion.button>
          )}

          {/* Home Button (Right, Fixed Width) */}
          {onHome && (
            <motion.button
              whileHover={isLoading ? {} : { scale: 1.05 }}
              whileTap={isLoading ? {} : { scale: 0.95 }}
              onClick={onHome}
              disabled={isLoading}
              className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white transition-all shrink-0 disabled:opacity-30"
            >
              <Home className="w-6 h-6" />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}
