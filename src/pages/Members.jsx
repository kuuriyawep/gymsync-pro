import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import PhoneNumberField from "@/components/PhoneNumberField";
import PhotoPicker from "@/components/PhotoPicker";
import MemberMetricCards from "@/components/members/MemberMetricCards";
import MemberRow from "@/components/members/MemberRow";
import { Check, ChevronDown, CreditCard, DollarSign, Loader2, Plus, RefreshCw, RotateCcw, Search, SlidersHorizontal, StickyNote, User, UserPlus, Users, X } from "lucide-react";
import { useMembers, useGymAnalytics, addMember, updateMember, renewMember, deleteMember } from "@/lib/memberStore";
import { buildMemberMetrics, buildPaymentIndex, lastActivityFor, normalizePhone, planRate } from "@/lib/gymMetrics";
import { ghostBtn, input, label, primaryBtn, textarea } from "@/lib/uiClasses";
import { useToast } from "@/components/ui/use-toast";

const sectionCls = "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

// The pills filter the member lifecycle status, the filter popover narrows by
// payment state — both applied to real member records.
const tabs = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "expiring", label: "Expiring Soon" },
  { key: "expired", label: "Expired" },
  { key: "pending", label: "Pending" },
];
const sortOptions = [
  { key: "recent", label: "Newest First" },
  { key: "name", label: "Name A-Z" },
  { key: "expiry", label: "Membership Expiry" },
  { key: "payment", label: "Payment Status" },
];
const payFilters = ["All", "Paid", "Pending", "Overdue"];
const methodOptions = ["Cash", "Mobile Money", "Card", "Other"];
const statusOptions = ["Active", "Expiring Soon", "Expired", "Suspended"];

const initials = (name) => String(name || "").split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const emptyForm = { name: "", phone: "", email: "", gender: "", plan: "Monthly", startDate: "", expiryDate: "", amount: "", amountPaid: "", balanceOverride: "", paymentMethod: "Cash", status: "Active", note: "", preferredTime: "Flexible", photoUrl: null };

