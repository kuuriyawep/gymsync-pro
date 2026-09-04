import { useSyncExternalStore } from "react";
import { templateToDays } from "./templates";
import { localDateStr } from "./workoutUtils";

const PLAN_KEY = "gymsync_workout_plan";
const SESSION_KEY = "gymsync_workout_sessions";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const listeners = new Set();
let planState;
let sessionState;

function readPlan() {
  if (planState !== undefined) return planState;
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    planState = raw ? JSON.parse(raw) : null;
  } catch {
    planState = null;
  }
  return planState;
}
function readSessions() {
  if (sessionState !== undefined) return sessionState;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      sessionState = JSON.parse(raw);
    } else {
      sessionState = seedSessions();
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionState));
    }
  } catch {
    sessionState = seedSessions();
  }
  return sessionState;
}
function emit() {
  listeners.forEach((l) => l());
}
function persistPlan() {
  localStorage.setItem(PLAN_KEY, JSON.stringify(planState));
  emit();
}
function persistSessions() {
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionState));
  emit();
}

export function getPlan() {
  return readPlan();
}
export function getSessions() {
  return readSessions();
}
export function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useWorkoutPlan() {
  return useSyncExternalStore(subscribe, getPlan, getPlan);
}
export function useWorkoutSessions() {
  return useSyncExternalStore(subscribe, getSessions, getSessions);
}

export function createEmptyPlan(name = "My Workout Plan") {
  return {
    name,
    days: DAY_NAMES.map((d) => ({ day: d, label: "Rest", exercises: [] })),
    createdAt: Date.now(),
  };
}

export function setPlan(plan) {
  planState = plan;
  persistPlan();
}
export function updatePlan(updater) {
  planState = updater(readPlan());
  persistPlan();
}
export function clearPlan() {
  planState = null;
  persistPlan();
}

export function applyTemplate(template, name) {
  const plan = createEmptyPlan(name || `${template.name} Plan`);
  plan.days = templateToDays(template);
  setPlan(plan);
  return plan;
}

export function addSession(session) {
  sessionState = [session, ...readSessions()];
  persistSessions();
}

export function todayIndex() {
  // JS getDay: 0=Sun..6=Sat -> Mon-first index
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

// A few seeded completed sessions so Profile progress looks alive on first run.
// Frontend-only; replaced by real backend sessions later.
function seedSessions() {
  const mk = (daysAgo, name, exos) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const sets = (w, r, n = 4) =>
      Array.from({ length: n }, (_, i) => ({ weight: w, reps: r, completed: true }));
    return {
      id: `seed-${daysAgo}`,
      date: localDateStr(d),
      planName: name,
      durationSec: 2400 + daysAgo * 40,
      completedAt: d.getTime(),
      exercises: exos.map((x) => ({
        exerciseId: x.id,
        name: x.name,
        category: x.category,
        sets: sets(x.w, x.r),
      })),
    };
  };
  return [
    mk(1, "Push Day", [
      { id: "EX001", name: "Barbell Bench Press", category: "Chest", w: 60, r: 8 },
      { id: "EX060", name: "Overhead Press", category: "Shoulders", w: 35, r: 8 },
      { id: "EX083", name: "Rope Triceps Pushdown", category: "Arms", w: 25, r: 12 },
    ]),
    mk(3, "Pull Day", [
      { id: "EX021", name: "Lat Pulldown", category: "Back", w: 45, r: 10 },
      { id: "EX016", name: "Barbell Row", category: "Back", w: 40, r: 8 },
      { id: "EX075", name: "Dumbbell Biceps Curl", category: "Arms", w: 12, r: 10 },
    ]),
    mk(5, "Leg Day", [
      { id: "EX033", name: "Back Squat", category: "Legs", w: 80, r: 5 },
      { id: "EX036", name: "Leg Press", category: "Legs", w: 120, r: 10 },
      { id: "EX043", name: "Leg Curl", category: "Legs", w: 40, r: 12 },
    ]),
    mk(7, "Push Day", [
      { id: "EX001", name: "Barbell Bench Press", category: "Chest", w: 57, r: 8 },
      { id: "EX063", name: "Dumbbell Lateral Raise", category: "Shoulders", w: 8, r: 12 },
      { id: "EX085", name: "Overhead Triceps Extension", category: "Arms", w: 20, r: 10 },
    ]),
    mk(9, "Pull Day", [
      { id: "EX022", name: "Pull-Up", category: "Back", w: 0, r: 6 },
      { id: "EX019", name: "Seated Cable Row", category: "Back", w: 35, r: 10 },
      { id: "EX076", name: "Hammer Curl", category: "Arms", w: 12, r: 10 },
    ]),
    mk(12, "Leg Day", [
      { id: "EX033", name: "Back Squat", category: "Legs", w: 75, r: 5 },
      { id: "EX041", name: "Romanian Deadlift", category: "Legs", w: 60, r: 8 },
      { id: "EX047", name: "Standing Calf Raise", category: "Legs", w: 40, r: 15 },
    ]),
  ];
}