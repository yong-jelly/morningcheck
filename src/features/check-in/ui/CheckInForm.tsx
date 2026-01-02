import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { DotMatrixNumber } from "@/shared/ui/DotMatrixNumber";
import { Sun, Cloud, CloudRain, CloudSnow, CloudFog, CloudDrizzle, CloudLightning } from "lucide-react";

interface CheckInFormProps {
  condition: number;
  setCondition: (v: number) => void;
  note: string;
  setNote: (v: string) => void;
  userName?: string;
}

export function CheckInForm({ condition, setCondition, note, setNote, userName }: CheckInFormProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragY = useMotionValue(0);
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);

  useEffect(() => {
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
  }, []);

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
        <DotMatrixNumber 
          value={condition} 
          color="white" 
          dotSize="lg" 
          className="scale-100 sm:scale-135 origin-center" 
        />
      </div>

      {/* Invisible Drag Layer */}
      <motion.div
        drag="y"
        dragConstraints={{ top: -DRAG_RANGE / 2, bottom: DRAG_RANGE / 2 }}
        dragElastic={0.1}
        style={{ y: dragY }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-20"
      />

      {/* Bottom UI Elements */}
      <div className="absolute bottom-40 left-10 right-10 flex flex-col gap-10 z-30">
        <motion.div 
          className="text-white/90 text-2xl font-medium tracking-tight border-b border-white/20 pb-4 text-center"
          whileTap={{ opacity: 0.6 }}
          onClick={() => {
            const newNote = prompt("오늘의 한 줄 평을 남겨주세요", note);
            if (newNote !== null) setNote(newNote);
          }}
        >
          {note || "메모를 남겨주세요"}
        </motion.div>
      </div>

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
    </div>
  );
}
