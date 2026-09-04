import React from "react";
import { Link, useNavigate } from "react-router-dom";
import MemberLayout from "@/components/MemberLayout";
import { motion } from "framer-motion";
import { Plus, LayoutTemplate, Play, Pencil } from "lucide-react";
import { useWorkoutPlan, todayIndex } from "@/lib/workout/workoutStore";
import { ACCENT } from "@/lib/workout/theme";

export default function WorkoutHome() {
  const plan = useWorkoutPlan();
  const navigate = useNavigate();
  const ti = todayIndex();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const todayDay = plan?.days?.[ti];
  const hasToday = todayDay && todayDay.exercises.length > 0;

  return (
    <MemberLayout title="Workout" back="/member">
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Workout</h1>
          <p className="text-sm text-black/50">Build your week or start from a template.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Choice icon={Plus} title="Create plan" sub="Build your own" onClick={() => navigate("/member/workout/create")} />
          <Choice icon={LayoutTemplate} title="Templates" sub="Ready-made splits" onClick={() => navigate("/member/workout/templates")} />
        </div>

        {plan ? (
          <>
            <div className="bg-white border border-black/10 rounded-2xl p-5">
              <span className="text-xs font-semibold uppercase tracking-wide text-black/40">Today · {today}</span>
              {hasToday ? (
                <>
                  <h3 className="text-lg font-bold mt-1">{todayDay.label}</h3>
                  <div className="mt-2 space-y-0.5">
                    {groupExercises(todayDay.exercises).map((g) => (
                      <p key={g.category} className="text-sm text-black/60">{g.category} · {g.count} exercises</p>
                    ))}
                  </div>
                  <button onClick={() => navigate(`/member/workout/session/${ti}`)} className="mt-4 w-full py-3 rounded-xl bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition">
                    <Play className="w-4 h-4" /> Start workout
                  </button>
                </>
              ) : (
                <p className="text-sm text-black/50 py-3">No workout scheduled today — enjoy your rest. <Link to="/member/workout/create" className="font-semibold text-black underline">Plan one</Link></p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">My plan</h3>
                <button onClick={() => navigate("/member/workout/create")} className="text-xs font-medium text-black/60 flex items-center gap-1"><Pencil className="w-3.5 h-3.5" /> Edit</button>
              </div>
              <div className="space-y-2">
                {plan.days.map((d, i) => {
                  const isToday = i === ti;
                  const rest = d.exercises.length === 0;
                  return (
                    <div key={d.day} className={`flex items-center gap-3 p-3 rounded-xl border ${isToday ? "border-black bg-black/[0.03]" : "border-black/10 bg-white"}`}>
                      <div className="w-12 shrink-0">
                        <p className="text-[11px] uppercase font-semibold text-black/40">{d.day.slice(0, 3)}</p>
                        {isToday && <span className="text-[10px] font-bold" style={{ color: ACCENT }}>Today</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{rest ? "Rest" : d.label}</p>
                        {!rest && <p className="text-xs text-black/50 truncate">{d.exercises.map((e) => e.name).join(" · ")}</p>}
                      </div>
                      <span className="text-xs text-black/40">{rest ? "" : `${d.exercises.length} ex`}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white border border-dashed border-black/15 rounded-2xl p-8 text-center">
            <p className="text-sm font-semibold">No workout plan yet</p>
            <p className="text-xs text-black/50 mt-1">Create your own plan or start from a template above.</p>
          </div>
        )}
      </div>
    </MemberLayout>
  );
}

function Choice({ icon: Icon, title, sub, onClick }) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onClick} className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-white border border-black/10 hover:border-black/30 text-left">
      <span className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center"><Icon className="w-5 h-5" /></span>
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs text-black/50">{sub}</span>
    </motion.button>
  );
}

function groupExercises(exs) {
  const m = {};
  exs.forEach((e) => { m[e.category] = (m[e.category] || 0) + 1; });
  return Object.entries(m).map(([category, count]) => ({ category, count }));
}