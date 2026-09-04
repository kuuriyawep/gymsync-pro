import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Check, X, ChevronRight, Info } from "lucide-react";
import { ALL_EXERCISES, MUSCLE_GROUPS } from "@/lib/workout/workoutUtils";

// Full-screen multi-select exercise picker: search + muscle-group filter +
// browse + multi-select + review-before-save. No repeated open/close needed.
export default function ExercisePicker({ open, onClose, onConfirm, initialSelected = [], onShowDetail }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const [selected, setSelected] = useState([]); // array of {exerciseId,name,category}

  useEffect(() => {
    if (open) setSelected(initialSelected);
  }, [open, initialSelected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_EXERCISES.filter((e) => {
      if (group !== "All" && e.category !== group) return false;
      if (q && !e.name.toLowerCase().includes(q) && !e.category.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, group]);

  const toggle = (ex) => {
    setSelected((cur) => {
      if (cur.some((c) => c.exerciseId === ex.id)) return cur.filter((c) => c.exerciseId !== ex.id);
      return [...cur, { exerciseId: ex.id, name: ex.name, category: ex.category }];
    });
  };

  const isSelected = (id) => selected.some((c) => c.exerciseId === id);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
            {/* header */}
            <div className="sticky top-0 z-10 bg-white border-b border-black/10">
              <div className="flex items-center gap-3 px-4 h-14">
                <button onClick={onClose} className="p-2 -ml-2 rounded-lg hover:bg-black/5"><X className="w-5 h-5" /></button>
                <h3 className="font-semibold flex-1">Add exercises</h3>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-black text-white">{selected.length} selected</span>
              </div>
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5">
                  <Search className="w-4 h-4 text-black/40" />
                  <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search exercises..." className="bg-transparent outline-none text-sm flex-1 placeholder:text-black/40" />
                  {query && <button onClick={() => setQuery("")} className="text-black/40 hover:text-black"><X className="w-4 h-4" /></button>}
                </div>
                <div className="flex gap-2 mt-3 overflow-x-auto -mx-4 px-4 pb-1 no-scrollbar">
                  {MUSCLE_GROUPS.map((g) => (
                    <button key={g} onClick={() => setGroup(g)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${group === g ? "bg-black text-white" : "bg-black/5 text-black/60 hover:bg-black/10"}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* list */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {filtered.length === 0 ? (
                <div className="py-16 text-center text-sm text-black/40">No exercises found</div>
              ) : (
                <ul className="space-y-2">
                  {filtered.map((ex) => {
                    const sel = isSelected(ex.id);
                    return (
                      <li key={ex.id}>
                        <button onClick={() => toggle(ex)} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${sel ? "border-black bg-black/[0.03]" : "border-black/10 hover:bg-black/[0.02]"}`}>
                          <span className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${sel ? "bg-black border-black" : "border-black/20"}`}>{sel && <Check className="w-4 h-4 text-white" strokeWidth={3} />}</span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-semibold truncate">{ex.name}</span>
                            <span className="block text-xs text-black/50">{ex.category} · {ex.difficulty}</span>
                          </span>
                          <span onClick={(e) => { e.stopPropagation(); onShowDetail?.(ex); }} className="p-1.5 rounded-lg text-black/40 hover:bg-black/5 hover:text-black"><Info className="w-4 h-4" /></span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* footer */}
            <div className="sticky bottom-0 bg-white border-t border-black/10 p-3" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
              <button disabled={selected.length === 0} onClick={() => onConfirm(selected)} className="w-full py-3 rounded-xl bg-black text-white text-sm font-semibold disabled:opacity-40 active:scale-[0.99] transition flex items-center justify-center gap-2">
                Add {selected.length > 0 && `(${selected.length})`} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}