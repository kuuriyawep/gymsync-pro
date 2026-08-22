import React, { useState } from "react";
import Layout from "@/components/Layout";
import Modal from "@/components/ui/Modal";
import { Search, Plus, Filter, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

const initialMembers = [
  { id: 1, name: "Sarah Chen", phone: "+1 555 0101", tier: "VIP", fee: 120, gym: "Downtown Iron", status: "Active", joined: "Aug 2026" },
  { id: 2, name: "Marcus Reed", phone: "+1 555 0102", tier: "Standard", fee: 60, gym: "Westside Fitness", status: "Active", joined: "Aug 2026" },
  { id: 3, name: "Lena Park", phone: "+1 555 0103", tier: "VIP", fee: 120, gym: "Riverside Gym", status: "Active", joined: "Aug 2026" },
  { id: 4, name: "Diego Santos", phone: "+1 555 0104", tier: "Standard", fee: 60, gym: "Downtown Iron", status: "Frozen", joined: "Jul 2026" },
  { id: 5, name: "Aisha Khan", phone: "+1 555 0105", tier: "VIP", fee: 120, gym: "Northgate Athletic", status: "Active", joined: "Jul 2026" },
  { id: 6, name: "Tom Walsh", phone: "+1 555 0106", tier: "Standard", fee: 60, gym: "Westside Fitness", status: "Inactive", joined: "Jun 2026" },
  { id: 7, name: "Nina Costa", phone: "+1 555 0107", tier: "Standard", fee: 60, gym: "Riverside Gym", status: "Active", joined: "Jun 2026" },
];

const emptyForm = { name: "", phone: "", tier: "Standard", fee: "" };
const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";

export default function Members() {
  const [members, setMembers] = useState(initialMembers);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setEditingId(m.id);
    setForm({ name: m.name, phone: m.phone, tier: m.tier, fee: m.fee });
    setModalOpen(true);
    setOpenMenuId(null);
  };

  const submit = () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    if (editingId) {
      setMembers((ms) => ms.map((m) => (m.id === editingId ? { ...m, ...form, fee: Number(form.fee) || 0 } : m)));
    } else {
      setMembers((ms) => [
        { id: Date.now(), ...form, fee: Number(form.fee) || 0, gym: "Downtown Iron", status: "Active", joined: "Aug 2026" },
        ...ms,
      ]);
    }
    setModalOpen(false);
  };

  const remove = (id) => {
    setMembers((ms) => ms.filter((m) => m.id !== id));
    setOpenMenuId(null);
  };

  const filteredMembers = members.filter((m) => {
    const matchesName = m.name.toLowerCase().includes(query.trim().toLowerCase());
    const matchesTier = tierFilter === "all" || m.tier === tierFilter;
    return matchesName && matchesTier;
  });

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Members</h1>
            <p className="text-sm text-black/50 mt-0.5">{filteredMembers.length} of {members.length} members across 12 gyms</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90"
          >
            <Plus className="w-4 h-4" /> Add New Member
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-black/5 flex-1">
            <Search className="w-4 h-4 text-black/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name…"
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-black/40"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {["all", "Standard", "VIP"].map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  tierFilter === t
                    ? "bg-black text-white border-black"
                    : "bg-white text-black/70 border-black/15 hover:bg-black/5"
                }`}
              >
                {t === "all" ? "All" : t}
              </button>
            ))}
          </div>
        </div>

        {/* Table (desktop) */}
        <div className="hidden md:block bg-white border border-black/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-xs text-black/40">
                <th className="px-5 py-3 font-medium">Member</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Tier</th>
                <th className="px-5 py-3 font-medium">Monthly Fee</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m) => (
                <tr key={m.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-xs font-semibold">
                        {m.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-black/50">{m.gym}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-black/70">{m.phone}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.tier === "VIP" ? "bg-black text-white" : "bg-black/10 text-black/70"
                      }`}
                    >
                      {m.tier}
                    </span>
                  </td>
                  <td className="px-5 py-3 tabular-nums">${m.fee}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.status === "Active" ? "bg-black text-white" : "bg-black/10 text-black/60"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-black/5">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(m.id)} className="p-1.5 rounded-lg hover:bg-black/5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards (mobile) */}
        <div className="md:hidden space-y-3">
          {filteredMembers.map((m) => (
            <div key={m.id} className="bg-white border border-black/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-xs font-semibold">
                  {m.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{m.name}</p>
                  <p className="text-xs text-black/50 truncate">{m.phone}</p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}
                    className="p-1.5 rounded-lg hover:bg-black/5"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {openMenuId === m.id && (
                    <div className="absolute right-0 top-9 z-20 bg-white border border-black/10 rounded-lg shadow-lg w-32 py-1">
                      <button
                        onClick={() => openEdit(m)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-black/5 text-left"
                      >
                        <Pencil className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => remove(m.id)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-black/5 text-left"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5 text-xs">
                <span className="text-black/50">{m.gym}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      m.tier === "VIP" ? "bg-black text-white" : "bg-black/10 text-black/70"
                    }`}
                  >
                    {m.tier}
                  </span>
                  <span className="font-medium">${m.fee}/mo</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Member" : "Add New Member"}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">
              Cancel
            </button>
            <button onClick={submit} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
              {editingId ? "Save" : "Add member"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Phone Number</label>
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 555 0100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Membership Tier</label>
            <select className={inputCls} value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
              <option value="Standard">Standard</option>
              <option value="VIP">VIP</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Monthly Fee ($)</label>
            <input
              type="number"
              className={inputCls}
              value={form.fee}
              onChange={(e) => setForm({ ...form, fee: e.target.value })}
              placeholder="60"
            />
          </div>
        </div>
      </Modal>
    </Layout>
  );
}