import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import Modal from "@/components/ui/Modal";
import { Search, Plus, Pencil, Trash2, Eye, ChevronDown, Users, UserCheck, Clock, UserX, RotateCcw, Loader2 } from "lucide-react";
import { useMembers, useGymAnalytics, addMember, updateMember, renewMember, deleteMember } from "@/lib/memberStore";
import PhotoPicker from "@/components/PhotoPicker";
import ConfirmDialog from "@/components/ConfirmDialog";
import ProfileImage from "@/components/ProfileImage";
import PhoneNumberField from "@/components/PhoneNumberField";
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
const payOptions = ["Paid", "Pending", "Overdue"];
const methodOptions = ["Cash", "Mobile Money", "Card", "Other"];
const statusOptions = ["Active", "Expiring Soon", "Expired", "Suspended"];

const statusBadge = (s) => {
  if (s === "Active") return "bg-emerald-600 text-white";
  if (s === "Expiring Soon") return "bg-black/10 text-black";
  if (s === "Expired") return "bg-black/5 text-black/50";
  return "bg-black/10 text-black/60";
};
const payBadge = (s) => (s === "Paid" ? "bg-emerald-600 text-white" : s === "Pending" ? "bg-black/10 text-black" : "border border-black text-black");
const initials = (name) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const emptyForm = { name: "", phone: "", email: "", gender: "", plan: "Monthly", startDate: "", expiryDate: "", amount: "", amountPaid: "", balanceOverride: "", paymentMethod: "Cash", status: "Active", note: "", preferredTime: "Flexible", photoUrl: null };
const normalizePhone = (value) => String(value || "").replace(/\D/g, "");

