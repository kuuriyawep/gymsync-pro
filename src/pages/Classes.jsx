import React, { useState } from "react";
import Layout from "@/components/Layout";
import Modal from "@/components/ui/Modal";
import { Plus, Clock, Users, Trash2 } from "lucide-react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const initialClasses = {
  Mon: [
    { id: 1, name: "Power Lifting", trainer: "Jake M.", start: "06:00", end: "07:00", capacity: 15, booked: 12, gym: "Downtown Iron" },
    { id: 2, name: "Yoga Flow", trainer: "Maya R.", start: "09:00", end: "10:00", capacity: 20, booked: 8, gym: "Westside Fitness" },
    { id: 3, name: "HIIT Burn", trainer: "Diego S.", start: "18:00", end: "19:00", capacity: 25, booked: 18, gym: "Riverside Gym" },
  ],
  Tue: [
    { id: 4, name: "Spin Class", trainer: "Lena P.", start: "07:00", end: "08:00", capacity: 18, booked: 10, gym: "Downtown Iron" },
    { id: 5, name: "Boxing", trainer: "Marcus R.", start: "17:30", end: "18:30", capacity: 16, booked: 14, gym: "Northgate Athletic" },
  ],
  Wed: [
    { id: 6, name: "Pilates", trainer: "Maya R.", start: "10:00", end: "11:00", capacity: 12, booked: 6, gym: "Westside Fitness" },
    { id: 7, name: "CrossFit", trainer: "Jake M.", start: "19:00", end: "20:00", capacity: 20, booked: 20, gym: "Downtown Iron" },
  ],
  Thu: [
    { id: 8, name: "Zumba", trainer: "Aisha K.", start: "08:00", end: "09:00", capacity: 25, booked: 15, gym: "Riverside Gym" },
    { id: 9, name: "Strength 101", trainer: "Diego S.", start: "18:30", end: "19:30", capacity: 15, booked: 9, gym: "Northgate Athletic" },
  ],
  Fri: [
    { id: 10, name: "Power Lifting", trainer: "Jake M.", start: "06:00", end: "07:00", capacity: 15, booked: 11, gym: "Downtown Iron" },
    { id: 11, name: "Yoga Flow", trainer: "Maya R.", start: "09:00", end: "10:00", capacity: 20, booked: 5, gym: "Westside Fitness" },
  ],
  Sat: [
    { id: 12, name: "Bootcamp", trainer: "Marcus R.", start: "08:00", end: "09:30", capacity: 30, booked: 22, gym: "Downtown Iron" },
    { id: 13, name: "Spin Class", trainer: "Lena P.", start: "11:00", end: "12:00", capacity: 18, booked: 12, gym: "Riverside Gym" },
  ],
  Sun: [
    { id: 14, name: "Mobility", trainer: "Maya R.", start: "10:00", end: "11:00", capacity: 12, booked: 4, gym: "Westside Fitness" },
  ],
};

const emptyForm = { name: "", trainer: "", start: "08:00", end: "09:00", capacity: "", day: "Mon" };
const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";

export default function Classes() {
  const [classes, setClasses] = useState(initialClasses);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const submit = () => {
    if (!form.name.trim() || !form.trainer.trim()) return;
    const newClass = {
      id: Date.now(),
      name: form.name,
      trainer: form.trainer,
      start: form.start,
      end: form.end,
      capacity: Number(form.capacity) || 0,
      booked: 0,
      gym: "Downtown Iron",
    };
    setClasses((c) => ({ ...c, [form.day]: [...c[form.day], newClass] }));
    setModalOpen(false);
    setForm(emptyForm);
  };

  const remove = (day, id) => {
    setClasses((c) => ({ ...c, [day]: c[day].filter((cls) => cls.id !== id) }));
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Class Schedule</h1>
            <p className="text-sm text-black/50 mt-0.5">Weekly classes across all locations</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90"
          >
            <Plus className="w-4 h-4" /> Create Class
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
                {classes[day].length === 0 && (
                  <p className="text-xs text-black/30 text-center py-4">No classes</p>
                )}
                {classes[day].map((c) => (
                  <div key={c.id} className="group p-3 rounded-lg border border-black/10 hover:bg-black/[0.02] transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <button
                        onClick={() => remove(day, c.id)}
                        className="p-1 rounded hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-black/50 mb-1.5">{c.trainer}</p>
                    <p className="text-xs text-black/50 flex items-center gap-1 mb-2">
                      <Clock className="w-3 h-3" /> {c.start} – {c.end}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-black/50 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {c.booked}/{c.capacity}
                      </span>
                      <span className="text-xs font-medium">
                        {c.booked >= c.capacity ? "Full" : `${c.capacity - c.booked} left`}
                      </span>
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-black/10 overflow-hidden">
                      <div
                        className="h-full bg-black rounded-full"
                        style={{ width: `${c.capacity ? (c.booked / c.capacity) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Class"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">
              Cancel
            </button>
            <button onClick={submit} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
              Create class
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Class Name</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Yoga, CrossFit, Spin…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Trainer Name</label>
            <input
              className={inputCls}
              value={form.trainer}
              onChange={(e) => setForm({ ...form, trainer: e.target.value })}
              placeholder="Maya R."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Day</label>
            <select className={inputCls} value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
              {days.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Start Time</label>
              <input
                type="time"
                className={inputCls}
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">End Time</label>
              <input
                type="time"
                className={inputCls}
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Max Capacity</label>
            <input
              type="number"
              className={inputCls}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              placeholder="20"
            />
          </div>
        </div>
      </Modal>
    </Layout>
  );
}