import { createClientFromRequest } from "npm:@base44/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://wheeaxbuxpuhgcabcskv.supabase.co";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const json = (body: unknown, status = 200) => Response.json(body, { status });
const clean = (value: unknown, max = 500) => String(value ?? "").trim().slice(0, max);
const emailOf = (value: unknown) => clean(value, 320).toLowerCase();
const fail = (message: string, status = 400) => json({ error: message }, status);

function requireSupabase() {
  if (!SUPABASE_KEY) throw new Error("Supabase backend secret is not configured. Add SUPABASE_SECRET_KEY to Base44 Secrets.");
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function currentUser(req: Request) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.is_service) throw new Error("Unauthorized");
  return { base44, user };
}

async function getContext(supabase: any, user: any) {
  const uid = clean(user.id, 200);
  const email = emailOf(user.email);

  let { data: profile, error } = await supabase.from("profiles").select("*").eq("base44_user_id", uid).maybeSingle();
  if (error) throw error;

  if (!profile && email) {
    const staff = await supabase.from("staff").select("*").eq("email", email).in("status", ["active", "invited"]).maybeSingle();
    if (staff.data) {
      await supabase.from("staff").update({ base44_user_id: uid, status: "active", joined_at: staff.data.joined_at || new Date().toISOString() }).eq("id", staff.data.id);
      const linked = await supabase.from("profiles").select("*").eq("email", email).maybeSingle();
      if (linked.data) {
        const updated = await supabase.from("profiles").update({ base44_user_id: uid, gym_id: staff.data.gym_id, role: "staff", staff_role: staff.data.role, full_name: user.full_name || staff.data.full_name, email }).eq("id", linked.data.id).select("*").single();
        if (updated.error) throw updated.error;
        profile = updated.data;
      } else {
        const created = await supabase.from("profiles").insert({ gym_id: staff.data.gym_id, role: "staff", staff_role: staff.data.role, full_name: user.full_name || staff.data.full_name, email, base44_user_id: uid }).select("*").single();
        if (created.error) throw created.error;
        profile = created.data;
      }
    }
  }

  if (!profile && email) {
    const member = await supabase.from("members").select("*").eq("email", email).is("base44_user_id", null).maybeSingle();
    if (member.data) {
      const linked = await supabase.from("members").update({ base44_user_id: uid }).eq("id", member.data.id).select("*").single();
      if (linked.error) throw linked.error;
      const created = await supabase.from("profiles").insert({ gym_id: member.data.gym_id, role: "member", full_name: member.data.full_name, email, phone: member.data.phone, avatar_url: member.data.avatar_url, base44_user_id: uid }).select("*").single();
      if (created.error) throw created.error;
      profile = created.data;
    }
  }

  let member = null;
  if (profile?.role === "member") {
    const result = await supabase.from("members").select("*").eq("base44_user_id", uid).maybeSingle();
    if (result.error) throw result.error;
    member = result.data;
  }
  return { uid, email, profile, member };
}

function roleIs(context: any, roles: string[]) {
  return Boolean(context.profile && roles.includes(context.profile.role));
}

function staffRole(context: any) {
  return context.profile?.role === "staff" ? String(context.profile.staff_role || "").toLowerCase() : "";
}

function can(context: any, capability: string) {
  if (context.profile?.role === "owner") return true;
  if (context.profile?.role !== "staff") return false;
  const role = staffRole(context);
  const map: Record<string, string[]> = {
    members: ["manager", "front_desk"],
    payments: ["manager", "cashier"],
    attendance: ["manager", "front_desk", "trainer"],
    reports: ["manager"],
    plans: ["manager"],
    staff: [],
    settings: [],
    trainers: ["manager"],
    feedback: ["manager", "front_desk"],
  };
  return (map[capability] || []).includes(role);
}

