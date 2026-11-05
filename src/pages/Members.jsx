import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import Sheet from "@/components/ui/Sheet";
import ActionSelect from "@/components/ui/action-select";
import ConfirmDialog from "@/components/ConfirmDialog";
import PhoneNumberField from "@/components/PhoneNumberField";
import PhotoPicker from "@/components/PhotoPicker";
import MemberMetricCards from "@/components/members/MemberMetricCards";
import MemberRow from "@/components/members/MemberRow";
import { Check, ChevronDown, CreditCard, DollarSign, Loader2, Plus, RefreshCw, RotateCcw, Search, SlidersHorizontal, StickyNote, User, UserPlus, Users, X } from "lucide-react";
import { addMember, deleteMember, loadMembers, renewMember, updateMember, useGymAnalytics, useMembers, useMembersError, useMembersLoaded } from "@/lib/memberStore";
import { buildMemberMetrics, buildPaymentIndex, lastActivityFor, money, normalizePhone, planRate } from "@/lib/gymMetrics";
import { addDays, addMonths, gymToday } from "@/lib/gymTime";
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
  const loaded = useMembersLoaded();
  const loadError = useMembersError();
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

  // Editing a profile must never rewrite financial history, so the paid amount
  // and balance are read-only unless this is a new member or a renewal payment.
  const editingMember = useMemo(() => members.find((m) => String(m.id) === String(editingId || "")) || null, [members, editingId]);
  const locksFinancials = Boolean(editingId) && actionMode !== "renew";

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
    // The gym's own day, not UTC — between 00:00 and 03:00 local time the UTC
    // date is still yesterday, which backdated new memberships by a day.
    const today = gymToday();
    const expiry = addDays(today, 30);
    setForm({ ...emptyForm, plan: activePlans[0]?.name || emptyForm.plan, startDate: today, expiryDate: expiry });
    setErrors({});
    setModalOpen(true);
  };
  // A renewal opens a NEW period: it starts the day after the current expiry
  // when the member is still active, or today once they have lapsed, and runs
  // for the plan's own duration. Carrying the old start/expiry dates into the
  // form meant clicking "Renew" simply re-saved an expired period, and carrying
  // the old amount paid recorded that payment a second time.
  const renewalPeriod = (member) => {
    const today = gymToday();
    const expired = !member.expiryDate || member.expiryDate < today;
    const start = expired ? today : addDays(member.expiryDate, 1);
    const plan = activePlans.find((p) => p.name === member.plan);
    const months = Number(String(plan?.duration || "").replace(/[^\d]/g, "")) || 1;
    return { startDate: start, expiryDate: addMonths(start, months) };
  };

  const openEdit = (m, mode = "edit") => {
    const renewing = mode === "renew";
    const period = renewing ? renewalPeriod(m) : { startDate: m.startDate || m.registeredDate, expiryDate: m.expiryDate };
    setActionMode(mode);
    setEditingId(m.id);
    setForm({
      name: m.name, phone: m.phone, email: m.email || "", gender: m.gender || "", plan: m.plan,
      startDate: period.startDate, expiryDate: period.expiryDate,
      amount: String(m.fee || ""), amountPaid: renewing ? "" : String(m.amountPaid || ""),
      balanceOverride: !renewing && m.balanceOverride !== undefined && m.balanceOverride !== null ? String(m.balanceOverride) : "",
      paymentMethod: m.paymentMethod || "Cash", status: renewing ? "Active" : m.status,
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
    else if (duplicatePhoneMember) e.phone = "This phone number is already registered in the system.";
    if (!form.gender) e.gender = "Gender is required";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email address";
    if (!form.plan) e.plan = "Choose a membership plan";
    if (!form.startDate) e.startDate = "Registration date is required";
    if (!form.expiryDate) e.expiryDate = "Expiry date is required";
    else if (form.startDate && form.expiryDate < form.startDate) e.expiryDate = "Expiry must be on or after the start date";
    if (form.amountPaid !== "" && (!Number.isFinite(Number(form.amountPaid)) || Number(form.amountPaid) < 0)) e.amountPaid = "Enter an amount of 0 or more";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const submit = async () => {
    // The button is disabled while saving; this guard also covers a second
    // click or Enter keypress that lands before React re-renders.
    if (saving || !validate()) return;
    setSaving(true);
    // Profile edits never carry financial fields: the paid amount and balance
    // belong to the payment ledger, not to the personal details form.
    const payload = { ...form };
    if (editingId) delete payload.balanceOverride;
    if (editingId && actionMode !== "renew") delete payload.amountPaid;
    try {
      if (editingId) {
        if (actionMode === "renew") {
          await renewMember(editingId, payload);
          toast({ title: "Membership renewed", description: `${form.name}${Number(form.amountPaid) > 0 ? ` · payment of $${Number(form.amountPaid).toLocaleString()} recorded` : ""}` });
        } else {
          await updateMember(editingId, payload);
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

        {loadError && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            <span className="min-w-0">{loadError}</span>
            <button onClick={() => loadMembers(true)} className="shrink-0 font-semibold underline">Retry</button>
          </div>
        )}

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
            !loaded ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">Loading members…</div>
            ) : loadError ? (
              <div className="px-6 py-14 text-center">
                <p className="font-semibold">Members unavailable</p>
                <p className="mt-1 text-sm text-muted-foreground">Your member list could not be loaded.</p>
                <button onClick={() => loadMembers(true)} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><RotateCcw className="w-4 h-4" /> Retry</button>
              </div>
            ) : (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent"><Users className="w-6 h-6 text-muted-foreground" /></div>
                <p className="font-semibold">No members found</p>
                <p className="mt-1 text-sm text-muted-foreground">Try changing your search or filters.</p>
                <button onClick={clearFilters} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><RotateCcw className="w-4 h-4" /> Clear filters</button>
              </div>
            )
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  lastActivity={lastActivityFor(m, paymentIndex)}
                  rate={rateByPlan.get(m.plan)}
                  onOpen={(member) => { if (!member.pending) navigate(`/members/${member.id}`); }}
                  onEdit={(member) => openEdit(member)}
                  onDelete={(member) => setConfirmDelete(member.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Sheet
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
              <input type="email" className={`${input} ${errors.email ? "border-red-500/60" : ""}`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@olympicgym.com" />
              {errors.email && <p className="mt-1 text-xs font-medium text-red-400">{errors.email}</p>}
            </div>
            <div>
              <label className={label}>Gender *</label>
              <ActionSelect
                className={errors.gender ? "border-red-500/60" : ""}
                value={form.gender}
                onChange={(gender) => setForm({ ...form, gender })}
                placeholder="Select gender"
                ariaLabel="Gender"
                title="Select gender"
                options={["Male", "Female"]}
              />
              {errors.gender && <p className="mt-1 text-xs font-medium text-red-400">{errors.gender}</p>}
            </div>
            <div>
              <p className={label}>Profile Photo</p>
              <PhotoPicker value={form.photoUrl} onChange={(url) => setForm({ ...form, photoUrl: url })} onRemove={() => setForm({ ...form, photoUrl: null })} size="w-20 h-20" placeholder={form.name ? initials(form.name) : null} hint="Optional. JPG or PNG." />
            </div>
          </section>

          <section className="space-y-4 border-t border-border pt-5">
            <p className={sectionCls}><CreditCard className="w-3.5 h-3.5" /> Membership Information</p>
            {locksFinancials && Number(editingMember?.amountPaid || 0) > 0 && (
              <p className="rounded-xl border border-border bg-accent p-3 text-xs text-muted-foreground">
                This membership already has payments recorded. Changing the plan or dates updates the current period only — past periods, their prices and their payments stay exactly as recorded.
              </p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label className={label}>Membership Plan *</label>
                <ActionSelect
                  className={errors.plan ? "border-red-500/60" : ""}
                  value={form.plan}
                  onChange={(plan) => setForm({ ...form, plan })}
                  placeholder="No plans available"
                  ariaLabel="Membership plan"
                  title="Membership plan"
                  options={[
                    ...(!selectedPlan && form.plan ? [{ value: form.plan, label: form.plan }] : []),
                    ...activePlans.map((p) => ({ value: p.name, label: `${p.name} — $${p.price}` })),
                  ]}
                />
                {errors.plan && <p className="mt-1 text-xs font-medium text-red-400">{errors.plan}</p>}</div>
              <div><label className={label}>Preferred gym time</label>
                <ActionSelect value={form.preferredTime} onChange={(preferredTime) => setForm({ ...form, preferredTime })} ariaLabel="Preferred gym time" title="Preferred gym time" options={["Morning", "Afternoon", "Evening", "Flexible"]} /></div>
              <div><label className={label}>Registration Date *</label>
                <input type="date" className={`${input} ${errors.startDate ? "border-red-500/60" : ""}`} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                {errors.startDate && <p className="mt-1 text-xs font-medium text-red-400">{errors.startDate}</p>}</div>
              <div><label className={label}>Expiry Date *</label>
                <input type="date" aria-label="Expiry Date" className={`${input} ${errors.expiryDate ? "border-red-500/60" : ""}`} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                {errors.expiryDate && <p className="mt-1 text-xs font-medium text-red-400">{errors.expiryDate}</p>}</div>
            </div>
          </section>

          <section className="space-y-4 border-t border-border pt-5">
            <p className={sectionCls}><DollarSign className="w-3.5 h-3.5" /> Payment</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label className={label}>Amount Paid ($)</label>
                {locksFinancials ? (
                  <div className={`${input} tabular-nums`}>{money(editingMember?.amountPaid || 0)}</div>
                ) : (
                  <div>
                    <input type="number" min="0" step="0.01" className={`${input} ${errors.amountPaid ? "border-red-500/60" : ""}`} value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} placeholder="0" />
                    {errors.amountPaid && <p className="mt-1 text-xs font-medium text-red-400">{errors.amountPaid}</p>}
                  </div>
                )}</div>
              <div><label className={label}>Outstanding Balance ($)</label>
                {editingId ? (
                  <div className={`${input} tabular-nums`}>{money(editingMember?.balance || 0)}</div>
                ) : (
                  <input type="number" min="0" step="0.01" className={input} value={form.balanceOverride} onChange={(e) => setForm({ ...form, balanceOverride: e.target.value })} placeholder={String(Math.max(0, (selectedPlan?.price || 0) - (Number(form.amountPaid) || 0)))} />
                )}</div>
              <div><label className={label}>Payment Method</label>
                <ActionSelect value={form.paymentMethod} onChange={(paymentMethod) => setForm({ ...form, paymentMethod })} ariaLabel="Payment method" title="Payment method" options={methodOptions} /></div>
              <div><label className={label}>Member Status</label>
                <ActionSelect value={form.status} onChange={(status) => setForm({ ...form, status })} ariaLabel="Member status" title="Member status" options={statusOptions} /></div>
            </div>
            <p className="text-xs text-muted-foreground">
              {locksFinancials
                ? "Amount paid and outstanding balance come from recorded payments. Correct them on the Payments page so the ledger stays intact."
                : editingId
                  ? "This payment is added to the member's payment history; its allocation is shown on the Payments page."
                  : "Outstanding balance auto-calculates from Plan Amount − Amount Paid. Enter a value only to override."}
            </p>
          </section>

          <section className="space-y-4 border-t border-border pt-5">
            <p className={sectionCls}><StickyNote className="w-3.5 h-3.5" /> Internal notes</p>
            <div><label className={label}>Private note (only you can see this)</label>
              <textarea rows={3} className={textarea} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Prefers evening workouts. Payment usually made on the 5th." /></div>
          </section>
        </div>
      </Sheet>

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