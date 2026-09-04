import React, { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MemberLayout from "@/components/MemberLayout";
import ExerciseDetailModal from "@/components/workout/ExerciseDetailModal";
import RestTimer from "@/components/workout/RestTimer";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Flag, Info } from "lucide-react";
import { useWorkoutPlan, useWorkoutSessions, addSession } from "@/lib/workout/workoutStore";
import { getExercise, previousPerformance, localDateStr } from "@/lib/workout/workoutUtils";

const newSet = (prev) => ({ weight: prev?.weight ?? 0, reps: prev?.reps ?? 8, completed: false });

export default function WorkoutSession() {
  const { dayIndex } = useParams();
  const plan = useWorkoutPlan();
  const sessions = useWorkoutSessions();
  const navigate = useNavigate();
  const startRef = useRef(Date.now());
  const di = Number(dayIndex);
  const day = plan?.days?.[di];

  const [items, setItems] = useState(() => {
    if (!day || day.exercises.length === 0) return [];
    return day.exercises.map((ex) => {
      const prev = previousPerformance(sessions, ex.exerciseId);
      return { exerciseId: ex.exerciseId, name: ex.name, category: ex.category, sets: [newSet(prev)] };
    });
  });
  const [detail, setDetail] = useState(null);
  const [restKey, setRestKey] = useState(0);
  const [restActive, setRestActive] = useState(false);

  if (!day || day.exercises.length === 0) {
    return (
      <MemberLayout title="Workout" back="/member/workout">
        <div className="bg-white border border-dashed border-black/15 rounded-2xl p-8 text-center">
          <p className="text-sm font-semibold">No exercises for this day</p>
          <button onClick={() => navigate("/member/workout/create")} className="mt-3 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white">Plan workout</button>
        </div>
      </MemberLayout>
    );
  }

  const updateSet = (ei, si, patch) => setItems((arr) => arr.map((ex, i) => (i === ei ? { ...ex, sets: ex.sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) } : ex)));
  const addSet = (ei) => setItems((arr) => arr.map((ex, i) => (i === ei ? { ...ex, sets: [...ex.sets, newSet(previousPerformance(sessions, ex.exerciseId))] } : ex)));
  const completeSet = (ei, si) => {
    setItems((arr) => arr.map((ex, i) => (i === ei ? { ...ex, sets: ex.sets.map((s, j) => (j === si ? { ...s, completed: true } : s)) } : ex)));
    setRestActive(true);
    setRestKey((k) => k + 1);
  };

  const finish = () => {
    const session = {
      id: `s-${Date.now()}`,
      date: localDateStr(),
      planName: day.label,
      durationSec: Math.round((Date.now() - startRef.current) / 1000),
      completedAt: Date.now(),
      exercises: items.map((ex) => ({ exerciseId: ex.exerciseId, name: ex.name, category: ex.category, sets: ex.sets })),
    };
    addSession(session);
    navigate("/member/workout/complete", { state: { sessionId: session.id } });
  };

  return (
    <MemberLayout title={day.label} back="/member/workout">
      <div className="space-y-4 pb-36">
        {items.map((ex, ei) => {
          const full = getExercise(ex.exerciseId);
          const prev = previousPerformance(sessions, ex.exerciseId);
          return (
            <div key={ex.exerciseId} className="bg-white border border-black/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{ex.name}</p>
                  <p className="text-xs text-black/50">{ex.category}{prev && ` · Previous ${prev.weight}kg × ${prev.reps}`}</p>
                </div>
                <button onClick={() => setDetail(full)} className="p-1.5 rounded-lg text-black/40 hover:bg-black/5 shrink-0"><Info className="w-4 h-4" /></button>
              </div>
              <div className="space-y-1.5">
                {ex.sets.map((s, si) => (
                  <div key={si} className={`flex items-center gap-2 p-2 rounded-lg ${s.completed ? "bg-black/[0.04]" : "bg-black/[0.02]"}`}>
                    <span className="text-xs text-black/40 w-5 text-center">{si + 1}</span>
                    <NumInput value={s.weight} onChange={(v) => updateSet(ei, si, { weight: v })} suffix="kg" />
                    <span className="text-black/30 text-sm">×</span>
                    <NumInput value={s.reps} onChange={(v) => updateSet(ei, si, { reps: v })} suffix="reps" />
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => completeSet(ei, si)} className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition ${s.completed ? "bg-black text-white" : "border border-black/20 text-black/40 hover:border-black"}`}><Check className="w-4 h-4" strokeWidth={3} /></motion.button>
                  </div>
                ))}
                <button onClick={() => addSet(ei)} className="w-full py-2 rounded-lg text-xs font-medium text-black/50 hover:bg-black/[0.02] flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5" /> Add set</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed left-0 right-0 bottom-16 z-30 px-4 pointer-events-none" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="max-w-2xl mx-auto space-y-2 pointer-events-auto">
          <AnimatePresence>
            {restActive && <RestTimer key={restKey} onComplete={() => setRestActive(false)} onSkip={() => setRestActive(false)} />}
          </AnimatePresence>
          <button onClick={finish} className="w-full py-3.5 rounded-xl bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg"><Flag className="w-4 h-4" /> Finish workout</button>
        </div>
      </div>

      <ExerciseDetailModal open={!!detail} onClose={() => setDetail(null)} exercise={detail} />
    </MemberLayout>
  );
}

function NumInput({ value, onChange, suffix }) {
  return (
    <label className="flex-1 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white border border-black/10">
      <input type="number" inputMode="decimal" value={value || ""} placeholder="0" onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} className="w-full bg-transparent outline-none text-sm font-semibold tabular-nums" />
      <span className="text-[10px] text-black/40 shrink-0">{suffix}</span>
    </label>
  );
}