async function gymFor(supabase: any, context: any) {
  const gymId = context.profile?.gym_id;
  if (!gymId) throw new Error("No gym workspace is linked to this account");
  const { data, error } = await supabase.from("gyms").select("*").eq("id", gymId).single();
  if (error) throw error;
  return data;
}

function titleStatus(value: string) {
  const map: Record<string, string> = { active: "Active", "expiring soon": "Expiring Soon", expired: "Expired", suspended: "Suspended", inactive: "Inactive", paid: "Paid", pending: "Pending", overdue: "Overdue" };
  return map[String(value || "").toLowerCase()] || value || "Active";
}

async function loadOwnerData(supabase: any, context: any) {
  if (!can(context, "members")) throw new Error("You do not have access to gym management data");
  const gym = await gymFor(supabase, context);
  const [membersRes, plansRes, membershipsRes, paymentsRes] = await Promise.all([
    supabase.from("members").select("*").eq("gym_id", gym.id).order("created_at", { ascending: false }),
    supabase.from("membership_plans").select("*").eq("gym_id", gym.id).order("created_at", { ascending: true }),
    supabase.from("memberships").select("*").eq("gym_id", gym.id).order("created_at", { ascending: false }),
    supabase.from("payments").select("*").eq("gym_id", gym.id).order("paid_at", { ascending: false }),
  ]);
  for (const result of [membersRes, plansRes, membershipsRes, paymentsRes]) if (result.error) throw result.error;

  const plans = plansRes.data || [];
  const memberships = membershipsRes.data || [];
  const payments = paymentsRes.data || [];
  const planMap = new Map(plans.map((p: any) => [p.id, p]));
  const latestMembership = new Map<string, any>();
  for (const item of memberships) if (!latestMembership.has(item.member_id)) latestMembership.set(item.member_id, item);
  const latestPayment = new Map<string, any>();
  for (const item of payments) if (!latestPayment.has(item.member_id)) latestPayment.set(item.member_id, item);

  const mappedMembers = (membersRes.data || []).map((m: any) => {
    const membership = latestMembership.get(m.id);
    const payment = latestPayment.get(m.id);
    const plan = membership ? planMap.get(membership.plan_id) : null;
    const paymentStatus = payment ? (Number(payment.amount || 0) <= 0 ? "Paid" : Number(payment.amount || 0) === Number(payment.amount_paid || payment.amount || 0) ? "Paid" : "Pending") : "Pending";
    return {
      id: m.id,
      memberId: m.member_code || `GYM-${m.id.slice(0, 4).toUpperCase()}`,
      name: m.full_name,
      phone: m.phone || "",
      email: m.email || "",
      photoUrl: m.avatar_url || null,
      status: titleStatus(m.status),
      registeredDate: m.joined_at?.slice(0, 10) || m.created_at?.slice(0, 10),
      createdAt: m.created_at,
      startDate: membership?.start_date || m.joined_at?.slice(0, 10),
      expiryDate: membership?.end_date || null,
      plan: plan?.name || "Monthly",
      fee: Number(membership?.amount_due ?? plan?.price ?? gym.membership_default_price ?? 0),
      paymentStatus,
      paymentMethod: payment?.method || "Cash",
      note: m.notes || "",
      preferredTime: m.registration_time || "Flexible",
    };
  });

  const mappedPlans = plans.map((p: any) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price || 0),
    duration: `${p.duration_months} month${p.duration_months === 1 ? "" : "s"}`,
    durationMonths: p.duration_months,
    status: p.is_active ? "Active" : "Inactive",
    activeMembers: memberships.filter((m: any) => m.plan_id === p.id && m.status !== "expired").length,
  }));

  const mappedPayments = payments.map((p: any) => ({
    id: p.id,
    memberId: p.member_id,
    memberName: mappedMembers.find((m: any) => m.id === p.member_id)?.name || "Unknown",
    amount: Number(p.amount || 0),
    amountPaid: Number(p.amount || 0),
    balance: 0,
    method: p.method || "cash",
    paidAt: p.paid_at,
    reference: p.reference || "",
    note: p.note || "",
    status: "Paid",
  }));

  return { gym, members: mappedMembers, analytics: { payments: mappedPayments, memberships, plans: mappedPlans, recentActivities: [] } };
}

