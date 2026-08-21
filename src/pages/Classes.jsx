import React from "react";
import Layout from "@/components/Layout";
import { Plus, Clock, Users } from "lucide-react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const classes = {
  Mon: [
    { name: "Power Lifting", time: "06:00", trainer: "Jake M.", spots: 12, total: 15, gym: "Downtown Iron" },
    { name: "Yoga Flow", time: "09:00", trainer: "Maya R.", spots: 8, total: 20, gym: "Westside Fitness" },
    { name: "HIIT Burn", time: "18:00", trainer: "Diego S.", spots: 18, total: 25, gym: "Riverside Gym" },
  ],
  Tue: [
    { name: "Spin Class", time: "07:00", trainer: "Lena P.", spots: 10, total: 18, gym: "Downtown Iron" },
    { name: "Boxing", time: "17:30", trainer: "Marcus R.", spots: 14, total: 16, gym: "Northgate Athletic" },
  ],
  Wed: [
    { name: "Pilates", time: "10:00", trainer: "Maya R.", spots: 6, total: 12, gym: "Westside Fitness" },
    { name: "CrossFit", time: "19:00", trainer: "Jake M.", spots: 20, total: 20, gym: "Downtown Iron" },
  ],
  Thu: [
    { name: "Zumba", time: "08:00", trainer: "Aisha K.", spots: 15, total: 25, gym: "Riverside Gym" },
    { name: "Strength 101", time: "18:30", trainer: "Diego S.", spots: 9, total: 15, gym: "Northgate Athletic" },
  ],
  Fri: [
    { name: "Power Lifting", time: "06:00", trainer: "Jake M.", spots: 11, total: 15, gym: "Downtown Iron" },
    { name: "Yoga Flow", time: "09:00", trainer: "Maya R.", spots: 5, total: 20, gym: "Westside Fitness" },
  ],
  Sat: [
    { name: "Bootcamp", time: "08:00", trainer: "Marcus R.", spots: 22, total: 30, gym: "Downtown Iron" },
    { name: "Spin Class", time: "11:00", trainer: "Lena P.", spots: 12, total: 18, gym: "Riverside Gym" },
  ],
  Sun: [
    { name: "Mobility", time: "10:00", trainer: "Maya R.", spots: 4, total: 12, gym: "Westside Fitness" },
  ],
};

export default function Classes() {
  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Class Schedule</h1>
            <p className="text-sm text-black/50 mt-0.5">Weekly classes across all locations</p>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
            <Plus className="w-4 h-4" /> Add class
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {days.map((day) => (
            <div key={day} className="bg-white border border-black/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{day}</h3>
                <span className="text-xs text-black/40">{classes[day].length} classes</span>
              </div>
              <div className="space-y-2.5">
                {classes[day].map((c, i) => (
                  <div key={i} className="p-3 rounded-lg border border-black/10 hover:bg-black/[0.02] transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <span className="text-xs text-black/50 flex items-center gap-1 whitespace-nowrap">
                        <Clock className="w-3 h-3" /> {c.time}
                      </span>
                    </div>
                    <p className="text-xs text-black/50 mb-2">{c.gym} · {c.trainer}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-black/50 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {c.spots}/{c.total}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          c.spots === c.total ? "text-black/40" : "text-black"
                        }`}
                      >
                        {c.spots === c.total ? "Full" : `${c.total - c.spots} left`}
                      </span>
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-black/10 overflow-hidden">
                      <div
                        className="h-full bg-black rounded-full"
                        style={{ width: `${(c.spots / c.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}