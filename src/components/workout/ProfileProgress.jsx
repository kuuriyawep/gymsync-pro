import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Flame, Dumbbell, TrendingUp, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useWorkoutSessions } from "@/lib/workout/workoutStore";
import { sessionVolume, sessionSets, computeStreak, localDateStr, formatDuration } from "@/lib/workout/workoutUtils";
import { ACCENT, ACCENT_SOFT } from "@/lib/workout/theme";

const RANGES = [
  { id: "week", label: "Week", days: 7 },
  { id: "month", label: "Month", days: 30 },
  { id: "quarter", label: "3M", days: 90 },
  { id: "year", label: "Year", days: 365 },
  { id: "all", label: "All", days: 9999 },
];
const CONSISTENCY_RANGES = [
  { id: "1m", label: "1 Month", days: 30 },
  { id: "3m", label: "3 Months", days: 90 },
  { id: "6m", label: "6 Months", days: 180 },
  { id: "1y", label: "1 Year", days: 365 },
];

export default function ProfileProgress() {
  const sessions = useWorkoutSessions();
  const completed = useMemo(() => sessions.filter((s) => s.completedAt).sort((a, b) => new Date(a.date) - new Date(b.date)), [sessions]);
  const [tab, setTab] = useState("history");

  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const totalVolume = useMemo(() => completed.reduce((sum, s) => sum + sessionVolume(s), 0), [completed]);

  return (
    <div className="bg-white border border-black/10 rounded-2xl p-5">
      <div className="grid grid-cols-3 gap-2 text-center mb-4">
        <Metric icon={Dumbbell} value={completed.length} label="Workouts" />
        <Metric icon={Flame} value={streak} label="Streak" accent />
        <Metric icon={TrendingUp} value={`${Math.round(totalVolume / 1000)}k`} label="Volume" />
      </div>

      {/* segmented control */}
      <div className="flex p-1 bg-black/5 rounded-xl mb-4">
        {[
          { id: "history", label: "History" },
          { id: "progress", label: "Progress" },
          { id: "consistency", label: "Consistency" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${tab === t.id ? "bg-white text-black shadow-sm" : "text-black/50"}`}>{t.label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
          {tab === "history" && <History sessions={completed} />}
          {tab === "progress" && <Progress sessions={completed} />}
          {tab === "consistency" && <Consistency sessions={completed} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Metric({ icon: Icon, value, label, accent }) {
  return (
    <div className="flex flex-col items-center">
      <Icon className={`w-4 h-4 mb-1 ${accent ? "" : "text-black/40"}`} style={accent ? { color: ACCENT } : undefined} />
      <span className="text-xl font-bold tabular-nums">{value}</span>
      <span className="text-[11px] text-black/50">{label}</span>
    </div>
  );
}

function History({ sessions }) {
  const [open, setOpen] = useState(null);
  if (!sessions.length) return <Empty icon={Calendar} title="No workout history yet" sub="Complete your first workout to start tracking." />;
  return (
    <div className="space-y-2">
      {[...sessions].reverse().map((s) => {
        const isOpen = open === s.id;
        const vol = sessionVolume(s);
        const sets = sessionSets(s);
        return (
          <div key={s.id} className="border border-black/10 rounded-xl overflow-hidden">
            <button onClick={() => setOpen(isOpen ? null : s.id)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-black/[0.02]">
              <div className="w-10 text-center">
                <p className="text-[10px] uppercase text-black/40">{new Date(s.date).toLocaleDateString("en-US", { month: "short" })}</p>
                <p className="text-lg font-bold leading-none">{new Date(s.date).getDate()}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{s.planName}</p>
                <p className="text-xs text-black/50">{formatDuration(s.durationSec)} · {sets} sets · {vol.toLocaleString()} kg</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-black/40 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <ul className="px-3 pb-3 space-y-1">
                    {s.exercises.map((ex, i) => (
                      <li key={i} className="text-xs text-black/60 flex justify-between">
                        <span className="truncate">{ex.name}</span>
                        <span className="text-black/40 ml-2 shrink-0">{ex.sets.filter((x) => x.completed).length} sets</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function Progress({ sessions }) {
  const [range, setRange] = useState("month");
  const data = useMemo(() => {
    const r = RANGES.find((x) => x.id === range);
    const cutoff = Date.now() - r.days * 86400000;
    return sessions.filter((s) => new Date(s.date).getTime() >= cutoff).map((s) => ({
      date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      volume: sessionVolume(s),
    }));
  }, [sessions, range]);

  if (!sessions.length) return <Empty icon={TrendingUp} title="No progress yet" sub="Finish a workout to see your trend." />;

  return (
    <div>
      <div className="flex gap-1.5 mb-3 overflow-x-auto no-scrollbar">
        {RANGES.map((r) => (
          <button key={r.id} onClick={() => setRange(r.id)} className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium ${range === r.id ? "bg-black text-white" : "bg-black/5 text-black/50"}`}>{r.label}</button>
        ))}
      </div>
      <div className="h-40 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity={0.25} />
                <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(0,0,0,0.4)" }} axisLine={false} tickLine={false} minTickGap={20} />
            <YAxis tick={{ fontSize: 10, fill: "rgba(0,0,0,0.4)" }} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.1)", fontSize: 12 }} formatter={(v) => [`${v.toLocaleString()} kg`, "Volume"]} />
            <Area type="monotone" dataKey="volume" stroke={ACCENT} strokeWidth={2.5} fill="url(#volFill)" dot={{ r: 2, fill: ACCENT }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Consistency({ sessions }) {
  const [range, setRange] = useState("3m");
  const cells = useMemo(() => {
    const r = CONSISTENCY_RANGES.find((x) => x.id === range);
    const volByDay = {};
    sessions.forEach((s) => { volByDay[s.date] = (volByDay[s.date] || 0) + sessionVolume(s); });
    const days = r.days;
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    // align start to Sunday so weeks are columns
    const startDow = start.getDay();
    start.setDate(start.getDate() - startDow);
    const arr = [];
    const cur = new Date(start);
    while (cur <= today) {
      const key = localDateStr(cur);
      arr.push({ key, vol: volByDay[key] || 0 });
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  }, [sessions, range]);

  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const activeDays = cells.filter((c) => c.vol > 0).length;
  const max = Math.max(1, ...cells.map((c) => c.vol));

  const tone = (vol) => {
    if (vol === 0) return "bg-black/[0.06]";
    const p = vol / max;
    if (p > 0.66) return "bg-emerald-500";
    if (p > 0.33) return "bg-emerald-500/70";
    return "bg-emerald-500/40";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold">{streak} day streak</p>
          <p className="text-xs text-black/50">{activeDays} active days in range</p>
        </div>
        <Flame className="w-5 h-5" style={{ color: ACCENT }} />
      </div>
      <div className="flex gap-1.5 mb-3 overflow-x-auto no-scrollbar">
        {CONSISTENCY_RANGES.map((r) => (
          <button key={r.id} onClick={() => setRange(r.id)} className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium ${range === r.id ? "bg-black text-white" : "bg-black/5 text-black/50"}`}>{r.label}</button>
        ))}
      </div>
      <div className="overflow-x-auto no-scrollbar pb-1">
        <div className="grid gap-[3px] w-max" style={{ gridTemplateRows: "repeat(7, 12px)", gridAutoFlow: "column", gridAutoColumns: "12px" }}>
          {cells.map((c) => (
            <div key={c.key} title={`${c.key}: ${c.vol.toLocaleString()} kg`} className={`rounded-[3px] ${tone(c.vol)}`} />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-black/40">
        Less
        <span className="w-2.5 h-2.5 rounded-[2px] bg-black/[0.06]" />
        <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/40" />
        <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/70" />
        <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500" />
        More
      </div>
    </div>
  );
}

function Empty({ icon: Icon, title, sub }) {
  return (
    <div className="py-8 text-center">
      <Icon className="w-6 h-6 text-black/30 mx-auto mb-2" />
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-black/50 mt-0.5">{sub}</p>
    </div>
  );
}