async function completeOnboarding(supabase: any, user: any, body: any) {
  if (body?.role && body.role !== "owner") throw new Error("Only a gym owner can create a gym workspace");
  const onboardingData = body?.onboardingData || {};
  if (onboardingData.role && onboardingData.role !== "owner") throw new Error("Only a gym owner can create a gym workspace");
  const { data, error } = await supabase.rpc("complete_owner_onboarding_base44", {
    p_base44_user_id: clean(user.id, 200),
    p_email: emailOf(user.email),
    p_full_name: clean(user.full_name, 160),
    p_gym_name: clean(body.gymName, 160),
    p_location: clean(body.location, 240),
    p_logo_url: body.logoUrl ? clean(body.logoUrl, 2000) : null,
    p_onboarding_data: onboardingData,
  });
  if (error) throw error;
  return { gymId: data };
}

async function createMember(supabase: any, context: any, body: any) {
  if (!can(context, "members")) throw new Error("You do not have permission to add members");
  const gym = await gymFor(supabase, context);
  const name = clean(body?.member?.name, 160);
  const phone = clean(body?.member?.phone, 40);
  if (!name || !phone) throw new Error("Full name and phone are required");
  const code = await nextMemberCode(supabase, gym.id);
  const memberPayload = {
    gym_id: gym.id,
    member_code: code,
    full_name: name,
    phone,
    email: body.member.email ? emailOf(body.member.email) : null,
    avatar_url: body.member.photoUrl || null,
    joined_at: body.member.startDate ? new Date(`${body.member.startDate}T00:00:00Z`).toISOString() : new Date().toISOString(),
    registration_time: normalizeRegistrationTime(body.member.preferredTime),
    notes: clean(body.member.note, 1000) || null,
    status: memberStatus(body.member.status || "Active"),
  };
  const created = await supabase.from("members").insert(memberPayload).select("*").single();
  if (created.error) throw created.error;
  const member = created.data;

  const duration = Number(body.member.durationMonths || 1);
  const startDate = body.member.startDate || new Date().toISOString().slice(0, 10);
  const expiryDate = body.member.expiryDate || new Date(Date.parse(`${startDate}T00:00:00Z`) + duration * 30 * 86400000).toISOString().slice(0, 10);
  const plan = await findOrCreatePlan(supabase, gym.id, body.member.plan || "Monthly", Number(body.member.amount || gym.membership_default_price || 15), duration);
  const membership = await supabase.from("memberships").insert({ gym_id: gym.id, member_id: member.id, plan_id: plan.id, start_date: startDate, end_date: expiryDate, amount_due: Number(body.member.amount || plan.price || 0), amount_paid: body.member.paymentStatus === "Paid" ? Number(body.member.amount || plan.price || 0) : 0, status: membershipStatus(body.member.status || "Active"), auto_renew: false }).select("*").single();
  if (membership.error) throw membership.error;

  if (body.member.paymentStatus === "Paid" && Number(body.member.amount || 0) > 0) {
    const payment = await supabase.from("payments").insert({ gym_id: gym.id, member_id: member.id, membership_id: membership.data.id, amount: Number(body.member.amount), currency: gym.currency || "USD", method: normalizePaymentMethod(body.member.paymentMethod), paid_at: body.member.startDate ? new Date(`${body.member.startDate}T00:00:00Z`).toISOString() : new Date().toISOString(), recorded_by: null, note: clean(body.member.note, 1000) || null }).select("*").single();
    if (payment.error) throw payment.error;
  }
  return (await loadOwnerData(supabase, context)).members;
}

