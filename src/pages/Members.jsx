import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Modal from "@/components/ui/Modal";
import { Search, Plus, Pencil, Trash2, Eye, ChevronDown, Users, UserCheck, Clock, UserX, RotateCcw } from "lucide-react";
import { members as mockMembers } from "@/lib/mockData";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/ui/use-toast";

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-black/15 bg-white text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors";
const labelCls = "block text-sm font-medium mb-1.5";
const sectionCls = "text-xs font-semibold uppercase tracking-wider text-black/40 mb-3";

const filters = ["All", "Active", "Expiring Soon", "Expired", "Suspended"];
const sortOptions = [
  { key: "recent", label: "Recently Registered" },
  { key: "name", label: "Name A-Z" },
  { key: "expiry", label: "Membership Expiry" },
  { key: "payment", label: "Payment Status" },
];
const planOptions = ["Monthly", "3 Months", "6 Months", "Custom"];
const payOptions = ["Paid", "Pending", "Overdue"];
const methodOptions = ["Cash", "Mobile Money", "Card", "Other"];
const statusOptions = ["Active", "Expiring Soon", "Expired", "Suspended"];

const statusBadge = (s) => {
  if (s === "Active") return "bg-black text-white";
  if (s === "Expiring Soon") return "bg-black/10 text-black";
  if (s === "Expired") return "bg-black/5 text-black/50";
  return "bg-black/10 text-black/60";
};
const payBadge = (s) => (s === "Paid" ? "bg-black text-white" : s === "Pending" ? "bg-black/10 text-black" : "border border-black text-black");
const initials = (name) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const emptyForm = { name: "", phone: "", email: "", plan: "Monthly", startDate: "", expiryDate: "", paymentStatus: "Paid", amount: "", paymentMethod: "Cash", status: "Active" };

