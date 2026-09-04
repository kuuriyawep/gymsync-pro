import exercises from "./exerciseLibrary.json";

const byId = {};
exercises.forEach((e) => {
  byId[e.id] = e;
});

export function getExercise(id) {
  return byId[id];
}

export function exerciseName(id) {
  return byId[id]?.name || "Exercise";
}

export const ALL_EXERCISES = exercises;

// Muscle-group filters derived from the library's Category column.
export const MUSCLE_GROUPS = ["All", "Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Full Body"];

// Local date key (timezone-safe) -> "YYYY-MM-DD"
export function localDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function sessionVolume(session) {
  return session.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).reduce((a, s) => a + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0),
    0
  );
}

export function sessionSets(session) {
  return session.exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.completed).length, 0);
}

export function sessionExerciseCount(session) {
  return session.exercises.filter((ex) => ex.sets.some((s) => s.completed)).length;
}

// Streak counts consecutive days (ending today or yesterday) that have at least
// one COMPLETED workout session. Opening the app does NOT extend it.
export function computeStreak(sessions) {
  const completed = sessions.filter((s) => s.completedAt);
  if (!completed.length) return 0;
  const days = new Set(completed.map((s) => s.date));
  let streak = 0;
  const d = new Date();
  if (!days.has(localDateStr(d))) d.setDate(d.getDate() - 1); // allow yesterday as the latest
  while (days.has(localDateStr(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// Last completed performance for an exercise (for "Previous: 20kg × 8").
export function previousPerformance(sessions, exerciseId) {
  for (const s of sessions) {
    if (!s.completedAt) continue;
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (ex) {
      const done = ex.sets.filter((x) => x.completed);
      if (done.length) {
        const top = done.reduce((best, x) => ((Number(x.weight) || 0) * (Number(x.reps) || 0) >= (Number(best.weight) || 0) * (Number(best.reps) || 0) ? x : best), done[0]);
        return { weight: Number(top.weight) || 0, reps: Number(top.reps) || 0 };
      }
    }
  }
  return null;
}

// Short, generic form guidance per category (library movement field is
// "Exercise-specific", so we keep safe, professional cues).
export const formGuidance = {
  Chest: "Retract your shoulder blades, lower the weight under control to chest level, then press up without locking out hard.",
  Back: "Initiate the pull with your back, keep your spine neutral, and avoid using momentum to move the weight.",
  Shoulders: "Brace your core, avoid excessive lower-back arch, and control the path overhead.",
  Arms: "Keep your elbows fixed to your sides, move only at the elbow joint, and avoid swinging.",
  Legs: "Track your knees over your toes, descend under control, and drive through your whole foot.",
  Core: "Tense your abs, keep a neutral spine, and breathe steadily throughout the hold or rep.",
  "Full Body": "Move with intent, coordinate your hips and shoulders, and maintain a braced core throughout.",
};

export function guidanceFor(category) {
  return formGuidance[category] || "Maintain control through a full range of motion and brace your core.";
}