async function nextMemberCode(supabase: any, gymId: string) {
  const { data } = await supabase.from("members").select("member_code").eq("gym_id", gymId).not("member_code", "is", null);
  const nums = (data || []).map((row: any) => Number(String(row.member_code).replace(/\D/g, ""))).filter(Number.isFinite);
  const next = Math.max(1000, ...nums, 1000) + 1;
  return `GYM-${next}`;
}

function memberStatus(value: string) { const v = String(value || "active").toLowerCase(); if (v === "expired") return "expired"; if (v === "pending") return "pending"; if (v === "suspended") return "suspended"; return "active"; }
function membershipStatus(value: string) { const v = String(value || "active").toLowerCase(); if (["expired", "pending", "cancelled"].includes(v)) return v; return "active"; }
function normalizeRegistrationTime(value: unknown) { const v = String(value || "").toLowerCase(); return ["morning", "afternoon", "evening", "night"].includes(v) ? v : null; }
function normalizePaymentMethod(value: unknown) { const v = String(value || "cash").toLowerCase().replace(/\s+/g, "_"); return ["cash", "card", "bank_transfer", "mobile_money", "other"].includes(v) ? v : "other"; }
function normalizeFeedbackType(value: unknown) { const v = String(value || "feedback").toLowerCase().replace(/\s+/g, "_"); const map: Record<string,string> = { feedback:"feedback", complaint:"complaint", feature_request:"feature_request", bug:"bug", coach_request:"coach_request", machine_request:"machine_request", other:"other" }; return map[v] || "other"; }
function feedbackStatus(value: unknown) { const v=String(value||"").toLowerCase(); if(v==="in_progress") return "In Progress"; if(v==="resolved"||v==="closed") return "Resolved"; return "Open"; }

async function findOrCreatePlan(supabase: any, gymId: string, name: string, price: number, durationMonths: number) {
  const existing = await supabase.from("membership_plans").select("*").eq("gym_id", gymId).eq("name", name).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;
  const created = await supabase.from("membership_plans").insert({ gym_id: gymId, name, price, duration_months: Math.max(1, durationMonths), is_active: true }).select("*").single();
  if (created.error) throw created.error;
  return created.data;
}

