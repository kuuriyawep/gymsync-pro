import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, SkipForward, RotateCcw } from "lucide-react";
import { ACCENT } from "@/lib/workout/theme";

// Default 90-second rest. Auto-starts when mounted; counts down; subtle feedback.
export default function RestTimer({ seconds = 90, onComplete, onSkip }) {
  const [remaining, setRemaining] = useState(seconds);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || remaining <= 0) return;
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, paused]);

  useEffect(() => {
    if (remaining <= 0 && !paused) onComplete?.();
  }, [remaining, paused, onComplete]);

  const mm = Math.floor(Math.max(0, remaining) / 60);
  const ss = String(Math.max(0, remaining) % 60).padStart(2, "0");
  const pct = Math.max(0, Math.min(1, remaining / seconds));
  const R = 26;
  const C = 2 * Math.PI * R;

  return (
    <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} className="mx-auto bg-white border border-black/10 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
      <div className="relative w-14 h-14 shrink-0">
        <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
          <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="5" />
          <circle cx="32" cy="32" r={R} fill="none" stroke={ACCENT} strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">{remaining <= 0 ? "Done" : "REST"}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-black/50">Rest timer</p>
        <p className="text-2xl font-bold tabular-nums tracking-tight">
          {mm}:{ss}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={() => setPaused((p) => !p)} className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-90 transition">
          {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
        <button onClick={() => setRemaining(seconds)} className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-90 transition" aria-label="Reset">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button onClick={onSkip} className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center active:scale-90 transition" aria-label="Skip">
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}