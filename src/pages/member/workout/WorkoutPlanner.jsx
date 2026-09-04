import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MemberLayout from "@/components/MemberLayout";
import ExercisePicker from "@/components/workout/ExercisePicker";
import ExerciseDetailModal from "@/components/workout/ExerciseDetailModal";
import { Plus, X, Info, ArrowUp, ArrowDown, Check } from "lucide-react";
import { useWorkoutPlan, createEmptyPlan, setPlan, todayIndex } from "@/lib/workout/workoutStore";
import { getExercise } from "@/lib/workout/workoutUtils";
import { useToast } from "@/components/ui/use-toast";

export default function WorkoutPlanner() {
  const plan = useWorkoutPlan();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [draft, setDraft] = useState(plan || createEmptyPlan());
  const [pickerDay, setPickerDay] = useState(null);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const ti = todayIndex();

  useEffect(() => { if (plan) setDraft(plan); }, [plan]);

  const setDay = (i, updater) => setDraft((d) => ({ ...d, days: d.days.map((dd, idx) => (idx === i ? updater(dd) : dd)) }));

  const onConfirm = (selected) => {
    setDay(pickerDay, (dd) => ({ ...dd, exercises: selected, label: selected.length ? "Workout" : "Rest" }));
    setPickerDay(null);
  };
  const removeEx = (dayIdx, exIdx) => setDay(dayIdx, (dd) => {
    const exs = dd.exercises.filter((_, i) => i !== exIdx);
    return { ...dd, exercises: exs, label: exs.length ? dd.label : "Rest" };
  });
  const moveEx = (dayIdx, exIdx, dir) => setDay(dayIdx, (dd) => {
    const arr = [...dd.exercises];
    const j = exIdx + dir;
    if (j < 0 || j >= arr.length) return dd;
    [arr[exIdx], arr[j]] = [arr[j], arr[exIdx]];
    return { ...dd, exercises: arr };
  });

  const save = () => {
    setSaving(true);
    setTimeout(() => {
      setPlan(draft);
      setSaving(false);
      toast({ title: "Workout plan saved" });
      navigate("/member/workout");
    }, 600);
  };

  return (
    <MemberLayout title="Plan" back="/member/workout">
      <div className="space-y-5">
        <div className="bg-white border border-black/10 rounded-2xl p-4">
          <label className="text-xs text-black/50">Plan name</label>
          <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className="mt-1 w-full text-lg font-bold bg-transparent outline-none border-b border-transparent focus:border-black" />
        </div>

        <div className="space-y-3">
          {draft.days.map((d, i) => {
            const isToday = i === ti;
            return (
              <div key={d.day} className={`bg-white rounded-2xl border p-4 ${isToday ? "border-black" : "border-black/10"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[11px] uppercase font-semibold text-black/40">{d.day}{isToday && " · Today"}</p>
                    <p className="text-sm font-bold">{d.exercises.length ? d.label : "Rest"}</p>
                  </div>
                  <button onClick={() => setPickerDay(i)} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> {d.exercises.length ? "Edit" : "Add"}</button>
                </div>
                {d.exercises.length === 0 ? (
                  <button onClick={() => setPickerDay(i)} className="w-full py-6 rounded-xl border border-dashed border-black/15 text-sm text-black/40 hover:bg-black/[0.02] flex items-center justify-center gap-1"><Plus className="w-4 h-4" /> Add exercise</button>
                ) : (
                  <ul className="space-y-1.5">
                    {d.exercises.map((ex, ei) => (
                      <li key={ex.exerciseId + ei} className="flex items-center gap-1.5 p-2 rounded-lg bg-black/[0.02]">
                        <span className="text-xs text-black/30 w-4 text-center">{ei + 1}</span>
                        <span className="flex-1 min-w-0 text-sm font-medium truncate">{ex.name}</span>
                        <button onClick={() => moveEx(i, ei, -1)} disabled={ei === 0} className="p-1 text-black/40 hover:text-black disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => moveEx(i, ei, 1)} disabled={ei === d.exercises.length - 1} className="p-1 text-black/40 hover:text-black disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDetail(getExercise(ex.exerciseId))} className="p-1 text-black/40 hover:text-black"><Info className="w-3.5 h-3.5" /></button>
                        <button onClick={() => removeEx(i, ei)} className="p-1 text-black/40 hover:text-black"><X className="w-3.5 h-3.5" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={save} disabled={saving} className="w-full py-3.5 rounded-xl bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
          {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save plan</>}
        </button>
      </div>

      <ExercisePicker open={pickerDay !== null} onClose={() => setPickerDay(null)} onConfirm={onConfirm} initialSelected={pickerDay !== null ? draft.days[pickerDay].exercises : []} onShowDetail={setDetail} />
      <ExerciseDetailModal open={!!detail} onClose={() => setDetail(null)} exercise={detail} />
    </MemberLayout>
  );
}