async function updateMember(supabase: any, context: any, body: any) {
  if (!can(context, "members")) throw new Error("You do not have permission to update members");
  const gym = await gymFor(supabase, context);
  const id = clean(body.id, 80);
  const patch = body.member || {};
  const update: Record<string, unknown> = {};
  if (patch.name != null) update.full_name = clean(patch.name, 160);
  if (patch.phone != null) update.phone = clean(patch.phone, 40);
  if (patch.email != null) update.email = patch.email ? emailOf(patch.email) : null;
  if (patch.photoUrl !== undefined) update.avatar_url = patch.photoUrl || null;
  if (patch.note !== undefined) update.notes = clean(patch.note, 1000) || null;
  if (patch.preferredTime !== undefined) update.registration_time = patch.preferredTime || null;
  if (patch.status != null) update.status = String(patch.status).toLowerCase();
  const result = await supabase.from("members").update(update).eq("id", id).eq("gym_id", gym.id).select("*").single();
  if (result.error) throw result.error;
  if (patch.startDate || patch.expiryDate || patch.plan || patch.amount != null) {
    const latest = await supabase.from("memberships").select("*").eq("member_id", id).eq("gym_id", gym.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (latest.error) throw latest.error;
    if (latest.data) {
      const membershipPatch: Record<string, unknown> = {};
      if (patch.startDate) membershipPatch.start_date = patch.startDate;
      if (patch.expiryDate) membershipPatch.end_date = patch.expiryDate;
      if (patch.amount != null) membershipPatch.amount_due = Number(patch.amount || 0);
      const updatedMembership = await supabase.from("memberships").update(membershipPatch).eq("id", latest.data.id).eq("gym_id", gym.id);
      if (updatedMembership.error) throw updatedMembership.error;
    }
  }
  return (await loadOwnerData(supabase, context)).members;
}

async function deleteMember(supabase: any, context: any, id: string) {
  if (context.profile?.role !== "owner") throw new Error("Only the gym owner can delete members");
  const gym = await gymFor(supabase, context);
  const result = await supabase.from("members").delete().eq("id", clean(id, 80)).eq("gym_id", gym.id);
  if (result.error) throw result.error;
  return (await loadOwnerData(supabase, context)).members;
}

async function recordPayment(supabase: any, context: any, body: any) {
  if (!can(context, "payments")) throw new Error("You do not have permission to record payments");
  const gym = await gymFor(supabase, context);
  const memberId = clean(body.payment?.memberId, 80);
  const amount = Number(body.payment?.amount);
  if (!memberId || !Number.isFinite(amount) || amount <= 0) throw new Error("Valid member and payment amount are required");
  const membership = await supabase.from("memberships").select("*").eq("member_id", memberId).eq("gym_id", gym.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (membership.error) throw membership.error;
  const payment = await supabase.from("payments").insert({ gym_id: gym.id, member_id: memberId, membership_id: membership.data?.id || null, amount, currency: gym.currency || "USD", method: String(body.payment.method || "Cash").toLowerCase().replace(/\s+/g, "_"), paid_at: body.payment.date ? new Date(`${body.payment.date}T00:00:00Z`).toISOString() : new Date().toISOString(), recorded_by: null, note: clean(body.payment.notes, 1000) || null, reference: clean(body.payment.reference, 200) || null }).select("*").single();
  if (payment.error) throw payment.error;
  if (membership.data) {
    const newPaid = Number(membership.data.amount_paid || 0) + amount;
    const newBalance = Math.max(0, Number(membership.data.amount_due || 0) - newPaid);
    await supabase.from("memberships").update({ amount_paid: newPaid }).eq("id", membership.data.id).eq("gym_id", gym.id);
    
  }
  return (await loadOwnerData(supabase, context)).analytics;
}

async function membershipPlans(supabase: any, context: any, operation: string, body: any) {
  if (!can(context, "plans")) throw new Error("You do not have permission to manage membership plans");
  const gym = await gymFor(supabase, context);
  if (operation === "list") return (await loadOwnerData(supabase, context)).analytics.plans;
  if (operation === "create") {
    const p = body.plan || {};
    const result = await supabase.from("membership_plans").insert({ gym_id: gym.id, name: clean(p.name, 120), price: Number(p.price || 0), duration_months: Number(p.duration || 1), is_active: String(p.status || "Active") === "Active" }).select("*").single();
    if (result.error) throw result.error;
  } else if (operation === "update") {
    const p = body.plan || {};
    const result = await supabase.from("membership_plans").update({ name: clean(p.name, 120), price: Number(p.price || 0), duration_months: Number(p.duration || 1), is_active: String(p.status || "Active") === "Active" }).eq("id", clean(body.id, 80)).eq("gym_id", gym.id);
    if (result.error) throw result.error;
  } else if (operation === "toggle") {
    const existing = await supabase.from("membership_plans").select("is_active").eq("id", clean(body.id, 80)).eq("gym_id", gym.id).single();
    if (existing.error) throw existing.error;
    const result = await supabase.from("membership_plans").update({ is_active: !existing.data.is_active }).eq("id", clean(body.id, 80)).eq("gym_id", gym.id);
    if (result.error) throw result.error;
  }
  return (await loadOwnerData(supabase, context)).analytics.plans;
}

async function staffAccess(supabase: any, base44: any, context: any, operation: string, body: any) {
  if (context.profile?.role !== "owner") throw new Error("Only the gym owner can manage staff access");
  const gym = await gymFor(supabase, context);
  if (operation === "list") {
    const result = await supabase.from("staff").select("*").eq("gym_id", gym.id).order("created_at", { ascending: false });
    if (result.error) throw result.error;
    return (result.data || []).map((item: any) => ({ ...item, name: item.full_name, lastActive: item.joined_at ? new Date(item.joined_at).toLocaleDateString() : "Invited", role: item.role.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) }));
  }
  if (operation === "invite") {
    const email = emailOf(body.email);
    const role = String(body.role || "Front Desk").toLowerCase().replace(/\s+/g, "_");
    if (!email) throw new Error("Email is required");
    if (!["manager", "front_desk", "cashier", "trainer"].includes(role)) throw new Error("Invalid staff role");
    await base44.auth.inviteUser(email, "user");
    const result = await supabase.from("staff").upsert({ gym_id: gym.id, email, role, full_name: email.split("@")[0], permissions: [], status: "invited", invited_at: new Date().toISOString() }, { onConflict: "gym_id,email" }).select("*").single();
    if (result.error) throw result.error;
    return (await staffAccess(supabase, base44, context, "list", {}));
  }
  if (operation === "revoke") {
    const result = await supabase.from("staff").update({ status: "revoked" }).eq("id", clean(body.id, 80)).eq("gym_id", gym.id);
    if (result.error) throw result.error;
    return (await staffAccess(supabase, base44, context, "list", {}));
  }
}

async function trainers(supabase: any, context: any, operation: string, body: any) {
  if (!can(context, "trainers")) throw new Error("You do not have permission to manage trainers");
  const gym = await gymFor(supabase, context);
  if (operation === "list") {
    const result = await supabase.from("staff").select("*").eq("gym_id", gym.id).eq("role", "trainer").order("created_at", { ascending: false });
    if (result.error) throw result.error;
    return (result.data || []).map((t: any) => ({ ...t, name: t.full_name, specialization: t.shift || "", joinDate: t.joined_at?.slice(0, 10) || t.created_at?.slice(0, 10), status: titleStatus(t.status), assigned: 0, assignedMembers: [], activity: [] }));
  }
  if (operation === "create") {
    const t = body.trainer || {};
    const result = await supabase.from("staff").insert({ gym_id: gym.id, full_name: clean(t.name, 160), phone: clean(t.phone, 40) || null, email: emailOf(t.email) || null, role: "trainer", permissions: [], status: "active", shift: clean(t.specialization, 120) || null, joined_at: t.joinDate ? new Date(`${t.joinDate}T00:00:00Z`).toISOString() : new Date().toISOString() }).select("*").single();
    if (result.error) throw result.error;
  } else if (operation === "update") {
    const t = body.trainer || {};
    const result = await supabase.from("staff").update({ full_name: clean(t.name, 160), phone: clean(t.phone, 40) || null, email: emailOf(t.email) || null, shift: clean(t.specialization, 120) || null, status: String(t.status || "Active").toLowerCase() === "inactive" ? "revoked" : "active", joined_at: t.joinDate ? new Date(`${t.joinDate}T00:00:00Z`).toISOString() : undefined }).eq("id", clean(body.id, 80)).eq("gym_id", gym.id).eq("role", "trainer");
    if (result.error) throw result.error;
  } else if (operation === "toggle") {
    const existing = await supabase.from("staff").select("status").eq("id", clean(body.id, 80)).eq("gym_id", gym.id).eq("role", "trainer").single();
    if (existing.error) throw existing.error;
    const result = await supabase.from("staff").update({ status: existing.data.status === "active" ? "revoked" : "active" }).eq("id", clean(body.id, 80)).eq("gym_id", gym.id);
    if (result.error) throw result.error;
  } else if (operation === "delete") {
    const result = await supabase.from("staff").delete().eq("id", clean(body.id, 80)).eq("gym_id", gym.id).eq("role", "trainer");
    if (result.error) throw result.error;
  }
  return trainers(supabase, context, "list", {});
}

async function memberPortal(supabase: any, context: any, operation: string, body: any) {
  if (context.profile?.role !== "member" || !context.member) throw new Error("Membership account is not linked to a gym");
  const member = context.member;
  const gym = await gymFor(supabase, context);
  const membershipRes = await supabase.from("memberships").select("*, membership_plans(*)").eq("member_id", member.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (membershipRes.error) throw membershipRes.error;
  const paymentsRes = await supabase.from("payments").select("*").eq("member_id", member.id).order("paid_at", { ascending: false });
  const attendanceRes = await supabase.from("attendance").select("*").eq("member_id", member.id).order("check_in_at", { ascending: false }).limit(400);
  const feedbackRes = await supabase.from("feedback_requests").select("*").eq("member_id", member.id).order("created_at", { ascending: false });
  const notificationsRes = await supabase.from("notifications").select("*").eq("member_id", member.id).order("created_at", { ascending: false }).limit(50);
  for (const result of [paymentsRes, attendanceRes, feedbackRes, notificationsRes]) if (result.error) throw result.error;
  const membership = membershipRes.data;
  const plan = membership?.membership_plans;
  const payments = paymentsRes.data || [];
  const paid = payments.reduce((sum: number, p: any) => sum + Number(p.amount_paid ?? p.amount ?? 0), 0);
  const price = Number(membership?.amount_due ?? plan?.price ?? gym.membership_default_price ?? 0);
  const balance = Math.max(0, price - paid);
  const data = {
    profile: { name: member.full_name, memberId: member.member_code, gym: gym.name, phone: member.phone, email: member.email, photoUrl: member.avatar_url, avatar: member.full_name.split(" ").map((x: string) => x[0]).join("").slice(0,2).toUpperCase(), joinDate: member.joined_at?.slice(0,10) },
    membership: { plan: plan?.name || "Membership", price, startDate: membership?.start_date || member.joined_at?.slice(0,10), expiryDate: membership?.end_date, status: titleStatus(membership?.status || member.status) },
    balance: { price, paid, balance, status: balance <= 0 ? "Paid" : "Balance Due", renewalDate: membership?.end_date },
    payments: payments.map((p: any) => ({ id: p.id, amount: Number(p.amount_paid ?? p.amount ?? 0), method: p.method || "cash", date: p.paid_at?.slice(0,10), reference: p.reference || "" })),
    attendance: (attendanceRes.data || []).map((a: any) => ({ id: a.id, checkedInAt: a.check_in_at, date: a.check_in_at?.slice(0,10) })),
    feedback: (feedbackRes.data || []).map((f: any) => ({ id: f.id, type: f.type, title: f.subject || f.title || "Request", body: f.message || f.body || "", status: feedbackStatus(f.status), response: f.response || null, date: f.created_at?.slice(0,10) })),
    notifications: (notificationsRes.data || []).map((n: any) => ({ id: n.id, title: n.title, description: n.message || n.body || "", read: Boolean(n.read_at), createdAt: n.created_at })),
  };
  if (operation === "get") return data;
  if (operation === "feedback") {
    const f = body.feedback || {};
    const created = await supabase.from("feedback_requests").insert({ gym_id: gym.id, member_id: member.id, user_id: null, channel: "gym", type: normalizeFeedbackType(f.type), subject: clean(f.title, 160), message: clean(f.body, 2000), status: "open", priority: "normal" }).select("*").single();
    if (created.error) throw created.error;
    return memberPortal(supabase, context, "get", {});
  }
  if (operation === "notificationRead") {
    const result = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", clean(body.id, 80)).eq("member_id", member.id);
    if (result.error) throw result.error;
    return memberPortal(supabase, context, "get", {});
  }
}

async function joinGym(supabase: any, user: any, body: any) {
  const phone = clean(body.phone, 40);
  const fullName = clean(body.fullName, 160);
  if (!phone || !fullName) throw new Error("Phone number and full name are required");
  const result = await supabase.from("members").select("*").eq("phone", phone).ilike("full_name", fullName).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) throw new Error("We could not find a matching gym membership");
  if (result.data.base44_user_id && result.data.base44_user_id !== user.id) throw new Error("This membership is already linked to another account");
  const updated = await supabase.from("members").update({ base44_user_id: user.id, email: emailOf(user.email) || result.data.email }).eq("id", result.data.id).select("*").single();
  if (updated.error) throw updated.error;
  const profile = await supabase.from("profiles").upsert({ gym_id: result.data.gym_id, role: "member", full_name: result.data.full_name, email: emailOf(user.email) || result.data.email, phone: result.data.phone, avatar_url: result.data.avatar_url, base44_user_id: user.id }, { onConflict: "base44_user_id" }).select("*").single();
  if (profile.error) throw profile.error;
  return { memberId: result.data.id, gymId: result.data.gym_id };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return fail("POST required", 405);
    const { user, base44 } = await currentUser(req);
    const supabase = requireSupabase();
    const body = await req.json().catch(() => ({}));
    const operation = clean(body.operation, 80);

    if (operation === "completeOnboarding") return json(await completeOnboarding(supabase, user, body));
    if (operation === "join") return json(await joinGym(supabase, user, body));

    const context = await getContext(supabase, user);
    if (!context.profile) return json({ profile: null, onboardingRequired: true }, 200);

    if (operation === "context") return json({ profile: context.profile, member: context.member });
    if (operation === "bootstrap") return json(await loadOwnerData(supabase, context));
    if (operation === "getGymProfile") return json(await gymFor(supabase, context));
    if (operation === "updateGymProfile") {
      if (context.profile.role !== "owner") throw new Error("Only the gym owner can update gym settings");
      const gym = await gymFor(supabase, context);
      const patch = body.gym || {};
      const result = await supabase.from("gyms").update({ name: clean(patch.name, 160), phone: clean(patch.phone, 40) || null, email: emailOf(patch.email) || null, address: clean(patch.address, 240) || null, logo_url: patch.logoUrl || null }).eq("id", gym.id).select("*").single();
      if (result.error) throw result.error;
      return json(result.data);
    }
    if (operation === "create") return json({ members: await createMember(supabase, context, body), analytics: (await loadOwnerData(supabase, context)).analytics });
    if (operation === "update") return json({ members: await updateMember(supabase, context, body), analytics: (await loadOwnerData(supabase, context)).analytics });
    if (operation === "delete") return json({ members: await deleteMember(supabase, context, body.id), analytics: (await loadOwnerData(supabase, context)).analytics });
    if (operation === "recordPayment") return json({ members: (await loadOwnerData(supabase, context)).members, analytics: await recordPayment(supabase, context, body) });
    if (operation === "listPlans" || operation === "createPlan" || operation === "updatePlan" || operation === "togglePlan") return json(await membershipPlans(supabase, context, operation === "listPlans" ? "list" : operation.replace("Plan", ""), body));
    if (operation === "listStaff" || operation === "inviteStaff" || operation === "revokeStaff") return json({ staff: await staffAccess(supabase, base44, context, operation.replace("Staff", "").replace("list", "list").replace("invite", "invite").replace("revoke", "revoke"), body) });
    if (operation === "listTrainers" || operation === "createTrainer" || operation === "updateTrainer" || operation === "toggleTrainer" || operation === "deleteTrainer") return json({ trainers: await trainers(supabase, context, operation.replace("Trainer", "").replace("list", "list").replace("create", "create").replace("update", "update").replace("toggle", "toggle").replace("delete", "delete"), body) });
    if (operation === "memberData" || operation === "createFeedback" || operation === "markNotificationRead") return json({ member: await memberPortal(supabase, context, operation === "memberData" ? "get" : operation === "createFeedback" ? "feedback" : "notificationRead", body) });

    return fail("Unknown operation", 400);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Request failed";
    const status = /unauthorized/i.test(message) ? 401 : /permission|access|owner can|already linked/i.test(message) ? 403 : 400;
    return fail(message, status);
  }
});