export default function Members() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const members = useMembers();
  const analytics = useGymAnalytics();
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionMode, setActionMode] = useState("edit");
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { toast } = useToast();

  // Membership plans configured by the owner on the Membership page.
  const activePlans = useMemo(
    () => (analytics?.plans || []).filter((p) => p.status === "Active"),
    [analytics]
  );
  const selectedPlan = useMemo(
    () => activePlans.find((p) => p.name === form.plan) || null,
    [activePlans, form.plan]
  );

  const duplicatePhoneMember = useMemo(() => {
    const normalized = normalizePhone(form.phone);
    if (normalized.length < 7) return null;
    return members.find((member) => normalizePhone(member.phone) === normalized && String(member.id) !== String(editingId || "")) || null;
  }, [members, form.phone, editingId]);

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
    setActionMode("edit");
    setEditingId(null);
    const today = new Date().toISOString().slice(0, 10);
    const expiry = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    setForm({ ...emptyForm, plan: activePlans[0]?.name || emptyForm.plan, startDate: today, expiryDate: expiry });
    setErrors({});
    setModalOpen(true);
  };
  const openEdit = (m, mode = "edit") => {
    setActionMode(mode);
    setEditingId(m.id);
    setForm({
      name: m.name, phone: m.phone, email: m.email || "", gender: m.gender || "", plan: m.plan,
      startDate: m.startDate || m.registeredDate, expiryDate: m.expiryDate,
      amount: String(m.fee || ""), amountPaid: String(m.amountPaid || ""), balanceOverride: m.balanceOverride !== undefined && m.balanceOverride !== null ? String(m.balanceOverride) : "", paymentMethod: m.paymentMethod || "Cash", status: m.status,
      note: m.note || "", preferredTime: m.preferredTime || "Flexible", photoUrl: m.photoUrl || null,
    });
    setErrors({});
    setModalOpen(true);
  };
  useEffect(() => {
    const editId = searchParams.get("edit");
    const renewId = searchParams.get("renew");
    const targetId = editId || renewId;
    if (!targetId || members.length === 0) return;
    const target = members.find((item) => String(item.id) === targetId);
    if (target) openEdit(target, renewId ? "renew" : "edit");
    setSearchParams({}, { replace: true });
  }, [members, searchParams, setSearchParams]);
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    else if (normalizePhone(form.phone).length < 7) e.phone = "Enter a valid phone number";
    if (!form.gender) e.gender = "Gender is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingId) {
        if (actionMode === "renew") {
          await renewMember(editingId, form);
          toast({ title: "Membership renewed", description: `${form.name}${Number(form.amountPaid) > 0 ? ` · $${Number(form.amountPaid).toLocaleString()} payment recorded` : ""}` });
        } else {
          await updateMember(editingId, form);
          toast({ title: "Member updated", description: form.name });
        }
      } else {
        await addMember(form);
        toast({ title: "Member added successfully", description: form.name });
      }
      setModalOpen(false);
    } catch (error) {
      toast({ title: "Unable to save member", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id) => {
    try {
      await deleteMember(id);
      toast({ title: "Member deleted" });
      setConfirmDelete(null);
    } catch (error) {
      toast({ title: "Unable to delete member", description: error.message, variant: "destructive" });
    }
  };
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
                          <ProfileImage src={m.photoUrl} alt={m.name} fallback={initials(m.name)} className="w-10 h-10 text-xs" />
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
                    <ProfileImage src={m.photoUrl} alt={m.name} fallback={initials(m.name)} className="w-12 h-12 text-xs" />
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={actionMode === "renew" ? "Renew Membership" : editingId ? "Edit Member" : "Add Member"}
        footer={<>
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">Cancel</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90 disabled:opacity-80 inline-flex items-center gap-2">{saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : actionMode === "renew" ? "Renew Membership" : editingId ? "Save Changes" : "Add Member"}</button>
        </>}>
        <div className="space-y-6">
          <div>
            <p className={sectionCls}>Personal Information</p>
            <div className="space-y-4">
              <div><label className={labelCls}>Full Name</label>
                <input className={`${inputCls} ${errors.name ? "border-black bg-black/5" : ""}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
                {errors.name && <p className="text-xs text-black font-medium mt-1">{errors.name}</p>}</div>
              <div><label className={labelCls}>Phone Number</label>
                <PhoneNumberField
                  key={`${modalOpen}-${editingId || "new"}`}
                  value={form.phone}
                  onChange={(phone) => setForm((current) => ({ ...current, phone }))}
                  error={errors.phone}
                />
                {errors.phone && <p className="text-xs text-black font-medium mt-1">{errors.phone}</p>}
                {duplicatePhoneMember && (
                  <p className="text-xs text-red-600 font-medium mt-1.5">This phone number is already registered in the system.</p>
                )}
              </div>
              <div><label className={labelCls}>Email (optional)</label>
                <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@olympicgym.com" /></div>
              <div><label className={labelCls}>Gender</label>
                <select className={`${inputCls} ${errors.gender ? "border-black bg-black/5" : ""}`} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.gender && <p className="text-xs text-black font-medium mt-1">{errors.gender}</p>}</div>
              <div><label className={labelCls}>Profile Photo</label>
                <PhotoPicker value={form.photoUrl} onChange={(url) => setForm({ ...form, photoUrl: url })} onRemove={() => setForm({ ...form, photoUrl: null })} size="w-20 h-20" placeholder={form.name ? initials(form.name) : null} hint="Optional. JPG or PNG." />
              </div>
            </div>
          </div>

          <div>
            <p className={sectionCls}>Membership</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className={labelCls}>Membership Plan</label>
                <select className={inputCls} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                  {!selectedPlan && <option value={form.plan}>{form.plan || "No plans available"}</option>}
                  {activePlans.map((p) => <option key={p.id} value={p.name}>{p.name} — ${p.price}</option>)}
                </select></div>
              <div><label className={labelCls}>Start Date</label>
                <input type="date" className={inputCls} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div><label className={labelCls}>Expiry Date</label>
                <input type="date" aria-label="Expiry Date" className={inputCls} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></div>
              <div className="sm:col-span-3"><label className={labelCls}>Preferred gym time</label>
                <select className={inputCls} value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}>
                  {["Morning", "Afternoon", "Evening", "Flexible"].map((t) => <option key={t}>{t}</option>)}
                </select></div>
            </div>
          </div>

          <div>
            <p className={sectionCls}>Internal notes</p>
            <div><label className={labelCls}>Private note (only you can see this)</label>
              <textarea rows={3} className={inputCls} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Prefers evening workouts. Payment usually made on the 5th." /></div>
          </div>

          <div>
            <p className={sectionCls}>Payment</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className={labelCls}>Amount Paid ($)</label>
                <input type="number" className={inputCls} value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} placeholder="0" /></div>
              <div><label className={labelCls}>Outstanding Balance ($)</label>
                <input type="number" className={inputCls} value={form.balanceOverride} onChange={(e) => setForm({ ...form, balanceOverride: e.target.value })} placeholder={String(Math.max(0, (selectedPlan?.price || 0) - (Number(form.amountPaid) || 0)))} /></div>
              <div><label className={labelCls}>Payment Method</label>
                <select className={inputCls} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                  {methodOptions.map((o) => <option key={o}>{o}</option>)}
                </select></div>
              <div><label className={labelCls}>Member Status</label>
                <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {statusOptions.map((o) => <option key={o}>{o}</option>)}
                </select></div>
            </div>
            <p className="text-xs text-black/40 mt-2">Outstanding balance auto-calculates from Plan Amount − Amount Paid. Enter a value only to override.</p>
          </div>
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