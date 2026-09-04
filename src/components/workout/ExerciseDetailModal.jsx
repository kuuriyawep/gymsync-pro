import React from "react";
import Modal from "@/components/ui/Modal";
import ExerciseAnimation from "@/components/workout/ExerciseAnimation";
import { guidanceFor } from "@/lib/workout/workoutUtils";

const diffTone = { Beginner: "bg-black/5 text-black/70", Intermediate: "bg-black text-white", Advanced: "border border-black text-black" };

export default function ExerciseDetailModal({ open, onClose, exercise }) {
  if (!exercise) return null;
  return (
    <Modal open={open} onClose={onClose} title={exercise.name}>
      <div className="space-y-4">
        <ExerciseAnimation exercise={exercise} className="aspect-[4/3] w-full" />

        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black text-white">{exercise.category}</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${diffTone[exercise.difficulty] || "bg-black/5"}`}>{exercise.difficulty}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Info label="Primary muscle" value={exercise.primaryMuscle} />
          <Info label="Secondary" value={exercise.secondaryMuscles} />
          <Info label="Equipment" value={exercise.equipment} full />
        </div>

        <div className="bg-black/[0.03] rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-black/40 mb-1">Form guidance</p>
          <p className="text-sm leading-relaxed">{guidanceFor(exercise.category)}</p>
        </div>
      </div>
    </Modal>
  );
}

function Info({ label, value, full }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <p className="text-xs text-black/40">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}