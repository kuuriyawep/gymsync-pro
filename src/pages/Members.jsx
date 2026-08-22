import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Modal from "@/components/ui/Modal";
import { Search, Plus, Pencil, Trash2, Eye, ChevronDown, Users, UserCheck, Clock, UserX } from "lucide-react";
import { members as mockMembers } from "@/lib/mockData";

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";

const filters = ["All", "Active", "Expiring Soon", "Expired", "Suspended"];
const sortOptions = [
  { key: "recent", label: "Recently Registered" },
  { key: "name", label: "Name A-Z" },
  { key: "expiry", label: "Membership Expiry" },
  { key: "payment", label: "Payment Status" },
];

const statusBadge = (s) => {
  if (s === "Active") return "bg-black text-white";
  if (s === "Expiring Soon") return "bg-black/10 text-black";
  if (s === "Expired") return "bg-black/5 text-black/50";
  return "bg-black/10 text-black/60";
};
const payBadge = (s) => (s === "Paid" ? "bg-black text-white" : s === "Pending" ? "bg-black/10 text-black" : "border border-black text-black");
const initials = (name) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

export default function Members() {
  const navigate = useNavigate();
  const [members, setMembers] = useState(mockMembers);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", plan: "Monthly", fee: "" });

  const summary = useMemo(() => ({
    total: members.length,
    active: members.filter((m) => m.status === "Active").length,
    expiring: members.filter((m) => m.status === "Expiring Soon").length,
    expired: members.filter((m) => m.status === "Expired").length,
  }), [members]);

  const filtered = useMemo(() => {
    let list = members.filter((m) => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || m.name.toLowerCase().includes(q) || m.phone.toLowerCase().includes(q) || m.memberId.toLowerCase().includes(q);
      const matchesFilter = filter === "All" || m.status === filter;
      return matchesQuery && matchesFilter;
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "expiry") return new Date(a.expiryDate) - new Date(b.expiryDate);
      if (sort === "payment") return a.paymentStatus.localeCompare(b.paymentStatus);
      return new Date(b.registeredDate) - new Date(a.registeredDate);
    });
    return list;
  }, [members, query, filter, sort]);

  const openAdd = () => { setEditingId(null); setForm({ name: "", phone: "", plan: "Monthly", fee: "" }); setModalOpen(true); };
  const openEdit = (m) => { setEditingId(m.id); setForm({ name: m.name, phone: m.phone, plan: m.plan, fee: m.fee }); setModalOpen(true); };
  const submit = () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    if (editingId) {
      setMembers((ms) => ms.map((m) => (m.id === editingId ? { ...m, ...form, fee: Number(form.fee) || 0 } : m)));
    } else {
      const id = Math.max(...members.map((m) => m.id), 0) + 1;
      setMembers((ms) => [{
        id, memberId: `GYM-${1000 + id}`, ...form, fee: Number(form.fee) || 0,
        status: "Active", expiryDate: "2026-09-15", paymentStatus: "Paid", registeredDate: "2026-08-22", gym: "Downtown Iron",
      }, ...ms]);
    }
    setModalOpen(false);
  };
  const remove = (id) => setMembers((ms) => ms.filter((m) => m.id !== id));

  const summaryCards = [
    { label: "Total Members", value: summary.total, icon: Users },
    { label: "Active", value: summary.active, icon: UserCheck },
    { label: "Expiring Soon", value: summary.expiring, icon: Clock },
    { label: "Expired", value: summary.expired, icon: UserX },
  ];

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Members</h1>
            <p className="text-sm text-black/50 mt-0.5">Manage and track all your gym members</p>
          </div>
          <button onClick={openAdd} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {summaryCards.map((s) => (
            <div key={s.label} className="bg-white border border-black/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center"><s.icon className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-black/50">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search + filters + sort */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-black/5">
            <Search className="w-4 h-4 text-black/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, phone or member ID…"
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-black/40"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {filters.map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    filter === f ? "bg-black text-white border-black" : "bg-white text-black/70 border-black/15 hover:bg-black/5"
                  }`}>
                  {f}
                </button>
              ))}
            </div>
            <div className="relative sm:ml-auto">
              <button onClick={() => setSortOpen((o) => !o)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/15 text-xs font-medium hover:bg-black/5">
                Sort: {sortOptions.find((o) => o.key === sort)?.label} <ChevronDown className="w-3.5 h-3.5 text-black/50" />
              </button>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 top-9 z-20 bg-white border border-black/10 rounded-lg shadow-lg w-48 py-1">
                    {sortOptions.map((o) => (
                      <button key={o.key} onClick={() => { setSort(o.key); setSortOpen(false); }}
                        className={`flex items-center w-full px-3 py-2 text-sm hover:bg-black/5 text-left ${sort === o.key ? "font-semibold" : ""}`}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-white border border-black/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-xs text-black/40">
                <th className="px-5 py-3 font-medium">Member</th>
                <th className="px-5 py-3 font-medium">Member ID</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Expiry Date</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-black/40">No members match your search.</td></tr>
              ) : filtered.map((m) => (
                <tr key={m.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] cursor-pointer" onClick={() => navigate(`/members/${m.id}`)}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-xs font-semibold">{initials(m.name)}</div>
                      <div><p className="font-medium">{m.name}</p><p className="text-xs text-black/50">{m.gym}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-black/70 tabular-nums">{m.memberId}</td>
                  <td className="px-5 py-3">{m.plan}</td>
                  <td className="px-5 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(m.status)}`}>{m.status}</span></td>
                  <td className="px-5 py-3 text-black/70">{m.expiryDate}</td>
                  <td className="px-5 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${payBadge(m.paymentStatus)}`}>{m.paymentStatus}</span></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => navigate(`/members/${m.id}`)} className="p-1.5 rounded-lg hover:bg-black/5" title="View"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-black/5" title="Edit"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => remove(m.id)} className="p-1.5 rounded-lg hover:bg-black/5" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white border border-black/10 rounded-xl p-8 text-center text-sm text-black/40">No members match your search.</div>
          ) : filtered.map((m) => (
            <div key={m.id} className="bg-white border border-black/10 rounded-xl p-4" onClick={() => navigate(`/members/${m.id}`)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-xs font-semibold">{initials(m.name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{m.name}</p>
                  <p className="text-xs text-black/50 truncate">{m.memberId} · {m.phone}</p>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-black/5"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(m.id)} className="p-1.5 rounded-lg hover:bg-black/5"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5 text-xs">
                <span className="text-black/50">{m.plan}</span>
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(m.status)}`}>{m.status}</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${payBadge(m.paymentStatus)}`}>{m.paymentStatus}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-black/50">
                <span>Expires {m.expiryDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Member" : "Add Member"}
        footer={<>
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Cancel</button>
          <button onClick={submit} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">{editingId ? "Save" : "Add member"}</button>
        </>}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-1.5">Name</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" /></div>
          <div><label className="block text-sm font-medium mb-1.5">Phone</label>
            <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 0100" /></div>
          <div><label className="block text-sm font-medium mb-1.5">Membership Plan</label>
            <select className={inputCls} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
              <option>Monthly</option><option>3 Months</option><option>6 Months</option><option>Custom</option>
            </select></div>
          <div><label className="block text-sm font-medium mb-1.5">Monthly Fee ($)</label>
            <input type="number" className={inputCls} value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} placeholder="60" /></div>
        </div>
      </Modal>
    </Layout>
  );
}