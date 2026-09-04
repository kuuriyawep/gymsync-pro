import exercises from "./exerciseLibrary.json";

// Template "focus" labels (from the spec file) mapped to a representative
// exercise name that exists in the attached Exercise Library. This lets a
// template become a concrete starting plan the member can edit.
const focusToExerciseName = {
  Squat: "Back Squat",
  "Horizontal Push": "Barbell Bench Press",
  "Vertical Pull": "Lat Pulldown",
  Shoulders: "Overhead Press",
  Arms: "Dumbbell Biceps Curl",
  Core: "Plank",
  "Hip Hinge": "Romanian Deadlift",
  "Incline Push": "Incline Barbell Bench Press",
  "Horizontal Pull": "Barbell Row",
  Legs: "Leg Press",
  "Leg Press": "Leg Press",
  "Chest Press": "Machine Chest Press",
  "Lat Pulldown": "Lat Pulldown",
  "Lateral Raise": "Dumbbell Lateral Raise",
  Chest: "Barbell Bench Press",
  Back: "Barbell Row",
  Biceps: "Dumbbell Biceps Curl",
  Triceps: "Rope Triceps Pushdown",
  "Incline Chest": "Incline Dumbbell Press",
  Row: "Seated Cable Row",
  Delts: "Dumbbell Lateral Raise",
  "Front Squat": "Front Squat",
  "Hip Thrust": "Hip Thrust",
  "Split Squat": "Bulgarian Split Squat",
  "Leg Extension": "Leg Extension",
  "Leg Curl": "Leg Curl",
  Calves: "Standing Calf Raise",
  Quads: "Leg Extension",
  Hamstrings: "Leg Curl",
  Glutes: "Hip Thrust",
  "Rear Delts": "Rear Delt Fly",
};

// Source: "Templates" sheet of Olympic_Gym_Exercise_Library_and_Workout_Spec.xlsx
// + spec section 16. Six categories only — intentionally limited.
export const workoutTemplates = [
  {
    id: "full-body",
    name: "Full Body",
    tagline: "Balanced full-body training",
    days: [
      { label: "Day 1", focuses: ["Squat", "Horizontal Push", "Vertical Pull", "Shoulders", "Arms", "Core"] },
      { label: "Day 2", focuses: ["Hip Hinge", "Incline Push", "Horizontal Pull", "Legs", "Arms", "Core"] },
      { label: "Day 3", focuses: ["Leg Press", "Chest Press", "Lat Pulldown", "Lateral Raise", "Arms", "Core"] },
    ],
  },
  {
    id: "upper-body",
    name: "Upper Body",
    tagline: "Chest, back, shoulders and arms",
    days: [
      { label: "Day 1", focuses: ["Chest", "Back", "Shoulders", "Biceps", "Triceps"] },
      { label: "Day 2", focuses: ["Incline Chest", "Vertical Pull", "Row", "Delts", "Biceps", "Triceps"] },
    ],
  },
  {
    id: "lower-body",
    name: "Lower Body",
    tagline: "Legs, glutes and core",
    days: [
      { label: "Day 1", focuses: ["Squat", "Hip Hinge", "Leg Press", "Leg Curl", "Calves", "Core"] },
      { label: "Day 2", focuses: ["Front Squat", "Hip Thrust", "Split Squat", "Leg Extension", "Calves", "Core"] },
    ],
  },
  {
    id: "push-pull-legs",
    name: "Push / Pull / Legs",
    tagline: "Classic structured split",
    days: [
      { label: "Push", focuses: ["Chest", "Shoulders", "Triceps"] },
      { label: "Pull", focuses: ["Back", "Rear Delts", "Biceps"] },
      { label: "Legs", focuses: ["Quads", "Hamstrings", "Glutes", "Calves", "Core"] },
      { label: "Push", focuses: ["Chest", "Shoulders", "Triceps"] },
      { label: "Pull", focuses: ["Back", "Rear Delts", "Biceps"] },
    ],
  },
  {
    id: "push",
    name: "Push",
    tagline: "Chest, shoulders and triceps",
    days: [{ label: "Push Day", focuses: ["Chest", "Shoulders", "Triceps"] }],
  },
  {
    id: "pull",
    name: "Pull",
    tagline: "Back, rear delts and biceps",
    days: [{ label: "Pull Day", focuses: ["Back", "Rear Delts", "Biceps"] }],
  },
];

const byName = {};
exercises.forEach((e) => {
  byName[e.name] = e;
});

export function focusToExercise(focus) {
  const name = focusToExerciseName[focus];
  return name ? byName[name] : null;
}

export function getTemplate(id) {
  return workoutTemplates.find((t) => t.id === id) || null;
}

// Resolve a template onto a Mon–Sun week. Extra days become Rest.
export function templateToDays(template) {
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return dayNames.map((d, i) => {
    const td = template.days[i];
    if (!td) return { day: d, label: "Rest", exercises: [] };
    const exos = td.focuses
      .map((f) => focusToExercise(f))
      .filter(Boolean)
      .map((e) => ({ exerciseId: e.id, name: e.name, category: e.category }));
    return { day: d, label: td.label, exercises: exos };
  });
}