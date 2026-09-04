import React, { useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MemberLayout from "@/components/MemberLayout";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Clock, Dumbbell, Layers, TrendingUp, Flame } from "lucide-react";
import { useWorkoutSessions } from "@/lib/workout/workoutStore";
import { sessionVolume, sessionSets, sessionExerciseCount, computeStreak, formatDuration } from "@/lib/workout/workoutUtils";
import { ACCENT } from "@/lib/workout/theme";

export default function WorkoutComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessions = useWorkoutSessions();
  const id = location.state?.sessionId;
  const session = sessions.find((s) => s.id === id) || sessions[0];
  const streak = useMemo(() => computeStreak(sessions), [sessions]);

  useEffect(() => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.4 }, colors: ["#10b981", "#000000", "#ffffff"] });
  }, []);

  if (!session) {
    return <MemberLayout title="Done" back="/member/workout"><p className="text-sm text-black/50">No session found.</p></MemberLayout>;
  }

  const vol = sessionVolume(session);
  const sets = sessionSets(session);
  const exs = sessionExerciseCount(session);

  return (
    <MemberLayout title="Complete" back="/member/workout">
      <div className="flex flex-col items-center text-center py-6 space-y-6">
        <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 14 }} className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.2 }} d="M5 13l4 4L19 7" /></svg>
        </motion.div>

        <div>
          <h1 className="text-2xl font-heading font-bold">Workout complete</h1>
          <p className="text-sm text-black/50">{session.planName}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <Stat icon={Clock} label="Duration" value={formatDuration(session.durationSec)} />
          <Stat icon={Dumbbell} label="Exercises" value={exs} />
          <Stat icon={Layers} label="Sets" value={sets} />
          <Stat icon={TrendingUp} label="Volume" value={`${vol.toLocaleString()} kg`} />
        </div>

        <div className="w-full bg-white border border-black/10 rounded-2xl p-5 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.12)" }}><Flame className="w-6 h-6" style={{ color: ACCENT }} /></div>
          <div className="flex-1 text-left"><p className="text-sm font-semibold">Consistency</p><p className="text-xs text-black/50">{streak} day streak</p></div>
          <span className="text-2xl font-bold" style={{ color: ACCENT }}>{streak}</span>
        </div>

        <div className="w-full space-y-2">
          <button onClick={() => navigate("/member/profile")} className="w-full py-3.5 rounded-xl bg-black text-white text-sm font-semibold">View progress</button>
          <button onClick={() => navigate("/member/workout")} className="w-full py-3.5 rounded-xl border border-black/15 text-sm font-semibold">Back to workout</button>
        </div>
      </div>
    </MemberLayout>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-black/10 rounded-2xl p-4 text-left">
      <Icon className="w-4 h-4 text-black/40" />
      <p className="text-2xl font-bold mt-2 tabular-nums">{value}</p>
      <p className="text-xs text-black/50">{label}</p>
    </div>
  );
}