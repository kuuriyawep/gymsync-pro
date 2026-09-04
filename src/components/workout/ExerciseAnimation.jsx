import React from "react";
import { ACCENT } from "@/lib/workout/theme";

// Clean, minimal, animated demonstration figure (NOT a real human / not a GIF).
// A single tasteful looping motion; the variant changes by muscle category so
// the movement matches the exercise family. The UI is structured so a real
// per-exercise animation asset can be dropped in later (see `assetUrl`).
const variantFor = (category) => {
  if (category === "Back") return "pull";
  if (category === "Legs" || category === "Full Body" || category === "Core") return "squat";
  return "press"; // Chest, Shoulders, Arms
};

export default function ExerciseAnimation({ exercise, className }) {
  const variant = exercise ? variantFor(exercise.category) : "press";

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-neutral-900 ${className || ""}`}>
      <style>{`
        @keyframes waPress { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-30px)} }
        @keyframes waPull { 0%,100%{transform:translateY(-44px)} 50%{transform:translateY(0)} }
        @keyframes waSquat { 0%,100%{transform:translateY(0) scaleY(1)} 50%{transform:translateY(22px) scaleY(0.86)} }
        @keyframes waRing { 0%{stroke-dashoffset:188} 100%{stroke-dashoffset:0} }
        .wa-bar-press{animation:waPress 2.4s ease-in-out infinite}
        .wa-bar-pull{animation:waPull 2.4s ease-in-out infinite}
        .wa-squat{animation:waSquat 2.4s ease-in-out infinite; transform-box:fill-box; transform-origin:center bottom}
      `}</style>

      <svg viewBox="0 0 220 280" className="w-full h-full" aria-hidden="true">
        {/* faint progress ring */}
        <circle cx="110" cy="140" r="60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
        <circle cx="110" cy="140" r="60" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="188 377" style={{ animation: "waRing 2.4s ease-in-out infinite" }} transform="rotate(-90 110 140)" />

        {variant === "squat" ? (
          <g className="wa-squat">
            <Figure />
            <Barbell y={84} />
          </g>
        ) : (
          <>
            <g>
              <Figure />
              {/* arms reaching up to the bar */}
              <line x1="110" y1="78" x2="78" y2={variant === "press" ? 70 : 86} stroke="white" strokeWidth="9" strokeLinecap="round" />
              <line x1="110" y1="78" x2="142" y2={variant === "press" ? 70 : 86} stroke="white" strokeWidth="9" strokeLinecap="round" />
            </g>
            <g className={variant === "pull" ? "wa-bar-pull" : "wa-bar-press"} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
              <Barbell y={variant === "press" ? 64 : 78} />
            </g>
          </>
        )}
      </svg>

      <span className="absolute bottom-2 inset-x-0 text-center text-[10px] text-white/40 tracking-wide">DEMONSTRATION</span>
    </div>
  );
}

function Figure() {
  return (
    <g stroke="white" strokeWidth="13" strokeLinecap="round" fill="none">
      <circle cx="110" cy="44" r="18" fill="white" stroke="none" />
      <line x1="110" y1="64" x2="110" y2="158" />
      <line x1="110" y1="158" x2="96" y2="246" />
      <line x1="110" y1="158" x2="124" y2="246" />
    </g>
  );
}

function Barbell({ y }) {
  return (
    <g>
      <line x1="64" y1={y} x2="156" y2={y} stroke="white" strokeWidth="7" strokeLinecap="round" />
      <rect x="56" y={y - 12} width="10" height="24" rx="3" fill={ACCENT} />
      <rect x="154" y={y - 12} width="10" height="24" rx="3" fill={ACCENT} />
    </g>
  );
}