export default function Members() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const members = useMembers();
  const analytics = useGymAnalytics();
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [payFilter, setPayFilter] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);
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

  const metrics = useMemo(
    () => buildMemberMetrics(members, analytics?.memberships || []),
    [members, analytics]
  );
  const paymentIndex = useMemo(() => buildPaymentIndex(analytics?.payments || []), [analytics]);
  const rateByPlan = useMemo(() => {
    const map = new Map();
    (analytics?.plans || []).forEach((plan) => map.set(plan.name, planRate(plan)));
    return map;
  }, [analytics]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = members.filter((m) => {
      const matchesQuery = !q || m.name.toLowerCase().includes(q) || (m.phone || "").toLowerCase().includes(q) || (m.memberId || "").toLowerCase().includes(q);
      const matchesTab = tab === "all"
        || (tab === "active" && m.status === "Active")
        || (tab === "expiring" && m.status === "Expiring Soon")
        || (tab === "expired" && m.status === "Expired")
        || (tab === "pending" && m.paymentStatus === "Pending");
      const matchesPayment = payFilter === "All" || m.paymentStatus === payFilter;
      return matchesQuery && matchesTab && matchesPayment;
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "expiry") return new Date(a.expiryDate) - new Date(b.expiryDate);
      if (sort === "payment") return a.paymentStatus.localeCompare(b.paymentStatus);
      return new Date(b.registeredDate) - new Date(a.registeredDate);
    });
    return list;
  }, [members, query, tab, payFilter, sort]);

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
  const clearFilters = () => { setQuery(""); setTab("all"); setPayFilter("All"); setSort("recent"); };

  const pillCls = (active) => `shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`;

  return (
    <Layout dark>
      <div className="space-y-4 text-foreground sm:space-y-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Members</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage your gym members and their memberships.</p>
        </div>

        {/* Search, filter and add */}
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
            <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members by name, phone or ID…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && <button onClick={() => setQuery("")} aria-label="Clear search" className="shrink-0 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
          </div>
          <div className="relative shrink-0">
            <button
              onClick={() => setFilterOpen((open) => !open)}
              aria-label="Filter members by payment status"
              aria-expanded={filterOpen}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${payFilter !== "All" ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            {filterOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setFilterOpen(false)} />
                <div className="absolute right-0 top-12 z-40 w-48 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-xl">
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Payment status</p>
                  {payFilters.map((option) => (
                    <button key={option} onClick={() => { setPayFilter(option); setFilterOpen(false); }} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent">
                      {option}
                      {payFilter === option && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button onClick={openAdd} className={`${primaryBtn} shrink-0 !px-3`}>
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>

        <MemberMetricCards metrics={metrics} />

        {/* Lifecycle tabs + sort */}
        <div className="flex items-center gap-2">
          <div className="-mb-1 flex flex-1 items-center gap-1.5 overflow-x-auto pb-1">
            {tabs.map((item) => (
              <button key={item.key} onClick={() => setTab(item.key)} aria-pressed={tab === item.key} className={pillCls(tab === item.key)}>{item.label}</button>
            ))}
          </div>
          <div className="relative shrink-0">
            <button onClick={() => setSortOpen((open) => !open)} className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              {sortOptions.find((option) => option.key === sort)?.label} <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-10 z-40 w-48 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-xl">
                  {sortOptions.map((option) => (
                    <button key={option.key} onClick={() => { setSort(option.key); setSortOpen(false); }} className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent ${sort === option.key ? "font-semibold" : ""}`}>
                      {option.label}
                      {sort === option.key && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Member list */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {filtered.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10"><Users className="w-6 h-6 text-muted-foreground" /></div>
              <p className="font-semibold">No members found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try changing your search or filters.</p>
              <button onClick={clearFilters} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><RotateCcw className="w-4 h-4" /> Clear filters</button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  lastActivity={lastActivityFor(m, paymentIndex)}
                  rate={rateByPlan.get(m.plan)}
                  onOpen={(member) => navigate(`/members/${member.id}`)}
                  onEdit={(member) => openEdit(member)}
                  onDelete={(member) => setConfirmDelete(member.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={actionMode === "renew" ? "Renew Membership" : editingId ? "Edit Member" : "Add New Member"}
        subtitle={actionMode === "renew" ? "Extend the member's membership and keep them active." : editingId ? "Update this member's details and membership." : "Fill in the member details to register them in your gym."}
        icon={actionMode === "renew" ? RefreshCw : UserPlus}
        footer={<>
          <button onClick={() => setModalOpen(false)} className={ghostBtn}>Cancel</button>
          <button onClick={submit} disabled={saving} className={primaryBtn}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : actionMode === "renew" ? <><RefreshCw className="w-4 h-4" /> Renew Membership</> : editingId ? "Save Changes" : <><UserPlus className="w-4 h-4" /> Add Member</>}
          </button>
        </>}>
        <div className="space-y-6">
          <section className="space-y-4">
            <p className={sectionCls}><User className="w-3.5 h-3.5" /> Personal Information</p>
            <div>
              <label className={label}>Full Name *</label>
              <input className={`${input} ${errors.name ? "border-red-500/60" : ""}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              {errors.name && <p className="mt-1 text-xs font-medium text-red-400">{errors.name}</p>}
            </div>
            <div>
              <label className={label}>Phone Number *</label>
              <PhoneNumberField
                key={`${modalOpen}-${editingId || "new"}`}
                value={form.phone}
                onChange={(phone) => setForm((current) => ({ ...current, phone }))}
                error={errors.phone}
              />
              {errors.phone && <p className="mt-1 text-xs font-medium text-red-400">{errors.phone}</p>}
              {duplicatePhoneMember && (
                <p className="mt-1.5 text-xs font-medium text-red-400">This phone number is already registered in the system.</p>
              )}
            </div>
            <div>
              <label className={label}>Email (optional)</label>
              <input type="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@olympicgym.com" />
            </div>
            <div>
              <label className={label}>Gender *</label>
              <select className={`${input} ${errors.gender ? "border-red-500/60" : ""}`} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.gender && <p className="mt-1 text-xs font-medium text-red-400">{errors.gender}</p>}
            </div>
            <div>
              <p className={label}>Profile Photo</p>
              <PhotoPicker value={form.photoUrl} onChange={(url) => setForm({ ...form, photoUrl: url })} onRemove={() => setForm({ ...form, photoUrl: null })} size="w-20 h-20" placeholder={form.name ? initials(form.name) : null} hint="Optional. JPG or PNG." />
            </div>
          </section>

          <section className="space-y-4 border-t border-border pt-5">
            <p className={sectionCls}><CreditCard className="w-3.5 h-3.5" /> Membership Information</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label className={label}>Membership Plan *</label>
                <select className={input} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                  {!selectedPlan && <option value={form.plan}>{form.plan || "No plans available"}</option>}
                  {activePlans.map((p) => <option key={p.id} value={p.name}>{p.name} — ${p.price}</option>)}
                </select></div>
              <div><label className={label}>Preferred gym time</label>
                <select className={input} value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}>
                  {["Morning", "Afternoon", "Evening", "Flexible"].map((t) => <option key={t}>{t}</option>)}
                </select></div>
              <div><label className={label}>Registration Date *</label>
                <input type="date" className={input} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div><label className={label}>Expiry Date *</label>
                <input type="date" aria-label="Expiry Date" className={input} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></div>
            </div>
          </section>

          <section className="space-y-4 border-t border-border pt-5">
            <p className={sectionCls}><DollarSign className="w-3.5 h-3.5" /> Payment</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label className={label}>Amount Paid ($)</label>
                <input type="number" className={input} value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} placeholder="0" /></div>
              <div><label className={label}>Outstanding Balance ($)</label>
                <input type="number" className={input} value={form.balanceOverride} onChange={(e) => setForm({ ...form, balanceOverride: e.target.value })} placeholder={String(Math.max(0, (selectedPlan?.price || 0) - (Number(form.amountPaid) || 0)))} /></div>
              <div><label className={label}>Payment Method</label>
                <select className={input} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                  {methodOptions.map((o) => <option key={o}>{o}</option>)}
                </select></div>
              <div><label className={label}>Member Status</label>
                <select className={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {statusOptions.map((o) => <option key={o}>{o}</option>)}
                </select></div>
            </div>
            <p className="text-xs text-muted-foreground">Outstanding balance auto-calculates from Plan Amount − Amount Paid. Enter a value only to override.</p>
          </section>

          <section className="space-y-4 border-t border-border pt-5">
            <p className={sectionCls}><StickyNote className="w-3.5 h-3.5" /> Internal notes</p>
            <div><label className={label}>Private note (only you can see this)</label>
              <textarea rows={3} className={textarea} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Prefers evening workouts. Payment usually made on the 5th." /></div>
          </section>
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