export default function Members() {
  const navigate = useNavigate();
  const [members, setMembers] = useState(mockMembers);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { toast } = useToast();

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

  const openAdd = () => {
    setEditingId(null);
    const today = new Date().toISOString().slice(0, 10);
    setForm({ ...emptyForm, startDate: today });
    setErrors({});
    setModalOpen(true);
  };
  const openEdit = (m) => {
    setEditingId(m.id);
    setForm({
      name: m.name, phone: m.phone, email: m.email || "", plan: m.plan,
      startDate: m.startDate || m.registeredDate, expiryDate: m.expiryDate,
      paymentStatus: m.paymentStatus, amount: String(m.fee || ""), paymentMethod: m.paymentMethod || "Cash", status: m.status,
    });
    setErrors({});
    setModalOpen(true);
  };
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const submit = () => {
    if (!validate()) return;
    if (editingId) {
      setMembers((ms) => ms.map((m) => (m.id === editingId ? { ...m, ...form, fee: Number(form.amount) || m.fee } : m)));
      toast({ title: "Member updated", description: form.name });
    } else {
      const id = Math.max(...members.map((m) => m.id), 0) + 1;
      setMembers((ms) => [{
        id, memberId: `GYM-${1000 + id}`, ...form, fee: Number(form.amount) || 0,
        registeredDate: form.startDate || new Date().toISOString().slice(0, 10), gym: "Olympic Gym",
      }, ...ms]);
      toast({ title: "Member added successfully", description: form.name });
    }
    setModalOpen(false);
  };
  const remove = (id) => { setMembers((ms) => ms.filter((m) => m.id !== id)); toast({ title: "Member deleted" }); setConfirmDelete(null); };
  const clearFilters = () => { setQuery(""); setFilter("All"); setSort("recent"); };

  const summaryCards = [
    { label: "Total Members", value: summary.total, icon: Users },
    { label: "Active", value: summary.active, icon: UserCheck },
    { label: "Expiring Soon", value: summary.expiring, icon: Clock },
    { label: "Expired", value: summary.expired, icon: UserX },
  ];

  const EmptyState = () => (
    <div className="bg-white border border-black/10 rounded-xl p-10 text-center">
      <div className="w-14 h-14 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4"><Users className="w-7 h-7 text-black/40" /></div>
      <p className="text-base font-semibold">No members found</p>
      <p className="text-sm text-black/50 mt-1">Try changing your search or filters.</p>
      <button onClick={clearFilters} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90"><RotateCcw className="w-4 h-4" /> Clear filters</button>
    </div>
  );

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

        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <>
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
                  {filtered.map((m) => (
                    <tr key={m.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] cursor-pointer" onClick={() => navigate(`/members/${m.id}`)}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-xs font-semibold">{initials(m.name)}</div>
                          <div><p className="font-medium">{m.name}</p><p className="text-xs text-black/50">{m.phone}</p></div>
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
                          <button onClick={() => setConfirmDelete(m.id)} className="p-1.5 rounded-lg hover:bg-black/5" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((m) => (
                <div key={m.id} className="bg-white border border-black/10 rounded-xl p-4" onClick={() => navigate(`/members/${m.id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-xs font-semibold">{initials(m.name)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{m.name}</p>
                      <p className="text-xs text-black/50 truncate">{m.memberId} · {m.phone}</p>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-black/5"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmDelete(m.id)} className="p-1.5 rounded-lg hover:bg-black/5"><Trash2 className="w-4 h-4" /></button>
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
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/members/${m.id}`); }} className="font-medium text-black/70">View</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Member" : "Add Member"}
        footer={<>
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Cancel</button>
          <button onClick={submit} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">{editingId ? "Save Changes" : "Add Member"}</button>
        </>}>
        <div className="space-y-6">
          <div>
            <p className={sectionCls}>Personal Information</p>
            <div className="space-y-4">
              <div><label className={labelCls}>Full Name</label>
                <input className={`${inputCls} ${errors.name ? "border-black bg-black/5" : ""}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
                {errors.name && <p className="text-xs text-black font-medium mt-1">{errors.name}</p>}</div>
              <div><label className={labelCls}>Phone Number</label>
                <input className={`${inputCls} ${errors.phone ? "border-black bg-black/5" : ""}`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 0100" />
                {errors.phone && <p className="text-xs text-black font-medium mt-1">{errors.phone}</p>}</div>
              <div><label className={labelCls}>Email (optional)</label>
                <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@olympicgym.com" /></div>
              <div><label className={labelCls}>Profile Photo</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center text-sm font-semibold">{form.name ? initials(form.name) : "—"}</div>
                  <button type="button" className="px-3 py-1.5 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Upload photo</button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className={sectionCls}>Membership</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className={labelCls}>Membership Plan</label>
                <select className={inputCls} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                  {planOptions.map((o) => <option key={o}>{o}</option>)}
                </select></div>
              <div><label className={labelCls}>Start Date</label>
                <input type="date" className={inputCls} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div><label className={labelCls}>Expiry Date</label>
                <input type="date" className={inputCls} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></div>
            </div>
          </div>

          {!editingId ? (
            <div>
              <p className={sectionCls}>Payment</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className={labelCls}>Payment Status</label>
                  <select className={inputCls} value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                    {payOptions.map((o) => <option key={o}>{o}</option>)}
                  </select></div>
                <div><label className={labelCls}>Amount ($)</label>
                  <input type="number" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="60" /></div>
                <div><label className={labelCls}>Payment Method</label>
                  <select className={inputCls} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                    {methodOptions.map((o) => <option key={o}>{o}</option>)}
                  </select></div>
              </div>
            </div>
          ) : (
            <div>
              <p className={sectionCls}>Status</p>
              <div><label className={labelCls}>Member Status</label>
                <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {statusOptions.map((o) => <option key={o}>{o}</option>)}
                </select></div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => remove(confirmDelete)}
        title="Delete member?"
        message="Are you sure you want to remove this member? This cannot be undone."
        confirmLabel="Delete Member"
      />
    </Layout>
  );
}