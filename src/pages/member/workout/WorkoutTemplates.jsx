import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MemberLayout from "@/components/MemberLayout";
import Modal from "@/components/ui/Modal";
import { workoutTemplates, focusToExercise } from "@/lib/workout/templates";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { applyTemplate } from "@/lib/workout/workoutStore";

export default function WorkoutTemplates() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);

  const use = (t) => {
    applyTemplate(t);
    setPreview(null);
    navigate("/member/workout/create");
  };

  return (
    <MemberLayout title="Templates" back="/member/workout">
      <div className="space-y-4">
        <p className="text-sm text-black/50">Start from a ready-made split, then edit anything.</p>
        <div className="grid grid-cols-2 gap-3">
          {workoutTemplates.map((t) => (
            <motion.button key={t.id} whileTap={{ scale: 0.98 }} onClick={() => setPreview(t)} className="text-left p-4 rounded-2xl bg-white border border-black/10 hover:border-black/30 flex flex-col gap-1">
              <span className="text-sm font-bold">{t.name}</span>
              <span className="text-xs text-black/50">{t.tagline}</span>
              <span className="text-[11px] text-black/30 mt-1">{t.days.length} day{t.days.length > 1 ? "s" : ""}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.name}
        footer={preview && (
          <>
            <button onClick={() => setPreview(null)} className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-black/5">Cancel</button>
            <button onClick={() => use(preview)} className="px-4 py-2 text-sm font-semibold rounded-lg bg-black text-white flex items-center gap-1"><Check className="w-4 h-4" /> Use template</button>
          </>
        )}
      >
        {preview && (
          <div className="space-y-3">
            <p className="text-sm text-black/50">{preview.tagline}</p>
            {preview.days.map((d, i) => (
              <div key={i} className="border border-black/10 rounded-xl p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-black/40 mb-1">{d.label}</p>
                <p className="text-sm leading-relaxed">{d.focuses.map((f) => (focusToExercise(f) ? focusToExercise(f).name : f)).join(" · ")}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </MemberLayout>
  );
}